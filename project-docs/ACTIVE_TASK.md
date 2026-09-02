# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: OPS-WP001 — Runtime Version Gate
STATUS: READY_NOT_STARTED
AUTHORIZED_BY: ChatGPT / Control Plane
TASK_TYPE: OPERATIONAL_HARDENING
```

---

## 📋 Completed Work Package Summary: SEC-WP001 (CLOSED / PASS)

### Security Closure Details:
- **SEC-WP001 — Secret Hygiene**: **CLOSED / PASS**
- **SEC-WP001-R1 — Test Isolation Corrective**: **CLOSED / PASS**
- **SEC-WP001-R2 — Nest DI Regression Corrective**: **CLOSED / PASS**

### Human Security Evidence & Acceptance:
1. **Compromised Telegram Token Revocation & Rotation**:
   - The compromised Telegram Bot Token exposed in historical commits was revoked and rotated via `@BotFather` by the Project Owner.
   - The new token is configured locally on disk only (`telegram-config.json`) and is **NEVER** tracked or committed to Git.
   - Telegram Settings Save succeeded cleanly.
   - Telegram Test = **PASS** (Test message delivered successfully to Telegram).
   - No token value is recorded in Git or documentation.
2. **Secret File Untracking**:
   - `telegram-config.json` untracked from Git tracking (`git rm --cached`).
   - `telegram-config.json` remains gitignored by `.gitignore` for local runtime execution.
   - Safe template `telegram-config.example.json` remains tracked.
3. **API & UI Token Shield**:
   - `GET /api/telegram/settings` and `POST /api/telegram/settings` return safe shape `{ chatId, enabled, botTokenConfigured }` without exposing `botToken`.
   - Blank/empty `botToken` supplied from UI preserves existing configured token on backend.
   - Dashboard UI modal displays safe placeholder `"Bot Token ตั้งค่าแล้ว — กรอกใหม่เฉพาะเมื่อต้องการเปลี่ยน"`.
4. **Test Isolation & Nest DI Corrective**:
   - Unit tests use `process.cwd()` spy pointing to temporary directories (`os.tmpdir()`), ensuring `npm test` never reads/writes the repository-root `telegram-config.json` (SHA256 hash verified 100% unchanged).
   - Reverted `TelegramService` constructor back to zero parameters (`constructor() { this.loadConfig(); }`), resolving NestJS DI provider resolution cleanly.
   - Truthful test count: **28 / 28** Jest unit tests passing cleanly.
5. **Git History Assessment**:
   - Historical Git rewrite was **NOT** performed. This is acceptable because the exposed credential in historical Git was revoked and is no longer valid.

---

## 🚀 Next Approved Work Package

- **Next Gate**: `OPS-WP001 — Runtime Version Gate`
- **Status**: `READY / NOT STARTED`
- **Instruction**: Do NOT start `OPS-WP001` implementation until explicitly authorized by Project Owner.
