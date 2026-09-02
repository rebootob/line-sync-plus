# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: BUG-WP002-R1 — Preserve Active Job When OA Context Is Unknown
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: ChatGPT / Control Plane
TASK_TYPE: SAFETY_CORRECTIVE_PRESERVATION
```

---

## 📋 Completed Work Package Summary: BUG-WP002-R1

### Implemented Corrections:
1. **Active Job Preservation When OA Context Is Missing (`handleSafeRecovery`)**:
   - `handleSafeRecovery` checks `const targetUrl = getOAContextUrl(jobData.userId)` BEFORE consuming a retry attempt or incrementing `retryCount`.
   - If `!targetUrl` (missing/invalid OA context):
     - Does **NOT** call `finishJob()`.
     - Does **NOT** call `/campaign/fail`.
     - Does **NOT** clear active job session fields (`linesync_jobid`, `linesync_uid`, `linesync_msg`, `linesync_type`, `linesync_img`, `linesync_link`).
     - Does **NOT** fetch another job (`/campaign/next`).
     - Does **NOT** navigate or redirect.
     - Does **NOT** increment `retryCount`.
     - Sets `isExecutingJob = false` safely and returns to wait for the user to manually open a valid `chat.line.biz/U<32hex>/` page.
2. **Page-Load Recovery & Job Resumption**:
   - When the user manually navigates to a valid LINE Chat page (`https://chat.line.biz/Uaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/`), `getBotId()` captures the valid context ID into `sessionStorage`.
   - On page load, the bot reconstructs saved Job A parameters from `sessionStorage`.
   - Since current URL is main OA list `/U.../` (not recipient chat), `handleSafeRecovery(Job A, 'RECIPIENT_UNVERIFIED')` is called.
   - Now `getOAContextUrl(User A)` returns `https://chat.line.biz/U.../chat/User A`. `retryCount` is incremented (1/2), and the bot navigates directly to the recipient chat room to complete Job A.
   - Job A is finalized ONLY after successful send or actual bounded retry exhaustion on a valid target URL.
3. **Unit Test Suite (`src/app.controller.spec.ts`)**:
   - Added test 9 verifying active job preservation when `targetUrl` is null.
   - Added test 10 verifying `retryCount` is not consumed when OA context is missing (20 tests passed).

---

## ⛔ Execution Policy

- **Package Completion**: BUG-WP002-R1 completed, validated (`node --check` PASS, `npm test` PASS [20 passed], `npm run build` PASS, `git diff --check` PASS).
- **Next Step**: Await review and authorization from ChatGPT / Control Plane.
