# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: REL-WP001-R1 — Fail-Closed Lease Persistence + Complete Navigation Hold
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: ChatGPT / Control Plane
TASK_TYPE: RELIABILITY_CORRECTIVE
```

---

## 📋 Corrective Work Package Summary: REL-WP001-R1

### Implemented Controls & Corrective Hardening:

1. **Fail-Closed Lease Persistence (`writeAndVerifyLeaderRecord`)**:
   - `writeAndVerifyLeaderRecord(record)` attempts `localStorage.setItem(WORKER_LEADER_KEY, ...)`, reads raw record back immediately, parses safely, and verifies:
     - `ownerTabSessionId === record.ownerTabSessionId`
     - `leaseId === record.leaseId`
     - `workerVersion === record.workerVersion`
     - `expiresAt === record.expiresAt`
   - If any step fails (localStorage exception, JSON parse error, read-back mismatch, or missing record), sets `isCurrentTabLeader = false`, logs `[REL] WORKER LEASE PERSIST FAILED`, and returns `false`.
   - Never swallows storage-write failure or reports false leadership. Applied across initial leader acquisition, same-tab renewal, and navigation lease extension.

2. **Complete Navigation Lease Coverage (`navigateAsLeader`)**:
   - Centralized navigation helper `navigateAsLeader(targetUrl, reason)` validates leadership, extends navigation lease (`NAVIGATION_LEASE_MS = 45000`), verifies read-back persistence under `WORKER_ELECTION_LOCK`, and only then executes `window.location.href = targetUrl`.
   - If lease extension fails, navigation is BLOCKED (`handleLeadershipLost('NAVIGATION_LEASE_EXTEND_FAILED')`), failing closed.
   - All 5 bot-controlled full-page navigation paths in `run/LineSyncApp.js` route through `navigateAsLeader`:
     1. Normal recipient navigation (`processQueue`)
     2. SAME-JOB RECOVERY recipient navigation (`handleSafeRecovery`)
     3. Queue 404/error recovery to OA main (`processQueue`)
     4. Return-to-OA-main after job completion (`closeUserChatAndReturnToMain`)
     5. Page-load 404/error recovery to OA main (`window.load` listener)

3. **Atomic Pre-Send Leadership Confirmation (`confirmWorkerLeadershipForSend`)**:
   - Immediately before irreversible physical sends, `confirmWorkerLeadershipForSend()` executes under Web Locks election mutex (`WORKER_ELECTION_LOCK`), verifies ownership, renews lease, and read-back verifies persistence.
   - Used immediately before:
     - Image Send click (`confirmAndCloseImageModal`)
     - Text Send button click / Enter key fallback (`sendChatMessage`)
   - Returns `false` -> throws `WORKER_LEADERSHIP_LOST` and routes to `handleLeadershipLost()`.
   - Does NOT gate `finishJob(true)` after a physical message send has already completed.

4. **Regression Protection & Test Suite**:
   - Added 3 focused static/unit tests in `src/app.controller.spec.ts` under `REL-WP001-R1`. All 36 Jest tests passing cleanly.

---

## 🚀 UAT Preparation & Rollout Order

1. **Step 1**: Pause Master Bot / ensure no active physical send.
2. **Step 2**: Deploy backend requiring worker `28.4`.
3. **Step 3**: Update Tampermonkey to worker `28.4`.
4. **Step 4**: Confirm Runtime Contract `v1` / Required Worker `v28.4`.
5. **Step 5**: Open two LINE OA tabs in browser.
6. **Step 6**: Keep campaign paused until ChatGPT supplies exact UAT execution steps.

---

## ⛔ Execution Policy

- **REL-WP001-R1 Status**: `READY_FOR_CHATGPT_REVIEW`
- **REL-WP001 Status**: `READY_FOR_CHATGPT_REVIEW` (NOT CLOSED)
- **Next Work Packages**:
  - `REL-WP002`: `NOT STARTED`
  - `REL-WP003`: `NOT STARTED`
- **Next Step**: Await review and authorization from ChatGPT / Control Plane.
