# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: Project Owner
NEXT_CANDIDATE: REL-WP002 — Job Lease + Heartbeat
NEXT_CANDIDATE_STATUS: READY / NOT STARTED / AUTHORIZATION REQUIRED
```

---

## 📋 Work Package Summary: SAFE-WP001 (READY FOR CHATGPT REVIEW)

### Status Summary
- **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `READY_FOR_CHATGPT_REVIEW`
- **SYNC-WP001**: `CLOSED / PASS` (Accepted on Worker v28.8)
- **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
- **REL-WP001**: `CLOSED / PASS`
- **REL-WP002**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
- **REL-WP003**: `NOT STARTED`

### Version Contracts
- **Worker Version**: `28.9`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.9`
- **Implementation Baseline**: `6588270c1d9bd3cc818d6b3784584fb25888c309`

---

## 🛡️ Key Protection Mechanisms (SAFE-WP001)

1. **Final Irreversible Send Rate Guard (`enforceAccountProtectionGate`)**:
   - Centralized gate before image confirm send click and text send click / Enter fallback.
   - Executes AFTER leadership, recipient, and OA verification, and BEFORE physical send.
   - Per-OA `localStorage` state key: `linesync_account_protection_v1_<botId>`.
   - Internal protection defaults: `MIN_SEND_GAP_MS = 10000` (10s gap), `MAX_SEND_ACTIONS_10_MIN = 60` (rolling 10m limit), `MAX_SEND_ACTIONS_1_HOUR = 300` (rolling 1h limit).
   - Rate limit wait loop retains exact active job (does NOT fail or complete job) and revalidates leadership, recipient, and OA after waiting.

2. **Campaign Target Hygiene (`POST /api/campaign/add`)**:
   - Deduplicates target IDs in request.
   - Verifies target OA ownership.
   - Excludes blocked customers (`isBlocked === true`).
   - Sets `Campaign.totalTargets` to actual queued count (`queuedCount`).
   - Rejects request with HTTP 400 if 0 valid targets remain.

3. **Adaptive System-Error Backoff**:
   - Error #1 = 30s, Error #2 = 60s, Error #3 = 120s, Error #4+ = max 300s.
   - Blocked recipients do NOT count as system errors.
   - Successful job resets consecutive error count to 0 and clears cooldown.
   - 10 consecutive system errors still triggers circuit breaker hard stop.

4. **Dashboard Visibility (`index.html`)**:
   - Compact protection badge: `🛡️ Account Protection: ON | 10m: <cnt>/60 | 1h: <cnt>/300 | Next Send: <now/sec> | Cooling: <none/sec>`.

> ⚠️ **Compliance Notice**: SAFE-WP001 is an operational risk-reduction control. It does NOT guarantee that LINE will never restrict/suspend an OA. Internal rate thresholds are safety defaults, not official LINE API limits. Zero detection evasion techniques are included.

---

## 🚀 Next Work Package Candidate

- **Candidate**: `REL-WP002 — Job Lease + Heartbeat`
- **Status**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
- **Note**: Awaits explicit authorization from Project Owner before commencement. Do NOT start automatically.
