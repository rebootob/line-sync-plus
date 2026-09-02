# LineSync Plus — Project Status, Incident History & Development Roadmap

## 1. Executive Summary

**LineSync Plus** is an automated customer contact synchronization, group segmentation, and broadcast campaign management platform operating against the **LINE Official Account (LINE OA)** Web Interface (`chat.line.biz`). The system consists of a NestJS backend REST API, a single-page HTML web dashboard, a PostgreSQL database, and a client-side Tampermonkey automation script (`run/LineSyncApp.js` v28.5).

This document serves as the master source-of-truth for project architecture, safety models, complete incident corrective history, live UAT evidence, technical debt, secret hygiene mandates, and the Phase 0–5 development roadmap.

---

## 2. Project Purpose

The primary objective of LineSync Plus is to enable high-volume, reliable, and safe message broadcasts to customer segments via LINE Official Account while maintaining zero-tolerance safety bounds against message misdelivery, context poisoning, quota overflows, multi-OA leakage, and execution race conditions.

Key Operational Goals:
- Synchronize customer profiles, display names, and block statuses automatically.
- Provide real-time UI segmentation, tagging, and quick selection filters.
- Automate multi-type message broadcasts (`text`, `image_only`, `link_only`, `text_link`, `image_link`).
- Guarantee zero-tolerance recipient verification before every message send.
- Guarantee single active worker execution across multiple open browser tabs.
- Guarantee strict OA context isolation across multi-OA environments.
- Provide navigation-safe, confirmed-write diagnostic logging for UAT endurance analysis.

---

## 3. Current Architecture

```
+-----------------------------------------------------------------------------------+
|                                 LineSync Dashboard                                |
|                           Single-Page Web Application UI                          |
+----------------------------------------+------------------------------------------+
                                         |
                                         | REST API (HTTP)
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

                                         ^
                                         | REST API / Diagnostics
                                         v

+-----------------------------------------------------------------------------------+
|                          Client Automation & Observability                        |
|                      Tampermonkey Userscript (LineSyncApp.js v28.5)              |
|                             Running in chat.line.biz                              |
|                                                                                   |
|  - Multi-OA Context Isolation & Identity Fencing (OA-WP001 / R1 CLOSED / PASS)     |
|  - Single Worker Multi-Tab Lock (REL-WP001 / R1 / R2 CLOSED / PASS)               |
|  - Document-Lifetime Tab Identity Lock & Clone Defense (ensureTabIdentity)        |
|  - Fail-Closed Lease Persistence (writeAndVerifyLeaderRecord)                     |
|  - Complete Navigation Hold (navigateAsLeader: NAVIGATION_LEASE_MS = 45000)       |
|  - Atomic Pre-Send Fencing (confirmWorkerLeadershipForSend under Web Locks)       |
|  - Fail-Closed Runtime Version Gate (X-LineSync-Worker-Version: 28.5)             |
|  - Strict OA Context Validator (isValidChatContextId)                             |
|  - Full-Lifecycle Execution Lock (isExecutingJob)                                 |
|  - Same-Job Safe Recovery & Preservation (handleSafeRecovery)                     |
|  - Zero-Tolerance Pre-Send Recipient Verification Guard                           |
|  - Atomic Navigation-Safe Diagnostic Spooling (linesync_pending_diagnostics)      |
+-----------------------------------------------------------------------------------+
```

---

## 4. Existing Functions

1. **Customer & Group Management**:
   - Multi-OA customer profile synchronization (`(botId, lineUserId)` composite primary key).
   - Tag assignment, group creation, member mapping, and deletion with explicit `botId` scoping.
2. **Campaign & Queue Engine**:
   - Multi-type campaign dispatching (`text`, `image_only`, `link_only`, `text_link`, `image_link`).
   - Hard OA queue gate via `GET /api/campaign/next` with status reporting (`/campaign/success`, `/campaign/fail`, `/campaign/stop`) and fail-closed runtime version gate (`X-LineSync-Worker-Version`).
   - Local timezone scheduling support.
3. **Telegram Notification Subsystem**:
   - Formatted HTML campaign progress and completion summary reporting via Telegram Bot API.
4. **Local Diagnostic Observability**:
   - Confirmed-write browser diagnostic event logging to `uat-logs/browser-BUG-WP001-UAT.log` via `POST /api/diagnostics/browser-event`.

---

## 5. Safety Model

The LineSync Plus safety model operates on strict **fail-closed** principles:

