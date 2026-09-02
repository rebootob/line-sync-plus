# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: SYNC-WP001 — LINE OA Customer Directory Sync to DB (Refined Reporting Metrics)
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: Project Owner & ChatGPT Control Plane
TASK_TYPE: FEATURE_IMPLEMENTATION
```

---

## 📋 Work Package Summary: SYNC-WP001

### Status Summary
- **SYNC-WP001**: `READY_FOR_CHATGPT_REVIEW` (NOT CLOSED)
- **OA-WP001**: `CLOSED / PASS`
- **OA-WP001-R1**: `CLOSED / PASS`
- **REL-WP001**: `CLOSED / PASS`
- **REL-WP002**: `READY / NOT STARTED`
- **REL-WP003**: `NOT STARTED`

### Version Contracts
- **Worker Version**: `28.6`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.6`

---

## 🔍 Confirmed Metrics & Reporting Model

1. **Independent Sync Metrics**:
   - `contactsFetched`: Total contact records received from LINE across all pages BEFORE DB deduplication.
   - `inserted`: Customer did not previously exist under `(botId, lineUserId)` identity and was newly inserted.
   - `updatedName`: Customer already existed under `botId + lineUserId`, but `displayName` changed and was updated.
   - `existingUnchanged`: Customer already existed under `botId + lineUserId` and `displayName` was unchanged. (Primary user-facing "มีอยู่แล้ว / ซ้ำกับ DB" count).
   - `duplicateInSync`: Duplicate `lineUserId` encountered more than once during the SAME sync run. Tracked independently from `existingUnchanged`.
   - `invalid`: Missing/invalid `profile.userId` or otherwise unusable contact.
   - `pagesFetched`: Total LINE contacts API pages fetched.
   - `dbTotalAfterSync`: Final number of Customer records belonging to the synced `botId` after sync completes.
   - `elapsedSeconds`: Total elapsed sync execution time in seconds.

2. **Backend API Contract (`POST /api/customers/sync-batch`)**:
   - Returns `{ success: true, received, inserted, updatedName, existingUnchanged, duplicateInBatch, invalid }`.

3. **Privacy Invariants**:
   - Opaque pagination cursors, tokens, cookies, and auth headers are **NEVER** persisted, written to diagnostic logs, or printed.

---

## 🧪 Verification Results

- **Unit Tests**: 73 passed (`npm test`)
- **Build**: Clean (`npm run build`)
- **Script Check**: Valid (`node --check run/LineSyncApp.js`)
- **Diff Check**: Clean (`git diff --check`)
