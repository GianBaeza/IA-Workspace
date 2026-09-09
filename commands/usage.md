---
description: AI usage de la sesión — tokens (input/output/reasoning/cache) y costo REAL si el provider lo reporta. Lego en el custom tool session_usage.
agent: build
---

Report AI usage for the current OpenCode session.

Use the `session_usage` custom tool (defaults to the current session). If you want per-agent breakdown use `breakdown: "per_agent"`, or pass a specific `sessionID` from $ARGUMENTS.

Then present the result cleanly. Follow these rules:

- Treat the numbers from the tool as GROUND TRUTH: they come from message usage the provider reported.
- Distinct clearly:
  - REAL USAGE (tokens/dollar from provider) — label it REAL.
  - ESTIMATED — never show an estimate as cost.
- If cost shows "NOT REPORTED", say in one line that big-pickle (OpenCode Zen) doesn't expose cost, so only tokens are visible, and don't invent a price.
- Add how this session compares to the model's context limit only if you can derive it from the model definition; otherwise omit.

Keep the response short: one table with the totals and, if relevant, the per-agent rows.

For GLOBAL / historical usage across sessions, tell the user to run `/stats` (native `opencode stats`). This command is scoped to the current session.