import { parseDuration } from "./duration"
import type { WarmingConfig, WarmingState } from "../types"

export function computeWarmingState(
  config: WarmingConfig | null,
  lastActivityAt: number | null,
  now: number = Date.now()
): WarmingState {
  const defaultConfig: WarmingConfig = {
    enabled: false,
    prompt: "Do not perform any work. Reply with exactly: OK",
    interval: "4 minutes",
    duration: "30 minutes",
  }

  const cfg = config ?? defaultConfig

  if (!cfg.enabled) {
    return {
      enabled: false,
      status: "disabled",
      nextWarmingAt: null,
      countdownMs: 0,
      windowExpiresAt: null,
      lastActivityAt,
      config: cfg,
      estimatedTokensPerWindow: 0,
      estimatedCostPerWindow: 0,
    }
  }

  const intervalMs = parseDuration(cfg.interval)
  const durationMs = parseDuration(cfg.duration)

  if (intervalMs <= 0 || durationMs <= 0) {
    return {
      enabled: true,
      status: "unknown",
      nextWarmingAt: null,
      countdownMs: 0,
      windowExpiresAt: null,
      lastActivityAt,
      config: cfg,
      estimatedTokensPerWindow: 0,
      estimatedCostPerWindow: 0,
    }
  }

  if (!lastActivityAt) {
    return {
      enabled: true,
      status: "unknown",
      nextWarmingAt: null,
      countdownMs: 0,
      windowExpiresAt: null,
      lastActivityAt: null,
      config: cfg,
      estimatedTokensPerWindow: 0,
      estimatedCostPerWindow: 0,
    }
  }

  const nextWarmingAt = lastActivityAt + intervalMs
  const windowExpiresAt = lastActivityAt + durationMs
  const countdownMs = Math.max(0, nextWarmingAt - now)
  const windowActive = now < windowExpiresAt

  let status: WarmingState["status"] = "unknown"
  if (windowActive) {
    status = countdownMs <= 0 ? "active" : "window"
  } else {
    status = "disabled"
  }

  const estimatedRequestsPerWindow = Math.max(1, Math.floor(durationMs / intervalMs))
  const estimatedTokensPerRequest = 100
  const estimatedTokensPerWindow = estimatedRequestsPerWindow * estimatedTokensPerRequest
  const estimatedCostPerWindow = estimatedTokensPerWindow * 0.000015

  return {
    enabled: true,
    status,
    nextWarmingAt,
    countdownMs,
    windowExpiresAt,
    lastActivityAt,
    config: cfg,
    estimatedTokensPerWindow,
    estimatedCostPerWindow,
  }
}

export function updateWarmingState(
  current: WarmingState,
  eventType: "busy" | "idle" | "config",
  now: number = Date.now()
): WarmingState {
  if (eventType === "busy") {
    return {
      ...current,
      lastActivityAt: now,
      nextWarmingAt: current.config ? now + parseDuration(current.config.interval) : null,
      windowExpiresAt: current.config ? now + parseDuration(current.config.duration) : null,
    }
  }

  if (eventType === "idle" && current.lastActivityAt) {
    const nextWarmingAt = current.lastActivityAt + parseDuration(current.config?.interval ?? "4 minutes")
    const windowExpiresAt = current.lastActivityAt + parseDuration(current.config?.duration ?? "30 minutes")
    const countdownMs = Math.max(0, nextWarmingAt - now)
    const windowActive = now < windowExpiresAt

    let status: WarmingState["status"] = "unknown"
    if (windowActive) {
      status = countdownMs <= 0 ? "active" : "window"
    } else {
      status = "disabled"
    }

    return {
      ...current,
      nextWarmingAt,
      windowExpiresAt,
      countdownMs,
      status,
    }
  }

  if (eventType === "config") {
    return computeWarmingState(current.config, current.lastActivityAt, now)
  }

  return current
}