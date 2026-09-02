# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02 (Post REL-WP001-R1 Fail-Closed Worker Lease & Navigation Hold Corrective)

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

## 🔒 Single Worker Multi-Tab Lock (REL-WP001-R1 STATUS: READY_FOR_CHATGPT_REVIEW)

- **Worker Version**: `28.4` (`run/LineSyncApp.js` v28.4).
- **Backend Required Version**: `28.4` (`src/runtime-version.ts`).
- **Fail-Closed Lease Persistence**: `writeAndVerifyLeaderRecord()` reads back raw `localStorage` record after every write and verifies exact equality of `ownerTabSessionId`, `leaseId`, `workerVersion`, and `expiresAt`. Fails closed if write/read/parse fails.
- **Complete Navigation Hold**: `navigateAsLeader()` extends navigation lease (`NAVIGATION_LEASE_MS = 45000`) and verifies read-back persistence before executing `window.location.href = targetUrl`.
- **Atomic Pre-Send Fencing**: `confirmWorkerLeadershipForSend()` executes under Web Locks election mutex (`WORKER_ELECTION_LOCK`) immediately before irreversible image send clicks or text send button / Enter fallback clicks.
- **Dashboard Operator Visibility**: Displays `Runtime Contract: v1 | Required Worker: v28.4` badge in dashboard header.

---

## ✅ What Currently Works (Confirmed Working & Tested)

### 1. Database & Entities (`PostgreSQL` / `TypeORM`)
- Schema synchronization & migrations for `Customer`, `CustomerGroup`, `CustomerGroupMember`, `Campaign`, and `CampaignJob`.
- Timezone-safe local timestamp handling using `TIMESTAMP WITHOUT TIME ZONE` and epoch millisecond comparison (`Date.now()`).

### 2. NestJS REST API (`src/app.controller.ts`)
- REST API endpoints for customer list, grouping, multi-type campaign creation, job dispatch queue with fail-closed version gate (`GET /api/campaign/next`), Telegram setting APIs (secure shape), runtime info (`GET /api/runtime/version`), and trusted loopback browser diagnostic event logger (`POST /api/diagnostics/browser-event`).

### 3. Web Dashboard (`index.html`)
- Interactive dashboard UI with toolbar search, status/name filters, quick selection shortcuts, schedule management, deep analytics, secure Telegram setting modal, and runtime version contract indicator (`v28.4`).

### 4. Client Automation Userscript (`run/LineSyncApp.js` v28.4)
- Multi-tab single worker leader lock with fail-closed lease persistence (`writeAndVerifyLeaderRecord`).
- Complete navigation hold (`navigateAsLeader`) and atomic pre-send fencing (`confirmWorkerLeadershipForSend`).
- Fail-closed runtime version handshake with retry loop (`checkRuntimeCompatibility()`, `resumeSavedActiveJob()`).
- Strict OA context validation (`isValidChatContextId` testing `/^U[0-9a-fA-F]{32}$/`).
- Fail-closed context navigation (`getOAContextUrl` returns `null` when context is missing/invalid).
- Active job preservation during missing context (`handleSafeRecovery` preserves session parameters without calling `finishJob` or incrementing `retryCount`).
- Quota limit auto-stop detection (`checkQuotaLimitExceeded`).
- Circuit Breaker safety: Emergency stop when encountering 10 consecutive non-blocked errors.
- Blocked user exclusion: `isBlocked = true` users do not increment the consecutive error counter.
- Exact Recipient Verification Guard (`verifyCurrentRecipient`).
- Confirmed-Write Diagnostic Spooling (`enqueueSpool`, `flushPendingDiagnostics`).

---

## 🚀 Active / Next Work Packages

- **Active Work Package**: `REL-WP001-R1 — Fail-Closed Lease Persistence + Complete Navigation Hold` (`READY_FOR_CHATGPT_REVIEW`)
- **Parent Work Package**: `REL-WP001 — Single Worker / Multi-Tab Lock` (`READY_FOR_CHATGPT_REVIEW`, NOT CLOSED)
- **Next Work Packages**:
  - `REL-WP002`: `NOT STARTED`
  - `REL-WP003`: `NOT STARTED`
