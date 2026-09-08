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
READY_FOR_CHATGPT_REVIEW

AUTHORIZE_EXECUTION:
FALSE

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
P3-WP003-PRE1-R2: READY_FOR_CHATGPT_REVIEW
P3-WP003: FUTURE / IMPLEMENTATION NOT AUTHORIZED
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_REVIEW

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

R2 evidence/design correction does not itself increase implementation progress.

--------------------------------------------------
R2 REPOSITORY-GROUNDED FINDINGS & CONTRACT CLOSURE
--------------------------------------------------

1. CURRENT CUSTOMER MODEL REPOSITORY TRUTH
- Inspected File: `src/customer.entity.ts` (Table `customers`).
- Primary Key: Composite `(botId, lineUserId)` (`botId: varchar(64)`, `lineUserId: varchar(64)`).
- Actual Fields:
  * `botId`: string (PK)
  * `lineUserId`: string (PK)
  * `displayName`: string | null (varchar 255)
  * `pictureUrl`: string | null (text)
  * `statusMessage`: string | null (varchar 255)
  * `isBlocked`: boolean (default `false`)
  * `blockReason`: string | null (text)
  * `createdAt`: Date (timestamp without time zone)
  * `updatedAt`: Date (timestamp without time zone)
  * `imageUrl`: string | null (text)
- Factual Correction: The current `Customer` entity does NOT have a `status = FOLLOW|UNFOLLOW|BLOCKED|UNKNOWN` string/enum field. Blocked status is tracked strictly via `isBlocked: boolean` and optional `blockReason`.

2. CURRENT /api/customers BACKEND BEHAVIOR REPOSITORY TRUTH
- Inspected File: `src/app.controller.ts` (`@Get('customers')`).
- Current Behavior:
  * Mandatory Parameter: `@Query('botId') botId: string`. Returns `400 Bad Request` if missing or if `botId` fails regex (`/^U[0-9a-fA-F]{32}$/`).
  * Active OA Context Fencing: Queries `OaRuntimeState` (`id = 'global'`). If `cleanBotId !== activeBotId`, returns `409 Conflict` (`Requested botId does not match active OA`).
  * Customer Lookup: Fetches `customerRepository.find({ where: { botId: cleanBotId }, order: { createdAt: 'DESC' } })`.
  * Activity Metrics (WP002): Performs a single aggregate query on `CampaignJob` grouped by `lineUserId` for the requested `cleanBotId`.
  * Returned Customer Shape:
    `{ botId, lineUserId, displayName, pictureUrl, statusMessage, isBlocked, blockReason, createdAt, updatedAt, imageUrl, successfulJobCount, lastSuccessfulSendAt, failedJobCount, reconcileRequiredCount, latestJobStatus, latestJobCreatedAt }`.
- Factual Correction: Current backend `GET /api/customers` does NOT accept `search`, `status`, `isBlocked`, `tagIds`, `tagMode`, or `limit`/`offset` parameters. These are FUTURE candidate features to be added in WP2.

3. ACCEPTED WP002 FIELD NAMES & METRIC DEFINITIONS
- Exact Accepted API Field Names:
  * `successfulJobCount` (integer >= 0)
  * `lastSuccessfulSendAt` (string ISO timestamp | null)
  * `failedJobCount` (integer >= 0)
  * `reconcileRequiredCount` (integer >= 0)
  * `latestJobStatus` (string | null)
  * `latestJobCreatedAt` (string ISO timestamp | null)
- Metric Definitions:
  * `NEVER_SUCCESS`: Customer record where `successfulJobCount = 0` (or `lastSuccessfulSendAt IS NULL`).
  * `Recent-Success Window` (e.g. 7 days): Customer record where `lastSuccessfulSendAt IS NOT NULL AND lastSuccessfulSendAt >= NOW() - INTERVAL '7 days'`.

4. SINGLE-VALUED NORMATIVE DECISION CLOSURE (Zero Ambiguity)
- Bulk Invalid-Item & Cross-OA Behavior:
  * DECISION: Partial-Success (Resilient Bulk).
  * Rule: Valid customer IDs belonging to the active `botId` are processed. Invalid customer IDs, non-existent customers, or cross-OA customer IDs are skipped without aborting valid assignments. Response returns `200 OK` with summary counts `{ success: true, processedCount, skippedCount, skippedDetails }`.
- Duplicate Tag-Create Behavior:
  * DECISION: Fail-Fast Conflict.
  * Rule: Creating a tag with a `normalizedName` (`trim().toLowerCase()`) that already exists under the target `botId` returns `409 Conflict` (`Tag already exists for this OA`).
- Duplicate Assignment Behavior:
  * DECISION: Idempotent Success.
  * Rule: Assigning an already-assigned tag to a customer is a safe no-op. DB execution uses `ON CONFLICT (botId, lineUserId, tagId) DO NOTHING`. Returns `200 OK` with `{ success: true, assigned: true, newlyAssigned: false }`.
