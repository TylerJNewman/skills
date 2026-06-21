# Catalog — admitted laws

This is branch reference for [`distill-law`](SKILL.md). Read it when a candidate may enter, alter, or leave the catalog. Routine one-off derivations stop in `SKILL.md`.

## Catalog admission

1. **Re-derive the candidate.** Produce every field through `Vetoes` in the [`SKILL.md` output contract](SKILL.md#output-contract); leave `Disposition` open, then run Bite, Transfer, and Compression and record their receipts. Provenance is evidence, not admission.  
   **Done when:** the candidate has a non-empty veto and three gate receipts.

2. **Compare structure, not names.** Search the catalog by boundary, conserved quantity, failure condition, and forced decision.  
   **Done when:** all four structural keys have been searched and every near-match is classified as parent, peer, or instance.

3. **Assign exactly one disposition.**
   - **Admit** — distinct structure; all gates pass.
   - **Instance** — narrower case of an existing law; nest it under the parent.
   - **Generalize** — candidate subsumes one or more laws; promote it and demote those laws to instances.
   - **Revise / split** — a misfire reveals two quantities or boundaries hidden under one name.
   - **Leave tacit** — useful competence that fails Compression.
   - **Retire** — later evidence invalidates or fully subsumes an admitted law; remove it from the admitted section and preserve its receipt in the ledger.
   - **Discard** — fails reproducibility, Bite, or relevance.

   **Done when:** the candidate has one disposition and one reason; no duplicate peer remains.

4. **Write the selection receipt.** Record the candidate, disposition, decision rejected or redirected, and source pointer. New receipts use `YYYY-MM-DD — decision rejected or redirected — source pointer`; preserve legacy partial dates rather than inventing precision.  
   **Done when:** the main catalog and selection ledger agree, and every new row has one disposition and one receipt.

5. **Audit evidence state.** Ask what each admitted law has vetoed. Mark it `receipted` only when `Receipt / evidence` identifies an actual decision rejected or redirected; otherwise mark it `structural`. When later evidence removes or subsumes a law, assign the `retire` disposition and move its receipt to the ledger.  
   **Done when:** every admitted entry exposes exactly one evidence state, every `receipted` entry points to a real veto, and lifecycle changes appear only as dispositions.

## Entry schema

A catalog entry reuses the [`SKILL.md` output contract](SKILL.md#output-contract): its heading carries `Law`, and it keeps the shared structural fields from `Boundary` through `Vetoes`. Candidate `Disposition` lives once in the selection ledger. Add only these stored-law fields:

```text
- Transfer:
- Receipt / evidence:
- Evidence state: receipted | structural
- Instances:       (optional)
- Distinction:     (optional — how it differs from a near neighbour)
- Caveat:          (optional — a bound on what the probe establishes)
```

The catalog is a single source of truth: a narrower law survives only as an instance under its parent. `Vetoes` carries the Bite receipt, `Transfer` carries the Transfer receipt, and the one-boundary/one-quantity form carries the Compression receipt. Provenance or an illustrative example can support a `structural` entry, but only a logged decision rejected or redirected supports `receipted`. Retirement belongs in `Disposition`, never in `Evidence state`.

---

## I. Authority — who may write

### Audit Gravity
- **Boundary:** accountable engine / convenience cockpit
- **Conserved quantity:** authority over canonical state
- **Correct side:** the side that can reconstruct and adjudicate failure
- **Observable:** whether the failure can be reconstructed from canonical artifacts without trusting the cockpit
- **Probe:** *Could an auditor reconstruct the failure without trusting the convenience layer?*
- **Fires when:** canonical authority leaks into a display or coordination tool.
- **Vetoes:** a cockpit owning truth; make it derived or rebuildable.
- **Transfer:** CRM, finance, publishing, analytics, compliance, and agent memory.
- **Receipt / evidence:** Jun 8 — rejected PFS in HubSpot because a failure requiring audit cannot leave canonical truth in a convenience layer.
- **Evidence state:** receipted
- **Instances:** **Regulated Surface** — regulated NPI is audit-bearing state; it may enter only a controlled, deterministic, audited surface, never a probabilistic marketing CRM. Vetoes PFS in HubSpot.

### Single Origination
- **Boundary:** entity creation / downstream mirrors
- **Conserved quantity:** authority over identity
- **Correct side:** exactly one canonical origin
- **Observable:** the number of surfaces able to create or rename the canonical entity
- **Probe:** *Can more than one surface create or rename this entity?*
- **Fires when:** two or more surfaces author identity. Two systems of record is zero.
- **Vetoes:** downstream tools originating canonical entities; route creation and renaming through one identity service.
- **Transfer:** customer records, account systems, registries, content identifiers, and event-sourced entities.
- **Receipt / evidence:** legacy example — HubSpot may mirror contacts but Quanta's identity service originates them. Date not recorded; no actual corpus veto is logged.
- **Evidence state:** structural
- **Distinction:** Audit Gravity asks *which side* holds authority; Single Origination asks *how many sides* may author identity.

### Evidence-Gated Transition
- **Boundary:** current state / claimed next state
- **Conserved quantity:** transition authority
- **Correct side:** an independent evidence gate, not the actor requesting advancement
- **Observable:** current admissible evidence tied to the exact transition and artifact identity
- **Probe:** *Is there current, admissible evidence tied to this exact state transition?*
- **Fires when:** state advances on self-report, task completion, stale evidence, or a receipt for a different artifact.
- **Vetoes:** advancement; fail closed and rerun the verifier.
- **Transfer:** CI/CD, regulatory approval, publishing, underwriting, pipelines, and agent execution.
- **Receipt / evidence:** Jun 8 — redirected underwriting through evidence-gated transitions; Jun 18 — rejected publishing without a passing receipt whose artifact hash matches.
- **Evidence state:** receipted

### Delegation Envelope
- **Boundary:** principal / delegate
- **Conserved quantity:** consequential authority
- **Correct side:** the principal retains authority outside an explicit contract
- **Observable:** every consequential action maps to a contract clause or mandatory escalation
- **Probe:** *Is every consequential action either inside an explicit contract or forced to escalate?*
- **Fires when:** authority is delegated without matching accountability.
- **Vetoes:** an unbounded agent, employee, vendor, or API mandate; require goal, scope, forbidden actions, budget, evidence, evaluator, rollback, and handoff.
- **Transfer:** agents, employees, vendors, APIs, and financial mandates.
- **Receipt / evidence:** Jun 8 — rejected unbounded agent authority in favor of agent contracts; Jun 10 — required handoff contracts.
- **Evidence state:** receipted

### Critical-Path Optionality
- **Boundary:** project / uncertain dependency
- **Conserved quantity:** dependency downside
- **Correct side:** the project owner absorbs uncertainty through commitments, contingencies, or replacement options
- **Observable:** a named milestone, trigger, escalation, and fallback exist before the dependency fails
- **Probe:** *Will a missed commitment trigger a named escalation or replacement without a fresh debate?*
- **Fires when:** the critical path carries unbounded dependency risk.
- **Vetoes:** a soft dependency with no kill switch; require milestones and a pre-named fallback.
- **Transfer:** hiring, vendors, integrations, migrations, and approvals.
- **Receipt / evidence:** Sep 2 — James removed from the path; Everett capped at three weeks with an early kill switch.
- **Evidence state:** receipted

---

## II. Verification — can the signal reverse you?

### No Verifier, No Loop
- **Boundary:** internal iteration / external evaluator
- **Conserved quantity:** corrective information
- **Correct side:** an evaluator independent of the loop's current model
- **Observable:** the next iteration receives new evidence capable of reversing the present verdict
- **Probe:** *Can the next iteration receive new evidence capable of reversing its present verdict?*
- **Fires when:** the loop reframes, explains, or converts friction into doctrine without obtaining new reversing evidence.
- **Vetoes:** another meta-iteration; terminate the loop or touch the world.
- **Transfer:** agent recursion, editorial review, committees, debugging, and personal deliberation.
- **Receipt / evidence:** Jun 17 — rejected another meta-iteration without a verifier; the third reframe and conversion-as-avoidance remain diagnostic tripwires.
- **Evidence state:** receipted

### Convex Probe
- **Boundary:** claim / feedback interface
- **Conserved quantity:** authority to return a negative signal
- **Correct side:** an evaluator whose result is not determined by the claimant's framing
- **Observable:** the interface can produce a contradictory result without sharing the worker's context or incentives
- **Probe:** *Can this return a result that contradicts what I expect, without my framing deciding it?*
- **Fires when:** the surface only echoes the claimant: a grader sharing the worker's context, a sampled model inside the same frame, or a yes-person.
- **Vetoes:** “I asked and it agreed” as evidence; separate the evaluator or change the test.
- **Transfer:** model evaluation, experiments, audits, code review, hiring loops, and surveys.
- **Receipt / evidence:** legacy derivation — separation is the mechanism; independence is the law. Date not recorded; no actual corpus veto is logged.
- **Evidence state:** structural
- **Distinction:** **Convex** means bounded test cost, an independent downside signal, and disproportionate informational upside. No Verifier asks whether reversing evidence exists; Convex Probe asks whether that evidence has independent authority.

### Selection Receipt
- **Boundary:** selection process / accepted output
- **Conserved quantity:** evidence that rejection is possible
- **Correct side:** the process ledger
- **Observable:** the most recent rejected, reverted, merged, or retired candidate and its reason
- **Probe:** *When did this process last reject something?*
- **Fires when:** nothing is ever discarded.
- **Vetoes:** calling an always-approving process rigorous.
- **Transfer:** catalogs, review queues, model evaluation, editorial systems, governance, and hiring.
- **Receipt / evidence:** 2026-06-19 — rejected, demoted, or withheld candidates remain visible — [`Selection ledger`](#selection-ledger).
- **Evidence state:** receipted

### Frozen Battery
- **Boundary:** before-run / after-run comparison
- **Conserved quantity:** comparability
- **Correct side:** the evaluator keeps the test fixed across compared runs
- **Observable:** benchmark version, inputs, scoring rule, and configuration are identical or the change is explicitly controlled
- **Probe:** *Did the yardstick move between the runs I am comparing?*
- **Fires when:** the benchmark drifts midstream.
- **Vetoes:** an improvement claim measured against a moving evaluation.
- **Transfer:** benchmarks, KPIs, A/B tests, audits, and personal before/after comparisons.
- **Receipt / evidence:** legacy law; dated build receipt and actual corpus veto are not recorded.
- **Evidence state:** structural

### Hold-out
- **Boundary:** optimizer / success measure
- **Conserved quantity:** proxy validity
- **Correct side:** an independent evaluator retains at least one measure the optimizer cannot see or alter
- **Observable:** a success measure exists outside the optimizer's input and reward surface
- **Probe:** *Is there a success measure this optimizer cannot reach?*
- **Fires when:** every metric is visible to, or alterable by, what is being optimized.
- **Vetoes:** a dashboard or evaluation regime with no blind control.
- **Transfer:** machine learning, compensation plans, growth metrics, education, audits, and personal tracking.
- **Receipt / evidence:** visible-up while hold-out-down is the alarm the design must make observable. Dated build receipt and actual corpus veto are not recorded.
- **Evidence state:** structural

---

## III. Representation — does the map keep what matters?

### Policy-Sufficient Compression
- **Boundary:** full world or history / compressed representation
- **Conserved quantity:** action-relevant distinctions
- **Correct side:** the representation retains every distinction whose loss could change viable action
- **Observable:** a bounded counterexample search over the declared scope, observation window, coverage, and error bound finds no merged pair that requires different viable actions
- **Probe:** *Within the declared scope and error bound, can two states mapped to the same representation require different viable actions?* Pass on no counterexample at the declared coverage; fail on one counterexample.
- **Fires when:** compression aliases states that demand different actions.
- **Vetoes:** a summary, feature set, metric, or memory that merges decision-relevant structure; split it, restore the variable, or expose uncertainty.
- **Transfer:** dashboards, summaries, features, retrieval, risk metrics, memory, and control systems.
- **Receipt / evidence:** May 30 — derivation: policy-sufficient approximations preserve distinctions whose loss would change viable action selection. No actual corpus veto is logged.
- **Evidence state:** structural
- **Caveat:** the claim is bounded by the declared scope, coverage, and tolerated error; expand the search when consequences justify it rather than pretending exhaustive equivalence.
- **Instances:** **Requisite Variety / lossy key** — a greenhouse controller merged `66-falling` and `66-stable` into “optimal”; the dropped derivative changed the required action. See [`CASES.md`](CASES.md).

---

## IV. Interface — does the surface hide the machinery?

### Domain-Deep Surface
- **Boundary:** system / user
- **Conserved quantity:** orchestration complexity
- **Correct side:** the system behind the interface
- **Observable:** the user can state the domain goal and finish it without sequencing internal steps or translating implementation vocabulary
- **Probe:** *Can the user state the goal and finish it without coordinating the system's internal steps?*
- **Fires when:** orchestration leaks through the interface or a surface promise is not wired end to end.
- **Vetoes:** an interface that makes the user sequence internals; absorb the steps, choose safe defaults, or wire the goal through the whole path.
- **Transfer:** software interfaces, forms, service processes, APIs, operations consoles, and agent tools.
- **Receipt / evidence:** legacy example — a “for yesterday” input existed on the surface but was not wired through preflight. Date not recorded; no actual corpus veto is logged.
- **Evidence state:** structural
- **Instances:** Depth, Locality, Leak, and Variety are diagnostic views, not peer laws. See [`CASES.md`](CASES.md#interface-diagnostics).

---

## Selection ledger

| Candidate | Disposition | Receipt |
|---|---|---|
| Contact-With-Reality | revise | 2026-06-19 — retained the stronger handle **No Verifier, No Loop**; third-frame and friction-conversion remain diagnostics — [parent entry](#no-verifier-no-loop). |
| Regulated Surface | instance | 2026-06-19 — nested one class of audit-bearing state under **Audit Gravity** — [parent entry](#audit-gravity). |
| Requisite Variety | instance | 2026-06-19 — nested the failure mode under **Policy-Sufficient Compression**, whose parent criterion names the action test — [parent entry](#policy-sufficient-compression). |
| Depth / Locality / Leak / Variety | instance | 2026-06-19 — retained as diagnostic views under **Domain-Deep Surface**, not four peer laws — [parent entry](#domain-deep-surface). |
| Separation | revise | 2026-06-19 — retained as the mechanism by which **Convex Probe** obtains independence, not as a peer law — [parent entry](#convex-probe). |
| “Every patch is a commit” | discard | 2026-06-19 — rejected as default practice without a distinct falsifying probe or veto — [`Bite`](SKILL.md#the-three-gates). |
| “Stop on budget” | discard | 2026-06-19 — rejected as a default bound rather than a distinct catalog law — [`Bite`](SKILL.md#the-three-gates). |
| Memory is a mutation log, not a transcript archive | revise | 2026-06-19 — withheld from admission pending a dated veto; may reduce to **Policy-Sufficient Compression** — [near-match](#policy-sufficient-compression). |
| Mechanism before machinery | revise | 2026-06-19 — withheld because it currently reduces to **Evidence-Gated Transition** or **No Verifier, No Loop** — [near-match](#evidence-gated-transition). |
| Preserve complexity / write concisely | revise | 2026-06-19 — withheld as a preference until it vetoes; the structural parent is **Policy-Sufficient Compression** — [near-match](#policy-sufficient-compression). |

## Cross-family synthesis — not admitted

The authority and verification families share one useful higher-order frame:

> **Authority stays with the accountable side. It crosses a boundary only under contract, on current evidence, with a path back; every crossing must be able to fail.**
>
> *Delegate execution, retain judgment, require receipts.*

This synthesizes Audit Gravity, Single Origination, Evidence-Gated Transition, Delegation Envelope, Critical-Path Optionality, No Verifier, and Convex Probe. It does **not** yet subsume the representation or interface families; treat it as a synthesis, not a parent law, until it passes the same admission procedure.