- **Strict OA Identity Fencing (OA-WP001 / OA-WP001-R1 CLOSED / PASS)**: Terminal fallback reporting requires valid `botId` + `lineUserId` + `status: 'processing'`. Physical send guards in worker require valid `expectedBotId` matching current OA. Saved job recovery reads `linesync_job_botid` and calls `clearLocalActiveJobState()` if missing/invalid. Queue processor enforces `selectedJob.botId === activeBotId` and `targetCampaign.botId === activeBotId`. Group endpoints require valid `?botId=...`.
- **Single Worker Multi-Tab Lock & Clone Defense (REL-WP001 CLOSED / PASS)**: `ensureWorkerLeadership()` enforces that only ONE active worker tab claims jobs or executes DOM mutations within a browser profile/storage partition.
- **Zero-Tolerance Recipient Verification**: `verifyCurrentRecipient(expectedUserId)` enforces matching URL path (`/${botId}/chat/${expectedUserId}`) and DOM attribute validation before any text insertion or image send click.
- **Fail-Closed Runtime Version Gate (OPS-WP001 CLOSED / PASS)**: `GET /api/campaign/next` rejects request with HTTP 409 Conflict if `X-LineSync-Worker-Version` header is missing or != `'28.5'` before querying or claiming any job.
- **Full-Lifecycle Execution Lock**: `isExecutingJob` remains active across the entire job lifecycle.
- **Circuit Breaker**: Halts campaign execution automatically if 10 consecutive system errors occur.
- **Quota Limit Protection**: Detects LINE OA quota limit alerts on-screen and immediately stops campaign processing without recording system errors.
- **Blocked User Handling**: Detects blocked chat inputs and records non-error skip statuses without incrementing system error counts.

---

## 6. Problems Found & Work Packages

Over the course of safety hardening, 12 work packages were identified, implemented, verified, and **CLOSED**:

1. **BUG-WP001 — LINE OA 404 / Wrong Recipient Safety Guard (CLOSED)**
2. **BUG-WP001-R1 — Execution Lock / Same-Job Recovery / Final Send Guard (CLOSED)**
3. **BUG-WP001-UATLOG — Persistent Browser Safety Diagnostic Logging (CLOSED)**
4. **BUG-WP001-UATLOG-R1 — Low-Noise / Local-Only Diagnostic Logging (CLOSED)**
5. **BUG-WP001-UATLOG-R2 — Trusted Loopback Enforcement / Clean Test Evidence (CLOSED)**
6. **BUG-WP001-UATLOG-R3 — Navigation-Safe Diagnostic Persistence (CLOSED)**
7. **BUG-WP001-UATLOG-R4 — Atomic Spool Flush / No Lost Concurrent Events (CLOSED)**
8. **BUG-WP001-UATLOG-R5 — Confirmed-Write Spool Removal (CLOSED)**
9. **BUG-WP002 — OA Context Poisoning / Invalid BotId 404 Loop (CLOSED)**
10. **BUG-WP002-R1 — Preserve Active Job When OA Context Is Unknown (CLOSED)**
11. **REL-WP001 / REL-WP001-R1 / REL-WP001-R2 — Single Worker / Multi-Tab Lock (CLOSED)**
12. **OA-WP001 / OA-WP001-R1 — OA Context Isolation & Strict OA Identity Fencing (CLOSED / PASS)**

---

## 7. Operational Findings

- Browser page reloads cancel in-flight HTTP requests unless spooled synchronously in `sessionStorage`.
- Direct socket peer validation (`req.socket.remoteAddress`) is required to prevent proxy header spoofing on local UAT diagnostic endpoints.
- LINE OA context IDs strictly adhere to `^U[0-9a-fA-F]{32}$`; short IDs or manager account strings must never be treated as valid chat contexts.
- Multi-tab browser coordination requires document-lifetime identity locks (`ensureTabIdentity`) to prevent cloned-tab identity reuse, combined with `navigator.locks` election mutex and durable `localStorage` lease records (`writeAndVerifyLeaderRecord`) to maintain ownership across same-tab navigations (`navigateAsLeader`).
- Multi-OA environments require hard identity fencing at both backend queue endpoints and browser physical send guards to guarantee that workers never claim or execute jobs belonging to another OA context.

---

## 8. UAT Evidence

