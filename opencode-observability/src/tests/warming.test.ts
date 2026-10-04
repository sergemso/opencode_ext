import { describe, it, expect, vi } from "vitest"
import { computeWarmingState, updateWarmingState } from "@/utils/warming"
import type { WarmingConfig, WarmingState } from "@/types"

describe("warming state machine", () => {
  const baseConfig: WarmingConfig = {
    enabled: true,
    prompt: "OK",
    interval: "4 minutes",
    duration: "30 minutes",
  }

  const now = 1_000_000_000_000

  describe("computeWarmingState", () => {
    it("returns disabled when config disabled", () => {
      const state = computeWarmingState({ ...baseConfig, enabled: false }, now - 1000, now)
      expect(state.enabled).toBe(false)
      expect(state.status).toBe("disabled")
      expect(state.countdownMs).toBe(0)
    })

    it("returns unknown when no last activity", () => {
      const state = computeWarmingState(baseConfig, null, now)
      expect(state.enabled).toBe(true)
      expect(state.status).toBe("unknown")
      expect(state.nextWarmingAt).toBeNull()
    })

    it("computes countdown correctly", () => {
      const lastActivity = now - 60_000 // 1 minute ago
      const state = computeWarmingState(baseConfig, lastActivity, now)
      // interval = 4 min = 240s, so next at lastActivity + 240s = now + 180s
      expect(state.nextWarmingAt).toBe(lastActivity + 240_000)
      expect(state.countdownMs).toBe(180_000)
      expect(state.status).toBe("window")
    })

    it("shows active when countdown expired but window open", () => {
      const lastActivity = now - 300_000 // 5 minutes ago (past 4 min interval)
      const state = computeWarmingState(baseConfig, lastActivity, now)
      expect(state.countdownMs).toBe(0)
      expect(state.status).toBe("active")
    })

    it("shows disabled when window expired", () => {
      const lastActivity = now - 2_000_000 // 33 minutes ago (past 30 min window)
      const state = computeWarmingState(baseConfig, lastActivity, now)
      expect(state.status).toBe("disabled")
    })

    it("handles invalid interval/duration", () => {
      const state = computeWarmingState(
        { ...baseConfig, interval: "invalid", duration: "invalid" },
        now,
        now
      )
      expect(state.status).toBe("unknown")
    })
  })

  describe("updateWarmingState", () => {
    it("updates on busy event", () => {
      const current: WarmingState = {
        enabled: true,
        status: "window",
        nextWarmingAt: now + 100_000,
        countdownMs: 100_000,
        windowExpiresAt: now + 500_000,
        lastActivityAt: now - 100_000,
        config: baseConfig,
        estimatedTokensPerWindow: 1000,
        estimatedCostPerWindow: 0.01,
      }

      const updated = updateWarmingState(current, "busy", now)
      expect(updated.lastActivityAt).toBe(now)
      expect(updated.nextWarmingAt).toBe(now + 240_000)
      expect(updated.windowExpiresAt).toBe(now + 1_800_000)
    })

    it("updates on idle event", () => {
      const current: WarmingState = {
        enabled: true,
        status: "active",
        nextWarmingAt: now,
        countdownMs: 0,
        windowExpiresAt: now + 1_500_000,
        lastActivityAt: now - 300_000,
        config: baseConfig,
        estimatedTokensPerWindow: 1000,
        estimatedCostPerWindow: 0.01,
      }

      const updated = updateWarmingState(current, "idle", now)
      expect(updated.nextWarmingAt).toBe(now - 300_000 + 240_000)
      expect(updated.windowExpiresAt).toBe(now - 300_000 + 1_800_000)
    })

    it("recomputes on config event", () => {
      const current: WarmingState = {
        enabled: true,
        status: "window",
        nextWarmingAt: now + 100_000,
        countdownMs: 100_000,
        windowExpiresAt: now + 500_000,
        lastActivityAt: now - 100_000,
        config: baseConfig,
        estimatedTokensPerWindow: 1000,
        estimatedCostPerWindow: 0.01,
      }

      const newConfig: WarmingConfig = { ...baseConfig, interval: "10 minutes", duration: "1 hour" }
      const updated = updateWarmingState({ ...current, config: newConfig }, "config", now)
      expect(updated.config).toEqual(newConfig)
    })
  })
})