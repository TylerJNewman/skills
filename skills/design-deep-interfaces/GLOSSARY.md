# Glossary — Deep Interface Design

The vocabulary for designing human-facing interfaces that absorb complexity without hiding truth. Terms are exact; use them consistently across reviews, specifications, prototypes, and implementation.

## Interface

Everything a user must perceive, know, decide, remember, or do to obtain an outcome. It includes sequence, language, defaults, timing, feedback, errors, help, and recovery—not only visible controls.

## Implementation

The mechanism behind the interface: data structures, rules, services, workflow engines, integrations, permissions, and internal classifications. Implementation may remain hidden unless it affects **operational truth**.

## Deep Interface

An interface that produces high **outcome leverage** with low **user burden**, while keeping operational truth, agency, and recovery intact. A sparse but opaque interface is not deep.

## Action Surface

The information and actions available to the user in the current state. The action surface should contain what the current decision needs, not the system's entire capability inventory.

## Outcome Leverage

The amount of meaningful domain progress produced by each user decision or action.

## User Burden

The work imposed on the user: decisions, recall, interpretation, navigation, data entry, waiting, interruption recovery, and exposure to error. Fewer clicks can still create more user burden.

## Operational Truth

Information that can change a user's decision: current state, affected entity, consequence, commitment, timing, cost, uncertainty, provenance, permission, reversibility, and what has already changed. Hide mechanism; never hide operational truth.

## Domain Language

The words users use to describe their work, entities, outcomes, and exceptions. Internal architecture and database language are not domain language unless users genuinely use them.

## Legible

A state in which meaning, status, consequence, and available action can be perceived without reconstructing the implementation or consulting external documentation.

## Calm

An attention hierarchy in which normal operation stays quiet and peripheral, while exceptions gain salience in proportion to importance, urgency, and actionability.

## Forgiving

A property of an interface that prevents predictable mistakes where possible and makes detection, correction, reversal, and resumption straightforward where prevention is impossible.

## Coherent

A property in which language, information structure, appearance, and behavior express the same domain model. Coherence is the structural source of aesthetic quality.

## Engagement

Attention voluntarily sustained by orientation, progress, responsive feedback, and meaningful control. Time spent, compulsive return, false urgency, and decorative stimulation are not engagement.

## Attention Contract

The rule governing when an interface may demand attention: stable context belongs in the **periphery**, the current decision belongs in the **center**, and only urgent, consequential, actionable exceptions may **interrupt**.

## Periphery

Information the user remains aware of without attending to directly: stable context, normal status, location, ownership, and background progress.

## Center

The decision, comparison, or action that currently deserves deliberate attention.

## Interrupt

A demand that forcibly moves information into the center. An interrupt is justified only when the matter is urgent, consequential, and actionable.

## Signal

Information that can change the current decision or action.

## Noise

Information that competes for attention without changing the current decision or action. A fact can be useful in one state and noise in another.

## Locality

The concentration of decision-relevant information and action in one coherent interaction context. Locality is cognitive, not merely spatial; one long screen can have poor locality, and a short sequence can have good locality.

## Progressive Disclosure

Moving secondary detail or choices out of the center until they become relevant, while preserving discoverability, information scent, and the ability to inspect material defaults.

## Information Scent

The cue that lets a user predict where an action leads and what result it will produce before committing to it.

## Human Judgment

A decision requiring the user's intent, interpretation, authority, value trade-off, or knowledge unavailable to the system.

## System Choice

A decision the system can make from reliable context. A system choice may be defaulted, inferred, or automated when it is safe, observable, and reversible.

## Exception

A state in which the normal rule or path no longer applies and the user may need additional information, authority, or action.

## Critical Task

A user task whose incorrect performance or omission could cause material harm, financial loss, rights loss, safety risk, or an unrecoverable commitment.

## One-Way Door

An action that is impossible, costly, slow, or institutionally difficult to reverse.

## Guardrail

A design measure that removes an invalid or hazardous action, constrains it to safe conditions, or makes the correct action easier than the dangerous one.

## Recovery

The path by which a user detects what happened, diagnoses the problem, corrects or reverses it when possible, and returns to useful work.

## Resumption Point

A durable cue that restores context after interruption: saved state, current step, outstanding decision, last completed action, and the next safe move.

## Accelerator

A shortcut for practiced users that preserves the same domain model and semantics as the ordinary path without burdening novices.
