# LineSync Plus — Project Status, Incident History & Development Roadmap

## 1. Executive Summary

**LineSync Plus** is an automated customer contact synchronization, group segmentation, and broadcast campaign management platform operating against the **LINE Official Account (LINE OA)** Web Interface (`chat.line.biz`). The system consists of a NestJS backend REST API, a single-page HTML web dashboard, a PostgreSQL database, and a client-side Tampermonkey automation script (`run/LineSyncApp.js` v28.16).

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
- Guarantee durable backend job leases, active heartbeat renewals, pre-send lease fencing, transactional finalization, and stale worker fencing (REL-WP002 CLOSED / PASS; REL-WP002-R3 CLOSED / PASS).

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
|                     Tampermonkey Userscript (LineSyncApp.js v28.16)              |
|                             Running in chat.line.biz                              |
|                                                                                   |
|  - Durable Job Lease & Active Heartbeat Loop (REL-WP002 / REL-WP002-R1)           |
|  - Pre-Send Lease Renewal Fencing (renewJobLeaseOrThrow) (REL-WP002-R1)           |
|  - Strict Worker Instance Identity Header (X-LineSync-Worker-Instance)            |
|  - Real Same-Job Finalization Retry Without Re-Send (REL-WP002-R1)                |
|  - Fail-Closed Lease Loss Router (handleJobLeaseLost) (REL-WP002-R1)              |
|  - ARM + CONFIRM State Machine & Zero Network Gap Send (REL-WP003-R2)             |
|  - Fail-Closed Ambiguity Quarantine & Operator Reconciliation (REL-WP003-R2)      |
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
|  - Fail-Closed Runtime Version Gate (X-LineSync-Worker-Version: 28.16)            |
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
   - Durable job lease claim via `GET /api/campaign/next` generating UUID `leaseToken` and setting 60s lease expiry with fail-closed runtime version gate (`X-LineSync-Worker-Version: 28.16`) and strict worker instance header (`^ts_[0-9]{10,17}_[a-z0-9]{4,32}$`).
   - Active lease heartbeat via `POST /api/campaign/heartbeat` extending lease by 60s or returning 409 Conflict `lease_lost`.
   - Pre-send lease renewal fencing (`renewJobLeaseOrThrow`) before image confirm, text send click, and Enter keydown.
   - Transactional finalization (`/campaign/success`, `/campaign/fail`, `/campaign/stop`) executing inside TypeORM transactions with atomic fencing queries; duplicate finalizations fail closed with 409 `lease_lost` and cannot double-increment counters or mutate customer block status.
   - Multipart send ledger (`campaign_send_parts` with unique `jobId, partKey`), separate queue safety pre-pass in `/campaign/next`, and hard-fenced operator crash reconciliation.
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

- **Durable Job Lease & Heartbeat Fencing (REL-WP002 / REL-WP002-R1)**: Atomic job claim generating UUID `leaseToken`, 60s lease expiry, 10s active heartbeat extension, pre-send lease renewal fencing, real same-job finalization retry without re-send, and transactional finalization fencing.
- **Multipart Send Ledger & Crash Reconciliation (REL-WP003 CLOSED / PASS)**: Ephemeral in-memory dispatchToken, zero network gap pre-send ARM, durable per-part ledger (`campaign_send_parts`), queue safety pre-pass pre-scanning expired processing jobs, full ledger validation on `/campaign/success`, and hard-fenced operator reconciliation. Never automatically resend an ambiguous physical send.
- **LINE OA Account Protection & Compliance Guard (SAFE-WP001 CLOSED / PASS)**: Enforces strict protection state schema reads, exact read-back timestamp reservations, final reservation revalidation, active worker telemetry heartbeats, loopback-trusted cross-origin telemetry, per-OA rolling window send caps (10s min gap, 60/10m, 300/1h), campaign target hygiene, and adaptive error backoff.
  > ⚠️ **Notice**: SAFE-WP001 is an operational risk-reduction control. It does NOT guarantee that LINE will never restrict/suspend an OA. Internal rate thresholds are safety defaults, not official LINE API limits. Zero detection evasion techniques are included.
