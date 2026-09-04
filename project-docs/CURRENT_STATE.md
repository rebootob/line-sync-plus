# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-04 (Post REL-WP003 Closure / Phase 0 Closure)

---

## 🏛️ System Architecture Overview

```
                      +-----------------------------+
                      |   Single Page Dashboard     |
                      |        (index.html)         |
                      +--------------+--------------+
                                     |
                                REST API
                                     v
+------------------+  HTTP   +------------------+ TypeORM  +--------------------+
| Tampermonkey     |<------->| NestJS Backend   |<-------->| PostgreSQL DB      |
| (LineSyncApp.js) |         | (AppController)  |          | (line_sync_db)     |
+------------------+         +--------+---------+          +--------------------+
  Runs inside                         |
  chat.line.biz                       | Telegram API
                                      v
                             +------------------+
                             | Telegram Bot API |
                             +------------------+
```

---

## 🩺 Operational Health & Readiness (MON-WP001 STATUS: READY_FOR_CHATGPT_REVIEW)

- **Worker Version**: `28.16` (`run/LineSyncApp.js` v28.16 - UNTOUCHED).
- **Backend Required Version**: `28.16` (`src/runtime-version.ts`).
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`).
- **Scope**: Phase 1 Observability & Monitoring. Read-only diagnostic endpoint and UI card.
- **Implemented Capabilities**:
  - `GET /api/ops/health`: Loopback-only endpoint (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`). Returns 403 Forbidden for external IPs.
  - Database Health Check: Performs a lightweight `SELECT 1` ping. On DB failure, reports `database.ok = false` and `status = 'degraded'` without throwing an uncaught exception.
  - Truthful Worker Freshness: Analyzes static in-memory `AppController.workerSeenAt` without mutating observation timestamps or generating side effects. Classified as `'online'` (<=30s), `'stale'` (>30s), or `'unknown'` (null/missing).
  - OA Context Alignment: Checks whether `workerBotId === activeBotId`. Returns `alignedWithActiveBot: true | false | "unknown"`.
  - Scoped Metrics: Reports queue counts (`pending`, `processing`, `reconcileRequired`) and campaign states (`pausedReconcile`, `stoppedError`) scoped by `activeBotId`.
  - Zero Secret Exposure: Excludes `leaseToken`, `dispatchToken`, Telegram credentials, cookies, customer PII, and message payloads.
  - Dashboard UI: Added top-level responsive Operational Health card in `index.html` polling `GET /api/ops/health` every 6 seconds, rendering state gracefully with `? Unknown` fallback on communication error.
  - Automated Unit Tests: 15 dedicated unit tests in `src/app.controller.spec.ts` bringing total test suite to 286/286 passing.

---

## 🔒 Durable Job Lease + Heartbeat + Stale Worker Fencing (REL-WP002 STATUS: CLOSED / PASS; REL-WP002-R3 STATUS: CLOSED / PASS)

