---
name: judge-panel
description: Build and calibrate a multi-judge evaluator, then prove it agrees with held-out human labels before trusting it as a JUDGE. Use when an optimization target needs human-like judgment, when promoting an amber candidate toward a loop, or when another skill needs a trusted scoring panel.
---

A **panel** is a JUDGE only after it agrees with human labels above a stated threshold. Until then it is a vibe with a quorum — three judges sharing one blind spot still vote wrong together. The conserved quantity is **agreement**: a measured false-negative and false-positive rate against ground truth, not the confidence of the votes.

The payoff: a calibrated panel converts an **amber** target — one blocked only because scoring needs judgment — into a loop-able one. This is the promotion mechanism, and it is reusable for any eval, not just autoresearch.

## Procedure

1. **Write the rubric.** Decompose the judgment into binary or low-cardinality sub-criteria, each with a pass/fail rule a stranger could apply. Binary failure modes beat a 1–10 score; a number that means something different to each judge cannot be aggregated.
   **Done when:** every sub-criterion has an explicit pass/fail rule.

2. **Assemble the panel.** At least three judges scoring independently, varied by prompt or model so their errors are not identical. State the aggregation rule: majority for throughput, **minimum** when a false pass is the costly error (anything safety- or compliance-adjacent), a quantile in between.
   **Done when:** panel size, judge diversity, and aggregation rule are named.

3. **Calibrate against held-out human labels.** Score a labeled held-out set the panel has never seen. Measure agreement: the false-negative rate (panel fails what humans pass) starves the loop; the false-positive rate (panel passes what humans fail) feeds reward hacking. The panel passes only if both clear threshold.
   **Done when:** FN and FP rates are measured against ground truth and compared to a stated threshold.

4. **Seal the set and freeze the panel.** Hold the calibration set out of every optimizer forever. Then freeze what was measured: model, prompt, rubric, temperature, fixtures, parser. An agreement receipt is only valid for the exact panel that earned it — change any of these and the receipt expires; recalibrate. State the correlated-error risk — where all judges likely share a weakness — and route it to the contract's guard metric.
   **Done when:** the held-out set is sealed, the panel is frozen, and the shared blind spot is named.

5. **Return the verdict.** ADMIT — the panel is a trusted JUDGE; hand its scoring command to `frame-target`. Or REJECT — agreement is below threshold; keep human and do not loop.
   **Done when:** the verdict carries its agreement receipt.

## Output contract

```text
Rubric:        <sub-criteria, each with pass/fail rule>
Panel:         <N judges, diversity axis>
Aggregation:   majority | minimum | quantile-<q>
Agreement:     FN <rate> / FP <rate> vs human held-out
Threshold:     <required FN/FP ceilings>
Frozen:        <model, prompt, rubric, temp, fixtures, parser — the receipt's scope>
Blind spot:    <where judges likely share an error → guard>
Verdict:       ADMIT (scoring command: <cmd> → frame-loop JUDGE) | REJECT (keep human)
```

A rejected panel is a successful result: it found that the target is not yet loop-able and stopped you from optimizing a number no one validated.
