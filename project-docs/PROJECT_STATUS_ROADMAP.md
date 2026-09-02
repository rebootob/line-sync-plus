# LineSync Plus — Project Status, Incident History & Development Roadmap

This document serves as the authoritative reference for the current project status, complete incident history, safety work package iterations, system stability metrics, and future development roadmap for **LineSync Plus**.

---

## 📌 1. Project Overview & Current Architecture

**LineSync Plus** is an automated customer contact synchronization, group segmentation, and broadcast campaign management platform for **LINE Official Account (LINE OA)**.

### System Architecture
1. **Backend REST API (`src/app.controller.ts`)**:
   - NestJS REST endpoints for customer listing, group creation/member mapping, multi-type campaign creation (`text`, `image_only`, `link_only`, `text_link`, `image_link`), job dispatching queue (`GET /api/campaign/next`), Telegram summary reporting, and local-only browser diagnostic event logger (`POST /api/diagnostics/browser-event`).
2. **Database Layer (`src/entities/`)**:
   - TypeORM PostgreSQL database containing `Customer`, `CustomerGroup`, `CustomerGroupMember`, `Campaign`, and `CampaignJob`.
3. **Client Automation (`run/LineSyncApp.js` v28.2)**:
   - Tampermonkey userscript executing inside `https://chat.line.biz/*` with strict OA context validation (`isValidChatContextId`), full-lifecycle execution lock (`isExecutingJob`), same-job safe recovery (`handleSafeRecovery`), page-load 404 recovery guard, zero-tolerance recipient verification, confirmed-write navigation-safe diagnostic spooling (`enqueueSpool`, `flushPendingDiagnostics`), and emergency session preservation (`safeClearSessionStorage`).
4. **Observability Subsystem**:
   - Sanitized append-only diagnostic logger writing to `uat-logs/browser-BUG-WP001-UAT.log` with direct-socket loopback restriction (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`).

---

## 📜 2. Complete Incident & Work Package History

### BUG-WP001: LINE OA 404 / Wrong Recipient Safety Guard
- **Problem**: Navigation and context loss on LINE OA causing risks of sending messages into wrong recipient chat rooms or getting stuck on error pages.
- **Resolution**: Implemented `checkIfErrorPage()` and `verifyCurrentRecipient()`. Removed unsafe blind-click DOM iteration.

### BUG-WP001-R1: Execution Lock / Same-Job Recovery / Final Send Guard
- **Problem**: Re-entrancy race conditions during job execution and loss of active job parameters across page reloads.
- **Resolution**:
  - Extended `isExecutingJob` lock across the entire job lifecycle until terminal completion (`finishJob`).
  - Implemented `handleSafeRecovery` preserving active job parameters in `sessionStorage` across bounded retries (`MAX_RETRIES = 2`).
  - Added zero-tolerance pre-send recipient verification immediately before text and image clicks.

### BUG-WP001-UATLOG: Persistent Browser Safety Diagnostic Logging
- **Problem**: Lack of endurance UAT diagnostic logs after LINE OA reloads, 404s, or recovery events.
- **Resolution**: Created backend diagnostic endpoint `POST /api/diagnostics/browser-event` writing to `uat-logs/browser-BUG-WP001-UAT.log`.

### BUG-WP001-UATLOG-R1: Low-Noise / Local-Only Diagnostic Logging
- **Problem**: Excessive logging noise (`RECIPIENT_VERIFY_OK` per polling tick, `NAVIGATION_404` per check) and unhardened backend input.
- **Resolution**:
  - Removed inner polling loop diagnostic noise.
  - Restricted backend diagnostic endpoint to loopback IPs.
  - Added strict `ALLOWED_EVENTS` allowlist and bounded string field lengths.

### BUG-WP001-UATLOG-R2: Trusted Loopback Enforcement / Clean Test Evidence
- **Problem**: Potential IP header spoofing via `x-forwarded-for` and unit test log contamination.
- **Resolution**:
  - Restricted IP check to direct socket `remoteAddress` (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`), completely ignoring `x-forwarded-for`.
  - Spied on `fs.appendFileSync` in tests to leave real UAT log files untouched.

