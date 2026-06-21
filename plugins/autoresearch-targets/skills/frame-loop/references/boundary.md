# The boundary

The single source for what the agent may touch and how the line is enforced. Every branch defers here; nothing restates it.

## Protected paths

The agent may write only the declared **editable paths**. Everything else is protected:

- evaluators, fixtures, expected outputs, scoring code
- baseline records and prior result logs
- secrets, production data, deploy config, billing config

New result records are written only by the controller or the evaluator, never by the candidate.

## The change-gate

Before any score counts: compute the candidate's diff and verify it is a subset of the editable paths. Any protected-path change invalidates and reverts the run. The gate runs **every trial** — it is not a one-time setup step.

If reliable diff detection or write isolation is unavailable, the loop cannot be `overnight`. Demote to `short ratchet` or `manual only`.

## Controller / candidate split

The candidate proposes edits inside the editable paths. A separate **controller** runs the evaluator, appends results, and applies keep/revert. The candidate never runs the judge or writes the log.

This is the Hart split in operation: the agent authors attempts; the controller ratifies them. The change-gate is the lint that proves the split held on this trial.
