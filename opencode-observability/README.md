# @sergemso/opencode-observability

Per-session sidebar plugin for OpenCode TUI — warming status, cache hit rate, token breakdown, TTL, and cost savings.

## Features

- **Warming Observability**
  - Enabled/disabled status with color indicator
  - Live countdown to next warming request
  - Current configuration (interval, duration, prompt)
  - Estimated token/cost impact per warming window

- **Cache Metrics**
  - Hit/miss ratio with trend indicator (↗/↘/–)
  - Cache read vs write vs miss token breakdown
  - Provider-specific cache TTL with visual progress bar
  - Estimated cost savings from cache hits

- **Per-session isolation** — Shows data only for your active session
- **Collapsible sections** — Expand/collapse warming and cache panels
- **Configurable** — Toggle individual metrics, adjust refresh rate, change display scope
- **Coexists** with `opencode-metrics`, `opencode-cache-hit`, `opencode-cache-stats`

## Installation

```bash
# Via OpenCode command palette (Ctrl+P)
opencode plugin @sergemso/opencode-observability --global

# Or manually add to ~/.config/opencode/tui.jsonc
{
  "plugin": ["@sergemso/opencode-observability"]
}
```

Open a **new TUI window** after installation (plugins load at TUI startup).

## Configuration

### Plugin Config (`~/.config/opencode/observability.json`)

```jsonc
{
  "$schema": "https://opencode.ai/plugin-config.json",
  "warming": {
    "enabled": true,
    "showStatus": true,
    "showCountdown": true,
    "showConfig": true,
    "showCostEstimate": true,
    "countdownFormat": "compact"
  },
  "cache": {
    "enabled": true,
    "showHitRate": true,
    "showHitRateTrend": true,
    "showReadWriteBreakdown": true,
    "showTTL": true,
    "showSavings": true,
    "showPerTurnDetail": false,
    "rollingWindowTurns": 10,
    "rollingWindowMs": 300000
  },
  "display": {
    "scope": "current",
    "collapsed": false,
    "rememberCollapsed": true,
    "colorIndicators": true,
    "compactMode": false
  },
  "runtime": {
    "refreshIntervalMs": 1000,
    "holdDurationMs": 0,
    "enableLogging": false
  }
}
```

### TUI Preferences (`~/.config/opencode/tui-preferences.jsonc`)

```jsonc
{
  "opencode-observability": {
    "order": 170,
    "forceToTop": false,
    "scope": "current",
    "section": {
      "enabled": true,
      "collapsed": null,
      "rememberCollapsed": true,
      "label": "Observability"
    },
    "rows": {
      "warmingStatus": true,
      "warmingCountdown": true,
      "warmingConfig": true,
      "warmingCost": true,
      "cacheHitRate": true,
      "cacheHitRateTrend": true,
      "cacheBreakdown": true,
      "cacheTTL": true,
      "cacheSavings": true,
      "perTurnDetail": false
    }
  }
}
```

## Display

```
┌─────────────────────────────────────┐
│ ▼ Observability                      │
├─────────────────────────────────────┤
│ ▼ Warming                    ● Active│
│   Status: ● Active (30m window)     │
│   Next: 2m 34s                      │
│   Config: 4m interval, 30m duration │
│   Est. cost: 1.2k tok / $0.003/window│
├─────────────────────────────────────┤
│ ▼ Cache Metrics                 73% ↗│
│   Hit Rate: 73% ↗                   │
│   Read: 45.2k  Write: 12.1k  Miss: 8.3k │
│   TTL: 1h  Remaining: 42m  ████░░   │
│   Savings: $0.12 this session       │
└─────────────────────────────────────┘
```

## How It Works

### Warming Data
Since OpenCode's warming feature doesn't emit dedicated events, this plugin:
1. Reads warming config from session/project settings
2. Tracks `session.status` events (busy→idle transitions) to detect activity
3. Computes countdown client-side: `lastActivity + interval - now`
4. Estimates cost based on interval × duration × model pricing

### Cache Metrics
Subscribes to OpenCode's event bus:
- `message.part.updated` (step-finish) — per-turn token breakdown
- `message.updated` — final assistant message totals
- `session.status` — turn boundaries

Aggregates cache read/write/miss tokens, computes hit rate with rolling window trend, looks up provider TTL and pricing for savings estimation.

## Requirements

- OpenCode ≥ 1.18 (TUI plugin slots `@opencode-ai/plugin` ≥ 1.14)
- Node.js ≥ 20

## Development

```bash
npm install
npm run dev        # Watch mode
npm run build      # Production build
npm run test       # Run tests
npm run typecheck  # TypeScript check
```

## Local Development

Point to local build in `~/.config/opencode/tui.jsonc`:

```jsonc
{
  "plugin": ["file:///absolute/path/to/opencode-observability/src/plugin.tsx"]
}
```

The TUI preferences key remains `opencode-observability` (without scope):

Restart OpenCode TUI after changes.

## License

MIT