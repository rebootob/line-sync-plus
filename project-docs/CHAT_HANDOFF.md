# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* HEAD: dc3ca6f (fix(security): implement 404 detection and exact recipient verification guards BUG-WP001)
* Working Tree: Clean (BUG-WP001 implementation completed)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.0) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, and report detailed summary reports to Telegram.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Architecture

- **Backend REST API (`src/app.controller.ts`)**: Serves contact listings, group tag mappings, multi-type campaign creation, job dispatch queue with stale item recovery, master bot switch, scheduled campaign controls, and Telegram settings.
- **Database Layer (`src/entities/`)**: TypeORM PostgreSQL entities for `Customer`, `CustomerGroup`, `CustomerGroupMember`, `Campaign`, and `CampaignJob` with local timezone (`TIMESTAMP WITHOUT TIME ZONE`) handling.
- **Client Userscript (`run/LineSyncApp.js` v28.0)**: Operates inside LINE OA web interface (`https://chat.line.biz/*`), featuring 404 detection, exact recipient verification guards, zero-tolerance pre-send verification, safe recovery with bounded retries, Circuit Breaker error handling, auto block exclusions, and automatic return to main chat list page.
- **Notification Subsystem (`src/telegram.service.ts`)**: Sends rich HTML campaign completion reports and connection tests to Telegram.

## Major Modules

1. **Customer & Group Management**: Clean name formatting, block status flagging, group creation, member mapping, and deletion.
2. **Campaign & Queue Engine**: Supports 5 message types (`text`, `image_only`, `link_only`, `text_link`, `image_link`), job dispatching (`GET /api/campaign/next`), success/fail result reporting, and local time scheduling.
3. **Safety & Recipient Verification Guard (BUG-WP001)**:
   - `checkIfErrorPage`: Detects 404 & LINE error pages via URL path & DOM error banners.
   - `verifyCurrentRecipient`: Exact regex matching on `/chat/${expectedUserId}` and DOM active data attributes.
   - Removed unsafe blind-clicking on `li, a, div, span`.
   - `handleSafeRecovery`: Bounded retries (max 2) with clean session recovery and explicit failure reasons (`NAVIGATION_404`, `RECIPIENT_MISMATCH`, `RECIPIENT_UNVERIFIED`).
   - Re-entrancy lock (`isExecutingJob`).
4. **Dashboard Toolbar & Filters**: Search box, Status filter (`Active`/`Blocked`), Name filter (`Named`/`Unnamed`), and Quick Selection shortcuts (`✅ เลือกเฉพาะ Active ทั้งหมด`, `🎯 เลือก 100 คนแรก`, `🧹 ล้างการเลือก`).
5. **Telegram Summary Reporter**: Formatted HTML notification sent on campaign completion (`completed`, `stopped_limit`, `stopped_error`, `stopped_user`) with Thai labels, duration math, and top failure reasons.

## External Integrations

- **LINE OA Web Interface (`https://chat.line.biz/*` / `https://manager.line.biz/*`)**: Automated via Tampermonkey userscript (`LineSyncApp.js` v28.0).
- **Telegram Bot API (`https://api.telegram.org/bot<TOKEN>/sendMessage`)**: Automated HTML summary reports.

## Current State

Fully functional, verified via Jest unit tests (`npm test`) and NestJS build compilation (`npm run build`).

## Completed Work (BUG-WP001)

- Added explicit 404 / LINE error-page detection (`checkIfErrorPage`).
- Added exact recipient verification guard (`verifyCurrentRecipient`) before execution, image paste, image confirm, text typing, and before clicking Send.
- Removed unsafe blind-click iteration on `li, a, div, span`.
- Implemented `handleSafeRecovery` with bounded retries (`MAX_RETRIES = 2`) and clear error reasons (`NAVIGATION_404`, `RECIPIENT_MISMATCH`, `RECIPIENT_UNVERIFIED`).
- Added re-entrancy protection lock (`isExecutingJob`).
- Updated `run/LineSyncApp.js` to v28.0.
- Updated control documentation suite (`ACTIVE_TASK.md`, `CURRENT_STATE.md`, `CHAT_HANDOFF.md`).
- Passed `npm test` (Jest unit test suite: 1 passed).
- Passed `npm run build` (`nest build` clean exit code 0).

## Unfinished Work

- None for BUG-WP001.

## Known Issues / Risks

- Requires active PostgreSQL database service (default port 5433).
- Tampermonkey userscript requires active browser session logged into `https://chat.line.biz/`.

## Relevant Files

- `run/LineSyncApp.js`: Tampermonkey userscript (v28.0).
- `project-docs/ACTIVE_TASK.md`: Task tracking document.
- `project-docs/CURRENT_STATE.md`: System state document.
- `project-docs/CHAT_HANDOFF.md`: Handoff summary document.

## Tests / Validation Evidence

- **Unit Tests**: `npm test` -> `PASS src/app.controller.spec.ts` (1 test passed).
- **Build Verification**: `npm run build` -> Exit code 0 (`nest build` completed clean).

## Security Notes

- Security Audit Maintained: No secrets, passwords, API keys, tokens, or credentials are tracked in Git.

## Changes Made During BUG-WP001

- Updated `run/LineSyncApp.js` to v28.0 with 404 detection & exact recipient verification guards.
- Updated `project-docs/ACTIVE_TASK.md`, `project-docs/CURRENT_STATE.md`, and `project-docs/CHAT_HANDOFF.md`.

## Exact Recommended Next Step

Await ChatGPT / Project Owner review of BUG-WP001 implementation on GitHub repository `rebootob/line-sync-plus`.

## Antigravity Status

IDLE

## Active Work Package

NONE

## Authorization Required

YES — ChatGPT / Project Owner must authorize the next implementation work package.
