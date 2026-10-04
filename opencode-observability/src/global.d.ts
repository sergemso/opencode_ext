import type { JSX as OpenTUIJSX } from "@opentui/solid"

declare global {
  namespace JSX {
    interface IntrinsicElements extends OpenTUIJSX.IntrinsicElements {}
  }
}