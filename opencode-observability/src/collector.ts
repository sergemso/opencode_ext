import { createEffect, createMemo, createSignal, onCleanup } from "solid-js"
import { parseDuration } from "./utils/duration"
import { getProviderPricing, calculateCacheSavings } from "./utils/pricing"
import { computeWarmingState, updateWarmingState } from "./utils/warming"
import type {
  ObservabilityState,
  WarmingState,
  CacheMetrics,
  CacheTokens,
  PerTurnCache,
  CacheTTL,
  PluginConfig,
  SessionInfo,
  AssistantMessage,
  ModelInfo,
  ProviderPricing,
  ProviderInfo,
} from "./types"

const DEFAULT_CONFIG: PluginConfig = {
  warming: {
    enabled: true,
    showStatus: true,
    showCountdown: true,
    showConfig: true,
    showCostEstimate: true,
    countdownFormat: "compact",
  },
  cache: {
    enabled: true,
    showHitRate: true,
    showHitRateTrend: true,
    showReadWriteBreakdown: true,
    showTTL: true,
    showSavings: true,
    showPerTurnDetail: false,
    rollingWindowTurns: 10,
    rollingWindowMs: 300_000,
  },
  display: {
    scope: "current",
    collapsed: false,
    rememberCollapsed: true,
    colorIndicators: true,
    compactMode: false,
  },
  runtime: {
    refreshIntervalMs: 1000,
    holdDurationMs: 0,
    enableLogging: false,
  },
}

export function aggregateTokens(messages: AssistantMessage[]): CacheTokens {
  let read = 0, write = 0, input = 0, output = 0, reasoning = 0
  for (const msg of messages) {
    read += msg.tokens.cache.read
    write += msg.tokens.cache.write
    input += msg.tokens.input
    output += msg.tokens.output
    reasoning += msg.tokens.reasoning
  }
  const miss = Math.max(0, input - read)
  const total = input + output + reasoning + read + write
  return { read, write, miss, input, output, total }
}

