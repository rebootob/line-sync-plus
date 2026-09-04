# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: NONE
STATUS: STANDBY
AUTHORIZED_BY: Project Owner
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_OWNER_DIRECTION
PHASE_0: CLOSED / PASS
PHASE_1: IN PROGRESS
MON-WP001: CLOSED / PASS
MON-WP002: CLOSED / PASS
MON-WP003: CLOSED / PASS
```

---

## 📋 Work Package Status Summary

- **MON-WP003 — Alerts / Incident Visibility**: `CLOSED / PASS`
- **MON-WP002 — Queue / Lease / Reconciliation Monitoring**: `CLOSED / PASS`
- **MON-WP001 — Operational Health & Readiness**: `CLOSED / PASS`
  - **MON-WP001-R1 — Truthful Health State Corrective**: `CLOSED / PASS`
- **REL-WP003 — Durable Send-Part Ledger + Multipart Crash Safety**: `CLOSED / PASS`
  - **REL-WP003-R1 — Critical Crash-Safety Corrective**: `CORRECTIVE REQUIRED / SUPERSEDED`
  - **REL-WP003-R2 — Final Crash-Safety Corrective**: `CORRECTIVE REQUIRED / SUPERSEDED`
  - **REL-WP003-R3A — Backend Final Fencing Only**: `CORRECTIVE REQUIRED / SUPERSEDED`
  - **REL-WP003-R3B — Queue Prepass & Fail-Closed Ledger Migration**: `PASS / CLOSED`
- **REL-WP002 — Durable Job Lease + Heartbeat + Stale Worker Fencing**: `CLOSED / PASS`
- **REL-WP002-R1 — Lease Loss Semantics + Atomic Finalization + Retry + Stop Fencing**: `CORRECTED / SUPERSEDED`
- **REL-WP002-R2 — Serialize Lease Finalization and Circuit Breaker Stop**: `CORRECTIVE REQUIRED / SUPERSEDED`
- **REL-WP002-R3 — Complete R2 Corrective Exactly**: `CLOSED / PASS`
- **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `CLOSED / PASS`
  - **SAFE-WP001-R1**: `CLOSED / PASS`
  - **SAFE-WP001-R2**: `CLOSED / PASS`
  - **SAFE-WP001-R3**: `CLOSED / PASS`
- **SYNC-WP001 — LINE OA Customer Directory Sync**: `CLOSED / PASS` (Accepted on Worker v28.8)
- **OA-WP001 — OA Context Isolation & Strict Identity Fencing**: `CLOSED / PASS` (Accepted on Worker v28.5)
- **REL-WP001 — Single Worker Multi-Tab Lock**: `CLOSED / PASS`

### Version Contracts
- **Worker Version**: `28.16`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.16`

---

## 🩺 MON-WP001 — Operational Health & Readiness (STATUS: CLOSED / PASS)
### 🩺 MON-WP001-R1 — Truthful Health State Corrective (CLOSED / PASS)

> [!IMPORTANT]
> **Boundary & Invariants**:
> - **Scope**: Observability only. Read-only diagnostic endpoint and UI card.
> - **Worker**: `run/LineSyncApp.js` is UNTOUCHED. Worker remains v28.16, Required Worker remains 28.16, Runtime Contract remains 2.
> - **Security & Privacy**: Zero token leakage (`leaseToken`, `dispatchToken`), zero Telegram secrets, zero cookie/PII/message content exposure. Loopback-only (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`).
> - **Zero Side-Effects**: Read-only query; reading worker presence does not mutate observation timestamps or affect worker heartbeats.

### Backend Implementation (`src/app.controller.ts`)
- **Endpoint**: `GET /api/ops/health`
- **Security Check**: Enforces loopback client IP (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`). Returns HTTP 403 Forbidden for non-loopback requests.
- **Truthful Status Truth**:
  - `healthy`: Positively known ready state (`dbOk === true`, `oa.active === true`, `worker === 'online'`, `oa.aligned === true`, metric reads succeeded, and 0 reconciliation/stopped_error items).
  - `attention`: Operational readiness issue (no active OA selected, worker unknown/stale, alignment unknown/mismatched, or reconciliation/stopped_error present).
  - `degraded`: Health data infrastructure failure (DB ping failure, OA runtime DB lookup failure, or queue/campaign metric query failure).
