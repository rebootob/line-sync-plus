# EXECUTION GATE

CONTROL_VERSION: 32

TASK_ID:
P3-WP002-R3

PARENT_TASK:
P3-WP002-R2

AUTHORIZATION_REVISION:
P3-WP002-R3-FINAL-EVIDENCE-CORRECTIVE

TITLE:
P3-WP002-R3 — TEST-ONLY + CONTROL-DOC Final Evidence Corrective

STATUS:
READY_FOR_CHATGPT_REVIEW

AUTHORIZE_EXECUTION:
FALSE

AUTHORIZED_BY:
Project Owner

AUTHORIZATION_REF:
Owner authorized P3-WP002-R3 TEST-ONLY + CONTROL-DOC Final Evidence Corrective according to the bounded scope proposed by ChatGPT independent review.

CONTROL_PLANE:
ChatGPT

EXECUTION_PLANE:
Antigravity

CANONICAL_BRANCH:
main

CONTROL_UPDATE_PARENT_HEAD:
e9736490dde42d1b249e6fba3f9d63e929da909c

P3-WP002_BASELINE_HEAD:
7ca0a0dcde5896f18a8254f4a94a74a776d7a36e

P3-WP002_ORIGINAL_IMPLEMENTATION_HEAD:
956e576ffee2f194ce6e617531a58f336de2b280

P3-WP002_INITIAL_REVIEW_HEAD:
80a9f2dcafdb81e84f990e5593009091ab83bb4e

P3-WP002-R1_IMPLEMENTATION_HEAD:
03dd35a5d6b29c6394f93f16061bfaddb5f10174

P3-WP002-R1_REVIEW_READY_HEAD:
9b2a110dfe4f04302a4b6b60bdbc48dfde274009

P3-WP002-R2_EVIDENCE_HEAD:
e9736490dde42d1b249e6fba3f9d63e929da909c

CODE_BASELINE_HEAD:
e9736490dde42d1b249e6fba3f9d63e929da909c

IMPLEMENTATION_CANDIDATE_HEAD:
03dd35a5d6b29c6394f93f16061bfaddb5f10174

REVIEWED_IMPLEMENTATION_HEAD:
03dd35a5d6b29c6394f93f16061bfaddb5f10174

REVIEW_RESULT:
SOURCE_PASS / R2_EVIDENCE_CORRECTIVE_REQUIRED

ACCEPTED_IMPLEMENTATION_HEAD:
NONE

IMPORTANT:
R2 and R3 are TEST-EVIDENCE / CONTROL-DOC commits only. They MUST NOT become implementation HEADs. The reviewed production implementation remains 03dd35a5d6b29c6394f93f16061bfaddb5f10174 unless an independent acceptance decision explicitly changes that truth.

PROJECT_STATE:
PHASE_0: CLOSED / PASS
PHASE_1: CLOSED / PASS
PHASE_2: CLOSED / PASS
PHASE_3: IN PROGRESS
PHASE_3_TITLE: Audience & Customer Intelligence
ACTIVE_WORK_PACKAGE: P3-WP002-R3
P3-WP001: CLOSED / PASS
P3-WP002-PRE1: COMPLETE / DEFINITION READY
P3-WP002: CORRECTIVE REQUIRED / AWAITING_R3_REVIEW
P3-WP002-R1: SOURCE CORRECTIVE COMPLETE / SUPERSEDED_BY_EVIDENCE_CORRECTIVES
P3-WP002-R2: CORRECTIVE REQUIRED / SUPERSEDED_BY_R3
P3-WP002-R3: READY_FOR_CHATGPT_REVIEW
P3-WP003: FUTURE / NOT AUTHORIZED
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_REVIEW

--------------------------------------------------
INDEPENDENT REVIEW TRUTH LEADING TO R3
--------------------------------------------------

ChatGPT independent review at R2 evidence HEAD e9736490dde42d1b249e6fba3f9d63e929da909c established:

PASS:
- production source / architecture
- DB-side aggregation
- strict OA query scope
- no N+1 evidence
- no campaignJobRepository.find evidence
- no CampaignSendPart read/query evidence
- customer timestamp isolation evidence
- malicious latestJobStatus safe-DOM evidence
- NEVER_SUCCESS semantics
- R2 scope control

REMAINING CORRECTIVE ONLY:
1. The 7-day boundary test used now - 7d + 5000ms instead of EXACTLY now - 7d.
2. The 30-day boundary test used now - 30d + 5000ms instead of EXACTLY now - 30d.
3. The clock was not fixed/frozen deterministically while production handleFilters() calls Date.now().
4. Completion control docs did not record exact npm test result/count, build result, git diff --check result, exact changed files, and final evidence truth; stale pre-execution wording remained.

