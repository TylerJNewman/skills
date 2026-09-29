---
name: run-with-receipts
description: "Receipts for work that repeats, writes, or claims a result. Use on \"do the same for the rest\", \"for each\", \"batch\", \"retry\", \"did it actually save\", \"send it\", \"rerun after the fix\", \"make this reusable and prove it\", \"prove it's faster\"."
---

# Run with receipts

A receipt is an artifact that someone other than the actor owns. Five run-time patterns, then a procedure for proving a change.

## Run-time patterns

**Freeze what passed once.** Cue: the second item of a task that worked on the first ("do the same for the rest", "for each", "batch"). Move the changing values into data, hash the procedure, bind the passing check to that hash, and run every remaining item from those bytes. A changed byte voids the receipt: re-freeze and rerun every case. Prevents re-deciding each step and running an unvalidated edit.

**Preflight before the first write.** Cue: a procedure about to write to an account, record, or environment ("send it"). Assert origin, account, and state deterministically; on mismatch, stop before the first edit, report expected versus observed, and hand back to reasoning. Prevents right steps on the wrong target, such as a work send from the personal account.

**Journal before the write, read back by identity.** Cue: a side effect whose acknowledgment can vanish, such as a timeout or kill ("did it actually save", "retry"). Give the request an id, journal `may_have_committed` before dispatch, and verify from a persisted view joined on that id; an unknown outcome resumes by readback. Prevents duplicates, such as a timed-out Knack sync, where `sync_state` gets queried first.

**Separate grader from subject.** Cue: "improved", "safe", "passed", "fixed", or a rubric being written. The grader owns the log, holds inputs out until after the freeze, and scores missing evidence unmeasured. On a failure, decide whether harness or subject is wrong before repairing. Prevents self-reported success; a chat eval counts tool calls from the trace.

**Count the whole system against a like-for-like baseline.** Cue: "zero model calls", "faster", "cheaper". Count the coordinator's own tool calls and turns between launch and result, and rerun the unchanged approach on the same fixture first. Prevents overhead moving upward out of the metric, such as a babysit-pr run that claims no attention while you poll.

## Prove a change

Cue: "make this reusable and prove it", "prove it's faster". Each step ends on its exit artifact.

1. Draft the assignment (smallest change, hard blockers, draft rubric, fixture test) and get an outside critique through `oracle-packx` once the user authorizes sending the code out. Exit: draft rubric and written critique.
2. Fold each critique point into a v2 rubric as a number, definition, or dropped row; run a second review round; give each independent piece a subagent (cost audit, fixture, measurement, red-team with the old approach, docs). Exit: every subagent report and the second critique.
3. Reconcile into v3 and build the grader-owned harness: logging shim, launcher running hashed bytes, held-out inputs, fault injection. Exit: every rubric row names an observable artifact and the harness runs against the unchanged approach.
4. Measure the baseline on the same fixture with the same checks before writing the change. Exit: grader-produced baseline log and counts.
5. Implement the smallest change, freeze it with a receipt bound to its digest, run every case, and sort each failure: subject bug means re-freeze and rerun all, grader bug means fix the harness and rerun the affected cases. Exit: every case ran on the final digest and every row has a score with its artifact.
6. Test discovery cold in fresh sessions: docs, task, and held-out input only, plus a near-miss task to decline. Exit: transcripts show finding, using, and declining.
7. Write the handoff: scores with artifacts, test command, baseline versus result, smallest change, unresolved items (rows scored 2 with a known gap). Exit: another agent can repeat the test from the file list.
8. Commit the subject change alone when the user asks. Exit: the hash sits in the handoff.

Rubric rows and the Goodhart pre-mortem come from `gates`, the evaluator boundary from `frame-loop` (`references/boundary.md`), both in `plugins/autoresearch-targets`.

Decision rules:
- The grader owns the scorecard, logs, held-out inputs, and counts; missing evidence scores unmeasured.
- Baseline before implementation, same fixture, same checks; a number from another task is context.
- Any subject change gets a new digest and receipt, and every case reruns on it.
- The coordinator's transcript is the decision count: every tool call and text turn between launch and terminal result, polling included.
- Red-team the rubric with the old approach before implementing; each pass becomes a blocker, a bound, or a harness feature.

## Worked example

Reference implementation: `/Users/tyler/.codex/visualizations/2026/09/28/01a0e9ca-6706-7e60-9a20-02d73b2d3e04/browser-script-reuse-handoff-v3.md` (a browser runner scored 12/12, one launch replacing per-item turns).
Its harness sits beside it in `browser-script-reuse/`: `run.py`, `test.py`, `run-frozen.py`, `count-decisions.py`.

## Skip

A one-module change that one commit can revert and one focused test can prove.
