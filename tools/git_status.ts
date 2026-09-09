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

function parseShortStat(line: string) {
  const m = line.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/)
  if (!m) return { files: 0, insertions: 0, deletions: 0 }
  return {
    files: parseInt(m[1], 10) || 0,
    insertions: parseInt(m[2] ?? "0", 10) || 0,
    deletions: parseInt(m[3] ?? "0", 10) || 0,
  }
}

export const gitStatus = tool({
  description:
    "READ-ONLY Git status snapshot for the current project. Shows branch, ahead/behind vs upstream and base branch, staged/unstaged/untracked file counts and list, and last commit. Never modifies git.",
  args: {
    target: z
      .enum(["branch", "files", "last_commit", "full"])
      .optional()
      .describe("Which section(s) to return. Defaults to full."),
  },
  async execute(args, ctx) {
    const cwd = ctx.worktree || ctx.directory
    const probe = git(["rev-parse", "--is-inside-work-tree"], cwd)
    if (!probe.ok) {
      return {
        title: "Git Status — not a repository",
        output: "Not a git repository.",
        metadata: { git: false },
      }
    }

    const out: string[] = []
    const bar = "─".repeat(28)

    const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], cwd).stdout || "(detached)"

    let ahead = 0
    let behind = 0
    let upstream = "(no upstream)"
    const up = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], cwd)
    const tracking = git(["rev-list", "--left-right", "--count", "@{upstream}...HEAD"], cwd)
    if (up.ok && tracking.ok) {
      upstream = up.stdout || "(no upstream)"
      const [l, r] = tracking.stdout.split(/\s+/).map((n) => parseInt(n, 10) || 0)
      ahead = r
      behind = l
    }

    out.push("GIT STATUS", bar)
    out.push(`Branch:      ${branch}`)
    out.push(`Tracking:    ↑ ${ahead} · ↓ ${behind}  (${upstream})`)

    let base = ""
    const headRef = git(["symbolic-ref", "-q", "refs/remotes/origin/HEAD"], cwd).stdout
    if (headRef) {
      base = headRef.replace("refs/remotes/origin/", "")
    } else {
      for (const candidate of ["main", "master"]) {
        if (git(["show-ref", "--verify", `--quiet`, `refs/heads/${candidate}`], cwd).ok) {
          base = candidate
          break
        }
      }
    }
    if (base && base !== branch) {
      const d = git(["rev-list", "--count", "--left-right", `${base}...HEAD`], cwd).stdout.split(/\s+/)
      const [bm, am] = d.map((n) => parseInt(n, 10) || 0)
      out.push(`Base:        ${base} · ⬆ ${am} commits adelante · ⬊ ${bm} commits detrás`)
    }

    const porcelain = git(["status", "--porcelain=v1", "-b"], cwd).stdout.split("\n").filter(Boolean)
    const statuses = porcelain.filter((ln) => !ln.startsWith("## "))
    const staged = statuses.filter((ln) => ln.length >= 2 && ln[0] !== " " && ln[0] !== "?").length
    const unstaged = statuses.filter((ln) => ln.length >= 2 && ["M", "D", "R", "C", "A", "T", "U", " "].includes(ln[1]) && ln[1] !== " ").length
    const untracked = statuses.filter((ln) => ln.startsWith("??")).length

    const stat = git(["diff", "--shortstat"], cwd)
    const u = parseShortStat(stat.stdout)
    const stagedStat = git(["diff", "--cached", "--shortstat"], cwd)
    const s = parseShortStat(stagedStat.stdout)

    out.push(bar, "Changes:")
    out.push(`  staged      ${s.files} files  (+${s.insertions} −${s.deletions})`)
    out.push(`  unstaged    ${u.files} files  (+${u.insertions} −${u.deletions})`)
    out.push(`  untracked   ${untracked} files`)

    if (args.target !== "branch" && args.target !== "last_commit") {
      const head = git(["log", "-1", "--format=%h %s"], cwd)
      out.push(bar, `Last commit:\n  ${head.stdout || "(no commits yet)"}`)

      if (args.target === "files" || args.target === "full") {
        const list = statuses.slice(0, 60)
        if (list.length) {
          out.push(bar, "Files:")
          if (statuses.length > 60) out.push(`  … and ${statuses.length - 60} more`)
          for (const ln of list) {
            const xy = ln.slice(0, 2)
            const path = ln.slice(3) || ln.slice(2)
            const mark =
              xy[0] === "?" ? "??" : xy[0] !== " " && xy[1] === " " ? `[${xy[0]}]` : `[${xy}`.replace("  ", " ")
            out.push(`  ${mark} ${path}`)
          }
        }
      }
    }

    return {
      title: "Git Status",
      output: out.join("\n"),
      metadata: {
        git: true,
        branch,
        upstream,
        ahead,
        behind,
        base: base || null,
        staged,
        unstaged: u.files,
        untracked,
        lastCommit: git(["rev-parse", "--short", "HEAD"], cwd).stdout || null,
      },
    }
  },
})