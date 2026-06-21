---
name: scout-targets
description: Scout a codebase and work logs for autoresearch targets — places where a cheap, hard-to-game objective metric makes an automated optimization loop worth running. Use when the user wants to find where to apply autoresearch, nominate metric candidates, audit what is worth optimizing, or hunt optimization opportunities. Reach for it when another skill needs a ranked target ledger.
---

A **scout** maps terrain; it does not take it. This skill is read-only end to end — it nominates and ranks targets for an autoresearch loop, and never edits the code or runs the loop. Because discovery touches nothing, the **lanes** fan out in full parallel with no collision.

The conserved quantity is the **receipt**: the exact command that turns a candidate into a number. A nomination without a receipt is a vibe — drop it.

## Procedure

1. **Frame the hunt.** Name the two corpora in concrete paths and sources: the *codebase* (services, queries, routes, jobs, build) and the *work logs* (past conversations, PLAN/EXPERIMENTS notes, Substack drafts, issue threads). State the search is read-only.
   **Done when:** both corpora are named with reachable paths/sources and the read-only boundary is stated.

2. **Fan out lanes.** Launch one independent read-only lane per candidate **family**. Each lane hunts only its family and returns nominations carrying a receipt. Lanes never write and never read each other's findings. Two axes of families:
   - *Runtime* — query latency (`EXPLAIN ANALYZE` on a frozen snapshot), endpoint p50/p99 under fixed load, bundle size / lab Core Web Vitals, type coverage (`tsc`), test/mutation score, cost-per-request, background-job duration, cache hit-rate, error rate, throughput.
   - *Artifact* — prompts, skills, agent-instruction files, templates with schema checks, and retrieval pipelines (precision / recall / latency). These are where the suite optimizes its *own* tooling against an eval set; they are often the highest-fit autoresearch targets and the easiest to overlook while hunting only runtime numbers.

   Add a family only if a lane can name its receipt.
   **Stop rule:** if a lane needs another lane's finding to score a candidate, *return the dependency* — do not braid the lanes. A target whose verifier depends on a second target is two targets or none.
   **Done when:** every family lane has returned and every nomination carries a receipt.

3. **Synthesize.** Dedupe across lanes onto one flat list. Delete every receiptless nomination without ceremony.
   **Done when:** one list, each entry with a distinct receipt.

4. **Gate each candidate.** Apply the seven gates and the Goodhart pre-mortem from the `gates` skill. Assign green / amber / red and, for anything not green, name the *first* gate it failed.
   **Done when:** every candidate has a tier; every non-green names its failed gate and (if amber) its promotion.

5. **Rank and return the ledger.** Sort by tier, then by payoff × tractability. For each amber, name the one promotion that would green it — usually a calibrated `judge-panel` or a held-out harness. Flag the top green candidates for `frame-loop`.
   **Done when:** the ledger is returned in the contract below and the next action for each candidate is explicit.

## Output contract

Return one block per candidate, highest tier first. Omit no field; a missing receipt is a missing candidate.

```text
Handle:      <memorable name>
Family:      <which lane found it>
Receipt:     <exact command that returns the number>
Current:     <measured value, or "unmeasured — receipt only">
True goal:   <what the number is a proxy for>
Tier:        green | amber | red
Failed gate: <first gate failed, or "none">
Guard:       <counter-metric that must not regress — the pre-mortem answer>
Promotion:   <for amber only: the move that would green it>
Disposition: frame now | build harness | judge-panel | keep human | discard
```

Close with the handoff: name the green candidates to send to `frame-loop`, and the amber candidates whose promotion is a `judge-panel`.
