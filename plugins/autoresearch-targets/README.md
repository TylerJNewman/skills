# autoresearch-targets

Three skills that find where an automated optimization loop is worth running, decide whether the metric is honest, and turn the survivors into loops an agent can run unattended without cheating. The discovery half is read-only — it nominates and frames; it never runs the loop or edits the code.

Runs in both **Codex** and **Claude Code** from one source tree — dual manifests over a shared `skills/`. See [`INSTALL.md`](INSTALL.md).

## The pipeline

```
scout-targets  →  gated, ranked candidate ledger (green / amber / red)
                       │            ▲
                       │        gates (the shared law, reached by name)
                       │            ▼
        green ─────────┼─────────── amber (needs judgment)
                       │                        │
                       │                        ▼
                       │                  judge-panel ── ADMIT ──┐
                       ▼                                         ▼
                 frame-loop  ◄───────────────────── (calibrated JUDGE)
                       │
        contract → harness → loop-mode → goal contract
                       │
                 a loop safe to run overnight
```

- **`scout-targets`** — parallel read-only lanes over the codebase *and* work logs, one per metric family, returning a gated ledger. The unit of evidence is the **receipt**: the exact command that turns a candidate into a number.
- **`gates`** — the shared law: the seven gates plus the Goodhart pre-mortem. All reference, no steps. The other skills invoke it by name to decide green / amber / red, so the rule of recognition lives in one place above the skills that apply it.
- **`judge-panel`** — the reusable primitive. A multi-judge evaluator earns the JUDGE role only after it agrees with held-out human labels (an FN/FP **agreement receipt**) and is frozen. It is the move that **promotes an amber target into a green one**, and it works for any eval, not just autoresearch.
- **`frame-loop`** — one green candidate → the evaluation contract (six primitives), a frozen harness, a loop mode with stop conditions, and a goal contract. Four branches; references disclosed per branch.

## Packaging contract

The four skills are designed to ship together as one plugin. The dependency map:

- `scout-targets` → `gates`, `judge-panel`, `frame-loop` (by name)
- `frame-loop` → `gates`, `judge-panel` (by name)
- `judge-panel` → none
- `gates` → none

Every cross-skill link is **by skill name, never by file path** — so reordering or renaming folders inside the plugin cannot break them. If you ever lift a skill into a *separate* plugin, ship `gates` alongside it (or copy `gates/SKILL.md` in): `scout-targets` and `frame-loop` both depend on it, and `frame-loop` carries an inline fallback for the causal gate and pre-mortem so the loss degrades to a first-principles check rather than a silent skip. Splitting is then a deliberate act with this checklist, not a regression.

## The two laws

**The seven gates** (the [`gates`](skills/gates/SKILL.md) skill) — the single source of truth for "is it autoresearch-shaped," lifted into a peer skill the others reach **by name**, not by file path. A target is green only if it passes all seven plus a Goodhart pre-mortem. The keystone is the **causal** gate: a metric can be automatable, cheap, quiet, and isolated and still be a trap if it only *correlates* with the goal. The dangerous case is not red — it is a target that looks green and fails the pre-mortem silently.

**The boundary** ([`skills/frame-loop/references/boundary.md`](skills/frame-loop/references/boundary.md)) — the single source for the Hart split, made mechanical by the **change-gate**: before any score counts, the candidate's diff must be a subset of the editable paths. The agent authors attempts; a separate controller ratifies them.

## Invocation

All three skills are model-invokable so they can reach each other (scout → frame-loop, amber → judge-panel → frame-loop) and fire when your prompts use the shared vocabulary. To make any hand-only, add `disable-model-invocation: true` and trim the description to one line — you then pay cognitive load (you are the index) but zero context load.
