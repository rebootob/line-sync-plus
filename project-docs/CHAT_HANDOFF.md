# CHAT HANDOFF

## Repository

- Repository: `rebootob/line-sync-plus`
- Canonical Branch: `main`
- Current control version: `36`
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
- P3-WP002: `CLOSED / PASS`
- P3-WP003-PRE1: `CORRECTIVE REQUIRED / SUPERSEDED_BY_R1`
- P3-WP003-PRE1-R1: `CORRECTIVE_AUTHORIZED / EVIDENCE_ONLY`
- P3-WP003: `FUTURE / IMPLEMENTATION NOT AUTHORIZED`
- ACTIVE_WORK_PACKAGE: `P3-WP003-PRE1-R1`
- AUTHORIZE_EXECUTION: `TRUE`
- NEXT_CANDIDATE: `NONE`
- NEXT_CANDIDATE_STATUS: `AWAITING_R1_EVIDENCE`

## Accepted Foundation

P3-WP002 accepted production implementation:
`03dd35a5d6b29c6394f93f16061bfaddb5f10174`

P3-WP002 accepted evidence HEAD:
`135f915726f2ab8d20d58b8b3dccd0aa38b1a1f6`

Code baseline for PRE1/R1 drift guard:
`6c555a54c114cdad0aa78a43f508a5b297df6546`

Failed PRE1 evidence HEAD:
`a72ef6ac2668b8c0721c3dc153c9dddd6797afe6`

P3-WP001 and P3-WP002 remain closed/pass and must not be reopened by R1.

## Why R1 Exists

The first PRE1 run respected EVIDENCE-ONLY scope but did not record the actual definition/gap review. It only transitioned status fields. Independent review therefore returned `CORRECTIVE REQUIRED`.

R1 must now produce the missing repository-grounded findings and provenance. A status-only completion is prohibited.

## Required R1 Content

The five control docs must capture actual findings for all A-J contract areas defined in `EXECUTION_GATE.md`:
- current Customer/OA/tag data model and exact gap
- concrete tag ownership/cardinality/normalization/create/rename/delete/idempotency/bulk rules
- segmentation filters, AND/OR, ANY/ALL, empty filters, ordering/pagination
- OA validation/isolation/security/safety rules
- candidate API contracts
- minimal UI contract
- required vs deferred storage/migration/index/performance work
- backward compatibility
- smallest bounded future implementation split
- exact acceptance/regression/security/performance test contract

## Mandatory Evidence Provenance

R1 completion must record:
- exact materially inspected files
- exact resolved decisions
- unresolved gaps/decisions or `NONE`
- whether later schema change is required and why
- exact changed control docs
- `git diff --check` result
- test/build truth
- evidence classification
- `NO IMPLEMENTATION OCCURRED`

## Strict Scope

May inspect relevant source/tests/entities/database-init/dashboard/package/docs only as needed.

May modify only the five control docs at completion. No source/test/index/schema/package/Worker/LINE/Live-UAT/Telegram changes.

## Completion Lifecycle

```text
R1 CONTROL UPDATE
-> COMMIT/PUSH
-> STOP
-> FRESH R1 EVIDENCE RUN
-> repository inspection + actual A-J findings
-> five-control-doc evidence sync
-> READY_FOR_CHATGPT_REVIEW
-> COMMIT/PUSH
-> STOP
-> ChatGPT independent review
```

Do not auto-start P3-WP003 implementation.

## Progress

- Official accepted roadmap progress estimate: **~61%**
- Practical implementation progress estimate: **~61%**

R1 definition evidence does not itself increase implementation progress.