- **Worker Version**: `28.16` (`run/LineSyncApp.js` v28.16).
- **Backend Required Version**: `28.16` (`src/runtime-version.ts`).
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`).
- **Accepted Live UAT (Worker v28.15 Baseline)**:
  - 2-recipient text campaign (`"แคมเปญ 3/9/2026 8:6"`, test text `"1111"`) created while Master Bot was PAUSED.
  - Exactly 2 jobs queued and processed to completion after bot was enabled.
  - Recipient verification verified prior to send; LINE send physically observed.
  - Both jobs completed successfully (`08:10:18`, `08:10:30`); 0 failed; overall campaign completed.
  - Zero visible `JOB_LEASE_LOST`, `lease_lost`, `OA_CONTEXT_MISMATCH`, or `RECIPIENT_UNVERIFIED`.
  - Post-run Account Protection: ON, 10m: 2/60, 1h: 2/300, Next Send: now, Cooling: none.
- **Accepted Safety Contract**:
  - Nullable job lease columns on `CampaignJob`: `leaseToken` (varchar 64), `leaseOwner` (varchar 128), `leaseExpiresAt` (timestamp), `leaseHeartbeatAt` (timestamp). Added index `idx_campaign_jobs_bot_status_lease` on `(botId, status, leaseExpiresAt)`.
  - Atomic claim on `GET /api/campaign/next`: requires `X-LineSync-Worker-Instance` header (`^ts_[0-9]{10,17}_[a-z0-9]{4,32}$`), generates UUID `leaseToken`, sets 60s lease expiry (`NOW() + 60s`).
  - Active heartbeat loop: `POST /api/campaign/heartbeat` extends active leases by 60s every 10s. Distinguishes renewed, explicit `lease_lost`, and transient error.
  - Final pre-send lease renewal fencing: `renewJobLeaseOrThrow` invoked before image confirm (`confirmAndCloseImageModal(expectedUserId, expectedBotId)`), text send click, and Enter keydown.
  - Transactional finalization with Pessimistic Locking: `/campaign/success`, `/campaign/fail`, and `/campaign/stop` execute TypeORM transactions locking `Campaign` row with `pessimistic_write` after fenced job status transition.
  - Customer Failure Rollback: DB failures when updating blocked customers in `markFail` propagate and rollback the transaction.
  - Same-Job Finalization Retry: After physical send, transient network failure retries finalization with same credentials while lease is valid; explicit lease loss relinquishes execution without marking fail; physical send is never repeated.
  - Integrated Circuit Breaker inside `markFail` (R3): When 10 consecutive errors occur, the worker calls `/campaign/fail` with `errorOverflow: true`. The transaction increments `failedCount`, sets `campaign.status = 'stopped_error'`, clears all remaining leases, and commits atomically without calling `/campaign/stop`.
  - Strict Worker-Driven Stop Fencing: `/campaign/stop` with `jobId` locks the calling `CampaignJob` with `pessimistic_write` and strictly enforces active processing lease before stopping the campaign; recent-failed and historical fallbacks are removed.
  - Post-Commit Telegram: Notifications dispatched only after DB transaction resolves.

---

## 🛡️ Durable Send-Part Ledger & Crash Safety (REL-WP003 STATUS: CLOSED / PASS; REL-WP003-R3B STATUS: PASS / CLOSED)

- **Worker Version**: `28.16` (`run/LineSyncApp.js` v28.16).
- **Backend Required Version**: `28.16` (`src/runtime-version.ts`).
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`).
- **Core Safety Invariant**: True exactly-once delivery cannot be guaranteed across the unobservable LINE Web UI crash boundary.
- **Operational Policy**: Never automatically resend an ambiguous physical send. Ambiguous state requires reconciliation before retry.
- **Implemented Architecture**:
  - `campaign_send_parts` Entity & Table: Non-destructive migration from previous schema, composite uniqueness on `(jobId, partKey)`, legacy fields removed from TypeORM entity, fail-closed legacy normalization without swallow.
  - State Machine: `pending` ➔ `armed` ➔ `dispatched` | `reconcile_required`.
  - Ephemeral `dispatchToken`: Generated during ARM phase, held in-memory only; never stored in localStorage/sessionStorage or logged.
  - Pre-Send `already_dispatched` Guard: If `armRes.state === 'already_dispatched'`, physical click / Enter is completely skipped.
  - Zero Network Gap: Physical DOM dispatch occurs immediately after ARM response with no intervening `await`, `fetch`, or navigation.
  - Endpoints:
    - `POST /api/campaign/send-plan`: Authoritative message part plan per `messageType`. Automatically quarantines on reload ambiguity if parts are `armed` or `reconcile_required`.
    - `POST /api/campaign/send-part/arm`: Fenced pre-send state transition. Same `armRequestId` retried across transient errors returns same `dispatchToken`; conflicting arm triggers immediate quarantine.
    - `POST /api/campaign/send-part/confirm`: Post-send acknowledgement. Idempotent on matching `armRequestId`. Retries confirmation only upon transient network error; never repeats physical send.
    - `POST /api/campaign/success`: Full ledger verification against `getRequiredSendParts()` required on every job; 0 rows or missing multipart rejects with 409 `send_ledger_incomplete`.
    - `GET /api/campaign/reconciliation`: Inspection of quarantined campaigns/jobs/parts (loopback only, active OA, bot paused).
    - `POST /api/campaign/reconciliation/resolve`: Hard-fenced operator reconciliation actions (`confirmed_sent`, `confirmed_not_sent_retry`). Rejects `pending` and `dispatched` parts; requires job in `reconcile_required` with no active lease.
  - Crash Reconciliation & Quarantine:
    - `getNextJob`: Safety pre-pass separately pre-scans ALL expired processing jobs (unlimited by `take: 100`) before selecting/claiming any pending job. Quarantines ambiguous parts to `reconcile_required` with `Campaign = paused_reconcile`. Concurrency-safe auto-finalization of all-dispatched expired jobs inside one transaction with row locks.
    - `resumeSavedActiveJob`: Queries authoritative send plan on page reload; if any part is `armed` or `reconcile_required`, immediately quarantines without physical resend.
    - `executeChatBot`: Skips already-`dispatched` parts.
