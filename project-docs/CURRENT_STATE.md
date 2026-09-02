# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02 (Post OA-WP001 / OA-WP001-R1 Final Documentation Closure)

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

## 🔒 Multi-OA Identity Fencing & Context Isolation (OA-WP001 STATUS: CLOSED / PASS)

- **Worker Version**: `28.5` (`run/LineSyncApp.js` v28.5).
- **Backend Required Version**: `28.5` (`src/runtime-version.ts`).
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`).
- **Live UAT Evidence (Passed 2026-09-02)**:
  - **UAT-01 (Database Migration / OA Discovery)**: PASS (OA #1: 9,737 total / 9,176 active / 561 blocked; OA #2: 2,153 total / 2,151 active / 2 blocked).
  - **UAT-02 (Dashboard OA Isolation)**: PASS (OA #1 displayed only OA #1 customers, OA #2 displayed only OA #2 customers, no unselected list).
  - **UAT-03 (Controlled Dashboard OA Switch)**: PASS (Master Bot must be paused before switch, activeBotId persisted correctly).
  - **UAT-04 (Controlled Physical LINE OA Switch)**: PASS (Worker v28.5 aligned physical chat.line.biz OA with activeBotId before queue execution).
  - **UAT-05 (OA #2 Live Send Path)**: PASS (`JOB_RECEIVED` -> `NAVIGATE_TARGET` -> `PAGE_LOAD_ACTIVE_JOB` -> `RECIPIENT_VERIFY_OK` -> `TEXT_PRE_SEND_VERIFIED` -> `JOB_SUCCESS`; Wrong OA send = 0).
  - **UAT-06 (Cross-OA Queue Isolation)**: PASS (OA #2 worker does not claim OA #1 pending jobs; pending jobs remain owned by original OA until active again).
- **Active OA Identity Fencing**:
  - `POST /api/campaign/success` and `POST /api/campaign/fail` enforce composite identity fallback (`botId` + `lineUserId` + `status: 'processing'`) when `jobId` is absent. `userId`-only fallbacks without `botId` fail closed with `400 Bad Request`.
  - Customer block status updates require `job.botId` + `job.lineUserId`.
  - Pre-physical send guards in worker script require valid `expectedBotId` and fail closed (`OA_CONTEXT_MISMATCH`) if missing or unverified against current OA.
  - Page-load active job recovery requires `linesync_job_botid`. If missing/invalid, `clearLocalActiveJobState()` clears local session without triggering send or navigation.
  - `/campaign/next` enforces `selectedJob.botId === activeBotId` and `targetCampaign.botId === activeBotId` without fallbacks.
  - `GET /api/groups/:id` and `DELETE /api/groups/:id` require valid `botId` query parameter (`?botId=...`) and scope queries by `botId`.
  - Restored image upload endpoint contract (`POST /api/upload/image` and `GET /api/uploads/:filename`) to exact parent baseline (`process.cwd()/uploads`, returning `{ success: true, url, filename }`).

---

## 🔒 Single Worker Multi-Tab Lock (REL-WP001 STATUS: CLOSED / PASS)

- **Worker Version**: `28.5` (`run/LineSyncApp.js` v28.5).
- **Backend Required Version**: `28.5` (`src/runtime-version.ts`).
- **Live UAT Evidence (Passed)**:
  - **UAT-01 (Multi-Tab Election)**: PASS (1 Leader, 1 Standby).
  - **UAT-02 (Duplicate Tab Clone Defense)**: PASS (Detected copied session identity, assigned new `tabSessionId`, copied lease not reused).
  - **UAT-03 (Leader Failover)**: PASS (Leader closed -> automatic takeover, 1 Leader active).
  - **UAT-04 (Live Single Consumption)**: PASS (2 tabs open -> 1-recipient campaign sent by Leader alone, Target=1, Success=1, Fail=0, Duplicate Send=0).

---

## ✅ What Currently Works (Confirmed Working & Tested)

### 1. Database & Entities (`PostgreSQL` / `TypeORM`)
- Composite primary key `(botId, lineUserId)` on `Customer` entity.
- Nullable `botId` column on `CustomerGroup`, `CustomerGroupMember`, `Campaign`, and `CampaignJob`.
- `OaRuntimeState` singleton (`id = 'global'`) storing active LINE OA identity.
- Safe additive database migrations in `DatabaseInitService`.

### 2. NestJS REST API (`src/app.controller.ts`)
- Active OA context management (`GET /api/oa/contexts`, `GET/POST /api/oa/active`).
- Hard OA fencing in queue processor (`GET /api/campaign/next`).
- Composite customer query (`GET /api/customers?botId=...`).
- Scoped group management (`GET /api/groups/:id?botId=...`, `DELETE /api/groups/:id?botId=...`).
- Image upload API (`POST /api/upload/image` and `GET /api/uploads/:filename`) serving files from `process.cwd()/uploads`.

### 3. Web Dashboard (`index.html`)
- Active OA selector dropdown with status indicators and switching guards.
- Scoped group detail and delete requests forwarding `?botId=...`.

### 4. Client Automation Userscript (`run/LineSyncApp.js` v28.5)
- Active OA context header `X-LineSync-OA-Context`.
- Controlled OA switch detection and main URL redirect (`checkAndExecuteControlledOaSwitch()`).
- Strict pre-physical send OA fence (`OA_CONTEXT_MISMATCH`).
- Centralized active job state cleanup helper (`clearLocalActiveJobState()`).

---

## 🚀 Work Packages Overview

- **Closed Work Packages**:
  - `BUG-WP001`, `BUG-WP001-R1`, `BUG-WP001-UATLOG`, `BUG-WP001-UATLOG-R1`, `R2`, `R3`, `R4`, `R5` (`CLOSED / PASS`)
  - `BUG-WP002`, `BUG-WP002-R1` (`CLOSED / PASS`)
  - `SEC-WP001` (`CLOSED / PASS`)
  - `OPS-WP001`, `OPS-WP001-R1` (`CLOSED / PASS`)
  - `REL-WP001`, `REL-WP001-R1`, `REL-WP001-R2` (`CLOSED / PASS`)
  - `OA-WP001`, `OA-WP001-R1` (`CLOSED / PASS`)
- **Next Work Package Candidate**:
  - `REL-WP002 — Job Lease + Heartbeat` (`READY / NOT STARTED` — Project Owner authorization required)
