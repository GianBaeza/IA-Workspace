import { tool } from "@opencode-ai/plugin"
import { createOpencodeClient, type AssistantMessage } from "@opencode-ai/sdk/v2"

const z = tool.schema

export function createSessionUsageTool(client: ReturnType<typeof createOpencodeClient>) {
  return tool({
    description:
      "READ-ONLY token and cost usage for an OpenCode session. Aggregates REAL usage reported by the provider (input, output, reasoning, cache read/write per request, and cost when the provider reports it). Never presents estimates as real cost.",
    args: {
      sessionID: z.string().optional().describe("Session to inspect. Defaults to the current session."),
      breakdown: z
        .enum(["total", "per_agent", "per_request", "full"])
        .optional()
        .describe("Granularity of the report. Defaults to full."),
    },
    async execute(args, ctx) {
      const sessionID = args.sessionID ?? ctx.sessionID
      let data
      try {
        const res = await client.session.messages({ sessionID })
        data = res.data
        if (!data) {
          return {
            title: "Session Usage — no data",
            output: `No messages found or session not reachable: ${res.error ? JSON.stringify(res.error) : sessionID}`,
            metadata: {},
          }
        }
      } catch (e) {
        return {
          title: "Session Usage — error",
          output: `Failed to read session messages: ${e instanceof Error ? e.message : String(e)}`,
          metadata: {},
        }
      }

      const msgs = data
        .map((m) => m.info)
        .filter((m): m is AssistantMessage => m.role === "assistant" && Boolean((m as AssistantMessage).tokens))

      const sum = {
        input: 0,
        output: 0,
        reasoning: 0,
        cacheRead: 0,
        cacheWrite: 0,
        cost: 0,
        requests: 0,
        costReported: false,
      }

      const perAgent = new Map<string, { in: number; out: number; reqs: number; cost: number; costReported: boolean }>()

      for (const m of msgs) {
        const t = m.tokens
        sum.input += t.input ?? 0
        sum.output += t.output ?? 0
        sum.reasoning += t.reasoning ?? 0
        sum.cacheRead += t.cache?.read ?? 0
        sum.cacheWrite += t.cache?.write ?? 0
        if (typeof m.cost === "number" && m.cost > 0) {
          sum.cost += m.cost
          sum.costReported = true
        }
        sum.requests += t.input > 0 ? 1 : 0

        const key = (m.agent || "unknown") + ":" + (m.modelID || "?")
        const row = perAgent.get(key) ?? { in: 0, out: 0, reqs: 0, cost: 0, costReported: false }
        row.in += t.input ?? 0
        row.out += t.output ?? 0
        if (t.input > 0) row.reqs += 1
        if (typeof m.cost === "number" && m.cost > 0) {
          row.cost += m.cost
          row.costReported = true
        }
        perAgent.set(key, row)
      }

      const k = (n: number) => n.toLocaleString("en-US")
      const money = (n: number) => `$${n.toFixed(4)}`
      const out: string[] = []

      out.push("SESSION USAGE", "─".repeat(28))
      out.push(`Session:  ${sessionID.slice(0, 8)}…`)
      out.push(`Requests: ${sum.requests}`)
      out.push("")
      out.push("Tokens (REAL, from provider usage):")
      out.push(`  Input        ${k(sum.input)}`)
      out.push(`  Output       ${k(sum.output)}`)
      out.push(`  Reasoning    ${k(sum.reasoning)}`)
      out.push(`  Cache read   ${k(sum.cacheRead)}`)
      out.push(`  Cache write  ${k(sum.cacheWrite)}`)
      out.push(`  TOTAL        ${k(sum.input + sum.output + sum.reasoning + sum.cacheRead + sum.cacheWrite)}`)

      if (sum.costReported) {
        out.push("", `Cost (REAL):  ${money(sum.cost)}`)
      } else {
        out.push(
          "",
          "Cost: NOT REPORTED by provider (opencode/big-pickle no expone costo).",
          "El token-tracker del footer muestra solo tokens por lo mismo.",
        )
      }

      if (args.breakdown === "per_agent" || args.breakdown === "full") {
        out.push("", "By agent/model:")
        out.push("  Agent/model".padEnd(46) + "In".padStart(10) + "Out".padStart(10) + "Reqs".padStart(6) + " Cost".padStart(12))
        for (const [key, row] of perAgent) {
          const cost = row.costReported ? money(row.cost) : "n/a"
          out.push(`  ${key.slice(0, 44).padEnd(44)}${k(row.in).padStart(10)}${k(row.out).padStart(10)}${String(row.reqs).padStart(6)}${cost.padStart(12)}`)
        }
      }

      return {
        title: "Session Usage",
        output: out.join("\n"),
        metadata: {
          sessionID,
          requests: sum.requests,
          tokens: { input: sum.input, output: sum.output, reasoning: sum.reasoning, cacheRead: sum.cacheRead, cacheWrite: sum.cacheWrite },
          cost: sum.costReported ? sum.cost : null,
          costReported: sum.costReported,
          breakdown: args.breakdown ?? "full",
        },
      }
    },
  })
}