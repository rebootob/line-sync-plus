# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: REL-WP001 — Single Worker / Multi-Tab Lock
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: ChatGPT / Control Plane
TASK_TYPE: RELIABILITY_HARDENING
```

---

## 📋 Completed Work Package Summary: REL-WP001

### Implemented Single-Worker Multi-Tab Lock Controls:
1. **Worker Version Upgrade**:
   - `run/LineSyncApp.js`: `@version 28.4`, `WORKER_VERSION = '28.4'`.
   - `src/runtime-version.ts`: `REQUIRED_WORKER_VERSION = '28.4'`.
   - `index.html`: `v28.4` runtime version fallback badge.
   - `src/app.controller.spec.ts`: Version tests updated to 28.4 (All 33 tests passed).
2. **Leader Election & Coordination (Web Locks API + localStorage)**:
   - Atomic election mutex via `navigator.locks.request('linesync_worker_election_v1', { mode: 'exclusive' }, ...)`.
   - Shared leader lease record stored in `localStorage` under `linesync_worker_leader_v1`:
     `{ ownerTabSessionId, leaseId, workerVersion, acquiredAt, expiresAt }`.
   - Bounded lease duration: `WORKER_LEASE_MS = 20000` (20s), renewed every `WORKER_RENEW_INTERVAL_MS = 4000` (4s).
   - Same-tab navigation continuity: Lease extended with `NAVIGATION_LEASE_MS = 45000` (45s) before bot-controlled navigations.
   - Fail-closed unsupported lock rule: If `navigator.locks` is unavailable, tab becomes STANDBY and logs `[REL] WORKER LOCK UNSUPPORTED`.
3. **Queue Gate & Post-Claim Verification**:
   - `processQueue()` requires `ensureWorkerLeadership()` PASS before fetching `/campaign/next`. Non-leader tabs remain STANDBY and retry election after 4s without fetching jobs.
   - Re-verifies `hasValidWorkerLeadership()` immediately after `/campaign/next` returns a processing job. If lost, invokes `handleLeadershipLost('LOST_AFTER_CLAIM')` without sending or failing the job.
4. **Pre-Send Fencing Integrity**:
   - Re-verifies `hasValidWorkerLeadership()` before `executeChatBot()`, before chat input focus, before image attachment, before image send click (`confirmAndCloseImageModal`), before text insertion, and before text send click/Enter fallback (`sendChatMessage`).
   - If leadership check fails, throws `WORKER_LEADERSHIP_LOST` and routes to `handleLeadershipLost()`.
5. **Leadership Loss Handler (`handleLeadershipLost`)**:
   - Relinquishes local active-job session fields in `sessionStorage` (`linesync_jobid`, `linesync_uid`, `linesync_msg`, `linesync_type`, `linesync_img`, `linesync_link`).
   - Does NOT send, finish/fail job, stop campaign, increment `retryCount` or `consecutiveErrorCount`, or navigate. Leaves backend job in processing state for existing stale-job recovery.
6. **Terminal Report Preservation**:
   - Gating is NOT applied after physical message send completes, allowing `finishJob(..., true)` to complete terminal success reporting without duplication.
7. **Scope Boundary**:
   - REL-WP001 protects multi-tab execution within the SAME `chat.line.biz` browser profile/storage partition (`localStorage`). Cross-profile or cross-machine protection belongs to later reliability work packages (REL-WP002/003).

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

- **REL-WP001 Status**: `READY_FOR_CHATGPT_REVIEW` (Do NOT mark CLOSED yet).
- **Next Work Packages**:
  - `REL-WP002`: `NOT STARTED`
  - `REL-WP003`: `NOT STARTED`
- **Next Step**: Await review and authorization from ChatGPT / Control Plane.
