# LineSync Plus — Project Status, Incident History & Development Roadmap

## 1. Executive Summary

**LineSync Plus** is an automated customer contact synchronization, group segmentation, and broadcast campaign management platform operating against the **LINE Official Account (LINE OA)** Web Interface (`chat.line.biz`). The system consists of a NestJS backend REST API, a single-page HTML web dashboard, a PostgreSQL database, and a client-side Tampermonkey automation script (`run/LineSyncApp.js` v28.11).

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
- Protect LINE OA account via per-OA send rate limits, fail-closed protection state, exact read-back timestamp reservations, truthful telemetry, campaign target hygiene, and adaptive error backoff (SAFE-WP001 / R1 / R2).

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
                                         | REST API / Diagnostics & Telemetry
                                         v

+-----------------------------------------------------------------------------------+
|                          Client Automation & Observability                        |
|                     Tampermonkey Userscript (LineSyncApp.js v28.11)              |
|                             Running in chat.line.biz                              |
|                                                                                   |
|  - Strict Protection State Schema (loadProtectionTimestamps) (SAFE-WP001-R2)       |
|  - Exact Read-Back Timestamp Reservation (recordProtectionSendAction) (SAFE-WP001)|
|  - Final Reservation Revalidation (verifyProtectionReservation) (SAFE-WP001-R2)   |
|  - Loopback-Protected Telemetry Endpoints (/account-protection/telemetry)         |
|  - Per-OA Account Protection Send Rate Guard (SAFE-WP001 R2 READY_FOR_REVIEW)     |
|  - Adaptive System-Error Backoff Schedule (30s / 60s / 120s / max 300s)           |
|  - LINE OA Directory Sync (/chats Endpoint Source) (SYNC-WP001 CLOSED / PASS)     |
|  - Multi-OA Context Isolation & Identity Fencing (OA-WP001 / R1 CLOSED / PASS)     |
|  - Single Worker Multi-Tab Lock (REL-WP001 / R1 / R2 CLOSED / PASS)               |
|  - Document-Lifetime Tab Identity Lock & Clone Defense (ensureTabIdentity)        |
|  - Fail-Closed Lease Persistence (writeAndVerifyLeaderRecord)                     |
|  - Complete Navigation Hold (navigateAsLeader: NAVIGATION_LEASE_MS = 45000)       |
|  - Atomic Pre-Send Fencing (confirmWorkerLeadershipForSend under Web Locks)       |
|  - Fail-Closed Runtime Version Gate (X-LineSync-Worker-Version: 28.11)            |
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
   - Full directory synchronization from `chat.line.biz/api/v2/bots/{botId}/chats` via `POST /api/customers/sync-batch`.
   - Granular 9-metric directory sync reporting.
   - Tag assignment, group creation, member mapping, and deletion with explicit `botId` scoping.
2. **Campaign & Queue Engine**:
   - Campaign target hygiene on `POST /api/campaign/add`: deduplicates target IDs, excludes blocked customers (`isBlocked === true`), sets `totalTargets` to `queuedCount`.
   - Multi-type campaign dispatching (`text`, `image_only`, `link_only`, `text_link`, `image_link`).
   - Hard OA queue gate via `GET /api/campaign/next` with status reporting and fail-closed runtime version gate (`X-LineSync-Worker-Version: 28.11`).
3. **Account Protection & Compliance Guard (SAFE-WP001 / R1 / R2)**:
   - Fail-closed protection state: strict schema validation, exact read-back timestamp reservations, final reservation revalidation before pointer/click/keydown events.
   - Loopback-trusted telemetry subsystem (`POST /api/account-protection/telemetry`) enforcing version, OA context header, and numeric schema validation.
   - Centralized per-OA protection gate (`enforceAccountProtectionGate`) before image confirm send click, text send button click, and Enter key fallback.
   - Internal protection defaults: `MIN_SEND_GAP_MS = 10000` (10s gap), `MAX_SEND_ACTIONS_10_MIN = 60` (rolling 10m limit), `MAX_SEND_ACTIONS_1_HOUR = 300` (rolling 1h limit).
   - Adaptive system-error backoff schedule (30s / 60s / 120s / max 300s).
