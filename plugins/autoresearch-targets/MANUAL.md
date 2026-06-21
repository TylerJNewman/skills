# Wielding the suite — a field manual

Three skills, one pipeline. The whole point is to **earn the right to run a loop** before you run it — and to know which "improvements" are real.

## The loop, in one breath

`scout-targets` finds candidates and gates them → green goes straight to `frame-loop`; amber detours through `judge-panel` to get promoted; red stops. `frame-loop` turns a green candidate into a contract + harness + loop mode + goal, and the **change-gate** keeps the agent from editing its own scorecard.

## Three habits

1. **Always scout first, even when you already know the target.** Scouting forces a receipt and runs the causal gate. The targets you're surest of are the ones most likely to fail the Goodhart pre-mortem.
2. **Only `frame-loop` a green.** Amber → `judge-panel` first. Red → stop; a red verdict is a finished piece of work, not a failure.
3. **`judge-panel` is reusable.** Reach for it any time you're about to trust an LLM score — grading `exec-email` drafts, ranking PRISM prospects, scoring intake-form clarity. It is not autoresearch-only.

---

## Hello-world toy examples

### 1. Green → overnight (the canonical case)

**Target:** a slow Kysely query on the loan-pipeline dashboard.

- **scout-targets** finds it in the `query latency` lane. Receipt: `EXPLAIN ANALYZE` on a frozen prod snapshot. Current: 1,200 ms p95.
- **Gates:** Automatable ✓ (the command returns ms) · Cheap ✓ · Quiet ✓ (warm-cache variance ≈ 30 ms < ⅓ of target win) · Bounded ✓ (lower better) · **Causal ✓** (faster plan → real wall-clock win; not a proxy) · Un-gameable ✓ (guard: result set byte-identical to baseline) · Navigable ✓ (revert = drop the index). **Green.**
- **frame-loop:** TARGET = p95 ms ↓. BATTERY = the frozen snapshot + a fixed 20-query workload. JUDGE = `EXPLAIN ANALYZE` runtime. LEDGER = git. BUDGET = 5 min/trial, 100-trial cap. UPDATE-RULE = keep iff p95 ≤ 0.9× incumbent **and** result rows unchanged.
- **Harness:** regression case = every query returns identical rows. Keep if `latency ≤ baseline × 0.9`.
- **Mode:** `overnight`. The agent may edit only `migrations/` and query builders; the snapshot, the workload, and the scorer are frozen.

This is the shape every other candidate is measured against.

### 2. Amber → promoted by a judge-panel

**Target:** borrower intake-form error messages — make them clearer.

- **scout-targets** marks it **amber**: fails the **Automatable** gate (clarity needs judgment). Promotion named: `judge-panel`.
- **judge-panel:** rubric decomposed into binaries — *names the offending field?* · *states the fix?* · *avoids jargon?* Three judges (two models, two prompt framings), **minimum** aggregation (a false "clear" is the costly error). Calibrate against 50 human-labeled messages: FN 6%, FP 4% — both under the 10% ceiling. **ADMIT.** Freeze model/prompt/rubric/temp/parser; the receipt is valid only for that frozen panel.
- Now the panel's scoring command is a legitimate JUDGE. Hand it to **frame-loop**, which can loop message rewrites against it as a `short ratchet` (LLM judge → retest noise-band wins).

The amber didn't become loop-able by lowering the bar. It became loop-able because the judge earned a receipt.

### 3. Red → keep human

**Target:** "which loan product should we build next."

- **scout-targets** marks it **red**: fails **Automatable** and **Causal** at once. No command returns the number; "right product" is a one-shot strategic bet with no fixed evaluator.
- No loop. The ledger records the no-go reason and moves on. Trying to frame this manufactures a confident way to optimize a guess.

### 4. Dangerous green → the one that bites a lender

**Target:** loan-approval throughput (approvals per day).

- It *looks* green: Automatable ✓ · Cheap ✓ · Bounded ✓. A weaker framework greenlights it.
- The **Goodhart pre-mortem** kills it: *double the optimization pressure — how does this get gamed, and what gets worse while it climbs?* Answer: the loop approves marginal loans; throughput rises while **credit quality falls**, and the guard (default rate) **lags by months**. The proxy only *correlates* with the real goal (good loans funded). **Fails the Causal gate.**
- Disposition: **keep human, ratified.** If you ever loop anything nearby, the guard must be a *leading* quality signal, not a lagging default rate, and the merge stays human-signed.

The lesson the suite encodes: the danger is never the target marked red. It is the target that looks green and fails the pre-mortem quietly — the number climbs while the goal rots.

---

## Where this pays off in your stack

- **Query latency** across the Kysely/Postgres layer (example 1) — the highest-yield green tier.
- **Bundle size / lab Core Web Vitals** on the Capital Partner Portal — Lighthouse CI budgets as the JUDGE.
- **Retrieval quality** in any RAG/knowledge-management pipeline — precision/recall/latency, all numeric.
- **Trigger.dev job duration** — wall-clock per job over a fixed payload set.
- **Prompt and skill optimization** — point `frame-loop` at one of your own skills against an eval suite (this suite eats its own tail).
- **Mutation score** on a critical module — harder to game than line coverage.
- **`judge-panel` standalone** — any subjective score you're tempted to trust from a single LLM call.

## The one decision rule

*Earn the loop before you run it: a target ships to `frame-loop` only after it passes the seven gates and the Goodhart pre-mortem, and a judge scores only after it carries an agreement receipt. Everything else is a vibe with a dashboard.*
