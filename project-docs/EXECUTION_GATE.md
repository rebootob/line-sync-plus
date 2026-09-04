# EXECUTION GATE

CONTROL_VERSION: 1

TASK_ID:
MON-WP003

TITLE:
Alerts / Incident Visibility — Dashboard V1

STATUS:
READY_FOR_CHATGPT_REVIEW

AUTHORIZED_BY:
Project Owner

CONTROL_PLANE:
ChatGPT

EXECUTION_PLANE:
Antigravity

CANONICAL_BRANCH:
main

CODE_BASELINE_HEAD:
f8ef40a422657eba8ad50be05f97026e34a18f03

BASELINE_POLICY:
NON_DOCUMENT_CODE_MUST_MATCH_CODE_BASELINE

CONTROL_UPDATE_POLICY:
CURRENT_EXPLICIT_OWNER_CONTROL_UPDATE_ONLY

OBJECTIVE:

Provide clear operator-facing incident visibility using the
already accepted read-only monitoring data from:

GET /api/ops/health
GET /api/ops/queue

MON-WP003 V1 is DASHBOARD-ONLY.

Do not create another backend monitoring endpoint unless a
proven blocker makes the V1 impossible.

--------------------------------------------------
AUTHORIZED IMPLEMENTATION SCOPE
--------------------------------------------------

Implementation file:

- index.html

Supporting docs after implementation:

- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md

PROHIBITED:

