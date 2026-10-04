import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.tsx",
    tui: "src/plugin.tsx"
  },
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ["solid-js", "@opencode-ai/plugin", "@opentui/solid", "@opentui/core"],
  noExternal: [],
  esbuildOptions(options) {
    options.jsx = "automatic"
    options.jsxImportSource = "solid-js"
  }
})