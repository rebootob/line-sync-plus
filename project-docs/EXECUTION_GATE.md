# EXECUTION GATE

CONTROL_VERSION: 31

TASK_ID:
P3-WP002-R2

PARENT_TASK:
P3-WP002-R1

AUTHORIZATION_REVISION:
P3-WP002-R2-EVIDENCE-CLOSURE

TITLE:
P3-WP002-R2 — TEST-ONLY + CONTROL-DOC Evidence Closure

STATUS:
READY_FOR_CHATGPT_REVIEW

AUTHORIZE_EXECUTION:
FALSE

AUTHORIZED_BY:
Project Owner (P3-WP002-R2 Evidence Closure)

AUTHORIZATION_REF:
Owner authorized P3-WP002-R2 TEST-ONLY + CONTROL-DOC Evidence Closure according to the bounded scope recorded in this gate.

CONTROL_PLANE:
ChatGPT

EXECUTION_PLANE:
Antigravity

CANONICAL_BRANCH:
main

CONTROL_UPDATE_PARENT_HEAD:
9b2a110dfe4f04302a4b6b60bdbc48dfde274009

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

CODE_BASELINE_HEAD:
03dd35a5d6b29c6394f93f16061bfaddb5f10174

IMPLEMENTATION_CANDIDATE_HEAD:
03dd35a5d6b29c6394f93f16061bfaddb5f10174

REVIEWED_IMPLEMENTATION_HEAD:
03dd35a5d6b29c6394f93f16061bfaddb5f10174

REVIEW_RESULT:
SOURCE_PASS / EVIDENCE_CORRECTIVE_REQUIRED

ACCEPTED_IMPLEMENTATION_HEAD:
NONE

IMPORTANT:
The future P3-WP002-R2 TEST-ONLY commit MUST NOT be recorded as an implementation HEAD. The reviewed implementation remains 03dd35a5d6b29c6394f93f16061bfaddb5f10174 until independent acceptance says otherwise.

PROJECT_STATE:
PHASE_0: CLOSED / PASS
PHASE_1: CLOSED / PASS
PHASE_2: CLOSED / PASS
PHASE-2-CLOSE: CLOSED_PASS
PHASE_3: IN PROGRESS
PHASE_3_TITLE: Audience & Customer Intelligence
ACTIVE_WORK_PACKAGE: P3-WP002-R2
P3-WP001: CLOSED / PASS
P3-WP001-R1: CORRECTED / SUPERSEDED_BY_C1
P3-WP001-R1-C1: CLOSED_PASS
P3-WP001-CLOSE: CLOSED_PASS
P3-WP001-CLOSE-C1: CLOSED_PASS
P3-WP002-PRE1: COMPLETE / DEFINITION READY
P3-WP002: CORRECTIVE REQUIRED / AWAITING_R2_REVIEW
P3-WP002-R1: CORRECTIVE REQUIRED / SUPERSEDED_BY_R2
P3-WP002-R2: READY_FOR_CHATGPT_REVIEW
P3-WP003: FUTURE / NOT AUTHORIZED
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_REVIEW

--------------------------------------------------
PURPOSE — P3-WP002-R2 TEST-ONLY + CONTROL-DOC EVIDENCE CLOSURE
--------------------------------------------------

Close the remaining P3-WP002 regression-evidence gap only.

ChatGPT independent review of P3-WP002-R1 established:
- SOURCE / ARCHITECTURE: PASS
- DB-SIDE AGGREGATION: PASS
- TIME-WINDOW PRODUCTION LOGIC: PASS
- SAFE DOM PRODUCTION LOGIC: PASS
- PRODUCTION CODE CORRECTIVE STILL NEEDED: NO

The only remaining blocking item is TEST EVIDENCE + CONTROL DOCUMENT TRUTH.

--------------------------------------------------
AUTHORIZED FILES — NEXT FRESH R2 EXECUTION RUN
--------------------------------------------------

R2 may modify ONLY:

- src/app.controller.spec.ts

and, at completion, these same five control documents:

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
- any unrelated file

If any prohibited production file appears necessary, STOP and return to the Control Plane. Do not expand scope.

--------------------------------------------------
REQUIRED R2 REGRESSION EVIDENCE
--------------------------------------------------

1. malformed botId -> HTTP 400; customer query ZERO; activity createQueryBuilder ZERO.
2. no active OA -> HTTP 409; customer query ZERO; activity query ZERO.
3. mismatched OA -> HTTP 409; customer query ZERO; activity query ZERO.
4. Assert ACTUAL QueryBuilder SQL expressions for:
   - COUNT success
   - MAX successful sentAt
   - COUNT failed
   - COUNT reconcile_required
   - deterministic latest ordered by createdAt DESC, id DESC
5. Strict SQL scope:
   - WHERE job.botId = :cleanBotId
   - GROUP BY job.lineUserId
6. With at least 3 customers:
   - createQueryBuilder exactly once
   - getRawMany exactly once
   - no N+1
7. campaignJobRepository.find MUST NOT be used for this customer-activity endpoint.
8. CampaignSendPart read/query MUST NOT be used for this customer-activity endpoint.
9. Customer.createdAt/updatedAt cannot influence activity metrics and are not exposed in DTO.
10. malicious latestJobStatus renders as literal text only with zero IMG/SCRIPT/SVG payload nodes.
11. Fixed/deterministic clock proof for 7-day:
    - exactly now PASS
    - exactly now-7d PASS
    - future FAIL
    - invalid FAIL
12. Fixed/deterministic clock proof for 30-day:
    - exactly now PASS
    - exactly now-30d PASS
    - future FAIL
    - invalid FAIL
13. NEVER_SUCCESS:
    - successfulJobCount == 0 -> MATCH
    - successfulJobCount > 0 + null lastSuccessfulSendAt -> NOT MATCH

Preserve existing regression evidence:
- blocked customer checkbox disabled
- selectedUsers checked behavior
- stale OA response discard

TEST INTEGRITY:
- Tests must execute ACTUAL production code.
- No copied production functions.
- No .only / .skip.
- Do not weaken existing tests.

--------------------------------------------------
R2 VALIDATION CONTRACT — NEXT FRESH RUN ONLY
--------------------------------------------------

Required commands:

npm test -- --runInBand
npm run build
git diff --check

Require all PASS.

Evidence classification:
LOCAL REPORTED

GitHub CI/status:
NONE unless actual GitHub evidence exists.

This control-update run MUST NOT execute those R2 tests and MUST NOT modify src/app.controller.spec.ts.

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

True exactly-once physical LINE delivery: NOT GUARANTEED.
Never automatically resend an ambiguous physical send.

--------------------------------------------------
PROGRESS / LIFECYCLE
--------------------------------------------------

Official accepted roadmap progress estimate: ~56%
Practical implementation progress estimate: ~61%

These percentages are planning estimates, NOT acceptance evidence.

Current blocking item:
P3-WP002-R2 TEST-ONLY evidence closure.

Exact lifecycle:
CONTROL UPDATE
-> COMMIT/PUSH
-> STOP
-> FRESH NEW RUN/CHAT
-> execute P3-WP002-R2 gate only
-> READY_FOR_CHATGPT_REVIEW
-> STOP
-> ChatGPT independent review

P3-WP003 MUST NOT start automatically.
