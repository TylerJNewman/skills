---
name: daily-codex-audit
description: "Review recent Codex/agent work from receipts and produce a daily audit: what failed, what worked, what evidence supports it, and which process changes remain candidates. Use for daily or retro review of Codex sessions, logs, notes, tests, diffs, and local receipts. Do not use for greenfield loop design, automation authoring, or multi-day process promotion."
---

# Daily Codex Audit

## Rule

Receipts first. Mechanism before machinery.

Use local logs, notes, grep, jq, tests, and packx before Oracle.
Use orchestration for coordination, not for transporting large context.
No receipt, no critique.

## User Interface

Expose a small goal-shaped interface. Treat omitted details as defaults.

Good prompts:

```text
Use $daily-codex-audit.
```

```text
Use $daily-codex-audit for yesterday.
```

```text
Use $daily-codex-audit on these receipts: [paths].
```

Default behavior:

- audit the requested day, or today when unspecified
- discover local receipts
- produce `audit-findings.md`
- record learning candidates without promoting them
- avoid promotion, doctrine edits, or automation authoring

Do not ask the user to choose how the audit is internally split, stored, packaged, or verified unless that choice changes real user agency.

## Scope

Audit the requested Codex agent work for:

- Prompting: vague, redundant, oversized, or under-specified goals
- Loops: repeated attempts, stale debugging, weak convergence
- Missing gates: absent test, lint, code-review, architecture-review, or proof gate
- Sequencing: places where verification should have preceded implementation
- Parallelism: work that should or should not have been split
- Tooling: overuse or underuse of skills, Oracle, packx, cmux, jq, grep, tests, scripts, hooks, and local inspection
- Loop anatomy: missing trigger, state store, verifier, stop rule, budget, escalation path, or receipt
- State transitions: unclear before/after state, lost constraints, stale assumptions, untracked decisions, or mutation without proof
- Verifier quality: same-agent self-checks, weak LLM judges, absent deterministic gates, missing human gate, or checks that do not inspect cross-turn state
- Blast radius: write access, customer impact, production changes, secrets, credentials, irreversible operations, or shared files modified without approval

Prefer structured artifacts over raw chat:

- Toolsmith JSON/log receipts
- `.notes/log-gated/`
- `.notes/**/*.md`
- Codex hook outputs
- targeted Codex JSONL extracts
- test/lint/build outputs
- cmux captures only when no file receipt exists

Do not read whole raw transcripts unless a finding requires exact prompt text.

## Boundary

This is a retrospective audit skill.

It diagnoses Codex or agent work that already happened. It may recommend process changes, prompt replacements, hooks, tests, skill edits, or AGENTS.md updates, but it should not design a new automation or recurring agent loop unless the user explicitly asks.

Do not merge audit, loop design, and automation authoring into one run. Diagnose first. Propose patches second. Implement only on explicit request.

Durable always-on doctrine belongs in `AGENTS.md`. This skill should recommend an `AGENTS.md` patch only when receipts justify it.

Daily audit may record process-learning candidates, but it does not promote, reject, retire, score, or govern process rules. Every learning record must remain `status: "candidate"` until a separate periodic evolution review handles selection.

## Preflight

Set the requested audit date and output directory:

```sh
AUDIT_DATE="${AUDIT_DATE:-$(date +%F)}"
AUDIT_DIR=".notes/audit/$AUDIT_DATE"
LEARNING_FILE="$AUDIT_DIR/learning-candidates.jsonl"
LEDGER_FILE=".notes/process-learning/pattern-ledger.jsonl"
mkdir -p "$AUDIT_DIR/workers" .notes/process-learning
: > "$LEARNING_FILE"
touch "$LEDGER_FILE"
```

Check available tools:

```sh
command -v packx || true
command -v cmux || true
command -v jq || true
command -v oracle || true
```

Inventory likely receipts without dumping large files:

```sh
find .notes -maxdepth 4 -type f 2>/dev/null | sort
find ~/.codex/sessions -path "*$(printf '%s' "$AUDIT_DATE" | tr '-' '/')*" -type f 2>/dev/null | sort
```

If a command differs on the machine, inspect `--help` and use the smallest equivalent. Do not improvise a broad search over the whole filesystem.

## Bundle

When `packx` is available, preview first:

```sh
packx --preview -s "Toolsmith logs JSON receipts .notes"
```

If the preview is under the context limit, write one bundle:

```text
.notes/audit/$AUDIT_DATE/audit-bundle.md
```

If the preview is too large, create smaller axis-specific bundles:

```text
.notes/audit/$AUDIT_DATE/prompt-bundle.md
.notes/audit/$AUDIT_DATE/loop-bundle.md
.notes/audit/$AUDIT_DATE/tool-bundle.md
```

Use `jq`, `rg`, `grep`, timestamps, filenames, and log keys to extract only relevant records.

Do not paste the same large bundle into multiple agents. Pass paths.

## Oracle Gate

Use Oracle only when:

- the filtered local bundle still exceeds usable context
- architecture judgment is central
- evidence conflicts and needs independent synthesis
- the user explicitly asks for Oracle

Oracle is for read-heavy synthesis only.

Do not use Oracle for:

- local file discovery
- grep/jq parsing
- cmux management
- small edits
- routine validation
- final verdicts without local receipts

Oracle output is one receipt source, not authority.

## Orchestration Gate

If there are multiple sessions or log groups, use parallel review only when the expected information gain exceeds coordination cost.

Preferred order:

1. serial manager review for small evidence sets
2. native Codex subagents when available, explicitly requested, and suitable for read-only parallel review
3. cmux worker panes when terminal orchestration, non-Codex tools, or screen captures are required

Use exactly three reviewer lanes unless the user asks otherwise:

- `prompt-auditor`
- `loop-auditor`
- `tool-auditor`

The orchestration layer is not the data plane. Workers read files and write files.

Do not use panes, chats, or subagent transcripts to transport large context. Pass bundle paths and receipt paths instead.

When using cmux, create panes, send concise commands, inspect status, and clean up. Workers should read bundle files and write result files.

## Loop Anatomy Check

For each audited task or session, reconstruct the loop before critiquing it.

Use this template when receipts allow:

```text
Task/session:
Trigger:
Initial prompt:
Source of truth:
Inputs used:
Durable state:
Actor:
Tools used:
Verifier:
Stop condition:
Budget/cap:
Escalation path:
Output receipt:
Final state:
```

Flag a loop defect only when the missing or weak component is visible from receipts.

A valid loop has at least:

1. a bounded task,
2. a source of truth,
3. durable state or an explicit reason state was unnecessary,
4. a verifier,
5. a stop rule,
6. a receipt.

No verifier, no loop. If receipts are incomplete, mark the loop unverifiable instead of inventing a defect.

## Worker Goals

### prompt-auditor

Find weak prompts:

- vague goals
- missing success criteria
- excessive method prescription
- redundant restatement
- under-specified constraints
- "do everything" prompts
- places where a smaller target would have converged faster

### loop-auditor

Find loop-integrity failures:

- missing trigger, state store, verifier, stop rule, budget, or escalation path
- repeated attempts without new evidence
- ignored error messages
- skipped tests
- missing reproduction
- broad debugging before narrow verification
- implementation before assumption checks
- absent rollback or stop condition
- stale state carried across turns
- unclear final state
- same-agent self-judgment presented as proof

### tool-auditor

Find tool inefficiency:

- excessive Oracle calls
- missed jq/grep/test/script opportunities
- overused skills
- unnecessary cmux, subagent, or worker fanout
- missed parallel review opportunity when evidence was separable and read-only
- parallel review where serial review would have been cheaper
- missing hooks or deterministic gates
- tool-call sequences with low information gain
- places where a local receipt beat model reasoning

## Worker Protocol

Each worker receives:

- its role
- path to its bundle or filtered inputs
- receipt standard
- finding category: prompt, loop, gate, state, verifier, sequencing, parallelism, or tool
- output path

Each worker writes to:

```text
.notes/audit/$AUDIT_DATE/workers/<worker-name>.md
```

Each worker returns at most 7 findings.

Each finding must include:

```md
- Receipt:
- Category:
- Finding:
- Cost:
- Better move:
- Replacement prompt or command:
```

If there is no receipt, omit the finding.

## Receipt Standard

Valid receipts include:

- Toolsmith JSON event or tool-call sequence
- Codex JSONL record extracted by `jq`
- `.notes/log-gated/` entry
- concrete prompt text from a structured log
- test/lint/build command and output
- git diff or commit reference
- cmux `read-screen --scrollback` capture when no file exists
- Oracle excerpt only if Oracle passed the gate

Invalid receipts:

- memory
- vibes
- "the conversation seemed"
- generic best practice
- uncited summary of a long transcript

## State-Transition Audit

For any multi-turn or tool-heavy run, inspect the state transition, not only the final answer.

Check:

- What was believed before the action?
- What changed?
- What invariant had to remain true?
- What evidence confirmed the change?
- What assumption became stale?
- What approval or gate should have preceded mutation?
- What rollback existed?