- **Customer Directory Sync Hard Fencing & Metric Integrity (SYNC-WP001 CLOSED / PASS)**: `POST /api/customers/sync-batch` enforces loopback origin, valid `botId` format, `botId === activeBotId`, strict User ID regex, and Master Bot PAUSED status. Worker v28.16 queries `/chats?folderType=ALL&limit=20&prioritizePinnedChat=true`.
- **Strict OA Identity Fencing (OA-WP001 / OA-WP001-R1 CLOSED / PASS)**: Terminal fallback reporting requires valid `botId` + `lineUserId` + `status: 'processing'`.
- **Single Worker Multi-Tab Lock & Clone Defense (REL-WP001 CLOSED / PASS)**: `ensureWorkerLeadership()` enforces single worker tab execution.
- **Zero-Tolerance Recipient Verification**: `verifyCurrentRecipient(expectedUserId)` enforces matching URL path and DOM attribute validation before any physical send action.
- **Fail-Closed Runtime Version Gate (OPS-WP001 CLOSED / PASS)**: `GET /api/campaign/next` rejects request with HTTP 409 Conflict if `X-LineSync-Worker-Version` header is missing or != `'28.16'`.

---

## 6. Problems Found & Work Packages

Over the course of safety hardening, 26 work packages were identified, implemented, verified, and updated:

1. **BUG-WP001 — LINE OA 404 / Wrong Recipient Safety Guard (CLOSED)**
2. **BUG-WP001-R1 — Execution Lock / Same-Job Recovery / Final Send Guard (CLOSED)**
3. **BUG-WP001-UATLOG — Persistent Browser Safety Diagnostic Logging (CLOSED)**
4. **BUG-WP001-UATLOG-R1 — Low-Noise / Local-Only Diagnostic Logging (CLOSED)**
5. **BUG-WP002 — OA Context Poisoning / Invalid BotId 404 Loop (CLOSED)**
6. **BUG-WP002-R1 — Preserve Active Job When OA Context Is Unknown (CLOSED)**
7. **REL-WP001 / REL-WP001-R1 / REL-WP001-R2 — Single Worker / Multi-Tab Lock (CLOSED)**
8. **OA-WP001 / OA-WP001-R1 — OA Context Isolation & Strict OA Identity Fencing (CLOSED / PASS)**
9. **SYNC-WP001 — LINE OA Customer Directory Sync to DB (CLOSED / PASS)**
10. **SYNC-WP001-R1..R5 — Full Directory Source Correction to /chats (CLOSED / PASS)**
11. **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard (CLOSED / PASS)**
12. **SAFE-WP001-R1 — Fail-Closed Protection State + Truthful Dashboard Telemetry (CLOSED / PASS)**
13. **SAFE-WP001-R2 — Reservation Integrity + Truthful Protection Telemetry (CLOSED / PASS)**
14. **SAFE-WP001-R3 — Active Worker Telemetry Heartbeat (CLOSED / PASS)**
15. **REL-WP002 — Durable Job Lease + Heartbeat + Stale Worker Fencing (CLOSED / PASS)**
16. **REL-WP002-R1 — Lease Loss Semantics + Atomic Finalization + Retry + Stop Fencing (CORRECTED / SUPERSEDED)**
17. **REL-WP002-R2 — Serialize Lease Finalization and Circuit Breaker Stop (CORRECTIVE REQUIRED / SUPERSEDED)**
18. **REL-WP002-R3 — Complete R2 Corrective Exactly (CLOSED / PASS)**

---

## 7. Operational Findings & Live UAT Evidence

- **Worker v28.11 Live UAT Evidence**:
  - 2-recipient text campaign created while PAUSED contained exactly 2 jobs.
  - Worker v28.11 processed both recipients to completion; LINE messages/send were observed.
  - Campaign send completed with no recipient mismatch, no OA mismatch, and no protection-state errors.
- **Worker v28.12 Live UAT Evidence**:
  - Telemetry heartbeat verified on idle worker.
  - Dashboard telemetry displayed `Protection: ON`, `10m: 0 / 60`, `1h: 2 / 300`, `Next Send: now`, `Cooling: none`.
  - Proves 2 send reservations correctly aged out of 10m window while remaining inside 1h window. Heartbeat maintains telemetry freshness without creating fake timestamps.
