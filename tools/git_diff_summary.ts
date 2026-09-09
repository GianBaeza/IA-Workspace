import { tool } from "@opencode-ai/plugin"
import { spawnSync } from "node:child_process"

const z = tool.schema

function git(args: string[], cwd: string) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", timeout: 15000 })
  return {
    ok: r.status === 0,
    stdout: (r.stdout ?? "").replace(/\n+$/, ""),
    stderr: (r.stderr ?? "").replace(/\n+$/, ""),
    code: r.status ?? -1,
  }
}

export const gitDiffSummary = tool({
  description:
    "READ-ONLY Git diff summary for the current project. Shows per-file addition/deletion stats for staged and/or unstaged changes. Never modifies git.",
  args: {
    scope: z
      .enum(["all", "staged", "unstaged"])
      .optional()
      .describe("Which diff to summarize: staged (git diff --cached), unstaged (git diff), or both (default)."),
    lines: z
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .describe("Maximum number of per-file lines to show (default 50)."),
  },
  async execute(args, ctx) {
    const cwd = ctx.worktree || ctx.directory
    const probe = git(["rev-parse", "--is-inside-work-tree"], cwd)
    if (!probe.ok) {
      return {
        title: "Diff Summary — not a repository",
        output: "Not a git repository.",
        metadata: { git: false },
      }
    }

    const maxLines = args.lines ?? 50
    const scopes = args.scope === "all" ? ["staged", "unstaged"] : [args.scope ?? "all"]
    const out: string[] = []

    for (const scope of scopes) {
      if (scope === "all") continue
      const isStaged = scope === "staged"
      const stat = git(isStaged ? ["diff", "--cached", "--stat"] : ["diff", "--stat"], cwd)
      const numstat = git(isStaged ? ["diff", "--cached", "--numstat"] : ["diff", "--numstat"], cwd)

      const statTable = stat.stdout
        .split("\n")
        .filter((l) => l.trim() && !/^\s*$/.test(l))
        .slice(0, maxLines + 3)

      out.push(
        `${isStaged ? "STAGED" : "UNSTAGED"} DIFF`,
        "─".repeat(28),
        ...(statTable.length ? statTable.map((l) => `  ${l}`) : ["  (no changes)"]),
      )

      const rows = numstat.stdout
        .split("\n")
        .filter((l) => l.trim())
        .slice(0, maxLines)

      if (rows.length) {
        out.push("")
        for (const row of rows) {
          const [add, del, file] = row.split("\t")
          const a = add === "-" ? "?" : parseInt(add, 10) || 0
          const d = del === "-" ? "?" : parseInt(del, 10) || 0
          out.push(`  +${String(a).padStart(4)}  -${String(d).padStart(4)}  ${file}`)
        }
        if (numstat.stdout.split("\n").filter((l) => l.trim()).length > maxLines) {
          out.push(`  … and more files`)
        }
      }
      out.push("")
    }

    if (!out.length) out.push("No changes to report.")

    return {
      title: "Diff Summary",
      output: out.join("\n"),
      metadata: { git: true, scope: args.scope ?? "all" },
    }
  },
})