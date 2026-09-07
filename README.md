# AI Workspace — OpenCode Environment

A fully version-controlled OpenCode ecosystem: agents, skills, plugins, commands, and
persistent memory, all defined as plain text so the entire environment is reproducible
on any machine by cloning this repo to `~/.config/opencode/`.

This repository **is** the configuration directory. There is no build step — the files
here are what OpenCode loads at startup.

---

## What this is

A personal AI coding assistant stack built on [OpenCode](https://opencode.ai), designed
around three ideas:

1. **Specialists over generalists** — domain experts (frontend, backend, database, infra)
   that own quality rules for their stack.
2. **A router, not a god object** — an ORCHESTRATOR that classifies work and delegates,
   used only when it adds value.
3. **Persistent memory** — every session, decision, and bug fix is stored in Engram
   (SQLite + MCP), so context survives restarts, compactions, and machines.

## Repository layout

```
~/.config/opencode/
├── opencode.json            # Central config: model, MCP servers, registered agents
├── AGENTS.md                # Global behavior contract + Engram memory protocol
├── agents/                  # 16 agent definitions (two flavors, see below)
├── skills/                  # 69 skill directories (74 SKILL.md files)
├── plugins/                 # 6 plugins: memory, skill registry, SDD, TUI state
├── commands/                # 12 slash commands (SDD lifecycle, skill tooling)
├── profiles/                # OpenCode profiles (currently empty)
├── tui.json                 # TUI plugin loading
├── tui-plugins/             # Local TUI components (gentle-logo.tsx)
├── docs/                    # Guides (e.g. OmniRoute AI gateway usage)
├── package.json             # npm deps for plugins (tracked on purpose)
├── package-lock.json        # Lockfile (tracked on purpose)
└── .atl/                    # gentle-ai skill registry cache
```

## Components

### Central config — `opencode.json`

- Default model: `anthropic/claude-sonnet-4-6`
- `experimental.enableAgents` — turns on the agent system
- Two MCP servers:
  - **engram** — persistent memory backed by a local Go binary + SQLite
  - **context7** — up-to-date library/framework documentation
- Five registered agents, each wired to an instruction file with an **absolute path**
  (`~/.config/opencode/agents/*.md`) — this is why cloning to the exact same path
  makes everything work on a new machine.

### Agents — two flavors, one system

| Flavor | Format | How it's loaded | Examples |
|---|---|---|---|
| **Registered agents** | Plain markdown, wired in `opencode.json` | Always available in the agent list | ORCHESTRATOR, FRONTEND, BACKEND, DATABASE, INFRA |
| **Specialist subagents** | Frontmatter (`name`, `description`, `license`) | On demand, via the `Task` tool (`subagent_type`) | react-specialist, nextjs-specialist, express-specialist, django-specialist, angular-specialist, accessibility-specialist, ux-ui-specialist, bruno-specialist, frontend-specialist, backend-specialist |

There is also `BEST-PRACTICES-SYSTEM.md` — not an executable agent, but the *protocol*
document for how specialist agents store and retrieve technology-specific best practices
in Engram (topic keys like `react/best-practices`, `angular/best-practices`).

### Skills — 69 directories, 74 SKILL.md files

Each skill has frontmatter (`name`, `description`, `trigger keywords`) plus an instruction
body. OpenCode injects the `description` of every available skill into the system prompt;
an agent loads the full `SKILL.md` only when the task matches. Skills are grouped by
domain — flat (e.g. `react-19/`, `vitest/`) and nested (`frontend/react-best-practices/`,
`database/prisma-cli/`, `infra/cicd-patterns/`, `angular/architecture/`).

### Plugins — 6

| Plugin | Role |
|---|---|
| `engram.ts` | Memory adapter: session tracking, prompt capture, system-prompt injection of the memory protocol, compaction persistence, save nudges |
| `skill-registry.ts` | Refreshes the gentle-ai skill registry on startup |
| `model-variants.ts` | Caches per-model effort variants for gentle-ai |
| `herdr-agent-state.js` | Agent state reporting for herdr — **machine-managed, do not edit** |
| `opencode-review-transport.ts` | Transport relay between gentle-ai review agents |
| `sdd-task-result-artifacts.ts` | Validates SDD phase `<task_result>` envelopes |

### Commands — 12

The SDD lifecycle (`sdd-new`, `sdd-explore`, `sdd-propose`, `sdd-status`, `sdd-verify`,
`…`) plus skill tooling (`skill-creator`, `skill-registry`). These make spec-driven
development (feature proposal → spec → tasks → apply → verify → archive) a repeatable
workflow.

### Memory — Engram

Engram is the persistent brain: every session, prompt, tool call, bug fix, and decision
is recorded. The protocol (in `AGENTS.md` and injected by `plugins/engram.ts`) makes
saving **mandatory and proactive**: decisions, fixes, and discoveries are written to
memory without being asked.

---

## Why an ORCHESTRATOR exists but is not always used

The ORCHESTRATOR is the **router** of the system: it reads the request, detects the
domain(s), delegates to the right specialist(s), passes along Engram memory context,
and synthesizes the final answer when several domains are involved.

It is deliberately **not** the only way to work. The routing table in
`agents/ORCHESTRATOR.md` maps keywords to sub-agents, and `opencode.json` registers the
domain agents so they can be invoked directly. The decision of *who runs a task* comes
down to three cases:

| Situation | Who runs it | Why |
|---|---|---|
| **Single-domain, well-scoped task** (e.g. "fix this Prisma query", "build this button component") | The domain agent directly (FRONTEND / BACKEND / DATABASE / INFRA) | The specialist owns the quality rules for its stack, has the full context, and there is zero routing overhead. Adding the orchestrator here only adds a hop and dilutes context. |
| **Ambiguous, cross-domain, or fullstack task** (e.g. "add auth to the app", "build a feature end to end") | ORCHESTRATOR delegates and synthesizes | The orchestrator classifies the request, splits it into domains, passes Engram context to each specialist, and merges the results. This is where orchestration pays for itself. |
| **Deep specialization needed mid-task** (e.g. a React feature that also needs an a11y audit) | Task tool with a frontmatter specialist (`subagent_type`) | The frontmatter specialists are on-demand experts; the active agent delegates a focused slice to them and keeps the rest of the flow. |

The philosophy: **routing is a cost, not a ceremony.** You pay the orchestrator hop only
when the problem is genuinely multi-domain or the intent is unclear. When the domain is
obvious, the specialist goes straight to work.

## Setting up on a new machine

```bash
# 1. Install OpenCode
curl -fsSL https://opencode.ai/install | bash

# 2. Clone to the EXACT path (back up an existing ~/.config/opencode first)
git clone git@github.com:GianBaeza/IA-Workspace.git ~/.config/opencode

# 3. Install npm dependencies (plugins)
cd ~/.config/opencode && npm install

# 4. External binaries referenced by plugins/MCP:
#    - engram        (persistent memory server — `go install` or release binary)
#    - gentle-ai     (skill registry + review transport)
#    - context7      (MCP server, downloaded on demand via npx)
```

Absolute paths in `opencode.json` and agent files point at `~/.config/opencode/`, so
cloning to that location makes every agent, skill, and plugin resolve correctly.

## Version control conventions

- `.gitignore` excludes `node_modules`, `.env*` (with `!.env.example`), foreign lockfiles
  (`bun.lock`, `pnpm-lock.yaml`, `yarn.lock`), and OS noise.
- `package.json` and `package-lock.json` are **tracked** — dependencies are reinstalled
  with `npm install` on each machine, and the lockfile keeps versions reproducible.
- Conventional commits only (no AI attribution).
- No secrets in the repository — scan before committing.

## Contributing

- **New skill**: run `/skill-creator`, then `/skill-registry` to refresh the index.
- **New agent**: frontmatter format for on-demand specialists, or register in
  `opencode.json` for always-on agents.
- **New command**: SDD lifecycle commands live in `commands/`.
- Push after changes so the repo stays the source of truth; other machines `git pull`.