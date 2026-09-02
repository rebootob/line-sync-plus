# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02 (Post SAFE-WP001 Implementation)

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

## 🛡️ Account Protection & Send Compliance Guard (SAFE-WP001 STATUS: READY_FOR_CHATGPT_REVIEW)

- **Worker Version**: `28.9` (`run/LineSyncApp.js` v28.9).
- **Backend Required Version**: `28.9` (`src/runtime-version.ts`).
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`).
- **Baseline**: `6588270c1d9bd3cc818d6b3784584fb25888c309`.
- **Per-OA Storage Key**: `linesync_account_protection_v1_<botId>` in `localStorage`.
- **Internal Protection Defaults**:
  - `MIN_SEND_GAP_MS = 10000` (10 seconds minimum gap between physical sends)
  - `MAX_SEND_ACTIONS_10_MIN = 60` (rolling 10-minute send cap)
  - `MAX_SEND_ACTIONS_1_HOUR = 300` (rolling 1-hour send cap)
- **Adaptive System-Error Backoff**:
  - Error #1 = 30s, Error #2 = 60s, Error #3 = 120s, Error #4+ = max 300s.
  - Blocked users do not increment system error counter.
  - Successful job resets consecutive error count and clears cooldown.
  - 10 consecutive system errors triggers hard stop (Circuit Breaker).
- **Campaign Target Hygiene**:
  - `POST /api/campaign/add` deduplicates target IDs.
  - Excludes blocked customers (`isBlocked === true`).
  - `Campaign.totalTargets` equals actual queued jobs.
  - Returns `requestedCount`, `queuedCount`, `excludedDuplicateCount`, `excludedBlockedCount`. Rejects empty target sets with HTTP 400.

> ⚠️ **Notice**: SAFE-WP001 is an operational risk-reduction control. It does NOT guarantee that LINE will never restrict/suspend an OA. Internal rate thresholds are safety defaults, not official LINE API limits. Zero detection evasion techniques are included.

---

## 🔄 Customer Directory Synchronization (SYNC-WP001 STATUS: CLOSED / PASS)

- **Worker Version**: `28.8` / `28.9`.
- **Full Directory Endpoint**: `GET /api/v2/bots/{botId}/chats?folderType=ALL&limit=20&prioritizePinnedChat=true`.
- **Accepted Live UAT Metrics (OA #1 `U09d6b286c73c14c12cb6b8479d105941`)**:
  - Fetched: `9,741`
  - Inserted: `0`
  - Display Name Updated: `4,629`
  - Existing Unchanged: `5,112`
  - DB Total After Sync: `9,747` (6 DB-only records preserved).

---

## 🔒 Multi-OA Identity Fencing & Context Isolation (OA-WP001 STATUS: CLOSED / PASS)

- **Accepted on Worker v28.5**: UAT-01 through UAT-06 verified cleanly.

---

## 🔒 Single Worker Multi-Tab Lock (REL-WP001 STATUS: CLOSED / PASS)

- UAT-01 through UAT-04 verified cleanly.

---

## ✅ What Currently Works (Confirmed Working & Tested)

1. **Database & Entities (`PostgreSQL` / `TypeORM`)**: Composite primary key `(botId, lineUserId)` on `Customer`. Nullable `botId` on `CampaignJob`, `Campaign`, `CustomerGroup`.
2. **NestJS REST API (`src/app.controller.ts`)**: Target hygiene on `POST /api/campaign/add`, batch sync `POST /api/customers/sync-batch`, active OA management.
3. **Web Dashboard (`index.html`)**: Compact Account Protection status badge (`accountProtectionBadge`), Master Bot switch gate.
4. **Client Automation Userscript (`run/LineSyncApp.js` v28.9)**: Centralized per-OA protection gate (`enforceAccountProtectionGate`), adaptive system-error backoff (`getSystemErrorCooldownMs`), fail-closed directory sync, zero-tolerance recipient verification.

---

## 🚀 Work Packages Overview

- **Closed Work Packages**: `BUG-WP001`, `BUG-WP002`, `SEC-WP001`, `OPS-WP001`, `REL-WP001`, `OA-WP001`, `SYNC-WP001` (`CLOSED / PASS`).
- **Active Work Package**: `SAFE-WP001` (`READY_FOR_CHATGPT_REVIEW`).
- **Next Candidate**: `REL-WP002 — Job Lease + Heartbeat` (`READY / NOT STARTED / AUTHORIZATION REQUIRED`).
