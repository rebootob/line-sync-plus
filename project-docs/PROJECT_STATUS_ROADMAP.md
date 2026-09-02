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
|  - Strict OA Identity Fencing (OA-WP001-R1 READY_FOR_CHATGPT_REVIEW)              |
|  - Multi-OA Context Isolation & Controlled Switch (OA-WP001 READY_FOR_REVIEW)    |
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

- **Strict OA Identity Fencing (OA-WP001-R1 READY_FOR_CHATGPT_REVIEW)**: Terminal fallback reporting requires valid `botId` + `lineUserId` + `status: 'processing'`. Physical send guards in worker require valid `expectedBotId` matching current OA. Saved job recovery reads `linesync_job_botid` and calls `clearLocalActiveJobState()` if missing/invalid. Queue processor enforces `selectedJob.botId === activeBotId` and `targetCampaign.botId === activeBotId`. Group endpoints require valid `?botId=...`.
- **Single Worker Multi-Tab Lock & Clone Defense (REL-WP001 CLOSED / PASS)**: `ensureWorkerLeadership()` enforces that only ONE active worker tab claims jobs or executes DOM mutations within a browser profile/storage partition.
- **Zero-Tolerance Recipient Verification**: `verifyCurrentRecipient(expectedUserId)` enforces matching URL path (`/${botId}/chat/${expectedUserId}`) and DOM attribute validation before any text insertion or image send click.
- **Fail-Closed Runtime Version Gate (OPS-WP001 CLOSED / PASS)**: `GET /api/campaign/next` rejects request with HTTP 409 Conflict if `X-LineSync-Worker-Version` header is missing or != `'28.5'` before querying or claiming any job.
- **Full-Lifecycle Execution Lock**: `isExecutingJob` remains active across the entire job lifecycle.
- **Circuit Breaker**: Halts campaign execution automatically if 10 consecutive system errors occur.
- **Quota Limit Protection**: Detects LINE OA quota limit alerts on-screen and immediately stops campaign processing without recording system errors.
- **Blocked User Handling**: Detects blocked chat inputs and records non-error skip statuses without incrementing system error counts.

---

## 6. Problems Found & Work Packages

1. **BUG-WP001** (CLOSED / PASS)
2. **BUG-WP001-R1** (CLOSED / PASS)
3. **BUG-WP001-UATLOG** (CLOSED / PASS)
4. **BUG-WP001-UATLOG-R1** to **R5** (CLOSED / PASS)
5. **BUG-WP002 / BUG-WP002-R1** (CLOSED / PASS)
6. **SEC-WP001** (CLOSED / PASS)
7. **OPS-WP001 / OPS-WP001-R1** (CLOSED / PASS)
8. **REL-WP001 / REL-WP001-R1 / REL-WP001-R2** (CLOSED / PASS)
9. **OA-WP001** (READY_FOR_CHATGPT_REVIEW / NOT CLOSED)
10. **OA-WP001-R1** (READY_FOR_CHATGPT_REVIEW)

---

## 7. Status Summary

- **OA-WP001-R1**: `READY_FOR_CHATGPT_REVIEW`
- **OA-WP001**: `READY_FOR_CHATGPT_REVIEW` (NOT CLOSED)
- **REL-WP001**: `CLOSED / PASS`
- **REL-WP002**: `NOT STARTED`
- **REL-WP003**: `NOT STARTED`
- **Worker Version**: `28.5`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.5`
