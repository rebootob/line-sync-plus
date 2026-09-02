# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02 (Post REL-WP001 Single Worker Multi-Tab Lock Implementation)

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

## 🔒 Single Worker Multi-Tab Lock (REL-WP001 STATUS: READY_FOR_CHATGPT_REVIEW)

- **Worker Version**: `28.4` (`run/LineSyncApp.js` v28.4).
- **Backend Required Version**: `28.4` (`src/runtime-version.ts`).
- **Leader Election Mutex**: `navigator.locks.request('linesync_worker_election_v1', { mode: 'exclusive' }, ...)`.
- **Durable Leader Lease**: `localStorage.getItem('linesync_worker_leader_v1')` storing `{ ownerTabSessionId, leaseId, workerVersion, acquiredAt, expiresAt }`.
- **Lease Timings**: 20s initial lease (`WORKER_LEASE_MS`), 4s renewal interval (`WORKER_RENEW_INTERVAL_MS`), 45s navigation hold (`NAVIGATION_LEASE_MS`).
- **Pre-Send Fencing Integrity**: Leadership verified at 6 pre-send checkpoints before physical mutations. Leadership loss routes to `handleLeadershipLost()`.
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
- Multi-tab single worker leader lock (`ensureWorkerLeadership()`, `hasValidWorkerLeadership()`).
- Fail-closed runtime version handshake with retry loop (`checkRuntimeCompatibility()`, `resumeSavedActiveJob()`).
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

- **Active Work Package**: `REL-WP001 — Single Worker / Multi-Tab Lock` (`READY_FOR_CHATGPT_REVIEW`)
- **Next Work Packages**:
  - `REL-WP002`: `NOT STARTED`
  - `REL-WP003`: `NOT STARTED`
