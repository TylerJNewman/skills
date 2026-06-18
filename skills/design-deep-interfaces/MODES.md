# Interface Modes and Risk Overlays

Read only the sections matching the interface. Apply multiple sections when a product crosses channels; for example, a financial work queue uses **Graphical / HTML**, **Queue / Dashboard**, **High-Stakes**, and **Financial**.

## Graphical / HTML

- Arrange the surface by user task and domain state, not by database or implementation structure.
- Use semantic HTML, logical reading and focus order, visible focus, programmatic labels, and status announcements.
- Make every action operable by keyboard; do not encode meaning through color, hover, gesture, or position alone.
- Use alignment, grouping, typography, spacing, and order before adding color or decoration.
- Keep loading, empty, success, error, disabled, stale, and permission states explicit; preserve entered data through failure.
- Use tables when comparison is the job. Do not turn comparable records into cards merely for visual novelty.
- Let progressive disclosure remove competition without erasing the route to details, settings, or material defaults.
- Support zoom, reflow, responsive layouts, large targets, and reduced motion appropriate to the intended users.

## CLI

- Use domain verbs and nouns with one consistent command grammar. Prefer memorable full names; abbreviations are accelerators, not the only route.
- Provide useful `--help` at every level, concrete examples, typo suggestions, and discoverable next actions.
- Make current state and resulting change inspectable. Use diff, preview, or `--dry-run` before material mutations.
- Separate human output from stable machine output such as `--json` or `--plain`; use stdout, stderr, and exit codes predictably.
- Errors state the failed operation, affected object, what changed, and the repair command. Do not expose stack traces as the user explanation.
- Avoid surprise prompts, background actions, network calls, or telemetry. Non-interactive use must be explicit and safe.
- Make retries idempotent where possible; handle interruption and partial failure without ambiguous state.
- Be quiet when success is self-evident; otherwise return a concise receipt and the next useful action.

## Conversational / Voice

- Externalize the system's interpretation, material assumptions, and confidence before consequential action.
- Ask only the smallest question that resolves the current ambiguity; do not conduct an implementation questionnaire.
- Keep a compact, persistent state summary for long or multi-step work.
- Confirm one-way doors with concrete entities, values, timing, and consequences—not a generic “Are you sure?”
- Let users correct, cancel, back up, and replace prior input without restarting.
- Never bury commitments, fees, permissions, or state changes inside prose.
- For voice, keep choices few, repeat critical values, and provide an alternate visual or textual receipt when possible.

## Queue / Dashboard / Monitoring

- Rank work by consequence, urgency, and actionability—not raw recency or status count.
- Keep normal operation quiet. Surface exceptions, aging, blocked work, and ownership gaps.
- Every alert or queue item states what changed, why it matters, who or what is affected, and the next available action.
- Group and deduplicate related signals. Do not make the user acknowledge the same condition in several places.
- Preserve overview and drill-down: users should locate the system state without losing the current task.
- Make assignment, handoff, snooze, escalation, and resolution states explicit when the workflow uses them.
- Save filters, selection, scroll position, and the last handled item so interruption does not erase context.
- An alert without a plausible response path is usually status, not an interrupt.

## High-Stakes Overlay

- Identify critical tasks and plausible use errors before polishing the surface.
- Prefer designing hazards out of the interface over warnings, labels, documentation, or training.
- Test with representative users under realistic time pressure, interruption, fatigue, device, permissions, and environmental conditions.
- Keep mode, authority, affected entity, and system state continuously legible.
- Use confirmations sparingly; confirmation fatigue turns warnings into noise.
- Fail toward a known safe state. Make partial completion and residual risk explicit.
- Preserve an audit trail for material decisions and state changes.
- Treat repeated user error as evidence about the interface, not as a character judgment about the user.

## Financial Overlay

- At commitment, show amount, currency, source account, destination or counterparty, timing, fees, rate or estimate basis, and reversibility together.
- Distinguish draft, authorized, submitted, pending, settled, failed, canceled, reversed, and disputed states; “done” is rarely precise enough.
- Do not use defaults, preselection, visual hierarchy, or urgency to exploit inertia or steer users against their interests.
- Mark stale data, estimates, variable rates, delayed settlement, holds, and uncertainty where they affect a decision.
- Prevent duplicate transactions through idempotency, explicit retry state, and durable receipts.
- Put review before the one-way door; after commitment, show exactly what happened and the available recourse.
- Apply least privilege, explicit authority, and dual control where policy or risk requires it.
- Minimize exposed sensitive data while keeping the affected entity unambiguous.
