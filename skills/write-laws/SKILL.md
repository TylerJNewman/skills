---
name: write-laws
description: Write falsifiable laws into the Basic Memory law project. Use when Codex needs to create, update, or teach law notes/lenses/coding principles in the law memory project, especially from transcripts, Oracle reviews, distill-law outputs, source documents, or conversation receipts; requires provenance, original source paths, source anchors, examples, index.md updates, and append-only log.md entries.
---

# Write Laws

Write law notes so a future agent can recover the same law from the same source.
Do not store free-floating advice. Every law needs provenance, source anchors,
examples, and a logged write receipt.

## Required Output

For every law write, ensure the law project has:

1. A law note with:
   - law name
   - compact explanation
   - when to use it
   - concrete example
   - how to apply it
   - probe or review question
   - veto / decision changed
   - source anchors
   - observations and relations
2. A source receipt note with:
   - original source path or URL
   - source type, date if known, and extraction context
   - Oracle/session/model receipts when used
   - bundle or artifact paths when used
   - caveats, truncation, or scope limits
3. `index.md` updated with content-oriented links and one-line summaries.
4. `log.md` appended with a parseable chronological entry:

```markdown
## [YYYY-MM-DD] ingest | Title
```

or:

```markdown
## [YYYY-MM-DD] update | Title
```

## Provenance Rules

Never write or update a law note without source anchors.

Use the strongest available anchors:

- Transcript: timestamp ranges and speaker names.
- Code: file paths and line numbers.
- Docs/PDF/articles: path or URL plus heading, page, section, or quote-safe excerpt.
- Oracle/agent review: session slug, answer path, bundle path, model, and verification status.
- Conversation-only source: pasted attachment path or receipt path; avoid relying on memory.

Keep source excerpts short. Prefer paraphrase plus exact location.

If a law is generalized beyond the source, say so explicitly:

```markdown
The law is an abstraction over these source moments, not a direct quote.
```

## Basic Memory CLI

Use the Basic Memory CLI when available:

```bash
basic-memory tool write-note --project law --local --overwrite \
  --title "Title" --folder "laws" --tags "law,..." --content "..."
```

Append logs with:

```bash
basic-memory tool edit-note "log" --project law --local \
  --operation append --content "$LOG_ENTRY"
```

Verify with:

```bash
basic-memory project ls --name law --local
rg -n '^## \[[0-9]{4}-[0-9]{2}-[0-9]{2}\]' /path/to/law/memories/log.md
```

If the CLI cannot access `~/.basic-memory` because of sandbox permission
hardening, use a temp config and register only the law project:

```bash
rm -rf /private/tmp/basic-memory-law-config
mkdir -p /private/tmp/basic-memory-law-config
BASIC_MEMORY_CONFIG_DIR=/private/tmp/basic-memory-law-config \
  basic-memory project add law /Users/tyler/code/law/memories --local --default
```

Then prefix Basic Memory commands with:

```bash
BASIC_MEMORY_CONFIG_DIR=/private/tmp/basic-memory-law-config
```

## Law Note Shape

Use this shape unless the existing note has a clearer local pattern:

```markdown
# <Law Set or Law Name>

<What this note contains and where it came from.>

## Laws

### <Law Name>
<One or two sentence explanation.>

When to use it: <triggering situation>.

Example: <concrete coding/workflow example>.

How to apply it: <what to do during design/review>.

Probe: <yes/no check with pass/fail rule>.

Vetoes: <minimal decision a failed probe changes>.

Source anchors: <timestamp/path/section anchors>.

## Source Anchors
- <anchor>: <what happened there and which law it grounds>.

## Observations
- [law] <atomic fact> #tag
- [example] <atomic usage example> #tag
- [source] <source fact> #tag

## Relations
- derived_from [[Source Receipt]]
- indexed_by [[index]]
- logged_in [[log]]
```

## Source Receipt Shape

```markdown
# <Source Title>

<What source was processed, why, and what was extracted.>

## Source
- Original: `<path-or-url>`
- Type: <transcript | code | article | Oracle answer | conversation receipt>
- Date: <date or unknown>
- Extraction: <who/what produced the laws>

## Receipts
- <artifact path, Oracle slug, bundle path, model, command, etc.>

## Caveats
- <missing context, truncation, uncertainty, or scope limits>

## Observations
- [source] <atomic source fact> #source
- [receipt] <atomic receipt fact> #receipt

## Relations
- sources [[Law Note]]
- logged_in [[log]]
```

## Index And Log

`index.md` is content-oriented. Keep it short:

- Laws: law notes with one-line summaries and source counts.
- Sources: source receipt notes with original source paths.
- Logs: link to `log`.

`log.md` is append-only and chronological. Do not rewrite old entries unless
fixing a typo that blocks parsing. Every write or material update gets one
entry with the parseable heading format.

## Quality Gate

Before final response, verify:

- law note exists on disk
- source receipt exists on disk
- law note has `## Source Anchors`
- every law has at least one source anchor, example, and probe
- `index.md` links to the law note and source receipt
- `log.md` has a new parseable entry
- Basic Memory CLI can list the law project, or you report why CLI verification was blocked

If any item fails, fix it before claiming completion.
