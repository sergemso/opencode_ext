export interface WarmingConfig {
  enabled: boolean
  prompt: string
  interval: string
  duration: string
}

export interface WarmingState {
  enabled: boolean
  status: "active" | "window" | "disabled" | "unknown"
  nextWarmingAt: number | null
  countdownMs: number
  windowExpiresAt: number | null
  lastActivityAt: number | null
  config: WarmingConfig | null
  estimatedTokensPerWindow: number
  estimatedCostPerWindow: number
}

export interface CacheTokens {
  read: number
  write: number
  miss: number
  input: number
  output: number
  total: number
}

export interface CacheMetrics {
  hitRate: number
  hitRateTrend: "up" | "down" | "stable"
  tokens: CacheTokens
  ttl: CacheTTL | null
  savings: number
  perTurn: PerTurnCache[]
}

export interface CacheTTL {
  provider: string
  model: string
  ttlMs: number
  remainingMs: number
  expiresAt: number
  percentage: number
}

export interface PerTurnCache {
  turnIndex: number
  hitRate: number
  tokens: CacheTokens
  timestamp: number
  modelLineage: string
}

export interface ObservabilityState {
  warming: WarmingState
  cache: CacheMetrics
  sessionId: string
  lastUpdated: number
}

export interface PluginConfig {
  warming: WarmingDisplayConfig
  cache: CacheDisplayConfig
  display: DisplayConfig
  runtime: RuntimeConfig
}

export interface WarmingDisplayConfig {
  enabled: boolean
  showStatus: boolean
  showCountdown: boolean
  showConfig: boolean
  showCostEstimate: boolean
  countdownFormat: "compact" | "verbose" | "ms"
}

export interface CacheDisplayConfig {
  enabled: boolean
  showHitRate: boolean
  showHitRateTrend: boolean
  showReadWriteBreakdown: boolean
  showTTL: boolean
  showSavings: boolean
  showPerTurnDetail: boolean
  rollingWindowTurns: number
  rollingWindowMs: number
}

export interface DisplayConfig {
  scope: "current" | "tree"
  collapsed: boolean
  rememberCollapsed: boolean
  colorIndicators: boolean
  compactMode: boolean
}

export interface RuntimeConfig {
  refreshIntervalMs: number
  holdDurationMs: number
  enableLogging: boolean
}

export interface TUIPreferences {
  order: number
  forceToTop: boolean
  scope: "current" | "tree"
  section: {
    enabled: boolean
    collapsed: boolean | null
    rememberCollapsed: boolean
    label: string
  }
  rows: {
    warmingStatus: boolean
    warmingCountdown: boolean
    warmingConfig: boolean
    warmingCost: boolean
    cacheHitRate: boolean
    cacheHitRateTrend: boolean
    cacheBreakdown: boolean
    cacheTTL: boolean
    cacheSavings: boolean
    perTurnDetail: boolean
  }
}

export interface ProviderPricing {
  input: number
  output: number
  cacheRead?: number
  cacheWrite?: number
}

export interface ModelInfo {
  id: string
  providerID: string
  variant?: string
  limit?: {
    context: number
  }
  cost?: ProviderPricing
  cacheTTL?: number
}

export interface ProviderInfo {
  id: string
  models: Record<string, ModelInfo>
}

export interface SessionInfo {
  id: string
  title: string
  parentID?: string
  warming?: WarmingConfig
  modelID?: string
  providerID?: string
}

export interface AssistantMessage {
  id: string
  sessionID: string
  role: "assistant"
  time: {
    created: number
    completed?: number
  }
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
  cost: number
  providerID: string
  modelID: string
  warming?: boolean
}

export type WarmingStatusType = "active" | "window" | "disabled" | "unknown"
export type HitRateTrend = "up" | "down" | "stable"
export type CountdownFormat = "compact" | "verbose" | "ms"
export type DisplayScope = "current" | "tree"