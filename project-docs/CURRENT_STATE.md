# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02 (Post BUG-WP001 Implementation)

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
- REST API endpoints for customer list, grouping, multi-type campaign creation, job dispatch queue (`GET /api/campaign/next`), result status reporting, bot master switch, schedule management, and Telegram notification integration.

### 3. Web Dashboard (`index.html`)
- Interactive dashboard UI with toolbar search, status/name filters, quick selection shortcuts (`✅ เลือกเฉพาะ Active ทั้งหมด`, `🎯 เลือก 100 คนแรก`, `🧹 ล้างการเลือก`), schedule management, deep analytics, and Telegram setting modal.

### 4. Client Automation Userscript (`run/LineSyncApp.js` v28.0)
- Execution inside LINE OA (`chat.line.biz` / `manager.line.biz`).
- Quota limit auto-stop detection (`checkQuotaLimitExceeded`).
- Circuit Breaker safety: Emergency stop when encountering 10 consecutive non-blocked errors.
- Blocked user exclusion: `isBlocked = true` users do not increment the consecutive error counter.
- **404 & LINE Error Page Guard (`checkIfErrorPage`)**: Aborts sending immediately upon encountering error URLs or DOM error banners.
- **Exact Recipient Verification Guard (`verifyCurrentRecipient`)**: Verifies recipient against URL pathname regex `/chat/${expectedUserId}` and DOM data attributes prior to execution, image upload, image confirmation, text typing, and before clicking Send.
- **Removed Unsafe Blind-Clicks**: Removed unsafe iteration clicking elements with `href.includes(userId)`.
- **Safe Recovery (`handleSafeRecovery`)**: Bounded retries (max 2 retries per job) with clean session recovery, returning to main chat view (`closeUserChatAndReturnToMain`), and explicit error reporting (`NAVIGATION_404`, `RECIPIENT_MISMATCH`, `RECIPIENT_UNVERIFIED`).

### 5. Telegram Notification Subsystem (`src/telegram.service.ts`)
- HTML summary completion reporting with Thai message type labels and icons.

---

## 🚧 Active / Unfinished Work

- None for BUG-WP001. Ready for ChatGPT Control Plane review.

---

## ⚠️ Known Issues & Technical Constraints

1. **PostgreSQL Service Requirement**: Requires PostgreSQL server running on port 5433.
2. **Browser Session Dependency**: Requires active browser tab on `https://chat.line.biz/` for userscript execution.
