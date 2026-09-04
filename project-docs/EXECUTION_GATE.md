# EXECUTION GATE

CONTROL_VERSION: 13

TASK_ID:
P2-WP003

TITLE:
Scheduled Queue Controls V2

STATUS:
AUTHORIZED_FOR_EXECUTION

CODE_BASELINE_HEAD:
ef5d5b47e33e1e63648dd33dde40c35a638c2de2

PARENT_TASK:
P2-WP003

AUTHORIZED_BY:
Project Owner

CONTROL_PLANE:
ChatGPT

EXECUTION_PLANE:
Antigravity

CANONICAL_BRANCH:
main

PROJECT_STATE:
PHASE_0: CLOSED / PASS
PHASE_1: CLOSED / PASS
PHASE_2: IN PROGRESS
PHASE_2_TITLE: Campaign Builder v2
P2-WP001: CLOSED / PASS
P2-WP001-R1: CLOSED / PASS
P2-WP002: CLOSED / PASS
P2-WP002-R1: SUPERSEDED_BY_R2
P2-WP002-R2: CLOSED / PASS
P2-WP002-CLOSE: CLOSED_PASS
P2-WP003: AUTHORIZED_FOR_EXECUTION
ACTIVE_WORK_PACKAGE: P2-WP003
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_REVIEW

--------------------------------------------------
OBJECTIVE
--------------------------------------------------

Harden the EXISTING Scheduled Campaign control surface for P2-WP003 (Scheduled Queue Controls V2).

P2-WP003 Scope:
1. Operator Stop OA fencing (require botId matching activeBotId; HTTP 400 if missing/invalid, HTTP 409 if active-OA mismatch; scoped lookup by campaignId + botId).
2. Preserve Worker-Driven Stop contract (when body.jobId is present, preserve active job lease fencing, pessimistic locks, stopped_limit/error, and worker lease checks untouched).
3. State-Safe Operator Stop (accept stop only for scheduled, paused, pending, processing => stopped_user; reject completed, failed, stopped_*, paused_reconcile without mutation).
4. Scheduled List OA Isolation & Safe DTO (GET /api/campaigns/scheduled?botId=... fenced to active OA, returning safe DTO with id, name, messageType, status, scheduledAt, target/success/failed counts, timestamps; exclude message bodies, images, URLs, user IDs, tokens, leases, secrets).
5. Stale Scheduled-List Response Fencing (monotonic request generation and captured botId in openScheduledModal(); stale/old responses return with zero UI mutation and zero error display).
6. Reschedule Local Time Correctness (fix ISO <-> local wall-clock datetime conversion helpers for reschedule input without UTC string slicing; use browser local timezone semantics).
7. Safe Scheduled DOM Rendering (build Scheduled UI rows using document.createElement, textContent, addEventListener; zero innerHTML interpolation of user/backend data).
8. Truthful Action Failure Behavior (treat HTTP !ok or data.success !== true as failure, show backend error message, do not display success, refresh Scheduled list if open).
9. Preserve Existing State Transitions (pause => paused; resume => scheduled if future, pending if due/past; reschedule => allowed only for scheduled/paused with valid future datetime).
10. Permanent Security & Safety Invariants (wrong-recipient fencing, recipient verification, OA isolation, single-worker lock, SAFE protection, durable lease, heartbeat, pre-send renewal, ARM/CONFIRM ledger, reconciliation fencing, ambiguous-send quarantine).

--------------------------------------------------
AUTHORIZED IMPLEMENTATION FILES
--------------------------------------------------

ONLY:
- src/app.controller.ts
- src/app.controller.spec.ts
- index.html

After implementation, supporting synchronization is allowed ONLY in:
- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md

--------------------------------------------------
PROHIBITED
--------------------------------------------------

DO NOT modify:
- run/**
- LineSyncApp.js
- Worker version (remains 28.16)
- src/runtime-version.ts (Required Worker 28.16, Runtime Contract 2)
- entities/**
- DB schema / migrations
- package*.json
- ARM / CONFIRM protocol
- send-part ledger
- lease/heartbeat protocol
- recipient verification
- reconciliation resolution contract
- Telegram
- analytics
- customer sync/group logic
- unrelated dashboard UI
- Phase 3, 4, 5
- any non-authorized file

--------------------------------------------------
VERIFICATION & SAFETY
--------------------------------------------------

NO LIVE LINE SEND UAT.
Master Bot remains PAUSED. Zero physical LINE sends.

Worker: 28.16 | Required Worker: 28.16 | Runtime Contract: 2
