# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: BUG-WP001-R1 — Execution Lock / Same-Job Recovery / Final Send Guard
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: ChatGPT / Control Plane
TASK_TYPE: BUG_FIX_CORRECTIVE_SAFETY
```

---

## 📋 Completed Work Package Summary: BUG-WP001-R1

### Implemented Corrections:
1. **Full Lifecycle Execution Lock (`isExecutingJob`)**:
   - Lock remains active across the entire job lifecycle (navigation verification -> input discovery -> image/text preparation -> final recipient verification -> send/recovery -> finishJob).
   - Lock is released ONLY inside `finishJob` upon reaching terminal state (Success or Final Failure), or during same-job navigation retry.
2. **Same-Job Safe Recovery (`handleSafeRecovery`)**:
   - Directly retries the **SAME** `jobData` without calling `processQueue()` or fetching a new customer from backend.
   - Preserves `linesync_jobid`, `linesync_uid`, `linesync_msg`, etc. in `sessionStorage` during bounded retries (max 2 retries per job).
   - Marks the SAME job as failed via `finishJob` only if retries are exceeded or non-retryable.
3. **Page-Load 404 Recovery Guard**:
   - On page load, if 404/error page occurs or recipient verification fails while a job is active in `sessionStorage`, `savedJobData` is reconstructed and passed into `handleSafeRecovery(savedJobData)`.
4. **Preserved OA Account Context (`getBotId` / `getOAContextUrl`)**:
   - Extracts and persists current LINE OA `botId` from URL path / manager path.
   - All recovery navigations return to `https://chat.line.biz/${botId}/chat/${userId}` or `https://chat.line.biz/${botId}/`, preventing cross-account switching.
5. **Zero-Tolerance Image Send Guard (`confirmAndCloseImageModal(expectedUserId)`)**:
   - Recipient verification checked during modal waiting loop and immediately before clicking the confirm image button.
   - Throws `RECIPIENT_UNVERIFIED` and cancels click if verification fails.
6. **Zero-Tolerance Text Send Guard (`sendChatMessage(chatInput, expectedUserId)`)**:
   - Recipient verification checked immediately before clicking Send button or dispatching Enter key fallback.
   - Throws `RECIPIENT_UNVERIFIED` and cancels send action if verification fails.
7. **Userscript Version**: Updated `run/LineSyncApp.js` to v28.1.

---

## ⛔ Execution Policy

- **Package Completion**: BUG-WP001-R1 completed, validated (`node --check` PASS, `npm run build` PASS, `npm test` PASS).
- **Next Step**: Await review and authorization from ChatGPT / Control Plane.
