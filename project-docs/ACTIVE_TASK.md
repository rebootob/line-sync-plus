# ACTIVE TASK

```yaml
CONTROL_VERSION: 37
ACTIVE_WORK_PACKAGE: P3-WP003-PRE1-R2
TASK_ID: P3-WP003-PRE1-R2
PARENT_TASK: P3-WP003-PRE1-R1
AUTHORIZATION_REVISION: P3-WP003-PRE1-R2-CONTRACT-ACCURACY-DECISION-CLOSURE
TITLE: P3-WP003-PRE1-R2 — EVIDENCE-ONLY Contract Accuracy & Decision Closure
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
P3-WP002: CLOSED / PASS
P3-WP003-PRE1: CORRECTIVE REQUIRED / SUPERSEDED
P3-WP003-PRE1-R1: CORRECTIVE REQUIRED / SUPERSEDED_BY_R2
P3-WP003-PRE1-R2: READY_FOR_CHATGPT_REVIEW
P3-WP003: FUTURE / IMPLEMENTATION NOT AUTHORIZED
CODE_BASELINE_HEAD: 6c555a54c114cdad0aa78a43f508a5b297df6546
FAILED_R1_EVIDENCE_HEAD: 372c7fb35aea65d25e2eea6efffc18b7ef0d14e9
P3-WP002_ACCEPTED_IMPLEMENTATION_HEAD: 03dd35a5d6b29c6394f93f16061bfaddb5f10174
P3-WP002_ACCEPTED_EVIDENCE_HEAD: 135f915726f2ab8d20d58b8b3dccd0aa38b1a1f6
WORKER_VERSION: 28.16
REQUIRED_WORKER_VERSION: 28.16
RUNTIME_CONTRACT_VERSION: 2
```

## Current Control-Plane Decision

R1 produced a real definition/gap review, but independent review found factual inaccuracies and unresolved contract ambiguity. The Owner authorized R2 to correct those issues only.

This is **not** P3-WP003 implementation authorization.

## R2 Focus

R2 must correct and lock:
- actual `Customer` source truth (`isBlocked`, `statusMessage`, etc.; no invented `status` field)
- actual current `GET /api/customers` backend behavior (botId + active-OA fencing; no invented current search/status params)
- exact accepted WP002 field names
- all previously ambiguous normative decisions
- complete future API request/response/status/idempotency contracts
- bounded WP1/WP2/WP3 file scope, exclusions and acceptance boundaries
- missing mandatory tests
- post-R2 consistency across all five control docs

## Scope

Evidence-only inspection may read relevant source/tests/entities/database-init/UI/package/docs. During inspection, modify nothing.

At completion modify only:
- `project-docs/EXECUTION_GATE.md`
- `project-docs/ACTIVE_TASK.md`
- `project-docs/CHAT_HANDOFF.md`
- `project-docs/CURRENT_STATE.md`
- `project-docs/PROJECT_STATUS_ROADMAP.md`

No source, tests, `index.html`, schema/migration/index implementation, package/dependency, Worker, LINE, Live UAT, Telegram or unrelated change.

## Completion Rule

R2 may become `READY_FOR_CHATGPT_REVIEW` only when all required decisions are single-valued and repository-grounded, unresolved blockers are `NONE`, provenance is recorded, `git diff --check` passes, and `NO IMPLEMENTATION OCCURRED` is explicit.

## Progress

Official accepted: ~61%
Practical implementation: ~61%

Permanent safety truth remains unchanged: true exactly-once physical LINE delivery is not guaranteed, and ambiguous physical sends must never be automatically resent.
