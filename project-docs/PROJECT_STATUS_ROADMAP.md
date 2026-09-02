# LineSync Plus — Complete Approved Project Status & Development Roadmap

---

## 1. Executive Summary

**LineSync Plus** is an automated customer contact synchronization, group segmentation, and broadcast campaign management platform operating against the **LINE Official Account (LINE OA)** Web Interface (`chat.line.biz`). The system consists of a NestJS backend REST API, a single-page HTML web dashboard, a PostgreSQL database, and a client-side Tampermonkey automation script (`run/LineSyncApp.js` v28.2).

This document serves as the master source-of-truth for project architecture, safety models, complete 10-package incident corrective history, live UAT evidence, technical debt, secret hygiene mandates, and the Phase 0–5 development roadmap.

---

## 2. Project Purpose

The primary objective of LineSync Plus is to enable high-volume, reliable, and safe message broadcasts to customer segments via LINE Official Account while maintaining zero-tolerance safety bounds against message misdelivery, context poisoning, quota overflows, and execution race conditions.

Key Operational Goals:
- Synchronize customer profiles, display names, and block statuses automatically.
- Provide real-time UI segmentation, tagging, and quick selection filters.
- Automate multi-type message broadcasts (`text`, `image_only`, `link_only`, `text_link`, `image_link`).
- Guarantee zero-tolerance recipient verification before every message send.
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
+-----------------------------------------------------------------------------------+
|                                NestJS Backend Server                              |
|                              Port 3005 (TypeScript)                               |
|                                                                                   |
|  - AppController (Endpoints: /customers, /campaign, /diagnostics/browser-event)   |
|  - TelegramService (HTML Summary Broadcast Reports)                               |
|  - TypeORM Entities (Customer, CustomerGroup, CustomerGroupMember, CampaignJob)   |
+----------------------------------------+------------------------------------------+
                                         |
                                         | PostgreSQL Connection (Port 5433)
                                         v
+-----------------------------------------------------------------------------------+
|                               PostgreSQL Database                                 |
|                                 line_sync_db                                      |
+-----------------------------------------------------------------------------------+

                                         ^
                                         | REST API / Diagnostics
                                         v

+-----------------------------------------------------------------------------------+
|                          Client Automation & Observability                        |
|                      Tampermonkey Userscript (LineSyncApp.js v28.2)              |
|                             Running in chat.line.biz                              |
|                                                                                   |
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
   - Atomic job queue handling via `GET /api/campaign/next` with status reporting (`/campaign/success`, `/campaign/fail`, `/campaign/stop`).
   - Local timezone scheduling support.
3. **Telegram Notification Subsystem**:
   - Formatted HTML campaign progress and completion summary reporting via Telegram Bot API.
4. **Local Diagnostic Observability**:
   - Confirmed-write browser diagnostic event logging to `uat-logs/browser-BUG-WP001-UAT.log` via `POST /api/diagnostics/browser-event`.

---

## 5. Safety Model

The LineSync Plus safety model operates on strict **fail-closed** principles to eliminate risks of context loss or misdirection:

- **Zero-Tolerance Recipient Verification**: `verifyCurrentRecipient(expectedUserId)` enforces matching URL path (`/${botId}/chat/${expectedUserId}`) and DOM attribute validation before any text insertion or image send click.
- **Full-Lifecycle Execution Lock**: `isExecutingJob` remains active across the entire job lifecycle (navigation verification -> input discovery -> payload preparation -> recipient re-verification -> send -> terminal job report) preventing re-entrant duplicate sends.
- **Circuit Breaker**: Halts campaign execution automatically if 10 consecutive system errors occur (`sessionStorage.setItem('linesync_consecutive_errors', ...)`).
- **Quota Limit Protection**: Detects LINE OA quota limit alerts on-screen and immediately stops campaign processing without recording system errors.
- **Blocked User Handling**: Detects blocked chat inputs and records non-error skip statuses without incrementing system error counts.

---

## 6. Problems Found & 10 Corrective Work Packages

Over the course of safety hardening, 10 corrective work packages were identified, implemented, and verified:

1. **BUG-WP001 — LINE OA 404 / Wrong Recipient Safety Guard**:
   - *Problem*: Navigation and context loss on LINE OA caused risks of sending messages to incorrect chat rooms.
   - *Fix*: Created explicit error page detection (`checkIfErrorPage`) and strict recipient verification (`verifyCurrentRecipient`).
