---
description: Estadísticas globales de uso de OpenCode (tokens, costo, herramientas, sesiones) vía el comando nativo `opencode stats`.
agent: build
---

Show OpenCode usage statistics across sessions using the native `opencode stats` CLI.

Run `opencode stats` from the terminal with the flags that match $ARGUMENTS:

- `--days N` — last N days (default all time).
- `--models` — show model breakdown.
- `--tools N` — top N tools (default all).
- `--project <name>` — filter by project; empty string means current project.

Then present the output, trimming the terminal-table format to the key numbers. Keep in mind:

- Cost totals come from what the provider reports; with `opencode/big-pickle` (OpenCode Zen) cost is usually $0.00 because the provider doesn't report it — say that instead of pretending it's free.
- If the user wants a breakdown by agent/model of the CURRENT session, that's `/usage` (custom tool `session_usage`).
- Never alter data: this is a read-only report.