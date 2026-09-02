# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: SAFE-WP001-R2 — Reservation Integrity + Truthful Protection Telemetry
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: Project Owner
NEXT_CANDIDATE: REL-WP002 — Job Lease + Heartbeat
NEXT_CANDIDATE_STATUS: READY / NOT STARTED / AUTHORIZATION REQUIRED
```

---

## 📋 Work Package Summary: SAFE-WP001-R2 (READY FOR CHATGPT REVIEW)

### Status Summary
- **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `NOT CLOSED / R2 READY_FOR_CHATGPT_REVIEW`
- **SYNC-WP001**: `CLOSED / PASS` (Accepted on Worker v28.8)
- **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
- **REL-WP001**: `CLOSED / PASS`
- **REL-WP002**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
- **REL-WP003**: `NOT STARTED`

### Version Contracts
- **Worker Version**: `28.11`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.11`
- **Implementation Baseline**: `3bca4d5d215556eb5ee9425d49093556203d2488`

---

## 🛡️ Corrective Adjustments (SAFE-WP001-R2)

1. **A. Strict Protection State Schema**:
   - `loadProtectionTimestamps` enforces that every array member MUST be a finite numeric timestamp. Any malformed item throws `ACCOUNT_PROTECTION_STATE_UNAVAILABLE` (no silent member dropping). Returns timestamps in ascending numeric order.

2. **B. Exact Write + Read-Back Verification**:
   - `recordProtectionSendAction` writes and reads back the complete protection array. Verifies exact array length, order, and values. Throws `ACCOUNT_PROTECTION_STATE_UNAVAILABLE` on any mismatch. Returns reservation object `{ botId, reservedAt }`.

3. **C. Final Reservation Revalidation**:
   - `verifyProtectionReservation(botId, reservation)` verifies that `reservation.reservedAt` matches the newest reservation in storage. Immediately before physical image confirm click, text send button click, or Enter keydown, leadership, recipient, OA context, and protection reservation are revalidated. Fails closed (`ACCOUNT_PROTECTION_STATE_UNAVAILABLE`) if reservation is lost.

4. **D. Telemetry Correctness & Write Trust**:
   - Post-reservation telemetry recalculates real `nextSendAt` instead of publishing `0`. Cooldown starts/waits/clears update telemetry dynamically so Dashboard is truthful.
   - `POST /api/account-protection/telemetry` enforces loopback IP, matching `X-LineSync-Worker-Version`, matching `X-LineSync-OA-Context`, matching body `botId`, and strict numeric schema.

---

## 🚀 Next Work Package Candidate

- **Candidate**: `REL-WP002 — Job Lease + Heartbeat`
- **Status**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
- **Note**: Awaits explicit authorization from Project Owner before commencement. Do NOT start automatically.
