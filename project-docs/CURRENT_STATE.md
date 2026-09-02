# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02 (Post SYNC-WP001 Documentation Closure)

---

## 🏛️ System Architecture Overview

```
                      +-----------------------------+
                      |   Single Page Dashboard     |
                      |        (index.html)         |
                      +--------------+--------------+
                                     |
                                REST API
                                     v
+------------------+  HTTP   +------------------+ TypeORM  +--------------------+
| Tampermonkey     |<------->| NestJS Backend   |<-------->| PostgreSQL DB      |
| (LineSyncApp.js) |         | (AppController)  |          | (line_sync_db)     |
+------------------+         +--------+---------+          +--------------------+
  Runs inside                         |
  chat.line.biz                       | Telegram API
                                      v
                             +------------------+
                             | Telegram Bot API |
                             +------------------+
```

---

## 🔄 Customer Directory Synchronization (SYNC-WP001 STATUS: CLOSED / PASS)

- **Worker Version**: `28.8` (`run/LineSyncApp.js` v28.8).
- **Backend Required Version**: `28.8` (`src/runtime-version.ts`).
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`).
- **Accepted Implementation Baseline**: `b1d6ba8a669eaa98b167a7ad2d34712c85c02953`.
- **Full Directory Endpoint**: `GET /api/v2/bots/{botId}/chats?folderType=ALL&limit=20&prioritizePinnedChat=true`.
- **Accepted Live UAT Metrics (OA #1 `U09d6b286c73c14c12cb6b8479d105941`)**:
  - **Fetched**: `9,741`
  - **Inserted**: `0`
  - **Updated Display Name**: `4,629`
  - **Existing Unchanged**: `5,112`
  - **Duplicates In Sync**: `0`
  - **Invalid/Skipped**: `0`
  - **Pages**: `488`
  - **DB Total After Sync**: `9,747`
  - **Elapsed Time**: `341.4 seconds`
  - **Reconciliation**: `4,629 + 5,112 = 9,741`
  - **Non-Destructive Policy**: `6` DB-only records preserved untouched (NOT deleted, NOT blocked, NOT marked inactive).

---

## 🔍 Read-Only Source Discovery Evidence

- **/contacts Endpoint**: `5,112` unique records (strict subset of `/chats`).
- **/chats Endpoint**: `9,742` unique initial, `9,741` unique later.
- **/contacts-only**: `0`.
- **Latest DB vs /chats**:
  - DB Unique: `9,747`
  - Chats Unique: `9,741`
  - Overlap: `9,741`
  - Chats-only: `0`
  - DB-only: `6` (DB-only blocked: `0`, DB-only active: `6`)
- **Source Nature**: `/contacts` is only a partial subset. `/chats` is the accepted Full Customer Directory source. LINE `/chats` count is live and dynamic and MUST NOT be documented as a permanently fixed expected count. Cause of DB-only records is UNKNOWN and must not be guessed.

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

## 🔒 Multi-OA Identity Fencing & Context Isolation (OA-WP001 STATUS: CLOSED / PASS)

- **Historical Live UAT Evidence (Accepted on Worker v28.5)**:
  - **UAT-01 (Database Migration / OA Discovery)**: PASS (OA #1: 9,737 total; OA #2: 2,153 total).
  - **UAT-02 (Dashboard OA Isolation)**: PASS (OA #1 displayed only OA #1 customers; OA #2 displayed only OA #2 customers).
  - **UAT-03 (Controlled Dashboard OA Switch)**: PASS (Master Bot must be paused before switch).
  - **UAT-04 (Controlled Physical LINE OA Switch)**: PASS (Worker v28.5 aligned physical OA with activeBotId).
  - **UAT-05 (OA #2 Live Send Path)**: PASS (Full send path under OA #2 verified; wrong OA send = 0).
  - **UAT-06 (Cross-OA Queue Isolation)**: PASS (OA #2 worker does not claim OA #1 pending jobs).

---

## 🔒 Single Worker Multi-Tab Lock (REL-WP001 STATUS: CLOSED / PASS)

- **Live UAT Evidence (Passed)**:
  - **UAT-01 (Multi-Tab Election)**: PASS (1 Leader, 1 Standby).
  - **UAT-02 (Duplicate Tab Clone Defense)**: PASS (Assigned new `tabSessionId`).
  - **UAT-03 (Leader Failover)**: PASS (Leader closed -> automatic takeover).
  - **UAT-04 (Live Single Consumption)**: PASS (Single leader consumption).

---

## ✅ What Currently Works (Confirmed Working & Tested)

### 1. Database & Entities (`PostgreSQL` / `TypeORM`)
- Composite primary key `(botId, lineUserId)` on `Customer` entity.
- Nullable `botId` column on `CustomerGroup`, `CustomerGroupMember`, `Campaign`, and `CampaignJob`.
- `OaRuntimeState` singleton (`id = 'global'`) storing active LINE OA identity.

### 2. NestJS REST API (`src/app.controller.ts`)
- Customer directory sync batch endpoint (`POST /api/customers/sync-batch`).
- Strict User ID regex validation (`^U[0-9a-fA-F]{32}$`).
- Active OA context management (`GET /api/oa/contexts`, `GET/POST /api/oa/active`).
- Hard OA fencing in queue processor (`GET /api/campaign/next`).

### 3. Web Dashboard (`index.html`)
- Customer sync trigger button `🔄 Sync รายชื่อลูกค้า` (`btnSyncCustomers`).
- Authoritative backend `/bot/status` query gate with strict `typeof statusData.enabled === 'boolean'` validation in `startCustomerSync()`.

### 4. Client Automation Userscript (`run/LineSyncApp.js` v28.8)
- Fail-closed sequential LINE chat directory sync with Web Lock protection (`linesync_customer_sync_v1`).
- Aligned `resp.list` schema parser against `/chats?folderType=ALL&limit=20&prioritizePinnedChat=true`, `profile.nickname` display name mapping, 429/403 rate-limit retries, and neutral reporting wording.

---

## 🚀 Work Packages Overview

- **Closed Work Packages**:
  - `BUG-WP001`, `BUG-WP001-R1`, `BUG-WP001-UATLOG`, `R1`..`R5` (`CLOSED / PASS`)
  - `BUG-WP002`, `BUG-WP002-R1` (`CLOSED / PASS`)
  - `SEC-WP001` (`CLOSED / PASS`)
  - `OPS-WP001`, `OPS-WP001-R1` (`CLOSED / PASS`)
  - `REL-WP001`, `REL-WP001-R1`, `REL-WP001-R2` (`CLOSED / PASS`)
  - `OA-WP001`, `OA-WP001-R1` (`CLOSED / PASS`)
  - `SYNC-WP001`, `R1`..`R5` (`CLOSED / PASS`)
- **Active Work Package**: `NONE`
- **Next Work Package Candidate**:
  - `REL-WP002 — Job Lease + Heartbeat` (`READY / NOT STARTED / AUTHORIZATION REQUIRED`)
