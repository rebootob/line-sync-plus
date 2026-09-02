# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02

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

## ✅ What Currently Works (Confirmed Working & Tested)

### 1. Database & Entities (`PostgreSQL` / `TypeORM`)
- Schema synchronization & migrations for `Customer`, `CustomerGroup`, `CustomerGroupMember`, `Campaign`, and `CampaignJob`.
- Timezone-safe local timestamp handling using `TIMESTAMP WITHOUT TIME ZONE` and epoch millisecond comparison (`Date.now()`).
- Recording `startedAt` execution timestamp when campaign starts processing to guarantee `startedAt <= updatedAt`.

### 2. NestJS REST API (`src/app.controller.ts`)
- `GET /api/customers`: Fetch contact list with cleaned display names and block status.
- `GET /api/groups` / `POST /api/groups` / `DELETE /api/groups/:id`: Group management APIs.
- `POST /api/campaign`: Multi-type campaign creation (`text`, `image_only`, `link_only`, `text_link`, `image_link`).
- `GET /api/campaign/next`: Next job dispatch with stale processing recovery and earliest schedule pickup.
- `POST /api/campaign/success` & `POST /api/campaign/fail`: Job result reporting, blocked user flag updates, and campaign completion triggers.
- `GET /api/bot/status` & `POST /api/bot/toggle`: Master Bot switch API with null-safe request body validation.
- `GET /api/campaigns/scheduled` & `POST /api/campaign/reschedule`: Scheduled queue query and date-time updating.
- `GET /api/telegram/settings`, `POST /api/telegram/settings`, `POST /api/telegram/test`: Telegram notification config & connectivity testing.

### 3. Web Dashboard (`index.html`)
- Header controls: Master Bot Switch toggle (`🟢 บอททำงานปกติ` / `🔴 พักการทำงานบอทอยู่`), Telegram Settings, Scheduled List Modal, Deep Analytics Modal, History Modal.
- Customer Table & Realtime Filters: Text search, Status dropdown (`Active` / `Blocked`), Name dropdown (`Named` / `Unnamed`), Filter summary count.
- Quick Selection Bar: `✅ เลือกเฉพาะ Active ทั้งหมด`, `🎯 เลือก 100 คนแรก`, `🧹 ล้างการเลือก`.
- Thai Language Localization: Friendly Thai labels with icons for campaign message types across modals, dropdowns, and tables.

### 4. Client Automation Userscript (`run/LineSyncApp.js` v27.0)
- Execution inside LINE OA (`chat.line.biz` / `manager.line.biz`).
- Quota limit auto-stop detection (`checkQuotaLimitExceeded`).
- Circuit Breaker safety: Emergency stop when encountering 10 consecutive non-blocked errors.
- Blocked user exclusion: `isBlocked = true` users do not increment the consecutive error counter.
- Auto-return to Main Chat List (`closeUserChatAndReturnToMain`): Automatically closes individual user chat windows and returns to main chat view (`/tag/...` or `/`) after job/queue completion.

### 5. Telegram Notification Subsystem (`src/telegram.service.ts`)
- Automatic sending of rich HTML completion reports when campaigns reach `completed`, `stopped_limit`, `stopped_error`, or `stopped_user` status.
- Thai message type mapping (`💬 ข้อความ + 🔗 ลิงก์`, `🖼️ รูปภาพอย่างเดียว`, etc.).
- Includes target count, success rate, elapsed duration, start/end timestamps, and top failure reasons breakdown.

---

## 🚧 Active / Unfinished Work

- Initial GitHub repository upload and Control Plane handoff setup.

---

## ⚠️ Known Issues & Technical Constraints

1. **PostgreSQL Service Requirement**: The NestJS application requires PostgreSQL server running (default port `5433`).
2. **Browser Session Dependency**: Tampermonkey userscript requires an open browser tab at `https://chat.line.biz/*` to process dispatch queues.
