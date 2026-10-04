import { describe, it, expect } from "vitest"
import { getProviderPricing, calculateCacheSavings, calculateTurnCost } from "@/utils/pricing"
import type { ProviderPricing } from "@/types"

describe("pricing utilities", () => {
  describe("getProviderPricing", () => {
    it("returns model-specific pricing when available", () => {
      const model: ModelInfo = {
        id: "claude-3-opus",
        providerID: "anthropic",
        cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
      }
      const pricing = getProviderPricing("anthropic", model)
      expect(pricing.input).toBe(15)
      expect(pricing.output).toBe(75)
      expect(pricing.cacheRead).toBe(1.5)
      expect(pricing.cacheWrite).toBe(18.75)
    })

    it("falls back to provider defaults", () => {
      const pricing = getProviderPricing("anthropic")
      expect(pricing.input).toBe(3.00)
      expect(pricing.output).toBe(15.00)
      expect(pricing.cacheRead).toBe(0.30)
      expect(pricing.cacheWrite).toBe(3.75)
    })

    it("falls back to anthropic for unknown provider", () => {
      const pricing = getProviderPricing("unknown-provider")
      expect(pricing.input).toBe(3.00)
      expect(pricing.output).toBe(15.00)
    })

    it("normalizes provider ID", () => {
      expect(getProviderPricing("Anthropic").input).toBe(3.00)
      expect(getProviderPricing("OPENAI").input).toBe(2.50)
      // Google-Gemini normalizes to "google-gemini" which doesn't match, falls back to anthropic
      expect(getProviderPricing("Google-Gemini").input).toBe(3.00)
    })
  })

  describe("calculateCacheSavings", () => {
    it("calculates savings correctly", () => {
      const pricing: ProviderPricing = { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 }
      const savings = calculateCacheSavings(1_000_000, pricing)
      // (3.00 - 0.30) * 1_000_000 / 1_000_000 = 2.70
      expect(savings).toBe(2.70)
    })

    it("uses 10% of input price when cacheRead not specified", () => {
      const pricing: ProviderPricing = { input: 10.00, output: 30.00 }
      const savings = calculateCacheSavings(500_000, pricing)
      // (10.00 - 1.00) * 500_000 / 1_000_000 = 4.50
      expect(savings).toBe(4.50)
    })

    it("returns 0 for 0 tokens", () => {
      const pricing: ProviderPricing = { input: 3.00, output: 15.00, cacheRead: 0.30 }
      expect(calculateCacheSavings(0, pricing)).toBe(0)
    })
  })

  describe("calculateTurnCost", () => {
    it("calculates total cost with cache breakdown", () => {
      const pricing: ProviderPricing = {
        input: 3.00,
        output: 15.00,
        cacheRead: 0.30,
        cacheWrite: 3.75,
      }
      const tokens = {
        input: 1000,
        output: 500,
        cache: { read: 200, write: 50 },
      }
      const cost = calculateTurnCost(tokens, pricing)
      // (1000-200)*3 + 200*0.30 + 50*3.75 + 500*15 all / 1_000_000
      // = 2400 + 60 + 187.5 + 7500 = 10147.5 / 1_000_000 = 0.0101475
      expect(cost).toBeCloseTo(0.0101475, 6)
    })

    it("handles missing cache prices", () => {
      const pricing: ProviderPricing = { input: 10.00, output: 30.00 }
      const tokens = { input: 1000, output: 500, cache: { read: 0, write: 0 } }
      const cost = calculateTurnCost(tokens, pricing)
      // 1000*10 + 500*30 = 25000 / 1_000_000 = 0.025
      expect(cost).toBe(0.025)
    })
  })
})