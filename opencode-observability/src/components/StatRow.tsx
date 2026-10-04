import { createSignal, createEffect, onCleanup, createMemo, splitProps } from "solid-js"

export interface StatRowProps {
  label: string
  value: string
  trend?: "up" | "down" | "stable"
  color?: string
  children?: any
}

export function StatRow(props: StatRowProps) {
  const [local, rest] = splitProps(props, ["label", "value", "trend", "color", "children"])
  return (
    <box {...rest} flexShrink={0} gap={1} alignItems="center" justifyContent="center">
      <text fg="textMuted" flexShrink={0}>{local.label}</text>
      <text fg={local.color || "text"} flexShrink={0}>{local.value}</text>
      {local.trend && (
        <text fg={local.trend === "up" ? "success" : local.trend === "down" ? "error" : "textMuted"}>
          {local.trend === "up" ? "↗" : local.trend === "down" ? "↘" : "–"}
        </text>
      )}
      {local.children}
    </box>
  )
}

export interface CollapsibleSectionProps {
  title: string
  expanded: boolean
  onToggle: () => void
  children: any
  badge?: string
  badgeColor?: string
}

export function CollapsibleSection(props: CollapsibleSectionProps) {
  const [local, rest] = splitProps(props, ["title", "expanded", "onToggle", "children", "badge", "badgeColor"])
  return (
    <box {...rest} flexShrink={0} gap={1}>
      <box
        onMouseDown={local.onToggle}
        flexShrink={0}
        gap={1}
        alignItems="center"
        justifyContent="center"
        paddingBottom={1}
      >
        <text fg={local.expanded ? "text" : "textMuted"}>
          {local.expanded ? "▼" : "▶"} {local.title}
        </text>
        {local.badge && (
          <text fg={local.badgeColor || "textMuted"}>
            {local.badge}
          </text>
        )}
      </box>
      {local.expanded && (
        <box flexShrink={0} gap={1} paddingLeft={2}>
          {local.children}
        </box>
      )}
    </box>
  )
}

export interface TTLBarProps {
  percentage: number
  color?: string
  width?: number
}

export function TTLBar(props: TTLBarProps) {
  const [local] = splitProps(props, ["percentage", "color", "width"])
  const pct = Math.max(0, Math.min(100, local.percentage))
  const barColor = local.color || (pct < 50 ? "success" : pct < 80 ? "warning" : "error")
  return (
    <box width={local.width || 20} height={1} backgroundColor="border" flexShrink={0}>
      <box
        width={`${pct}%`}
        height={1}
        backgroundColor={barColor}
        flexShrink={0}
      />
    </box>
  )
}

export interface CountdownTimerProps {
  ms: number
  format?: "compact" | "verbose" | "ms"
  warningThreshold?: number
  criticalThreshold?: number
}

export function CountdownTimer(props: CountdownTimerProps) {
  const [local] = splitProps(props, ["ms", "format", "warningThreshold", "criticalThreshold"])
  const [time, setTime] = createSignal(local.ms)

  createEffect(() => {
    const interval = setInterval(() => {
      setTime(Math.max(0, local.ms - (Date.now() - (Date.now() - local.ms))))
    }, 1000)
    onCleanup(() => clearInterval(interval))
  })

  const color = createMemo(() => {
    if (time() <= (local.criticalThreshold ?? 30_000)) return "error"
    if (time() <= (local.warningThreshold ?? 60_000)) return "warning"
    return "text"
  })

  return (
    <text fg={color()}>
      {formatCountdown(time(), local.format || "compact")}
    </text>
  )
}

function formatCountdown(ms: number, format: "compact" | "verbose" | "ms"): string {
  if (format === "ms") return `${ms}ms`
  if (ms <= 0) return "now"
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (format === "verbose") {
    const parts: string[] = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`)
    if (seconds % 60 > 0) parts.push(`${seconds % 60}s`)
    return parts.join(" ") || "0s"
  }
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}