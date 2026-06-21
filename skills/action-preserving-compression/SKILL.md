---
name: action-preserving-compression
description: "Turn tacit experience into the coarsest heuristic that preserves competent action. Use when distilling conversations, transcripts, audits, examples, failures, or recurring decisions into handles; finding counterexamples; splitting overbroad heuristics; reviewing heuristic drift; or updating the heuristic catalog."
---

# Action-Preserving Compression

Compress experience only as far as action survives. The unit is not a principle; it is a handle that still chooses the right move.

## Output contract

Return one block per candidate:

```text
Handle: <memorable phrase>
Target: <decision it compresses>
Equivalence: <situations treated alike>
Move: <resulting action>
Probes: <questions that may split the category>
Counterexample: <where the move fails, or "not found">
Refinement: <smallest distinction that repairs the failure, or "none yet">
Receipts: <case paths, conversation anchors, audit files, git commits, or notes>
Disposition: candidate | strengthen | split | merge | retire | discard | catalog
```

Do not omit `Counterexample`. A handle without a searched-for failure is only a mnemonic.

## Procedure

1. **Decompress.** Collect concrete cases, outcomes, attempted moves, and context until consequential distinctions are visible.
   **Done when:** at least two cases share a possible move, and at least one boundary or counterexample has been searched.

2. **Compress.** Write the output contract fields. Prefer one handle, one target decision, one move.
   **Done when:** a stranger can use the handle to choose an action without re-reading the source material.

3. **Break.** Test boundary cases. Ask where the same handle would choose the wrong move.
   **Done when:** either a counterexample is recorded, or the search scope is named and `Counterexample: not found`.

4. **Refine.** When one handle contains situations requiring different moves, split on the minimum distinguishing feature and repeat.
   **Done when:** the split changes the move and removes the counterexample.

5. **Stop.** Delete distinctions one at a time.
   **Done when:** deleting any remaining distinction changes the move.

Rule: decompress until distinctions change action; compress until one more deletion would change it.

## Catalog and review

For a one-off derivation, stop at the output contract.

When the request says catalog, review, strengthen, split, merge, retire, or update, read [`HEURISTICS.md`](HEURISTICS.md) and follow its admission rules.

Catalog work must:

- compare by target, equivalence, move, probe, and counterexample, not by handle name
- preserve old handles through the mutation ledger instead of silently rewriting them
- use git history as the rollback path; do not create a second versioning system
- keep unproven handles as `candidate` until receipts show repeated competent action

## Integration points

- **Daily audits:** mine `.notes/audit/*/learning-candidates.jsonl`, `audit-findings.md`, and `pattern-ledger.jsonl` for cases and counterexamples. Do not promote daily-audit candidates without re-running this procedure.
- **Git:** use commits/diffs as receipts when a heuristic changed an action or when a split fixed a failure.
- **Eval loops:** when a heuristic can be tested repeatedly, freeze a small evaluation set before comparing revisions. Borrow the autoresearch pattern: fixed metric, append-only log, reviewable diffs.
- **Distill-law:** use `$distill-law` only when the candidate claims to be a falsifiable system law. Most action handles should remain heuristics.

## References

- [`HEURISTICS.md`](HEURISTICS.md) - standing catalog, admission rules, and mutation ledger