- **Payload Schema**:
  ```json
  {
    "success": true,
    "status": "healthy | degraded | attention",
    "backend": {
      "ok": true,
      "uptimeSec": 123
    },
    "database": {
      "ok": true
    },
    "runtime": {
      "runtimeContract": 2,
      "requiredWorkerVersion": "28.16"
    },
    "masterBot": {
      "enabled": false
    },
    "oa": {
      "active": true,
      "aligned": true
    },
    "worker": {
      "state": "online | stale | unknown",
      "ageMs": 12000
    },
    "queue": {
      "pending": 0,
      "processing": 0,
      "reconcileRequired": 0
    },
    "campaigns": {
      "pausedReconcile": 0,
      "stoppedError": 0
    },
    "checkedAt": "ISO-8601"
  }
  ```
- **Truthful Active OA Scoping**: Queue and campaign metrics are strictly scoped to `activeBotId`. When no active OA is selected, global cross-OA counts are NOT queried; metric counts are returned as `null` / unavailable, and overall status is `attention`.
- **Truthful Metric Query Failure Handling**: Metric count query exceptions are NOT converted to 0; metrics are set to `null` / unavailable and status becomes `degraded`.
- **Truthful OA Runtime Lookup Failure**: OA query exceptions do NOT become "No Active OA" (`oa.active = null`, status `degraded`).

### Dashboard Implementation (`index.html`)
- **UI Component**: Responsive `Operational Health` card placed prominently at the top of the dashboard.
- **Truthful Rendering**:
  - Null/unavailable metrics render as `? Unknown` (never converted to 0 via `|| 0`).
  - Zero is displayed only when the backend positively returned numeric `0`.
  - Unknown/unready states never render green.
  - Network/API errors render all fields gracefully as `? Unknown`.
- **Truthful Polling**: Refreshes every 6 seconds via `GET /api/ops/health`.

### Automated Unit Testing (`src/app.controller.spec.ts`)
- 23 dedicated unit tests under `describe('MON-WP001 — Operational Health & Readiness Tests')`:
  - Loopback IP enforcement (rejects remote IP with 403 Forbidden).
  - DB ping failure reports `database.ok: false` and `degraded` status.
  - Worker freshness: `online` (<=30s), `stale` (>30s with `attention`), `unknown` (`attention`).
  - OA alignment: `aligned: true`, `mismatch: false` (`attention`), `unknown` (`attention`).
  - Metric query failure returns `null` counts and `degraded` status (never masks failure as 0).
  - No active OA does not aggregate all OAs (spies confirm 0 calls to count repositories) and returns `null` metrics with `attention` status.
  - OA runtime lookup failure returns `degraded` status and `oa.active: null`.
  - Numeric zero returned only when count queries genuinely succeed with `healthy` status.
  - Non-mutating health inspection (does not update `workerSeenAt`).
  - Strict secret & PII exclusion verified.
- **Total Test Suite**: 294/294 unit tests PASS (0 failures, LOCAL REPORTED evidence only; no GitHub CI status checks existed for the accepted review HEAD).

### Acceptance Evidence (Independent Review)
- **Accepted Review HEAD**: `6729bb118e727f9ff3f559c8b4a8efe8c0c9ed38`
- **Accepted Review Result**: `PASS`
- **Work Package Status**: `CLOSED / PASS`

---

## 🛡️ REL-WP003 Accepted Architecture & Closure Evidence

> [!IMPORTANT]
> **Architectural Truth**: Do NOT claim true exactly-once physical delivery. The LINE Web UI remains outside our database transaction boundary.
> **Accepted Safety Policy**: Never automatically resend an ambiguous physical send. Ambiguous state requires reconciliation before retry.

