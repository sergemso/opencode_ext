import type { ProviderPricing, ModelInfo } from "../types"

const DEFAULT_PRICING: Record<string, ProviderPricing> = {
  anthropic: {
    input: 3.00,
    output: 15.00,
    cacheRead: 0.30,
    cacheWrite: 3.75,
  },
  "anthropic-claude": {
    input: 3.00,
    output: 15.00,
    cacheRead: 0.30,
    cacheWrite: 3.75,
  },
  openai: {
    input: 2.50,
    output: 10.00,
    cacheRead: 0.125,
    cacheWrite: 1.25,
  },
  "openai-gpt": {
    input: 2.50,
    output: 10.00,
    cacheRead: 0.125,
    cacheWrite: 1.25,
  },
  google: {
    input: 0.35,
    output: 1.05,
    cacheRead: 0.0875,
    cacheWrite: 0.175,
  },
  gemini: {
    input: 0.35,
    output: 1.05,
    cacheRead: 0.0875,
    cacheWrite: 0.175,
  },
  groq: {
    input: 0.27,
    output: 0.27,
  },
  deepseek: {
    input: 0.14,
    output: 0.28,
    cacheRead: 0.014,
    cacheWrite: 0.07,
  },
  mistral: {
    input: 0.25,
    output: 0.25,
  },
  cohere: {
    input: 0.50,
    output: 1.50,
  },
}

export function getProviderPricing(providerID: string, modelInfo?: ModelInfo): ProviderPricing {
  if (modelInfo?.cost) {
    return {
      input: modelInfo.cost.input ?? 0,
      output: modelInfo.cost.output ?? 0,
      cacheRead: modelInfo.cost.cacheRead,
      cacheWrite: modelInfo.cost.cacheWrite,
    }
  }

  const normalized = providerID.toLowerCase().replace(/[^a-z0-9-]/g, "-")
  return DEFAULT_PRICING[normalized] ?? DEFAULT_PRICING.anthropic!
}

export function calculateCacheSavings(
  cacheReadTokens: number,
  providerPricing: ProviderPricing
): number {
  const cacheReadPrice = providerPricing.cacheRead ?? providerPricing.input * 0.1
  const regularPrice = providerPricing.input
  const savingsPerToken = (regularPrice - cacheReadPrice) / 1_000_000
  return cacheReadTokens * savingsPerToken
}

export function calculateTurnCost(
  tokens: { input: number; output: number; cache: { read: number; write: number } },
  providerPricing: ProviderPricing
): number {
  const inputCost = (tokens.input - tokens.cache.read) * providerPricing.input / 1_000_000
  const cacheReadCost = tokens.cache.read * (providerPricing.cacheRead ?? providerPricing.input * 0.1) / 1_000_000
  const cacheWriteCost = tokens.cache.write * (providerPricing.cacheWrite ?? providerPricing.input * 1.25) / 1_000_000
  const outputCost = tokens.output * providerPricing.output / 1_000_000
  return inputCost + cacheReadCost + cacheWriteCost + outputCost
}