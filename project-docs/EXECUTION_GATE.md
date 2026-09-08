# EXECUTION GATE

CONTROL_VERSION: 36

TASK_ID:
P3-WP003-PRE1-R1

PARENT_TASK:
P3-WP003-PRE1

AUTHORIZATION_REVISION:
P3-WP003-PRE1-R1-EVIDENCE-DEFINITION-COMPLETION

TITLE:
P3-WP003-PRE1-R1 — EVIDENCE-ONLY Definition & Gap Review Completion

STATUS:
CORRECTIVE_AUTHORIZED

AUTHORIZE_EXECUTION:
TRUE

AUTHORIZED_BY:
Project Owner

AUTHORIZATION_REF:
Owner authorized P3-WP003-PRE1-R1 EVIDENCE-ONLY Definition & Gap Review Completion according to the bounded scope proposed by ChatGPT independent review.

CONTROL_PLANE:
ChatGPT

EXECUTION_PLANE:
Antigravity — bounded evidence executor only

CANONICAL_BRANCH:
main

CONTROL_UPDATE_PARENT_HEAD:
a72ef6ac2668b8c0721c3dc153c9dddd6797afe6

CODE_BASELINE_HEAD:
6c555a54c114cdad0aa78a43f508a5b297df6546

FAILED_PRE1_EVIDENCE_HEAD:
a72ef6ac2668b8c0721c3dc153c9dddd6797afe6

P3-WP002_ACCEPTED_IMPLEMENTATION_HEAD:
03dd35a5d6b29c6394f93f16061bfaddb5f10174

P3-WP002_ACCEPTED_EVIDENCE_HEAD:
135f915726f2ab8d20d58b8b3dccd0aa38b1a1f6

PROJECT_STATE:
PHASE_0: CLOSED / PASS
PHASE_1: CLOSED / PASS
PHASE_2: CLOSED / PASS
PHASE_3: IN PROGRESS
ACTIVE_WORK_PACKAGE: P3-WP003-PRE1-R1
P3-WP001: CLOSED / PASS
P3-WP002: CLOSED / PASS
P3-WP003-PRE1: CORRECTIVE REQUIRED / SUPERSEDED_BY_R1
P3-WP003-PRE1-R1: CORRECTIVE_AUTHORIZED / EVIDENCE_ONLY
P3-WP003: FUTURE / IMPLEMENTATION NOT AUTHORIZED
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_R1_EVIDENCE

--------------------------------------------------
WHY R1 EXISTS
--------------------------------------------------

Independent review of PRE1 at a72ef6ac2668b8c0721c3dc153c9dddd6797afe6 found scope control PASS but the required repository-grounded definition/gap review was not actually recorded. The commit changed lifecycle status only and did not provide the A-J findings, inspected-file provenance, decisions/gaps, bounded implementation split, or validation provenance required by the PRE1 contract.

R1 MUST complete the missing evidence. A status-only completion is explicitly prohibited.

--------------------------------------------------
MANDATORY STARTUP
--------------------------------------------------

1. git status --short must be clean; otherwise STOP.
2. git fetch origin.
3. use canonical branch main.
4. require local HEAD == origin/main.
5. read in exact order:
   - project-docs/AGENT_START_HERE.md
   - project-docs/EXECUTION_GATE.md
   - project-docs/ACTIVE_TASK.md
   - project-docs/CHAT_HANDOFF.md
