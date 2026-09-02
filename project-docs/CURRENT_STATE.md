# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-03 (Post SAFE-WP001 Closure)

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

## 🛡️ Account Protection & Send Compliance Guard (SAFE-WP001 STATUS: CLOSED / PASS)

- **Worker Version**: `28.12` (`run/LineSyncApp.js` v28.12).
- **Backend Required Version**: `28.12` (`src/runtime-version.ts`).
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`).
- **Baseline**: `fed96f1ce97c552066b7de1b7e2d6dd1c83d6591`.
- **Accepted Live UAT Evidence**:
  - **v28.11 Campaign Send**: 2-recipient test campaign processed to completion; physical sends verified; zero recipient/OA mismatch; zero storage errors.
  - **v28.12 Heartbeat & Telemetry**: Dashboard telemetry displayed `Protection: ON`, `10m: 0 / 60`, `1h: 2 / 300`, `Next Send: now`, `Cooling: none`. The 2 send reservations aged out of 10m window while remaining in 1h window. Heartbeat keeps telemetry fresh while idle without creating fake timestamps.
- **Safety Contract Summary**:
  - Per-OA rate limits: Minimum gap = 10s; Rolling 10m cap = 60 sends; Rolling 1h cap = 300 sends.
  - Fail-closed storage reading: Throws `ACCOUNT_PROTECTION_STATE_UNAVAILABLE` on malformed storage or invalid timestamps.
  - Exact read-back verification: Validates array length, order, and values before returning `{ botId, reservedAt }`. Revalidated immediately before physical sends.
  - Target hygiene: Deduplicates target IDs and excludes blocked users (`isBlocked === true`) before campaign creation.
  - Adaptive error backoff: 30s / 60s / 120s / max 300s. 10 consecutive errors triggers circuit breaker stop.
  - Active worker telemetry heartbeat: `processQueue()` polling loop (~4s cadence) updates telemetry observatorially. Stale (> 30s) telemetry displays `unknown` (never fake zero).
  > ⚠️ **Notice**: SAFE-WP001 reduces operational risk. It does NOT guarantee LINE will never restrict or suspend an OA. Thresholds are safety defaults, not official LINE limits. No detection-evasion functionality is included.

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

- **Closed Work Packages**: `BUG-WP001`, `BUG-WP002`, `SEC-WP001`, `OPS-WP001`, `REL-WP001`, `OA-WP001`, `SYNC-WP001`, `SAFE-WP001` (`CLOSED / PASS`).
- **Active Work Package**: `NONE`.
- **Next Candidate**: `REL-WP002 — Job Lease + Heartbeat` (`READY / NOT STARTED / AUTHORIZATION REQUIRED`).
