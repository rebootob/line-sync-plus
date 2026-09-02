# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: REL-WP001-R2 — Duplicate-Tab Identity Clone Defense
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: ChatGPT / Control Plane
TASK_TYPE: RELIABILITY_CORRECTIVE
```

---

## 📋 Corrective Work Package Summary: REL-WP001-R2

### Implemented Controls & Duplicate Tab Identity Defense:

1. **Document-Lifetime Tab Identity Lock (`ensureTabIdentity`)**:
   - `const TAB_IDENTITY_LOCK_PREFIX = 'linesync_tab_identity_v1_';`
   - Uses non-blocking Web Locks API (`navigator.locks.request(TAB_IDENTITY_LOCK_PREFIX + currentTabId, { mode: 'exclusive', ifAvailable: true }, ...)`) to claim an unshared document-lifetime identity lock.
   - Held for document lifetime (different from short-lived `WORKER_ELECTION_LOCK`).

2. **Cloned Tab Detection & Identity Reassignment**:
   - When a tab is opened or duplicated from an existing leader tab, `sessionStorage` (`linesync_tab_session_id`, `linesync_tab_lease_id`, active job fields) is copied into the new context.
   - `ensureTabIdentity()` attempts to claim `linesync_tab_identity_v1_<tabSessionId>`. If `lock === null` (already held by original live tab):
     - **Logs**: `[REL] DUPLICATE TAB IDENTITY DETECTED`
     - **Action**:
       1. Generates a NEW `tabSessionId`.
       2. Replaces `linesync_tab_session_id` in `sessionStorage`.
       3. Removes copied `linesync_tab_lease_id` from `sessionStorage` and sets `currentTabLeaseId = null`.
       4. Clears copied active-job session state (`linesync_jobid`, `linesync_uid`, `linesync_msg`, `linesync_type`, `linesync_img`, `linesync_link`).
       5. Does NOT call `/campaign/success`, `/campaign/fail`, or `/campaign/stop`.
       6. Does NOT touch existing `localStorage` leader record (`linesync_worker_leader_v1`).
       7. Acquires document-lifetime identity lock for the NEW `tabSessionId`.
       8. **Logs**: `[REL] NEW TAB IDENTITY ASSIGNED`
       9. Cloned tab becomes a clean STANDBY tab.

3. **Leadership Integration**:
   - `hasValidWorkerLeadership()` requires `isTabIdentityVerified === true`.
   - `ensureWorkerLeadership()` and `confirmWorkerLeadershipForSend()` require `isTabIdentityVerified === true` before running election/renewal or atomic pre-send confirmation.
   - If identity lock cannot be established, logs `[REL] TAB IDENTITY UNVERIFIED` and fails closed (no `/campaign/next`, no send, no leader navigation).

4. **Same-Tab Full-Page Navigation Continuity**:
   - On full-page navigation, document unloads and releases its identity lock. The new document in the SAME tab reads `linesync_tab_session_id` from `sessionStorage`, reacquires its identity lock, and continues using its existing `linesync_tab_lease_id` and durable `localStorage` leader record.

5. **Regression & Test Suite**:
   - Added 3 focused static/unit tests under `REL-WP001-R2` in `src/app.controller.spec.ts`. All 39 Jest tests passing cleanly.

---

## 🚀 UAT Preparation & Support Matrix

- **CASE A**: Open normal second tab. -> 1 Leader, 1 Standby.
- **CASE B**: Chrome "Duplicate" on current Leader tab. -> Original tab keeps leader identity. Duplicated tab detects copied identity, assigns new `tabSessionId`, clears copied lease/job state, and becomes STANDBY.
- **CASE C**: Close Leader tab. -> After 20s lease expiry, one Standby becomes Leader. Only 1 Leader exists.

---

## ⛔ Execution Policy

- **REL-WP001-R2 Status**: `READY_FOR_CHATGPT_REVIEW`
- **REL-WP001-R1 Status**: `READY_FOR_CHATGPT_REVIEW`
- **REL-WP001 Status**: `READY_FOR_CHATGPT_REVIEW` (NOT CLOSED)
- **Next Work Packages**:
  - `REL-WP002`: `NOT STARTED`
  - `REL-WP003`: `NOT STARTED`
- **Next Step**: Await review and authorization from ChatGPT / Control Plane.
