# Process Learning Candidates

Use this reference only when writing `.notes/audit/$AUDIT_DATE/learning-candidates.jsonl` or appending `.notes/process-learning/pattern-ledger.jsonl`.

Record patterns, not anecdotes. Each JSONL row must describe a named mechanism that may be reinforced, guarded, watched, or counted later.

## Schema

```json
{"id":"YYYY-MM-DD:task_class:mechanism-slug","date":"YYYY-MM-DD","valence":"win|loss|near_miss|counterexample|baseline","task_class":"coding|research|audit|orchestration|debugging|docs|planning","mechanism":"","trigger":"","action_taken":"","outcome":"","verifier":"","evidence_strength":"strong|medium|weak","cost_signal":"","baseline_or_counterfactual":"","scope":"","receipts":[],"confounders":[],"candidate_patch":"AGENTS.md|skill|hook|prompt|automation|none","candidate_change":"","status":"candidate","review_after":"YYYY-MM-DD"}
```

The `id` should be stable enough to avoid duplicate ledger entries when the same daily audit is rerun.

## Valid Candidates

A valid win candidate requires receipt, named mechanism, task class, verifier, measurable or clearly described delta, baseline or counterfactual, scope, codifiable candidate change, and no hidden regression visible in receipts.

A valid loss candidate requires receipt, named failure mechanism, cost or risk, preventable better move, task class, and recurrence or one high-blast-radius event.

A near miss requires a receipt showing the failure was caught before damage.

A counterexample requires a receipt showing an existing rule, habit, prompt, or skill instruction failed or backfired.

A baseline record captures an eligible opportunity where no notable win or loss occurred. Use it to preserve denominator evidence, not to recommend a patch.

Do not store vibes, generic praise, generic blame, uncited summaries, or candidates whose mechanism cannot be named.

## Append

Before appending to the ledger, validate that every row parses and remains a candidate:

```sh
jq -c 'select(.status == "candidate" and (.receipts | length > 0))' "$LEARNING_FILE" >/tmp/learning-candidates.valid.jsonl
cat "$LEDGER_FILE" /tmp/learning-candidates.valid.jsonl \
  | jq -s -c 'unique_by(.id)[]' > /tmp/pattern-ledger.jsonl \
  && mv /tmp/pattern-ledger.jsonl "$LEDGER_FILE"
```

Workers find evidence; the manager converts only strong findings into candidate records.
