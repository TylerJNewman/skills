---
name: frame-loop
description: Frame one gated optimization target as a runnable autoresearch loop — the evaluation contract, a frozen harness, a loop mode with stop conditions, and a goal contract the agent cannot redefine. Use when a candidate is green and ready to loop, when scout-targets hands off a target, or when deciding whether a loop is safe to run overnight.
---

Turn a green candidate into a loop an agent can run unattended without cheating and without you babysitting it. Four branches: run them in order for a full handoff, or one alone when only that piece is missing.

The governing seam is the Hart split, made mechanical. The agent edits the *attempt*; a separate **controller** owns the *evaluator*. The **change-gate** enforces it — before any score counts, the candidate's diff must be a subset of the declared editable paths. [`references/boundary.md`](references/boundary.md) is the single source for protected paths and the change-gate; every branch defers to it and none restates it.

## Branches

1. **Frame the contract.** Re-confirm the candidate is green per the `gates` skill, with the **causal** gate and the **Goodhart pre-mortem** explicitly satisfied — a contract for a causally-invalid target is a clean way to optimize the wrong thing. (If the `gates` skill is not installed, apply those two checks from first principles; they are the keystone.) Then fill the six primitives:
   - **TARGET** — metric, better-direction, bound.
   - **BATTERY** — the fixed task and data: a frozen snapshot, never live state.
   - **JUDGE** — the command that scores one attempt; if scoring needs judgment, the JUDGE is a calibrated `judge-panel`, not a bare prompt.
   - **LEDGER** — git, one commit per experiment, keep or revert.
   - **BUDGET** — cost per trial and a total-run cap; the cap is what bounds gaming.
   - **UPDATE-RULE** — keep iff the held-out number improves *and* no guard regresses.
   **Done when:** all six are executable as written and the causal gate is re-confirmed.

2. **Build the harness.** Draft the frozen evaluator for the BATTERY using [`references/harness.md`](references/harness.md): fixed cases, a machine-readable result schema, baseline capture, a retest band for noise, and the three states — baseline, incumbent, candidate.
   **Done when:** the harness has fixed cases, a result schema, a baseline run, a keep/revert rule, a retest band, and at least one regression case.

3. **Select loop mode.** Classify with [`references/loop-mode.md`](references/loop-mode.md) as `overnight`, `short ratchet`, `needs harness`, `manual only`, or `reject`, and write the loop brief with its stop conditions. Return a brief only for `overnight` or `short ratchet`; otherwise return the no-go reason and the smallest missing prerequisite.
   **Done when:** a mode is assigned and either a loop brief or a named blocker is returned.

4. **Set the goal contract.** If the loop runs under a persistent goal (Codex Goal Mode, or a Claude Code background run), bind it with [`references/goal-control.md`](references/goal-control.md). The goal is task state, not the evaluator; budget exhaustion is not completion.
   **Done when:** the goal names the artifact, metric, gates, and stop conditions, and completion is defined as a requirement-by-requirement audit.

## Output

Full handoff: the contract (six primitives), the harness spec, the loop-mode decision with its brief, the goal policy if relevant, and the open risks with the smallest next action. Single branch: that branch's artifact plus any prerequisite it needs from the others.

## Hard rules

- Reject any loop where the agent can reach the evaluator, fixtures, expected outputs, scoring code, baseline records, prior logs, secrets, production data, deploy config, or billing config.
- The change-gate runs before scoring, every trial. A protected-path diff reverts the run.
- Crashes, missing metrics, suspicious jumps, and noise-band wins are `retest` or `revert`, never `keep`.
- Keep the evaluator boring: deterministic first; a `judge-panel` only when it carries a current agreement receipt and is frozen.
- Money and compliance paths stay human-ratified. The loop never auto-merges them.
- Delete a bad candidate rather than carry it with caveats.
