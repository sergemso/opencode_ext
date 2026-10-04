import { describe, it, expect, vi, beforeEach } from "vitest"
import { parseDuration, formatDuration, formatCountdown } from "@/utils/duration"

describe("duration utilities", () => {
  describe("parseDuration", () => {
    it("parses minutes", () => {
      expect(parseDuration("4 minutes")).toBe(240_000)
      expect(parseDuration("5 min")).toBe(300_000)
      expect(parseDuration("1m")).toBe(60_000)
    })

    it("parses hours", () => {
      expect(parseDuration("1 hour")).toBe(3_600_000)
      expect(parseDuration("2h")).toBe(7_200_000)
    })

    it("parses seconds", () => {
      expect(parseDuration("30 seconds")).toBe(30_000)
      expect(parseDuration("45s")).toBe(45_000)
    })

    it("parses days", () => {
      expect(parseDuration("1 day")).toBe(86_400_000)
      expect(parseDuration("2d")).toBe(172_800_000)
    })

    it("handles decimals", () => {
      expect(parseDuration("1.5 minutes")).toBe(90_000)
      expect(parseDuration("0.5 hours")).toBe(1_800_000)
    })

    it("returns 0 for invalid input", () => {
      expect(parseDuration("")).toBe(0)
      expect(parseDuration("invalid")).toBe(0)
      expect(parseDuration("5 foo")).toBe(0)
    })
  })

  describe("formatDuration", () => {
    it("formats compact", () => {
      expect(formatDuration(90_000, "compact")).toBe("1m 30s")
      expect(formatDuration(3_600_000, "compact")).toBe("1h 0m")
      expect(formatDuration(90_000_000, "compact")).toBe("1d 1h")
    })

    it("formats verbose", () => {
      expect(formatDuration(90_000, "verbose")).toBe("1m 30s")
      expect(formatDuration(3_660_000, "verbose")).toBe("1h 1m")
      expect(formatDuration(90_000_000, "verbose")).toBe("1d 1h")
    })
  })

  describe("formatCountdown", () => {
    it("formats ms", () => {
      expect(formatCountdown(5000, "ms")).toBe("5000ms")
    })

    it("formats compact", () => {
      expect(formatCountdown(90_000, "compact")).toBe("1m 30s")
      expect(formatCountdown(0, "compact")).toBe("now")
    })

    it("formats verbose", () => {
      expect(formatCountdown(90_000, "verbose")).toBe("1m 30s")
    })
  })
})