- Rename Conflict Behavior:
  * DECISION: Fail-Fast Conflict.
  * Rule: Renaming tag T1 to name N where `normalizedName(N)` matches another tag T2 under the same `botId` returns `409 Conflict`. Renaming to its own existing normalized name (case-only update, e.g. "vip" -> "VIP") is permitted and updates `name`.
- Delete Tag Behavior:
  * DECISION: Cascading Assignment Cleanup.
  * Rule: Deleting tag T removes the row from `tags` and automatically cascades to delete all assignment rows in `customer_tags` for `(botId, tagId)`. Customer entity records in `customers` are NEVER deleted. Returns `200 OK`.
- Deterministic Ordering:
  * DECISION: Secondary Unique Key Tie-Breaker (`createdAt DESC, lineUserId DESC`).
  * Rule: All customer/segmentation query results are sorted by `cust.createdAt DESC, cust.lineUserId DESC`. Because `lineUserId` is unique per `botId`, ordering is 100% deterministic across query runs and pagination pages.
- Pagination Contract:
  * DECISION: Zero-Indexed Offset with Limit Cap.
  * Rule: API accepts `limit` (default 50, max 100) and `offset` (default 0). Response includes `{ success: true, data: [...], meta: { total, limit, offset, hasMore } }`.
- API Fail-Fast Order & HTTP Status:
  * Step 1: Query/Body format validation -> `400 Bad Request` if invalid.
  * Step 2: Active OA context check (`cleanBotId === activeBotId`) -> `409 Conflict` if mismatched.
  * Step 3: Resource existence check -> `404 Not Found` if tag/customer missing.
  * Step 4: Uniqueness conflict check -> `409 Conflict` on name collisions.
  * Step 5: Successful execution -> `200 OK` / `201 Created`.
- selectedUsers Composition with Filters:
  * DECISION: Selection Priority & Hybrid Union.
  * Rule: In UI (`index.html`), when manual customer check-boxes are selected (`selectedUsers.length > 0`), bulk operations target `selectedUsers`. When `selectedUsers` is empty, bulk operations target all customers matching active filter criteria. Filter queries populate the UI list, and checkboxes operate on top of filtered views.

5. FUTURE API CANDIDATE CONTRACT (Complete Specification)
- `GET /api/tags?botId=:botId`
  * Active OA check -> 409 Conflict if not active.
  * Returns 200 OK `{ success: true, tags: TagDto[] }`.
- `POST /api/tags`
  * Request: `{ botId: string, name: string }`.
  * Active OA check. Validate `name` length 1..50.
  * Returns 201 Created `{ success: true, tag: TagDto }`. Returns 409 Conflict if name exists.
- `PUT /api/tags/:tagId`
  * Request: `{ botId: string, name: string }`.
  * Active OA check. Validate `tagId` > 0 and `name` length 1..50.
  * Returns 200 OK `{ success: true, tag: TagDto }`. Returns 404 Not Found if missing, 409 Conflict if duplicate.
- `DELETE /api/tags/:tagId?botId=:botId`
  * Active OA check.
  * Returns 200 OK `{ success: true, deletedTagId: number, unassignedCount: number }`. Cascades assignments.
- `POST /api/customers/:lineUserId/tags`
  * Request: `{ botId: string, tagIds: number[] }`.
  * Active OA check. Idempotent assignment. Returns 200 OK.
- `DELETE /api/customers/:lineUserId/tags/:tagId?botId=:botId`
  * Active OA check. Returns 200 OK.
- `POST /api/tags/bulk-assign`
  * Request: `{ botId: string, tagId: number, lineUserIds: string[] }`.
  * Active OA check. Partial-success resilient. Returns 200 OK `{ success: true, processedCount, skippedCount, skippedDetails }`.
- `POST /api/tags/bulk-unassign`
  * Request: `{ botId: string, tagId: number, lineUserIds: string[] }`.
  * Active OA check. Partial-success resilient. Returns 200 OK `{ success: true, processedCount, skippedCount, skippedDetails }`.
- `GET /api/customers` (Segmentation Extension)
  * Query params: `botId` (required), `search` (optional), `isBlocked` (optional, boolean), `tagIds` (optional, comma-separated), `tagMode` ('ANY' | 'ALL', default 'ANY'), `activityWindow` (optional), `limit` (default 50), `offset` (default 0).
  * Active OA check (409 Conflict if not active). Returns 200 OK `{ success: true, data: [...], meta: { total, limit, offset, hasMore } }`.

6. BOUNDED IMPLEMENTATION SPLIT (WP1 / WP2 / WP3 / R1-CLOSE)
- Sub-package WP1: Tag Domain Persistence & CRUD
  * Purpose: Create `Tag` entity, `customer_tags` join table DDL in `DatabaseInitService`, and Tag management endpoints (List, Create, Rename, Delete).
  * Allowed Files: `src/entities/tag.entity.ts` [NEW], `src/entities/customer-tag.entity.ts` [NEW], `src/database-init.service.ts` [MODIFY], `src/app.controller.ts` [MODIFY], `src/app.controller.spec.ts` [MODIFY].
  * Exclusions: Customer assignment endpoints, bulk tagging APIs, segmentation filter extensions, `index.html` frontend controls.
  * Acceptance Boundary: Unit & integration tests for Tag CRUD, OA fencing, duplicate name 409 conflict, cascade delete of assignments.
