# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: SAFE-WP001-R1 — Fail-Closed Protection State + Truthful Dashboard Telemetry
STATUS: R1_READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: Project Owner
NEXT_CANDIDATE: REL-WP002 — Job Lease + Heartbeat
NEXT_CANDIDATE_STATUS: READY / NOT STARTED / AUTHORIZATION REQUIRED
```

---

## 📋 Work Package Summary: SAFE-WP001-R1 (R1 READY FOR CHATGPT REVIEW)

### Status Summary
- **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `NOT CLOSED / R1 READY_FOR_CHATGPT_REVIEW`
- **SYNC-WP001**: `CLOSED / PASS` (Accepted on Worker v28.8)
- **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
- **REL-WP001**: `CLOSED / PASS`
- **REL-WP002**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
- **REL-WP003**: `NOT STARTED`

### Version Contracts
- **Worker Version**: `28.10`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.10`
- **Implementation Baseline**: `07b9dc4d951510b90b6716703ec7e0fb2d2fda3b`

---

## 🛡️ Corrective Adjustments (SAFE-WP001-R1)

1. **A. Fail-Closed Protection State**:
   - Reading malformed/corrupted/unavailable protection state throws `ACCOUNT_PROTECTION_STATE_UNAVAILABLE`.
   - Reservation writing requires write + read-back verification.
   - If protection state cannot be safely read, written, or verified, physical send is blocked immediately (`ACCOUNT_PROTECTION_STATE_UNAVAILABLE`).

2. **B. Truthful Dashboard Telemetry**:
   - Worker publishes observation to `POST /api/account-protection/telemetry` (scoped by `botId`).
   - Dashboard polls `GET /api/account-protection/status?botId=...`.
   - Displays real telemetry when available (`10m`, `1h`, `Next Send`, `Cooling`).
   - Shows `"unknown"` (not fake `0`) when telemetry is unavailable or stale (> 30s).

3. **C. Final Send Revalidations**:
   - Revalidates leadership, recipient, OA context, and protection reservation immediately before image confirm click, text send click, and Enter key fallback.

---

## 🚀 Next Work Package Candidate

- **Candidate**: `REL-WP002 — Job Lease + Heartbeat`
- **Status**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
- **Note**: Awaits explicit authorization from Project Owner before commencement. Do NOT start automatically.
