# ACTIVE TASK

```yaml
CONTROL_VERSION: 35
ACTIVE_WORK_PACKAGE: P3-WP003-PRE1
TASK_ID: P3-WP003-PRE1
PARENT_TASK: P3-WP002-CLOSE
AUTHORIZATION_REVISION: P3-WP003-PRE1-DEFINITION-GAP-REVIEW
TITLE: P3-WP003-PRE1 — Persistent Tags & Advanced Segmentation Definition / Gap Review
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
P3-WP003-PRE1: READY_FOR_CHATGPT_REVIEW
P3-WP003: FUTURE / IMPLEMENTATION NOT AUTHORIZED
CODE_BASELINE_HEAD: 6c555a54c114cdad0aa78a43f508a5b297df6546
P3-WP002_ACCEPTED_IMPLEMENTATION_HEAD: 03dd35a5d6b29c6394f93f16061bfaddb5f10174
P3-WP002_ACCEPTED_EVIDENCE_HEAD: 135f915726f2ab8d20d58b8b3dccd0aa38b1a1f6
WORKER_VERSION: 28.16
REQUIRED_WORKER_VERSION: 28.16
RUNTIME_CONTRACT_VERSION: 2
```

## Current Control-Plane Decision

The Owner authorized `P3-WP003-PRE1` as an **EVIDENCE-ONLY Definition / Gap Review** for Persistent Tags & Advanced Segmentation.

This is not P3-WP003 implementation authorization.

## PRE1 Objectives

Repository-grounded review must define:
- current Customer/OA/tagging/segmentation gaps
- tag scope, cardinality, uniqueness, normalization, rename/delete, idempotent assign/unassign and bulk semantics
- advanced segmentation filter model including tags, blocked state, WP002 activity, NEVER_SUCCESS and recent-success windows
- AND/OR and ANY/ALL semantics
- OA isolation/security/fail-fast contract
- candidate API contract
- candidate UI contract
- likely storage/join/index/migration needs
- N+1 avoidance and performance expectations
- backward compatibility with P3-WP001/P3-WP002 and prior phases
- bounded implementation split
- exact test/acceptance contract

## Authorized Inspection

Read/analyze only as needed:
- `src/app.controller.ts`
- `src/app.controller.spec.ts`
- `src/customer.entity.ts`
- `src/entities/**`
- `src/database-init.service.ts`
- `index.html`
- `package.json` / `package-lock.json`
- directly relevant `project-docs/**`

During inspection no file modification is authorized.

At successful PRE1 completion only these five control docs may be updated:
- `project-docs/EXECUTION_GATE.md`
- `project-docs/ACTIVE_TASK.md`
- `project-docs/CHAT_HANDOFF.md`
- `project-docs/CURRENT_STATE.md`
- `project-docs/PROJECT_STATUS_ROADMAP.md`

No `src/**`, test, `index.html`, schema/migration, package/dependency, Worker, LINE, Live-UAT, Telegram or unrelated change.

## Validation / Completion

Because PRE1 is evidence-only:
- full tests/build are not mandatory unless needed to resolve factual ambiguity
- `git diff --check` is required before the completion commit
- exact changed files must be the five control docs only
- evidence must be clearly classified as repository inspection / local reported where applicable

Successful completion state:
- `P3-WP003-PRE1: READY_FOR_CHATGPT_REVIEW`
- `AUTHORIZE_EXECUTION: FALSE`
- `P3-WP003: FUTURE / IMPLEMENTATION NOT AUTHORIZED`
- `NEXT_CANDIDATE: NONE`
- `NEXT_CANDIDATE_STATUS: AWAITING_REVIEW`
- STOP after commit/push; no implementation may begin in the same run

## Progress

- Official accepted roadmap progress estimate: **~61%**
- Practical implementation progress estimate: **~61%**

PRE1 definition work does not itself increase accepted implementation progress.

Permanent safety truth remains unchanged: true exactly-once physical LINE delivery is not guaranteed, and ambiguous physical sends must never be automatically resent.