- **Worker v28.15 Live UAT Evidence (REL-WP002)**:
  - 2-recipient text campaign (`"แคมเปญ 3/9/2026 8:6"`, test text `"1111"`) prepared while Master Bot was PAUSED.
  - Master Bot enabled only after preparation; Worker claimed both jobs with valid 60s durable leases.
  - Recipient verification verified prior to send; LINE send physically observed.
  - Both jobs completed successfully (`08:10:18`, `08:10:30`); 0 failed; overall campaign completed.
  - Zero visible `JOB_LEASE_LOST`, `lease_lost`, `OA_CONTEXT_MISMATCH`, or `RECIPIENT_UNVERIFIED`.
  - Post-run Account Protection: ON, 10m: 2/60, 1h: 2/300, Next Send: now, Cooling: none.
  - *Non-Destructive UAT Limitation*: These destructive scenarios were not executed on Live LINE OA to avoid unnecessary operational/send risk. They are covered by focused behavioral/unit tests. The local validation suite reported 236/236 passing; no independent GitHub CI status is available.
- **Worker v28.16 Live / Controlled UAT Evidence (REL-WP003 CLOSED / PASS)**:
  - Backend migration startup: `Database schema verified/initialized successfully` with non-destructive, fail-closed legacy normalization and authoritative unique index.
  - Normal text send: target: 1, success: 1, fail: 0, physical duplicate: 0.
  - Durable ledger verification: `job_status = success`, `partKey = text`, `part_status = dispatched`, `armedAt` and `dispatchedAt` present, `reconcileReason = null`.
  - Clean ambiguity baseline: 0 pre-existing `armed` or `reconcile_required` rows.
  - Controlled DB-only fixture: job `processing`, part `armed`, NO physical LINE send.
  - Send-plan ambiguity detection: `/campaign/send-plan` returned `success = true`, `isFullyDispatched = false`, `hasQuarantine = true`.
  - Post-quarantine DB state: `job = reconcile_required`, `part = reconcile_required`, `reconcileReason = 'quarantined_on_reload_ambiguity'`, `campaign = paused_reconcile`, job leases cleared.
  - Operator reconciliation GET: synthetic fixture visible with Master Bot PAUSED.
  - Operator resolution: `confirmed_not_sent_retry` succeeded with zero LINE sends.
  - Cleanup verification: DB inspection confirmed `CAMPAIGN FOUND = 0`, `JOB FOUND = 0`, `PARTS FOUND = 0`. Clean baseline restored.
  - Static Review: REL-WP003-R3B review PASS, local automated suite reported 271/271 PASS, no GitHub CI status checks.
  - Architectural Truth: Do NOT claim true exactly-once physical delivery; LINE Web UI remains outside database transaction boundary. Safety policy: Never automatically resend an ambiguous physical send.

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
- **SAFE-WP001 / R1..R3**: **CLOSED / PASS** (Accepted on Worker v28.12)
- **REL-WP002**: **CLOSED / PASS**
- **REL-WP002-R1**: **CORRECTED / SUPERSEDED**
- **REL-WP002-R2**: **CORRECTIVE REQUIRED / SUPERSEDED**
- **REL-WP002-R3**: **CLOSED / PASS**
- **REL-WP003**: **CLOSED / PASS**
- **REL-WP003-R1**: **CORRECTIVE REQUIRED / SUPERSEDED**
- **REL-WP003-R2**: **CORRECTIVE REQUIRED / SUPERSEDED**
- **REL-WP003-R3A**: **CORRECTIVE REQUIRED / SUPERSEDED**
- **REL-WP003-R3B**: **PASS / CLOSED**

---

## 9. Known Risks & Technical Debt

### Secret Hygiene P0 Mandate (`SEC-WP001` STATUS: COMPLETED / CLOSED)
- **CRITICAL**: The repository `rebootob/line-sync-plus` is **PUBLIC**.
- **PROHIBITED**: Under no circumstances may `.env` files, API keys, passwords, database credentials, access tokens, refresh tokens, private keys, or LINE channel secrets be committed or pushed to Git.

