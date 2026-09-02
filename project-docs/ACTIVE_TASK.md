# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: BUG-WP002 — OA Context Poisoning / Invalid BotId 404 Loop
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: ChatGPT / Control Plane
TASK_TYPE: SAFETY_CORRECTIVE_VALIDATION
```

---

## 📋 Completed Work Package Summary: BUG-WP002

### Root Cause Analysis:
- `getBotId()` previously accepted any first path segment on `chat.line.biz` (including short IDs like `798hcuca` on 404 error pages) and also parsed manager portal account IDs (`manager.line.biz/account/...`).
- When an invalid short ID (e.g. `798hcuca`) was saved into `sessionStorage` (`linesync_botid`), `getOAContextUrl()` constructed invalid URLs like `https://chat.line.biz/798hcuca/chat/U...`, leading to a 404 Error page.
- Page-load 404 recovery then re-invoked `getOAContextUrl()` with the poisoned `linesync_botid`, creating a continuous 404 navigation loop.
- `processQueue()` lacked a validation gate and requested campaign jobs from `GET /api/campaign/next` even when on invalid/manager pages or when no valid OA context existed.

### Implemented Safety Correctives:
1. **Strict Chat Context Validator (`isValidChatContextId`)**:
   - Implemented `isValidChatContextId(value)` testing regex `/^U[0-9a-fA-F]{32}$/`.
   - Requires exact format: `U` prefix followed by 32 hexadecimal characters.
   - Rejects short IDs (`798hcuca`), empty/null values, and manager account identifiers.
2. **Removed Manager.line.biz Poisoning & Execution**:
   - Removed `// @match https://manager.line.biz/*` from userscript metadata header.
   - Removed manager URL parsing (`/account/@...`) completely from `getBotId()`.
   - Enforced `window.location.hostname === 'chat.line.biz'` for all bot operations.
3. **Refactored `getBotId()`**:
   - Inspects stored `linesync_botid`; if invalid, removes it from `sessionStorage` and ignores it.
   - Inspects current URL path segment ONLY when on `chat.line.biz` and NOT on a 404/error page.
   - Saves segment ONLY IF `isValidChatContextId` passes. An invalid URL (e.g. `/798hcuca/` 404) cannot overwrite or poison storage.
4. **Fail-Closed `getOAContextUrl(userId)`**:
   - Returns `null` if no trusted valid OA context ID exists.
   - Never falls back to `https://chat.line.biz/` or guesses an OA URL.
5. **`processQueue()` Safety Gate**:
   - Validates `hostname === 'chat.line.biz'`, `!checkIfErrorPage()`, and `isValidChatContextId(getBotId())` BEFORE calling `GET /api/campaign/next`.
   - If valid trusted OA context is unavailable, queue processing is safely blocked (fails closed) without fetching jobs.
6. **404 Recovery (No Invalid Loop)**:
   - **Case 1 (Valid Context Exists)**: Recovery navigates back using ONLY the validated trusted context.
   - **Case 2 (No Valid Context Exists)**: Fails closed. Does not redirect, does not fetch jobs, does not send anything. Waits for user to manually open a valid `chat.line.biz/U...` page.
7. **Recipient Verification Guard (`verifyCurrentRecipient`)**:
   - Requires both trusted valid OA context ID and matching `/${currentBotId}/chat/${expectedUserId}` path before marking recipient send-ready.
8. **Preserved Invariants**:
   - Full-lifecycle execution lock, zero-tolerance image & text guards, same-job recovery, retry counters, blocked user exclusions, quota checks, circuit breaker, diagnostic spool, atomic flush, confirmed-write removal, and `safeClearSessionStorage` remain 100% intact.
9. **Static Acceptance Tests (`src/app.controller.spec.ts`)**:
   - 8 unit test cases added covering valid context ID, invalid short context, poisoned storage removal, manager ID rejection, invalid 404 fail-closed, valid context URL construction, bad current URL preservation, and null fail-closed output (all 18 tests passed).

---

## ⛔ Execution Policy

- **Package Completion**: BUG-WP002 completed, validated (`node --check` PASS, `npm test` PASS [18 passed], `npm run build` PASS, `git diff --check` PASS).
- **Next Step**: Await review and authorization from ChatGPT / Control Plane.