### Static Verification Evidence
- **Review**: REL-WP003-R3B static review `PASS`
- **Worker Version**: `28.16` (`run/LineSyncApp.js`)
- **Required Worker Version**: `28.16` (`src/runtime-version.ts`)
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`)
- **Automated Validation**: Local automated test suite reported **271/271 PASS** (0 failures).
- **CI Environment**: No GitHub CI status checks configured; verified locally.

### Live / Controlled UAT Evidence
1. **Backend Migration Startup**:
   - `Database schema verified/initialized successfully` on service startup.
   - Non-destructive migration, authoritative unique index enforced, legacy normalization fails closed without catch-swallow.
2. **Normal Text Send**:
   - Target: `1`, Success: `1`, Fail: `0`, Physical duplicate: `0`.
3. **Durable Ledger Verification**:
   - Database record verified: `job_status = success`, `partKey = text`, `part_status = dispatched`, `armedAt` present, `dispatchedAt` present, `reconcileReason = null`.
4. **Clean Ambiguity Baseline**:
   - Verified no pre-existing `armed` or `reconcile_required` rows before synthetic testing.
5. **Controlled DB-Only Ambiguity Fixture**:
   - Synthetic job state: `status = processing`, part state: `status = armed`. Zero physical LINE send performed.
6. **Send-Plan Ambiguity Detection**:
   - Calling `/campaign/send-plan` returned: `success = true`, `isFullyDispatched = false`, `hasQuarantine = true`.
7. **Post-Quarantine DB State**:
   - Authoritative DB quarantine confirmed: `CampaignJob.status = reconcile_required`, `CampaignSendPart.status = reconcile_required`, `reconcileReason = 'quarantined_on_reload_ambiguity'`, `Campaign.status = 'paused_reconcile'`.
   - All job lease fields stripped: `leaseToken = null`, `leaseOwner = null`, `leaseExpiresAt = null`.
8. **Operator Reconciliation GET**:
   - `GET /campaign/reconciliation` correctly displayed quarantined campaign, job, and ambiguous send-part details while Master Bot was PAUSED.
9. **Operator Resolution**:
   - Executed resolution: `decision = confirmed_not_sent_retry`.
   - Result: `success = true`, job and part reset to pending for safe retry, zero physical LINE messages sent.
10. **Cleanup Verification**:
    - Final DB inspection after test cleanup: `CAMPAIGN FOUND = 0`, `JOB FOUND = 0`, `PARTS FOUND = 0`. Clean baseline verified.

---

## 🛡️ REL-WP003 Implemented Crash-Safety Controls Summary

### 1. Legacy Schema Migration
- **Table**: `campaign_send_parts` migrated non-destructively.
- **Constraints**: Dropped legacy `UQ_campaign_send_parts_job_partIndex` and legacy index. Removed legacy fields from TypeORM entity.
- **Fail-Closed Data Migration**: Legacy `sent` ➔ `dispatched`, `partKey` derived from `partType`, `partOrder` from `partIndex`, `dispatchedAt = COALESCE(dispatchedAt, sentAt)` without catch-swallow.
- **Authoritative Unique Constraint**: Enforced on `(jobId, partKey)` and index on `(botId, status)`.

### 2. Honor already_dispatched Before Physical Send
- In Userscript: `armSendPart` response checked immediately.
- If `armRes.state === 'already_dispatched'`: zero clicks, zero Enter keydown, zero physical send, part treated as already complete.
- Physical DOM events executed ONLY when `armRes.state === 'armed'` AND `dispatchToken` exists; otherwise fail closed.

### 3. Immediate Backend Quarantine on Reload Ambiguity
- When page reload or `POST /api/campaign/send-plan` observes `armed` or `reconcile_required`:
  - `CampaignSendPart.status = 'reconcile_required'`
  - `CampaignJob.status = 'reconcile_required'`
  - `Campaign.status = 'paused_reconcile'`
  - Job leases stripped (`leaseToken = null`, `leaseOwner = null`, `leaseExpiresAt = null`, `leaseHeartbeatAt = null`).
  - Candidate queue in `/campaign/next` excludes jobs from paused_reconcile campaigns.

### 4. Separate Queue Pre-pass & All-Dispatched Auto-Finalize
- `/campaign/next` separately pre-scans ALL expired processing jobs without `take: 100` limit before selecting pending jobs.
- Quarantines ambiguous parts to `reconcile_required` with `Campaign = paused_reconcile`.
- Concurrency-safe auto-finalization of all-dispatched expired jobs inside one transaction with row locks on `CampaignJob` and `Campaign`.

### 5. Complete Ledger Required for Success
- `/campaign/success` unconditionally validates the ledger against `getRequiredSendParts()`:
  - ZERO ledger rows ➔ 409 `send_ledger_incomplete`.
  - Missing multipart part ➔ 409 `send_ledger_incomplete`.
  - Ambiguous part (`armed`/`reconcile_required`) ➔ 409 `reconcile_required`.
  - Unexpected partKey ➔ 409 `send_ledger_inconsistent`.
  - Duplicate already-success acknowledgement remains idempotent without double incrementing `successCount`.

### 6. Hard-Fenced Operator Reconciliation
- `POST /campaign/reconciliation/resolve` requires: loopback (`127.0.0.1` / `::1`), Master Bot PAUSED, active OA matches Job, `Job.status === reconcile_required`, NO active lease, target part ONLY `armed` or `reconcile_required`.
- Rejects `pending` and `dispatched` parts.
- Duplicate `confirmed_sent` on already-success job increments `successCount` at most once.
- `confirmed_not_sent_retry` NEVER converts an already-dispatched part to pending.

### 7. Same armRequestId Transient Retry & Confirm Idempotency
- `armSendPart` retries transient errors with the SAME `armRequestId`.
- `confirmSendPart` returns idempotent success only when matching `armRequestId`.

---

## 📜 Accepted Live UAT Evidence (REL-WP002)

### Precheck
- Dashboard Runtime Contract v2
- Required Worker v28.15
- Master Bot PAUSED before campaign creation
- Active OA remained aligned
- Tampermonkey Worker v28.15 loaded successfully

### Campaign
- Campaign name: `"แคมเปญ 3/9/2026 8:6"`
- Type: text
- Test text: `"1111"`
- Targets: 2
- Campaign created while Master Bot was PAUSED
- Initial status: pending
- Exactly 2 jobs queued

### Execution
- Master Bot was enabled only after pending campaign was prepared
- Worker v28.15 claimed and processed both jobs
- Recipient verification occurred before physical send
- LINE messages/send observed for both recipients
- Both jobs returned success
- Worker returned to OA main page between/after jobs
- No visible `JOB_LEASE_LOST`
- No visible `lease_lost`
- No visible `OA_CONTEXT_MISMATCH`
- No visible `RECIPIENT_UNVERIFIED`

### Final Campaign History
- Target = 2
- Success = 2
- Failed = 0
- Campaign overall status = success/completed
- Individual success timestamps:
  - `08:10:18`
  - `08:10:30`

### Post-run
- Master Bot returned to PAUSED
- Account Protection remained ON
- 10m = 2 / 60
- 1h = 2 / 300
- Next Send = now
- Cooling = none

---

## 🔒 REL-WP002 Accepted Safety Contract

- **CampaignJob Durable Lease Fields**:
  - `leaseToken` (varchar 64)
  - `leaseOwner` (varchar 128)
  - `leaseExpiresAt` (timestamp)
  - `leaseHeartbeatAt` (timestamp)
- **60-Second Backend Job Lease**: Granted on atomic job claim (`GET /api/campaign/next`).
- **~10-Second Active-Job Heartbeat**: `POST /api/campaign/heartbeat` extends active lease by 60s while running.
- **Strict Worker-Instance Identity**: Header `X-LineSync-Worker-Instance` validated against `^ts_[0-9]{10,17}_[a-z0-9]{4,32}$`.
- **Atomic / Restricted Job Claim**: Only pending or expired processing jobs can be claimed; active leases cannot be stolen.
- **Expired Lease Reclaim**: May be reclaimed by eligible worker generating a NEW `leaseToken`.
- **Stale Lease Self-Revival Blocked**: Stale or expired leases cannot revive themselves.
- **Page-Load Recovery**: Renews/validates saved lease before resuming active job.
- **Transient Network Error**: Preserves same job only while known lease remains valid; does not prematurely fail closed.
- **Explicit `lease_lost`**: Immediately strips stale Worker authority without calling `/campaign/fail` and without incrementing error count.
- **Final Authoritative Lease Renewal**: Executed immediately prior to irreversible physical LINE send (clicks / Enter).
- **Intact Upstream Fencing**: Worker leadership, target recipient, OA context, and SAFE reservation checks remain fully enforced.
- **Fenced Finalization**: `markSuccess` and `markFail` require valid, unexpired matching lease.
- **Serialized Campaign Counters**: Pessimistic row locking (`SELECT FOR UPDATE` / `pessimistic_write`) on `Campaign` prevents lost updates.
- **Fenced Worker-Driven Stop**: Requires locked current `processing` lease; recent-failed and historical stop bypasses removed.
- **Integrated Circuit Breaker in `markFail`**: 10 consecutive errors finalized atomically via `/campaign/fail` with `errorOverflow: true`, setting `campaign.status = 'stopped_error'` and clearing remaining job leases without calling `/campaign/stop`.
- **Customer Block DB Rollback**: DB failure when saving blocked customer propagates and rolls back the transaction.
- **Post-Commit Telegram**: Notifications dispatched only after DB transaction commit.
- **Same-Job Finalization Retry**: Network failure after physical send retries finalization with same credentials without re-executing physical send.

---

## ⚠️ Non-Destructive UAT Limitation

Intentional Live UAT of:
- lease expiration takeover
- stale-worker competing finalization
- forced backend/network outage during finalization
- forced heartbeat failure
- forced circuit-breaker 10-error sequence

was **NOT** performed against Live LINE OA.

**Reason**: These destructive scenarios were not executed on Live LINE OA to avoid unnecessary operational/send risk. They are covered by focused behavioral/unit tests. The local validation suite reported 236/236 passing; no independent GitHub CI status is available.

---

## 📜 Accepted Live UAT Evidence (SAFE-WP001)

SAFE-WP001 accepted Live UAT:
- **v28.11 send run**: 2-recipient text campaign created while Master Bot was **PAUSED**, exactly 2 jobs queued and processed to completion, LINE messages/send physically observed and verified, zero recipient mismatch, zero OA mismatch, and zero `ACCOUNT_PROTECTION_STATE_UNAVAILABLE` errors.
- **v28.12 telemetry heartbeat closure**: Worker v28.12 introduced active-worker telemetry heartbeat in `processQueue()`. Dashboard telemetry displayed `Protection: ON`, `10m: 0 / 60`, `1h: 2 / 300`, `Next Send: now`, `Cooling: none`, proving send reservations correctly aged out of 10m window while remaining inside 1h window.

Current Worker v28.16 preserves the accepted SAFE-WP001 protection contract.

---

## 📊 MON-WP002 — Queue / Lease / Reconciliation Monitoring (STATUS: CLOSED / PASS)

> [!IMPORTANT]
> **Boundary & Invariants**:
> - **Scope**: Observability only. Read-only diagnostic endpoint and UI card. Zero mutation, zero reclaim, zero resend, zero auto-reconciliation.
> - **Worker**: `run/LineSyncApp.js` is UNTOUCHED. Worker remains v28.16, Required Worker remains 28.16, Runtime Contract remains 2.
> - **Security & Privacy**: Zero token leakage (`leaseToken`, `dispatchToken`), zero Telegram secrets, zero cookie/PII/message content exposure. Loopback-only (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`).
> - **Zero Side-Effects**: Read-only query; does not mutate worker observation timestamps or affect worker heartbeats.

