# OpenCode Development Tooling

Observability cockpit for OpenCode: git status, quality gate, performance, usage/cost and context monitoring — global, READ-ONLY-first, native where possible.

Scope: **global** (`~/.config/opencode/`). Every tool and command below works in ALL projects. Project-scoped extras would live in the repo's `.opencode/` (commands follow the same format; project overrides global).

---

## 1. What was installed / created

| Type | Name | Location | Purpose |
|---|---|---|---|
| Custom tool | `git_status` | `tools/git_status.ts` | READ-ONLY git snapshot: branch, ahead/behind, staged/unstaged/untracked, last commit |
| Custom tool | `git_diff_summary` | `tools/git_diff_summary.ts` | Per-file +/- stats for staged and/or unstaged diff |
| Custom tool | `session_usage` | `tools/session_usage.ts` | REAL token/cost usage of a session (per agent/model granularity) |
| Custom tool | `session_context` | `tools/session_context.ts` | Active context monitor: exact provider tokens + estimated user text |
| Plugin | `obs-tools` | `plugins/obs-tools.ts` | Registers the 4 custom tools (auto-discovered; no `opencode.json` change needed) |
| Command | `/git-status` | `commands/git-status.md` | Wrapper around `git_status` |
| Command | `/verify` | `commands/verify.md` | Quality gate: detects package manager + scripts, runs them READ-ONLY |
| Command | `/verify:fix` | `commands/verify-fix.md` | Same, plus SAFE autofixes (eslint --fix / prettier --write) — asks first |
| Command | `/performance` | `commands/performance.md` | Lighthouse audit + Core Web Vitals on a free port, cleans up after |
| Command | `/usage` | `commands/usage.md` | Current session token/cost |
| Command | `/stats` | `commands/stats.md` | Global stats via native `opencode stats` |
| Command | `/context` | `commands/context.md` | Current session context monitor |
| Command | `/dev-status` | `commands/dev-status.md` | One-screen cockpit: git + quick gate + usage |
| Config | permission rules | `opencode.json` | Defensive allow/deny for bash (see §5) |
| Dev dep | `@types/node` | `package.json` | Only for `tsc --noEmit` typechecking of the TS tools/plugins |

No new runtime dependencies. The tools run on opencode's embedded runtime; commands are native opencode markdown templates.

---

## 2. How to use

Restart opencode first (config/plugins load at startup).

| Command | What you get |
|---|---|
| `/git-status` | Branch, ↑/↓ vs upstream and base, counts and list of files, last commit |
| `/verify` | QUALITY GATE table (✓ READY / ✗ BLOCKED), each check with command + duration + first error |
| `/verify:fix` | Gate + auto-fix lint/format only (asked before) |
| `/performance` | Performance/A11y/Best practices/SEO + LCP, CLS, INP, FCP, TBT and actionable warnings |
| `/usage` | Session tokens (input/output/reasoning/cache) + cost if reported |
| `/stats` | Cross-session tokens/cost/tools — native `opencode stats` |
| `/context` | Active context: exact provider tokens + estimated user text; no invented breakdown |
| `/dev-status` | Cockpit dashboard (git + quick gate + AI usage) |

The custom tools (`git_status`, `git_diff_summary`, `session_usage`, `session_context`) are also callable directly by any agent — they are deterministic and cost 0 tokens.

Example:

```
/verify
QUALITY GATE
────────────────────────────
TypeScript     ✓ PASS   (pnpm exec tsc --noEmit)   1.2s
ESLint         ✓ PASS   (pnpm lint)                0.8s
Tests          ✗ FAIL   3.4s  1 failure
  src/user.test.ts:42  expect(x).toBe(2)
Build          ✓ PASS   (pnpm build)              15.1s

RESULT:
✗ BLOCKED
```

---

## 3. Global vs project

- **Global** (`~/.config/opencode/commands`, `plugins`, `tools`): everything here is reusable across projects. This is where observability belongs — it is not business logic.
- **Project** (`.opencode/` in a repo): add project-specific commands/rules when a repo needs its own gate. Same file format; project overrides global on load.
- To make a repo-local command, drop a `<name>.md` in `.opencode/command/` (or `.opencode/commands/`) and restart.

---

## 4. Why this shape

