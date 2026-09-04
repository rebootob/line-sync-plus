# EXECUTION GATE

CONTROL_VERSION: 5

TASK_ID:
P2-WP001-R1

TITLE:
Fail-Closed scheduledAt Type Validation

STATUS:
CORRECTIVE_AUTHORIZED

CODE_BASELINE_HEAD:
f8b18700ac51120d42ac717514a659a2ccb97e09

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
P2-WP001: CORRECTIVE_REQUIRED
ACTIVE_WORK_PACKAGE: P2-WP001-R1
P2-WP001-R1: CORRECTIVE_AUTHORIZED
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_CORRECTIVE_REVIEW

--------------------------------------------------
OBJECTIVE
--------------------------------------------------

Harden POST /api/campaign/add scheduledAt type validation to fail closed
when scheduledAt is present with a non-string value (such as number, boolean,
object, array, or explicit null), preventing silent fallback to an immediate send.

--------------------------------------------------
AUTHORIZED IMPLEMENTATION FILES
--------------------------------------------------

- src/app.controller.ts
- src/app.controller.spec.ts

Supporting docs after implementation:

- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md

Explicitly DO NOT modify index.html.

--------------------------------------------------
PROHIBITED
--------------------------------------------------

- index.html
- run/**
- Worker changes
- runtime-version.ts changes
- entities/**
- DB schema/migrations
- campaign send-plan changes
- ARM/CONFIRM changes
- send ledger changes
- lease/reconciliation behavior changes
- LINE DOM/send behavior
- Telegram behavior
- any non-authorized file

Worker remains:
28.16

Required Worker remains:
28.16

Runtime Contract remains:
2

--------------------------------------------------
REQUIRED CORRECTIVE CONTRACT
--------------------------------------------------

For POST /api/campaign/add:

A) scheduledAt PROPERTY ABSENT
=> immediate/pending campaign allowed.

B) scheduledAt == "" or whitespace-only STRING
=> immediate/pending campaign allowed.

C) scheduledAt PROPERTY PRESENT with NON-STRING value
=> HTTP 400 / fail closed.
Includes at minimum:
- number
- boolean
- object
- array
- null

D) scheduledAt is non-empty STRING but invalid datetime
=> HTTP 400.

E) scheduledAt is valid but <= current time
=> HTTP 400.

F) scheduledAt is valid future datetime
=> campaign status scheduled.

Do not stringify or coerce non-string values.
Do not silently fall back to pending.
Do not change frontend behavior.

--------------------------------------------------
TESTS
--------------------------------------------------

Add focused Jest coverage at minimum:

1. scheduledAt property absent => pending accepted
2. blank string => pending accepted
3. whitespace string => pending accepted
4. number => HTTP 400
5. boolean => HTTP 400
6. object => HTTP 400
7. array => HTTP 400
8. explicit null => HTTP 400
9. malformed non-empty string => HTTP 400
10. past/current valid datetime => HTTP 400
11. future valid datetime => scheduled accepted

Also preserve all existing P2-WP001 tests.

Run:

npm test -- --runInBand
npm run build
git diff --check

Record ACTUAL results as LOCAL REPORTED evidence.

--------------------------------------------------
UAT
--------------------------------------------------

NO LIVE LINE SEND UAT required for P2-WP001-R1.

--------------------------------------------------
COMPLETION STATE
--------------------------------------------------

After implementation:

P2-WP001-R1:
READY_FOR_CHATGPT_REVIEW

P2-WP001:
PENDING_CORRECTIVE_ACCEPTANCE

PHASE_2:
IN PROGRESS

ACTIVE_WORK_PACKAGE:
P2-WP001-R1

NEXT_CANDIDATE:
NONE

Worker:
28.16

Required Worker:
28.16

Runtime Contract:
2

Commit implementation as:

fix: fail closed on invalid scheduledAt types

Push origin main.
Fetch origin.

Prove:

- HEAD
- origin/main
- HEAD == origin/main
- clean working tree
- exact changed-file list

STOP.

Do not close P2-WP001 or P2-WP001-R1 yourself.
Do not start P2-WP002.
Do not perform Live LINE sends.
