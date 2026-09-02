# CHAT HANDOFF

## Repository

* Repository: c:\Users\allda\Desktop\Dev\git\line-sync-plus
* Branch: master
* HEAD: (Initial commit pending)
* Working tree: Untracked project files ready for initial commit

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer management and message broadcasting system. It combines a NestJS backend REST API (with PostgreSQL database and TypeORM) for managing customer contacts, customer groups, and broadcast campaigns with a client-side Tampermonkey userscript (`LineSyncApp.js`) that runs inside LINE OA web (`chat.line.biz`) to send messages, manage quotas, handle blocks/errors safely, and report completion status to Telegram.

## Architecture

- **Backend Framework**: NestJS (TypeScript, TypeORM, PostgreSQL)
- **Database Schema**:
  - `Customer`: Line User IDs, display names, block status, block reasons
  - `CustomerGroup` & `CustomerGroupMember`: Group definitions and target mappings
  - `Campaign`: Campaign metadata, type, target count, success/fail counts, scheduled time (`scheduledAt`), start time (`startedAt`), status (`pending`, `processing`, `paused`, `completed`, `stopped_limit`, `stopped_error`, `stopped_user`, `failed`)
  - `CampaignJob`: Individual queue items per customer per campaign
- **Frontend Dashboard**: Single-page web dashboard (`index.html`) providing customer management, group tagging, multi-type campaign creation, schedule management modal, real-time filters, deep analytics, and Telegram notification configuration.
- **Client Automation**: Tampermonkey userscript (`run/LineSyncApp.js` v27.0) executing DOM manipulation & React synthetic events inside `chat.line.biz`, featuring Circuit Breaker safety, Quota detection, auto block exclusion, and automatic return to main chat list view.
- **Notification Subsystem**: `TelegramService` (`src/telegram.service.ts`) sending rich HTML campaign completion reports and connection test messages via Telegram Bot API.

## Current State

The system is fully functional and passes NestJS builds and Jest unit tests. Key features implemented and verified:
- PostgreSQL database integration via TypeORM
- Customer listing, cleaning display names, block status detection
- Customer group creation, assignment, and deletion
- Campaign creation (text, image, link, text+link, image+link)
- Campaign scheduling with local timezone handling (`TIMESTAMP WITHOUT TIME ZONE`)
- Circuit breaker (10 consecutive non-blocked errors trigger emergency stop)
- Automatic exclusion of blocked users from error count
- Master bot pause/resume switch API and UI control
- Multi-schedule queue modal with pause/hold/resume/reschedule controls
- Advanced main customer table filters (Status: Active/Blocked; Name: Named/Unnamed) and quick selection actions
- Tampermonkey v27.0 with auto-return to main chat list page after sending or queue completion
- Telegram completion summary report with Thai message type labels and icons

## Completed Work

- Implemented NestJS backend REST controllers, TypeORM entities, and migration services
- Implemented dashboard UI (`index.html`) with toolbar, modals, analytics, and schedule manager
- Implemented Tampermonkey userscript `run/LineSyncApp.js` (v27.0)
- Implemented Telegram notification integration (`TelegramService`) with test endpoint and configuration API
- Added Thai language localization for campaign message types across UI, modals, and Telegram reports
- Passed `npm test` (Jest unit test suite: 1 passed)
- Passed `npm run build` (`nest build`)

## Active / Unfinished Work

- Initial Git commit onboarding and handoff verification.

## Relevant Files

- `src/app.controller.ts`: NestJS API controller endpoints for customers, groups, campaigns, bot status, and Telegram.
- `src/app.module.ts`: NestJS application module definitions.
- `src/telegram.service.ts`: Telegram notification service.
- `src/entities/campaign.entity.ts`: Campaign TypeORM entity.
- `src/entities/campaign-job.entity.ts`: Campaign job queue item entity.
- `src/customer.entity.ts`: Customer entity.
- `src/database-init.service.ts`: Database initialization and schema migration service.
- `index.html`: Dashboard UI.
- `run/LineSyncApp.js`: Tampermonkey automation script (v27.0).
- `src/app.controller.spec.ts`: Unit test suite.
- `package.json`: Project dependencies and npm scripts.

## Tests / Evidence

- `npm test`: Executed Jest test suite. Output: `PASS src/app.controller.spec.ts` (1 test passed).
- `npm run build`: Executed `nest build`. Output: Exit code 0 (Build clean).

## Risks / Issues

- PostgreSQL connection requires running PostgreSQL server instance on port 5433 with credentials specified in `AppModule` / environment variables.
- Tampermonkey userscript requires active browser session on `https://chat.line.biz/` for executing campaign jobs.

## Changes Since Previous Handoff

- Initial repository discovery, documentation, and handoff file creation under `project-docs/CHAT_HANDOFF.md`.

## Exact Next Step

Commit initial codebase and `project-docs/CHAT_HANDOFF.md` to `master` branch and hand off to ChatGPT for review.

## Antigravity Status

IDLE

## Authorization Required

Project Owner / Control Plane authorization required before performing git push or initiating further feature implementations.
