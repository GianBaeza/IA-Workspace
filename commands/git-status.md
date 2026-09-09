---
description: Git status detallado (READ-ONLY) usando el custom tool git_status — branch, ahead/behind, staged/unstaged/untracked y último commit.
agent: build
---

Show the git status for the current project using the `git_status` custom tool.

- Call `git_status` with `target: "full"` by default.
- If $ARGUMENTS contains a keyword, map it: `branch` → only branch/tracking, `files` → file list focus, `last_commit` → last commit only.
- Present the tool's output as-is (it's already a table). Add 1-2 sentences of interpretation only if something needs attention (e.g. conflicts in progress, huge dirty set, no upstream).
- If the tool says "Not a git repository", say so and stop — do not run git yourself.
- READ-ONLY: never stage, commit, push, or otherwise modify git.