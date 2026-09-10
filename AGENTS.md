# LineSync Plus — Agent Entry Point

GitHub repository truth is authoritative.

## Authority
- Owner = final human authority.
- ChatGPT = Control Plane / Project Lead / Architect / Independent Reviewer.
- Execution agents act only within explicitly authorized scope.

## Mandatory Startup
Before status, review, planning, or execution:

1. Fresh-fetch canonical `main`.
2. Read `project-docs/START_HERE.md`.
3. Follow the repository-defined reading order from that document.
4. Read `project-docs/ACTIVE_TASK.md` before any execution decision.

## Safety
- Do not infer authorization from a future task or roadmap.
- Do not implement when `AUTHORIZE_EXECUTION` is false.
- Do not auto-start the next work package.
- Do not expand scope.
- Do not merge, rebase, reset, force-push, deploy, or perform live actions without explicit Owner authorization.
- Repository truth newer than chat context wins.

Stop and report when the current gate requires Control Plane review or Owner authorization.
