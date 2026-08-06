---
mode: agent
description: Write developer documentation for the most recent commit
---
Run this first so the dashboard shows this phase running:
`node scripts/agent-session.js mark dev-docs running`

Look at the git diff for the most recent commit (use #changes, or if that's empty, run
`git diff HEAD~1 HEAD` in the terminal).

Write a concise developer-facing changelog entry describing:
- What changed and in which files
- Why it likely changed (infer from the diff)
- Any implementation details other engineers should know

Append the entry, under a heading with today's date, to `docs/dev-log.md`
(create it with a top-level `# Developer Log` heading if it doesn't exist).
Do not rewrite existing entries.

When you're done writing the file, run this so the dashboard reflects it:
`node scripts/agent-session.js mark dev-docs complete "Dev docs written"`