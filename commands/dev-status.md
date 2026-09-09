---
description: Dev cockpit — un vistazo de git status, quality gate y AI usage de la sesión en una sola tabla.
agent: build
---

Produce a compact development status report for the current session using the custom tools: `git_status`, `git_diff_summary` (only if there are changes), and `session_usage`.

Build a single dashboard like this:

```
DEVELOPMENT STATUS
────────────────────────────
Git
feat/usuarios        ↑2 · ~8 changed · +3 new

Quality
✓ tsc   ✓ eslint   ✓ tests (12)   ✓ build

AI Usage
Context  48% of window (est.)
Tokens   in 64k · out 5k
Cost     $0.21 (REAL) | not reported
```

Rules:

- Git: from `git_status` metadata/output. If not a git repo, state it and skip the git line.
- Quality: run a QUICK gate — only checks that finish in a few seconds (typecheck + lint). If the user wants the full gate, tell them to run `/verify`. Never run build here.
- Context: use `session_context`. If % of window isn't derivable, show tokens only and omit the percent.
- Usage: use `session_usage`. Respect REAL vs NOT REPORTED (big-pickle doesn't expose cost).
- Keep it to one screen. $ARGUMENTS can request more detail (e.g. "per agent").