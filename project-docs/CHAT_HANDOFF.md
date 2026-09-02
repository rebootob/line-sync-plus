# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* HEAD: Initial import commit pending
* Working Tree: Clean (untracked files configured via .gitignore)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v27.0) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, and report detailed summary reports to Telegram.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Architecture

- **Backend REST API (`src/app.controller.ts`)**: Serves contact listings, group tag mappings, multi-type campaign creation, job dispatch queue with stale item recovery, master bot switch, scheduled campaign controls, and Telegram settings.
- **Database Layer (`src/entities/`)**: TypeORM PostgreSQL entities for `Customer`, `CustomerGroup`, `CustomerGroupMember`, `Campaign`, and `CampaignJob` with local timezone (`TIMESTAMP WITHOUT TIME ZONE`) handling.
- **Client Userscript (`run/LineSyncApp.js` v27.0)**: Operates inside LINE OA web interface (`https://chat.line.biz/*`), performing automated chat inputs, image pastes, quota limit checks, Circuit Breaker error handling, auto block exclusions, and automatic return to main chat list page.
- **Notification Subsystem (`src/telegram.service.ts`)**: Sends rich HTML campaign completion reports and connection tests to Telegram.

## Major Modules

1. **Customer & Group Management**: Clean name formatting, block status flagging, group creation, member mapping, and deletion.
2. **Campaign & Queue Engine**: Supports 5 message types (`text`, `image_only`, `link_only`, `text_link`, `image_link`), job dispatching (`GET /api/campaign/next`), success/fail result reporting, and local time scheduling.
3. **Master Bot Switch & Safety**: Global bot pause/resume switch, Circuit Breaker (stops after 10 consecutive non-blocked errors), and auto-stop on quota full banner.
4. **Dashboard Toolbar & Filters**: Search box, Status filter (`Active`/`Blocked`), Name filter (`Named`/`Unnamed`), and Quick Selection shortcuts (`✅ เลือกเฉพาะ Active ทั้งหมด`, `🎯 เลือก 100 คนแรก`, `🧹 ล้างการเลือก`).
5. **Telegram Summary Reporter**: Formatted HTML notification sent on campaign completion (`completed`, `stopped_limit`, `stopped_error`, `stopped_user`) with Thai labels, duration math, and top failure reasons.

## External Integrations

- **LINE OA Web Interface (`https://chat.line.biz/*` / `https://manager.line.biz/*`)**: Automated via Tampermonkey userscript (`LineSyncApp.js`).
- **Telegram Bot API (`https://api.telegram.org/bot<TOKEN>/sendMessage`)**: Automated HTML summary reports.

## Current State

Fully functional, verified via Jest unit tests (`npm test`) and NestJS build compilation (`npm run build`).

## Completed Work

- Implemented NestJS REST APIs, PostgreSQL schema, and database initialization.
- Implemented dashboard UI (`index.html`) with toolbar, real-time filters, quick selection shortcuts, schedule manager modal, deep analytics, and Telegram setting modal.
- Implemented Tampermonkey userscript `run/LineSyncApp.js` (v27.0) with auto-return to main chat list.
- Implemented `TelegramService` with Thai message type localization.
- Performed security audit: Excluded credentials, `.env`, `telegram-config.json`, build artifacts, and uploaded media from git tracking.
- Created `telegram-config.example.json` and `.env.example`.
- Created Control Plane documentation (`START_HERE.md`, `CURRENT_STATE.md`, `ACTIVE_TASK.md`, `CHAT_HANDOFF.md`).

## Unfinished Work

- None for the current onboarding package.

## Known Issues / Risks

- Requires active PostgreSQL database service (default port 5433).
- Tampermonkey userscript requires an active browser tab logged into `https://chat.line.biz/`.

## Relevant Files

- `src/app.controller.ts`: Main API controller.
- `src/app.module.ts`: Root NestJS application module.
- `src/telegram.service.ts`: Telegram notification service.
- `src/entities/`: TypeORM entity definitions.
- `index.html`: Web dashboard UI.
- `run/LineSyncApp.js`: Tampermonkey userscript (v27.0).
- `project-docs/`: Project control documentation suite.

## Tests / Validation Evidence

- **Unit Tests**: `npm test` -> `PASS src/app.controller.spec.ts` (1 test passed).
- **Build Verification**: `npm run build` -> Exit code 0 (`nest build` completed clean).

## Security Notes

- Security Audit Completed: No secrets, passwords, API keys, tokens, or credentials are tracked in Git.
- `telegram-config.json` (containing user Telegram credentials) is added to `.gitignore`.
- `.env` files and `uploads/*` are added to `.gitignore`.

## Changes Made During Initial Handoff

- Created project-docs documentation suite (`START_HERE.md`, `CURRENT_STATE.md`, `ACTIVE_TASK.md`, `CHAT_HANDOFF.md`).
- Added `telegram-config.example.json` and `.env.example`.
- Added `uploads/.gitkeep` and removed zero-byte scratch text files.
- Configured `.gitignore` for public GitHub repository publishing.
- Prepared Git repository with canonical branch `main` and remote `https://github.com/rebootob/line-sync-plus.git`.

## Exact Recommended Next Step

Await ChatGPT / Project Owner review of GitHub repository `rebootob/line-sync-plus`.

## Antigravity Status

IDLE

## Active Work Package

NONE

## Authorization Required

YES — ChatGPT / Project Owner must authorize the next implementation work package.
