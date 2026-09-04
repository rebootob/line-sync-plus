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

1. Current Project Owner STOP / ABORT instruction
2. `origin/main:project-docs/EXECUTION_GATE.md`
3. `project-docs/AGENT_START_HERE.md`
4. Supporting repository documents:
   - ACTIVE_TASK.md
   - CHAT_HANDOFF.md
   - CURRENT_STATE.md
   - PROJECT_STATUS_ROADMAP.md
5. Previous Antigravity chat/conversation context

Previous Antigravity conversation context is NON-AUTHORITATIVE.

If previous chat conflicts with freshly fetched EXECUTION_GATE.md,
the repository gate wins.

Never repeat or resurrect an old completed task merely because it
appears earlier in the chat.

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
