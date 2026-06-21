---
name: gates
description: Gate an optimization target against the seven properties that decide whether it is autoresearch-shaped — automatable, cheap, quiet, bounded, causal, un-gameable, navigable — plus a Goodhart pre-mortem. Use whenever scout-targets or frame-loop must check a target, or when the user asks whether something is worth optimizing with an automated loop, is autoresearch-shaped, or has an honest metric. Reach for this before framing or running any loop.
---

The single source of truth for *is it autoresearch-shaped*. Every skill in the suite names a gate by its leading word and applies it; none restates the definitions. This skill is all reference — the rule of recognition the others obey.

A target is **green** only if it passes all seven gates. Name the *first* gate it fails; that failure is the disposition. Each gate is a binary probe and rejects one counterfeit.

| # | Gate | Probe (yes = pass) | Counterfeit it rejects | Fail move |
|---|---|---|---|---|
| 1 | **Automatable** | Does one command return the number, with no human in the loop per trial? | The human-scored proxy. | Keep human, or send to `judge-panel` if the judgment is decomposable. |
| 2 | **Cheap** | Is one evaluation fast and cheap enough to run hundreds of trials inside the budget? | The slow oracle (a loop that can afford ten trials, not a thousand). | Build a faster harness first; re-gate. |
| 3 | **Quiet** | Is run-to-run noise smaller than the smallest improvement worth keeping? Rule: noise > ⅓ of target effect size → fail. | The noisy metric that randomizes the keep/revert decision. | Fix the harness — fixed seeds, warm caches, frozen data — before any loop. |
| 4 | **Bounded** | Does the metric have a known better-direction, ideally a known optimum? | The directionless or unbounded score. | Re-express as a bounded ratio (0–100%) or a capped quantity. |
| 5 | **Causal** | Does *moving the proxy* move the true goal — not merely correlate with it? | The correlational proxy (causal Goodhart). **The dangerous gate.** | Name the true goal; if the link is only correlational, discard or demote to guard metric. |
| 6 | **Un-gameable** | Is there a held-out or adversarial check the optimizer can't see, a named guard metric, and a frozen evaluator the optimizer can't edit? | The proxy that's hacked under pressure. | Add the held-out set + guard + frozen boundary. Nothing is *perfectly* un-gameable — this gate means gaming is *bounded*, not zero. |
| 7 | **Navigable** | Is the candidate-change space reachable by the agent, and is every change revertible and side-effect-safe? | The irreversible or unreachable target. | Scope the write-set; add rollback; or discard. |

## The Goodhart pre-mortem

A target that clears gates 1–4 still dies here if it can't answer:

> If we doubled the optimization pressure, **how does this number get gamed, and what gets worse while it improves?**

No concrete answer → not green, regardless of the gates. The answer *is* the guard metric for gate 6.

## Tiers

- **Green** — passes all seven plus the pre-mortem. Frame it now.
- **Amber** — fails only on gate 1 or 6, and the failure has a named promotion (usually: a calibrated `judge-panel`, or a held-out harness yet to be built). Worth building toward.
- **Red** — fails gate 5, or fails 1/6 with no promotion in sight. Keep human; do not loop.

The dangerous case is not red. It is a target that *looks* green and fails the pre-mortem silently — the number climbs while the goal rots. In a lending system, anything on a money or compliance path is treated red until a guard and a ratification gate prove otherwise.
