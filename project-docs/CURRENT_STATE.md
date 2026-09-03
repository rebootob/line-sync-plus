# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-03 (Post REL-WP002 Implementation)

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

## 🔒 Durable Job Lease + Heartbeat + Stale Worker Fencing (REL-WP002 STATUS: NOT CLOSED; REL-WP002-R2 STATUS: READY_FOR_CHATGPT_REVIEW)

- **Worker Version**: `28.14` (`run/LineSyncApp.js` v28.14).
- **Backend Required Version**: `28.14` (`src/runtime-version.ts`).
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`).
- **Implementation Overview**:
  - Nullable job lease columns on `CampaignJob`: `leaseToken` (varchar 64), `leaseOwner` (varchar 128), `leaseExpiresAt` (timestamp), `leaseHeartbeatAt` (timestamp). Added index `idx_campaign_jobs_bot_status_lease` on `(botId, status, leaseExpiresAt)`.
  - Atomic claim on `GET /api/campaign/next`: requires `X-LineSync-Worker-Instance` header (`^ts_[0-9]{10,17}_[a-z0-9]{4,32}$`), generates UUID `leaseToken`, sets 60s lease expiry (`NOW() + 60s`).
  - Active heartbeat loop: `POST /api/campaign/heartbeat` extends active leases by 60s every 10s. Distinguishes renewed, explicit `lease_lost`, and transient error.
  - Final pre-send lease renewal fencing: `renewJobLeaseOrThrow` invoked before image confirm (`confirmAndCloseImageModal(expectedUserId, expectedBotId)`), text send click, and Enter keydown.
  - Transactional finalization: `/campaign/success`, `/campaign/fail`, and `/campaign/stop` execute TypeORM transactions validating active worker lease token and instance header before executing atomic status transitions and clearing lease fields.
  - Same-Job Finalization Retry: After physical send, transient network failure retries finalization with same credentials while lease is valid; explicit lease loss relinquishes execution without marking fail.
  - Serialized Circuit Breaker Stop: When consecutive errors reach 10, `/campaign/stop` is serialized properly with job finalization to ensure campaign stop is authorized and remaining jobs are safely fenced without conflict.

---

## 🛡️ Account Protection & Send Compliance Guard (SAFE-WP001 STATUS: CLOSED / PASS)

- Worker v28.13 maintains all SAFE-WP001 protection rules, fail-closed storage, rate limits (10s gap, 60/10m, 300/1h), exact timestamp reservation, and telemetry heartbeat.

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

1. **Database & Entities (`PostgreSQL` / `TypeORM`)**: Composite primary key `(botId, lineUserId)` on `Customer`. Job lease schema on `CampaignJob`.
2. **NestJS REST API (`src/app.controller.ts`)**: Atomic job claim, active job lease heartbeat, fenced finalization (`/campaign/success`, `/campaign/fail`, `/campaign/stop`).
3. **Web Dashboard (`index.html`)**: Contract v2 badge, Required Worker v28.14.
4. **Client Automation Userscript (`run/LineSyncApp.js` v28.14)**: Worker instance header `X-LineSync-Worker-Instance`, active job heartbeat timer, pre-send lease renewal fencing.

---

## 🚀 Work Packages Overview

- **Closed Work Packages**: `BUG-WP001`, `BUG-WP002`, `SEC-WP001`, `OPS-WP001`, `REL-WP001`, `OA-WP001`, `SYNC-WP001`, `SAFE-WP001` (`CLOSED / PASS`).
- **Active Work Package**: `NONE`.
- **Work Package Status**:
  - `REL-WP002`: `NOT CLOSED` (Lease infrastructure implemented; R1 & R2 correctives implemented; awaiting independent review).
  - `REL-WP002-R1`: `CLOSED / PASS`.
  - `REL-WP002-R2`: `READY_FOR_CHATGPT_REVIEW`.
- **Next Candidate**: `REL-WP003` (`NOT STARTED`).
