# EXECUTION GATE

CONTROL_VERSION: 35

TASK_ID:
P3-WP003-PRE1

PARENT_TASK:
P3-WP002-CLOSE

AUTHORIZATION_REVISION:
P3-WP003-PRE1-DEFINITION-GAP-REVIEW

TITLE:
P3-WP003-PRE1 — Persistent Tags & Advanced Segmentation Definition / Gap Review

STATUS:
AUTHORIZED_FOR_EXECUTION

AUTHORIZE_EXECUTION:
TRUE

AUTHORIZED_BY:
Project Owner

AUTHORIZATION_REF:
Owner authorized P3-WP003-PRE1 Persistent Tags & Advanced Segmentation Definition / Gap Review as EVIDENCE-ONLY.

CONTROL_PLANE:
ChatGPT

EXECUTION_PLANE:
Antigravity — bounded evidence executor only

CANONICAL_BRANCH:
main

CONTROL_UPDATE_PARENT_HEAD:
6c555a54c114cdad0aa78a43f508a5b297df6546

CODE_BASELINE_HEAD:
6c555a54c114cdad0aa78a43f508a5b297df6546

PHASE_3_BASELINE_ACCEPTED_PROGRESS:
~61%

P3-WP002_ACCEPTED_IMPLEMENTATION_HEAD:
03dd35a5d6b29c6394f93f16061bfaddb5f10174

P3-WP002_ACCEPTED_EVIDENCE_HEAD:
135f915726f2ab8d20d58b8b3dccd0aa38b1a1f6

PROJECT_STATE:
PHASE_0: CLOSED / PASS
PHASE_1: CLOSED / PASS
PHASE_2: CLOSED / PASS
PHASE_3: IN PROGRESS
ACTIVE_WORK_PACKAGE: P3-WP003-PRE1
P3-WP001: CLOSED / PASS
P3-WP002: CLOSED / PASS
P3-WP003-PRE1: AUTHORIZED_FOR_EXECUTION / EVIDENCE_ONLY
P3-WP003: FUTURE / IMPLEMENTATION NOT AUTHORIZED
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_PRE1_EVIDENCE

--------------------------------------------------
PRE1 PURPOSE
--------------------------------------------------

Define the bounded implementation contract for:
P3-WP003 — Persistent Tags & Advanced Segmentation.

PRE1 is EVIDENCE-ONLY.
It MUST inspect current repository truth and produce a definition/gap review.
It MUST NOT implement tags, segmentation, schema, API, or UI changes.

--------------------------------------------------
MANDATORY STARTUP
--------------------------------------------------

Before any PRE1 inspection:

1. git status --short
   - must be clean; otherwise STOP
2. git fetch origin
3. checkout/use main
4. require local HEAD == origin/main
5. require origin/main == 6c555a54c114cdad0aa78a43f508a5b297df6546
   - otherwise STOP with HEAD_DRIFT
6. read in exact order:
   - project-docs/AGENT_START_HERE.md
   - project-docs/EXECUTION_GATE.md
   - project-docs/ACTIVE_TASK.md
   - project-docs/CHAT_HANDOFF.md
7. verify CODE_BASELINE_HEAD drift guard
   - any non-project-docs drift after baseline => STOP with CODE_BASELINE_DRIFT

No merge, rebase, force-push, reset-around-drift, or scope expansion.

--------------------------------------------------
AUTHORIZED EVIDENCE INSPECTION
--------------------------------------------------

READ / ANALYZE ONLY as needed:

