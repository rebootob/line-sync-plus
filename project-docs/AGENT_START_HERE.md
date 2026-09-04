# AGENT START HERE — Antigravity Execution Contract

## Purpose

This is the permanent startup contract for Antigravity in
`rebootob/line-sync-plus`.

Antigravity = bounded Execution Plane.
ChatGPT = Control Plane / Project Lead / Architect / Independent Reviewer.
Project Owner = final human authority.

The purpose is to prevent stale chat context or stale local state from
causing a previously completed task to run again.

## Authority Order

For execution authority:

1. Current Project Owner STOP / ABORT
2. Current explicit Project Owner CONTROL_UPDATE_AUTHORIZED instruction
3. `origin/main:project-docs/EXECUTION_GATE.md`
4. `project-docs/AGENT_START_HERE.md`
5. Supporting repository docs:
   - ACTIVE_TASK.md
   - CHAT_HANDOFF.md
   - CURRENT_STATE.md
   - PROJECT_STATUS_ROADMAP.md
6. Previous Antigravity conversation context

Previous Antigravity conversation context is NON-AUTHORITATIVE.

If previous chat conflicts with freshly fetched EXECUTION_GATE.md,
the repository gate wins.

Never repeat or resurrect an old completed task merely because it
appears earlier in the chat.

## Control Update Lifecycle

CONTROL_UPDATE_AUTHORIZED is valid ONLY when explicitly present
in the CURRENT user request.

Never reuse an old control-update instruction from previous chat.

A valid CONTROL_UPDATE_AUTHORIZED request must include:

- EXPECTED_ORIGIN_HEAD
- NEW_TASK_ID
- exact control-document scope

Before control update:

- `git status --short` must be clean
- `git fetch origin`
- HEAD == origin/main
- origin/main == EXPECTED_ORIGIN_HEAD

If any fail:
STOP.

CONTROL UPDATE mode permits control-document changes only.

No implementation.
No source changes.
No Worker changes.
No LINE activity.

After control update:
- commit
- push origin main
- fetch origin
- prove HEAD == origin/main
- prove working tree clean
- STOP.

Do NOT execute the newly installed implementation gate in the same run.

Lifecycle must be:

CONTROL UPDATE
→ STOP
→ fresh new run
→ EXECUTION GATE
→ implementation
→ READY_FOR_CHATGPT_REVIEW
→ STOP

## Code Baseline Drift Guard

Before implementation Antigravity must read CODE_BASELINE_HEAD
from EXECUTION_GATE.md.

Rules:

- CODE_BASELINE_HEAD is mandatory.
- Documentation-only commits under project-docs/ after that baseline
  are allowed.
- Compare CODE_BASELINE_HEAD against current HEAD.
- If ANY non-project-docs file changed between CODE_BASELINE_HEAD
  and current HEAD before implementation begins:
  STOP with CODE_BASELINE_DRIFT.
- Do not silently adapt.
- Do not rebase/reset/merge around the drift.
- Require a new Control Plane / Owner gate.

For current MON-WP002 preserve:

CODE_BASELINE_HEAD:
74359ed58c3a02dd574a78dce7f2330632e28c5b

The CTRL-WP001 documentation commits above that baseline are allowed.

## Supporting Doc Precedence

ACTIVE_TASK.md, CHAT_HANDOFF.md, CURRENT_STATE.md and
PROJECT_STATUS_ROADMAP.md may temporarily lag during authorization
transitions.

For EXECUTION AUTHORITY:
EXECUTION_GATE.md wins.

Do not infer executable authority from stale supporting docs.

Supporting docs must be synchronized during/after implementation
when EXECUTION_GATE permits them.

## Mandatory Startup — Every Run

Before analyzing or modifying anything:

1. `git status --short`

If dirty before the authorized task begins:
STOP.
Do not discard unknown work.

2. `git fetch origin`

3. Use canonical branch:
`main`

4. Fast-forward only.
Never force-reset shared work.
Never rewrite history.

5. Resolve:
- local HEAD
- origin/main

Require:
HEAD == origin/main

before implementation begins.

6. Read from the freshly synchronized repository in this exact order:

- project-docs/AGENT_START_HERE.md
- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- only directly relevant files named by EXECUTION_GATE.md

7. Verify Code Baseline Drift Guard:
Compare CODE_BASELINE_HEAD against current HEAD.
If ANY non-project-docs file changed between CODE_BASELINE_HEAD
and current HEAD before implementation begins:
STOP with CODE_BASELINE_DRIFT.

Do not execute an old prompt before completing this startup.

## Executable Gate States

Execution is permitted ONLY when EXECUTION_GATE.md says:

- AUTHORIZED_FOR_EXECUTION
or
- CORRECTIVE_AUTHORIZED

These states are NOT executable:

- STANDBY
- AWAITING_OWNER_AUTHORIZATION
- READY_FOR_CHATGPT_REVIEW
- CLOSED_PASS
- BLOCKED

If gate state is non-executable:
STOP.

## Scope

Modify ONLY files explicitly authorized by EXECUTION_GATE.md.

If another file appears necessary:
STOP and report why.
Do not expand scope yourself.

## Permanent Safety Invariants

Preserve all accepted LineSync Plus safety behavior.

Especially:

- Never claim true exactly-once physical LINE delivery.
- Never automatically resend an ambiguous physical send.
- Preserve wrong-recipient fencing.
- Preserve recipient verification.
- Preserve OA isolation.
- Preserve single-worker / multi-tab fencing.
- Preserve SAFE account protection.
- Preserve durable lease / heartbeat / pre-send renewal.
- Preserve ARM / CONFIRM send-part ledger.
- Preserve reconciliation fencing.
- Never expose secrets, credentials, tokens, cookies, PII,
  LINE chat content, or message bodies.
- Repository is PUBLIC.
- No Live LINE send/UAT unless EXECUTION_GATE explicitly authorizes it.

## Low-Credit Rule

Do only the current gate.

No broad codebase archaeology.
No speculative refactor.
No unrelated cleanup.
No dependency upgrade.
No optional redesign.

Use focused inspection and focused tests.

## Before Push

Before push:

- run required tests
- run `git diff --check`
- inspect `git status --short`
- verify exact changed files
- verify prohibited files unchanged
- `git fetch origin` again

If origin/main moved during execution:
STOP before push.
Do not merge or overwrite implicitly.

## Completion

When the authorized implementation is complete:

- update EXECUTION_GATE.md status to READY_FOR_CHATGPT_REVIEW
- record required local test evidence
- update supporting docs only when gate permits
- commit
- push origin main
- fetch origin
- prove HEAD == origin/main
- prove working tree clean
- report exact changed files
- STOP

Do not self-approve.
Do not mark a WP CLOSED/PASS yourself.
Do not auto-start the next WP.

ChatGPT performs independent review.

## Normal Future Prompt

After this bootstrap, the normal operator prompt is only:

Fresh-fetch origin/main.
Read project-docs/AGENT_START_HERE.md first,
then project-docs/EXECUTION_GATE.md.
Execute only the currently authorized gate exactly.
Repository truth overrides previous chat context.
Stop after commit/push/evidence.
Do not start the next task.