- Sub-package WP2: Customer Tag Assignment & Query Engine
  * Purpose: Implement single/bulk customer tag assignments and extended segmentation queries (`tagIds`, `tagMode=ANY|ALL`, `search`, `isBlocked`, activity window) with batch tag loading (no N+1).
  * Allowed Files: `src/app.controller.ts` [MODIFY], `src/app.controller.spec.ts` [MODIFY].
  * Exclusions: `index.html` UI controls, Worker changes, campaign execution pipeline changes.
  * Acceptance Boundary: Integration tests for bulk assign/unassign partial success, ANY/ALL tag logic + activity metrics, deterministic ordering `(createdAt DESC, lineUserId DESC)`, pagination envelope, no N+1 query verification.
- Sub-package WP3: Frontend Tag Management & Safe UI Integration
  * Purpose: Add tag management UI, assignment affordances, tag filter controls, safe DOM rendering (`textContent`), and stale OA response discard protection in `index.html`.
  * Allowed Files: `index.html` [MODIFY].
  * Exclusions: Backend `src/**` changes, Worker changes, LINE API calls.
  * Acceptance Boundary: End-to-end DOM tests for safe DOM rendering of tag chips, stale OA response discard on active bot switch, bulk tag action integration with `selectedUsers`.
- Sub-package R1/CLOSE: Final Evidence Verification & Documentation Closure
  * Purpose: Execute final regression tests, verify zero code drift, synchronize control docs, and prepare final evidence report.
  * Allowed Files: `project-docs/**` ONLY.
  * Exclusions: All `src/**`, `index.html`, package files.
  * Acceptance Boundary: Full test suite pass, `git diff --check` pass, control docs synced, `STATUS: READY_FOR_CHATGPT_REVIEW`.

7. COMPLETE TEST / ACCEPTANCE CONTRACT
- Unit & integration tests in `src/app.controller.spec.ts`:
  1. OA Context Fencing & Active OA Check: verify 409 Conflict when requesting inactive `botId`.
  2. Tag Normalization & Fail-Fast Duplicate: verify "VIP" and "vip" trigger 409 Conflict under same botId.
  3. Customer Tag Assignment Idempotency: verify duplicate assignment returns 200 OK without duplicate DB rows.
  4. Tag Delete Cascade: verify deleting tag removes `customer_tags` rows while `customers` rows remain intact.
  5. Bulk Assign/Unassign Partial Success: verify valid customer IDs succeed and invalid/cross-OA IDs are skipped in summary.
  6. ANY vs ALL Tag Filtering: verify exact customer matching for ANY (OR) vs ALL (AND) tag modes.
  7. Combined Activity Metric + Tag Filtering: verify filtering by Tag + `lastSuccessfulSendAt` / `isBlocked`.
  8. Deterministic Ordering + Pagination Envelope: verify stable `(createdAt DESC, lineUserId DESC)` ordering across page offsets.
  9. Blocked Customer Protection (`isBlocked`): verify `CampaignJobService` excludes `isBlocked = true` customers regardless of tags.
  10. Safe DOM Rendering: verify malicious tag names render securely via `textContent`.
  11. Stale OA Response Discard: verify switching active bot in UI discards pending response payloads.
  12. Batch Tag Query (No N+1): verify single SQL query loads tags for multiple customer results.

8. MANDATORY PROVENANCE & EXPLICIT STATEMENTS
- Materially Inspected Files: `src/customer.entity.ts`, `src/app.controller.ts`, `src/app.controller.spec.ts`, `src/database-init.service.ts`, `index.html`, `package.json`.
- Decisions Closed: All 9 normative decisions closed with single deterministic rules.
- Unresolved Decisions / Gaps: NONE.
- Later Schema Change Required: YES (New `tags` table and `customer_tags` join table required when implementation is authorized).
- Changed Control Docs: `project-docs/EXECUTION_GATE.md`, `project-docs/ACTIVE_TASK.md`, `project-docs/CHAT_HANDOFF.md`, `project-docs/CURRENT_STATE.md`, `project-docs/PROJECT_STATUS_ROADMAP.md`.
- git diff --check Result: PASS.
- Test/Build Execution Status: NOT RUN / NOT REQUIRED FOR EVIDENCE-ONLY.
- Evidence Classification: REPOSITORY INSPECTION / LOCAL REPORTED.
- GitHub CI Status: NOT CHECKED / LOCAL REPOSITORY TRUTH ONLY.
- EXPLICIT STATEMENT: NO IMPLEMENTATION OCCURRED.
