# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: BUG-WP001 — LINE OA 404 / Wrong Recipient Safety Guard
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: ChatGPT / Control Plane
TASK_TYPE: BUG_FIX_AND_SAFETY_GUARD
```

---

## 📋 Completed Work Package Summary: BUG-WP001

### Implemented Changes:
1. **Explicit 404 / LINE Error Page Detection (`checkIfErrorPage`)**:
   - Detects error URLs (`/error`, `/404`, `/not-found`) and DOM error banners (`404`, `Page Not Found`, `ไม่พบหน้า`, `เกิดข้อผิดพลาดในการโหลด`).
   - Instantly aborts execution and triggers safe recovery.
2. **Exact Recipient Verification (`verifyCurrentRecipient`)**:
   - Strictly verifies that `window.location.pathname` matches `/chat/${expectedUserId}` using regex matching and checks active DOM chat elements for `data-user-id` mismatches.
   - Performed prior to execution, image upload, image confirmation, text typing, and immediately before clicking the Send button.
3. **Removed Unsafe Blind-Click Behavior**:
   - Removed unsafe iteration searching and blind-clicking `li, a, div, span` with `href.includes(userId)`.
4. **Safe Recovery & Bounded Retries (`handleSafeRecovery`)**:
   - Bounded retries (maximum 2 retries per job) with clean session state recovery and redirection to main chat URL (`closeUserChatAndReturnToMain`).
   - If retries exceed limit or recipient cannot be verified, fails job safely with explicit error reason codes (`NAVIGATION_404`, `RECIPIENT_MISMATCH`, `RECIPIENT_UNVERIFIED`).
5. **Re-entrancy / Overlap Lock**:
   - Added `isExecutingJob` flag to prevent concurrent execution of the same job during navigation or recovery.
6. **Userscript Version**: Updated `run/LineSyncApp.js` to v28.0.

---

## ⛔ Execution Policy

- **Package Completion**: BUG-WP001 completed, validated (`npm run build` PASS, `npm test` PASS).
- **Next Step**: Await review and next task authorization from ChatGPT / Control Plane.
