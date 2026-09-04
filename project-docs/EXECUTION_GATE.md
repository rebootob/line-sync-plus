# EXECUTION GATE

CONTROL_VERSION: 8

TASK_ID:
P2-WP002

TITLE:
Authoritative Campaign Preview & Safe Template Reuse V2

STATUS:
AUTHORIZED_FOR_EXECUTION

CODE_BASELINE_HEAD:
aebd092ddd1d4802000a58be331de58707a5bcdb

AUTHORIZATION_CORRECTIVE:
P2-WP002-AUTH-R1

AUTHORIZATION_CORRECTIVE_RESULT:
APPLIED

AUTHORIZED_BY:
Project Owner

CONTROL_PLANE:
ChatGPT

EXECUTION_PLANE:
Antigravity

CANONICAL_BRANCH:
main

PROJECT_STATE:
PHASE_0: CLOSED / PASS
PHASE_1: CLOSED / PASS
PHASE_2: IN PROGRESS
PHASE_2_TITLE: Campaign Builder v2
P2-WP001: CLOSED / PASS
P2-WP001-R1: CLOSED / PASS
ACTIVE_WORK_PACKAGE: P2-WP002
P2-WP002: AUTHORIZED_FOR_EXECUTION
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_REVIEW

--------------------------------------------------
OBJECTIVE
--------------------------------------------------

Enhance the existing Campaign Builder. Do NOT rebuild the Campaign Builder from scratch.

Add:
1. Backend-authoritative outbound payload preview (`POST /api/campaign/preview`)
2. Two-step Preview -> Confirm Create dashboard flow (`index.html`)
3. Safe active-OA template reuse DTO (`GET /api/campaigns/templates`)
4. Safe DOM rendering for template labels and preview content
5. Stale-preview invalidation when authoring inputs change

Do not implement P2-WP003 Scheduled Queue Controls.

--------------------------------------------------
AUTHORIZED IMPLEMENTATION FILES
--------------------------------------------------

ONLY:
- src/app.controller.ts
- src/app.controller.spec.ts
- index.html

Supporting docs after implementation:
- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md

--------------------------------------------------
PROHIBITED
--------------------------------------------------

