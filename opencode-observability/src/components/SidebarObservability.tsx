import { createMemo, splitProps } from "solid-js"
import type { ObservabilityState, PluginConfig } from "../types"
import { CollapsibleSection, StatRow, TTLBar, CountdownTimer } from "./StatRow"
import { formatNumber, formatCost, formatPercentage, getHitRateColor, getWarmingStatusColor, getWarmingStatusLabel } from "../utils/format"

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

  return (
    <box
      backgroundColor={theme.backgroundPanel}
      width={42}
      height="100%"
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
      gap={1}
    >
      <box flexShrink={0} gap={1} alignItems="center" justifyContent="center" onMouseDown={local.onToggleCollapse}>
        <text fg={theme.text}>
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
            >
              {config.warming.showStatus && (
                <StatRow
                  label="Status"
                  value={getWarmingStatusLabel(warming().status)}
                  color={getWarmingStatusColor(warming().status)}
                />
              )}
              {config.warming.showCountdown && warming().countdownMs > 0 && (
                <StatRow
                  label="Next"
                  value=""
                  children={
                    <CountdownTimer
                      ms={warming().countdownMs}
                      format={config.warming.countdownFormat}
                      warningThreshold={60_000}
                      criticalThreshold={30_000}
                    />
                  }
                />
              )}
              {config.warming.showConfig && warming().config && (
                <>
                  <StatRow
                    label="Interval"
                    value={warming().config!.interval}
                  />
                  <StatRow
                    label="Duration"
                    value={warming().config!.duration}
                  />
                </>
              )}
              {config.warming.showCostEstimate && (
                <StatRow
                  label="Est. Cost/Window"
                  value={formatCost(warming().estimatedCostPerWindow)}
                  children={<text fg={theme.textMuted}> ~{formatNumber(warming().estimatedTokensPerWindow)} tok</text>}
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
            >
              {config.cache.showHitRate && (
                <StatRow
                  label="Hit Rate"
                  value={formatPercentage(cache().hitRate, 1)}
                  color={getHitRateColor(cache().hitRate)}
                  trend={cache().hitRateTrend}
                />
              )}
              {config.cache.showReadWriteBreakdown && (
                <StatRow
                  label="Read / Write / Miss"
                  value={`${formatNumber(cache().tokens.read)} / ${formatNumber(cache().tokens.write)} / ${formatNumber(cache().tokens.miss)}`}
                />
              )}
              {config.cache.showTTL && cache().ttl && (
                <>
                  <StatRow
                    label="TTL"
                    value={`${formatNumber(cache().ttl!.ttlMs / 60_000)}m`}
                    children={
                      <TTLBar
                        percentage={cache().ttl!.percentage}
                        width={30}
                      />
                    }
                  />
                  <StatRow
                    label="Remaining"
                    value={`${formatNumber(cache().ttl!.remainingMs / 60_000)}m`}
                  />
                </>
              )}
              {config.cache.showSavings && (
                <StatRow
                  label="Savings"
                  value={formatCost(cache().savings)}
                  color="success"
                />
              )}
              {config.cache.showPerTurnDetail && cache().perTurn.length > 0 && (
                <box flexShrink={0} gap={1} paddingTop={1}>
                  <text fg={theme.textMuted}>Recent Turns:</text>
                  {cache().perTurn.slice(-5).map((turn, idx) => (
                    <box flexShrink={0} gap={1}>
                      <text fg={theme.textMuted}>#{turn.turnIndex}</text>
                      <text fg={getHitRateColor(turn.hitRate)}>{formatPercentage(turn.hitRate, 0)}</text>
                      <text fg={theme.textMuted}>{formatNumber(turn.tokens.read)}↓ {formatNumber(turn.tokens.output)}↑</text>
                      <text fg={theme.textMuted}>{turn.modelLineage}</text>
                    </box>
                  ))}
                </box>
              )}
            </CollapsibleSection>
          )}

          {!config.warming.enabled && !warming().enabled && !config.cache.enabled && (
            <text fg={theme.textMuted} textAlign="center" paddingTop={4}>
              No observability data available
            </text>
          )}
        </>
      )}
    </box>
  )
}