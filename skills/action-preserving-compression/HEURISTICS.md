# Heuristics Catalog

Standing catalog for [`action-preserving-compression`](SKILL.md). Read this only when admitting, reviewing, splitting, merging, or retiring handles. One-off derivations stop in `SKILL.md`.

## Admission

1. **Re-derive from receipts.** Produce every field in the `SKILL.md` output contract before comparing to the catalog.
2. **Compare structure.** Search by target, equivalence, move, probes, and counterexample.
3. **Assign one disposition.**
   - `candidate` - plausible, but receipts are thin or counterexample search is weak
   - `strengthen` - same handle, better receipts or probes
   - `split` - one handle contains cases requiring different moves
   - `merge` - two handles choose the same move for the same equivalence class
   - `retire` - later evidence shows the handle harms action or is fully replaced
   - `discard` - no distinct move, no receipts, or no useful compression
   - `catalog` - strong enough to use as a standing handle
4. **Write a mutation receipt.** Use `YYYY-MM-DD - disposition - handle - source`.
5. **Preserve rollback.** Let git track the file history; do not duplicate old full versions here.

## Entry schema

```text
### <Handle>
- Target:
- Equivalence:
- Move:
- Probes:
- Counterexample:
- Refinement:
- Receipts:
- Status: candidate | catalog
```

## Catalog

No admitted handles yet.

## Mutation ledger

| Date | Disposition | Handle | Source |
|---|---|---|---|
