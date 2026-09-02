# LineSync Plus — Project Status, Incident History & Development Roadmap

## 1. Executive Summary

**LineSync Plus** is an automated customer contact synchronization, group segmentation, and broadcast campaign management platform operating against the **LINE Official Account (LINE OA)** Web Interface (`chat.line.biz`). The system consists of a NestJS backend REST API, a single-page HTML web dashboard, a PostgreSQL database, and a client-side Tampermonkey automation script (`run/LineSyncApp.js` v28.13).

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
- Protect LINE OA account via per-OA send rate limits, fail-closed protection state, exact read-back timestamp reservations, active worker telemetry heartbeats, campaign target hygiene, and adaptive error backoff (SAFE-WP001 / R1 / R2 / R3 CLOSED / PASS).
- Guarantee durable backend job leases, active heartbeat renewals, pre-send lease fencing, and stale worker fencing (REL-WP002 READY_FOR_CHATGPT_REVIEW).

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
|                     Tampermonkey Userscript (LineSyncApp.js v28.13)              |
|                             Running in chat.line.biz                              |
|                                                                                   |
|  - Durable Job Lease & Heartbeat Loop (10s) (REL-WP002 READY_FOR_REVIEW)          |
|  - Pre-Send Lease Renewal Fencing (renewJobLeaseOrThrow) (REL-WP002)             |
|  - Worker Instance Identity Header (X-LineSync-Worker-Instance) (REL-WP002)       |
|  - Active Worker Telemetry Heartbeat (processQueue) (SAFE-WP001-R3 CLOSED / PASS)  |
|  - Strict Protection State Schema (loadProtectionTimestamps) (SAFE-WP001-R2)       |
|  - Exact Read-Back Timestamp Reservation (recordProtectionSendAction) (SAFE-WP001)|
|  - Final Reservation Revalidation (verifyProtectionReservation) (SAFE-WP001-R2)   |
|  - Loopback-Protected Telemetry Endpoints (/account-protection/telemetry)         |
|  - Per-OA Account Protection Send Rate Guard (SAFE-WP001 CLOSED / PASS)           |
|  - Adaptive System-Error Backoff Schedule (30s / 60s / 120s / max 300s)           |
|  - LINE OA Directory Sync (/chats Endpoint Source) (SYNC-WP001 CLOSED / PASS)     |
|  - Multi-OA Context Isolation & Identity Fencing (OA-WP001 / R1 CLOSED / PASS)     |
|  - Single Worker Multi-Tab Lock (REL-WP001 / R1 / R2 CLOSED / PASS)               |
|  - Document-Lifetime Tab Identity Lock & Clone Defense (ensureTabIdentity)        |
|  - Fail-Closed Lease Persistence (writeAndVerifyLeaderRecord)                     |
|  - Complete Navigation Hold (navigateAsLeader: NAVIGATION_LEASE_MS = 45000)       |
|  - Atomic Pre-Send Fencing (confirmWorkerLeadershipForSend under Web Locks)       |
|  - Fail-Closed Runtime Version Gate (X-LineSync-Worker-Version: 28.13)            |
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
   - Durable job lease claim via `GET /api/campaign/next` generating UUID `leaseToken` and setting 60s lease expiry with fail-closed runtime version gate (`X-LineSync-Worker-Version: 28.13`).
   - Active lease heartbeat via `POST /api/campaign/heartbeat` (10s cadence) extending lease by 60s.
   - Pre-send lease renewal fencing (`renewJobLeaseOrThrow`) before image confirm, text send click, and Enter keydown.
   - Fenced finalization (`/campaign/success`, `/campaign/fail`, `/campaign/stop`) requiring active matching lease and clearing lease fields.
3. **Account Protection & Compliance Guard (SAFE-WP001 / R1 / R2 / R3 CLOSED / PASS)**:
   - Fail-closed protection state: strict schema validation, exact read-back timestamp reservations, final reservation revalidation before pointer/click/keydown events.
   - Active worker telemetry heartbeat in `processQueue()` polling loop (~4s cadence) keeps Dashboard Account Protection telemetry continuously fresh without fake values or timestamp mutations.
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

