# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 02b1942e6bb28e386f969081dabdb3726f269424 (test(security): isolate config tests without changing Nest DI)
* Working Tree: Clean (SEC-WP001 documentation closure completed)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.2) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist atomic, navigation-safe browser diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Security Work Package Final Closure: SEC-WP001 (CLOSED / PASS)

* **SEC-WP001 Status**: **CLOSED / PASS**
* **SEC-WP001-R1 Status**: **CLOSED / PASS**
* **SEC-WP001-R2 Status**: **CLOSED / PASS**

### Key Verified Results:
1. Untracked secret config file `telegram-config.json` from Git (`git rm --cached`).
2. Preserved local runtime `telegram-config.json` on disk (gitignored by `.gitignore`).
3. Safe template `telegram-config.example.json` remains tracked.
4. `GET /api/telegram/settings` and `POST /api/telegram/settings` return safe shape `{ chatId, enabled, botTokenConfigured }` without exposing `botToken`.
5. Blank `botToken` supplied from Dashboard UI preserves existing stored token on backend.
6. Unit tests fully isolated using `process.cwd()` spy pointing to temporary `os.tmpdir()` config directories (`npm test` SHA256 verified 100% non-destructive).
7. Reverted production `TelegramService` constructor to zero parameters, resolving NestJS DI provider resolution cleanly.
8. Compromised historical Telegram Bot Token was revoked and rotated via `@BotFather` by Project Owner.
9. Live Telegram Test after rotation = **PASS** (Test message delivered successfully).
10. Truthful test count: **28 / 28** Jest unit tests passing cleanly.
11. Git history rewrite was NOT performed; revoked historical credential is no longer valid.

## Current State

Fully functional, hardened, and secured. Verified via `npm test` (28/28 tests passed), `npm run build` (clean NestJS build), `git diff --check` (clean exit code 0), and `git ls-files telegram-config.json` (NO OUTPUT).

## Relevant Files

- `src/telegram.service.ts`: Secret mask, getSafeConfig, saveConfig blank token preservation, zero-parameter DI constructor.
- `src/app.controller.ts`: GET /api/telegram/settings returns getSafeConfig().
- `index.html`: Telegram modal input token masking & placeholder indicator.
- `src/app.controller.spec.ts`: Isolated unit test suite covering SEC-WP001 requirements and Nest DI smoke test.
- `project-docs/ACTIVE_TASK.md`, `project-docs/CHAT_HANDOFF.md`, `project-docs/CURRENT_STATE.md`, `project-docs/PROJECT_STATUS_ROADMAP.md`.

## Next Work Package Assignment

* **Next Work Package**: `OPS-WP001 — Runtime Version Gate`
* **Status**: `READY / NOT STARTED`
* **Authorization Required**: Await explicit Project Owner authorization before starting implementation.