6. verify CODE_BASELINE_HEAD drift guard:
   - compare 6c555a54c114cdad0aa78a43f508a5b297df6546 to current HEAD
   - only project-docs/** changes are allowed after that baseline
   - if any non-project-docs file changed, STOP with CODE_BASELINE_DRIFT

No merge, rebase, force-push, reset-around-drift, or scope expansion.

--------------------------------------------------
AUTHORIZED EVIDENCE INSPECTION
--------------------------------------------------

READ / ANALYZE ONLY as materially needed:
- src/app.controller.ts
- src/app.controller.spec.ts
- src/customer.entity.ts
- src/entities/**
- src/database-init.service.ts
- index.html
- package.json / package-lock.json
- directly relevant project-docs/**

Search may be used for tag, segment, botId/OA, customer, blocked, selectedUsers, outbound activity, migration/index and query patterns.

During inspection NO FILE MODIFICATION is authorized.

--------------------------------------------------
R1 REQUIRED OUTPUT — MUST RECORD ACTUAL FINDINGS
--------------------------------------------------

The completion docs MUST contain a section named exactly:

R1 REPOSITORY-GROUNDED FINDINGS

That section must record concrete repository-backed decisions/findings for A-J below. Do not merely restate what must be investigated.

A. CURRENT DATA MODEL / GAP
- actual Customer persistence shape relevant to segmentation
- actual OA/botId ownership/scope pattern
- whether tag/tagging persistence exists now
- actual DB initialization/schema/index convention observed
- exact gap to persistent tags
- evidence source files for these findings

B. TAG DOMAIN CONTRACT
Decide and record:
- OA-scoped vs global tag ownership, with repository-based justification
- Customer <-> Tag cardinality
- uniqueness key/rule
- case/whitespace/canonical normalization
- create/rename/delete semantics
- delete behavior when assignments exist
- duplicate assignment/idempotency
- bulk add/remove semantics including partial-invalid behavior
- reserved/system tags: REQUIRED now or DEFERRED

C. ADVANCED SEGMENTATION CONTRACT
Define concrete semantics for:
- persistent tags
- blocked state
- safe customer identity/display filters, if any
- accepted WP002 metrics: success count, failed count, reconcile-required count, latest status, last successful send
- NEVER_SUCCESS
- recent-success windows
- AND/OR rules within and across filter groups
- multi-tag ANY/ALL behavior
- empty-filter behavior
- deterministic ordering
- pagination and stable-result expectations

D. OA / SECURITY / SAFETY CONTRACT
Record exact future rules for:
- botId/OA validation before tag reads/writes and segment queries
- no cross-OA tag or assignment leakage
- wrong-recipient fencing and blocked-customer protection preservation
- no expansion of secrets/PII/message-body exposure
- safe DOM handling of tag names and user-controlled text
- exactly-once limitation and ambiguous-send no-auto-resend invariant

E. API CONTRACT CANDIDATE
For each candidate operation define method/path shape or equivalent contract, OA scope, request fields, response fields, validation/fail-fast behavior, status behavior, and idempotency:
- list/create/rename/delete tags
- assign/unassign one customer
- bulk assign/unassign
- list customer tags
- segmentation/search query

F. UI CONTRACT CANDIDATE
Define minimal future UI behavior for:
- tag display/edit affordance
- bulk tag operations
- segmentation controls
- selectedUsers compatibility
- blocked checkbox behavior preservation
- stale OA response protection preservation
- safe DOM rendering

G. STORAGE / MIGRATION / PERFORMANCE CANDIDATE
Record:
- minimum REQUIRED schema shape
- likely Tag entity/table and customer-tag join shape
- required uniqueness/FK/index constraints
- OA-scoped lookup indexes
- migration/database-init impact
- query strategy avoiding N+1
- REQUIRED vs OPTIONAL/DEFERRED schema/performance work

H. BACKWARD COMPATIBILITY
Record how future implementation preserves:
- P3-WP001 customer intelligence
- P3-WP002 activity metrics/filter semantics
- Phase 0-2 campaign/runtime/safety behavior
- existing API/DTO compatibility, and any intentionally additive fields

I. IMPLEMENTATION SPLIT / BOUNDED PLAN
Propose the smallest safe future implementation sequence. Each proposed package must have purpose, allowed file families, explicit exclusions and acceptance boundary. Do not authorize any package.

J. TEST / ACCEPTANCE CONTRACT
Define exact future tests including at least:
- OA isolation/no cross-OA leakage
- duplicate/idempotent assignment
- rename/delete semantics
- bulk correctness and invalid-item behavior
- ANY/ALL tags
- AND/OR composition
- tag + WP002 activity combined filtering
- no N+1 for multi-customer results
- deterministic ordering/pagination
- blocked behavior preserved
- selectedUsers preserved
- stale OA response discard preserved
- malicious tag name safe-DOM rendering

--------------------------------------------------
MANDATORY PROVENANCE AT COMPLETION
--------------------------------------------------

Completion docs MUST also record:
- exact materially inspected files
- exact searches/areas inspected if materially relevant
- resolved decisions
- unresolved decisions/gaps, or explicitly NONE
- whether schema change will be required later: YES/NO with evidence-based rationale
- proposed future implementation split
- exact changed files in R1
- git diff --check result
- whether npm test/build were run; if not, say NOT RUN / NOT REQUIRED FOR EVIDENCE-ONLY
- evidence classification: REPOSITORY INSPECTION and LOCAL REPORTED where applicable
- GitHub CI/status truth only if actually checked
- explicit statement: NO IMPLEMENTATION OCCURRED

A completion that only changes STATUS/AUTHORIZE_EXECUTION/NEXT_CANDIDATE fields is INVALID and MUST NOT be marked READY_FOR_CHATGPT_REVIEW.

--------------------------------------------------
MODIFICATION SCOPE
--------------------------------------------------

At successful R1 completion may update ONLY:
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
- Worker/runtime implementation
- Telegram implementation
- any unrelated file

If a new non-control document seems useful, STOP and request Control Plane approval. Do not create it.

--------------------------------------------------
VALIDATION / COMPLETION STATE
--------------------------------------------------

Because R1 is EVIDENCE-ONLY:
- npm test: NOT REQUIRED unless needed to resolve factual ambiguity
- npm run build: NOT REQUIRED unless needed to resolve factual ambiguity
- git diff --check: REQUIRED
- git diff --name-only must match only the five control docs

Successful completion only after the actual R1 findings/provenance are written:

STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZE_EXECUTION: FALSE
P3-WP003-PRE1-R1: READY_FOR_CHATGPT_REVIEW
P3-WP003: FUTURE / IMPLEMENTATION NOT AUTHORIZED
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_REVIEW

Before push:
- inspect git status --short
- inspect exact changed files
- git diff --check must PASS
- git fetch origin
- if origin/main moved, STOP

Then commit/push, fetch again, prove HEAD == origin/main, prove clean tree, and STOP.

Do not self-approve.
Do not mark PRE1 COMPLETE/PASS yourself.
Do not start P3-WP003 implementation.

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

R1 definition evidence does not itself increase accepted implementation progress.
