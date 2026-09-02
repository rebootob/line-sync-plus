# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: REL-WP002 — Durable Job Lease + Heartbeat + Stale Worker Fencing
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: Project Owner
NEXT_CANDIDATE: REL-WP003
NEXT_CANDIDATE_STATUS: NOT STARTED
```

---

## 📋 Work Package Status Summary

- **REL-WP002 — Durable Job Lease + Heartbeat + Stale Worker Fencing**: `READY_FOR_CHATGPT_REVIEW`
- **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `CLOSED / PASS`
  - **SAFE-WP001-R1**: `CLOSED / PASS`
  - **SAFE-WP001-R2**: `CLOSED / PASS`
  - **SAFE-WP001-R3**: `CLOSED / PASS`
- **SYNC-WP001 — LINE OA Customer Directory Sync**: `CLOSED / PASS` (Accepted on Worker v28.8)
- **OA-WP001 — OA Context Isolation & Strict Identity Fencing**: `CLOSED / PASS` (Accepted on Worker v28.5)
- **REL-WP001 — Single Worker Multi-Tab Lock**: `CLOSED / PASS`
- **REL-WP003**: `NOT STARTED`

### Version Contracts
- **Worker Version**: `28.13`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.13`

---

## 📜 Accepted Live UAT Evidence (SAFE-WP001)

### Worker v28.11 Baseline Test Run
- 2-recipient text campaign created while Master Bot was **PAUSED**.
- Exactly 2 jobs queued and processed to completion.
- LINE messages/send physically observed and verified.
- Zero recipient mismatch, zero OA mismatch, and zero `ACCOUNT_PROTECTION_STATE_UNAVAILABLE` errors.
- Initial post-run telemetry became `unknown` after 30s due to missing idle heartbeat.

### Worker v28.12 Telemetry Heartbeat Verification
- Worker v28.12 introduced active-worker telemetry heartbeat in `processQueue()`.
- **Accepted Live UAT Dashboard Telemetry**:
  - Account Protection: **ON**
  - 10m: **0 / 60**
  - 1h: **2 / 300**
  - Next Send: **now**
  - Cooling: **none**
- **UAT Interpretation & Validation**:
  - The 2 previously accepted send reservations correctly aged out of the rolling 10-minute window while remaining inside the rolling 1-hour window.
  - Telemetry heartbeat maintains freshness while Worker is idle without creating fake timestamps.
  - Rolling-window telemetry accurately reflects persisted reservation history.
  - Dashboard no longer falls back to stale `unknown` status while active Worker is healthy and polling.

---

## 🛡️ Final SAFE-WP001 Protection & Safety Contract

- **Per-OA Protection State**: Scoped by `botId`.
- **Send Rate Limits**: Minimum send gap = 10 seconds; Rolling 10-minute cap = 60 send actions; Rolling 1-hour cap = 300 send actions.
- **Fail-Closed Protection Storage**: Strict schema validation (`ACCOUNT_PROTECTION_STATE_UNAVAILABLE` on malformed data).
- **Exact Reservation Verification**: Exact array length/order/value read-back before returning reservation object `{ botId, reservedAt }`. Final reservation revalidated immediately before physical clicks/keydowns.
- **Context Revalidation**: Worker leadership, target recipient, and active OA revalidated post-wait.
- **Target Hygiene**: Excludes blocked recipients (`isBlocked === true`) and deduplicates target IDs on `POST /api/campaign/add`.
- **Adaptive Error Cooldown**: 30s / 60s / 120s / max 300s. 10 consecutive errors triggers circuit breaker stop.
- **Observational Telemetry**: Heartbeat runs via `processQueue()` (~4s cadence) without mutating timestamps or claiming jobs. Stale telemetry (> 30s) displays `unknown` (never fake zero).

> ⚠️ **Compliance Notice**: SAFE-WP001 reduces operational risk. It does NOT guarantee LINE will never restrict or suspend an OA. Internal thresholds are LineSync Plus safety defaults, NOT official LINE API limits. No detection-evasion functionality is included.

---

## 🚀 Next Candidate Work Package

- **Candidate**: `REL-WP002 — Job Lease + Heartbeat`
- **Status**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
- **Note**: Awaits explicit Project Owner authorization before starting. Do NOT start automatically.
