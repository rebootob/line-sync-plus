# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02 (Post UAT-1100 Safety Closure & BUG Work Package Completion)

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
- Recording `startedAt` execution timestamp when campaign starts processing.

### 2. NestJS REST API (`src/app.controller.ts`)
- REST API endpoints for customer list, grouping, multi-type campaign creation, job dispatch queue (`GET /api/campaign/next`), result status reporting, bot master switch, schedule management, Telegram notification integration, and trusted loopback browser diagnostic event logger (`POST /api/diagnostics/browser-event`).

### 3. Web Dashboard (`index.html`)
- Interactive dashboard UI with toolbar search, status/name filters, quick selection shortcuts (`✅ เลือกเฉพาะ Active ทั้งหมด`, `🎯 เลือก 100 คนแรก`, `🧹 ล้างการเลือก`), schedule management, deep analytics, and Telegram setting modal.

### 4. Client Automation Userscript (`run/LineSyncApp.js` v28.2)
- Strict OA context validation (`isValidChatContextId` testing `/^U[0-9a-fA-F]{32}$/`).
- Fail-closed context navigation (`getOAContextUrl` returns `null` when context is missing/invalid).
- Active job preservation during missing context (`handleSafeRecovery` preserves session parameters without calling `finishJob` or incrementing `retryCount`).
- Quota limit auto-stop detection (`checkQuotaLimitExceeded`).
- Circuit Breaker safety: Emergency stop when encountering 10 consecutive non-blocked errors.
- Blocked user exclusion: `isBlocked = true` users do not increment the consecutive error counter.
- **404 & LINE Error Page Guard (`checkIfErrorPage`)**: Aborts sending immediately upon encountering error URLs or DOM error banners.
- **Exact Recipient Verification Guard (`verifyCurrentRecipient`)**: Verifies recipient against URL pathname regex `/${botId}/chat/${expectedUserId}` and DOM data attributes prior to execution, image upload, image confirmation, text typing, and before clicking Send.
- **Confirmed-Write Diagnostic Spooling (`enqueueSpool`, `flushPendingDiagnostics`)**: Navigation-safe diagnostic event persistence to `uat-logs/browser-BUG-WP001-UAT.log`.

### 5. Telegram Notification Subsystem (`src/telegram.service.ts`)
- HTML summary completion reporting with Thai message type labels and icons.

---

## 🔒 Closed Work Packages & Safety Gate Status

- **Safety Gate**: **PASS**
- **BUG-WP001**: **CLOSED**
- **BUG-WP001-UATLOG**: **CLOSED**
- **BUG-WP002**: **CLOSED**

### UAT-1100 Campaign Evidence Summary:
- **Target Recipient Count**: 1,100
- **Processed Jobs**: 473 (Stopped by user after 473/1,100 jobs; NOT a completed 1,100-job endurance run)
- **Successful Sends**: 69
- **Blocked / Cannot Send**: 402
- **NAVIGATION_404 Terminal Failures**: 2 (Preserved same job, retried same recipient, exhausted retryCount=2, failed safely, zero misdeliveries)
- **User-Stopped Before Processing**: 627
- **Wrong Recipient Detected**: 0
- **Duplicate JOB_SUCCESS**: 0
- **Lost Claimed Job**: 0
- **RECIPIENT_VERIFY_FAIL During v28.2 Session**: 0

---

## 🚀 Next Approved Work Package

- **Next Gate**: `SEC-WP001 — Secret Hygiene`
- **Status**: `READY / NOT STARTED`

---

## ⚠️ Known Issues & Technical Constraints

1. **PostgreSQL Service Requirement**: Requires PostgreSQL server running on port 5433.
2. **Browser Session Dependency**: Requires active browser tab on `https://chat.line.biz/` for userscript execution.
