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

## 🔒 Durable Job Lease + Heartbeat + Stale Worker Fencing (REL-WP002 STATUS: CLOSED / PASS; REL-WP002-R3 STATUS: CLOSED / PASS)

- **Worker Version**: `28.15` (`run/LineSyncApp.js` v28.15).
- **Backend Required Version**: `28.15` (`src/runtime-version.ts`).
- **Runtime Contract Version**: `2` (`src/runtime-version.ts`).
- **Accepted Live UAT (Worker v28.15)**:
  - 2-recipient text campaign (`"แคมเปญ 3/9/2026 8:6"`, test text `"1111"`) created while Master Bot was PAUSED.
  - Exactly 2 jobs queued and processed to completion after bot was enabled.
  - Recipient verification verified prior to send; LINE send physically observed.
  - Both jobs completed successfully (`08:10:18`, `08:10:30`); 0 failed; overall campaign completed.
  - Zero visible `JOB_LEASE_LOST`, `lease_lost`, `OA_CONTEXT_MISMATCH`, or `RECIPIENT_UNVERIFIED`.
  - Post-run Account Protection: ON, 10m: 2/60, 1h: 2/300, Next Send: now, Cooling: none.
- **Accepted Safety Contract**:
  - Nullable job lease columns on `CampaignJob`: `leaseToken` (varchar 64), `leaseOwner` (varchar 128), `leaseExpiresAt` (timestamp), `leaseHeartbeatAt` (timestamp). Added index `idx_campaign_jobs_bot_status_lease` on `(botId, status, leaseExpiresAt)`.
  - Atomic claim on `GET /api/campaign/next`: requires `X-LineSync-Worker-Instance` header (`^ts_[0-9]{10,17}_[a-z0-9]{4,32}$`), generates UUID `leaseToken`, sets 60s lease expiry (`NOW() + 60s`).
  - Active heartbeat loop: `POST /api/campaign/heartbeat` extends active leases by 60s every 10s. Distinguishes renewed, explicit `lease_lost`, and transient error.
  - Final pre-send lease renewal fencing: `renewJobLeaseOrThrow` invoked before image confirm (`confirmAndCloseImageModal(expectedUserId, expectedBotId)`), text send click, and Enter keydown.
  - Transactional finalization with Pessimistic Locking: `/campaign/success`, `/campaign/fail`, and `/campaign/stop` execute TypeORM transactions locking `Campaign` row with `pessimistic_write` after fenced job status transition.
  - Customer Failure Rollback: DB failures when updating blocked customers in `markFail` propagate and rollback the transaction.
  - Same-Job Finalization Retry: After physical send, transient network failure retries finalization with same credentials while lease is valid; explicit lease loss relinquishes execution without marking fail; physical send is never repeated.
  - Integrated Circuit Breaker inside `markFail` (R3): When 10 consecutive errors occur, the worker calls `/campaign/fail` with `errorOverflow: true`. The transaction increments `failedCount`, sets `campaign.status = 'stopped_error'`, clears all remaining leases, and commits atomically without calling `/campaign/stop`.
  - Strict Worker-Driven Stop Fencing: `/campaign/stop` with `jobId` locks the calling `CampaignJob` with `pessimistic_write` and strictly enforces active processing lease before stopping the campaign; recent-failed and historical fallbacks are removed.
  - Post-Commit Telegram: Notifications dispatched only after DB transaction resolves.
- **Non-Destructive UAT Limitation**: Intentional testing of destructive failure modes (lease expiration takeover, stale-worker competing finalization, forced outage during finalization, forced heartbeat failure, forced 10-error circuit breaker) was NOT run against live LINE OA to avoid operational/send risk. They are covered by focused behavioral/unit tests. The local validation suite reported 236/236 passing; no independent GitHub CI status is available.
- **Known REL-WP003 Boundary**: Post-send crash window (send succeeds in LINE but browser/node crashes before backend finalization response) is explicitly bounded and deferred to `REL-WP003 — Idempotent Send Ledger / Multipart Crash Safety`.

---

## 🛡️ Account Protection & Send Compliance Guard (SAFE-WP001 STATUS: CLOSED / PASS)

- **SAFE-WP001 Accepted Live UAT**:
  - v28.11 send run
  - v28.12 telemetry heartbeat closure
- Current Worker v28.15 preserves the accepted SAFE-WP001 protection contract (fail-closed storage, rate limits of 10s gap, 60/10m, 300/1h, exact timestamp reservation, and telemetry heartbeat).

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
3. **Web Dashboard (`index.html`)**: Contract v2 badge, Required Worker v28.15.
4. **Client Automation Userscript (`run/LineSyncApp.js` v28.15)**: Worker instance header `X-LineSync-Worker-Instance`, active job heartbeat timer, pre-send lease renewal fencing.

---

## 🚀 Work Packages Overview

- **Closed Work Packages**: `BUG-WP001`, `BUG-WP002`, `SEC-WP001`, `OPS-WP001`, `REL-WP001`, `OA-WP001`, `SYNC-WP001`, `SAFE-WP001`, `REL-WP002` (`CLOSED / PASS`).
- **Active Work Package**: `NONE`.
- **Work Package Status**:
  - `REL-WP002`: `CLOSED / PASS`.
  - `REL-WP002-R1`: `CORRECTED / SUPERSEDED`.
  - `REL-WP002-R2`: `CORRECTIVE REQUIRED / SUPERSEDED`.
  - `REL-WP002-R3`: `CLOSED / PASS`.
- **Next Candidate**: `REL-WP003 — Idempotent Send Ledger / Multipart Crash Safety` (`READY / NOT STARTED / AUTHORIZATION REQUIRED`).