- **Safety Gate Status**: **PASS**
- **BUG-WP001**: **CLOSED / PASS**
- **BUG-WP001-UATLOG**: **CLOSED / PASS**
- **BUG-WP002**: **CLOSED / PASS**
- **SEC-WP001**: **CLOSED / PASS**
- **OPS-WP001 / OPS-WP001-R1**: **CLOSED / PASS**
- **REL-WP001 / REL-WP001-R1 / REL-WP001-R2**: **CLOSED / PASS**
  - **UAT-01 (Multi-Tab Election)**: PASS (1 Leader, 1 Standby).
  - **UAT-02 (Duplicate Tab Clone Defense)**: PASS (`[REL] DUPLICATE TAB IDENTITY DETECTED` -> new `tabSessionId` assigned, copied lease not reused).
  - **UAT-03 (Leader Failover)**: PASS (Original leader closed -> `[REL] WORKER LEADER TAKEOVER`, 1 Leader active).
  - **UAT-04 (Live Single Consumption)**: PASS (2 tabs open -> 1-recipient campaign sent by Leader alone, Target=1, Success=1, Fail=0, Duplicate Send=0).
- **OA-WP001 / OA-WP001-R1**: **CLOSED / PASS** (Passed 2026-09-02)
  - **UAT-01 (Database Migration / OA Discovery)**: PASS (Dashboard discovered 2 real LINE OA contexts: OA #1 with 9,737 total / 9,176 active / 561 blocked; OA #2 with 2,153 total / 2,151 active / 2 blocked).
  - **UAT-02 (Dashboard OA Isolation)**: PASS (OA #1 displayed only OA #1 customers; OA #2 displayed only OA #2 customers; no combined or unselected list).
  - **UAT-03 (Controlled Dashboard OA Switch)**: PASS (Master Bot must be PAUSED before switch; attempted switch while Bot running rejected with HTTP 409 Conflict; `activeBotId` persisted cleanly).
  - **UAT-04 (Controlled Physical LINE OA Switch)**: PASS (Worker v28.5 aligned physical `chat.line.biz` OA with `activeBotId` before queue execution; initial OA #1 `U09d6...` -> after switch OA #2 `U07f7...`; no job claimed before alignment).
  - **UAT-05 (OA #2 Live Send Path)**: PASS (`JOB_RECEIVED` -> `NAVIGATE_TARGET` -> `PAGE_LOAD_ACTIVE_JOB` -> `RECIPIENT_VERIFY_OK` -> `TEXT_PRE_SEND_VERIFIED` -> `JOB_SUCCESS`; wrong OA send = 0).
  - **UAT-06 (Cross-OA Queue Isolation)**: PASS (OA #2 worker did NOT claim OA #1 pending jobs; OA #2 campaign processed; switching back to OA #1 resumed OA #1 pending jobs cleanly).
- **83-recipient baseline UAT**: 83 targets / 80 success / 3 blocked / no observed 404
- **UAT-1100 Campaign Evidence (LineSyncApp v28.2)**:
  - Target = 1,100, Processed = 473, Success = 69, Blocked = 402, 404 = 2 (safe retry exhaust), zero misdeliveries.

---

## 9. Known Risks & Technical Debt

### Secret Hygiene P0 Mandate (`SEC-WP001` STATUS: COMPLETED / CLOSED)
- **CRITICAL**: The repository `rebootob/line-sync-plus` is **PUBLIC**.
- **PROHIBITED**: Under no circumstances may `.env` files, API keys, passwords, database credentials, access tokens, refresh tokens, private keys, or LINE channel secrets be committed or pushed to Git.
- **SEC-WP001 Status**: Untracked secret `telegram-config.json` from Git. Compromised token revoked and rotated via `@BotFather` by Project Owner. Live Telegram test after rotation = **PASS**.

### Multi-Part Message Residual Risk (REL-WP003)
- For multi-part messages (`image_link`), if a browser process crashes after physical image send completes but before text send/finishJob completes, a future worker could re-send the image part without idempotency ledger protection. Documented as residual risk for REL-WP003.

---

## 10. Target Vision

To establish LineSync Plus as a robust, secure, and production-ready automated communication platform for LINE Official Account operations.

---

## 11. Development Roadmap

- **Phase 0 — Security & Reliability Foundation**: **IN PROGRESS**
  - Safety hardening (`BUG-WP001`, `BUG-WP001-UATLOG`, `BUG-WP002`, `BUG-WP002-R1`): **COMPLETED**
  - `SEC-WP001` (Secret Hygiene): **COMPLETED / CLOSED**
  - `OPS-WP001` (Runtime Version Gate): **COMPLETED / CLOSED**
  - `OPS-WP001-R1` (Runtime Retry + Fail-Closed Corrective): **COMPLETED / CLOSED**
  - `REL-WP001 / REL-WP001-R1 / REL-WP001-R2` (Single Worker / Multi-Tab Lock): **COMPLETED / CLOSED**
  - `OA-WP001 / OA-WP001-R1` (OA Context Isolation & Strict Identity Fencing): **COMPLETED / CLOSED**
  - `REL-WP002` (Job Lease + Heartbeat): **READY / NOT STARTED** (AUTHORIZATION REQUIRED)
  - `REL-WP003`: **NOT STARTED**
- **Phase 1 — Operations & Monitoring**: **NOT STARTED**
- **Phase 2 — Campaign Builder v2**: Enhanced broadcast campaign creation, template previews, and scheduled queue controls.
- **Phase 3 — Audience & Customer Intelligence**: Advanced customer segment tagging, automated display name cleanup, and activity tracking.
- **Phase 4 — Multi-OA, Governance & Admin**: Context isolation across multiple LINE Official Accounts, role permissions, and administrative controls.
- **Phase 5 — Analytics & Optimization**: Performance reporting, delivery throughput metrics, and campaign success analytics.

---

## 12. Proposed Feature Priority

1. **P0 (Critical Safety & Security)**:
   - OA Context Isolation & Strict Identity Fencing (`OA-WP001 / OA-WP001-R1` COMPLETED / CLOSED).
   - Single worker multi-tab lock (`REL-WP001 / R1 / R2` COMPLETED / CLOSED).
   - Operational runtime version gate (`OPS-WP001 / R1` COMPLETED / CLOSED).
   - Secret hygiene & test isolation (`SEC-WP001` COMPLETED / CLOSED).
2. **P1 (Observability & Operational Hardening)**:
   - Backend Job Lease & Heartbeat (`REL-WP002` READY / NOT STARTED).
   - Idempotent Send Ledger (`REL-WP003` NOT STARTED).
   - Real-time diagnostic event stream UI widget in Dashboard.

---

## 13. Technical Evolution

- **Script Versioning**: Evolved from v27.0 -> v28.1 -> v28.2 -> v28.3 -> v28.4 -> v28.5 (OA-WP001 / R1 CLOSED / PASS).
- **Architecture Maturity**: Shifted from unvalidated DOM polling to strict schema-validated context gates, atomic spooling, fail-closed state preservation, fail-closed runtime version gates, single-worker multi-tab election locks with document-lifetime tab identity clone defense, read-back persistence verification, complete navigation holds, atomic pre-send mutex confirmation, and strict multi-OA identity fencing with cross-OA queue isolation.

---

## 14. Recommended Next Work Package Candidate

- **REL-WP002**: Job Lease + Heartbeat (**READY / NOT STARTED** — Project Owner authorization required).

---

## 15. Success Metrics

- **Zero Misdeliveries**: 0% message delivery to wrong recipients or wrong OA context.
- **Zero Duplicate Tab Workers**: 0 competing `/campaign/next` calls or duplicate DOM automation from multiple open or duplicated LINE OA tabs (Verified in REL-WP001 UAT-01..04).
- **Zero Incompatible Worker Claims**: 0 campaign jobs claimed by outdated browser workers.
- **Zero Poisoning Loops**: 0 infinite 404 redirect loops on invalid bot IDs.
- **100% Spool Integrity**: 0 lost navigation diagnostic events during page transitions.
- **100% Test Pass Rate**: All Jest unit tests passing cleanly.

---

## 16. Source-of-Truth Policy

- All code changes MUST exist in BOTH local workspace (`C:\Users\allda\Desktop\Dev\git\line-sync-plus`) AND GitHub repository (`rebootob/line-sync-plus` branch `main`).
- `ACTIVE_TASK.md` tracks current active work package.
- `CHAT_HANDOFF.md` tracks Control Plane evaluation state.
- `PROJECT_STATUS_ROADMAP.md` tracks complete architectural roadmap and incident history.

---

## 17. Immediate Decision Gate

Phase 0 OA-WP001 / OA-WP001-R1 is CLOSED / PASS.
Worker Version: 28.5 | Runtime Contract: 2 | Required Worker: 28.5
REL-WP001 is CLOSED / PASS.
Next Candidate: `REL-WP002 — Job Lease + Heartbeat` (READY / NOT STARTED — Project Owner authorization required).
Do NOT start `REL-WP002` automatically.
