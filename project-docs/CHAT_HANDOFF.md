# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* HEAD: 91c8bfd (fix(observability): implement atomic merge-safe spool flush and safe session clear BUG-WP001-UATLOG-R4)
* Working Tree: Clean (BUG-WP001-UATLOG-R4 implementation completed)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.1) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist atomic, navigation-safe browser diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Architecture

- **Backend REST API (`src/app.controller.ts`)**: Serves contact listings, group tag mappings, multi-type campaign creation, job dispatch queue with stale item recovery, master bot switch, scheduled campaign controls, Telegram settings, and trusted loopback browser diagnostic event logger (`POST /api/diagnostics/browser-event`).
- **Database Layer (`src/entities/`)**: TypeORM PostgreSQL entities for `Customer`, `CustomerGroup`, `CustomerGroupMember`, `Campaign`, and `CampaignJob` with local timezone (`TIMESTAMP WITHOUT TIME ZONE`) handling.
- **Client Userscript (`run/LineSyncApp.js` v28.1)**: Operates inside LINE OA web interface (`https://chat.line.biz/*`), featuring full-lifecycle execution locking (`isExecutingJob`), same-job safe recovery (`handleSafeRecovery`), page-load 404 recovery guard, preserved OA account context (`getBotId`), zero-tolerance image & text send guards, atomic navigation-safe diagnostic spooling & flushing (`enqueueSpool`, `flushPendingDiagnostics`, `safeClearSessionStorage`), Circuit Breaker error handling, auto block exclusions, and automatic return to main chat list page.
- **Notification Subsystem (`src/telegram.service.ts`)**: Sends rich HTML campaign completion reports and connection tests to Telegram.
- **Observability Subsystem**: Appends sanitized browser diagnostic logs to `uat-logs/browser-BUG-WP001-UAT.log` with atomic merge-safe spooling, strict direct-socket loopback restriction (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`), and event allowlisting.

## Major Modules

1. **Customer & Group Management**: Clean name formatting, block status flagging, group creation, member mapping, and deletion.
2. **Campaign & Queue Engine**: Supports 5 message types (`text`, `image_only`, `link_only`, `text_link`, `image_link`), job dispatching (`GET /api/campaign/next`), success/fail result reporting, and local time scheduling.
3. **Safety & Recipient Verification Guard (BUG-WP001-R1)**: Full-lifecycle execution lock, Same-Job Safe Recovery, page-load 404 recovery, preserved OA context, and zero-tolerance send guards.
4. **Atomic Navigation-Safe Diagnostic Persistence (BUG-WP001-UATLOG-R4)**:
   - Atomic merge-safe spool removal: Re-reads current `sessionStorage` spool on each successful POST and splices ONLY the exact posted event by unique internal `_sqId`.
   - Preserves all concurrent diagnostic events enqueued during an HTTP request in flight.
   - Preserves pending spool and session state during emergency stops via `safeClearSessionStorage()`.
   - Bounded queue (max 50 events) with strict field allowlist and zero forbidden fields.
5. **Dashboard Toolbar & Filters**: Search box, Status filter (`Active`/`Blocked`), Name filter (`Named`/`Unnamed`), and Quick Selection shortcuts (`✅ เลือกเฉพาะ Active ทั้งหมด`, `🎯 เลือก 100 คนแรก`, `🧹 ล้างการเลือก`).
6. **Telegram Summary Reporter**: Formatted HTML notification sent on campaign completion.

## External Integrations

- **LINE OA Web Interface (`https://chat.line.biz/*` / `https://manager.line.biz/*`)**: Automated via Tampermonkey userscript (`LineSyncApp.js` v28.1).
- **Telegram Bot API (`https://api.telegram.org/bot<TOKEN>/sendMessage`)**: Automated HTML summary reports.

## Current State

Fully functional, verified via syntax check (`node --check`), Jest unit tests (`npm test` 10 passed), and NestJS build compilation (`npm run build`).

## Completed Work (BUG-WP001-UATLOG-R4)

- Implemented atomic merge-safe removal in `flushPendingDiagnostics()` using `_sqId` matching.
- Stripped `_sqId` before dispatching POST payloads to backend API.
- Implemented `safeClearSessionStorage()` preserving diagnostic spool, `tabSessionId`, and `botId`.
- Replaced all `sessionStorage.clear()` calls with `safeClearSessionStorage()`.
- Passed `node --check run/LineSyncApp.js` (Syntax OK).
- Passed `npm test` (Jest unit test suite: 10 passed).
- Passed `npm run build` (`nest build` clean exit code 0).

## Unfinished Work

- None for BUG-WP001-UATLOG-R4.

## Known Issues / Risks

- Requires active PostgreSQL database service (default port 5433).
- Tampermonkey userscript requires active browser session logged into `https://chat.line.biz/`.

## Relevant Files

- `run/LineSyncApp.js`: Atomic spool flush and safe clear implementation.
- `src/app.controller.ts`: Direct socket remoteAddress validation, event allowlist enforcement.
- `src/app.controller.spec.ts`: Unit tests covering diagnostic logging and clientTimestamp preservation.
- `project-docs/ACTIVE_TASK.md`: Task tracking document.
- `project-docs/CHAT_HANDOFF.md`: Handoff summary document.

## Tests / Validation Evidence

- **Syntax Check**: `node --check run/LineSyncApp.js` -> Exit code 0 (Syntax clean).
- **Unit Tests**: `npm test` -> `PASS src/app.controller.spec.ts` (10 tests passed).
- **Build Verification**: `npm run build` -> Exit code 0 (`nest build` completed clean).

## Security Notes

- Spool Data Isolation: `sessionStorage` spool strictly contains approved diagnostic fields (`clientTimestamp`, `event`, `scriptVersion`, `tabSessionId`, `jobId`, `expectedUserId`, `botId`, `currentPath`, `retryCount`, `reason`). Message text, image URLs, link URLs, credentials, and tokens are NEVER stored in spool.

## Changes Made During BUG-WP001-UATLOG-R4

- Updated `run/LineSyncApp.js`.
- Updated `project-docs/ACTIVE_TASK.md` and `project-docs/CHAT_HANDOFF.md`.

## Exact Recommended Next Step

Await ChatGPT / Project Owner review of BUG-WP001-UATLOG-R4 implementation on GitHub repository `rebootob/line-sync-plus`.

## Antigravity Status

IDLE

## Active Work Package

NONE

## Authorization Required

YES — ChatGPT / Project Owner must authorize the next implementation work package.
