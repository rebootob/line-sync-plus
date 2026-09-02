# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02 (Post REL-WP001 / R1 / R2 Final Closure)

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

## 🔒 Single Worker Multi-Tab Lock (REL-WP001 STATUS: CLOSED / PASS)

- **Worker Version**: `28.4` (`run/LineSyncApp.js` v28.4).
- **Backend Required Version**: `28.4` (`src/runtime-version.ts`).
- **Live UAT Evidence (Passed)**:
  - **UAT-01 (Multi-Tab Election)**: PASS (1 Leader, 1 Standby).
  - **UAT-02 (Duplicate Tab Clone Defense)**: PASS (Detected copied session identity, assigned new `tabSessionId`, copied lease not reused).
  - **UAT-03 (Leader Failover)**: PASS (Leader closed -> automatic takeover, 1 Leader active).
  - **UAT-04 (Live Single Consumption)**: PASS (2 tabs open -> 1-recipient campaign sent by Leader alone, Target=1, Success=1, Fail=0, Duplicate Send=0).
- **Document-Lifetime Tab Identity Lock**: `ensureTabIdentity()` claims `linesync_tab_identity_v1_<tabSessionId>` via non-blocking Web Locks (`ifAvailable: true`).
- **Duplicate Tab Clone Defense**: Detects copied `sessionStorage` in duplicated/cloned tabs (`lock === null`), assigns a new `tabSessionId`, clears copied lease and active-job fields, logs `[REL] DUPLICATE TAB IDENTITY DETECTED` and `[REL] NEW TAB IDENTITY ASSIGNED`, and sets cloned tab to STANDBY.
- **Fail-Closed Lease Persistence**: `writeAndVerifyLeaderRecord()` reads back raw `localStorage` record after every write and verifies exact equality of `ownerTabSessionId`, `leaseId`, `workerVersion`, and `expiresAt`.
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
- Document-lifetime tab identity lock & clone defense (`ensureTabIdentity`).
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

## 🚀 Work Packages Overview

- **Closed Work Packages**:
  - `BUG-WP001`, `BUG-WP001-R1`, `BUG-WP001-UATLOG`, `BUG-WP001-UATLOG-R1`, `R2`, `R3`, `R4`, `R5` (`CLOSED / PASS`)
  - `BUG-WP002`, `BUG-WP002-R1` (`CLOSED / PASS`)
  - `SEC-WP001` (`CLOSED / PASS`)
  - `OPS-WP001`, `OPS-WP001-R1` (`CLOSED / PASS`)
  - `REL-WP001`, `REL-WP001-R1`, `REL-WP001-R2` (`CLOSED / PASS`)
- **Next Work Package Candidate**:
  - `OA-WP001 — OA Context Isolation & Controlled LINE OA Switch` (`READY / NOT STARTED`)
