const UNIT_MS: Record<string, number> = {
  ms: 1,
  millisecond: 1,
  milliseconds: 1,
  s: 1000,
  sec: 1000,
  second: 1000,
  seconds: 1000,
  m: 60_000,
  min: 60_000,
  minute: 60_000,
  minutes: 60_000,
  h: 3_600_000,
  hour: 3_600_000,
  hours: 3_600_000,
  d: 86_400_000,
  day: 86_400_000,
  days: 86_400_000,
}

export function parseDuration(input: string): number {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return 0

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/)
  if (!match) {
    const num = Number(trimmed)
    return isNaN(num) ? 0 : num
  }

  const value = Number(match[1])
  const unit = match[2]
  if (!unit) return 0
  const multiplier = UNIT_MS[unit] ?? UNIT_MS[unit.replace(/s$/, "")]

  if (!multiplier) return 0

  return Math.round(value * multiplier)
}

export function formatDuration(ms: number, format: "compact" | "verbose" = "compact"): string {
  if (ms <= 0) return "0s"

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (format === "verbose") {
    const parts: string[] = []
    if (days > 0) parts.push(`${days}d`)
    if (hours % 24 > 0) parts.push(`${hours % 24}h`)
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`)
    if (seconds % 60 > 0) parts.push(`${seconds % 60}s`)
    return parts.join(" ") || "0s"
  }

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export function formatCountdown(ms: number, format: "compact" | "verbose" | "ms" = "compact"): string {
  if (format === "ms") return `${ms}ms`
  if (ms <= 0) return "now"
  return formatDuration(ms, format)
}