### Crash Safety Boundary Mandate (`REL-WP003`)
- **Core Truth**: True exactly-once delivery cannot be guaranteed across the unobservable LINE Web UI crash boundary. The LINE Web UI remains outside our database transaction boundary.
- **Operational Policy**: Never automatically resend an ambiguous physical send. Ambiguous state requires reconciliation before retry.
- **Ambiguity Quarantine**: Jobs discovering `armed` or `reconcile_required` states are quarantined to `paused_reconcile` until operator review.
- **Operator Reconciliation**: Hard-fenced via loopback UI, bot paused, active OA, job in `reconcile_required` with no active lease. Two valid actions: `confirmed_sent` and `confirmed_not_sent_retry`.

---

## 10. Development Roadmap

- **Phase 0 — Security & Reliability Foundation**: **CLOSED / PASS**
  - Safety hardening (`BUG-WP001`, `BUG-WP001-UATLOG`, `BUG-WP002`, `BUG-WP002-R1`): **COMPLETED**
  - `SEC-WP001` (Secret Hygiene): **COMPLETED / CLOSED**
  - `OPS-WP001 / R1` (Runtime Version Gate): **COMPLETED / CLOSED**
  - `REL-WP001 / R1 / R2` (Single Worker / Multi-Tab Lock): **COMPLETED / CLOSED**
  - `OA-WP001 / R1` (OA Context Isolation & Strict Identity Fencing): **COMPLETED / CLOSED**
  - `SYNC-WP001 / R1 / R2 / R3 / R4 / R5` (LINE OA Customer Directory Sync): **COMPLETED / CLOSED / PASS**
  - `SAFE-WP001 / R1 / R2 / R3` (LINE OA Account Protection & Send Compliance Guard): **CLOSED / PASS**
  - `REL-WP002` (Job Lease + Heartbeat + Stale Worker Fencing): **CLOSED / PASS**
  - `REL-WP002-R1` (Lease Loss Semantics + Atomic Finalization + Retry + Stop Fencing): **CORRECTED / SUPERSEDED**
  - `REL-WP002-R2` (Serialize Lease Finalization and Circuit Breaker Stop): **CORRECTIVE REQUIRED / SUPERSEDED**
  - `REL-WP002-R3` (Complete R2 Corrective Exactly): **CLOSED / PASS**
  - `REL-WP003 — Durable Send-Part Ledger + Multipart Crash Safety`: **CLOSED / PASS**
  - `REL-WP003-R1 — Critical Crash-Safety Corrective`: **CORRECTIVE REQUIRED / SUPERSEDED**
  - `REL-WP003-R2 — Final Crash-Safety Corrective`: **CORRECTIVE REQUIRED / SUPERSEDED**
  - `REL-WP003-R3A — Backend Final Fencing Only`: **CORRECTIVE REQUIRED / SUPERSEDED**
  - `REL-WP003-R3B — Queue Prepass & Fail-Closed Ledger Migration`: **PASS / CLOSED**
- **Phase 1 — Operations & Monitoring**: **CLOSED / PASS**
  - `MON-WP001 — Operational Health & Readiness`: **CLOSED / PASS**
  - `MON-WP001-R1 — Truthful Health State Corrective`: **CLOSED / PASS**
  - `MON-WP002 — Queue / Lease / Reconciliation Monitoring`: **CLOSED / PASS**
  - `MON-WP003 — Alerts / Incident Visibility`: **CLOSED / PASS**
  - *Backup / Recovery / Retention*: **DEFERRED / NOT REQUIRED FOR PHASE 1 CLOSURE** (OPS-WP002 not authorized)
