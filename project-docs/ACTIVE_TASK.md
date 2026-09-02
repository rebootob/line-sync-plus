# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: SYNC-WP001 — LINE OA Customer Directory Sync to DB
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

## 🔍 Confirmed Discovery & Technical Details

1. **LINE OA Contacts API Contract**:
   - Endpoint: `GET https://chat.line.biz/api/v2/bots/{botId}/contacts?query=&sortKey=DISPLAY_NAME&sortOrder=ASC&filterKey=ALL&limit=20`
   - Page size: `limit=20`
   - Pagination mechanism: Opaque runtime cursor `response.next` passed as `&next=<cursor>` in subsequent requests.
   - Privacy & Security invariant: Opaque cursor values are **NEVER** hardcoded, persisted to DB/session, written to diagnostic logs, or printed in full.

2. **Directory Identity & Storage Mapping**:
   - Primary key: Composite `(botId, lineUserId)`.
   - Contact mapping: `contact.profile.userId` -> `Customer.lineUserId`, `contact.profile.name` -> `Customer.displayName`.
   - Non-destructive sync: Existing `isBlocked`, `blockReason`, `pictureUrl`, `statusMessage`, `imageUrl`, and `createdAt` safety information are strictly preserved.
   - Unchanged records are not re-saved to DB. Missing customers from a sync run are never deleted or marked blocked.

3. **Multi-OA & Safety Invariants**:
   - 3-way OA alignment gate: `physicalBotId === activeBotId === requestedSyncBotId`.
   - Master Bot MUST be PAUSED before sync execution.
   - Exclusive Web Lock `linesync_customer_sync_v1` prevents concurrent sync jobs across browser tabs.
   - Loopback enforcement: `POST /api/customers/sync-batch` accepts requests strictly from `127.0.0.1`, `::1`, `::ffff:127.0.0.1`.
   - Max batch size: 250 records per POST request.

---

## 🧪 Verification Results

- **Unit Tests**: 73 passed (`npm test`)
- **Build**: Clean (`npm run build`)
- **Script Check**: Valid (`node --check run/LineSyncApp.js`)
- **Diff Check**: Clean (`git diff --check`)
