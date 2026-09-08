# EXECUTION GATE

CONTROL_VERSION: 37

TASK_ID:
P3-WP003-PRE1-R2

PARENT_TASK:
P3-WP003-PRE1-R1

AUTHORIZATION_REVISION:
P3-WP003-PRE1-R2-CONTRACT-ACCURACY-DECISION-CLOSURE

TITLE:
P3-WP003-PRE1-R2 — EVIDENCE-ONLY Contract Accuracy & Decision Closure

STATUS:
CORRECTIVE_AUTHORIZED

AUTHORIZE_EXECUTION:
TRUE

AUTHORIZED_BY:
Project Owner

AUTHORIZATION_REF:
Owner authorized P3-WP003-PRE1-R2 after ChatGPT independent review returned CORRECTIVE REQUIRED on R1.

CONTROL_PLANE:
ChatGPT

EXECUTION_PLANE:
Antigravity — bounded evidence executor only

CANONICAL_BRANCH:
main

CONTROL_UPDATE_PARENT_HEAD:
372c7fb35aea65d25e2eea6efffc18b7ef0d14e9

CODE_BASELINE_HEAD:
6c555a54c114cdad0aa78a43f508a5b297df6546

FAILED_R1_EVIDENCE_HEAD:
372c7fb35aea65d25e2eea6efffc18b7ef0d14e9

P3-WP002_ACCEPTED_IMPLEMENTATION_HEAD:
03dd35a5d6b29c6394f93f16061bfaddb5f10174

P3-WP002_ACCEPTED_EVIDENCE_HEAD:
135f915726f2ab8d20d58b8b3dccd0aa38b1a1f6

PROJECT_STATE:
PHASE_0: CLOSED / PASS
PHASE_1: CLOSED / PASS
PHASE_2: CLOSED / PASS
PHASE_3: IN PROGRESS
ACTIVE_WORK_PACKAGE: P3-WP003-PRE1-R2
P3-WP001: CLOSED / PASS
P3-WP002: CLOSED / PASS
P3-WP003-PRE1: CORRECTIVE REQUIRED / SUPERSEDED
P3-WP003-PRE1-R1: CORRECTIVE REQUIRED / SUPERSEDED_BY_R2
P3-WP003-PRE1-R2: CORRECTIVE_AUTHORIZED / EVIDENCE_ONLY
P3-WP003: FUTURE / IMPLEMENTATION NOT AUTHORIZED
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_R2_EVIDENCE

--------------------------------------------------
WHY R2 EXISTS
--------------------------------------------------

R1 produced real A-J findings, but independent review found contract-accuracy blockers and unresolved ambiguity. R2 is a narrow evidence-only correction. Do not redo the whole PRE1 unless necessary to resolve one of these blockers.

R2 MUST NOT implement any source, test, schema, UI, package or runtime change.

--------------------------------------------------
MANDATORY STARTUP
--------------------------------------------------

1. git status --short must be clean; otherwise STOP.
2. git fetch origin.
3. use canonical branch main.
4. require local HEAD == origin/main.
5. read in order:
   - project-docs/AGENT_START_HERE.md
   - project-docs/EXECUTION_GATE.md
   - project-docs/ACTIVE_TASK.md
   - project-docs/CHAT_HANDOFF.md