### Backend Implementation (`src/app.controller.ts`)
- **Endpoint**: `GET /api/ops/queue`
- **Security Check**: Enforces loopback client IP (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) from socket remote address. Returns HTTP 403 Forbidden for non-loopback requests.
- **Truthful Status Truth**:
  - `healthy`: Positively known ready state (`activeBotId` present, metric queries succeed, and 0 anomaly items).
  - `attention`: Operational readiness issue (no active OA, `expired > 0`, `missing > 0`, `residual > 0`, `reconciliation.jobs > 0`, `reconciliation.parts > 0`, `staleArmed > 0`, or `pausedCampaigns > 0`).
  - `degraded`: OA lookup failure or metric query failure (all counts returned as `null`).
- **Truthful Active OA Scoping**:
  - Metrics are strictly scoped to `activeBotId`. When no active OA is selected, global cross-OA counts are NOT queried; metric counts are returned as `null` / unavailable, and overall status is `attention`.
  - When OA lookup fails, all counts are `null`, `oa.active: null`, status is `degraded`.
- **Truthful Metric Query Failure Handling**: Metric count query exceptions do NOT become 0; all metrics are returned as `null` and status becomes `degraded`.

### Dashboard Implementation (`index.html`)
- **UI Component**: Responsive `Queue, Lease & Reconciliation Monitoring` card placed in the dashboard.
- **Truthful Rendering**:
  - Null/unavailable metrics render as `? Unknown` (never converted to 0 via `|| 0`).
  - Zero is displayed only when the backend positively returned numeric `0`.
  - Positive anomalies render visible warnings (`⚠️ N`).
  - Informational fields (`pending`, `processing`, `active`) render clean informational numbers.
  - Unknown/unready states never render green.
  - Network/API errors render all fields gracefully as `? Unknown`.
