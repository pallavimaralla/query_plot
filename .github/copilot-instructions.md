# query_plot repo context

query_plot is a two-part app:
- `backend/` — Express + Node.js API (see `backend/src/controllers`, `backend/src/services`)
  that accepts CSV uploads, runs Python-based processing (`backend/python/sandbox_processor.py`),
  and calls an LLM to turn natural-language queries into charts.
- `frontend/` — React + TypeScript (Vite) UI (see `frontend/src/components`, `frontend/src/pages`)
  for uploading data, entering queries, and viewing generated charts.

When asked to document changes:
- Developer docs go in `docs/dev-log.md`
- User-facing docs go in `docs/user-log.md`
- Always append new entries under a dated heading; never delete or rewrite prior entries.
