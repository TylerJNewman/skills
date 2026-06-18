---
name: design-deep-interfaces
description: Deepen human-facing interfaces by reducing decision load while preserving operational truth, control, and recovery. Use when designing or reviewing web/HTML, CLI, forms, dashboards, workflows, or conversational interfaces; or when improving defaults, disclosure, attention, accessibility, and safety.
---

# Design Deep Interfaces

A **deep interface** absorbs system complexity and returns **outcome leverage** through a small **action surface**. Small means few hard decisions, not few pixels or clicks.

`depth ≈ outcome leverage / user burden`

The ratio is a design direction, not a score. **User burden** includes decisions, recall, interpretation, navigation, data entry, interruption recovery, and exposure to error.

A deep interface is **legible**, **calm**, **forgiving**, and **coherent**. Hide mechanism; never hide **operational truth**. Optimize **engagement** for progress and control, not time spent.

**Bold terms** are defined in [GLOSSARY.md](GLOSSARY.md).

## Power tests

A proposal is deeper only if it passes all seven tests.

1. **Intent test** — Does every visible term and action map to a real user outcome in **domain language**?
2. **Decision test** — Does this choice require human judgment now? If the system can choose safely, observably, and reversibly, default, infer, or automate it.
3. **Deletion test** — Remove the item or step. If agency, safety, orientation, or necessary comparison does not degrade, delete it or disclose it later.
4. **Truth test** — Are state, consequence, uncertainty, provenance, commitment, and reversibility visible when they can change the decision?
5. **Locality test** — Can the user make the current decision without remembering information or hunting across unrelated surfaces?
6. **Attention test** — Does salience match importance, urgency, and actionability? If the user cannot act, do not interrupt.
7. **Recovery test** — Can the user tell what happened, correct or reverse it when possible, and resume after interruption?

## Process

### 1. Frame the job

Read the available domain glossary, requirements, decisions, design system, support evidence, analytics, and existing interface before proposing changes. Use the language users use; implementation names stay behind the interface unless users genuinely think in them.

Write one job frame:

> `[user] needs to [domain outcome] in [context], while [stakes and constraints].`

Capture the primary user, start state, successful end state, frequency, expertise, environment, interruptions, channel, permissions, and material consequences. Distinguish what users ask for from the outcome they need.

**Complete when:** one job frame, the intended users and context, the success condition, the stakes, and all unresolved assumptions are explicit.

### 2. Build the state-and-decision map

Trace the shortest complete path from start to outcome. At each state record:

- what the user can know;
- what the user is trying to decide or do;
- what the system can decide;
- what changes after action;
- what feedback returns;
- what exceptions can occur.

Classify each choice as **human judgment**, **system choice**, or **exception**. Mark every **critical task**, **one-way door**, permission change, handoff, and **resumption point**.

For an existing interface, map every visible control and datum to a state, decision, action, comparison, safety need, or navigation need. Anything unmapped is suspect.

**Complete when:** every step and visible item has a stated purpose, every material consequence is represented, and every critical task and one-way door is marked.

### 3. Deepen the action surface

Run the seven tests against every visible item and every step.

- Replace implementation questions with domain actions.
- Collapse mechanical sequences behind one meaningful action where the system can execute them safely.
- Default or infer **system choices**; keep material defaults inspectable and overridable.
- Ask only for information unavailable to the system or requiring human judgment.
- Use **progressive disclosure** by relevance and risk, not merely by frequency.
- Preserve one mental model for novice and expert users; add **accelerators** rather than a second product.
- Remove duplicate entry, repeated confirmation, and navigation that exists only because the implementation is fragmented.

Do not trade visible complexity for mystery. Hiding mechanism is good; hiding operational truth is not.

**Complete when:** no visible item exists solely to satisfy implementation structure, every hidden choice has a safe rule, and the user retains the information and agency needed for consequential decisions.

### 4. Compose attention

Establish an **attention contract** for every state:

- **Periphery** holds stable context, normal status, and orientation.
- **Center** holds the current decision, comparison, or action.
- **Interrupt** is reserved for urgent, consequential, and actionable exceptions.

Keep normal states quiet. Let exceptions speak in proportion to consequence. A dense interface may show many facts, but only a few should compete.

Make the next useful action carry strong **information scent**. Show progress and immediate feedback. Prefer recognition over recall; preserve filters, drafts, selections, and a clear resumption point after interruption.

Use structure as the aesthetic: domain order, alignment, grouping, rhythm, typography, spacing, and restrained emphasis. Every visual or textual emphasis spends attention; spend it on meaning, progress, risk, and agency.

**Engagement** comes from orientation, visible progress, responsive feedback, and meaningful control. Do not manufacture urgency, suspense, or reward loops unrelated to the job.

**Complete when:** at every state the user can answer, without reconstructing the implementation: Where am I? What changed? What matters now? What can I do? What will happen if I act?

### 5. Make the interface forgiving

Treat predictable mistakes as design inputs. Defend critical tasks in this order:

1. remove the hazardous or invalid path;
2. constrain the action to valid states;
3. supply a safe, visible default;
4. preview the concrete consequence;
5. warn or confirm only when the remaining risk is material;
6. rely on instructions or training last.

Use undo, rollback, cancellation, idempotency, drafts, and retry-safe operations where the domain permits. Confirm one-way doors, not routine actions. Preserve user input after errors.

Errors must state what happened, what did and did not change, why it matters, and the next repair action in domain language. Material actions receive a durable receipt or audit trail.

**Complete when:** every critical or material action has prevention, unambiguous feedback, and a recovery path—or an explicit, concrete acknowledgement that it is irreversible.

### 6. Apply the medium and risk overlays

Read only the matching sections of [MODES.md](MODES.md). Apply more than one section when an interface crosses channels. Always apply the high-stakes or financial overlay when relevant.

Do not import a visual convention into CLI, a CLI convention into conversation, or a consumer convention into a safety-critical workflow without checking the medium's native expectations.

**Complete when:** the design follows the medium's conventions, remains accessible to the intended users, and accounts for automation, composability, environment, and risk where applicable.

### 7. Validate and deliver

Exercise at least these scenarios:

- ordinary completion;
- first-time user;
- practiced repeat user;
- interruption and resumption;
- empty, loading, stale, and slow states;
- invalid input and permission failure;
- retry, duplicate action, and partial failure;
- every critical task and one-way door.

Use representative users and realistic conditions when available. When evidence is missing, label the claim and propose the smallest test that could falsify it.

For a **review**, present ranked deepening candidates. For each candidate include: surface, friction, change, tests passed, operational truth preserved, safety and recovery effect, before/after, and recommendation strength (`Strong`, `Worth exploring`, or `Speculative`). End with one top recommendation.

For a **new design**, present: job frame, state-and-decision map, primary action surface for each state, defaults and disclosures, critical-task defenses, and the prototype or specification requested.

For an **implementation**, preserve the agreed model across all states, add tests at the interface seam, and report any design decision the code forced open.

Compare before and after by decision burden, time to orientation, completion, use errors, interruption recovery, and user confidence—not clicks alone.

**Complete when:** every critical task and validation scenario is accounted for, unresolved risk is visible, and the top recommendation produces the largest reduction in user burden without concealing operational truth.
