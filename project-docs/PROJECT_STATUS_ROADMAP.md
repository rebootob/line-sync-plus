# LineSync Plus — Project Status, Incident History & Development Roadmap

## 1. Executive Summary

**LineSync Plus** is an automated customer contact synchronization, group segmentation, and broadcast campaign management platform operating against the **LINE Official Account (LINE OA)** Web Interface (`chat.line.biz`). The system consists of a NestJS backend REST API, a single-page HTML web dashboard, a PostgreSQL database, and a client-side Tampermonkey automation script (`run/LineSyncApp.js` v28.4).

This document serves as the master source-of-truth for project architecture, safety models, complete 10-package incident corrective history, live UAT evidence, technical debt, secret hygiene mandates, and the Phase 0–5 development roadmap.

---

## 2. Project Purpose

The primary objective of LineSync Plus is to enable high-volume, reliable, and safe message broadcasts to customer segments via LINE Official Account while maintaining zero-tolerance safety bounds against message misdelivery, context poisoning, quota overflows, and execution race conditions.

Key Operational Goals:
- Synchronize customer profiles, display names, and block statuses automatically.
- Provide real-time UI segmentation, tagging, and quick selection filters.
- Automate multi-type message broadcasts (`text`, `image_only`, `link_only`, `text_link`, `image_link`).
- Guarantee zero-tolerance recipient verification before every message send.
- Guarantee single active worker execution across multiple open browser tabs.
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
|                      Tampermonkey Userscript (LineSyncApp.js v28.4)              |
|                             Running in chat.line.biz                              |
|                                                                                   |
|  - Document-Lifetime Tab Identity Lock & Clone Defense (ensureTabIdentity)        |
|  - Fail-Closed Lease Persistence (writeAndVerifyLeaderRecord)                     |
|  - Complete Navigation Hold (navigateAsLeader: NAVIGATION_LEASE_MS = 45000)       |
|  - Atomic Pre-Send Fencing (confirmWorkerLeadershipForSend under Web Locks)       |
|  - Fail-Closed Runtime Version Gate (X-LineSync-Worker-Version: 28.4)             |
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
   - Automated display name cleaning and block status tracking.
   - Tag assignment, group creation, member mapping, and deletion.
2. **Campaign & Queue Engine**:
   - Multi-type campaign dispatching (`text`, `image_only`, `link_only`, `text_link`, `image_link`).
   - Atomic job queue handling via `GET /api/campaign/next` with status reporting (`/campaign/success`, `/campaign/fail`, `/campaign/stop`) and fail-closed runtime version gate (`X-LineSync-Worker-Version`).
   - Local timezone scheduling support.
3. **Telegram Notification Subsystem**:
   - Formatted HTML campaign progress and completion summary reporting via Telegram Bot API.
4. **Local Diagnostic Observability**:
   - Confirmed-write browser diagnostic event logging to `uat-logs/browser-BUG-WP001-UAT.log` via `POST /api/diagnostics/browser-event`.

---

## 5. Safety Model

The LineSync Plus safety model operates on strict **fail-closed** principles to eliminate risks of context loss or misdirection:

- **Single Worker Multi-Tab Lock & Clone Defense (REL-WP001 / R1 / R2)**: `ensureWorkerLeadership()` enforces that only ONE active worker tab claims jobs or executes DOM mutations within a browser profile/storage partition. `ensureTabIdentity()` prevents duplicate/cloned tabs from reusing copied session identities by assigning a new `tabSessionId` and clearing copied lease state. `writeAndVerifyLeaderRecord()` guarantees fail-closed storage persistence, `navigateAsLeader()` enforces complete navigation holds across all full-page reloads, and `confirmWorkerLeadershipForSend()` provides atomic pre-send mutex confirmation.
- **Zero-Tolerance Recipient Verification**: `verifyCurrentRecipient(expectedUserId)` enforces matching URL path (`/${botId}/chat/${expectedUserId}`) and DOM attribute validation before any text insertion or image send click.
- **Fail-Closed Runtime Version Gate (OPS-WP001 / OPS-WP001-R1)**: `GET /api/campaign/next` rejects request with HTTP 409 Conflict if `X-LineSync-Worker-Version` header is missing or != `'28.4'` before querying or claiming any job. Client retries compatibility check via `setTimeout(..., CHECK_INTERVAL)` without fetching jobs while incompatible.
- **Full-Lifecycle Execution Lock**: `isExecutingJob` remains active across the entire job lifecycle.
- **Circuit Breaker**: Halts campaign execution automatically if 10 consecutive system errors occur.
- **Quota Limit Protection**: Detects LINE OA quota limit alerts on-screen and immediately stops campaign processing without recording system errors.
- **Blocked User Handling**: Detects blocked chat inputs and records non-error skip statuses without incrementing system error counts.

---

## 6. Problems Found & 10 Corrective Work Packages

Over the course of safety hardening, 10 corrective work packages were identified, implemented, verified, and **CLOSED**:

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

---

## 7. Operational Findings

- Browser page reloads cancel in-flight HTTP requests unless spooled synchronously in `sessionStorage`.
- Direct socket peer validation (`req.socket.remoteAddress`) is required to prevent proxy header spoofing on local UAT diagnostic endpoints.
- LINE OA context IDs strictly adhere to `^U[0-9a-fA-F]{32}$`; short IDs or manager account strings must never be treated as valid chat contexts.
- Multi-tab browser coordination requires document-lifetime identity locks (`ensureTabIdentity`) to prevent cloned-tab identity reuse, combined with `navigator.locks` election mutex and durable `localStorage` lease records (`writeAndVerifyLeaderRecord`) to maintain ownership across same-tab navigations (`navigateAsLeader`).

