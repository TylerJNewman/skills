# Loop mode

The final gate before running. Pick the mode the evidence supports; when in doubt, drop a tier.

## Modes

- **overnight** — strong evaluator, cheap repeatable runs, bounded risk, clean revert.
- **short ratchet** — isolated and repeatable, but noise, cost, or thin evidence forces frequent review.
- **needs harness** — plausible candidate, but evaluator, baseline, or boundary is missing or weak.
- **manual only** — inherently subjective, or required human approval.
- **reject** — boundary isolation, clean rollback, bounded side effects, or a defensible evaluator cannot be established.

## Decision matrix

| Signal | Overnight | Short ratchet | Reject |
|---|---|---|---|
| Editable scope | One artifact | Small artifact set | Broad system rewrite |
| Evaluator | Stable automated metric | Partial or noisy metric | Human taste only |
| Score | Numeric or binary | Approximate numeric | Vague judgment |
| Judge isolation | Agent cannot edit judge | Protectable with setup | Agent can edit judge |
| Retesting | Baseline and best retested | Some retesting possible | No repeatable retest |
| Cost | Cheap repeatable runs | Moderate cost | Expensive or rate-limited |
| Revertability | Clean git revert | Some cleanup needed | Risk of data loss |

Good fits: prompts, skills, templates, benchmarks, landing pages, retrieval pipelines, performance targets. Bad fits: one-shot strategy, taste-heavy writing, unstable briefs, anything without a fixed evaluator.

## Loop brief

```text
Artifact:
Editable paths:
Protected paths:
Change gate:
Evaluator:
Metric:
Baseline:
Incumbent:
Keep rule:
Revert rule:
Retest rule:
Stop rule:
Budget:
Result-log owner:
Logs to preserve:
Patience window:
Acceptance evidence:
```

## Stop conditions

Stop when: budget is spent · no improvement past the patience window · the evaluator goes flaky or unavailable · a candidate diff touches a protected path · the best score regresses on retest · the loop starts exploiting an evaluator weakness · cleanup or review cost exceeds expected value.

That penultimate one is the live Goodhart tripwire: the loop found a way to raise the number that the harness rewards and you don't. Stop, then harden the evaluator before resuming.

## Done

Ready for `overnight` only with: one primary editable artifact (or a tight set), automated repeatable evaluation, a numeric or binary score, the judge outside edit scope, a retestable baseline and best, an explicit keep/revert rule, an explicit budget and stop conditions, and recoverable-on-failure state.
