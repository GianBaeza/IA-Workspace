import { tool } from "@opencode-ai/plugin"
import { createOpencodeClient, type SessionMessage } from "@opencode-ai/sdk/v2"

const z = tool.schema

type AssistantLike = Extract<SessionMessage, { type: "assistant" }>

function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.max(1, Math.round(text.length / 4))
}

export function createSessionContextTool(client: ReturnType<typeof createOpencodeClient>) {
  return tool({
    description:
      "READ-ONLY active context monitor for an OpenCode session: real provider tokens (assistant messages) plus estimated text tokens (user/system messages, chars/4). Marks each number EXACT or ESTIMATED. Never invented.",
    args: {
      sessionID: z.string().optional().describe("Session to inspect. Defaults to the current session."),
    },
    async execute(args, ctx) {
      const sessionID = args.sessionID ?? ctx.sessionID
      let body
      try {
        const res = await client.v2.session.context({ sessionID })
        body = res.data?.data
        if (!body) {
          return {
            title: "Session Context — no data",
            output: `No active context available for session ${sessionID.slice(0, 8)}…`,
            metadata: {},
          }
        }
      } catch (e) {
        return {
          title: "Session Context — error",
          output: `Failed to read session context: ${e instanceof Error ? e.message : String(e)}`,
          metadata: {},
        }
      }

      const real = { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0, cost: 0, costReported: false }
      let estimatedTextTokens = 0
      let userChars = 0
      let systemChars = 0
      let userMsgs = 0
      let systemMsgs = 0

      for (const m of body) {
        if (m.type === "assistant") {
          const t = (m as AssistantLike).tokens
          if (t) {
            real.input += t.input ?? 0
            real.output += t.output ?? 0
            real.reasoning += t.reasoning ?? 0
            real.cacheRead += t.cache?.read ?? 0
            real.cacheWrite += t.cache?.write ?? 0
          }
          if (typeof (m as AssistantLike).cost === "number" && (m as AssistantLike).cost! > 0) {
            real.cost += (m as AssistantLike).cost!
            real.costReported = true
          }
        } else if (m.type === "user") {
          userMsgs += 1
          userChars += m.text?.length ?? 0
          estimatedTextTokens += estimateTokens(m.text ?? "")
        }
      }

      const k = (n: number) => n.toLocaleString("en-US")
      const out: string[] = []

      out.push("SESSION CONTEXT (active, post-compaction)", "─".repeat(28))
      out.push(`Session:      ${sessionID.slice(0, 8)}…`)
      out.push(`User msgs:    ${userMsgs}  (${k(userChars)} chars)`)
      out.push(`System msgs:  ${systemMsgs}`)
      out.push("")
      out.push("REAL (provider usage, exact):")
      out.push(`  Input        ${k(real.input)}`)
      out.push(`  Output       ${k(real.output)}`)
      out.push(`  Reasoning    ${k(real.reasoning)}`)
      out.push(`  Cache read   ${k(real.cacheRead)}`)
      out.push(`  Cache write  ${k(real.cacheWrite)}`)
      const realTotal = real.input + real.output + real.reasoning + real.cacheRead + real.cacheWrite
      out.push(`  Subtotal     ${k(realTotal)}`)
      if (real.costReported) out.push(`  Cost         $${real.cost.toFixed(4)} (REAL)`)

      out.push("")
      out.push(`ESTIMATED (user text only, chars/4):  ${k(estimatedTextTokens)}`)

      const audit = {
        "input": "REAL — provider tokens on assistant messages",
        "output": "REAL — provider tokens on assistant messages",
        "reasoning": "REAL — provider tokens on assistant messages",
        "cache_read": "REAL — provider tokens on assistant messages",
        "cache_write": "REAL — provider tokens on assistant messages",
        "system_text": "no exacto — el endpoint no expone tokens de mensajes de sistema",
        "skills/mcp/tools/file breakdown": "NO DISPONIBLE — OpenCode no expone desglose por sistema/agente/skills/MCP/tools",
      }

      out.push("")
      out.push("Accuracy: input/output/reasoning/cache = exact (provider).", "User text = estimated. Everything else = not available.")

      return {
        title: "Session Context",
        output: out.join("\n"),
        metadata: {
          sessionID,
          real: { input: real.input, output: real.output, reasoning: real.reasoning, cacheRead: real.cacheRead, cacheWrite: real.cacheWrite, total: realTotal },
          cost: real.costReported ? real.cost : null,
          estimatedUserTextTokens: estimatedTextTokens,
          userMsgs,
          systemMsgs,
          accuracy: audit,
        },
      }
    },
  })
}