---

## 8. UAT Evidence

- **Safety Gate Status**: **PASS**
- **BUG-WP001**: **CLOSED**
- **BUG-WP001-UATLOG**: **CLOSED**
- **BUG-WP002**: **CLOSED**
- **SEC-WP001**: **CLOSED**
- **OPS-WP001 / OPS-WP001-R1**: **CLOSED**
- **REL-WP001 / R1 / R2**: **READY_FOR_CHATGPT_REVIEW**
- **83-recipient baseline UAT**: 83 targets / 80 success / 3 blocked / no observed 404
- **UAT-1100 Campaign Evidence (LineSyncApp v28.2)**:
  - Target = 1,100, Processed = 473, Success = 69, Blocked = 402, 404 = 2 (safe retry exhaust), zero misdeliveries.
- **OPS-WP001 Live UAT Evidence (LineSyncApp v28.3)**:
  - Passed UAT-01 (Matched Version), UAT-02 (Incompatible Worker Rejection), and UAT-03 (Backend Offline / Auto Recovery without manual page reloads).

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
  - `REL-WP001` (Single Worker / Multi-Tab Lock): **READY_FOR_CHATGPT_REVIEW**
  - `REL-WP001-R1` (Fail-Closed Lease Persistence + Complete Navigation Hold): **READY_FOR_CHATGPT_REVIEW**
  - `REL-WP001-R2` (Duplicate-Tab Identity Clone Defense): **READY_FOR_CHATGPT_REVIEW**
  - `REL-WP002`: **NOT STARTED**
  - `REL-WP003`: **NOT STARTED**
- **Phase 1 — Operations & Monitoring**: **NOT STARTED**
- **Phase 2 — Campaign Builder v2**: Enhanced broadcast campaign creation, template previews, and scheduled queue controls.
- **Phase 3 — Audience & Customer Intelligence**: Advanced customer segment tagging, automated display name cleanup, and activity tracking.
- **Phase 4 — Multi-OA, Governance & Admin**: Context isolation across multiple LINE Official Accounts, role permissions, and administrative controls.
- **Phase 5 — Analytics & Optimization**: Performance reporting, delivery throughput metrics, and campaign success analytics.

---

## 12. Proposed Feature Priority

1. **P0 (Critical Safety & Security)**:
   - Single worker multi-tab lock (`REL-WP001` & `R1` & `R2` READY_FOR_CHATGPT_REVIEW).
   - Operational runtime version gate (`OPS-WP001` & `OPS-WP001-R1` COMPLETED / CLOSED).
   - Secret hygiene & test isolation (`SEC-WP001` COMPLETED / CLOSED).
   - Fail-closed recipient verification & OA context validation (Completed in WP001/WP002).
2. **P1 (Observability & Operational Hardening)**:
   - Backend Job Lease & Heartbeat (`REL-WP002` NOT STARTED).
   - Idempotent Send Ledger (`REL-WP003` NOT STARTED).
   - Real-time diagnostic event stream UI widget in Dashboard.

---

## 13. Technical Evolution

- **Script Versioning**: Evolved from v27.0 -> v28.1 -> v28.2 -> v28.3 -> v28.4 (REL-WP001 / R1 / R2).
- **Architecture Maturity**: Shifted from unvalidated DOM polling to strict schema-validated context gates, atomic spooling, fail-closed state preservation, fail-closed runtime version gates, single-worker multi-tab election locks with document-lifetime tab identity clone defense, read-back persistence verification, complete navigation holds, and atomic pre-send mutex confirmation.

---

## 14. Recommended Next Work Packages

- **REL-WP001 / R1 / R2**: Single-Worker Execution Lock / Multi-Tab Defense (**READY_FOR_CHATGPT_REVIEW**).
- **REL-WP002**: Backend Worker Lease & Heartbeat (**NOT STARTED**).
- **WP-UI-LOGS**: Implement browser diagnostic log viewer tab in single-page dashboard.

---

## 15. Success Metrics

- **Zero Misdeliveries**: 0% message delivery to wrong recipients.
- **Zero Duplicate Tab Workers**: 0 competing `/campaign/next` calls or duplicate DOM automation from multiple open or duplicated LINE OA tabs.
- **Zero Incompatible Worker Claims**: 0 campaign jobs claimed by outdated browser workers.
- **Zero Poisoning Loops**: 0 infinite 404 redirect loops on invalid bot IDs.
- **100% Spool Integrity**: 0 lost navigation diagnostic events during page transitions.
- **100% Test Pass Rate**: All Jest unit tests (39/39) passing cleanly.

---

## 16. Source-of-Truth Policy

- All code changes MUST exist in BOTH local workspace (`C:\Users\allda\Desktop\Dev\git\line-sync-plus`) AND GitHub repository (`rebootob/line-sync-plus` branch `main`).
- `ACTIVE_TASK.md` tracks current active work package.
- `CHAT_HANDOFF.md` tracks Control Plane evaluation state.
- `PROJECT_STATUS_ROADMAP.md` tracks complete architectural roadmap and incident history.

---

## 17. Immediate Decision Gate

The project is currently at Phase 0 (Security & Reliability Foundation) with REL-WP001, REL-WP001-R1, and REL-WP001-R2 implemented and READY_FOR_CHATGPT_REVIEW.
Next Action: Await ChatGPT Control Plane review of REL-WP001 / REL-WP001-R1 / REL-WP001-R2 implementation.
