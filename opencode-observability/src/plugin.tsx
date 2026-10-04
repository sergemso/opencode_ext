/** @jsxImportSource @opentui/solid */
import { createComponent } from "solid-js"
import { SidebarHost } from "./sidebar-host"

const tui = async (api: any) => {
  api.slots.register({
    slots: {
      sidebar_content: (ctx: any, props: { session_id: string }) => {
        return <SidebarHost sessionId={props.session_id} api={api} theme={ctx.theme} />
      },
    },
  })
}

const plugin = {
  id: "opencode-observability",
  tui,
}

export default plugin