---
name: run-with-receipts
description: "Receipts for work that repeats, writes, or claims a result. Use on \"do the same for the rest\", \"for each\", \"batch\", \"retry\", \"did it actually save\", \"send it\", \"rerun after the fix\", \"make this reusable and prove it\", \"prove it's faster\"."
---

# Run with receipts

A receipt records an observable result; an independent check decides whether it proves the claim. Use these five run-time patterns.

## Run-time patterns

**Freeze what passed once.** Cue: the second item of a task that worked on the first ("do the same for the rest", "for each", "batch"). Move the changing values into data, hash the procedure, bind the passing check to that hash, and run every remaining item from those bytes. A changed procedure needs a new digest and the required checks for that exact version. Prevents re-deciding each step and running an unvalidated edit.

**Preflight before the first write.** Cue: a procedure about to write to an account, record, or environment ("send it"). Assert origin, account, and state deterministically; on mismatch, stop before the first edit, report expected versus observed, and hand back to reasoning. Prevents right steps on the wrong target, such as a work send from the personal account.

**Journal before the write, read back by identity.** Cue: a side effect whose acknowledgment can vanish, such as a timeout or kill ("did it actually save", "retry"). Give the request an id, journal `may_have_committed` before dispatch, and verify from a persisted view joined on that id; an unknown outcome resumes by readback. Prevents duplicates, such as a timed-out Knack sync, where `sync_state` gets queried first.

**Separate grader from subject.** Cue: "improved", "safe", "passed", "fixed", or a rubric being written. The grader owns the log, holds inputs out until after the freeze, and scores missing evidence unmeasured. On a failure, decide whether harness or subject is wrong before repairing. Prevents self-reported success; a chat eval counts tool calls from the trace.

**Count the whole system against a like-for-like baseline.** Cue: "zero model calls", "faster", "cheaper". Count the coordinator's own tool calls and turns between launch and result, and rerun the unchanged approach on the same fixture first. Prevents overhead moving upward out of the metric, such as a babysit-pr run that claims no attention while you poll.

## Prove a change

Use the single procedure in [frame-loop](/Users/tyler/.codex/skills/frame-loop/SKILL.md): name the real outcome and budget, demonstrate a discriminating baseline/control, run one bounded change under frozen checks, then independently accept and read back the authorized version through its consumer. Ordinary reversible edits need only their focused checks and Git; repeated subjective comparisons use its [evaluation and promotion](/Users/tyler/.codex/skills/frame-loop/references/evaluation-and-promotion.md), and multiple Git candidates use its [ratchet](/Users/tyler/.codex/skills/frame-loop/references/ratchet.md).

Preserve failed/unknown results. A subject edit needs checks bound to its new digest. A grader, evidence or model change starts a new generation with a new baseline and comparable measurements of retained candidates; do not mix old scores with repaired checks. Count the coordinator's calls and polling in a like-for-like comparison. External reviews and bespoke harnesses are optional, not a required eight-step sequence. The old disabled autoresearch-targets plugin is historical source.

## Worked example

Reference implementation: `/Users/tyler/.codex/visualizations/2026/09/28/01a0e9ca-6706-7e60-9a20-02d73b2d3e04/browser-script-reuse-handoff-v3.md` (a browser runner scored 12/12, one launch replacing per-item turns).
Its harness sits beside it in `browser-script-reuse/`: `run.py`, `test.py`, `run-frozen.py`, `count-decisions.py`.

## Skip

A one-module change that one commit can revert and one focused test can prove.