- **Truthful Polling**: Refreshes every 6 seconds via `GET /api/ops/queue`.

### Automated Unit Testing (`src/app.controller.spec.ts`)
- 23 dedicated unit tests under `describe('MON-WP002 — Queue / Lease / Reconciliation Monitoring Tests')`:
  - 23/23 tests pass cleanly.
- **Total Test Suite**: 317/317 unit tests PASS (0 failures, LOCAL REPORTED evidence only; no GitHub CI status checks).

### Acceptance Evidence (Independent Review)
- **Accepted Review HEAD**: `5b34269397afbd9046610c366d9f0c27bf3d5532`
- **Accepted Review Result**: `PASS`
- **Work Package Status**: `CLOSED / PASS`
- **Evidence Classification**: LOCAL REPORTED evidence (317/317 PASS, 23/23 focused PASS, no GitHub CI)
- **Live LINE UAT**: No Live LINE UAT was required/performed (observability endpoints remain read-only)
- **Worker Version**: `28.16` (unchanged)
- **Required Worker Version**: `28.16` (unchanged)
- **Runtime Contract Version**: `2` (unchanged)
- **Safety Invariant**: Never automatically resend ambiguous physical sends

---

## 🚨 MON-WP003 — Alerts / Incident Visibility (STATUS: CLOSED / PASS)

