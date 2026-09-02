# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* HEAD: 56141d3 (fix(safety): preserve active job when OA context unavailable BUG-WP002-R1)
* Working Tree: Clean (BUG-WP002-R1 implementation completed)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.2) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist atomic, navigation-safe browser diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Architecture

- **Backend REST API (`src/app.controller.ts`)**: Serves contact listings, group tag mappings, multi-type campaign creation, job dispatch queue with stale item recovery, master bot switch, scheduled campaign controls, Telegram settings, and trusted loopback browser diagnostic event logger (`POST /api/diagnostics/browser-event`).
- **Database Layer (`src/entities/`)**: TypeORM PostgreSQL entities for `Customer`, `CustomerGroup`, `CustomerGroupMember`, `Campaign`, and `CampaignJob` with local timezone (`TIMESTAMP WITHOUT TIME ZONE`) handling.
- **Client Userscript (`run/LineSyncApp.js` v28.2)**: Operates inside LINE OA web interface (`https://chat.line.biz/*`), featuring strict OA context validation (`isValidChatContextId`), 404 loop prevention, active job preservation when OA context is missing (`handleSafeRecovery`), full-lifecycle execution locking (`isExecutingJob`), same-job safe recovery, page-load 404 recovery guard, zero-tolerance image & text send guards, confirmed-write diagnostic spooling & flushing (`enqueueSpool`, `flushPendingDiagnostics`, `safeClearSessionStorage`), Circuit Breaker error handling, auto block exclusions, and automatic return to main chat list page.
- **Notification Subsystem (`src/telegram.service.ts`)**: Sends rich HTML campaign completion reports and connection tests to Telegram.
- **Observability Subsystem**: Appends sanitized browser diagnostic logs to `uat-logs/browser-BUG-WP001-UAT.log` with confirmed-write spooling, strict direct-socket loopback restriction (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`), and event allowlisting.

## Major Modules

1. **Customer & Group Management**: Clean name formatting, block status flagging, group creation, member mapping, and deletion.
2. **Campaign & Queue Engine**: Supports 5 message types (`text`, `image_only`, `link_only`, `text_link`, `image_link`), job dispatching (`GET /api/campaign/next`), success/fail result reporting, and local time scheduling.
3. **Safety & Recipient Verification Guard (BUG-WP001-R1)**: Full-lifecycle execution lock, Same-Job Safe Recovery, page-load 404 recovery, preserved OA context, and zero-tolerance send guards.
4. **Strict OA Context & Active Job Preservation (BUG-WP002-R1)**:
   - Validator `isValidChatContextId` enforcing `^U[0-9a-fA-F]{32}$`.
   - Active job session parameters preserved intact in `sessionStorage` when target OA context URL is unavailable.
   - `finishJob()` and `/campaign/fail` are NOT called when OA context is missing.
   - `retryCount` is NOT consumed when target OA context is unavailable.
   - Fail-closed mode until user manually navigates to a valid `chat.line.biz/U...` page.
5. **Confirmed-Write Diagnostic Persistence (BUG-WP001-UATLOG-R5)**:
   - Confirmed-write spool removal on `{ success: true }`.
   - Atomic merge-safe removal preserving concurrent events.
   - `safeClearSessionStorage()` preserving pending spool across emergency stops.
6. **Dashboard Toolbar & Filters**: Search box, Status filter (`Active`/`Blocked`), Name filter (`Named`/`Unnamed`), and Quick Selection shortcuts (`✅ เลือกเฉพาะ Active ทั้งหมด`, `🎯 เลือก 100 คนแรก`, `🧹 ล้างการเลือก`).
7. **Telegram Summary Reporter**: Formatted HTML notification sent on campaign completion.

## External Integrations

- **LINE OA Web Interface (`https://chat.line.biz/*`)**: Automated via Tampermonkey userscript (`LineSyncApp.js` v28.2).
- **Telegram Bot API (`https://api.telegram.org/bot<TOKEN>/sendMessage`)**: Automated HTML summary reports.

## Current State

Fully functional, verified via syntax check (`node --check`), Jest unit tests (`npm test` 20 passed), NestJS build compilation (`npm run build`), and `git diff --check`.

## Completed Work (BUG-WP002-R1)

- Updated `handleSafeRecovery` in `run/LineSyncApp.js` v28.2 to check `targetUrl` before consuming retries or calling `finishJob`.
- Preserved active job session parameters in `sessionStorage` when `targetUrl` is null.
- Added tests 9 & 10 in `src/app.controller.spec.ts` testing active job preservation and retry count preservation.
- Passed `node --check run/LineSyncApp.js` (Syntax OK).
- Passed `npm test` (Jest unit test suite: 20 passed).
- Passed `npm run build` (`nest build` clean exit code 0).
- Passed `git diff --check` (Zero whitespace issues).

## Unfinished Work

- None for BUG-WP002-R1.

## Known Issues / Risks

- Requires active PostgreSQL database service (default port 5433).
- Tampermonkey userscript requires active browser session logged into `https://chat.line.biz/`.

## Relevant Files

- `run/LineSyncApp.js`: Active job preservation in handleSafeRecovery.
- `src/app.controller.ts`: Direct socket remoteAddress validation, event allowlist enforcement.
- `src/app.controller.spec.ts`: Unit tests covering diagnostic logging and BUG-WP002-R1 static acceptance tests.
- `project-docs/ACTIVE_TASK.md`: Task tracking document.
- `project-docs/CHAT_HANDOFF.md`: Handoff summary document.

## Tests / Validation Evidence

- **Syntax Check**: `node --check run/LineSyncApp.js` -> Exit code 0 (Syntax clean).
- **Unit Tests**: `npm test` -> `PASS src/app.controller.spec.ts` (20 tests passed).
- **Build Verification**: `npm run build` -> Exit code 0 (`nest build` completed clean).
- **Git Diff Verification**: `git diff --check` -> Exit code 0 (Clean).

## Security Notes

- OA Context & Active Job Isolation: Active campaign jobs are preserved in `sessionStorage` when OA context is unavailable and are never failed on the backend until actual recipient retry exhaustion on a valid target URL occurs.

## Changes Made During BUG-WP002-R1

- Updated `run/LineSyncApp.js`.
- Updated `src/app.controller.spec.ts`.
- Updated `project-docs/ACTIVE_TASK.md` and `project-docs/CHAT_HANDOFF.md`.

## Exact Recommended Next Step

Await ChatGPT / Project Owner review of BUG-WP002-R1 implementation on GitHub repository `rebootob/line-sync-plus`.

## Antigravity Status

IDLE

## Active Work Package

NONE

## Authorization Required

YES — ChatGPT / Project Owner must authorize the next implementation work package.