2. **BUG-WP001-R1 — Execution Lock / Same-Job Recovery / Final Send Guard**:
   - *Problem*: Re-entrancy race conditions and loss of active job parameters across page reloads.
   - *Fix*: Extended `isExecutingJob` lock across full job lifecycle, implemented `handleSafeRecovery` preserving job state in `sessionStorage` up to 2 bounded retries, and added zero-tolerance pre-send checks.
3. **BUG-WP001-UATLOG — Persistent Browser Safety Diagnostic Logging**:
   - *Problem*: Lack of persistence for browser safety events during UAT endurance testing.
   - *Fix*: Added backend diagnostic endpoint `POST /api/diagnostics/browser-event` logging to `uat-logs/browser-BUG-WP001-UAT.log`.
4. **BUG-WP001-UATLOG-R1 — Low-Noise / Local-Only Diagnostic Logging**:
   - *Problem*: High-frequency log spamming on every verification tick and unhardened backend input.
   - *Fix*: Restricted logging to lifecycle checkpoints, enforced event allowlist, and added loopback IP protection.
5. **BUG-WP001-UATLOG-R2 — Trusted Loopback Enforcement / Clean Test Evidence**:
   - *Problem*: Potential IP header spoofing via `x-forwarded-for` and test log pollution.
   - *Fix*: Bound IP check strictly to direct socket `remoteAddress` (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`), ignoring forwarded headers, and spied on file writes in Jest tests.
6. **BUG-WP001-UATLOG-R3 — Navigation-Safe Diagnostic Persistence**:
   - *Problem*: Pre-navigation diagnostic events were dropped during browser page unload.
   - *Fix*: Created synchronous `sessionStorage` diagnostic spooling (`linesync_pending_diagnostics`) with page-load flush.
7. **BUG-WP001-UATLOG-R4 — Atomic Spool Flush / No Lost Concurrent Events**:
   - *Problem*: Race conditions during flush snapshot overwrote newly appended events.
   - *Fix*: Implemented atomic merge-safe removal via `_sqId` and created `safeClearSessionStorage` to protect spool state across emergency stops.
8. **BUG-WP001-UATLOG-R5 — Confirmed-Write Spool Removal**:
   - *Problem*: Events were removed from spool on HTTP 2xx even if backend returned `{ success: false }`.
   - *Fix*: Required `result && result.success === true` before removing items from spool, preserving event ordering on network failures.
9. **BUG-WP002 — OA Context Poisoning / Invalid BotId 404 Loop**:
   - *Problem*: Unvalidated short IDs (`798hcuca`) and manager portal paths (`manager.line.biz`) poisoned `linesync_botid` in `sessionStorage`, leading to 404 redirect loops.
   - *Fix*: Created validator `isValidChatContextId` (`^U[0-9a-fA-F]{32}$`), removed manager execution, refactored `getBotId` and `getOAContextUrl` to fail closed (`null`), and added processQueue context gate.
10. **BUG-WP002-R1 — Preserve Active Job When OA Context Is Unknown**:
    - *Problem*: `handleSafeRecovery` prematurely called `finishJob` and failed active campaign jobs on the backend when browser context was temporarily lost.
    - *Fix*: Refactored `handleSafeRecovery` to check `targetUrl` before consuming retries or calling `finishJob`. If missing, active job state is preserved in `sessionStorage`, `retryCount` is NOT incremented, and execution fails closed until manual valid navigation.

---

## 7. Operational Findings

- Browser page reloads cancel in-flight HTTP requests unless spooled synchronously in `sessionStorage`.
- Direct socket peer validation (`req.socket.remoteAddress`) is required to prevent proxy header spoofing on local UAT diagnostic endpoints.
- LINE OA context IDs strictly adhere to `^U[0-9a-fA-F]{32}$`; short IDs or manager account strings must never be treated as valid chat contexts.

---

## 8. UAT Evidence

- **83-recipient baseline UAT**: Successfully completed with 100% recipient verification accuracy and zero misdeliveries.
- **1,100-recipient endurance UAT**: Currently **RUNNING / RESULT PENDING**. Diagnostic logging is active in `uat-logs/browser-BUG-WP001-UAT.log` to record endurance stability across reloads, 404s, and recovery events.

---

## 9. Known Risks & Technical Debt

### Secret Hygiene P0 Mandate
- **CRITICAL**: The repository `rebootob/line-sync-plus` is **PUBLIC**.
- **PROHIBITED**: Under no circumstances may `.env` files, API keys, passwords, database credentials, access tokens, refresh tokens, private keys, or LINE channel secrets be committed or pushed to Git.

### Technical Debt Items
- Database credentials currently reside in local `.env` (gitignored). Production setup requires secure environment secret injection.
- Diagnostic log files (`uat-logs/`) must be rotated periodically to prevent disk bloat.

---

## 10. Target Vision

To evolve LineSync Plus into a enterprise-grade, resilient, multi-tenant LINE OA broadcast orchestration platform featuring automated failover, dynamic rate-limiting, deep analytics, and multi-agent AI collaboration.

---

## 11. Phase 0–5 Development Roadmap

```
+-----------------------------------------------------------------------------------+
| Phase 0: Emergency Safety & Recipient Isolation (COMPLETED)                      |
| - Recipient verification, Same-Job safe recovery, zero-tolerance guards.          |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 1: Observability & Diagnostic Persistence (COMPLETED)                      |
| - Loopback diagnostic endpoint, navigation spooling, confirmed-write removal.    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 2: OA Context Poisoning Guard & Failure-Closed Architecture (COMPLETED)    |
| - Strict U32hex validation, manager removal, active job preservation (WP002-R1).|
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 3: Endurance UAT Validation & Live Log Monitoring (CURRENT)                |
| - Execution of 1,100-recipient endurance test, log visualization in Dashboard UI.|
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 4: Operational Automation & Multi-Account Support (PLANNED)                 |
| - Multi-OA context switching, automated re-auth notifications, quota prediction.  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 5: Enterprise Analytics & AI Agent Integration (PLANNED)                    |
| - Campaign engagement analytics, dynamic throttling, webhook AI handoffs.        |
+-----------------------------------------------------------------------------------+
```

---

## 12. Proposed Feature Priority

1. **P0 (Critical Safety & Security)**:
   - Secret hygiene enforcement (Zero secrets in public repo).
   - Fail-closed recipient verification & OA context validation (Completed in WP001/WP002).
2. **P1 (Observability & Operational Hardening)**:
   - Completion of 1,100-recipient endurance UAT run.
   - Real-time diagnostic event stream UI widget in Dashboard.
3. **P2 (Analytics & Automation)**:
   - Automated Telegram alert on session expiry / auth loss.
   - Quota usage forecast and smart broadcast scheduling.

---

## 13. Technical Evolution

- **Script Versioning**: Evolved from v27.0 -> v28.1 -> v28.2 (BUG-WP002-R1).
- **Architecture Maturity**: Shifted from unvalidated DOM polling to strict schema-validated context gates, atomic spooling, and fail-closed state preservation.

---

## 14. Recommended Next Work Packages

- **WP-UAT-1100**: Complete and verify 1,100-recipient endurance UAT run log analysis.
- **WP-UI-LOGS**: Implement browser diagnostic log viewer tab in single-page dashboard.
- **WP-AUTH-ALERT**: Implement session disconnect & re-authentication alert via Telegram.

---

## 15. Success Metrics

- **Zero Misdeliveries**: 0% message delivery to wrong recipients.
- **Zero Poisoning Loops**: 0 infinite 404 redirect loops on invalid bot IDs.
- **100% Spool Integrity**: 0 lost navigation diagnostic events during page transitions.
- **100% Test Pass Rate**: All Jest unit tests (20/20) passing cleanly.

---

## 16. Source-of-Truth Policy

- All code changes MUST exist in BOTH local workspace (`C:\Users\allda\Desktop\Dev\git\line-sync-plus`) AND GitHub repository (`rebootob/line-sync-plus` branch `main`).
- `ACTIVE_TASK.md` tracks current active work package.
- `CHAT_HANDOFF.md` tracks Control Plane evaluation state.
- `PROJECT_STATUS_ROADMAP.md` tracks complete architectural roadmap and incident history.

---

## 17. Immediate Decision Gate

The project is currently at **Phase 3 (Endurance UAT Validation)**.
Next Action: Await ChatGPT Control Plane review of BUG-WP002-R1 and approval of next work package assignment.
