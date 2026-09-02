# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: OA-WP001-R1 — Strict OA Identity Fencing & Regression Restore
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: Project Owner & ChatGPT Control Plane
TASK_TYPE: IMPLEMENTATION_CORRECTIVE
```

---

## 📋 Work Package Summary: OA-WP001 / OA-WP001-R1

### Status Summary
- **OA-WP001-R1**: `READY_FOR_CHATGPT_REVIEW`
- **OA-WP001**: `READY_FOR_CHATGPT_REVIEW` (NOT CLOSED)
- **REL-WP001**: `CLOSED / PASS`
- **REL-WP002**: `NOT STARTED`
- **REL-WP003**: `NOT STARTED`

### Version Contracts
- **Worker Version**: `28.5`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.5`

---

## 🛡️ OA-WP001-R1 Corrective Actions Implemented

1. **BLOCKER 1 — Fail-Closed Terminal Fallback**:
   - `POST /api/campaign/success` and `POST /api/campaign/fail` reject `userId`-only fallback requests without a valid `botId` with `400 Bad Request`.
   - Primary lookup remains `jobId`. Fallback lookup requires `botId` + `lineUserId` + `status: 'processing'`.
   - Customer block status update in `markFail` strictly requires `job.botId` + `job.lineUserId`. If `job.botId` is missing/invalid, no customer record is modified.

2. **BLOCKER 2 — Mandatory Expected Job OA Fence**:
   - Pre-physical send guards (`executeChatBot`, `confirmAndCloseImageModal`, `sendChatMessage`) evaluate `!expectedBotId || !isValidChatContextId(expectedBotId) || !verifyCurrentOAContext(expectedBotId)`.
   - Aborts immediately with `OA_CONTEXT_MISMATCH` if `expectedBotId` is missing, invalid, or unverified.

3. **BLOCKER 3 — Saved Job OA Identity Recovery**:
   - Page-load active job recovery reads `linesync_job_botid`.
   - If `linesync_job_botid` is missing, empty, or invalid, local active job state is cleared without sending, navigating, reporting, or incrementing error counts.

4. **BLOCKER 4 — Central Active Job Cleanup**:
   - Centralized helper `clearLocalActiveJobState()` clears `linesync_jobid`, `linesync_uid`, `linesync_msg`, `linesync_type`, `linesync_img`, `linesync_link`, `linesync_job_botid`.
   - Invoked across duplicate tab identity clone, `handleLeadershipLost`, non-leader standby, `OA_CONTEXT_MISMATCH`, and normal completed job cleanup.

5. **BLOCKER 5 — Terminal Report Payload**:
   - `/campaign/success` and `/campaign/fail` include `botId` payload (`{ jobId, userId, botId }`) using expected job `botId`.

6. **BLOCKER 6 — Queue Claim OA Isolation**:
   - `GET /api/campaign/next` removed `|| activeBotId` fallback for `selectedJob.botId`.
   - Requires `selectedJob.botId === activeBotId` and `targetCampaign.botId === activeBotId`.

7. **BLOCKER 7 — Group Detail & Delete OA Scope**:
   - `GET /api/groups/:id` and `DELETE /api/groups/:id` require valid `botId` query parameter (`?botId=...`). Fails with `400 Bad Request` if missing.
   - Dashboard (`index.html`) appends `?botId=${encodeURIComponent(currentActiveBotId)}` on detail and delete calls.

8. **BLOCKER 8 — Image Upload Contract Restored**:
   - `POST /api/upload/image` and `GET /api/uploads/:filename` restored exact parent baseline behavior.
   - Files saved to `process.cwd()/uploads`, returning `{ success: true, url: fileUrl, filename: savedFilename }`.

---

## 🧪 Verification Results

- **Unit Tests**: 59 passed (`npm test`)
- **Build**: Clean (`npm run build`)
- **Script Check**: Valid (`node --check run/LineSyncApp.js`)
- **Diff Check**: Clean (`git diff --check`)
