# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* Working Tree: Clean (Phase 0 CLOSED / PASS, MON-WP001 CLOSED / PASS)
* Implementation Baseline: 6729bb118e727f9ff3f559c8b4a8efe8c0c9ed38
* Closure-Doc Baseline: 443dfa96c8580fd55b6dcd0cde34dba4b968eb57

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
* **STATUS**: `STANDBY`
* **PHASE_0**: `CLOSED / PASS`
* **PHASE_1**: `IN PROGRESS`
* **MON-WP001 — Operational Health & Readiness**: `CLOSED / PASS`
* **MON-WP001-R1 — Truthful Health State Corrective**: `CLOSED / PASS`
* **MON-WP002 — Queue / Lease / Reconciliation Monitoring**: `CLOSED / PASS`
* **MON-WP003 — Alerts / Incident Visibility**: `CLOSED / PASS`
* **NEXT_CANDIDATE**: `NONE`
* **NEXT_CANDIDATE_STATUS**: `AWAITING_OWNER_DIRECTION`
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

## Implemented MON-WP001 / MON-WP001-R1 Operational Health Summary

- **Endpoint**: `GET /api/ops/health` (loopback only: `127.0.0.1`, `::1`, `::ffff:127.0.0.1`).
- **Data Returned**: Truthful status enum (`healthy | degraded | attention`), contract versions, database ping status (`SELECT 1`), master bot state, active OA (`true | false | null`), truthful worker status (`online` <=30s, `stale` >30s, `unknown`), OA alignment (`aligned: true | false | "unknown"`), scoped queue counts (`pending`, `processing`, `reconcileRequired` as `number | null`), scoped campaign counts (`pausedReconcile`, `stoppedError` as `number | null`).
- **Truthful Failure & Absent Scoping**:
  - Failed metric query returns `null` (never masked as 0) with `degraded` status.
  - No active OA returns `null` metrics (does NOT query global counts across all OAs) with `oa.active: false` and `attention` status.
  - Unknown readiness (worker unknown/stale, alignment unknown/mismatched) returns `attention` status (never `healthy`).
  - Infrastructure failures (DB ping error, OA runtime lookup error, metric query error) return `degraded` status.
- **Security & Privacy**: Zero tokens, zero credentials, zero PII, zero LINE chat data exposed. Read-only operation with zero side-effects on worker observation timestamps or heartbeats.
- **Dashboard UI**: Compact responsive card in `index.html` polling every 6 seconds, displaying `? Unknown` for null/unavailable metrics, displaying numeric 0 only on genuine success, and falling back gracefully on network errors.
- **Worker Script**: `run/LineSyncApp.js` UNTOUCHED (v28.16).
- **Unit Tests**: 23 tests in `src/app.controller.spec.ts` under MON-WP001, full test suite: 294/294 passing cleanly (LOCAL REPORTED evidence only; no GitHub CI/check runs existed).
- **Accepted Independent Review Baseline**:
  - Review HEAD: `6729bb118e727f9ff3f559c8b4a8efe8c0c9ed38`
  - Review Result: `PASS`
  - Status: `CLOSED / PASS`

## Implemented MON-WP002 Operational Queue / Lease / Reconciliation Monitoring Summary

- **Endpoint**: `GET /api/ops/queue` (loopback only: `127.0.0.1`, `::1`, `::ffff:127.0.0.1`).
- **Data Returned**: Truthful status enum (`healthy | degraded | attention`), active OA (`true | false | null`), queue counts (`pending`, `processing` as `number | null`), lease counts (`active`, `expired`, `missing`, `residual` as `number | null`), reconciliation counts (`jobs`, `parts`, `staleArmed`, `pausedCampaigns` as `number | null`).
- **Truthful Failure & Absent Scoping**:
  - Failed metric query returns `null` for all metrics (never masked as 0) with `degraded` status.
  - No active OA returns `null` metrics (does NOT query global counts across all OAs) with `oa.active: false` and `attention` status.
  - OA runtime lookup error returns `null` metrics with `oa.active: null` and `degraded` status.
- **Security & Privacy**: Zero tokens, zero credentials, zero PII, zero LINE chat data exposed. Read-only operation with zero side-effects.
- **Dashboard UI**: Compact responsive card in `index.html` polling every 6 seconds, displaying `? Unknown` for null/unavailable metrics, displaying numeric 0 only on genuine success, displaying warnings for positive anomalies, and falling back gracefully on network errors.
- **Worker Script**: `run/LineSyncApp.js` UNTOUCHED (v28.16).
- **Unit Tests**: 23 tests in `src/app.controller.spec.ts` under MON-WP002, full test suite: 317/317 passing cleanly (LOCAL REPORTED evidence only; no GitHub CI/check runs existed).
- **Current Acceptance Evidence**:
  - Accepted Review HEAD: `5b34269397afbd9046610c366d9f0c27bf3d5532`
  - Accepted Review Result: `PASS`
  - Work Package Status: `CLOSED / PASS`
  - Worker Version: `28.16` (unchanged)
  - Required Worker Version: `28.16` (unchanged)
  - Runtime Contract: `2` (unchanged)
  - Evidence Classification: LOCAL REPORTED evidence (317/317 PASS, 23/23 focused PASS, no GitHub CI)
  - Live LINE UAT: None required/performed (observability endpoints remain read-only)
  - Safety Invariant: Never automatically resend ambiguous physical sends

## Implemented MON-WP003 Alerts / Incident Visibility Summary

- **Task**: MON-WP003 (Dashboard V1)
- **Status**: CLOSED / PASS
- **Accepted Review HEAD**: `acb1185e1a5ff21c2c346d326669392cacdfa639`
- **Accepted Review Result**: `PASS`
- **Implementation Scope**: `index.html` ONLY (Dashboard-only incident visibility consuming `/api/ops/health` and `/api/ops/queue`).
- **Prohibited Files**: `src/**`, `run/**`, Worker version (remains 28.16), Required Worker (28.16), Runtime Contract (2), LINE/Telegram send, DB mutation all untouched.
- **Polling**: Reuses existing 6000ms monitoring poll; zero duplicate loops.
- **Incident Lifecycle**: In-memory `firstSeen`/`lastSeen` per dashboard session; no DB/localStorage persistence.
- **Validation**:
  - Local focused harness: 23/23 tests PASS (extracted directly from `index.html` via Node VM).
  - Full test suite: 317/317 PASS (LOCAL REPORTED evidence; no GitHub CI status checks).
  - Zero LINE/Telegram activity.

## Exact Recommended Next Step

* **ACTIVE_WORK_PACKAGE**: `NONE`
* **STATUS**: `STANDBY`
* **PHASE_0**: `CLOSED / PASS`
* **PHASE_1**: `IN PROGRESS`
* **MON-WP001**: `CLOSED / PASS`
* **MON-WP001-R1**: `CLOSED / PASS`
* **MON-WP002**: `CLOSED / PASS`
* **MON-WP003**: `CLOSED / PASS`
* **NEXT_CANDIDATE**: `NONE`
* **NEXT_CANDIDATE_STATUS**: `AWAITING_OWNER_DIRECTION`
Awaiting project owner direction for next work package. Do not start any task without explicit authorization.
