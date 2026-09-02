# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* HEAD: Initial BUG-WP001-UATLOG-R1 commit pending
* Working Tree: Clean (BUG-WP001-UATLOG-R1 implementation completed)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.1) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist browser safety diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Architecture

- **Backend REST API (`src/app.controller.ts`)**: Serves contact listings, group tag mappings, multi-type campaign creation, job dispatch queue with stale item recovery, master bot switch, scheduled campaign controls, Telegram settings, and local-only browser diagnostic event logger (`POST /api/diagnostics/browser-event`).
- **Database Layer (`src/entities/`)**: TypeORM PostgreSQL entities for `Customer`, `CustomerGroup`, `CustomerGroupMember`, `Campaign`, and `CampaignJob` with local timezone (`TIMESTAMP WITHOUT TIME ZONE`) handling.
- **Client Userscript (`run/LineSyncApp.js` v28.1)**: Operates inside LINE OA web interface (`https://chat.line.biz/*`), featuring full-lifecycle execution locking (`isExecutingJob`), same-job safe recovery (`handleSafeRecovery`), page-load 404 recovery guard, preserved OA account context (`getBotId`), zero-tolerance image & text send guards, low-noise diagnostic event emitter (`emitDiagnostic`), Circuit Breaker error handling, auto block exclusions, and automatic return to main chat list page.
- **Notification Subsystem (`src/telegram.service.ts`)**: Sends rich HTML campaign completion reports and connection tests to Telegram.
- **Observability Subsystem**: Appends sanitized browser diagnostic logs to `uat-logs/browser-BUG-WP001-UAT.log` with local loopback IP restriction and strict event allowlisting.

## Major Modules

1. **Customer & Group Management**: Clean name formatting, block status flagging, group creation, member mapping, and deletion.
2. **Campaign & Queue Engine**: Supports 5 message types (`text`, `image_only`, `link_only`, `text_link`, `image_link`), job dispatching (`GET /api/campaign/next`), success/fail result reporting, and local time scheduling.
3. **Safety & Recipient Verification Guard (BUG-WP001-R1)**: Full-lifecycle execution lock, Same-Job Safe Recovery, page-load 404 recovery, preserved OA context, and zero-tolerance send guards.
4. **Low-Noise / Local-Only Diagnostic Logging (BUG-WP001-UATLOG-R1)**:
   - Backend endpoint `POST /api/diagnostics/browser-event` restricted to local loopback IPs (`127.0.0.1`, `::1`, `localhost`).
   - Strict `ALLOWED_EVENTS` allowlist and bounded string field lengths.
   - Removed inner-loop `RECIPIENT_VERIFY_OK` and inner `NAVIGATION_404` polling noise.
   - Fire-and-forget `emitDiagnostic` helper with stable `tabSessionId`.
5. **Dashboard Toolbar & Filters**: Search box, Status filter (`Active`/`Blocked`), Name filter (`Named`/`Unnamed`), and Quick Selection shortcuts (`✅ เลือกเฉพาะ Active ทั้งหมด`, `🎯 เลือก 100 คนแรก`, `🧹 ล้างการเลือก`).
6. **Telegram Summary Reporter**: Formatted HTML notification sent on campaign completion.

## External Integrations

- **LINE OA Web Interface (`https://chat.line.biz/*` / `https://manager.line.biz/*`)**: Automated via Tampermonkey userscript (`LineSyncApp.js` v28.1).
- **Telegram Bot API (`https://api.telegram.org/bot<TOKEN>/sendMessage`)**: Automated HTML summary reports.

## Current State

Fully functional, verified via syntax check (`node --check`), Jest unit tests (`npm test` 4 passed), and NestJS build compilation (`npm run build`).

## Completed Work (BUG-WP001-UATLOG-R1)

- Added local loopback IP restriction (`127.0.0.1`, `::1`, `localhost`) to `POST /api/diagnostics/browser-event`.
- Implemented `ALLOWED_EVENTS` allowlist and string field bounding in `src/app.controller.ts`.
- Removed inner-loop `RECIPIENT_VERIFY_OK` and `NAVIGATION_404` logging noise from `run/LineSyncApp.js`.
- Expanded unit tests in `src/app.controller.spec.ts` covering local IP check, remote rejection, query/hash removal, event allowlist, and forbidden field exclusion (4 tests passed).
- Passed `node --check run/LineSyncApp.js` (Syntax OK).
- Passed `npm test` (Jest unit test suite: 4 passed).
- Passed `npm run build` (`nest build` clean exit code 0).

## Unfinished Work

- None for BUG-WP001-UATLOG-R1.

## Known Issues / Risks

- Requires active PostgreSQL database service (default port 5433).
- Tampermonkey userscript requires active browser session logged into `https://chat.line.biz/`.

## Relevant Files

- `src/app.controller.ts`: Added local IP check, event allowlist, field bounding.
- `src/app.controller.spec.ts`: Added 3 unit tests for diagnostic logging security & sanitization.
- `run/LineSyncApp.js`: Removed inner polling loop diagnostic noise.
- `uat-logs/browser-BUG-WP001-UAT.log`: Output diagnostic log file.
- `project-docs/ACTIVE_TASK.md`: Task tracking document.
- `project-docs/CHAT_HANDOFF.md`: Handoff summary document.

## Tests / Validation Evidence

- **Syntax Check**: `node --check run/LineSyncApp.js` -> Exit code 0 (Syntax clean).
- **Unit Tests**: `npm test` -> `PASS src/app.controller.spec.ts` (4 tests passed).
- **Build Verification**: `npm run build` -> Exit code 0 (`nest build` completed clean).

## Security Notes

- Local Request Restriction: Non-local remote IPs attempting to call `/api/diagnostics/browser-event` are rejected.
- Strict Redaction: Message text/body, imageUrl, linkUrl, tokens, passwords, cookies, authorization headers, and full storage objects are explicitly excluded and sanitized.

## Changes Made During BUG-WP001-UATLOG-R1

- Updated `src/app.controller.ts` & `src/app.controller.spec.ts`.
- Updated `run/LineSyncApp.js`.
- Updated `project-docs/ACTIVE_TASK.md` and `project-docs/CHAT_HANDOFF.md`.

## Exact Recommended Next Step

Await ChatGPT / Project Owner review of BUG-WP001-UATLOG-R1 implementation on GitHub repository `rebootob/line-sync-plus`.

## Antigravity Status

IDLE

## Active Work Package

NONE

## Authorization Required

YES — ChatGPT / Project Owner must authorize the next implementation work package.
