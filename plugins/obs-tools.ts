import type { Plugin } from "@opencode-ai/plugin"
import { createOpencodeClient } from "@opencode-ai/sdk/v2"
import { gitStatus } from "../tools/git_status.ts"
import { gitDiffSummary } from "../tools/git_diff_summary.ts"
import { createSessionUsageTool } from "../tools/session_usage.ts"
import { createSessionContextTool } from "../tools/session_context.ts"

export default (async ({ serverUrl }) => {
  const client = createOpencodeClient({ baseUrl: serverUrl.toString() })
  return {
    tool: {
      git_status: gitStatus,
      git_diff_summary: gitDiffSummary,
      session_usage: createSessionUsageTool(client),
      session_context: createSessionContextTool(client),
    },
  }
}) satisfies Plugin