Prefer findings about state loss over prose quality. A polished final answer with corrupted state is still a loop failure.

## Verifier Taxonomy

Classify the verifier used:

| Verifier | Strength |
|---|---|
| Deterministic test/lint/build/typecheck | Strong |
| Reproduction command | Strong |
| Diff review against stated requirements | Medium |
| Independent worker review with receipts | Medium |
| Oracle synthesis with local receipts | Medium |
| Same-agent self-review | Weak |
| Unrubriced LLM judge | Weak |
| Human vibe check without cited evidence | Invalid for audit findings |

A verifier must check the relevant failure mode. A test that does not exercise the changed path is not a gate. An LLM judge that only reviews prose is not a state verifier.

## Manager Synthesis

Read worker files, not just terminal screens.

Create:

```text
.notes/audit/$AUDIT_DATE/audit-findings.md
```

Use this structure:

```md
# Daily Codex Audit - YYYY-MM-DD

## Review goal

[One sentence: what was audited and what counts as complete.]

## Executive pattern

[The dominant efficiency leak, supported by receipts.]

## Per-conversation findings

### [Conversation / task / session]

- **Receipt:** [path, JSON key, command, or excerpt]
- **Finding:** [specific critique]
- **Cost:** [tokens, time, rework, risk, or missed convergence]
- **Better move:** [specific alternative]
- **Replacement prompt/command:** [only when useful]

## Cross-cutting patterns

[Only patterns supported by multiple receipts.]

## Tomorrow's compounding changes

1. [Highest leverage change]
2. [Second highest leverage change]
3. [Optional third]

## Learning candidates

Write matching JSONL rows to `.notes/audit/YYYY-MM-DD/learning-candidates.jsonl`.

### Wins

[Receipt-backed mechanisms that may deserve reinforcement.]

### Losses

[Receipt-backed mechanisms that may deserve guardrails.]

### Near misses

[Failures caught before damage.]

### Counterexamples

[Cases where an existing rule, habit, prompt, or skill instruction failed.]

### Baseline / opportunity notes

[Eligible opportunities that help future reviews compute denominators.]

## Process patch candidates

List only candidate patches justified by receipts. These are recommendations, not promotions or implementations.

| Patch target | Proposed change | Receipt |
|---|---|---|
| AGENTS.md | [Durable repo rule] | [receipt] |
| Skill | [Skill instruction update] | [receipt] |
| Hook/test | [Deterministic gate] | [receipt] |
| Automation | [Trigger/budget/stop change] | [receipt] |
| Prompt template | [Replacement prompt] | [receipt] |

Do not recommend a process patch candidate unless the same failure appeared twice, or once with high blast radius.

## Appendix

- Bundles read:
- Worker outputs:
- Oracle used: yes/no and why
- cmux used: yes/no and why
```

## Process Learning Candidates

At the end of the audit, write receipt-backed learning candidates to `.notes/audit/$AUDIT_DATE/learning-candidates.jsonl`, then append valid candidate records to `.notes/process-learning/pattern-ledger.jsonl`.

The append is mechanical candidate capture only. Do not change status, compute scores, promote rules, retire rules, or update doctrine.

Read `references/process-learning-candidates.md` only when writing or appending learning candidate records.

## Cleanup

After worker outputs are saved and read:

- close worker panes
- keep `audit-bundle.md`, worker reports, and `audit-findings.md`
- do not delete source receipts
- note any missing evidence explicitly

## Decision Rules

Use the cheapest adequate move:

1. local receipt
2. targeted jq/grep
3. packx bundle
4. serial axis review
5. three cmux workers
6. Oracle read-heavy synthesis

Stop escalating once the next tool adds coordination cost without new evidence.

### Loop Recommendation Rules

Recommend a recurring loop only when receipts show the work is:

- recurring
- bounded
- inspectable
- reversible or sandboxed
- supported by a source of truth
- checkable by deterministic gate, independent review, or explicit human approval

Do not recommend autonomous action when the work is:

- one-off and strategic
- irreversible
- permission-sensitive
- legally, financially, or customer-impacting
- dependent on taste, negotiation, hiring, or business judgment
- missing a credible verifier

When recommending a loop, classify the highest safe autonomy level:

1. Manual prompt
2. Checklist/SOP
3. Draft loop with human approval
4. Scheduled read-only triage
5. Sandbox/worktree action with verifier
6. Auto-action only after deterministic gate

Default to levels 2-4. Level 5 requires receipts. Level 6 requires reversibility and a deterministic gate.