4. **Telegram Notification Subsystem**:
   - Formatted HTML campaign progress and completion summary reporting via Telegram Bot API.
5. **Local Diagnostic Observability**:
   - Confirmed-write browser diagnostic event logging to `uat-logs/browser-BUG-WP001-UAT.log` via `POST /api/diagnostics/browser-event`.

---

## 5. Safety & Compliance Model

The LineSync Plus safety model operates on strict **fail-closed** principles:

- **LINE OA Account Protection & Compliance Guard (SAFE-WP001-R2 R2_READY_FOR_REVIEW)**: Enforces strict protection state schema reads, exact read-back timestamp reservations, final reservation revalidation, loopback-trusted cross-origin telemetry, per-OA rolling window send caps (10s min gap, 60/10m, 300/1h), campaign target hygiene, and adaptive error backoff.
  > ⚠️ **Notice**: SAFE-WP001 is an operational risk-reduction control. It does NOT guarantee that LINE will never restrict/suspend an OA. Internal rate thresholds are safety defaults, not official LINE API limits. Zero detection evasion techniques are included.
- **Customer Directory Sync Hard Fencing & Metric Integrity (SYNC-WP001 CLOSED / PASS)**: `POST /api/customers/sync-batch` enforces loopback origin, valid `botId` format, `botId === activeBotId`, strict User ID regex, and Master Bot PAUSED status. Worker v28.11 queries `/chats?folderType=ALL&limit=20&prioritizePinnedChat=true`.
- **Strict OA Identity Fencing (OA-WP001 / OA-WP001-R1 CLOSED / PASS)**: Terminal fallback reporting requires valid `botId` + `lineUserId` + `status: 'processing'`.
- **Single Worker Multi-Tab Lock & Clone Defense (REL-WP001 CLOSED / PASS)**: `ensureWorkerLeadership()` enforces single worker tab execution.
- **Zero-Tolerance Recipient Verification**: `verifyCurrentRecipient(expectedUserId)` enforces matching URL path and DOM attribute validation before any physical send action.
- **Fail-Closed Runtime Version Gate (OPS-WP001 CLOSED / PASS)**: `GET /api/campaign/next` rejects request with HTTP 409 Conflict if `X-LineSync-Worker-Version` header is missing or != `'28.11'`.

---

## 6. Problems Found & Work Packages

Over the course of safety hardening, 21 work packages were identified, implemented, verified, and updated:

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
13. **SYNC-WP001 — LINE OA Customer Directory Sync to DB (CLOSED / PASS)**
14. **SYNC-WP001-R1 — Metric Integrity & Fail-Closed Pagination Corrective (CLOSED / PASS)**
15. **SYNC-WP001-R2 — Dashboard Master Bot Sync Gate Corrective (CLOSED / PASS)**
16. **SYNC-WP001-R3 — Strict Dashboard Bot Status Response Validation (CLOSED / PASS)**
17. **SYNC-WP001-R4 — Confirmed Contacts Schema + LINE Nickname Mapping + Rate-Limit Guard (CLOSED / PASS)**
18. **SYNC-WP001-R5 — Full Directory Source Correction to /chats (CLOSED / PASS)**
19. **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard (NOT CLOSED)**
20. **SAFE-WP001-R1 — Fail-Closed Protection State + Truthful Dashboard Telemetry (SUPERSEDED BY R2)**
21. **SAFE-WP001-R2 — Reservation Integrity + Truthful Protection Telemetry (READY_FOR_CHATGPT_REVIEW)**

---

## 7. Operational Findings

- Protection state reading must validate array member schema strictly; dropping malformed members silently creates unverified execution states.
- Exact read-back verification of length, order, and values guarantees that state written to `localStorage` is completely intact before physical sends.
- Revalidating reservations immediately before pointer/click/keydown events prevents multi-tab race conditions from dispatching unreserved physical sends.

---

## 8. UAT Evidence

