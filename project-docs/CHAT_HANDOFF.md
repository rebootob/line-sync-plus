# CHAT HANDOFF

## Repository

- Repository: `rebootob/line-sync-plus`
- Canonical Branch: `main`
- Current control version: `32`
- Control-update parent HEAD: `e9736490dde42d1b249e6fba3f9d63e929da909c`
- Worker Version: `28.16`
- Required Worker Version: `28.16`
- Runtime Contract Version: `2`

## Role Model

- Project Owner = final human authority
- ChatGPT = Control Plane / Project Lead / Architect / Independent Reviewer
- Antigravity = bounded Execution Plane only
- Repository truth is authoritative

## Current Project State

- PHASE_0: `CLOSED / PASS`
- PHASE_1: `CLOSED / PASS`
- PHASE_2: `CLOSED / PASS`
- PHASE_3: `IN PROGRESS`
- P3-WP001: `CLOSED / PASS`
- P3-WP002-PRE1: `COMPLETE / DEFINITION READY`
- P3-WP002: `CORRECTIVE REQUIRED / R3 AUTHORIZED`
- P3-WP002-R1: `SOURCE CORRECTIVE COMPLETE / SUPERSEDED_BY_EVIDENCE_CORRECTIVES`
- P3-WP002-R2: `CORRECTIVE REQUIRED / SUPERSEDED_BY_R3`
- P3-WP002-R3: `CORRECTIVE_AUTHORIZED`
- ACTIVE_WORK_PACKAGE: `P3-WP002-R3`
- AUTHORIZE_EXECUTION: `TRUE`
- NEXT_CANDIDATE: `NONE`
- NEXT_CANDIDATE_STATUS: `AWAITING_EXECUTION`
- P3-WP003: `FUTURE / NOT AUTHORIZED`

## Head / Review Truth

- P3-WP002 original implementation: `956e576ffee2f194ce6e617531a58f336de2b280`
- P3-WP002-R1 reviewed production implementation: `03dd35a5d6b29c6394f93f16061bfaddb5f10174`
- P3-WP002-R2 evidence HEAD: `e9736490dde42d1b249e6fba3f9d63e929da909c`
- CODE_BASELINE_HEAD for R3: `e9736490dde42d1b249e6fba3f9d63e929da909c`
- IMPLEMENTATION_CANDIDATE_HEAD: `03dd35a5d6b29c6394f93f16061bfaddb5f10174`
- REVIEWED_IMPLEMENTATION_HEAD: `03dd35a5d6b29c6394f93f16061bfaddb5f10174`
- REVIEW_RESULT: `SOURCE_PASS / R2_EVIDENCE_CORRECTIVE_REQUIRED`
- ACCEPTED_IMPLEMENTATION_HEAD: `NONE`

R2/R3 test-evidence commits must never be treated as production implementation HEADs.

## Why R3 Exists

Independent review of R2 accepted source/architecture, DB aggregation, query-scope, no-N+1, repository-usage, DTO isolation, malicious-status safe DOM, NEVER_SUCCESS semantics, and scope control.

R2 still failed evidence closure because:

1. 7-day boundary used `now - 7d + 5000ms`, not exact `now - 7d`.
2. 30-day boundary used `now - 30d + 5000ms`, not exact `now - 30d`.
3. Clock was not fixed/frozen while production `handleFilters()` calls `Date.now()`.
4. Completion docs did not record exact test/build/diff-check results and retained stale pre-execution wording.

No production corrective is required or authorized.

## R3 Authorized Scope

May modify only `src/app.controller.spec.ts` during test correction, then the five control docs at successful completion:

- `project-docs/EXECUTION_GATE.md`
- `project-docs/ACTIVE_TASK.md`
- `project-docs/CHAT_HANDOFF.md`
- `project-docs/CURRENT_STATE.md`
- `project-docs/PROJECT_STATUS_ROADMAP.md`

Do not modify `src/app.controller.ts`, `index.html`, `run/**`, entities, customer entity, runtime-version, Telegram, package files, schema/migrations/indexes, dependencies, or unrelated files.

## R3 Required Evidence

- fixed deterministic clock seen by actual production frontend code
- exactly fixed-now PASS
- exactly fixed-now minus 7 days PASS
- future FAIL
- invalid FAIL
- exactly fixed-now minus 30 days PASS
- no inward boundary offset of any size
- preserve all accepted R2 evidence and blocked-checkbox / selectedUsers / stale-OA-response regressions
- actual production code only; no copied filter logic, `.only`, `.skip`, or weakened assertions

Required validation:

```text
npm test -- --runInBand
npm run build
git diff --check
```

At completion record exact test suite/test counts and pass/fail/skipped counts when reported, build PASS, diff-check PASS, exact changed files, evidence classification `LOCAL REPORTED`, actual GitHub CI truth, final R3 SHA and parent SHA.

## Progress

- Official accepted roadmap progress estimate: **~56%**
- Practical implementation progress estimate: **~61%**

Current blocker: `P3-WP002-R3 final TEST-ONLY evidence corrective`.

## Next Lifecycle

```text
THIS CONTROL UPDATE
-> COMMIT/PUSH
-> STOP
-> FRESH NEW RUN/CHAT
-> fresh-fetch main
-> read AGENT_START_HERE.md
-> read EXECUTION_GATE.md
-> execute P3-WP002-R3 only
-> full validation
-> completion evidence sync
-> READY_FOR_CHATGPT_REVIEW
-> COMMIT/PUSH
-> STOP
-> ChatGPT independent review
```

Do not auto-start P3-WP003.

Permanent safety truth remains unchanged: physical exactly-once LINE delivery is not guaranteed and ambiguous physical sends must never be automatically resent.
