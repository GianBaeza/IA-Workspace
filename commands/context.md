---
description: Context monitor de la sesión — tokens REALES (provider) + estimado de texto de usuario. No inventa desglose que OpenCode no expone.
agent: build
---

Report the active context usage for the current OpenCode session.

Use the `session_context` custom tool (defaults to the current session, or pass `sessionID` from $ARGUMENTS).

Present its output following these rules:

- Real/provider numbers (input, output, reasoning, cache read/write) are EXACT — label them.
- User-text token count is ESTIMATED (chars/4) — label it ESTIMATED and say so.
- Do NOT fabricate a breakdown by System / Agent / Skills / MCP / Tools / Files. If the tool says "NOT AVAILABLE", state it plainly and explain that OpenCode doesn't expose that per-section breakdown.
- If the session context has been compacted, mention that the numbers reflect the active window after the last compaction.

Keep output compact: a short table plus one accuracy note.