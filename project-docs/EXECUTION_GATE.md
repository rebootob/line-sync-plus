# EXECUTION GATE

CONTROL_VERSION: 30

TASK_ID:
P3-WP002-R1

PARENT_TASK:
P3-WP002

AUTHORIZATION_REVISION:
P3-WP002-R1-REVIEW

TITLE:
P3-WP002-R1 — Aggregate Query + Time-Window Truth + Final Evidence/Control Corrective

STATUS:
READY_FOR_CHATGPT_REVIEW

CODE_BASELINE_HEAD:
80a9f2dcafdb81e84f990e5593009091ab83bb4e

IMPLEMENTATION_CANDIDATE_HEAD:
03dd35a5d6b29c6394f93f16061bfaddb5f10174

REVIEWED_IMPLEMENTATION_HEAD:
NONE

ACCEPTED_IMPLEMENTATION_HEAD:
NONE

AUTHORIZATION_REF:
Owner authorized P3-WP002-R1 Aggregate Query + Time-Window Truth + Final Evidence/Control Corrective

AUTHORIZE_EXECUTION:
FALSE

AUTHORIZED_BY:
Project Owner (P3-WP002-R1 Corrective)

CONTROL_PLANE:
ChatGPT

EXECUTION_PLANE:
Antigravity

CANONICAL_BRANCH:
main

PROJECT_STATE:
PHASE_0: CLOSED / PASS
PHASE_1: CLOSED / PASS
PHASE_2: CLOSED / PASS
PHASE-2-CLOSE: CLOSED_PASS
PHASE_3: IN PROGRESS
PHASE_3_TITLE: Audience & Customer Intelligence
ACTIVE_WORK_PACKAGE: P3-WP002-R1
P3-WP001: CLOSED / PASS
P3-WP001-R1: CORRECTED / SUPERSEDED_BY_C1
P3-WP001-R1-C1: CLOSED_PASS
P3-WP001-CLOSE: CLOSED_PASS
P3-WP001-CLOSE-C1: CLOSED_PASS
P3-WP002-PRE1: COMPLETE / DEFINITION READY
P3-WP002: CORRECTIVE REQUIRED / AWAITING_R1_REVIEW
P3-WP002-R1: READY_FOR_CHATGPT_REVIEW
P3-WP003: FUTURE / NOT AUTHORIZED
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_REVIEW

--------------------------------------------------
OBJECTIVE — P3-WP002-R1 AGGREGATE QUERY + TIME-WINDOW TRUTH + FINAL EVIDENCE/CONTROL CORRECTIVE
--------------------------------------------------

Correct P3-WP002 implementation to:
1. Replace Node.js in-memory CampaignJob loading with exactly ONE DB-side CampaignJob QueryBuilder aggregate query grouped by lineUserId.
2. Fix 7-day and 30-day activity filter logic to strictly reject future and invalid timestamps while supporting lower boundary equality.
3. Ensure NEVER_SUCCESS is determined ONLY by successfulJobCount === 0.
4. Expand test suite to 39 explicit R1 assertions.
5. Fix supporting control document state and roadmap structure.

IMPORTANT: This gate is EXECUTABLE (AUTHORIZE_EXECUTION: TRUE). Project Owner has explicitly authorized bounded implementation of P3-WP002-R1.

--------------------------------------------------
PHASE 3 OBJECTIVE & WORK PACKAGE SCOPE
--------------------------------------------------

Objective:
Improve audience understanding and selection using only authoritative OA-scoped customer and existing outbound campaign data, while preserving privacy and all accepted delivery-safety invariants.

Work Packages:
- P3-WP001 — Customer Intelligence Foundation (CLOSED / PASS, Accepted Implementation HEAD: f9a097a7579c1a357506816656b10c01f68be6ac)
- P3-WP002 — Outbound Activity Intelligence (CORRECTIVE REQUIRED / R1 AUTHORIZED)
- P3-WP002-R1 — Aggregate Query + Time-Window Truth + Final Evidence/Control Corrective (CORRECTIVE_AUTHORIZED)
- P3-WP003 — Persistent Tags & Advanced Segmentation (FUTURE / NOT AUTHORIZED)

--------------------------------------------------
P3-WP002-R1 AUTHORIZED IMPLEMENTATION CONTRACT
--------------------------------------------------

1. DB-Side Aggregation:
- Single OA-scoped CampaignJob QueryBuilder aggregate query (`WHERE job.botId = :cleanBotId GROUP BY job.lineUserId`).
- `COUNT(*) FILTER (WHERE job.status = 'success')` as successfulJobCount
- `MAX(job.sentAt) FILTER (WHERE job.status = 'success')` as lastSuccessfulSendAt
- `COUNT(*) FILTER (WHERE job.status = 'failed')` as failedJobCount
- `COUNT(*) FILTER (WHERE job.status = 'reconcile_required')` as reconcileRequiredCount
- `latestJobStatus` & `latestJobCreatedAt` derived deterministically DB-side by `createdAt DESC, id DESC`.
- Exactly ONE `getRawMany()` query. NO N+1, NO `campaignJobRepository.find(...)` for activity.

2. Time Window & Filter Truth:
- 7-day & 30-day filters require `sendTime <= now` AND `sendTime >= now - window`.
- Future timestamps and invalid timestamps MUST NOT match.
- Exact lower boundary (`sendTime === now - window`) MUST match.
- NEVER_SUCCESS is determined ONLY by `successfulJobCount === 0`.

3. Safe Activity DOM:
- Compact presentation using `createElement`, `textContent`, safe property assignment.
- Dynamic activity values must never be injected via innerHTML.

--------------------------------------------------
FUTURE WORK PACKAGES (NOT AUTHORIZED)
--------------------------------------------------

- P3-WP003 — Persistent Tags & Advanced Segmentation: Additive schema for tags and customer-tag assignments. Requires separate explicit Owner authorization. FUTURE / NOT AUTHORIZED.

--------------------------------------------------
ACCEPTED AUTOMATED TEST EVIDENCE & INVARIANTS
--------------------------------------------------

- Full Jest Test Suite: 549/549 PASS (Initial P3-WP002 evidence; R1 evidence pending R1 execution)
- Failures: 0
- Evidence Classification: LOCAL REPORTED
- GitHub CI / Status Workflow Evidence: NONE
- Worker Version: 28.16
- Required Worker Version: 28.16
- Runtime Contract Version: 2
- Privacy & Safety Boundary: Customer intelligence uses existing directory metadata and campaign execution metadata only. No LINE chat content or private message semantics collected or inferred.
- Safety Policy: Never automatically resend an ambiguous physical send. True exactly-once physical LINE delivery across LINE Web UI boundary is NOT guaranteed.