- src/app.controller.ts
- src/app.controller.spec.ts
- src/customer.entity.ts
- src/entities/**
- src/database-init.service.ts
- index.html
- package.json / package-lock.json
- directly relevant project-docs/**

May inspect repository structure/search for tag, segment, customer, OA/botId, filter, campaign recipient, blocked state, outbound activity, migration/index patterns.

Do NOT make source/test/schema/package changes.

--------------------------------------------------
REQUIRED PRE1 EVIDENCE / DECISIONS
--------------------------------------------------

The final PRE1 report/control-doc sync MUST establish repository-grounded truth for all of the following:

A. CURRENT DATA MODEL / GAP
- current Customer persistence shape
- OA/botId ownership/scope truth
- whether any tag/tagging persistence already exists
- current DB initialization/schema/index conventions
- exact gap to persistent tags

B. TAG DOMAIN CONTRACT
- whether tags are OA-scoped or global; recommend one and justify from current architecture/safety
- Customer <-> Tag cardinality
- uniqueness rule for tag names/keys
- canonical normalization/case/whitespace semantics
- create / rename / delete behavior
- behavior when deleting a tag assigned to customers
- duplicate assignment behavior and idempotency
- bulk add/remove semantics
- whether reserved/system tags are needed now or explicitly deferred

C. ADVANCED SEGMENTATION CONTRACT
Define candidate filters and evidence whether they can be supported from current accepted data:
- persistent tags
- blocked state
- customer identity/display fields only where safe/useful
- WP002 outbound activity metrics, including successful count, failed count, reconcile-required count, latest status, last successful send timestamp
- NEVER_SUCCESS
- recent success windows

Define:
- AND / OR semantics within and across filter groups
- empty filter behavior
- multi-tag matching semantics (ANY / ALL)
- deterministic ordering
- pagination expectations
- stable result semantics

D. OA / SECURITY / SAFETY CONTRACT
- all reads/writes must preserve OA isolation and wrong-recipient fencing
- define how botId/OA context is validated for tag operations and segment queries
- no cross-OA tag leakage
- no secrets/PII/message body expansion
- segmentation must not weaken blocked-user protection or send safety
- true exactly-once physical LINE delivery remains NOT GUARANTEED
- ambiguous physical sends must never automatically resend

E. API CONTRACT CANDIDATE
Define candidate endpoints/payloads/status behavior for:
- list/create/rename/delete tags
- assign/unassign one customer
- bulk assign/unassign
- list customer tags
- segmentation/search query

For each, specify:
- OA/botId scoping
- key request fields
- key response fields
- validation/fail-fast expectations
- idempotency expectations where applicable

Do NOT implement endpoints in PRE1.

F. UI CONTRACT CANDIDATE
Define minimal UI additions only:
- tag display/edit affordance on customer intelligence UI
- bulk tag operation entry point
- segmentation filter controls
- selectedUsers compatibility
- blocked checkbox behavior preservation
- stale OA response protection preservation
- safe DOM rendering requirement for tag names/status text

Do NOT modify index.html in PRE1.

G. STORAGE / MIGRATION / PERFORMANCE CANDIDATE
- propose minimum schema shape required by accepted domain contract
- identify likely entities/tables/join table/indexes
- identify migration/init-service impact
- identify expected query strategy avoiding N+1
- identify likely indexes for OA-scoped tag lookup and customer segmentation
- explicitly distinguish REQUIRED vs OPTIONAL/DEFERRED schema work

No schema change is authorized in PRE1.

H. BACKWARD COMPATIBILITY
- preserve P3-WP001 customer intelligence behavior
- preserve P3-WP002 activity metrics/filter semantics
- preserve Phase 0-2 safety/operations/campaign behavior
- define whether existing API/DTOs can remain backward-compatible

I. IMPLEMENTATION SPLIT / BOUNDED PLAN
Propose the smallest safe implementation sequence after PRE1, for example:
- persistence/domain foundation
- API/service/query layer
- UI + segmentation controls
- regression/evidence closure

Do not authorize any of those packages yourself.

J. TEST / ACCEPTANCE CONTRACT
Define exact tests required before P3-WP003 can close, including at minimum:
- OA isolation
- duplicate/idempotent assignment
- rename/delete semantics
- bulk assignment correctness
- ANY/ALL tag filtering
- AND/OR filter semantics
- WP002 activity + tag combined filtering
- no N+1 for multi-customer result sets
- deterministic ordering/pagination
- blocked-user behavior preserved
- selectedUsers behavior preserved
- stale OA response discard preserved
- malicious tag name safe-DOM rendering
- no cross-OA leakage

--------------------------------------------------
PRE1 MODIFICATION SCOPE
--------------------------------------------------

During evidence inspection:
NO FILE MODIFICATION is authorized.

At successful PRE1 completion, may update ONLY these five control documents:
- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md

Absolutely prohibited modifications:
- src/**
- index.html
- run/**
- package*.json
- database/schema/migration implementation
- dependencies
- any unrelated file

If a new non-control document appears necessary, STOP and request Control Plane approval. Do not create it automatically.

--------------------------------------------------
PRE1 VALIDATION / EVIDENCE CLASSIFICATION
--------------------------------------------------

Because PRE1 is EVIDENCE-ONLY and source/test/schema are unchanged:
- npm test is NOT required unless needed to resolve a factual ambiguity
- npm run build is NOT required unless needed to resolve a factual ambiguity
- git diff --check IS required before completion commit
- exact changed files must be inspected

Evidence classification:
- REPOSITORY INSPECTION / LOCAL REPORTED for local commands
- GitHub CI/status: report actual truth only; do not invent CI evidence

No LINE send.
No Live UAT.
No Telegram test.

--------------------------------------------------
SUCCESSFUL PRE1 COMPLETION STATE
--------------------------------------------------

Only if the evidence/definition is complete and internally consistent:

STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZE_EXECUTION: FALSE
P3-WP003-PRE1: READY_FOR_CHATGPT_REVIEW
P3-WP003: FUTURE / IMPLEMENTATION NOT AUTHORIZED
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_REVIEW

Record:
- exact PRE1 inspection scope
- exact files inspected materially
- exact five changed control docs
- unresolved gaps/decisions, if any
- proposed bounded implementation split
- whether schema change will likely be required later (evidence only)
- no implementation occurred

Commit/push completion contract:
- git diff --check PASS
- git status --short inspected
- git diff --name-only matches only the five control docs
- git fetch origin immediately before push
- if origin/main moved from PRE1 starting HEAD, STOP
- commit and push main
- fetch origin
- prove HEAD == origin/main
- prove working tree clean
- STOP

Do not self-approve.
Do not mark P3-WP003 implementation started.
Do not begin implementation in the same run.

--------------------------------------------------
VERSION / SAFETY CONTRACT
--------------------------------------------------

Worker Version: 28.16
Required Worker Version: 28.16
Runtime Contract Version: 2

No Worker change.
No schema change.
No LINE send.
No Live UAT.
No Telegram test.
No dependency change.

True exactly-once physical LINE delivery: NOT GUARANTEED.
Never automatically resend an ambiguous physical send.

--------------------------------------------------
PROGRESS
--------------------------------------------------

Official accepted roadmap progress estimate: ~61%
Practical implementation progress estimate: ~61%

PRE1 definition work does not by itself increase accepted implementation progress.
