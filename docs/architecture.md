# FormuLab architecture

## Phase 1 — product prototype
React/Vite UI supports intro, overview, virtual lab configuration, illustrative blend shortlist, data schema explorer, ingredient profile catalogue and session-only experiment log. The Python model is not connected. Express health endpoint is runnable; domain endpoints return explicit 501 placeholders.

## Phase 2 — data and API
1. Import and profile each CSV separately.
2. Build dataset summary and condition-level records in Node/MongoDB or a controlled file service.
3. Add request validation and recommendation service.
4. Train/evaluate Python baseline using group-aware splits; save model artifacts and metrics.
5. Node calls Python over HTTP, applies candidate filtering and ranks with traceable evidence.
6. Add MongoDB persistence for experiment runs.

## Phase 3 — virtual lab conversation
Only after the deterministic workflow is reliable, add Bedrock chat with structured tool calls. Chat should explain evidence and suggest questions; it must not fabricate measured results.
