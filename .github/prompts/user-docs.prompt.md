---
mode: agent
description: Write user-facing documentation for the most recent commit
---
Look at the git diff for the most recent commit (use #changes, or if that's empty, run
`git diff HEAD~1 HEAD` in the terminal).

Write a short, plain-language entry describing what changed from the perspective of someone
USING the query_plot app — new features, fixed bugs, changed behavior. If the change is purely
internal (refactor, no user-visible effect), write "No user-facing changes" instead.

Append the entry, under a heading with today's date, to `docs/user-log.md`
(create it with a top-level `# User Changelog` heading if it doesn't exist).
Do not rewrite existing entries.