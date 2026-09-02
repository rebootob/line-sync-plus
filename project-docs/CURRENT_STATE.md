# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02 (Post OPS-WP001 Runtime Version Gate Implementation)

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

## 🛑 Runtime Version Gate (OPS-WP001 STATUS: READY_FOR_CHATGPT_REVIEW)

- **Backend Runtime Contract**: Declared in `src/runtime-version.ts` (`RUNTIME_CONTRACT_VERSION = 1`, `REQUIRED_WORKER_VERSION = '28.3'`).
- **Endpoint**: `GET /api/runtime/version` returns safe version contract info.
- **Fail-Closed Queue Gate**: `GET /api/campaign/next` checks `X-LineSync-Worker-Version` header before any DB query or job claim. Returns HTTP 409 Conflict if header is missing or incompatible.
- **Client Automation Worker v28.3**: `run/LineSyncApp.js` v28.3 sends `X-LineSync-Worker-Version: 28.3` header on all API calls and performs `checkRuntimeCompatibility()` before processing queue or resuming active jobs on page load.
- **Dashboard Operator Visibility**: Displays `Runtime Contract: v1 | Required Worker: v28.3` badge in dashboard header.

---

## ✅ What Currently Works (Confirmed Working & Tested)

### 1. Database & Entities (`PostgreSQL` / `TypeORM`)
- Schema synchronization & migrations for `Customer`, `CustomerGroup`, `CustomerGroupMember`, `Campaign`, and `CampaignJob`.
- Timezone-safe local timestamp handling using `TIMESTAMP WITHOUT TIME ZONE` and epoch millisecond comparison (`Date.now()`).

### 2. NestJS REST API (`src/app.controller.ts`)
- REST API endpoints for customer list, grouping, multi-type campaign creation, job dispatch queue with fail-closed version gate (`GET /api/campaign/next`), Telegram setting APIs (secure shape), runtime info (`GET /api/runtime/version`), and trusted loopback browser diagnostic event logger (`POST /api/diagnostics/browser-event`).

### 3. Web Dashboard (`index.html`)
- Interactive dashboard UI with toolbar search, status/name filters, quick selection shortcuts, schedule management, deep analytics, secure Telegram setting modal, and runtime version contract indicator.

### 4. Client Automation Userscript (`run/LineSyncApp.js` v28.3)
- Fail-closed runtime version handshake (`checkRuntimeCompatibility()`).
- Strict OA context validation (`isValidChatContextId` testing `/^U[0-9a-fA-F]{32}$/`).
- Fail-closed context navigation (`getOAContextUrl` returns `null` when context is missing/invalid).
- Active job preservation during missing context (`handleSafeRecovery` preserves session parameters without calling `finishJob` or incrementing `retryCount`).
- Quota limit auto-stop detection (`checkQuotaLimitExceeded`).
- Circuit Breaker safety: Emergency stop when encountering 10 consecutive non-blocked errors.
- Blocked user exclusion: `isBlocked = true` users do not increment the consecutive error counter.
- **Exact Recipient Verification Guard (`verifyCurrentRecipient`)**: Verifies recipient prior to execution and send click.
- **Confirmed-Write Diagnostic Spooling (`enqueueSpool`, `flushPendingDiagnostics`)**: Navigation-safe diagnostic event persistence.

---

## 🚀 Active / Next Work Packages

- **Active Work Package**: `OPS-WP001 — Runtime Version Gate` (`READY_FOR_CHATGPT_REVIEW`)
- **Next Work Packages**:
  - `REL-WP001`: `NOT STARTED`
  - `REL-WP002`: `NOT STARTED`
  - `REL-WP003`: `NOT STARTED`
