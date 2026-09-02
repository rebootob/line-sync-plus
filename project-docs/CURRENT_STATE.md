# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-02 (Post SEC-WP001 Secret Hygiene Final Closure)

---

## 🏛️ System Architecture Overview

```
                      +-----------------------------+
                      |   Single Page Dashboard     |
                      |        (index.html)         |
                      +--------------+--------------+
                                     |
                                REST API
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
```

---

## 🔒 Security & Secret Hygiene (SEC-WP001 STATUS: CLOSED / PASS)

- **Untracked Secret File**: `telegram-config.json` removed from Git tracking (`git rm --cached`), gitignored by `.gitignore`, local runtime file preserved on disk.
- **Safe Template**: `telegram-config.example.json` remains tracked without real credentials.
- **API Token Shield**: `GET /api/telegram/settings` and `POST /api/telegram/settings` return `{ chatId, enabled, botTokenConfigured }` without exposing `botToken`.
- **Blank Token Preservation**: Saving settings with empty `botToken` from UI preserves existing stored token on backend.
- **Dashboard UI Protection**: `botToken` input is never preloaded. Displays placeholder `"Bot Token ตั้งค่าแล้ว — กรอกใหม่เฉพาะเมื่อต้องการเปลี่ยน"` when token is configured.
- **Credential Rotation**: Compromised historical token was revoked and rotated via `@BotFather` by Project Owner. Telegram live test after rotation = **PASS**.
- **Test Isolation & Nest DI**: `npm test` verified 100% non-destructive to real local `telegram-config.json`. Production `TelegramService` constructor has 0 parameters for clean NestJS DI resolution. Truthful test count: **28 / 28** passed.

---

## ✅ What Currently Works (Confirmed Working & Tested)

### 1. Database & Entities (`PostgreSQL` / `TypeORM`)
- Schema synchronization & migrations for `Customer`, `CustomerGroup`, `CustomerGroupMember`, `Campaign`, and `CampaignJob`.
- Timezone-safe local timestamp handling using `TIMESTAMP WITHOUT TIME ZONE` and epoch millisecond comparison (`Date.now()`).

### 2. NestJS REST API (`src/app.controller.ts`)
- REST API endpoints for customer list, grouping, multi-type campaign creation, job dispatch queue (`GET /api/campaign/next`), Telegram setting APIs (secure shape), and trusted loopback browser diagnostic event logger (`POST /api/diagnostics/browser-event`).

### 3. Web Dashboard (`index.html`)
- Interactive dashboard UI with toolbar search, status/name filters, quick selection shortcuts (`✅ เลือกเฉพาะ Active ทั้งหมด`, `🎯 เลือก 100 คนแรก`, `🧹 ล้างการเลือก`), schedule management, deep analytics, and secure Telegram setting modal.

### 4. Client Automation Userscript (`run/LineSyncApp.js` v28.2)
- Strict OA context validation (`isValidChatContextId` testing `/^U[0-9a-fA-F]{32}$/`).
- Fail-closed context navigation (`getOAContextUrl` returns `null` when context is missing/invalid).
- Active job preservation during missing context (`handleSafeRecovery` preserves session parameters without calling `finishJob` or incrementing `retryCount`).
- Quota limit auto-stop detection (`checkQuotaLimitExceeded`).
- Circuit Breaker safety: Emergency stop when encountering 10 consecutive non-blocked errors.
- Blocked user exclusion: `isBlocked = true` users do not increment the consecutive error counter.
- **Exact Recipient Verification Guard (`verifyCurrentRecipient`)**: Verifies recipient prior to execution and send click.
- **Confirmed-Write Diagnostic Spooling (`enqueueSpool`, `flushPendingDiagnostics`)**: Navigation-safe diagnostic event persistence.

---

## 🚀 Next Approved Work Package

- **Next Work Package**: `OPS-WP001 — Runtime Version Gate`
- **Status**: `READY / NOT STARTED`
