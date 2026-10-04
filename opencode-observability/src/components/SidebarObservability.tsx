import { createMemo, splitProps } from "solid-js"
import type { ObservabilityState, PluginConfig } from "../types"
import { CollapsibleSection, StatRow, TTLBar, CountdownTimer } from "./StatRow"
import { formatNumber, formatCost, formatPercentage, getHitRateColor, getWarmingStatusColor, getWarmingStatusLabel } from "../utils/format"

const SEMANTIC_COLORS = new Set([
  "success", "error", "warning", "info",
  "text", "textmuted", "text-muted",
  "border", "background", "backgroundpanel", "background-panel",
  "primary", "secondary", "accent", "muted"
])

function resolveColor(theme: any, key: string, fallback: string): string {
  const val = theme?.[key]
  if (!val) return fallback
  if (val.startsWith("#") || val.startsWith("rgb")) return val
  const lower = key.toLowerCase()
  if (SEMANTIC_COLORS.has(lower)) return val
  return val
}

export interface SidebarObservabilityProps {
  state: () => ObservabilityState
  config: PluginConfig
  onToggleCollapse: () => void
  collapsed: boolean
  theme: any
}

export function SidebarObservability(props: SidebarObservabilityProps) {
  const [local] = splitProps(props, ["state", "config", "onToggleCollapse", "collapsed", "theme"])

  const warming = createMemo(() => local.state().warming)
  const cache = createMemo(() => local.state().cache)
  const config = local.config
  const theme = local.theme

  const bgPanel = resolveColor(theme, "backgroundPanel", "#1e1e2e")
  const textColor = resolveColor(theme, "text", "#cdd6f4")
  const textMuted = resolveColor(theme, "textMuted", "#6c7086")
  const borderColor = resolveColor(theme, "border", "#313244")

  return (
    <box
      backgroundColor={bgPanel}
      width={42}
      height="100%"
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
      gap={1}
    >
      <box flexShrink={0} gap={1} alignItems="center" justifyContent="center" onMouseDown={local.onToggleCollapse}>
        <text fg={textColor}>
          {local.collapsed ? "▶" : "▼"} Observability
        </text>
      </box>

      {!local.collapsed && (
        <>
          {config.warming.enabled && warming().enabled && (
            <CollapsibleSection
              title="Warming"
              expanded={true}
              onToggle={() => {}}
              badge={getWarmingStatusLabel(warming().status)}
              badgeColor={getWarmingStatusColor(warming().status)}
              theme={theme}
            >
              {config.warming.showStatus && (
                <StatRow
                  label="Status"
                  value={getWarmingStatusLabel(warming().status)}
                  color={getWarmingStatusColor(warming().status)}
                  theme={theme}
                />
              )}
              {config.warming.showCountdown && warming().countdownMs > 0 && (
                <StatRow
                  label="Next"
                  value=""
                  theme={theme}
                  children={
                    <CountdownTimer
                      ms={warming().countdownMs}
                      format={config.warming.countdownFormat}
                      warningThreshold={60_000}
                      criticalThreshold={30_000}
                      theme={theme}
                    />
                  }
                />
              )}
              {config.warming.showConfig && warming().config && (
                <>
                  <StatRow
                    label="Interval"
                    value={warming().config!.interval}
                    theme={theme}
                  />
                  <StatRow
                    label="Duration"
                    value={warming().config!.duration}
                    theme={theme}
                  />
                </>
              )}
              {config.warming.showCostEstimate && (
                <StatRow
                  label="Est. Cost/Window"
                  value={formatCost(warming().estimatedCostPerWindow)}
                  theme={theme}
                  children={<text fg={textMuted}> ~{formatNumber(warming().estimatedTokensPerWindow)} tok</text>}
                />
              )}
            </CollapsibleSection>
          )}

          {config.cache.enabled && (
            <CollapsibleSection
              title="Cache Metrics"
              expanded={true}
              onToggle={() => {}}
              badge={formatPercentage(cache().hitRate)}
              badgeColor={getHitRateColor(cache().hitRate)}
              theme={theme}
            >
              {config.cache.showHitRate && (
                <StatRow
                  label="Hit Rate"
                  value={formatPercentage(cache().hitRate, 1)}
                  color={getHitRateColor(cache().hitRate)}
                  trend={cache().hitRateTrend}
                  theme={theme}
                />
              )}
              {config.cache.showReadWriteBreakdown && (
                <StatRow
                  label="Read / Write / Miss"
                  value={`${formatNumber(cache().tokens.read)} / ${formatNumber(cache().tokens.write)} / ${formatNumber(cache().tokens.miss)}`}
                  theme={theme}
                />
              )}
              {config.cache.showTTL && cache().ttl && (
                <>
                  <StatRow
                    label="TTL"
                    value={`${formatNumber(cache().ttl!.ttlMs / 60_000)}m`}
                    theme={theme}
                    children={
                      <TTLBar
                        percentage={cache().ttl!.percentage}
                        width={30}
                        theme={theme}
                      />
                    }
                  />
                  <StatRow
                    label="Remaining"
                    value={`${formatNumber(cache().ttl!.remainingMs / 60_000)}m`}
                    theme={theme}
                  />
                </>
              )}
              {config.cache.showSavings && (
                <StatRow
                  label="Savings"
                  value={formatCost(cache().savings)}
                  color={resolveColor(theme, "success", "#a6e3a1")}
                  theme={theme}
                />
              )}
              {config.cache.showPerTurnDetail && cache().perTurn.length > 0 && (
                <box flexShrink={0} gap={1} paddingTop={1}>
                  <text fg={textMuted}>Recent Turns:</text>
                  {cache().perTurn.slice(-5).map((turn) => (
                    <box flexShrink={0} gap={1}>
                      <text fg={textMuted}>#{turn.turnIndex}</text>
                      <text fg={getHitRateColor(turn.hitRate)}>{formatPercentage(turn.hitRate, 0)}</text>
                      <text fg={textMuted}>{formatNumber(turn.tokens.read)}↓ {formatNumber(turn.tokens.output)}↑</text>
                      <text fg={textMuted}>{turn.modelLineage}</text>
                    </box>
                  ))}
                </box>
              )}
            </CollapsibleSection>
          )}

          {!config.warming.enabled && !warming().enabled && !config.cache.enabled && (
            <text fg={textMuted} textAlign="center" paddingTop={4}>
              No observability data available
            </text>
          )}
        </>
      )}
    </box>
  )
}
