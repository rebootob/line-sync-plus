# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-03 (Post SAFE-WP001-R3 Implementation)

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

## 🛡️ Account Protection & Send Compliance Guard (SAFE-WP001 STATUS: NOT CLOSED / R3 READY_FOR_CHATGPT_REVIEW)

- **Worker Version**: `28.12` (`run/LineSyncApp.js` v28.12).
- **Backend Required Version**: `28.12` (`src/runtime-version.ts`).
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`).
- **Baseline**: `07ac293a08d2c412890d3d20dde486e65e4177b7`.
- **Active Worker Telemetry Heartbeat (SAFE-WP001-R3)**:
  - `processQueue()` polling loop publishes telemetry heartbeat (`publishAccountProtectionTelemetry(validBotId, 0)`) on ~4s cadence after verifying leadership, runtime compatibility, and OA alignment.
  - Heartbeat is strictly observational (no reservation creation, timestamp mutations, or job claims).
  - Standby / non-leader workers do not publish heartbeats.
- **Strict Protection State Schema**:
  - `loadProtectionTimestamps` throws `ACCOUNT_PROTECTION_STATE_UNAVAILABLE` on reading malformed storage or non-finite timestamp array members.
- **Exact Read-Back Timestamp Reservation**:
  - `recordProtectionSendAction` enforces exact array length, order, and value read-back verification before returning reservation object `{ botId, reservedAt }`.
- **Final Reservation Revalidation**:
  - `verifyProtectionReservation` verifies that `reservation.reservedAt` matches the newest reservation in storage immediately before pointer/click/keydown events on image send, text button, and Enter key fallback.
- **Truthful Telemetry & Loopback Write Trust**:
  - `POST /api/account-protection/telemetry` enforces loopback IP, matching `X-LineSync-Worker-Version`, matching `X-LineSync-OA-Context`, header/body `botId` alignment, and strict numeric schema.
- **Internal Protection Defaults**:
  - `MIN_SEND_GAP_MS = 10000` (10s gap)
  - `MAX_SEND_ACTIONS_10_MIN = 60` (rolling 10m limit)
  - `MAX_SEND_ACTIONS_1_HOUR = 300` (rolling 1h limit)
- **Adaptive System-Error Backoff**:
  - Error #1 = 30s, Error #2 = 60s, Error #3 = 120s, Error #4+ = max 300s.

---

## 🔄 Customer Directory Synchronization (SYNC-WP001 STATUS: CLOSED / PASS)

- Accepted on Worker v28.8 across 9,741 records (488 pages). Non-destructive DB policy preserves 6 DB-only records.

---

## 🔒 Multi-OA Identity Fencing & Context Isolation (OA-WP001 STATUS: CLOSED / PASS)

- Accepted on Worker v28.5 (UAT-01..06 verified).

---

## 🔒 Single Worker Multi-Tab Lock (REL-WP001 STATUS: CLOSED / PASS)

- UAT-01..04 verified.

---

## ✅ What Currently Works (Confirmed Working & Tested)

1. **Database & Entities (`PostgreSQL` / `TypeORM`)**: Composite primary key `(botId, lineUserId)` on `Customer`. Nullable `botId` on `CampaignJob`, `Campaign`, `CustomerGroup`.
2. **NestJS REST API (`src/app.controller.ts`)**: Telemetry REST endpoints with strict loopback/version/OA/schema validation, target hygiene on `POST /api/campaign/add`, batch sync `POST /api/customers/sync-batch`.
3. **Web Dashboard (`index.html`)**: Truthful Account Protection telemetry indicator (`accountProtectionBadge`), Master Bot switch gate.
4. **Client Automation Userscript (`run/LineSyncApp.js` v28.12)**: Centralized fail-closed protection gate (`enforceAccountProtectionGate`), active worker telemetry heartbeat in `processQueue()`, exact read-back timestamp reservation, adaptive system-error backoff.

---

## 🚀 Work Packages Overview

- **Closed Work Packages**: `BUG-WP001`, `BUG-WP002`, `SEC-WP001`, `OPS-WP001`, `REL-WP001`, `OA-WP001`, `SYNC-WP001` (`CLOSED / PASS`).
- **Active Work Package**: `SAFE-WP001-R3` (`READY_FOR_CHATGPT_REVIEW`).
- **Next Candidate**: `REL-WP002 — Job Lease + Heartbeat` (`READY / NOT STARTED / AUTHORIZATION REQUIRED`).
