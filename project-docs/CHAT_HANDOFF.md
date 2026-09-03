# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* Working Tree: Clean (REL-WP002 CLOSED / PASS)
* Baseline: 82ebe5a147087fb325687028abdffeb6fa096cf9

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.16) running inside `chat.line.biz`.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status

* **ACTIVE_WORK_PACKAGE**: `REL-WP003-R1`
* **PHASE_0**: `IN PROGRESS`
* **REL-WP003 — Durable Send-Part Ledger + Multipart Crash Safety**: `NOT CLOSED / CORRECTIVE REQUIRED`
* **REL-WP003-R1 — Critical Crash-Safety Corrective**: `READY_FOR_CHATGPT_REVIEW`
* **REL-WP002 — Durable Job Lease + Heartbeat + Stale Worker Fencing**: `CLOSED / PASS`
* **REL-WP002-R1 — Lease Loss Semantics + Atomic Finalization + Retry + Stop Fencing**: `CORRECTED / SUPERSEDED`
* **REL-WP002-R2 — Serialize Lease Finalization and Circuit Breaker Stop**: `CORRECTIVE REQUIRED / SUPERSEDED`
* **REL-WP002-R3 — Complete R2 Corrective Exactly**: `CLOSED / PASS`
* **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `CLOSED / PASS`
  - **SAFE-WP001-R1**: `CLOSED / PASS`
  - **SAFE-WP001-R2**: `CLOSED / PASS`
  - **SAFE-WP001-R3**: `CLOSED / PASS`
* **SYNC-WP001 — LINE OA Customer Directory Sync to DB**: `CLOSED / PASS`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **REL-WP001**: `CLOSED / PASS`
* **Version Contracts**:
  - Worker Version: `28.16`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.16`

## Accepted REL-WP002 Live UAT Evidence

- **Precheck**: Dashboard Runtime Contract v2, Required Worker v28.15, Master Bot PAUSED before campaign creation, Active OA aligned, Worker v28.15 loaded.
- **Campaign**: Name: `"แคมเปญ 3/9/2026 8:6"`, Type: text, Text: `"1111"`, Targets: 2, Initial status: pending, Exactly 2 queued jobs.
- **Execution**: Master Bot enabled only after preparation, Worker claimed and processed both jobs, Recipient verification occurred before send, LINE send observed for both recipients, Both returned success, Worker returned to OA main page between/after jobs.
- **Errors**: Zero visible `JOB_LEASE_LOST`, `lease_lost`, `OA_CONTEXT_MISMATCH`, or `RECIPIENT_UNVERIFIED`.
- **Results**: Target = 2, Success = 2, Failed = 0, Status = completed, Timestamps: `08:10:18`, `08:10:30`.
- **Post-run**: Master Bot returned to PAUSED, Account Protection remained ON, 10m = 2/60, 1h = 2/300, Next Send = now, Cooling = none.

## Accepted Safety Contract & Implementation Summary

- **CampaignJob Lease Schema**: `leaseToken` (varchar 64), `leaseOwner` (varchar 128), `leaseExpiresAt` (timestamp), `leaseHeartbeatAt` (timestamp).
- **Lease Lifecycle**: 60s backend lease on claim (`GET /api/campaign/next`), ~10s heartbeat loop (`POST /api/campaign/heartbeat`) extending active leases by 60s.
- **Strict Fencing**: Worker instance regex validation (`^ts_[0-9]{10,17}_[a-z0-9]{4,32}$`), pre-send lease renewal before clicks/Enter, upstream leadership/recipient/OA/SAFE checks intact.
- **Transactional Finalization**: `markSuccess`, `markFail`, and `stopCampaign` lock `Campaign` row (and calling `CampaignJob` in stop) with `pessimistic_write`.
- **Integrated Circuit Breaker**: 10 errors finalize via `POST /campaign/fail` with `errorOverflow: true` (increments failedCount, stops campaign `stopped_error`, clears remaining leases).
- **Customer Rollback**: DB error updating blocked customer in `markFail` rolls back transaction.
- **Post-Commit Telegram**: Sent only after DB transaction resolves.
- **Crash Safety Invariant & Operator Reconciliation (REL-WP003-R1)**:
  - True exactly-once delivery cannot be guaranteed across the unobservable LINE Web UI crash boundary.
  - Policy: Never automatically resend an ambiguous physical send.
  - Durable state machine: `pending` ➔ `armed` ➔ `dispatched` | `reconcile_required`.
  - Ephemeral `dispatchToken` in memory only; zero network gap after arm before physical DOM dispatch.
  - Confirmation retry loops on confirm API only without repeating physical send.
  - Page crash discovering `armed` or `reconcile_required` triggers quarantine without physical send (`CampaignJob = reconcile_required`, `Campaign = paused_reconcile`, no counters incremented).
  - Operator reconciliation (`GET /api/campaign/reconciliation`, `POST /api/campaign/reconciliation/resolve`) fenced to loopback + active OA + Master Bot PAUSED.
  - Actions: `confirmed_sent` or `confirmed_not_sent_retry`.
  - No Live UAT performed. All 254 executable unit tests passing.

## Exact Recommended Next Step

REL-WP003-R1 implementation complete and validated with all 254 tests passing.
No Live LINE UAT. Do NOT send any additional LINE messages. Ready for ChatGPT review.
