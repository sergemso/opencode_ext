export function formatNumber(num: number, compact = true): string {
  if (num === 0) return "0"
  if (compact) {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`
    return num.toString()
  }
  return num.toLocaleString()
}

export function formatCost(cost: number): string {
  if (cost < 0.001) return `<$0.001`
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  if (cost < 1) return `$${cost.toFixed(3)}`
  return `$${cost.toFixed(2)}`
}

export function formatPercentage(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatTokens(tokens: number): string {
  return formatNumber(tokens, true)
}

export function getHitRateColor(rate: number): string {
  if (rate >= 0.8) return "green"
  if (rate >= 0.5) return "yellow"
  return "red"
}

export function getTTLColor(percentage: number): string {
  if (percentage < 50) return "green"
  if (percentage < 80) return "yellow"
  return "red"
}

export function getTrendIndicator(trend: "up" | "down" | "stable"): string {
  switch (trend) {
    case "up": return "↗"
    case "down": return "↘"
    default: return "–"
  }
}

export function getTrendColor(trend: "up" | "down" | "stable"): string {
  switch (trend) {
    case "up": return "green"
    case "down": return "red"
    default: return "gray"
  }
}

export function getWarmingStatusColor(status: "active" | "window" | "disabled" | "unknown"): string {
  switch (status) {
    case "active": return "green"
    case "window": return "yellow"
    case "disabled": return "gray"
    default: return "gray"
  }
}

export function getWarmingStatusLabel(status: "active" | "window" | "disabled" | "unknown"): string {
  switch (status) {
    case "active": return "● Active"
    case "window": return "● Window"
    case "disabled": return "○ Disabled"
    default: return "? Unknown"
  }
}