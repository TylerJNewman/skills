# Growing A Full System

Read this only when the standard `AC.ID` shape no longer fits.

## Decision Order

1. Can the existing system be compressed or clarified? If yes, redesign instead
   of expanding.
2. Is one existing ID repeated? Use `AC.ID+ Title`.
3. Does one area need more than 10 categories or a natural deeper hierarchy?
   Expand one area.
4. Are there distinct systems that share a domain or JDex and create ambiguous
   IDs? Use `SYS.AC.ID`.

## Extend The End: `AC.ID+`

Use for one ID that repeats or a JDex note grown too long.

- New index entries look like `11.63+ Wendy`.
- Filesystem child folders look like `+ Wendy/` inside the parent ID.
- The parent `AC.ID` must already exist.
- Every child gets a JDex entry.
- Reuse existing codes when they exist.
- Frequent `+` use means the design is wrong; split the category or expand one
  area.

## Expand One Area

Use for a hierarchy that genuinely breaks the standard shape: clients by
products, years by semesters by courses, or similar.

- Expand a single area; everything else stays standard.
- Everything inside keeps the area number or prefix.
- Use alphabetic order where names sort naturally.
- Use dates where time is the anchor.
- Stop using numbers below the level where they help navigation.
- Use natural hierarchies instead of forcing area/category/ID.
- Template repeated shapes in tens (`10 Brief`, `20 Draft`, `60 Final`).
- Use existing codes before inventing any.
- Do not combine with `AC.ID+`; the expanded area no longer has standard IDs to
  extend.

Document the scheme in `00.00`:

```md
## Why standard AC.ID failed
## Why this expansion is smaller than the alternatives
## Area chosen and code scheme
## JDex impact
```

## Multiple Systems: `SYS.AC.ID`

Use only for distinct systems whose IDs collide in a shared domain such as one
notes app, one drive, or one JDex. Do not use multiple systems as overflow for a
poor design.

- Identifier: one uppercase letter and two digits, e.g. `H01`, `W01`, `D25`.
- Isolated domains do not need identifiers.
- Filesystem: one root per system, e.g. `D25 Johnny.Decimal/`; folders inside
  stay plain `AC.ID`.
- Shared JDex: every entry carries full `SYS.AC.ID`.
- Files distributed outside the system may benefit from full `SYS.AC.ID` in the
  filename.
