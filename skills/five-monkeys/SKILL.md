---
name: five-monkeys
description: Find state bugs and UX dead ends through five adversarial user perspectives. Use for "5 Monkeys", "five monkeys", or a requested adversarial QA swarm on an app or feature.
---

# Five Monkeys

Try to break the feature's state, not just complete its happy path. Take the target and existing authorization from the conversation. Default to a QA report; fix issues when fixes are already requested.

## Establish the playground

Identify the feature, environment, expected behavior, and safe test data. Read the relevant app and browser instructions. Verify the active account and target before authenticated testing; each worker must establish its own actual access rather than assume cookies are shared. Use disposable local/test records for mutations. A QA request alone does not authorize real sends, purchases, deletes, or production data changes.

Walk one normal flow to establish a baseline, then cover five lenses:

| Lens | Attack |
| --- | --- |
| Expert power user | Keyboard shortcuts, bulk operations, unusual operation order, repeated mode switches. |
| First-time user | Empty states, unclear labels, defaults, missing context, getting lost and recovering. |
| Low-confidence user | Plain-language comprehension, keyboard-only navigation, zoom, mistakes and recoverability. |
| Impatient user | Rapid/repeated clicks, double submission, typing before loading ends, back/forward mid-flow. |
| Interrupted user | Abandon and resume, refresh, two tabs, stale state, session expiry or offline recovery where safely testable. |

Delegate independent lenses to available workers when supported, within the current worker limit; run remaining lenses sequentially. Give workers the same target and expected behavior, distinct test records, and report-only ownership so fixes do not collide. A single agent can cover all five lenses. Report uncovered lenses explicitly.

## Explore and verify

For each lens, exercise a few high-value deviations: partial input, misspellings, rapid toggles, cancellation, retry, navigating away and returning. Adapt these to the actual feature instead of running an irrelevant checklist. Check visible state against persistence/readback when the flow saves data. UI success alone does not establish that a save worked.

Reproduce suspected failures before reporting them as bugs. Separate observed failures, usability friction, and untested hypotheses. Capture the exact route, starting state, actions, expected/actual result, and a screenshot/log/readback when useful. If access or tools prevent execution, label the result as a review, not executed QA.

Deduplicate by root cause and keep actionable findings. When fixing is in scope, finish discovery first, inspect every caller of the shared function being changed, apply the smallest root-cause fix, and rerun the reproducer. Leave one focused regression check for stable non-trivial logic. Keep exploratory UI notes disposable rather than adding brittle tests for every click.

## Deliver

Write a fresh numbered report in the project's existing scratch area (for example `.notes/qa-01.md`); use a temporary folder when the project has no scratch convention. Do not overwrite another run.

Include:
- Target, environment/account context without credentials, and executed lens coverage.
- Useful findings ordered by impact, each with reproduction and evidence; mark fixed, open, or unverified.
- One easy manual QA walkthrough with the exact link or artifact, input, and binary expected result.
- Material coverage gaps. Zero findings means none observed within this coverage, not proof of no bugs.

End with the report link and the few findings or blockers the user needs to act on.