- src/**
- run/**
- package*.json
- entities/**
- database-init.service.ts
- telegram.service.ts
- schema/migrations
- Worker version changes
- Runtime Contract changes
- LINE send
- Telegram send
- lease mutation/reclaim
- reconciliation mutation
- auto recovery
- ack/snooze/retry/reset/reconcile controls

Worker remains:
28.16

Required Worker remains:
28.16

Runtime Contract remains:
2

--------------------------------------------------
DESIGN
--------------------------------------------------

Add one compact Incident Visibility section/card to the Dashboard.

It must consume the existing monitoring snapshots from
/api/ops/health and /api/ops/queue.

Prefer reusing the existing 6000ms monitoring polling.

DO NOT add a third polling loop that duplicates both monitoring API
requests every 6 seconds.

Existing health/queue UI functions may publish their latest
truthful snapshots for the Incident Visibility renderer.

Never treat a failed/unknown response as the previous known-good state.

--------------------------------------------------
INCIDENT SEVERITIES
--------------------------------------------------

Support:

CRITICAL
WARNING
UNKNOWN
INFO
CLEAR

Overall priority:

CRITICAL
> WARNING
> UNKNOWN
> INFO
> CLEAR

A known CRITICAL/WARNING must not be hidden by another UNKNOWN source.

UNKNOWN must never render green.

CLEAR is permitted ONLY when required monitoring sources are
positively available and there are no active WARNING/CRITICAL/UNKNOWN
conditions.

--------------------------------------------------
MINIMUM INCIDENT RULES
--------------------------------------------------

Use stable incident codes and deduplicate by code.

At minimum:

HEALTH_UNAVAILABLE
severity: UNKNOWN

QUEUE_UNAVAILABLE
severity: UNKNOWN

HEALTH_DEGRADED
severity: CRITICAL

QUEUE_DEGRADED
severity: CRITICAL

OA_NOT_ACTIVE
severity: WARNING

OA_MISMATCH
when health.oa.aligned === false
severity: CRITICAL

WORKER_STALE
severity: WARNING

WORKER_UNKNOWN
severity: UNKNOWN

EXPIRED_LEASE
when leases.expired > 0
severity: WARNING

MISSING_LEASE
when leases.missing > 0
severity: WARNING

RESIDUAL_LEASE
when leases.residual > 0
severity: WARNING

RECONCILE_JOB
when reconciliation.jobs > 0
severity: CRITICAL

RECONCILE_PART
when reconciliation.parts > 0
severity: CRITICAL

STALE_ARMED
when reconciliation.staleArmed > 0
severity: CRITICAL

PAUSED_RECONCILE
when reconciliation.pausedCampaigns > 0
severity: CRITICAL

QUEUE_ACTIVITY
when pending > 0 OR processing > 0 OR active leases > 0,
with no implication of anomaly
severity: INFO

Positive pending/processing/active lease values alone MUST NOT
become WARNING or CRITICAL.

--------------------------------------------------
FIRST SEEN / LAST SEEN
--------------------------------------------------

Track active incident lifecycle in dashboard-session memory only.

For each stable incident code:

- firstSeen is set when it first becomes active.
- firstSeen remains unchanged while continuously active.
- lastSeen updates whenever the incident is observed active.
- resolved incidents disappear from the active incident list.
- if the same incident later reappears after resolution,
  it receives a new firstSeen.

Do NOT persist incident history to database.

Do NOT use localStorage as authoritative operational history.

Page reload may reset First Seen / Last Seen.

The UI/documentation must not imply durable incident history.

--------------------------------------------------
TRUTHFUL UI
--------------------------------------------------

Show at least:

- Overall severity
- Active incident count
- Incident title/message
- Severity
- Current value/count where relevant
- First Seen
- Last Seen

Do not expose:

- botId
- activeBotId
- lineUserId
- customer names
- message content
- campaign message/body
- leaseToken
- leaseOwner
- dispatchToken
- dispatchOwner
- armRequestId
- reconcileReason
- cookies
- Telegram data
- credentials/secrets

No operator-action buttons in MON-WP003 V1.

--------------------------------------------------
VALIDATION
--------------------------------------------------

Because implementation is dashboard-only, do not introduce a new
test framework or dependency.

Create a temporary LOCAL validation harness outside the repository
or in the OS temporary directory.

The harness must evaluate/test the ACTUAL incident derivation logic
from index.html, not a separately rewritten copy of the rules.

A recommended approach is to place clear sentinel comments around a
pure incident-derivation function in index.html, extract that exact
function into a temporary Node VM test harness, and run fixtures.

Cover at minimum:

1. all monitoring healthy => CLEAR
2. health unavailable => UNKNOWN
3. queue unavailable => UNKNOWN
4. health degraded => CRITICAL
5. queue degraded => CRITICAL
6. OA mismatch => CRITICAL
7. worker stale => WARNING
8. worker unknown => UNKNOWN
9. expired lease => WARNING
10. missing lease => WARNING
11. residual lease => WARNING
12. reconcile job => CRITICAL
13. reconcile part => CRITICAL
14. stale armed => CRITICAL
15. paused reconcile => CRITICAL
16. queue activity alone => INFO, not WARNING
17. severity precedence CRITICAL > WARNING > UNKNOWN > INFO
18. continuously active incident keeps same firstSeen
19. lastSeen advances
20. resolved incident disappears
21. reappearing resolved incident gets new firstSeen
22. failed monitoring response cannot reuse stale known-good zero
23. no secret/PII fields are rendered

Also run:

npm test -- --runInBand

Expected existing suite baseline is 317 tests, but record the
ACTUAL result rather than hard-coding success.

All local validation must be labeled:
LOCAL REPORTED evidence

Do not claim GitHub CI unless independently present.

No Live LINE UAT.

--------------------------------------------------
AFTER IMPLEMENTATION
--------------------------------------------------

Set gate status:

READY_FOR_CHATGPT_REVIEW

Supporting docs must show:

ACTIVE_WORK_PACKAGE: MON-WP003
MON-WP001: CLOSED / PASS
MON-WP002: CLOSED / PASS
MON-WP003: READY_FOR_CHATGPT_REVIEW
PHASE_0: CLOSED / PASS
PHASE_1: IN PROGRESS
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_REVIEW

Record:

- code baseline
- exact changed files
- dashboard-only implementation
- Worker 28.16 unchanged
- Required Worker 28.16 unchanged
- Runtime Contract 2 unchanged
- zero LINE activity
- zero Telegram activity
- local focused validation result
- full test-suite actual result

Commit implementation as:

ops: add incident visibility dashboard

Push origin main.

Fetch origin.

Prove:

- HEAD
- origin/main
- HEAD == origin/main
- clean working tree
- exact changed files

STOP.

Do not close MON-WP003 yourself.
Do not close Phase 1.
Do not start Phase 2.
Do not start another work package.

--------------------------------------------------
IMPLEMENTATION & VALIDATION EVIDENCE
--------------------------------------------------

- TASK_ID: MON-WP003
- STATUS: READY_FOR_CHATGPT_REVIEW
- CODE_BASELINE_HEAD: f8ef40a422657eba8ad50be05f97026e34a18f03
- IMPLEMENTATION: Dashboard-only (`index.html`)
- Worker Version: 28.16 (UNTOUCHED)
- Required Worker Version: 28.16 (UNTOUCHED)
- Runtime Contract Version: 2 (UNTOUCHED)
- Zero LINE activity / sends performed
- Zero Telegram activity / sends performed
- Focused Validation Harness: 23/23 PASS (extracted directly from index.html between sentinels)
- Full Test Suite: 317/317 PASS (0 failures, `npm test -- --runInBand`)
- Evidence Classification: LOCAL REPORTED evidence
- CI Status: No GitHub CI / workflow runs present
- Changed implementation files: `index.html`
- Changed documentation files:
  - `project-docs/EXECUTION_GATE.md`
  - `project-docs/ACTIVE_TASK.md`
  - `project-docs/CHAT_HANDOFF.md`
  - `project-docs/CURRENT_STATE.md`
  - `project-docs/PROJECT_STATUS_ROADMAP.md`
