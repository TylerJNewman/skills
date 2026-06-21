# The harness

A tight evaluator for one editable artifact. Binary and numeric checks beat prose judgment: a number that means something different each run cannot be ratcheted.

## States

- **Baseline** — the immutable starting state.
- **Incumbent** — the current accepted best.
- **Candidate** — the proposed replacement.

Keep a candidate only when it beats the incumbent under the acceptance policy and passes every baseline, regression, schema, and protected-path gate. Promote it to incumbent only after required retests pass.

## Steps

1. Name the artifact under test and the frozen judge outside its scope (see [`boundary.md`](boundary.md)).
2. Fix 3–7 eval cases with expected behavior; add a frozen holdout when feasible.
3. Choose binary and numeric metrics only.
4. Add a regression case for each known past failure.
5. Set the keep/revert rule and the retest band *before* running.
6. Run the baseline, then candidates, cheaply and repeatably.

## Result schema

```json
{
  "artifact_id": "prompt-or-skill-name",
  "candidate_id": "branch-or-run-id",
  "evaluator_id": "frozen-version-or-hash",
  "fixture_set_id": "frozen-version-or-hash",
  "baseline_id": "initial-state",
  "incumbent_id": "current-best",
  "run_status": "ok | crash | timeout | missing_metric | invalid | protected_path_violation",
  "cases": [
    {
      "id": "case-001",
      "input": "fixed input or fixture path",
      "expected": "observable target",
      "metrics": { "pass": true, "score": 0.87, "latency_ms": 1200, "cost_usd": 0.03 },
      "notes": "short failure reason only"
    }
  ],
  "summary": { "pass_rate": 0.92, "mean_score": 0.81, "regressions": 0, "cost_usd": 0.21, "runtime_sec": 48 },
  "decision": "keep | revert | retest",
  "decision_reason": "machine-readable-or-short-text reason"
}
```

## Binary checks (hard gates)

Compiles/runs · required tests pass · required field present · unsafe request refused · API contract preserved · output matches schema · protected regression does not regress.

Any critical binary failure forces `revert` unless the user marks it non-blocking.

## Numeric checks (graded)

Pass rate · judge score 0–1 · exact-match · retrieval precision/recall · latency · cost · token count · diff size · accessibility · visual similarity.

Example policies:

- keep if `candidate_score >= incumbent_score + 0.03`
- keep if `pass_rate >= 0.95` and `regressions == 0`
- keep if `latency <= baseline * 0.9` with no quality loss
- revert if `cost > baseline * 1.2` unless quality gain exceeds threshold

## Noise band

```text
noise_band = 0.02
if abs(candidate_score - incumbent_score) <= noise_band:
    run 3–5 repeats, compare medians
```

Retest when the delta is inside the band, the judge is LLM-based, the failure looks flaky, latency or cost varies, or the candidate barely clears the threshold. Use medians for noisy numerics; use "must pass every run" for safety, schema, data-loss, and regression checks.

## Done

A harness spec is done with: one artifact under test, immutable inputs, a judge outside edit scope, a result schema, a keep/revert rule, a retest band, at least one regression case, and the change-gate. It is *validated* only after a baseline run and one candidate run both produce schema-valid results.
