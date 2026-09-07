# EXECUTION GATE

CONTROL_VERSION: 28

TASK_ID:
P3-WP002

PARENT_TASK:
PHASE-3

AUTHORIZATION_REVISION:
P3-WP002-IMPL

TITLE:
P3-WP002 — Outbound Activity Intelligence

STATUS:
AUTHORIZED_FOR_EXECUTION

CODE_BASELINE_HEAD:
7ca0a0dcde5896f18a8254f4a94a74a776d7a36e

IMPLEMENTATION_CANDIDATE_HEAD:
NONE / PENDING_EXECUTION

REVIEWED_IMPLEMENTATION_HEAD:
NONE

ACCEPTED_IMPLEMENTATION_HEAD:
NONE

AUTHORIZATION_REF:
Owner authorized P3-WP002 Outbound Activity Intelligence implementation according to accepted PRE1 definition

AUTHORIZE_EXECUTION:
TRUE

AUTHORIZED_BY:
Project Owner (P3-WP002 Outbound Activity Intelligence implementation)

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
ACTIVE_WORK_PACKAGE: P3-WP002
P3-WP001: CLOSED / PASS
P3-WP001-R1: CORRECTED / SUPERSEDED_BY_C1
P3-WP001-R1-C1: CLOSED_PASS
P3-WP001-CLOSE: CLOSED_PASS
P3-WP001-CLOSE-C1: CLOSED_PASS
P3-WP002-PRE1: COMPLETE / DEFINITION READY
P3-WP002: AUTHORIZED_FOR_EXECUTION
P3-WP003: FUTURE / NOT AUTHORIZED
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_EXECUTION

--------------------------------------------------
OBJECTIVE — P3-WP002 OUTBOUND ACTIVITY INTELLIGENCE
--------------------------------------------------

Implement P3-WP002 (Outbound Activity Intelligence) extending customer intelligence with authoritative outbound campaign activity metrics derived from existing OA-scoped CampaignJob execution data.

IMPORTANT: This gate is EXECUTABLE (AUTHORIZE_EXECUTION: TRUE). Project Owner has explicitly authorized bounded implementation of P3-WP002.

--------------------------------------------------
PHASE 3 OBJECTIVE & WORK PACKAGE SCOPE
--------------------------------------------------

Objective:
Improve audience understanding and selection using only authoritative OA-scoped customer and existing outbound campaign data, while preserving privacy and all accepted delivery-safety invariants.

Work Packages:
- P3-WP001 — Customer Intelligence Foundation (CLOSED / PASS, Accepted Implementation HEAD: f9a097a7579c1a357506816656b10c01f68be6ac)
- P3-WP002 — Outbound Activity Intelligence (AUTHORIZED_FOR_EXECUTION)
- P3-WP003 — Persistent Tags & Advanced Segmentation (FUTURE / NOT AUTHORIZED)

--------------------------------------------------
P3-WP002 AUTHORIZED IMPLEMENTATION CONTRACT
--------------------------------------------------

1. Authoritative Customer Identity:
- Scoped strictly by (botId + lineUserId).
- Primary activity source is CampaignJob.
- CampaignSendPart is NOT a customer activity counter.
- Do NOT use Customer.updatedAt as activity.
- Do NOT reuse or modify /api/analytics.
- Do NOT infer legacy jobs with botId = NULL into any OA.
- No inbound chat data, message-body analytics, read receipts, online status, AI profiling, or behavioral inference.

2. Authoritative Activity Metrics:
- successfulJobCount: COUNT(CampaignJob) for exact (botId + lineUserId) with status = 'success'
- lastSuccessfulSendAt: MAX(CampaignJob.sentAt) for status = 'success'
- failedJobCount: COUNT(CampaignJob) for status = 'failed' (titled "Failed Jobs", NOT "Failed Sends")
- reconcileRequiredCount: COUNT(CampaignJob) for status = 'reconcile_required'
- latestJobStatus: CURRENT status of the most recently CREATED OA-attributed CampaignJob (tie-break by createdAt DESC, id DESC)
- latestJobCreatedAt: createdAt of the latest created CampaignJob (tie-break by createdAt DESC, id DESC)

3. Backend & Query Invariants:
- Single OA-scoped CampaignJob aggregate query (WHERE job.botId = :cleanBotId GROUP BY job.lineUserId).
- NO N+1 per-customer queries.
- Fail closed on query failure (do NOT convert DB error into zero metrics).
- Strict DTO allowlist (no secrets, errorReason, or profile extra fields).

4. Frontend & UI Filters:
- Compact Outbound Activity presentation in customer table using safe DOM construction only (createElement, textContent, safe attributes).
- Display semantics for successfulJobCount === 0 ("ยังไม่มี Successful Job") and successfulJobCount > 0 with null lastSuccessfulSendAt ("มี Successful Job แต่ไม่พบเวลาที่บันทึก").
- Activity filters: ALL, NEVER_SUCCESS (successfulJobCount === 0), SUCCESS_WITHIN_7_DAYS, SUCCESS_WITHIN_30_DAYS, HAS_FAILED_JOBS, RECONCILIATION_REQUIRED.
- OA stale-response discard protection (verify requestBotId === currentActiveBotId before committing customer data).

--------------------------------------------------
FUTURE WORK PACKAGES (NOT AUTHORIZED)
--------------------------------------------------

- P3-WP003 — Persistent Tags & Advanced Segmentation: Additive schema for tags and customer-tag assignments. Requires separate explicit Owner authorization. FUTURE / NOT AUTHORIZED.

--------------------------------------------------
ACCEPTED AUTOMATED TEST EVIDENCE & INVARIANTS
--------------------------------------------------

- Full Jest Test Suite: 533/533 PASS
- Failures: 0
- Evidence Classification: LOCAL REPORTED
- GitHub CI / Status Workflow Evidence: NONE
- Worker Version: 28.16
- Required Worker Version: 28.16
- Runtime Contract Version: 2
- Privacy & Safety Boundary: Customer intelligence uses existing directory metadata and campaign execution metadata only. No LINE chat content or private message semantics collected or inferred.
- Safety Policy: Never automatically resend an ambiguous physical send. True exactly-once physical LINE delivery across LINE Web UI boundary is NOT guaranteed.
