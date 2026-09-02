# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: SYNC-WP001-R5 — Full Directory Source Correction to /chats
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: Project Owner & ChatGPT Control Plane
TASK_TYPE: BOUNDED_CORRECTIVE
```

---

## 📋 Work Package Summary: SYNC-WP001-R5

### Status Summary
- **SYNC-WP001-R5**: `READY_FOR_CHATGPT_REVIEW`
- **SYNC-WP001**: `NOT CLOSED / LIVE UAT PENDING R5 REVIEW`
- **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
- **REL-WP001**: `CLOSED / PASS`
- **REL-WP002**: `READY / NOT STARTED`
- **REL-WP003**: `NOT STARTED`

### Version Contracts
- **Worker Version**: `28.8`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.8`

---

## 📊 Authoritative Live Evidence (Read-Only Comparison)

- **/contacts Endpoint**: 5,112 unique contact records.
- **/chats Endpoint**: 9,742 unique records in initial read-only run; 9,741 unique in subsequent read-only run.
- **Overlap**: All 5,112 `/contacts` users are a strict subset of `/chats` (0 contacts-only users).
- **DB vs /chats Comparison**:
  - DB Unique: `9,747`
  - Chats Unique: `9,741`
  - Overlap: `9,741`
  - Chats-only: `0`
  - DB-only: `6` (preserved via non-destructive policy)
- **Conclusion**: `/chats` (`/api/v2/bots/{botId}/chats?folderType=ALL&limit=20&prioritizePinnedChat=true`) is the authoritative source for full customer directory synchronization.

---

## 🔍 Corrective Solutions Applied (SYNC-WP001-R5)

1. **Full Directory Source Correction (`/chats`)**:
   - `run/LineSyncApp.js` queries `https://chat.line.biz/api/v2/bots/${botId}/chats?folderType=ALL&limit=20&prioritizePinnedChat=true`.
   - Discontinued use of `/contacts` endpoint for full directory sync.

2. **Identity & Name Extraction**:
   - Identity remains `item.profile.userId` (`^U[0-9a-fA-F]{32}$`).
   - Display name uses `profile.nickname.trim()` -> `profile.name.trim()` -> `"ลูกค้า"`.
   - Zero mapping of `latestEvent`, message text, `quoteToken`, `sendId`, or `contentHash`.

3. **Non-Destructive DB Policy Preserved**:
   - DB records missing from `/chats` (e.g. the 6 DB-only records) are left untouched.
   - `isBlocked` and `blockReason` fields are strictly preserved.

4. **Neutral Wording & Safety Safeguards**:
   - UI text updated to `"LINE Chat Directory"`.
   - All R4 safeguards retained: `resp.list` schema parser, `resp.next` cursor, 429/403 bounded retries (max 3), 200ms page pacing, repeat/max-page aborts.

5. **Version Bump (`28.7` -> `28.8`)**:
   - `Worker = 28.8` (`run/LineSyncApp.js` v28.8).
   - `Required Worker = 28.8` (`src/runtime-version.ts`).

---

## 🧪 Verification Results

- **Unit Tests**: 86 passed (`npm test`)
- **Build**: Clean (`npm run build`)
- **Script Check**: Valid (`node --check run/LineSyncApp.js`)
- **Diff Check**: Clean (`git diff --check`)