- **Phase 2 — Campaign Builder v2**: **IN PROGRESS**
  - `P2-WP001 — Campaign Authoring Contract & OA Isolation`: **CLOSED / PASS**
  - `P2-WP001-R1 — Fail-Closed scheduledAt Type Validation Corrective`: **CLOSED / PASS**
  - `P2-WP002 — Authoritative Campaign Preview & Safe Template Reuse V2`: **CLOSED / PASS**
  - `P2-WP002-R1 — Stale Preview Race & OA Template Cache Fencing`: **SUPERSEDED_BY_R2**
  - `P2-WP002-R2 — Non-Destructive Stale Response Discard`: **CLOSED / PASS**
  - `P2-WP002-CLOSE — P2-WP002 Final Acceptance & Evidence Sync`: **CLOSED_PASS**
  - `P2-WP003 — Scheduled Queue Controls V2`: **PENDING_CORRECTIVE_ACCEPTANCE**
  - `P2-WP003-R1 — Operator Stop Semantics + Scheduled Race & Validation Corrective`: **SUPERSEDED_BY_R2**
  - `P2-WP003-R2 — Active OA Runtime Fix + Behavioral Proof`: **READY_FOR_CHATGPT_REVIEW**
  - Enhanced broadcast campaign creation, template previews, and scheduled queue controls.
- **Phase 3 — Audience & Customer Intelligence**: Advanced customer segment tagging, automated display name cleanup, and activity tracking.
- **Phase 4 — Multi-OA, Governance & Admin**: Context isolation across multiple LINE Official Accounts, role permissions, and administrative controls.
- **Phase 5 — Analytics & Optimization**: Performance reporting, delivery throughput metrics, and campaign success analytics.

---

## 11. Technical Evolution

- **Script Versioning**: Evolved from v27.0 -> ... -> v28.12 -> v28.13 -> v28.14 -> v28.15 -> v28.16 (REL-WP003 CLOSED / PASS).
- **Architecture Maturity**: Enhanced with durable job leases, active heartbeat extensions, pre-send lease renewal fencing, worker instance identification, transactional finalization with pessimistic row locking, circuit breaker inside markFail, ARM+CONFIRM send-part ledger (`campaign_send_parts`), zero network gap physical dispatch, ambiguity quarantine, queue pre-pass reconciliation, operator reconciliation dashboard UI, loopback-only Operational Health monitoring endpoint (`GET /api/ops/health`), loopback-only Queue / Lease / Reconciliation monitoring endpoint (`GET /api/ops/queue`), dashboard-only Incident Visibility card (`index.html`) with in-memory session lifecycle, authoritative campaign authoring contract, authoritative campaign preview API (`POST /api/campaign/preview`), safe template reuse DTO and content-only copy, non-destructive stale preview discard, OA template cache fencing, operator stop semantics fix, monotonic OA identity epoch fencing, strict local datetime validation, and 499 passing local unit tests.

---

## 12. Immediate Decision Gate

Phase 0 Foundation is **CLOSED / PASS**.
Phase 1 (Operations & Monitoring) is **CLOSED / PASS**.
Phase 2 (Campaign Builder v2) is **IN PROGRESS**.
P2-WP001 is **CLOSED / PASS** (Accepted Final HEAD: `37b078de425e2fd3267652e142d76959f408c701`).
P2-WP001-R1 is **CLOSED / PASS**.
P2-WP002 is **CLOSED / PASS** (Accepted Final Code HEAD: `b6103e9c322ff257dcfda475217186e740e4893a`).
P2-WP002-R1 is **SUPERSEDED_BY_R2**.
P2-WP002-R2 is **CLOSED / PASS**.
P2-WP002-CLOSE is **CLOSED_PASS**.
P2-WP003 is **PENDING_CORRECTIVE_ACCEPTANCE**.
P2-WP003-R1 is **SUPERSEDED_BY_R2**.
P2-WP003-R2 is **READY_FOR_CHATGPT_REVIEW** (Code Baseline HEAD: `06020bf0adbb072ef067e143f2924e154fc6609c`).
Active Work Package: **P2-WP003-R2**.
Status: **READY_FOR_CHATGPT_REVIEW**.
Next Candidate: **NONE** (Status: **PENDING_CORRECTIVE_REVIEW**).
Worker Version: 28.16 | Runtime Contract: 2 | Required Worker: 28.16
Policy: Never automatically resend an ambiguous physical send.
Corrective implementation complete for P2-WP003-R2 (Active OA Runtime Fix + Behavioral Proof). All 14 mandatory R2 behavioral test scenarios implemented and passing (502/502 total tests PASS). Awaiting ChatGPT review and approval.