> [!IMPORTANT]
> **Boundary & Invariants**:
> - **Scope**: Dashboard-only incident visibility (V1). Read-only consumption of `/api/ops/health` and `/api/ops/queue`.
> - **Zero Backend Changes**: No new endpoints, no modifications to `src/**`.
> - **Worker**: `run/LineSyncApp.js` is UNTOUCHED. Worker remains v28.16, Required Worker remains 28.16, Runtime Contract remains 2.
> - **Security & Privacy**: Zero token leakage (`leaseToken`, `dispatchToken`), zero Telegram secrets, zero cookie/PII/message content exposure.
> - **No Polling Overhead**: Reuses existing 6000ms monitoring cycle; zero duplicated polling loops.
> - **Incident Lifecycle**: Session-memory only (in-memory `firstSeen` and `lastSeen`); no DB or localStorage persistence.
> - **Zero Side-Effects**: Read-only visualization; zero recovery, zero mutation, zero resend, zero auto-reconciliation, zero action buttons.

### Implementation Summary (`index.html`)
- **UI Component**: Responsive `Incident Visibility & Active Alerts` card placed prominently above the Operational Health card.
- **Incident Derivation Engine**: Pure function `deriveIncidents(healthData, queueData, sessionTracker, nowInput)` wrapped in clear sentinels (`// === MON-WP003 INCIDENT DERIVATION ENGINE START ===` / `// === MON-WP003 INCIDENT DERIVATION ENGINE END ===`).
- **Severities**: Full priority hierarchy enforced (`CRITICAL > WARNING > UNKNOWN > INFO > CLEAR`). Unknown never renders green. CLEAR permitted only when monitoring sources are positively available with zero active anomalies.
- **Rules Implemented**:
  - `HEALTH_UNAVAILABLE` (UNKNOWN), `QUEUE_UNAVAILABLE` (UNKNOWN)
  - `HEALTH_DEGRADED` (CRITICAL), `QUEUE_DEGRADED` (CRITICAL)
  - `OA_NOT_ACTIVE` (WARNING)
  - `OA_MISMATCH` (CRITICAL)
  - `WORKER_STALE` (WARNING), `WORKER_UNKNOWN` (UNKNOWN)
  - `EXPIRED_LEASE` (WARNING), `MISSING_LEASE` (WARNING), `RESIDUAL_LEASE` (WARNING)
  - `RECONCILE_JOB` (CRITICAL), `RECONCILE_PART` (CRITICAL), `STALE_ARMED` (CRITICAL), `PAUSED_RECONCILE` (CRITICAL)
  - `QUEUE_ACTIVITY` (INFO; positive pending/processing/active leases alone never become WARNING or CRITICAL)
