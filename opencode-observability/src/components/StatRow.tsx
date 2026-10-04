import { createSignal, createEffect, onCleanup, createMemo, splitProps } from "solid-js"

const SEMANTIC_COLORS = new Set([
  "success", "error", "warning", "info",
  "text", "textmuted", "text-muted",
  "border", "background", "backgroundpanel", "background-panel",
  "primary", "secondary", "accent", "muted"
])

function resolveColor(color: string, theme: any, fallback: string): string {
  if (!color) return fallback
  if (color.startsWith("#") || color.startsWith("rgb")) return color
  const lower = color.toLowerCase()
  if (SEMANTIC_COLORS.has(lower)) return theme?.[color] || fallback
  return theme?.[color] || color
}

export interface StatRowProps {
  label: string
  value: string
  trend?: "up" | "down" | "stable"
  color?: string
  children?: any
  theme?: any
}

export function StatRow(props: StatRowProps) {
  const [local, rest] = splitProps(props, ["label", "value", "trend", "color", "children", "theme"])
  const theme = local.theme || {}
  return (
    <box {...rest} flexShrink={0} gap={1} alignItems="center" justifyContent="center">
      <text fg={resolveColor("textMuted", theme, "#6c7086")} flexShrink={0}>{local.label}</text>
      <text fg={resolveColor(local.color || "text", theme, "#cdd6f4")} flexShrink={0}>{local.value}</text>
      {local.trend && (
        <text fg={local.trend === "up" ? resolveColor("success", theme, "#a6e3a1") : local.trend === "down" ? resolveColor("error", theme, "#f38ba8") : resolveColor("textMuted", theme, "#6c7086")}>
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
  theme?: any
}

export function CollapsibleSection(props: CollapsibleSectionProps) {
  const [local, rest] = splitProps(props, ["title", "expanded", "onToggle", "children", "badge", "badgeColor", "theme"])
  const theme = local.theme || {}
  const textColor = resolveColor(local.expanded ? "text" : "textMuted", theme, local.expanded ? "#cdd6f4" : "#6c7086")
  const badgeColor = resolveColor(local.badgeColor || "textMuted", theme, "#6c7086")
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
        <text fg={textColor}>
          {local.expanded ? "▼" : "▶"} {local.title}
        </text>
        {local.badge && (
          <text fg={badgeColor}>
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
  theme?: any
}

export function TTLBar(props: TTLBarProps) {
  const [local] = splitProps(props, ["percentage", "color", "width", "theme"])
  const theme = local.theme || {}
  const pct = Math.max(0, Math.min(100, local.percentage))
  const barColor = local.color || (pct < 50 ? "success" : pct < 80 ? "warning" : "error")
  const resolvedBarColor = resolveColor(barColor, theme, barColor)
  return (
    <box width={local.width || 20} height={1} backgroundColor={resolveColor("border", theme, "#313244")} flexShrink={0}>
      <box
        width={`${pct}%`}
        height={1}
        backgroundColor={resolvedBarColor}
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
  theme?: any
}

export function CountdownTimer(props: CountdownTimerProps) {
  const [local] = splitProps(props, ["ms", "format", "warningThreshold", "criticalThreshold", "theme"])
  const theme = local.theme || {}
  const [time, setTime] = createSignal(local.ms)
  const startTime = Date.now()
  const targetTime = startTime + local.ms

  createEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, targetTime - Date.now())
      setTime(remaining)
    }, 1000)
    onCleanup(() => clearInterval(interval))
  })

  const color = createMemo(() => {
    const t = time()
    if (t <= (local.criticalThreshold ?? 30_000)) return resolveColor("error", theme, "#f38ba8")
    if (t <= (local.warningThreshold ?? 60_000)) return resolveColor("warning", theme, "#fab387")
    return resolveColor("text", theme, "#cdd6f4")
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