DO NOT modify:
- run/**
- LineSyncApp.js
- Worker version (remains 28.16)
- src/runtime-version.ts (Required Worker 28.16, Runtime Contract 2)
- entities/**
- DB schema
- migrations
- package*.json
- new npm dependencies
- ARM / CONFIRM
- campaign send ledger
- lease / heartbeat
- reconciliation
- recipient verification
- OA worker fencing
- SAFE account protection
- LINE DOM/send behavior
- Telegram behavior
- P2-WP003 scheduled queue controls
- analytics redesign
- broad dashboard redesign

--------------------------------------------------
A. SHARED AUTHORING / NORMALIZATION CONTRACT
--------------------------------------------------

Both POST /api/campaign/add and POST /api/campaign/preview must use the SAME authoritative normalization / validation contract. Do not maintain two independently drifting validation implementations.

Allowed message types EXACTLY:
1. text
2. text_link
3. image_only
4. image_link
5. link_only

Unknown / unsupported type: HTTP 400.

Trim textual authoring inputs before validation / normalized output.

TYPE: text
- Required: non-empty message
- Prohibited: imageUrl, linkUrl
- Result: one TEXT outbound part containing exactly normalized message content.

TYPE: text_link
- Required: non-empty message, valid linkUrl
- Prohibited: imageUrl
- Outbound: one TEXT part with semantic content EXACTLY:
message
<blank line>
🔗 ดูรายละเอียดเพิ่มเติม: linkUrl

TYPE: image_only
- Required: valid imageUrl
- Prohibited: linkUrl
- message: optional
- Outbound: one IMAGE part containing imageUrl. No text outbound part.

TYPE: image_link
- Required: valid imageUrl, non-empty message, valid linkUrl
- Outbound order EXACTLY: 1. IMAGE, 2. TEXT
- IMAGE content: imageUrl
- TEXT semantic content EXACTLY:
message
<blank line>
🔗 ดูรายละเอียดเพิ่มเติม: linkUrl

TYPE: link_only
- Required: valid linkUrl
- Prohibited: imageUrl
- message: optional
- WITHOUT message: one TEXT part containing exactly: linkUrl
- WITH message: one TEXT part with semantic content EXACTLY:
message
<blank line>
🔗 linkUrl

--------------------------------------------------
B. URL CONTRACT
--------------------------------------------------

imageUrl / linkUrl when required must:
- parse as valid URL
- protocol must be http: or https:

Allowed:
- https://example.com/...
- http://localhost:3005/api/uploads/...

Reject:
- malformed URL
- javascript:
- data:
- file:
- ftp:
- any other protocol

Do not silently repair an invalid URL.

--------------------------------------------------
C. SCHEDULE CONTRACT
--------------------------------------------------

- scheduledAt PROPERTY ABSENT: => immediate / initialStatus pending
- scheduledAt blank STRING: => immediate / initialStatus pending
- scheduledAt whitespace-only STRING: => immediate / initialStatus pending
- scheduledAt PROPERTY PRESENT with NON-STRING (number, boolean, object, array, explicit null): => HTTP 400
- Non-empty malformed datetime string: => HTTP 400
- Valid datetime <= current time: => HTTP 400
- Valid future datetime: => scheduled / initialStatus scheduled

Never coerce malformed schedule data to immediate.

--------------------------------------------------
D. AUTHORITATIVE PREVIEW ENDPOINT
--------------------------------------------------

Add during implementation:
POST /api/campaign/preview

Request authoring fields:
- botId
- name optional
- messageType
- message optional according to message type contract
- imageUrl optional according to message type contract
- linkUrl optional according to message type contract
- scheduledAt optional

Preview DOES NOT require targetIds.

OA contract:
- botId required
- botId format valid
- active OA must exist
- requested botId must equal activeBotId
- mismatch / unavailable OA => fail closed

Preview is READ-ONLY. It MUST perform ZERO:
- Campaign create/save
- CampaignJob create/save
- CampaignSendPart create/save
- Telegram notification
- physical LINE send
- Worker-state mutation

Active-OA DB lookup is allowed.

Response must provide normalized authoring truth and ordered outbound parts.
Conceptual schema:
{
  "success": true,
  "normalized": {
    "name": "...",
    "messageType": "...",
    "message": "...",
    "imageUrl": "...",
    "linkUrl": "...",
    "scheduledAt": "...",
    "initialStatus": "..."
  },
  "parts": [
    {
      "partKey": "...",
      "partOrder": 1,
      "type": "...",
      "content": "..."
    }
  ],
  "immediate": true
}

Do NOT expose: leaseToken, dispatchToken, armRequestId, customer data, targets, jobs, credentials, cookies, Telegram secrets, or other operational metadata.
Do not log authored message bodies or authored URLs for diagnostics.

--------------------------------------------------
E. SEND PART ORDER
--------------------------------------------------

Preview ordering must agree with existing getRequiredSendParts():
- text: TEXT
- text_link: TEXT
- link_only: TEXT
- image_only: IMAGE
- image_link: IMAGE -> TEXT

Do NOT modify Worker code to accomplish this. Worker remains v28.16.

--------------------------------------------------
F. TEMPLATE REUSE V2
--------------------------------------------------

Endpoint remains: GET /api/campaigns/templates?botId=...

Must preserve: valid botId, requested botId == activeBotId, strict OA repository filtering.

Do NOT return raw Campaign entities. Return safe DTO fields ONLY:
- id
- name
- messageType
- message
- imageUrl
- linkUrl
- createdAt

Do NOT return: botId, totalTargets, successCount, failedCount, status, scheduledAt, startedAt, updatedAt, jobs, targetIds, or operational metadata.

Only campaigns whose authoring CONTENT satisfies the CURRENT message contract may be offered for reuse.
Historical invalid campaigns: exclude from template result. Do NOT modify / migrate them.
Newest-first. Return at most 15 VALID templates. Implementation may read more than the latest 15 OA campaigns if needed to find up to 15 valid reusable templates.

--------------------------------------------------
G. TEMPLATE REUSE FORM RULE
--------------------------------------------------

Selecting a template copies ONLY:
- messageType
- message
- imageUrl
- linkUrl

Do NOT copy: scheduledAt, target selection, campaign status, target/success/failure counts, createdAt as editable state, or old operational state.

Template selection invalidates any previous preview.

--------------------------------------------------
H. SAFE TEMPLATE DOM RENDERING
--------------------------------------------------

Current unsafe template label interpolation through innerHTML must be removed.
Use safe DOM construction:
document.createElement('option')
option.value = ...
option.textContent = ...

Never place campaign-controlled name, message, imageUrl, or linkUrl into innerHTML.

Suggested label semantics:
[type] campaign name — created date

If name absent: use a safely truncated message fallback via textContent.

--------------------------------------------------
I. TWO-STEP PREVIEW -> CONFIRM
--------------------------------------------------

Dashboard creation flow MUST become:
Author fields -> Preview -> POST /api/campaign/preview -> render successful authoritative preview -> Confirm Create enabled -> POST /api/campaign/add

Confirm Create must be disabled before successful preview.

Successful preview must store a snapshot/fingerprint of CURRENT relevant authoring state:
- active botId
- campaign name
- messageType
- message
- imageUrl
- linkUrl
- scheduledAt

Any change invalidates preview (at minimum: campaign name edit, message type change, message edit, image URL change, local image upload result/change, link URL change, schedule change, template selection, active OA change).

When invalidated: preview is no longer valid, Confirm Create disabled, Preview required again.

Immediately before POST /api/campaign/add: recompute current authoring snapshot. If it differs from successful-preview snapshot: DO NOT POST /campaign/add, invalidate preview, require Preview again.

Do NOT add a mandatory backend preview token to /campaign/add in this WP. Existing backend compatibility remains.

--------------------------------------------------
J. PREVIEW UI
--------------------------------------------------

Enhance only existing Campaign modal. No broad dashboard redesign.
Use terminology equivalent to: "Outbound Payload Preview" / "ตัวอย่างเนื้อหาที่ระบบจะส่ง".
Do NOT call it a pixel-perfect LINE preview.

Show: message type, currently selected target count, immediate / scheduled, scheduled date/time if applicable, image when applicable, exact authoritative text payload when applicable, send-part order.

All authored textual content must render via textContent or safe DOM nodes. Never authored content via innerHTML.

For immediate campaigns display visible warning equivalent to:
"เมื่อสร้างแล้ว Campaign จะเข้า Pending Queue ทันที และถ้า Master Bot กำลังทำงาน อาจเริ่มประมวลผลได้ทันที"

Do not automatically change Master Bot state.

--------------------------------------------------
K. FAILURE BEHAVIOR
--------------------------------------------------

Preview API failure: clear/invalidate successful preview, show clear failure, Confirm Create disabled, never keep stale successful preview active.
Template API failure: clear cached templates for the request/OA, no stale templates from another OA, manual creation remains available.
OA change: clear template cache, clear selected template, invalidate preview, Confirm Create disabled.

--------------------------------------------------
L. EXACT REQUIRED TEST SCENARIOS
--------------------------------------------------

Backend:
1. preview missing/invalid botId => reject
2. preview active OA mismatch => reject
3. preview no active OA => reject
4. text exact preview
5. text_link exact text composition
6. image_only exact preview
7. image_link exact part order
8. image_link exact text composition
9. link_only without message
10. link_only with message
11. invalid message type
12. invalid content combinations
13. malformed URL
14. unsupported URL protocol
15. absent scheduledAt => pending
16. blank scheduledAt => pending
17. non-string scheduledAt => reject
18. explicit null scheduledAt => reject
19. malformed scheduledAt => reject
20. past/current scheduledAt => reject
21. future scheduledAt => scheduled
22. preview performs zero Campaign writes
23. preview performs zero Job writes
24. preview performs zero SendPart writes
25. preview performs zero Telegram sends
26. template request OA mismatch => reject
27. template repository scope is botId-specific
28. template response contains safe DTO only
29. invalid legacy content excluded
30. maximum 15 valid templates / newest-first

Frontend / static / extracted harness:
31. template options are not created from untrusted innerHTML
32. reuse copies only authoring content fields
33. reuse does not copy schedule
34. successful preview enables confirm
35. preview failure keeps confirm disabled
36. editing message invalidates preview
37. editing URL/image/type invalidates preview
38. schedule change invalidates preview
39. OA change invalidates preview
40. template selection invalidates previous preview
41. stale snapshot blocks campaign creation
42. preview parts render with safe text DOM handling
43. immediate warning exists
44. scheduled preview shows schedule
45. existing /campaign/add call remains final creation action

These scenario definitions MUST remain in EXECUTION_GATE.md. Do NOT replace them with only "tests 1-45".
Do not pre-invent final Jest count.

--------------------------------------------------
VERIFICATION & UAT
--------------------------------------------------

Implementation run must execute:
npm test -- --runInBand
npm run build
git diff --check

Report actual result counts as LOCAL REPORTED evidence unless independent GitHub CI exists.

NO LIVE LINE SEND UAT.
If dashboard runtime validation is performed: Master Bot remains PAUSED, preview only, do not execute a send-ready campaign, zero physical LINE sends.

--------------------------------------------------
PROHIBITED IMPLEMENTATION CHANGES
--------------------------------------------------

Still prohibited: run/**, LineSyncApp.js, Worker changes, runtime-version.ts, entities/**, schema / migrations, package*.json, new dependencies, ARM / CONFIRM, send ledger, lease / heartbeat, reconciliation, recipient verification, OA Worker fencing, SAFE account protection, Telegram, LINE DOM/send, P2-WP003, broad analytics/dashboard redesign.

--------------------------------------------------
PERMANENT SAFETY
--------------------------------------------------

Preserve: wrong-recipient fencing, recipient verification, active OA isolation, single-worker/multi-tab fencing, account protection, durable leases, heartbeat, pre-send lease renewal, ARM / CONFIRM send-part ledger, ambiguity quarantine, reconciliation fencing.

Never automatically resend an ambiguous physical send.
True exactly-once physical LINE delivery is not guaranteed.

Worker: 28.16 | Required Worker: 28.16 | Runtime Contract: 2

Expected implementation commit:
feat: add campaign preview and safe template reuse
