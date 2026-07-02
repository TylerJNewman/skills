# Designing A Johnny.Decimal System

Read this only for new system design.

## Inventory

Gather everything the system must hold before drawing structure: files, notes,
email, physical items, bookmarks, tasks, and open constraints. Ask for the major
areas of the user's life or work only when they are not obvious from the
material.

## Categories First

Cluster inventory into categories, then group categories into areas. Top-down
design is acceptable when the user already thinks in areas.

Category rules:

- Prefer fewer, broader categories. Narrow overlapping categories create slow
  placement decisions.
- A category is where the user does a kind of work.
- Leave empty numbers. Do not allocate all categories or areas on day one.
- Name for the future self: descriptive enough to search for later.

Area rules:

- Areas are broad domains of life, work, or expertise.
- If an area appears to need more than 10 categories, split the area or broaden
  the categories.

## Standard Zeros

Reserve standard zeros everywhere. Create only the folders the user will use now,
usually `.01 Inbox`, `.09 Archive`, and `00.00 JDex`. Name them explicitly:
`15.01 Inbox for category 15`.

Placement ladder, most specific first:

1. proper ID
2. category zero, e.g. `15.01`
3. area zero, e.g. `10.01`
4. system zero, e.g. `00.01`

`00.00` holds the index itself or a pointer to where it lives. Record design
decisions there.

## Seed IDs

Create IDs only for things that exist in the inventory. Regular IDs start at
`.11`. Recent things may have higher numbers; do not renumber just to sort.

## Migration Via Inboxes

From chaos to organized in two passes:

1. Bulk-move everything into the best-guess category inbox (`AC.01`).
2. Later, empty each inbox item by item into proper IDs.

Inboxes must trend toward empty. Anything permanently unsortable goes to `.09`
Archive. Deletion is allowed only when the user explicitly chooses it.

Use the move manifest from `SKILL.md` for both passes. Every inventoried item
gets exactly one disposition; report remaining inbox/archive backlog at the end.

## JDex Formats

- One note per ID: default when the user already has a notes app.
- Single file: `00.00 Index.md`, one line per entry, best for machine-readable
  checks.
- Database: only if the user already wants queryable metadata and accepts the
  admin cost.

## Required Output

Deliver the proposal in this shape:

```md
# Proposed Johnny.Decimal system
## Assumptions
## Areas
## Categories
## Initial IDs (with standard zeros included)
## JDex starter entries
## Naming conventions
## Librarian / ownership
## Migration plan (manifest)
## Open decisions
```
