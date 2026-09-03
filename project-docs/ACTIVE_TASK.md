# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: NONE
STATUS: AWAITING_AUTHORIZATION
AUTHORIZED_BY: Project Owner
NEXT_CANDIDATE: REL-WP003 — Idempotent Send Ledger / Multipart Crash Safety
NEXT_CANDIDATE_STATUS: READY / NOT STARTED / AUTHORIZATION REQUIRED
```

---

## 📋 Work Package Status Summary

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
- **REL-WP003 — Idempotent Send Ledger / Multipart Crash Safety**: `NOT STARTED`

### Version Contracts
- **Worker Version**: `28.15`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.15`

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

## 🚧 Known REL-WP003 Boundary

REL-WP002 does **NOT** fully solve:
- Physical LINE send succeeds → browser/process crashes before backend success acknowledgement.

This post-send crash/idempotency window belongs to:
**REL-WP003 — Idempotent Send Ledger / Multipart Crash Safety**

REL-WP003 remains:
**READY / NOT STARTED / AUTHORIZATION REQUIRED**

---

## 📜 Accepted Live UAT Evidence (SAFE-WP001)

SAFE-WP001 accepted Live UAT:
- **v28.11 send run**: 2-recipient text campaign created while Master Bot was **PAUSED**, exactly 2 jobs queued and processed to completion, LINE messages/send physically observed and verified, zero recipient mismatch, zero OA mismatch, and zero `ACCOUNT_PROTECTION_STATE_UNAVAILABLE` errors.
- **v28.12 telemetry heartbeat closure**: Worker v28.12 introduced active-worker telemetry heartbeat in `processQueue()`. Dashboard telemetry displayed `Protection: ON`, `10m: 0 / 60`, `1h: 2 / 300`, `Next Send: now`, `Cooling: none`, proving send reservations correctly aged out of 10m window while remaining inside 1h window.

Current Worker v28.15 preserves the accepted SAFE-WP001 protection contract.

---

## 🚀 Next Candidate Work Package

- **Candidate**: `REL-WP003 — Idempotent Send Ledger / Multipart Crash Safety`
- **Status**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
- **Note**: Awaits explicit Project Owner authorization before starting. Do NOT start automatically.
