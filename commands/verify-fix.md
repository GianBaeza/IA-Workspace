---
description: Quality Gate con fixes seguros — igual que /verify pero permite autofix de lint/format. Nunca toca lógica, solo autofixes seguros. Pregunta antes de modificar.
agent: build
---

Same as /verify (Quality Gate), with one safe difference:

1. Run the full gate READ-ONLY first (typecheck, tests, build).
2. ONLY then, if the user asked for fixes ($ARGUMENTS contains "fix" or you confirm first), apply SAFE autofixes:
   - `eslint --fix` (only safe rules)
   - `prettier --write`
   - `tsc` never fixes; if typecheck fails, report exact locations and propose a plan — do NOT edit files to fix type errors without asking.
3. Re-run just the failed check to confirm the fix.
4. Report before/after and list every file you touched.

Never run `git` mutations, never modify tests to make them pass, and never apply fixes automatically without the user's explicit confirmation.