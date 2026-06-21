# Cases — recognizing and testing laws

This is diagnostic reference for [`distill-law`](SKILL.md). Read it when a probe is ambiguous, a gate fails for an unclear reason, or an alien-domain transfer is hard to construct. The catalog itself lives in [`LAWS.md`](LAWS.md).

## Case index

| Gate or handle | Case |
|---|---|
| Bite | **Ablation** |
| Ambiguous probe | **Stained glass** |
| Variety gap | **Lossy key** |
| Compression | **Blow-up** |
| Transfer | **Phrase book** and **Marble split** |
| Probe placement | **Model disagreement** |
| Fast application | **RPD** |

## Cases — leading words and evidence class

The label states what kind of support the case provides; a parable or study summary is a probe generator, not a bundled primary source.

### Ablation — Wood's prism (1904)

**Evidence class:** historical case summary

N-rays drew roughly 300 papers from about 100 scientists, all confirming a spark that supposedly brightened under an invisible force. Robert Wood quietly removed the aluminium prism said to generate the rays; the team continued reporting positive readings.

**Rule:** remove the component a claim rests on and observe the result. If the claimed function survives removal, the claim that the component is necessary fails under the tested conditions. Redundancy or compensation may still preserve a causal contribution. This is Bite aimed at a mechanism.

### Stained glass — theory-ladenness

**Evidence class:** study summary

Weak bottom-up signal invites top-down expectation to complete the picture: students report the heavier ball landing first; early astronomers drew Saturn through inherited forms. Strong signal can break the prior; ambiguity is the opening.

**Rule:** name a concrete observable and a binary pass/fail rule. Sharpen until a result could contradict the reader's expectation.

### Requisite variety — the lossy key (greenhouse)

**Evidence class:** constructed parable

A climate controller represented temperature as `cold / optimal / hot` and dropped the derivative. During an arctic front, temperature fell from 75 to 66 while remaining “optimal”; the controller did nothing until pipes froze. The merged states required different actions.

**Rule:** a representation must retain every distinction whose loss could change viable action, especially rates of change. This is a Variety Gap and an instance of Policy-Sufficient Compression.

### Blow-up — the finite agent (hospital database)

**Evidence class:** constructed parable

A negative rule—do not assign an engineer to a critical task unless senior-certified—was forced into purely positive form. The system attempted to enumerate every permitted pairing; a compact constraint expanded into millions of cases and overwhelmed the finite machine.

**Rule:** keep one boundary, one quantity, and one negation. If completeness requires enumerating safe states, narrow the seam, retain the negative rule, or leave the competence tacit.

### Phrase book — far transfer

**Evidence class:** study summary

On letter-string analogies, systems can match a familiar alphabet yet degrade on Greek or invented symbols because they copy surface tokens rather than the transformation. The structural test is whether the construction survives a change of representation.

**Rule:** instantiate the candidate in an alien domain. If only the source symbols survive, keep it as an instance rather than promoting it to a law.

### Marble split — import structure, not accidents

**Evidence class:** constructed parable

“Stuck is a marble in a rut; shake the board” recommends pressure. It may help a rut but worsen depletion. The misfire reveals that one label hid two states with opposite viable actions.

**Rule:** when transfer reverses the prescription, split the quantity or boundary instead of forcing the old map.

### Model disagreement — the discriminating probe

**Evidence class:** worked hypothetical

To distinguish “bad messaging” from “broken product,” test where the models predict different outcomes: ship clear messaging. Continued failure weakens the messaging model; success weakens the product model. A test where both models predict the same result buys little inference.

**Rule:** place the probe at maximum model disagreement.

### RPD — recognize, simulate, execute

**Evidence class:** study summary

Under time pressure, experts often match a situation to a prototype, simulate one action against constraints, and execute if no catastrophic failure appears. They diagnose when the prototype does not fit and invent when the standard action is blocked.

**Rule:** treat the law as a recognition handle and the probe as the forward simulation before shipping.

## Interface diagnostics

These are **diagnostic probes**, not catalog peers. Use them to locate how orchestration leaked, then derive or apply **Domain-Deep Surface** through the main procedure.

| View | Probe | Leak located |
|---|---|---|
| **Depth** | *Does this surface do substantial work behind a small interface?* | machinery exposed as surface area |
| **Deletion** | *If this disappears, does user agency disappear, or only our anxiety?* | defensive UI without causal value |
| **Leak** | *Is this word from the user's domain or the implementation?* | vocabulary on the wrong side |
| **Locality** | *Can the user finish here, or must they hunt across surfaces?* | one task split across locations |
| **Variety** | *Is the system absorbing complexity, or dumping it into the user's head?* | coordination burden transferred to user |
| **Seam** | *Is this a real user decision or configuration of our internals?* | internal choice disguised as domain choice |
| **Default** | *Could the system choose safely for most cases and disclose exceptions only when needed?* | avoidable decision burden |

Depth, Locality, Leak, and Variety are the primary views under **Domain-Deep Surface**: the user touches the domain, not the machinery. Deletion, Seam, and Default are supporting diagnostics.

## Worked candidates

These show the generator running. They are not catalog entries until the admission branch in [`LAWS.md`](LAWS.md#catalog-admission) assigns a disposition and writes a selection receipt.

### Reversibility

- **Boundary:** committed action / user recovery
- **Conserved quantity:** reversibility
- **Correct side:** the action-producing system
- **Observable:** the action can be undone in the same context, or irreversibility is disclosed before commitment
- **Probe:** *If the user does this wrong, can they undo it here?*
- **Fires when:** irreversibility is silent or recovery requires escalation.
- **Vetoes:** shipping the action without in-place undo, a confirmation boundary, or explicit irreversibility.
- **Bite:** changes delete, payment, publish, send, and permission designs.
- **Transfer:** applies to software, contracts, operations, and physical workflows.
- **Compression:** one boundary, one quantity, one failure condition.
- **Disposition:** admit — one-off gates pass; catalog relation and receipt remain unresolved.

### Freshness

- **Boundary:** source value / decision-facing display
- **Conserved quantity:** evidence freshness
- **Correct side:** the presenting surface
- **Observable:** age, capture time, or validity window is visible and tied to the shown value
- **Probe:** *Does the surface disclose how old this value is?*
- **Fires when:** stale data is presented as current.
- **Vetoes:** a decision-facing value without age, validity, or refresh behavior.
- **Bite:** changes dashboards, caches, prices, inventory, and model outputs.
- **Transfer:** applies wherever users decide from time-sensitive information.
- **Compression:** one boundary, one quantity, one failure condition.
- **Disposition:** admit — one-off gates pass; catalog relation and receipt remain unresolved.
