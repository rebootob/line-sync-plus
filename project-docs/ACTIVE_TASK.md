# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: SYNC-WP001-R3 — Strict Dashboard Bot Status Response Validation
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: Project Owner & ChatGPT Control Plane
TASK_TYPE: BOUNDED_CORRECTIVE
```

---

## 📋 Work Package Summary: SYNC-WP001-R3

### Status Summary
- **SYNC-WP001-R3**: `READY_FOR_CHATGPT_REVIEW`
- **SYNC-WP001**: `NOT CLOSED / LIVE UAT BLOCKED PENDING R3 REVIEW`
- **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
- **REL-WP001**: `CLOSED / PASS`
- **REL-WP002**: `READY / NOT STARTED`
- **REL-WP003**: `NOT STARTED`

### Version Contracts
- **Worker Version**: `28.6`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.6`

---

## 🔍 Corrective Solutions Applied (SYNC-WP001-R3)

1. **Strict Master Bot Status Schema Validation (`index.html`)**:
   - `startCustomerSync()` validates `if (!statusData || typeof statusData.enabled !== 'boolean')`.
   - If `/bot/status` returns empty `{}` or non-boolean `enabled`, throws `'Invalid Master Bot status response'`, catches cleanly, alerts `"ไม่สามารถตรวจสอบสถานะ Master Bot ได้ กรุณาลองใหม่"`, and fails closed without opening contact sync page.

2. **Regression Test Update (`src/app.controller.spec.ts`)**:
   - Updated static test #13 to verify `typeof statusData.enabled !== 'boolean'` check exists in `startCustomerSync()`.

---

## 🧪 Verification Results

- **Unit Tests**: 75 passed (`npm test`)
- **Build**: Clean (`npm run build`)
- **Diff Check**: Clean (`git diff --check`)