- **Safety Gate Status**: **PASS**
- **BUG-WP001**: **CLOSED / PASS**
- **BUG-WP001-UATLOG**: **CLOSED / PASS**
- **BUG-WP002**: **CLOSED / PASS**
- **SEC-WP001**: **CLOSED / PASS**
- **OPS-WP001 / OPS-WP001-R1**: **CLOSED / PASS**
- **REL-WP001 / REL-WP001-R1 / REL-WP001-R2**: **CLOSED / PASS**
- **OA-WP001 / OA-WP001-R1**: **CLOSED / PASS** (Accepted on Worker v28.5)
- **SYNC-WP001 / R1..R5**: **CLOSED / PASS** (Accepted on Worker v28.8)
- **SAFE-WP001-R2**: **READY_FOR_CHATGPT_REVIEW** (127/127 Jest unit tests PASS)

---

## 9. Known Risks & Technical Debt

### Secret Hygiene P0 Mandate (`SEC-WP001` STATUS: COMPLETED / CLOSED)
- **CRITICAL**: The repository `rebootob/line-sync-plus` is **PUBLIC**.
- **PROHIBITED**: Under no circumstances may `.env` files, API keys, passwords, database credentials, access tokens, refresh tokens, private keys, or LINE channel secrets be committed or pushed to Git.

---

## 10. Development Roadmap

- **Phase 0 — Security & Reliability Foundation**: **IN PROGRESS**
  - Safety hardening (`BUG-WP001`, `BUG-WP001-UATLOG`, `BUG-WP002`, `BUG-WP002-R1`): **COMPLETED**
  - `SEC-WP001` (Secret Hygiene): **COMPLETED / CLOSED**
  - `OPS-WP001 / R1` (Runtime Version Gate): **COMPLETED / CLOSED**
  - `REL-WP001 / R1 / R2` (Single Worker / Multi-Tab Lock): **COMPLETED / CLOSED**
  - `OA-WP001 / R1` (OA Context Isolation & Strict Identity Fencing): **COMPLETED / CLOSED**
  - `SYNC-WP001 / R1 / R2 / R3 / R4 / R5` (LINE OA Customer Directory Sync): **COMPLETED / CLOSED / PASS**
  - `SAFE-WP001 / R1 / R2` (LINE OA Account Protection & Send Compliance Guard): **SAFE-WP001-R2 READY_FOR_CHATGPT_REVIEW**
  - `REL-WP002` (Job Lease + Heartbeat): **READY / NOT STARTED / AUTHORIZATION REQUIRED**
  - `REL-WP003`: **NOT STARTED**
- **Phase 1 — Operations & Monitoring**: **NOT STARTED**
- **Phase 2 — Campaign Builder v2**: Enhanced broadcast campaign creation, template previews, and scheduled queue controls.
- **Phase 3 — Audience & Customer Intelligence**: Advanced customer segment tagging, automated display name cleanup, and activity tracking.
- **Phase 4 — Multi-OA, Governance & Admin**: Context isolation across multiple LINE Official Accounts, role permissions, and administrative controls.
- **Phase 5 — Analytics & Optimization**: Performance reporting, delivery throughput metrics, and campaign success analytics.

---

## 11. Technical Evolution

- **Script Versioning**: Evolved from v27.0 -> v28.1 -> v28.2 -> v28.3 -> v28.4 -> v28.5 -> v28.6 -> v28.7 -> v28.8 -> v28.9 -> v28.10 -> v28.11 (SAFE-WP001-R2 READY_FOR_REVIEW).
- **Architecture Maturity**: Enhanced with strict protection state schema, exact read-back timestamp reservations, final reservation revalidations, loopback-trusted telemetry endpoints, and executable unit test harnesses.

---

## 12. Immediate Decision Gate

Phase 0 SAFE-WP001-R2 is READY_FOR_CHATGPT_REVIEW.
Worker Version: 28.11 | Runtime Contract: 2 | Required Worker: 28.11
SYNC-WP001 is CLOSED / PASS. OA-WP001 is CLOSED / PASS. REL-WP001 is CLOSED / PASS.
Next Candidate: `REL-WP002 — Job Lease + Heartbeat` (READY / NOT STARTED — Project Owner authorization required).
Do NOT start `REL-WP002` automatically.
