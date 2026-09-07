# EXECUTION GATE

CONTROL_VERSION: 23

TASK_ID:
P3-WP001

PARENT_TASK:
PHASE-3

AUTHORIZATION_REVISION:
P3-WP001-IMPL

TITLE:
P3-WP001 — Customer Intelligence Foundation

STATUS:
READY_FOR_CHATGPT_REVIEW

CODE_BASELINE_HEAD:
c58d7e41c340590e5db9171305dbd8d9b16a4c2c

REVIEWED_IMPLEMENTATION_HEAD:
PENDING_CHATGPT_REVIEW

ACCEPTED_IMPLEMENTATION_HEAD:
NONE

AUTHORIZATION_REF:
P3-WP001 Customer Intelligence Foundation implementation according to accepted control contract

AUTHORIZE_EXECUTION:
FALSE

AUTHORIZED_BY:
Project Owner (P3-WP001 Customer Intelligence Foundation bounded implementation)

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
ACTIVE_WORK_PACKAGE: P3-WP001
P3-WP001: READY_FOR_CHATGPT_REVIEW
P3-WP002: FUTURE / NOT AUTHORIZED
P3-WP003: FUTURE / NOT AUTHORIZED
NEXT_CANDIDATE: P3-WP001
NEXT_CANDIDATE_STATUS: READY_FOR_CHATGPT_REVIEW

--------------------------------------------------
OBJECTIVE — PHASE 3 INITIATION & P3-WP001 DEFINITION
--------------------------------------------------

Initiate Phase 3 — Audience & Customer Intelligence in control documentation and establish the definition and scope for P3-WP001 (Customer Intelligence Foundation).

IMPORTANT: This gate is NON-EXECUTABLE (AUTHORIZE_EXECUTION: FALSE). Project Owner has authorized Phase 3 initiation and control-document definition ONLY. Source implementation of P3-WP001 is NOT authorized in this run.

--------------------------------------------------
PHASE 3 OBJECTIVE & PLANNED CAPABILITIES
--------------------------------------------------

Objective:
Improve audience understanding and selection using only authoritative OA-scoped customer and existing outbound campaign data, while preserving privacy and all accepted delivery-safety invariants.

Planned Work Packages:
- P3-WP001 — Customer Intelligence Foundation (DEFINED / AWAITING_OWNER_IMPLEMENTATION_AUTHORIZATION)
- P3-WP002 — Outbound Activity Intelligence (FUTURE / NOT AUTHORIZED)
- P3-WP003 — Persistent Tags & Advanced Segmentation (FUTURE / NOT AUTHORIZED)

--------------------------------------------------
P3-WP001 DEFINITION & SCOPE
--------------------------------------------------

1. Display Name Normalization:
- Preserve raw Customer.displayName unchanged (do NOT overwrite raw LINE display name).
- Derive cleanedDisplayName deterministically without blindly removing the first whitespace-delimited token.
- Preserve legitimate multi-word names. Avoid AI/LLM-based inference or probabilistic guessing.

2. OA-Scoped Customer Intelligence Contract:
- Scoped strictly by botId, preserving existing botId + lineUserId identity boundary.
- No cross-OA aggregation. Fail closed on mismatched OA context.

3. Safe Customer / Group DOM Rendering:
- Move dynamic customer/group/profile-derived text affected by P3-WP001 to safe DOM construction (createElement, textContent, safe attribute assignment).
- Do NOT interpolate untrusted displayName, cleanedDisplayName, lineUserId, group name, group description, or blockReason into executable HTML strings.
- Do NOT perform broad unrelated frontend refactoring.

4. Existing Filter Compatibility:
- Preserve keyword filtering, Active/Blocked, Named/Unnamed, selected customer behavior, static customer groups, and Phase 2 campaign builder behavior.

P3-WP001 Explicit Non-Scope:
- NO DB schema change, migration, new entity/table, persistent customer tags, activity table, Worker modification, LINE send-path modification, customer sync behavior expansion, inbound LINE conversation scraping, message body storage, read-receipt tracking, online-status tracking, AI profiling/scoring, Telegram changes, Phase 4 work, or Phase 5 work.

--------------------------------------------------
FUTURE WORK PACKAGES (NOT AUTHORIZED)
--------------------------------------------------

- P3-WP002 — Outbound Activity Intelligence: Derive customer activity metrics (last send, attempt, counts, status) from existing campaign_jobs without creating a new activity table initially. OA-scoped. FUTURE / NOT AUTHORIZED.
- P3-WP003 — Persistent Tags & Advanced Segmentation: Additive schema for tags and customer-tag assignments. Requires separate explicit Owner authorization. FUTURE / NOT AUTHORIZED.

--------------------------------------------------
ACCEPTED AUTOMATED TEST EVIDENCE & INVARIANTS
--------------------------------------------------

- Full Jest Test Suite: 525/525 PASS
- Failures: 0
- Evidence Classification: LOCAL REPORTED
- GitHub CI / Status Workflow Evidence: NONE
- Worker Version: 28.16
- Required Worker Version: 28.16
- Runtime Contract Version: 2
- All source files, Worker script, DB schema, and Telegram integration remain UNTOUCHED.
- Privacy & Safety Boundary: Customer intelligence uses existing directory metadata and campaign execution metadata only. No LINE chat content or private message semantics collected or inferred.
- Safety Policy: Never automatically resend an ambiguous physical send. True exactly-once physical LINE delivery across LINE Web UI boundary is NOT guaranteed.
