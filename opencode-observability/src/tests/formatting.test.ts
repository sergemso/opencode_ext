import { describe, it, expect } from "vitest"
import {
  formatNumber,
  formatCost,
  formatPercentage,
  formatTokens,
  getHitRateColor,
  getTTLColor,
  getTrendIndicator,
  getTrendColor,
  getWarmingStatusColor,
  getWarmingStatusLabel,
} from "@/utils/format"

describe("format utilities", () => {
  describe("formatNumber", () => {
    it("formats compact", () => {
      expect(formatNumber(0)).toBe("0")
      expect(formatNumber(500)).toBe("500")
      expect(formatNumber(1500)).toBe("1.5k")
      expect(formatNumber(1_500_000)).toBe("1.5M")
    })

    it("formats full when compact=false", () => {
      expect(formatNumber(1500, false)).toBe("1,500")
      expect(formatNumber(1_500_000, false)).toBe("1,500,000")
    })
  })

  describe("formatCost", () => {
    it("formats small costs", () => {
      expect(formatCost(0.0005)).toBe("<$0.001")
      expect(formatCost(0.005)).toBe("$0.0050")
    })

    it("formats medium costs", () => {
      expect(formatCost(0.05)).toBe("$0.050")
      expect(formatCost(0.5)).toBe("$0.500")
    })

    it("formats large costs", () => {
      expect(formatCost(1.5)).toBe("$1.50")
      expect(formatCost(100)).toBe("$100.00")
    })
  })

  describe("formatPercentage", () => {
    it("formats percentages", () => {
      expect(formatPercentage(0)).toBe("0%")
      expect(formatPercentage(0.5)).toBe("50%")
      expect(formatPercentage(0.73)).toBe("73%")
      expect(formatPercentage(1)).toBe("100%")
      expect(formatPercentage(0.7333, 1)).toBe("73.3%")
    })
  })

  describe("formatTokens", () => {
    it("delegates to formatNumber", () => {
      expect(formatTokens(1500)).toBe("1.5k")
      expect(formatTokens(1_500_000)).toBe("1.5M")
    })
  })

  describe("getHitRateColor", () => {
    it("returns colors based on rate", () => {
      expect(getHitRateColor(0.9)).toBe("green")
      expect(getHitRateColor(0.6)).toBe("yellow")
      expect(getHitRateColor(0.3)).toBe("red")
    })
  })

  describe("getTTLColor", () => {
    it("returns colors based on percentage", () => {
      expect(getTTLColor(30)).toBe("green")
      expect(getTTLColor(60)).toBe("yellow")
      expect(getTTLColor(90)).toBe("red")
    })
  })

  describe("getTrendIndicator", () => {
    it("returns correct indicators", () => {
      expect(getTrendIndicator("up")).toBe("↗")
      expect(getTrendIndicator("down")).toBe("↘")
      expect(getTrendIndicator("stable")).toBe("–")
    })
  })

  describe("getTrendColor", () => {
    it("returns correct colors", () => {
      expect(getTrendColor("up")).toBe("green")
      expect(getTrendColor("down")).toBe("red")
      expect(getTrendColor("stable")).toBe("gray")
    })
  })

  describe("getWarmingStatusColor", () => {
    it("returns correct colors", () => {
      expect(getWarmingStatusColor("active")).toBe("green")
      expect(getWarmingStatusColor("window")).toBe("yellow")
      expect(getWarmingStatusColor("disabled")).toBe("gray")
      expect(getWarmingStatusColor("unknown")).toBe("gray")
    })
  })

  describe("getWarmingStatusLabel", () => {
    it("returns correct labels", () => {
      expect(getWarmingStatusLabel("active")).toBe("● Active")
      expect(getWarmingStatusLabel("window")).toBe("● Window")
      expect(getWarmingStatusLabel("disabled")).toBe("○ Disabled")
      expect(getWarmingStatusLabel("unknown")).toBe("? Unknown")
    })
  })
})