6. verify CODE_BASELINE_HEAD drift guard. Only project-docs/** drift is allowed after baseline. Any non-project-docs drift => STOP.

--------------------------------------------------
R2 REQUIRED CORRECTIONS
--------------------------------------------------

1. CURRENT CUSTOMER MODEL TRUTH
Record current `src/customer.entity.ts` exactly enough for the contract. Current relevant fields include:
- botId
- lineUserId
- displayName
- pictureUrl
- statusMessage
- isBlocked
- blockReason
- createdAt
- updatedAt
- imageUrl
Do NOT claim a current `status = FOLLOW|UNFOLLOW|BLOCKED|UNKNOWN` field unless repository truth changes.

2. CURRENT /api/customers TRUTH
Record that current backend `GET /api/customers` accepts `botId`, validates format, verifies active OA before customer/activity queries, then returns OA-scoped customers plus WP002 activity metrics. Do NOT claim existing backend `search` or `status` query parameters unless source truth supports them. Clearly separate CURRENT behavior from FUTURE candidate segmentation behavior.

3. WP002 ACCEPTED FIELD NAMES
Preserve the accepted API names exactly unless an explicit additive mapping is proposed:
- successfulJobCount
- lastSuccessfulSendAt
- failedJobCount
- reconcileRequiredCount
- latestJobStatus
- latestJobCreatedAt
NEVER_SUCCESS and recent-success semantics must be defined using these accepted fields/underlying activity truth.

4. CLOSE ALL CONTRACT AMBIGUITY
R2 completion MUST choose one deterministic rule for each previously ambiguous item and justify it. No `or`, `either`, `atomic or`, `conflict or existing`, or multiple ordering choices may remain for normative behavior. At minimum decide:
- bulk invalid-item behavior
- cross-OA item behavior
- duplicate tag-create behavior
- duplicate assignment behavior
- rename conflict behavior
- delete behavior
- deterministic ordering
- pagination contract
- API status/error semantics
- selectedUsers composition with filters

If any design decision truly cannot be resolved from repository/safety goals, record it as an explicit UNRESOLVED blocker and do NOT mark READY_FOR_CHATGPT_REVIEW.

5. API CONTRACT COMPLETENESS
For each future candidate operation, record all of:
- method/path
- OA/botId scope and active-OA fail-fast order
- request fields
- response fields
- validation rules
- HTTP/status behavior
- idempotency behavior
Operations to cover:
- list/create/rename/delete tags
- assign/unassign one customer
- bulk assign/unassign
- list customer tags
- segmentation/search query
Do not implement endpoints.

6. BOUNDED IMPLEMENTATION SPLIT
For each future package WP1/WP2/WP3 (and evidence closure if retained), record:
- purpose
- allowed file families
- explicit exclusions
- acceptance boundary
No package is authorized by R2.

7. COMPLETE TEST / ACCEPTANCE CONTRACT
In addition to R1 tests, explicitly include:
- deterministic ordering + pagination
- blocked-user behavior preserved using `isBlocked`
- selectedUsers behavior preserved
- AND/OR composition
- OA isolation / no cross-OA leakage
- duplicate/idempotency semantics matching the chosen contract
- rename/delete semantics
- bulk invalid-item behavior matching the chosen contract
- ANY/ALL tags
- tag + accepted WP002 activity combined filtering
- no N+1
- stale OA response discard
- malicious tag safe-DOM rendering

8. CONTROL-DOC COMPLETION TRUTH
All five control docs must reflect post-R2 truth. Remove stale wording that says R2/R1 findings are still pending once completed. Supporting docs may summarize, but must not contradict EXECUTION_GATE.

--------------------------------------------------
AUTHORIZED EVIDENCE INSPECTION
--------------------------------------------------

READ / ANALYZE ONLY as needed:
- src/customer.entity.ts
- src/app.controller.ts
- src/app.controller.spec.ts
- src/entities/**
- src/database-init.service.ts
- index.html
- package.json / package-lock.json
- directly relevant project-docs/**

No file modification during inspection.

--------------------------------------------------
COMPLETION EVIDENCE
--------------------------------------------------

At completion record:
- corrected repository-grounded contract sections
- exact materially inspected files
- exact decisions closed
- unresolved decisions/gaps: NONE, or STOP if not NONE
- schema change later: YES/NO + rationale
- exact changed files
- git diff --check result
- test/build truth; NOT RUN / NOT REQUIRED is valid if accurate
- evidence classification: REPOSITORY INSPECTION / LOCAL REPORTED as applicable
- GitHub CI/status truth only if actually checked
- explicit statement: NO IMPLEMENTATION OCCURRED

A status-only completion is invalid.

--------------------------------------------------
MODIFICATION SCOPE
--------------------------------------------------

At successful completion may update ONLY:
- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md

Absolutely prohibited:
- src/**
- index.html
- run/**
- package*.json
- schema/migration/index implementation
- dependencies
- Worker/runtime implementation
- LINE send / Live UAT
- Telegram implementation/test
- unrelated files

--------------------------------------------------
SUCCESSFUL COMPLETION STATE
--------------------------------------------------

Only after all R2 corrections are complete and internally consistent:

STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZE_EXECUTION: FALSE
P3-WP003-PRE1-R2: READY_FOR_CHATGPT_REVIEW
P3-WP003: FUTURE / IMPLEMENTATION NOT AUTHORIZED
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_REVIEW

Run git diff --check, verify exact five changed docs, fetch origin before push, STOP on drift, commit/push/fetch, prove sync/clean, then STOP.

Do not self-approve. Do not mark PRE1 PASS/CLOSED. Do not start P3-WP003 implementation.

--------------------------------------------------
VERSION / SAFETY CONTRACT
--------------------------------------------------

Worker Version: 28.16
Required Worker Version: 28.16
Runtime Contract Version: 2

True exactly-once physical LINE delivery: NOT GUARANTEED.
Never automatically resend an ambiguous physical send.
Preserve OA isolation, wrong-recipient fencing, blocked-customer protection, selectedUsers behavior, stale OA protection, safe DOM handling and all accepted Phase 0-2 safety behavior.

--------------------------------------------------
PROGRESS
--------------------------------------------------

Official accepted roadmap progress estimate: ~61%
Practical implementation progress estimate: ~61%

R2 evidence/design correction does not itself increase implementation progress.
