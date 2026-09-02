# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02 (Post SYNC-WP001 LINE OA Customer Directory Sync)

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

## 🔄 Customer Directory Synchronization (SYNC-WP001 STATUS: READY_FOR_CHATGPT_REVIEW)

- **Worker Version**: `28.6` (`run/LineSyncApp.js` v28.6).
- **Backend Required Version**: `28.6` (`src/runtime-version.ts`).
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`).
- **Directory Sync Architecture**:
  - `POST /api/customers/sync-batch` accepts batch array up to 250 customer records.
  - Enforces loopback IP origin (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`), valid `botId` format (`^U[0-9a-fA-F]{32}$`), `botId === activeBotId`, and Master Bot PAUSED status.
  - Deduplicates records within batch, inserts new customers, updates changed `displayName`s, preserves unchanged records, and preserves existing block/safety status.
  - Client Userscript fetches contacts from `chat.line.biz/api/v2/bots/{botId}/contacts` using `credentials: 'include'` and cursor pagination (`response.next`).
  - Web Lock `linesync_customer_sync_v1` guarantees single-tab execution.
  - Opaque pagination cursors are never persisted or logged.

---

## 🔒 Multi-OA Identity Fencing & Context Isolation (OA-WP001 STATUS: CLOSED / PASS)

- **Live UAT Evidence (Passed 2026-09-02)**:
  - **UAT-01 (Database Migration / OA Discovery)**: PASS (OA #1: 9,737 total; OA #2: 2,153 total).
  - **UAT-02 (Dashboard OA Isolation)**: PASS (OA #1 displayed only OA #1 customers; OA #2 displayed only OA #2 customers).
  - **UAT-03 (Controlled Dashboard OA Switch)**: PASS (Master Bot must be paused before switch).
  - **UAT-04 (Controlled Physical LINE OA Switch)**: PASS (Worker v28.5/v28.6 aligned physical OA with activeBotId).
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
- Active OA context management (`GET /api/oa/contexts`, `GET/POST /api/oa/active`).
- Hard OA fencing in queue processor (`GET /api/campaign/next`).
- Composite customer query (`GET /api/customers?botId=...`).
- Scoped group management (`GET /api/groups/:id?botId=...`, `DELETE /api/groups/:id?botId=...`).

### 3. Web Dashboard (`index.html`)
- Customer sync trigger button `🔄 Sync รายชื่อลูกค้า` (`btnSyncCustomers`).
- Active OA selector dropdown with status indicators and switching guards.

### 4. Client Automation Userscript (`run/LineSyncApp.js` v28.6)
- Sequential LINE contacts directory sync with Web Lock protection (`linesync_customer_sync_v1`).
- Controlled OA switch detection and main URL redirect (`checkAndExecuteControlledOaSwitch()`).

---

## 🚀 Work Packages Overview

- **Closed Work Packages**:
  - `BUG-WP001`, `BUG-WP001-R1`, `BUG-WP001-UATLOG`, `R1`..`R5` (`CLOSED / PASS`)
  - `BUG-WP002`, `BUG-WP002-R1` (`CLOSED / PASS`)
  - `SEC-WP001` (`CLOSED / PASS`)
  - `OPS-WP001`, `OPS-WP001-R1` (`CLOSED / PASS`)
  - `REL-WP001`, `REL-WP001-R1`, `REL-WP001-R2` (`CLOSED / PASS`)
  - `OA-WP001`, `OA-WP001-R1` (`CLOSED / PASS`)
- **Active Work Package**:
  - `SYNC-WP001 — LINE OA Customer Directory Sync to DB` (`READY_FOR_CHATGPT_REVIEW`)
- **Next Work Package Candidate**:
  - `REL-WP002 — Job Lease + Heartbeat` (`READY / NOT STARTED` — Project Owner authorization required)
