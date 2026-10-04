import { createComponent, createEffect, createMemo, createSignal, onCleanup } from "solid-js"
import { createCollector } from "./collector"
import { SidebarObservability } from "./components/SidebarObservability"
import type { PluginConfig, TUIPreferences } from "./types"

const DEFAULT_PREFERENCES: TUIPreferences = {
  order: 170,
  forceToTop: false,
  scope: "current",
  section: {
    enabled: true,
    collapsed: null,
    rememberCollapsed: true,
    label: "Observability",
  },
  rows: {
    warmingStatus: true,
    warmingCountdown: true,
    warmingConfig: true,
    warmingCost: true,
    cacheHitRate: true,
    cacheHitRateTrend: true,
    cacheBreakdown: true,
    cacheTTL: true,
    cacheSavings: true,
    perTurnDetail: false,
  },
}

function getInitialPreferences(kv: any): TUIPreferences {
  const stored = kv.get("observability-preferences", null)
  return stored ? { ...DEFAULT_PREFERENCES, ...stored } : DEFAULT_PREFERENCES
}

function getInitialCollapsed(kv: any): boolean {
  const stored = kv.get("observability-preferences", null)
  return stored?.section.collapsed ?? false
}

function getInitialUserConfig(kv: any): Partial<PluginConfig> {
  return kv.get("observability-config", null) || {}
}

export function SidebarHost(props: { sessionId: string; api: any; theme: any }) {
  const api = props.api
  const kv = api.kv

  const [preferences, setPreferences] = createSignal<TUIPreferences>(getInitialPreferences(kv))

  const [collapsed, setCollapsed] = createSignal<boolean>(getInitialCollapsed(kv))

  const [userConfig, setUserConfig] = createSignal<Partial<PluginConfig>>(getInitialUserConfig(kv))

  const collector = createMemo(() => {
    return createCollector(props.api, props.sessionId, userConfig())
  })

  createEffect(() => {
    const pref = preferences()
    if (pref.section.rememberCollapsed && pref.section.collapsed !== null) {
      setCollapsed(pref.section.collapsed)
    }
  })

  createEffect(() => {
    const c = collapsed()
    const pref = preferences()
    if (pref.section.rememberCollapsed && pref.section.collapsed !== c) {
      setPreferences(prev => ({ ...prev, section: { ...prev.section, collapsed: c } }))
      kv.set("observability-preferences", { ...pref, section: { ...pref.section, collapsed: c } })
    }
  })

  const toggleCollapse = () => {
    setCollapsed(c => !c)
  }

  return (
    <SidebarObservability
      state={collector().state}
      config={{ ...collector().config, ...userConfig() }}
      onToggleCollapse={toggleCollapse}
      collapsed={collapsed()}
      theme={props.theme}
    />
  )
}