NO PRODUCTION CODE CORRECTIVE IS AUTHORIZED OR REQUIRED BY R3.

--------------------------------------------------
AUTHORIZED FILES — NEXT FRESH R3 EXECUTION RUN
--------------------------------------------------

During test corrective, R3 may modify ONLY:

- src/app.controller.spec.ts

At successful completion R3 may additionally update ONLY:

- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md

ABSOLUTELY PROHIBITED:

- src/app.controller.ts
- index.html
- run/**
- src/entities/**
- src/customer.entity.ts
- src/database-init.service.ts
- src/runtime-version.ts
- src/telegram.service.ts
- package*.json
- DB/schema/migrations/indexes
- dependency changes
- any unrelated file

If production code appears necessary, STOP and return to the Control Plane. Do not expand scope.

--------------------------------------------------
REQUIRED R3 FINAL EVIDENCE
--------------------------------------------------

A. FIXED / DETERMINISTIC CLOCK
- Use one fixed timestamp for the relevant frontend time-window proof.
- Ensure production handleFilters() sees that same fixed Date.now() value.
- The test must execute ACTUAL production frontend code loaded from index.html through the existing VM harness.
- Do not copy or reimplement production filtering logic inside the test.

B. EXACT 7-DAY BOUNDARY
Prove with the fixed clock:
- exactly FIXED_NOW -> PASS
- exactly FIXED_NOW - 7 days -> PASS
- future > FIXED_NOW -> FAIL
- invalid timestamp -> FAIL

The lower boundary MUST be mathematically exact. Do not add +1ms, +1000ms, +5000ms, or any inward offset.

C. EXACT 30-DAY BOUNDARY
Prove with the same deterministic principle:
- exactly FIXED_NOW -> PASS
- exactly FIXED_NOW - 30 days -> PASS
- future > FIXED_NOW -> FAIL
- invalid timestamp -> FAIL

The lower boundary MUST be mathematically exact. Do not add any inward offset.

D. PRESERVE ACCEPTED R2 EVIDENCE
Do not weaken or remove the existing R2 evidence for items 1-10 and 13, including:
- malformed botId fail-fast query-zero
- no active OA fail-fast query-zero
- mismatched OA fail-fast query-zero
- actual aggregate QueryBuilder SQL expressions
- WHERE job.botId = :cleanBotId
- GROUP BY job.lineUserId
- one QueryBuilder / one getRawMany for at least 3 customers
- no campaignJobRepository.find
- no CampaignSendPart read/query
- Customer.createdAt/updatedAt excluded from activity metrics/DTO
- malicious latestJobStatus literal text / zero IMG SCRIPT SVG payload nodes
- strict NEVER_SUCCESS semantics
- blocked customer checkbox disabled
- selectedUsers checked behavior
- stale OA response discard

TEST INTEGRITY:
- actual production code only
- no copied production helper/filter logic
- no .only
- no .skip
- no weakened assertions
- no production modification

--------------------------------------------------
R3 VALIDATION CONTRACT — NEXT FRESH RUN ONLY
--------------------------------------------------

Run exactly:

npm test -- --runInBand
npm run build
git diff --check

Require all PASS.

At completion, control docs MUST record:
- exact npm test PASS result
- exact test suite count
- exact test count
- exact pass/fail/skipped counts where reported
- npm run build PASS
- git diff --check PASS
- exact changed files
- evidence classification: LOCAL REPORTED
- GitHub CI/status truth: NONE unless actual GitHub evidence exists
- FINAL_R3_SHA after commit/push
- parent SHA

Execution results:
- npm test -- --runInBand: PASS (1 suite passed, 585 tests passed, 0 skipped, 0 failed)
- npm run build: PASS (exit code 0)
- git diff --check: PASS (exit code 0)
- Evidence classification: LOCAL REPORTED
- GitHub CI: NONE

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
PROGRESS / LIFECYCLE
--------------------------------------------------

Official accepted roadmap progress estimate: ~56%
Practical implementation progress estimate: ~61%

These are planning estimates, NOT acceptance evidence.

Current blocking item:
P3-WP002-R3 final TEST-ONLY evidence corrective.

Exact lifecycle:
CONTROL UPDATE
-> COMMIT/PUSH
-> STOP
-> FRESH NEW RUN/CHAT
-> execute P3-WP002-R3 gate only
-> run full validation
-> update completion evidence truth
-> READY_FOR_CHATGPT_REVIEW
-> COMMIT/PUSH
-> STOP
-> ChatGPT independent review

P3-WP003 MUST NOT start automatically.