- **Native > plugin > custom**: usage/stats are covered by opencode's own `opencode stats`; custom tools were added only where opencode exposes no equivalent CLI but the SDK/DB has real data (session tools).
- **Custom tools for deterministic data**: git status and usage reports cost 0 tokens, are exact, and can't be "hallucinated" the way an LLM-rendered command can.
- **Commands for judgment work**: verify/performance need LLM to interpret output — but they are told to never write code.
- **REAL vs ESTIMATED discipline**: token/cost numbers come from provider usage stored per message. Nothing is estimated and presented as real. User-text token count is the only estimate and is labeled `ESTIMATED`.
- **No external dashboard installed**: `opencode stats` covers aggregates natively. If you later want a richer web dashboard, candidates (not installed):
  - `@lemantorus/opencode-analytics` — single CLI, reads `opencode.db`, local web UI (port 3456), model price estimation. Closest to zero-setup.
  - `opencode-dash` (npm) — Evidence.dev static report from the DB.
  - `GCS-ZHN/opencode-dashboard` — FastAPI server + web UI + optional MCP; more infra than needed for one machine.
  - Caveat: any of these compute cost estimates from models.dev pricing; opencode Zen (`opencode/big-pickle`) often reports no cost, so keep "estimated" labels.

---

## 5. Permissions (global `opencode.json`)

Added a `permission.bash` ruleset. Order matters (last matching rule wins; broad `"*": "ask"` first):

- **Allow** (fast path, no prompts): `git status`, `git diff`, `git log`, `git show`, `git rev-parse`, `git ls-files`, read-only `git branch`/`remote`/`config`, and the quality/perf commands (`pnpm lint/typecheck/test/build/dev/start`, `npm`, `yarn`, `bun` equivalents, `npx tsc/eslint/prettier --check/lighthouse`).
- **Ask** (default): everything else, including `git pull`, `git restore`, `git switch`, `git checkout`.
- **Deny**: `git commit`, `git push`, `git reset --hard`, `git clean`, `git rm`, `git rebase`, `rm -rf`, `rm -fr`, `sudo rm`.

Consequences: agents cannot commit/push/delete without you editing the rule or running the command yourself. This is deliberate (read-only-by-default). The custom tools bypass the bash permission because they never touch the bash tool — they are hardcoded read-only.

To lift a deny temporarily, delete the matching line from `permission.bash`, save, restart.

---

## 6. Security model

- Git: read-only. The custom tools pass `-C <worktree>` and never mutate.
- Quality gate: read-only; `/verify:fix` only safe autofixes and only after confirmation.
- Performance: starts/kills only its own server on a free port; traps cleanup.
- Database access for tools: none — session data is read through the opencode SDK (server-side), not direct SQLite.
- No credentials, API keys, or external services were added anywhere.

---

## 7. Limitations (honest)

- **Cost**: `opencode/big-pickle` (OpenCode Zen) does not report `cost` per message, so `$` is missing. That's a provider limitation, not ours. The footer plugin shows tokens only for the same reason.
- **Context breakdown**: opencode does not expose a per-section breakdown (System/Agent/Skills/MCP/Tools/Files). `session_context` shows exact provider tokens + estimated user text and explicitly flags the rest as unavailable — it will not invent numbers.
- **Context = active window**: `session_context` returns messages after the last compaction.
- **`/performance` depends on network/Chrome** the first time (`npx lighthouse`); if the environment lacks Chrome, it must tell you rather than silently skipping.
- **Permission audit**: the deny/allow list is broad; if a workflow of yours (e.g. SDD commit flow) gets blocked, adjust §5 rather than lowering the whole guard.

---

## 8. Uninstall

- Remove `plugins/obs-tools.ts` — tools disappear on next restart.
- Delete `tools/` — removes the tool sources.
- Delete any `commands/*.md` listed in §1 you don't want.
- Remove the `permission` block from `opencode.json`.
- Optionally drop `@types/node` from `package.json` (dev-only).

---

## 9. Add new metrics

- **Custom tool**: create `tools/<name>.ts` exporting a `tool({...})` from `@opencode-ai/plugin`, import it in `plugins/obs-tools.ts` under `tool`. Typecheck: `./node_modules/.bin/tsc --noEmit --strict --skipLibCheck --module esnext --moduleResolution bundler --target esnext --jsx preserve --allowImportingTsExtensions --lib es2022 tools/*.ts plugins/obs-tools.ts` (from `~/.config/opencode`).
- **Command**: add `commands/<name>.md` (frontmatter `description` + optional `agent`/`model`; body is the prompt, `$ARGUMENTS` = user input).
- **TUI/footer**: the `token-tracker` TUI plugin (sidebar footer) already shows last/total tokens; extend it there if you want more slots.

## 10. Verification checklist after install

1. Restart opencode.
2. `/git-status` in any git repo — table renders, no mutation.
3. `/verify` in a js/ts project — PASS/FAIL lines.
4. `/usage` and `/context` — token numbers match what the sidebar footer shows.
5. Try `git commit` via an agent — it must be denied.
6. `opencode stats --days 7` — still works from terminal.