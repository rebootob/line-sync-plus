# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02 (Post SYNC-WP001-R2 Dashboard Master Bot Sync Gate Corrective)

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

## 🔄 Customer Directory Synchronization (SYNC-WP001-R2 STATUS: READY_FOR_CHATGPT_REVIEW)

- **Worker Version**: `28.6` (`run/LineSyncApp.js` v28.6).
- **Backend Required Version**: `28.6` (`src/runtime-version.ts`).
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`).
- **Dashboard Sync Gate (`index.html`)**:
  - `startCustomerSync()` fetches `${API_BASE}/bot/status` directly from backend before opening contact sync tab.
  - Fail-closed error handling: rejects sync if `/bot/status` check fails.
  - Paused Master Bot enforcement: blocks sync if `enabled === true` and alerts `"กรุณา Pause Master Bot ก่อน Sync รายชื่อลูกค้า"`.
  - Fixed reference error by removing invalid `isBotEnabled` reference.

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
- Authoritative backend `/bot/status` query gate in `startCustomerSync()`.

### 4. Client Automation Userscript (`run/LineSyncApp.js` v28.6)
- Fail-closed sequential LINE contacts directory sync with Web Lock protection (`linesync_customer_sync_v1`).
- Granular 9-metric full-run reporting and Thai summary banner.

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
  - `SYNC-WP001-R2 — Dashboard Master Bot Sync Gate Corrective` (`READY_FOR_CHATGPT_REVIEW`)
  - `SYNC-WP001 — LINE OA Customer Directory Sync to DB` (`NOT CLOSED / LIVE UAT BLOCKED PENDING R2 REVIEW`)
- **Next Work Package Candidate**:
  - `REL-WP002 — Job Lease + Heartbeat` (`READY / NOT STARTED` — Project Owner authorization required)
