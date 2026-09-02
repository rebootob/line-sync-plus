# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: NONE
STATUS: SYNC-WP001 CLOSED / PASS
AUTHORIZED_BY: Project Owner & ChatGPT Control Plane
NEXT_CANDIDATE: REL-WP002 — Job Lease + Heartbeat
NEXT_CANDIDATE_STATUS: READY / NOT STARTED / AUTHORIZATION REQUIRED
```

---

## 📋 Work Package Summary: SYNC-WP001 (CLOSED / PASS)

### Status Summary
- **SYNC-WP001 — LINE OA Customer Directory Sync to DB**: `CLOSED / PASS`
- **SYNC-WP001-R1**: `CLOSED / PASS`
- **SYNC-WP001-R2**: `CLOSED / PASS`
- **SYNC-WP001-R3**: `CLOSED / PASS`
- **SYNC-WP001-R4**: `CLOSED / PASS`
- **SYNC-WP001-R5**: `CLOSED / PASS`
- **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
- **REL-WP001**: `CLOSED / PASS`
- **REL-WP002**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
- **REL-WP003**: `NOT STARTED`

### Version Contracts
- **Worker Version**: `28.8`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.8`
- **Accepted Implementation Baseline**: `b1d6ba8a669eaa98b167a7ad2d34712c85c02953`

---

## 🟢 Accepted Live UAT Evidence (SYNC-WP001 / Worker v28.8)

- **Target OA**: OA #1 (`U09d6b286c73c14c12cb6b8479d105941`)
- **Full Directory Endpoint**: `GET /api/v2/bots/{botId}/chats?folderType=ALL&limit=20&prioritizePinnedChat=true`
- **Live Performance & Metrics**:
  - **LINE Records Fetched**: `9,741`
  - **Newly Inserted**: `0`
  - **Display Names Updated**: `4,629`
  - **Existing Unchanged**: `5,112`
  - **Duplicates Within Sync**: `0`
  - **Invalid/Skipped**: `0`
  - **Pages Fetched**: `488`
  - **DB Total After Sync**: `9,747`
  - **Elapsed Time**: `341.4 seconds`
  - **Metric Reconciliation**: `4,629 + 5,112 = 9,741`
  - **Non-Destructive Policy**: DB remained at `9,747`. The `6` DB-only records were NOT deleted, NOT marked blocked, and NOT marked inactive.

### 📝 Idempotency Evidence Note
> An explicit second identical Live Sync rerun was not separately performed. Idempotency and duplicate behavior remain covered by the reviewed implementation/unit tests. Closure is based on the accepted full v28.8 Live UAT plus static/test review.

---

## 🔍 Read-Only Source Discovery Evidence

- **/contacts Endpoint**: `5,112` unique contact records.
- **/chats Endpoint**: `9,742` unique in initial read-only run; `9,741` unique in subsequent read-only run.
- **Overlap**: All `5,112` `/contacts` users are a strict subset of `/chats` (`0` contacts-only users).
- **Latest DB vs /chats Comparison**:
  - DB Unique: `9,747`
  - Chats Unique: `9,741`
  - Overlap: `9,741`
  - Chats-only: `0`
  - DB-only: `6` (DB-only blocked: `0`, DB-only active: `6`)
- **Source Nature**: `/contacts` is only a partial subset. `/chats` is the accepted Full Customer Directory source. LINE `/chats` count is live and dynamic and must NOT be treated as a permanently fixed expected count. The cause of DB-only records is UNKNOWN and must not be guessed.

---

## 🛡️ Sync Safety Contract

1. **Customer Identity**: Composite primary key `(botId, lineUserId)`. Identity is strictly `profile.userId` (`^U[0-9a-fA-F]{32}$`).
2. **Display Name Hierarchy**: `profile.nickname` -> `profile.name` -> `"ลูกค้า"`.
3. **Master Bot Gate**: Master Bot status MUST be `PAUSED` (`enabled === false`).
4. **Active OA Fencing**: Physical LINE OA must match `activeBotId`.
5. **Non-Destructive Policy**: Missing customers from `/chats` do NOT trigger delete, block, or inactive flags. `isBlocked` and `blockReason` are strictly preserved.
6. **No Message Content Storage**: `latestEvent`, message text, `quoteToken`, `sendId`, and `contentHash` are never persisted by customer sync.
7. **Pagination Safeguards**: Strict `resp.list` schema parser, `resp.next` cursor pagination, repeated cursor loop detection, max-page guard, 429/403 bounded retry with 200ms pacing. Zero logging/persistence of cursors, cookies, or authorization tokens.

---

## 🚀 Next Work Package Candidate

- **Candidate**: `REL-WP002 — Job Lease + Heartbeat`
- **Status**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
- **Note**: Awaits explicit authorization from Project Owner before commencement. Do NOT start automatically.