- **Durable Job Lease & Heartbeat Fencing (REL-WP002 READY_FOR_REVIEW)**: Atomic job claim generating UUID `leaseToken`, 60s lease expiry, 10s active heartbeat extension, pre-send lease renewal fencing, and atomic finalization fencing.
- **LINE OA Account Protection & Compliance Guard (SAFE-WP001 CLOSED / PASS)**: Enforces strict protection state schema reads, exact read-back timestamp reservations, final reservation revalidation, active worker telemetry heartbeats, loopback-trusted cross-origin telemetry, per-OA rolling window send caps (10s min gap, 60/10m, 300/1h), campaign target hygiene, and adaptive error backoff.
- **Customer Directory Sync Hard Fencing & Metric Integrity (SYNC-WP001 CLOSED / PASS)**: `POST /api/customers/sync-batch` enforces loopback origin, valid `botId` format, `botId === activeBotId`, strict User ID regex, and Master Bot PAUSED status. Worker v28.13 queries `/chats?folderType=ALL&limit=20&prioritizePinnedChat=true`.
- **Strict OA Identity Fencing (OA-WP001 / OA-WP001-R1 CLOSED / PASS)**: Terminal fallback reporting requires valid `botId` + `lineUserId` + `status: 'processing'`.
- **Single Worker Multi-Tab Lock & Clone Defense (REL-WP001 CLOSED / PASS)**: `ensureWorkerLeadership()` enforces single worker tab execution.
- **Zero-Tolerance Recipient Verification**: `verifyCurrentRecipient(expectedUserId)` enforces matching URL path and DOM attribute validation before any physical send action.
- **Fail-Closed Runtime Version Gate (OPS-WP001 CLOSED / PASS)**: `GET /api/campaign/next` rejects request with HTTP 409 Conflict if `X-LineSync-Worker-Version` header is missing or != `'28.13'`.

---

## 6. Development Roadmap

- **Phase 0 — Security & Reliability Foundation**: **IN PROGRESS**
  - Safety hardening (`BUG-WP001`, `BUG-WP001-UATLOG`, `BUG-WP002`, `BUG-WP002-R1`): **COMPLETED**
  - `SEC-WP001` (Secret Hygiene): **COMPLETED / CLOSED**
  - `OPS-WP001 / R1` (Runtime Version Gate): **COMPLETED / CLOSED**
  - `REL-WP001 / R1 / R2` (Single Worker / Multi-Tab Lock): **COMPLETED / CLOSED**
  - `OA-WP001 / R1` (OA Context Isolation & Strict Identity Fencing): **COMPLETED / CLOSED**
  - `SYNC-WP001 / R1 / R2 / R3 / R4 / R5` (LINE OA Customer Directory Sync): **COMPLETED / CLOSED / PASS**
  - `SAFE-WP001 / R1 / R2 / R3` (LINE OA Account Protection & Send Compliance Guard): **CLOSED / PASS**
  - `REL-WP002` (Job Lease + Heartbeat + Stale Worker Fencing): **READY_FOR_CHATGPT_REVIEW**
  - `REL-WP003`: **NOT STARTED**

---

## 7. Technical Evolution

- **Script Versioning**: Evolved from v27.0 -> ... -> v28.12 -> v28.13 (REL-WP002 READY_FOR_CHATGPT_REVIEW).
- **Architecture Maturity**: Enhanced with durable job leases, active heartbeat extensions, pre-send lease renewal fencing, worker instance identification, and 38 focused unit tests.

---

## 8. Immediate Decision Gate

Phase 0 REL-WP002 is READY_FOR_CHATGPT_REVIEW.
Worker Version: 28.13 | Runtime Contract: 2 | Required Worker: 28.13
Awaiting ChatGPT independent review of REL-WP002.
Do NOT perform Live LINE UAT. Do NOT start REL-WP003.