### BUG-WP001-UATLOG-R3: Navigation-Safe Diagnostic Persistence
- **Problem**: Fire-and-forget diagnostic requests immediately preceding `window.location.href` navigation were cancelled by browser page unloads.
- **Resolution**: Implemented synchronous `sessionStorage` spooling (`linesync_pending_diagnostics`) for navigation-critical events (`JOB_RECEIVED`, `NAVIGATE_TARGET`, `NAVIGATION_404`, `SAME_JOB_RECOVERY_START`, `SAME_JOB_RETRY`, `SAME_JOB_RETRY_EXHAUSTED`) with asynchronous page-load flushing.

### BUG-WP001-UATLOG-R4: Atomic Spool Flush / No Lost Concurrent Events
- **Problem**: `flushPendingDiagnostics` snapshot overwrites dropped events appended to `sessionStorage` while HTTP requests were in flight, and `sessionStorage.clear()` destroyed diagnostic state during emergency stops.
- **Resolution**:
  - Implemented atomic merge-safe removal using unique internal item key `_sqId`.
  - Implemented `safeClearSessionStorage()` preserving pending spool and session state across emergency stops.

### BUG-WP001-UATLOG-R5: Confirmed-Write Spool Removal
- **Problem**: `flushPendingDiagnostics` removed events from spool on any HTTP 2xx response even if backend returned `{ success: false }`.
- **Resolution**: Required `result && result.success === true` before splicing items from spool. On rejection or network failure, current and following events are retained and flush breaks immediately.

### BUG-WP002: OA Context Poisoning / Invalid BotId 404 Loop
- **Problem**: Unvalidated short IDs (e.g. `798hcuca` on 404 pages) and manager portal account IDs (`manager.line.biz/account/...`) poisoned `linesync_botid` in `sessionStorage`, resulting in 404 redirect loops.
- **Resolution**:
  - Created strict validator `isValidChatContextId` (`^U[0-9a-fA-F]{32}$`).
  - Removed `manager.line.biz` execution and account ID parsing.
  - Refactored `getBotId()` and `getOAContextUrl()` to fail closed (`null`) when no valid context exists.
  - Added `processQueue()` gate requiring valid trusted OA context before calling `/campaign/next`.

### BUG-WP002-R1: Preserve Active Job When OA Context Is Unknown
- **Problem**: `handleSafeRecovery` previously finalized jobs (`finishJob`) when `getOAContextUrl` returned `null`, prematurely failing active campaign jobs on the backend when browser context was temporarily lost.
- **Resolution**:
  - `handleSafeRecovery` checks `targetUrl` before consuming retries or calling `finishJob`.
  - If `targetUrl` is `null`, active job parameters are preserved intact in `sessionStorage`, `retryCount` is NOT incremented, and execution fails closed until user manually navigates to a valid `chat.line.biz/U.../` page.

---

## 📊 3. Verification & Stability Status

| Component | Status | Verification Command | Result |
|---|---|---|---|
| Userscript Syntax | PASS | `node --check run/LineSyncApp.js` | Exit code 0 (Clean) |
| Unit Test Suite | PASS | `npm test` | 20 / 20 tests passed |
| NestJS Compilation | PASS | `npm run build` | Exit code 0 (Clean) |
| Git Diff Hygiene | PASS | `git diff --check` | Exit code 0 (Clean) |

---

## 🗺️ 4. Future Development Roadmap

### Phase 1: High-Reliability Safety & Observability Foundation (COMPLETED)
- [x] Recipient verification & zero-tolerance pre-send guards (BUG-WP001)
- [x] Same-Job safe recovery & full-lifecycle execution lock (BUG-WP001-R1)
- [x] Local-only confirmed-write diagnostic event logging (BUG-WP001-UATLOG R1-R5)
- [x] Strict OA context validation & 404 loop prevention (BUG-WP002, BUG-WP002-R1)

### Phase 2: Endurance UAT & Operational Hardening (CURRENT)
- [ ] Multi-job endurance UAT campaign testing under active LINE OA workloads.
- [ ] Real-time browser diagnostic log visualization in Dashboard UI.
- [ ] Automatic session re-authentication alert notifications via Telegram.

### Phase 3: Advanced Campaign Analytics & Performance Optimization
- [ ] Detailed campaign click-through and read-rate analytics.
- [ ] Dynamic job batching and intelligent throttle control based on OA quota tiers.
- [ ] Webhook-based multi-agent integration for automated response handoffs.
