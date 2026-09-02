# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: SYNC-WP001-R4 — Confirmed Contacts Schema + LINE Nickname Mapping + Rate-Limit Guard
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: Project Owner & ChatGPT Control Plane
TASK_TYPE: BOUNDED_CORRECTIVE
```

---

## 📋 Work Package Summary: SYNC-WP001-R4

### Status Summary
- **SYNC-WP001-R4**: `READY_FOR_CHATGPT_REVIEW`
- **SYNC-WP001**: `NOT CLOSED / LIVE UAT BLOCKED PENDING R4 REVIEW`
- **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
- **REL-WP001**: `CLOSED / PASS`
- **REL-WP002**: `READY / NOT STARTED`
- **REL-WP003**: `NOT STARTED`

### Version Contracts
- **Worker Version**: `28.7`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.7`

---

## 🔍 Corrective Solutions Applied (SYNC-WP001-R4)

1. **Confirmed Live Response Schema Alignment (`resp.list`)**:
   - Updated `run/LineSyncApp.js` to require `resp && Array.isArray(resp.list)` and consume `contacts = resp.list`.
   - Removed `resp.contacts` parser; fails closed on unexpected API response shapes.

2. **Correct Display Name Mapping (`nickname` -> `name` -> `"ลูกค้า"`)**:
   - Evaluates `profile.nickname.trim()` first (supporting prefixed OA contact names like `"AC000 Waraporn 89"`).
   - Falls back to `profile.name.trim()`, and then `"ลูกค้า"`. Identity remains `profile.userId`.

3. **Bounded Rate-Limit Safety & Retry Guard (429/403)**:
   - Handles HTTP 429 / 403 explicitly without treating response as malformed JSON.
   - Retries same page/cursor with bounded exponential cooldown (1s, 2s, 3s) up to `MAX_PAGE_RETRIES = 3`.
   - Exhausting retries aborts sync cleanly as ERROR without reporting PASS summary banner.
   - Includes 200ms delay pacing between successful page requests.

4. **Version Bump (`28.6` -> `28.7`)**:
   - `Worker = 28.7` (`run/LineSyncApp.js` v28.7).
   - `Required Worker = 28.7` (`src/runtime-version.ts`).

---

## 🧪 Verification Results

- **Unit Tests**: 85 passed (`npm test`)
- **Build**: Clean (`npm run build`)
- **Script Check**: Valid (`node --check run/LineSyncApp.js`)
- **Diff Check**: Clean (`git diff --check`)
