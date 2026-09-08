# ACTIVE TASK

```yaml
CONTROL_VERSION: 32
ACTIVE_WORK_PACKAGE: P3-WP002-R3
TASK_ID: P3-WP002-R3
PARENT_TASK: P3-WP002-R2
AUTHORIZATION_REVISION: P3-WP002-R3-FINAL-EVIDENCE-CORRECTIVE
TITLE: P3-WP002-R3 — TEST-ONLY + CONTROL-DOC Final Evidence Corrective
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: Project Owner
AUTHORIZE_EXECUTION: FALSE
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_REVIEW
PHASE_0: CLOSED / PASS
PHASE_1: CLOSED / PASS
PHASE_2: CLOSED / PASS
PHASE_3: IN PROGRESS
P3-WP001: CLOSED / PASS
P3-WP002-PRE1: COMPLETE / DEFINITION READY
P3-WP002: CORRECTIVE REQUIRED / AWAITING_R3_REVIEW
P3-WP002-R1: SOURCE CORRECTIVE COMPLETE / SUPERSEDED_BY_EVIDENCE_CORRECTIVES
P3-WP002-R2: CORRECTIVE REQUIRED / SUPERSEDED_BY_R3
P3-WP002-R3: READY_FOR_CHATGPT_REVIEW
P3-WP003: FUTURE / NOT AUTHORIZED
P3-WP002_BASELINE_HEAD: 7ca0a0dcde5896f18a8254f4a94a74a776d7a36e
P3-WP002_ORIGINAL_IMPLEMENTATION_HEAD: 956e576ffee2f194ce6e617531a58f336de2b280
P3-WP002_INITIAL_REVIEW_HEAD: 80a9f2dcafdb81e84f990e5593009091ab83bb4e
P3-WP002-R1_IMPLEMENTATION_HEAD: 03dd35a5d6b29c6394f93f16061bfaddb5f10174
P3-WP002-R2_EVIDENCE_HEAD: e9736490dde42d1b249e6fba3f9d63e929da909c
CODE_BASELINE_HEAD: e9736490dde42d1b249e6fba3f9d63e929da909c
IMPLEMENTATION_CANDIDATE_HEAD: 03dd35a5d6b29c6394f93f16061bfaddb5f10174
REVIEWED_IMPLEMENTATION_HEAD: 03dd35a5d6b29c6394f93f16061bfaddb5f10174
REVIEW_RESULT: SOURCE_PASS / R2_EVIDENCE_CORRECTIVE_REQUIRED
ACCEPTED_IMPLEMENTATION_HEAD: NONE
WORKER_VERSION: 28.16
REQUIRED_WORKER_VERSION: 28.16
RUNTIME_CONTRACT_VERSION: 2
```

## Current Control-Plane Decision

ChatGPT independent review of R2 at `e9736490dde42d1b249e6fba3f9d63e929da909c` found the production source and most R2 regression evidence acceptable, but R2 cannot close because the 7-day/30-day lower-bound tests were not exact deterministic boundaries and the completion control docs did not record the required execution evidence.

The Owner has authorized `P3-WP002-R3` as a narrow final evidence corrective. No production-source change is authorized.

## R3 Scope

During test correction modify only:

- `src/app.controller.spec.ts`

At successful completion also synchronize only:

- `project-docs/EXECUTION_GATE.md`
- `project-docs/ACTIVE_TASK.md`
- `project-docs/CHAT_HANDOFF.md`
- `project-docs/CURRENT_STATE.md`
- `project-docs/PROJECT_STATUS_ROADMAP.md`

Prohibited: `src/app.controller.ts`, `index.html`, `run/**`, entities, customer entity, runtime-version, Telegram, `package*.json`, schema/migrations/indexes, dependencies, and unrelated files.

## Required R3 Evidence

1. Freeze/fix the clock so actual production `handleFilters()` observes one deterministic `Date.now()` value.
2. 7-day proof: exactly fixed-now PASS; exactly fixed-now minus 7 days PASS; future FAIL; invalid FAIL.
3. 30-day proof: exactly fixed-now PASS; exactly fixed-now minus 30 days PASS; future FAIL; invalid FAIL.
4. Lower boundaries must be exact: no `+1ms`, `+1000ms`, `+5000ms`, or any inward offset.
5. Preserve all previously accepted R2 tests/evidence and UI regressions.
6. Tests must execute actual production code loaded from `index.html`; no copied filter logic, `.only`, `.skip`, or weakened assertions.

## Validation Contract

Run in the fresh R3 execution run:

```text
npm test -- --runInBand
npm run build
git diff --check
```

All must PASS.

Completion docs must record exact npm test result, suite count, test count, pass/fail/skipped counts when reported, build PASS, diff-check PASS, exact changed files, `LOCAL REPORTED` evidence classification, actual GitHub CI truth, final R3 SHA, and parent SHA.

## Progress

- Official accepted roadmap progress estimate: **~56%**
- Practical implementation progress estimate: **~61%**

Current blocker: **P3-WP002-R3 final TEST-ONLY evidence corrective**.

Lifecycle:

```text
CONTROL UPDATE
-> COMMIT/PUSH
-> STOP
-> FRESH NEW RUN/CHAT
-> execute P3-WP002-R3 only
-> validate
-> READY_FOR_CHATGPT_REVIEW
-> COMMIT/PUSH
-> STOP
-> ChatGPT independent review
```

`P3-WP003` remains FUTURE / NOT AUTHORIZED.

Historical accepted work and permanent safety invariants remain unchanged. True exactly-once physical LINE delivery is not guaranteed, and ambiguous physical sends must never be automatically resent.
