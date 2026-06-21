# The goal contract

A persistent goal is thread-scoped task state — not the evaluator, scheduler, result log, or inner-loop controller. Two platforms, one discipline.

## The discipline (platform-agnostic)

- Preserve the full objective; derive its explicit requirements before any completion call.
- Mark **complete** only after a requirement-by-requirement evidence audit: files, command output, tests, rendered artifacts, runtime behavior.
- Keep working when evidence is weak, indirect, or only consistent with completion.
- Budget exhaustion is not completion. Stopping the inner loop is not completion.
- Never redefine success around already-finished work. Never use the goal as a score the candidate can optimize.

## Two contracts

**Threshold** — *Achieve `<target>`, verified by `<evaluator>`, preserving `<gates>`. Edit only `<paths>`. Complete only when the target and every gate pass.* Budget exhaustion ≠ completion.

**Bounded-search** — *Run at most `<budget>` safe evaluations on `<artifact>`. Keep only candidates that beat the incumbent under `<policy>`. Deliver the best verified artifact plus an audit report, reached target or not.* Completing the search and report is the deliverable.

Use threshold when there is a real bar to clear; use bounded-search when the win is uncertain and you want the best-so-far plus receipts no matter what.

## Codex adapter

`thread/goal/set` sets the objective and token budget. The model-facing `update_goal` reports only `complete` or `blocked`. `blocked` is valid only after the same blocker persists for at least three consecutive goal turns with no meaningful progress. Reserve `blocked` for an unavailable evaluator, missing credentials or hardware, or a required user decision — not for work that is merely hard or slow.

## Claude Code adapter

No `update_goal` primitive. Bind the goal in the run's instructions and enforce completion in the controller: the loop exits on a stop condition, then a separate audit step checks the loop brief, eval logs, git history, and the boundary before declaring done. Same discipline, enforced by the controller rather than a goal API.