- **Accepted Static Evidence**: REL-WP003-R3B review PASS, 271/271 unit tests pass cleanly, no GitHub CI status checks.
- **Accepted Live / Controlled UAT Evidence**:
  1. Backend migration startup: `Database schema verified/initialized successfully`.
  2. Normal text send: target: 1, success: 1, fail: 0, physical duplicate: 0.
  3. Durable ledger verification: `job_status = success`, `partKey = text`, `part_status = dispatched`, `armedAt` and `dispatchedAt` present, `reconcileReason = null`.
  4. Clean ambiguity baseline: 0 pre-existing `armed` or `reconcile_required` rows.
  5. Controlled DB fixture: job `processing`, part `armed`, NO physical LINE send.
  6. Send-plan ambiguity detection: `success = true`, `isFullyDispatched = false`, `hasQuarantine = true`.
  7. Post-quarantine DB: `job = reconcile_required`, `part = reconcile_required`, `reconcileReason = 'quarantined_on_reload_ambiguity'`, `campaign = paused_reconcile`, leases stripped.
  8. Operator reconciliation GET: synthetic fixture visible with Master Bot PAUSED.
  9. Operator resolution: `confirmed_not_sent_retry` succeeded with zero LINE sends.
  10. Cleanup verification: DB inspection confirmed `CAMPAIGN FOUND = 0`, `JOB FOUND = 0`, `PARTS FOUND = 0`. Clean baseline verified.

---

## 🛡️ Account Protection & Send Compliance Guard (SAFE-WP001 STATUS: CLOSED / PASS)

- **SAFE-WP001 Accepted Live UAT**:
  - v28.11 send run
  - v28.12 telemetry heartbeat closure
- Current Worker v28.16 preserves the accepted SAFE-WP001 protection contract (fail-closed storage, rate limits of 10s gap, 60/10m, 300/1h, exact timestamp reservation, and telemetry heartbeat).

---

## 🔄 Customer Directory Synchronization (SYNC-WP001 STATUS: CLOSED / PASS)

- Accepted on Worker v28.8 across 9,741 records (488 pages). Non-destructive DB policy preserves 6 DB-only records.

---

## 🔒 Multi-OA Identity Fencing & Context Isolation (OA-WP001 STATUS: CLOSED / PASS)

- Accepted on Worker v28.5 (UAT-01..06 verified).

---

## 🔒 Single Worker Multi-Tab Lock (REL-WP001 STATUS: CLOSED / PASS)

- UAT-01..04 verified.

---

## ✅ What Currently Works (Confirmed Working & Tested)

1. **Database & Entities (`PostgreSQL` / `TypeORM`)**: Composite primary key `(botId, lineUserId)` on `Customer`. Job lease schema on `CampaignJob`. Send-part ledger entity `CampaignSendPart` with unique `(jobId, partKey)`.
2. **NestJS REST API (`src/app.controller.ts`)**: Atomic job claim, active job lease heartbeat, fenced finalization (`/campaign/success`, `/campaign/fail`, `/campaign/stop`), queue safety pre-pass, send-part ARM+CONFIRM ledger, hard-fenced operator reconciliation, loopback-only Operational Health & Readiness monitoring (`GET /api/ops/health`).
3. **Web Dashboard (`index.html`)**: Contract v2 badge, Required Worker v28.16, operator reconciliation view, real-time Operational Health card with 6s polling.
4. **Client Automation Userscript (`run/LineSyncApp.js` v28.16)**: Worker instance header `X-LineSync-Worker-Instance`, active job heartbeat timer, pre-send lease renewal fencing, send-part ARM+CONFIRM ledger, zero network gap DOM dispatch.

---

## 🚀 Work Packages Overview

- **Phase 0 Status**: `CLOSED / PASS`.
- **Phase 1 Status**: `IN PROGRESS`.
- **Closed Work Packages**: `BUG-WP001`, `BUG-WP002`, `SEC-WP001`, `OPS-WP001`, `REL-WP001`, `OA-WP001`, `SYNC-WP001`, `SAFE-WP001`, `REL-WP002`, `REL-WP003` (`CLOSED / PASS`).
- **Active Work Package**: `MON-WP001` (`READY_FOR_CHATGPT_REVIEW`).
- **Work Package Status**:
  - `MON-WP001`: `READY_FOR_CHATGPT_REVIEW`.
  - `REL-WP003`: `CLOSED / PASS`.
  - `REL-WP003-R1`: `CORRECTIVE REQUIRED / SUPERSEDED`.
  - `REL-WP003-R2`: `CORRECTIVE REQUIRED / SUPERSEDED`.
  - `REL-WP003-R3A`: `CORRECTIVE REQUIRED / SUPERSEDED`.
  - `REL-WP003-R3B`: `PASS / CLOSED`.
  - `REL-WP002`: `CLOSED / PASS`.
  - `REL-WP002-R1`: `CORRECTED / SUPERSEDED`.
  - `REL-WP002-R2`: `CORRECTIVE REQUIRED / SUPERSEDED`.
  - `REL-WP002-R3`: `CLOSED / PASS`.
- **Next Candidate**: `NONE` (Awaiting review of MON-WP001).
