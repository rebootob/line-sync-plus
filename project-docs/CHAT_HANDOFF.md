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

* **ACTIVE_WORK_PACKAGE**: `NONE`
* **PHASE_0**: `CLOSED / PASS`
* **REL-WP003 — Durable Send-Part Ledger + Multipart Crash Safety**: `CLOSED / PASS`
  - **REL-WP003-R1 — Critical Crash-Safety Corrective**: `CORRECTIVE REQUIRED / SUPERSEDED`
  - **REL-WP003-R2 — Final Crash-Safety Corrective**: `CORRECTIVE REQUIRED / SUPERSEDED`
  - **REL-WP003-R3A — Backend Final Fencing Only**: `CORRECTIVE REQUIRED / SUPERSEDED`
  - **REL-WP003-R3B — Queue Prepass & Fail-Closed Ledger Migration**: `PASS / CLOSED`
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
- **Crash Safety Boundary & Operator Reconciliation (REL-WP003)**:
  - **Core Architectural Truth**: Do NOT claim true exactly-once physical delivery. The LINE Web UI remains outside our database transaction boundary.
  - **Accepted Safety Policy**: Never automatically resend an ambiguous physical send. Ambiguous state requires reconciliation before retry.
  - Safe migration of legacy schema: non-destructive migration deriving `partKey` from `partType` and `status = 'sent'` ➔ `'dispatched'`, fail-closed raw SQL execution, legacy fields removed from TypeORM entity.
  - `already_dispatched` handled before physical send: skips physical DOM events completely.
  - Immediate backend quarantine on reload ambiguity in `send-plan`: job and campaign paused (`reconcile_required` / `paused_reconcile`), leases stripped.
  - Queue Safety Pre-pass in `/campaign/next`: separately pre-scans ALL expired processing jobs without `take: 100` limit before selecting pending jobs.
  - Full ledger validation on `markSuccess`: 0 rows or missing multipart or ambiguous parts reject with 409 `send_ledger_incomplete` / `reconcile_required`.
  - Operator reconciliation hard-fenced: loopback, active OA, bot paused, `job.status === reconcile_required`, no active lease, target part only `armed` or `reconcile_required`.
  - `armSendPart` uses same `armRequestId` across transient retries; `confirmSendPart` enforces idempotency matching `armRequestId`.
  - Static Review: REL-WP003-R3B review PASS. All 271 executable unit tests passing. No GitHub CI status checks.

## Accepted Live / Controlled UAT Evidence (REL-WP003)

1. **Backend Migration Startup**: `Database schema verified/initialized successfully` on startup.
2. **Normal Text Send**: target: 1, success: 1, fail: 0, physical duplicate: 0.
3. **Durable Ledger Verification**: `job_status = success`, `partKey = text`, `part_status = dispatched`, `armedAt` and `dispatchedAt` present, `reconcileReason = null`.
4. **Clean Ambiguity Baseline**: verified zero `armed` or `reconcile_required` rows before test.
5. **Controlled DB-Only Ambiguity Fixture**: job `processing`, part `armed`, zero physical LINE send.
6. **Send-Plan Ambiguity Detection**: `POST /api/campaign/send-plan` returned `success = true`, `isFullyDispatched = false`, `hasQuarantine = true`.
7. **Post-Quarantine DB State**: `job = reconcile_required`, `part = reconcile_required`, `reconcileReason = 'quarantined_on_reload_ambiguity'`, `campaign = paused_reconcile`, `leaseToken`/`leaseOwner`/`leaseExpiresAt` cleared.
8. **Operator Reconciliation GET**: synthetic campaign/job/ambiguous part visible while Master Bot PAUSED.
9. **Operator Resolution**: `confirmed_not_sent_retry` returned `success = true`, zero physical LINE sends.
10. **Cleanup Verification**: DB inspection verified `CAMPAIGN FOUND = 0`, `JOB FOUND = 0`, `PARTS FOUND = 0`. Clean baseline restored.

## Exact Recommended Next Step

Phase 0 (Security & Reliability Foundation) is **COMPLETE and CLOSED (PASS)**.
All foundation work packages (`SEC-WP001`, `OPS-WP001`, `REL-WP001`, `OA-WP001`, `SYNC-WP001`, `SAFE-WP001`, `REL-WP002`, `REL-WP003`) are CLOSED / PASS.
Ready for Phase 1 planning / execution.
