---
name: distill-law
description: "Distill a system into a falsifiable law: one boundary, one conserved quantity, one probe, and one forced decision."
---

A law makes a system's quality **checkable by a stranger**. It earns a place only when its failure changes a decision. Discard is a successful result.

## Output contract

Return one block per candidate:

```text
Law: <compact name>
Boundary: <side A> / <side B>
Conserved quantity: <what must land somewhere>
Correct side: <who must absorb, retain, or adjudicate it>
Observable: <artifact fact the probe reads>
Probe: <one yes/no question with an explicit pass/fail rule>
Fires when: <the leak, stated as one negation>
Vetoes: <the minimal build decision a failure compels>
Gate receipts:
- Bite: <decision changed, or fail>
- Transfer: <alien-domain instance, or fail>
- Compression: <one-boundary/one-quantity form, or fail>
Disposition: admit | instance | generalize | revise | leave tacit | retire | discard
```

Do not omit a field. A missing observable makes the probe subjective; a missing veto makes the law decorative.

## Procedure

1. **Bound the seam.** Name both sides in the system's native roles and state what crosses between them. Do not name an internal mechanism unless it is itself one side of the boundary.  
   **Done when:** the boundary fits one line, names both roles, and states the crossing without hidden context.

2. **Name the conserved quantity.** State the burden, capability, authority, or distinction that must land somewhere; name the **correct side** and the concrete **observable** that reveals its placement. "Quality" and "good UX" are not quantities.  
   **Done when:** quantity, correct side, and observable are each explicit, and moving the quantity to the other side would describe a recognizable failure.

3. **Write the probe.** Ask one falsifying yes/no question about the observable. Define what counts as yes and no; do not rely on tone, intent, or overall impression. For noisy or sampled observables, state the scope, observation window, threshold, coverage, and tolerated error.  
   **Done when:** the probe points to the exact artifact fact or behavior, each possible reading maps to pass or fail without an unstated judgment, and any scope, sampling, or noise bound is explicit.

4. **Force the decision.** Draft the smallest build move a failed probe compels: move authority, fail closed, split a representation, restore a variable, add rollback, or leave the boundary tacit.  
   **Done when:** a failed probe changes a named ship/no-ship or design decision. If nothing changes, mark Bite failed.

5. **Run all three gates.** Test the candidate and its drafted veto, then record one receipt for each gate below. Revise when a failure exposes a sharper quantity or boundary; otherwise assign the matching non-admit disposition.  
   **Done when:** all three gate receipts exist and the candidate has exactly one disposition; `admit` is allowed only when all three pass with a non-empty veto.

When the request adds, merges, or retires catalog entries, continue with the admission procedure in [`LAWS.md`](LAWS.md#catalog-admission). Do not load the catalog for a one-off derivation.

## Structural terms

A law has five structural parts: a **boundary**, a **conserved quantity**, a **correct side**, a **probe**, and a **forced decision**. A runnable probe also names its **observable**.

- **Boundary** — the seam and direction of crossing: system/user, principal/delegate, canonical/derived, source/target, current/next. One law guards one seam.
- **Conserved quantity** — something the system cannot make disappear; it can only place, hide, transform, or transfer it. Examples: complexity, authority, decision burden, reversibility, evidence, and action-relevant variety.
- **Correct side** — the side accountable for absorbing, retaining, or adjudicating the quantity. This is not always the producer; use roles native to the system.
- **Observable** — a concrete artifact fact: a state, count, path, field, version, behavior, or dated receipt.
- **Probe** — a binary reading of the observable. Weak signal becomes **stained glass**: expectation fills the ambiguity.
- **Forced decision** — the build move a failed probe compels. Without it, the candidate is an observation, not a law.
- **Leak** — the quantity resting on the wrong side or losing a distinction the decision needs.

The objective is **maximum useful inference per unit of representation, under controlled error**: most bite per token, with false positives you can afford.

## The three gates

A candidate is a law only if it passes all three. Each rejects a different counterfeit.

- **Bite** *(ablation)* — Fail the probe or remove what the candidate claims matters. Does a build decision change?  
  **Fail:** no decision moves. **Disposition:** discard as a no-op.

- **Transfer** *(far transfer)* — Reinstantiate the same boundary/quantity relation in at least one structurally alien domain. Does the same leak force the same class of decision?  
  **Fail:** it only names the source case. **Disposition:** keep it as an instance, or split a conflated quantity and retry.

- **Compression** *(no blow-up)* — Can the candidate remain one boundary, one quantity, and one failure condition without enumerating every safe state?  
  **Fail:** the rule expands into a phrase book or exhaustive whitelist. **Disposition:** keep the negation, narrow the boundary, or leave the competence tacit.

## Failure routing

Two faults have no gate of their own; the other three *are* a gate verdict — route to it rather than restate it.

| Symptom | Handle | Where it's handled |
|---|---|---|
| Probe depends on interpretation | **Stained glass** | Name the exact observable and pass/fail rule (step 3). |
| Compressed states need different actions | **Variety gap** | Restore the dropped variable, uncertainty, or rate. |
| Failure changes nothing | **No-op** | → **Bite** gate. |
| Works only in the source case | **Phrase book** | → **Transfer** gate. |
| Complete statement needs enumeration | **Blow-up** | → **Compression** gate. |

For the cases behind these handles and worked transfers, read [`CASES.md`](CASES.md) only when a gate is hard to diagnose.

## Conserved-quantity starter set

This is a generator, not a fence.

| Quantity | Correct side usually holds | Leak looks like |
|---|---|---|
| Complexity / variety | accountable system | user coordinates internals |
| Vocabulary | domain-facing surface | implementation words leak out |
| Decision burden | system with enough evidence to default safely | user must choose blind or configure internals |
| Authority | accountable principal or canonical system | delegate or convenience layer authors consequential state |
| Evidence | independent verifier | self-report advances state |
| Freshness | presenting surface | stale state appears current |
| Reversibility | action-producing system | undo requires escalation or is silent |
| Locality | task surface | user hunts across surfaces to finish one job |

## References

- [`LAWS.md`](LAWS.md) is the standing catalog and selection ledger. Read it when comparing, admitting, merging, or retiring a candidate; re-derive rather than copy.
- [`CASES.md`](CASES.md) contains typed cases, diagnostic probes, and worked candidates. Read it when recognition or transfer is the hard part, not on every run.