export function createCollector(
  api: {
    event: { on: (type: string, handler: (event: any) => void) => () => void }
    state: {
      session: {
        get: (id: string) => SessionInfo | undefined
        messages: (id: string) => AssistantMessage[] | undefined
        status: (id: string) => { type: string } | undefined
        family: (id: string) => string[]
      }
      provider: ProviderInfo[]
      config: { warming?: any }
    }
    client: {
      session: {
        get: (id: string) => Promise<SessionInfo | null>
      }
    }
  },
  sessionId: string,
  userConfig: Partial<PluginConfig> = {}
) {
  const config = { ...DEFAULT_CONFIG, ...userConfig } as PluginConfig

  const [warmingState, setWarmingState] = createSignal<WarmingState>(computeWarmingState(null, null))

  const [cacheMetrics, setCacheMetrics] = createSignal<CacheMetrics>({
    hitRate: 0,
    hitRateTrend: "stable",
    tokens: { read: 0, write: 0, miss: 0, input: 0, output: 0, total: 0 },
    ttl: null,
    savings: 0,
    perTurn: [],
  })

  const [lastActivityAt, setLastActivityAt] = createSignal<number | null>(null)
  const [warmingConfig, setWarmingConfig] = createSignal<any>(null)
  const [messageCache, setMessageCache] = createSignal<AssistantMessage[]>([])
  const [turnCounter, setTurnCounter] = createSignal(0)

  let refreshTimer: ReturnType<typeof setInterval> | null = null

  const getSession = () => api.state.session.get(sessionId)
  const getMessages = () => api.state.session.messages(sessionId) ?? []
  const getProviders = () => api.state.provider

  function computeCacheMetrics(messages: AssistantMessage[]): CacheMetrics {
    if (messages.length === 0) {
      return {
        hitRate: 0,
        hitRateTrend: "stable",
        tokens: { read: 0, write: 0, miss: 0, input: 0, output: 0, total: 0 },
        ttl: null,
        savings: 0,
        perTurn: [],
      }
    }

    const assistantMsgs = messages.filter(m => m.role === "assistant" && m.time.completed)
    if (assistantMsgs.length === 0) {
      return {
        hitRate: 0,
        hitRateTrend: "stable",
        tokens: { read: 0, write: 0, miss: 0, input: 0, output: 0, total: 0 },
        ttl: null,
        savings: 0,
        perTurn: [],
      }
    }

    const windowMs = config.cache.rollingWindowMs
    const windowTurns = config.cache.rollingWindowTurns
    const now = Date.now()
    const cutoff = now - windowMs

    const recentTurns = assistantMsgs
      .filter(m => m.time.completed && m.time.completed > cutoff)
      .slice(-windowTurns)

    if (recentTurns.length === 0) {
      const totals = aggregateTokens(assistantMsgs)
      const hitRate = totals.input > 0 ? totals.read / (totals.input + totals.write + totals.miss) : 0
      return {
        hitRate,
        hitRateTrend: "stable",
        tokens: totals,
        ttl: computeTTL(getSession(), getProviders()),
        savings: calculateCacheSavings(totals.read, getPricingForSession(getSession(), getProviders())),
        perTurn: [],
      }
    }

    const totals = aggregateTokens(recentTurns)
    const hitRate = totals.input > 0 ? totals.read / (totals.input + totals.write + totals.miss) : 0

    const prevTurns = assistantMsgs
      .filter(m => m.time.completed && m.time.completed <= cutoff)
      .slice(-windowTurns)
    const prevTotals = aggregateTokens(prevTurns)
    const prevHitRate = prevTotals.input > 0 ? prevTotals.read / (prevTotals.input + prevTotals.write + prevTotals.miss) : 0

    let trend: "up" | "down" | "stable" = "stable"
    if (hitRate > prevHitRate + 0.02) trend = "up"
    else if (hitRate < prevHitRate - 0.02) trend = "down"

    const perTurn: PerTurnCache[] = recentTurns.map((msg, idx) => ({
      turnIndex: idx,
      hitRate: msg.tokens.input > 0
        ? msg.tokens.cache.read / (msg.tokens.input + msg.tokens.cache.write + (msg.tokens.input - msg.tokens.cache.read))
        : 0,
      tokens: {
        read: msg.tokens.cache.read,
        write: msg.tokens.cache.write,
        miss: msg.tokens.input - msg.tokens.cache.read,
        input: msg.tokens.input,
        output: msg.tokens.output,
        total: msg.tokens.input + msg.tokens.output + msg.tokens.reasoning + msg.tokens.cache.read + msg.tokens.cache.write,
      },
      timestamp: msg.time.completed ?? msg.time.created,
      modelLineage: `${msg.providerID}/${msg.modelID}`,
    }))

    const pricing = getPricingForSession(getSession(), getProviders())
    const savings = calculateCacheSavings(totals.read, pricing)

    return {
      hitRate,
      hitRateTrend: trend,
      tokens: totals,
      ttl: computeTTL(getSession(), getProviders()),
      savings,
      perTurn,
    }
  }

  function getPricingForSession(session: SessionInfo | undefined, providers: ProviderInfo[]): ProviderPricing {
    if (!session?.modelID || !session?.providerID) {
      return getProviderPricing("anthropic")
    }
    const provider = providers.find(p => p.id === session.providerID)
    const model = provider?.models?.[session.modelID]
    return getProviderPricing(session.providerID, model)
  }

  function computeTTL(session: SessionInfo | undefined, providers: ProviderInfo[]): CacheTTL | null {
    if (!session?.modelID || !session?.providerID) return null

    const provider = providers.find(p => p.id === session.providerID)
    const model = provider?.models?.[session.modelID]
    if (!model) return null

    const ttlMs = model.cacheTTL ?? getDefaultTTL(session.providerID)
    if (!ttlMs) return null

    const messages = getMessages()
    let lastMsg: AssistantMessage | undefined
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]!
      if (m.role === "assistant" && m.time.completed) {
        lastMsg = m
        break
      }
    }
    const cacheWriteTime = lastMsg?.time.completed ?? lastMsg?.time.created
    if (!cacheWriteTime) return null

    const now = Date.now()
    const elapsed = now - cacheWriteTime
    const remaining = Math.max(0, ttlMs - elapsed)
    const percentage = ttlMs > 0 ? (elapsed / ttlMs) * 100 : 0

    return {
      provider: session.providerID,
      model: session.modelID,
      ttlMs,
      remainingMs: remaining,
      expiresAt: cacheWriteTime + ttlMs,
      percentage,
    }
  }

  function getDefaultTTL(providerID: string): number | null {
    const normalized = providerID.toLowerCase()
    if (normalized.includes("anthropic")) return 3_600_000
    if (normalized.includes("openai")) return 600_000
    if (normalized.includes("google") || normalized.includes("gemini")) return 3_600_000
    return null
  }

  function refreshWarming() {
    const session = getSession()
    const cfg = session?.warming ?? api.state.config.warming
    const newConfig = cfg ? {
      enabled: cfg === true || cfg.enabled === true,
      prompt: cfg.prompt ?? "Do not perform any work. Reply with exactly: OK",
      interval: cfg.interval ?? "4 minutes",
      duration: cfg.duration ?? "30 minutes",
    } : null

    if (newConfig && JSON.stringify(newConfig) !== JSON.stringify(warmingConfig())) {
      setWarmingConfig(newConfig)
    }

    const newState = computeWarmingState(newConfig, lastActivityAt())
    setWarmingState(newState)
  }

  let refreshCacheScheduled = false
  let lastRefreshCache = 0
  const MIN_REFRESH_INTERVAL = 500

  function scheduleRefreshCache() {
    const now = Date.now()
    if (now - lastRefreshCache >= MIN_REFRESH_INTERVAL) {
      doRefreshCache()
    } else if (!refreshCacheScheduled) {
      refreshCacheScheduled = true
      setTimeout(() => {
        refreshCacheScheduled = false
        doRefreshCache()
      }, MIN_REFRESH_INTERVAL - (now - lastRefreshCache))
    }
  }

  function doRefreshCache() {
    lastRefreshCache = Date.now()
    const messages = getMessages()
    const newMetrics = computeCacheMetrics(messages)
    setCacheMetrics(newMetrics)
    setMessageCache(messages)
    setTurnCounter(c => c + 1)
  }

  function refreshCache() {
    scheduleRefreshCache()
  }

  function handleSessionStatus(event: any) {
    if (event.properties?.sessionID !== sessionId) return
    const status = event.properties?.status
    if (!status) return

    if (status.type === "busy") {
      setLastActivityAt(Date.now())
      setWarmingState(current => updateWarmingState(current, "busy"))
    } else if (status.type === "idle") {
      setWarmingState(current => updateWarmingState(current, "idle"))
    }
  }

  function handleMessageUpdated(event: any) {
    if (event.properties?.info?.sessionID !== sessionId) return
    if (event.properties?.info?.role === "assistant") {
      console.log("[observability] message.updated for assistant", event.properties.info)
      refreshCache()
    }
  }

  function handlePartUpdated(event: any) {
    if (event.properties?.part?.sessionID !== sessionId) return
    const part = event.properties.part
    console.log("[observability] message.part.updated", part.type, part.tokens ? "has tokens" : "no tokens")
    if (part.type === "step-finish" && part.tokens) {
      refreshCache()
    }
  }

  createEffect(() => {
    console.log("[observability] Subscribing to events for session:", sessionId)
    const unsubStatus = api.event.on("session.status", handleSessionStatus)
    const unsubMsg = api.event.on("message.updated", handleMessageUpdated)
    const unsubPart = api.event.on("message.part.updated", handlePartUpdated)

    onCleanup(() => {
      console.log("[observability] Cleaning up event subscriptions")
      unsubStatus()
      unsubMsg()
      unsubPart()
    })
  })

  createEffect(() => {
    console.log("[observability] Initial refresh for session:", sessionId)
    refreshWarming()
    refreshCache()

    if (refreshTimer) clearInterval(refreshTimer)
    refreshTimer = setInterval(() => {
      refreshWarming()
    }, config.runtime.refreshIntervalMs)

    onCleanup(() => {
      if (refreshTimer) clearInterval(refreshTimer)
    })
  })

  const state = createMemo<ObservabilityState>(() => ({
    warming: warmingState(),
    cache: cacheMetrics(),
    sessionId,
    lastUpdated: Date.now(),
  }))

  return {
    state,
    refreshWarming,
    refreshCache,
    config,
  }
}