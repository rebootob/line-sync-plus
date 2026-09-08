# CHAT HANDOFF

## Repository

- Repository: `rebootob/line-sync-plus`
- Canonical Branch: `main`
- Current control version: `35`
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
- P3-WP003-PRE1: `READY_FOR_CHATGPT_REVIEW`
- P3-WP003: `FUTURE / IMPLEMENTATION NOT AUTHORIZED`
- ACTIVE_WORK_PACKAGE: `P3-WP003-PRE1`
- AUTHORIZE_EXECUTION: `FALSE`
- NEXT_CANDIDATE: `NONE`
- NEXT_CANDIDATE_STATUS: `AWAITING_REVIEW`

## Accepted Foundation

P3-WP002 accepted production implementation:
`03dd35a5d6b29c6394f93f16061bfaddb5f10174`

P3-WP002 accepted evidence HEAD:
`135f915726f2ab8d20d58b8b3dccd0aa38b1a1f6`

Current PRE1 code baseline:
`6c555a54c114cdad0aa78a43f508a5b297df6546`

P3-WP001 Customer Intelligence Foundation and P3-WP002 Outbound Activity Intelligence remain closed/pass and must not be reopened by PRE1.

## P3-WP003-PRE1 Purpose

Define and gap-review the smallest safe contract for `P3-WP003 — Persistent Tags & Advanced Segmentation` using repository truth only.

PRE1 must establish:
- current customer/OA/data-model gap
- persistent tag domain semantics
- OA/global scope decision
- many-to-many/uniqueness/normalization rules
- create/rename/delete/assign/unassign/bulk/idempotency semantics
- advanced segmentation filters and AND/OR + tag ANY/ALL behavior
- candidate OA-scoped API behavior
- minimal UI behavior
- likely schema/join/index/migration impact
- query/N+1/performance expectations
- backward compatibility
- implementation split
- test/acceptance contract

## Strict Scope

PRE1 is EVIDENCE-ONLY.

May inspect relevant source/tests/entities/database-init/dashboard/package/docs, but must not modify them.

At successful completion only the five control docs may change:
- `project-docs/EXECUTION_GATE.md`
- `project-docs/ACTIVE_TASK.md`
- `project-docs/CHAT_HANDOFF.md`
- `project-docs/CURRENT_STATE.md`
- `project-docs/PROJECT_STATUS_ROADMAP.md`

No source, test, `index.html`, schema/migration, package/dependency, Worker, LINE send, Live UAT, Telegram or unrelated implementation.

## Required Safety Truth

Any future tag/segment design must preserve:
- OA isolation
- wrong-recipient fencing
- blocked-customer protection
- selectedUsers behavior
- stale OA response protection
- safe DOM rendering for user-controlled/tag text
- durable send/reconciliation safety

True exactly-once physical LINE delivery remains NOT GUARANTEED.
Never automatically resend an ambiguous physical send.

## Completion Lifecycle

```text
CONTROL UPDATE (this commit)
-> STOP
-> FRESH PRE1 RUN
-> repository inspection / definition / gap review only
-> update five control docs with evidence
-> READY_FOR_CHATGPT_REVIEW
-> commit/push
-> STOP
-> ChatGPT independent review
-> Owner approval required before any P3-WP003 implementation gate
```

Do not auto-start P3-WP003 implementation.

## Progress

- Official accepted roadmap progress estimate: **~61%**
- Practical implementation progress estimate: **~61%**

PRE1 does not by itself increase accepted implementation progress.