- **Lifecycle Tracking**: In-memory `firstSeen` / `lastSeen` tracking per dashboard session. Resolved incidents disappear from active list; reappearing incidents receive fresh `firstSeen`.
- **Zero Third Polling Loop**: Hooked directly into existing `updateOpsHealthUI()` and `updateOpsQueueUI()` execution paths. Failed responses explicitly invalidate snapshots to prevent stale zero reuse.

### Validation & Acceptance Evidence
- **Accepted Review HEAD**: `acb1185e1a5ff21c2c346d326669392cacdfa639`
- **Accepted Review Result**: `PASS`
- **Work Package Status**: `CLOSED / PASS`
- **Focused Validation**: 23/23 tests PASS via temporary local harness extracting the exact function from `index.html` via Node VM.
- **Full Test Suite**: 317/317 PASS (0 failures, `npm test -- --runInBand`).
- **Evidence Classification**: LOCAL REPORTED evidence (no GitHub CI status checks).
- **Code Baseline HEAD**: `f8ef40a422657eba8ad50be05f97026e34a18f03`.
- **Live LINE UAT**: None required/performed (observability endpoints remain read-only).
- **Worker Version**: `28.16` (unchanged)
- **Required Worker Version**: `28.16` (unchanged)
- **Runtime Contract Version**: `2` (unchanged)
- **Safety Invariant**: Never automatically resend ambiguous physical sends

---

## 🚀 Work Package Execution Status

- **Active Work Package**: `NONE`
- **Status**: `STANDBY`
- **Phase 0 Status**: `CLOSED / PASS`
- **Phase 1 Status**: `IN PROGRESS`
- **MON-WP001 Status**: `CLOSED / PASS`
- **MON-WP001-R1 Status**: `CLOSED / PASS`
- **MON-WP002 Status**: `CLOSED / PASS`
- **MON-WP003 Status**: `CLOSED / PASS`
- **Next Candidate**: `NONE`
- **Next Candidate Status**: `AWAITING_OWNER_DIRECTION`
