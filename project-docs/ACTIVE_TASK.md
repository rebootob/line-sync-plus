# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: REL-WP003-R3B
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: Project Owner
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_REVIEW
PHASE_0: IN PROGRESS
```

---

## 📋 Work Package Status Summary

- **REL-WP003 — Durable Send-Part Ledger + Multipart Crash Safety**: `NOT CLOSED / CORRECTIVE REQUIRED`
- **REL-WP003-R1 — Critical Crash-Safety Corrective**: `CORRECTIVE REQUIRED / SUPERSEDED`
- **REL-WP003-R2 — Final Crash-Safety Corrective**: `CORRECTIVE REQUIRED / SUPERSEDED`
- **REL-WP003-R3A — Backend Final Fencing Only**: `CORRECTIVE REQUIRED / SUPERSEDED`
- **REL-WP003-R3B — Queue Prepass & Fail-Closed Ledger Migration**: `READY_FOR_CHATGPT_REVIEW`
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

## 🛡️ REL-WP003-R3B Queue Prepass & Fail-Closed Ledger Migration Architecture

> [!IMPORTANT]
> **Crash-Safety Invariant**: True exactly-once delivery cannot be guaranteed across the unobservable LINE Web UI crash boundary.
> **Operational Policy**: Never automatically resend an ambiguous physical send.
> **Testing Status**: No Live UAT performed. REL-WP003 remains NOT CLOSED / CORRECTIVE REQUIRED. Validated via 271 automated unit tests.

### 1. Legacy Schema Migration
- **Table**: `campaign_send_parts` migrated non-destructively.
- **Constraints**: Dropped legacy `UQ_campaign_send_parts_job_partIndex` and legacy index. Made legacy `partType` and `partIndex` nullable.
- **Data Migration**: Legacy `sent` ➔ `dispatched`, `partKey` derived from `partType` (`'image'` or `'text'`), `dispatchedAt = COALESCE(dispatchedAt, sentAt)`.
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
  - Candidate queue in `/campaign/next` cannot claim subsequent jobs from this campaign.

### 4. Complete Ledger Required for Success
- `/campaign/success` unconditionally validates the ledger against `getRequiredSendParts()` for every processing job:
  - ZERO ledger rows ➔ 409 `send_ledger_incomplete`.
  - Missing multipart part ➔ 409 `send_ledger_incomplete`.
  - Ambiguous part (`armed`/`reconcile_required`) ➔ 409 `reconcile_required`.
  - Unexpected partKey ➔ 409 `send_ledger_inconsistent`.
  - Duplicate already-success acknowledgement remains idempotent without double incrementing `successCount`.

### 5. Hard-Fenced Operator Reconciliation
- `POST /campaign/reconciliation/resolve` requires: loopback (`127.0.0.1` / `::1`), Master Bot PAUSED, active OA matches Job, `Job.status === reconcile_required`, NO active lease, target part ONLY `armed` or `reconcile_required`.
- Rejects `pending` and `dispatched` parts.
- Duplicate `confirmed_sent` on already-success job increments `successCount` at most once.
- `confirmed_not_sent_retry` NEVER converts an already-dispatched part to pending.

### 6. Same armRequestId Transient Retry & Confirm Idempotency
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

## 🛡️ REL-WP003 — Durable Send-Part Ledger + Multipart Crash Safety

REL-WP003 solves the post-send crash window:
- **`campaign_send_parts` Entity**: Durable ledger recording physical send of each message part (`partIndex: 0`, `partIndex: 1`, etc.) with composite uniqueness on `(jobId, partIndex)`.
- **`POST /api/campaign/send-part`**: Worker-driven durable ledger recording with strict fencing (`X-LineSync-Worker-Version: 28.16`, OA context, valid worker instance, and active unexpired processing lease).
- **`POST /api/campaign/reconcile`**: Crash reconciliation endpoint checking whether a job was already fully or partially sent.
- **Multipart Skip & Fast Finalization**: In `executeChatBot`, already-sent parts are skipped per ledger. In `resumeSavedActiveJob`, fully-sent jobs finalize immediately without re-sending. In `getNextJob`, fully-sent expired jobs auto-reconcile to `success`.
- **Validation**: 254/254 unit tests pass cleanly.

---

## 📜 Accepted Live UAT Evidence (SAFE-WP001)

SAFE-WP001 accepted Live UAT:
- **v28.11 send run**: 2-recipient text campaign created while Master Bot was **PAUSED**, exactly 2 jobs queued and processed to completion, LINE messages/send physically observed and verified, zero recipient mismatch, zero OA mismatch, and zero `ACCOUNT_PROTECTION_STATE_UNAVAILABLE` errors.
- **v28.12 telemetry heartbeat closure**: Worker v28.12 introduced active-worker telemetry heartbeat in `processQueue()`. Dashboard telemetry displayed `Protection: ON`, `10m: 0 / 60`, `1h: 2 / 300`, `Next Send: now`, `Cooling: none`, proving send reservations correctly aged out of 10m window while remaining inside 1h window.

Current Worker v28.16 preserves the accepted SAFE-WP001 protection contract.

---

## 🚀 Next Candidate Work Package

- **Candidate**: `NONE`
- **Status**: `COMPLETE`
