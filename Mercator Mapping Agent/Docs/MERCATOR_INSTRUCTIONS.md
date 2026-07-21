# Mercator — How To Use It

Plain instructions. For design rationale and known limitations, see `MERCATOR_SETUP.md` and `MERCATOR_TRACEABILITY.md`.

## 1. One-time setup (whoever sets up the repo)

Drop the `mercator/` folder into the repo root, so it sits alongside `src/`, `CLAUDE.md`, etc. Then confirm the PRD path in `.github/workflows/mercator.yml` actually points to wherever the PRD markdown file lives in the repo, it currently assumes `docs/PA_Status_Relay_PRD.md`, update this to match reality.

That's it. From this point on, it runs automatically. Nobody needs to manually trigger it.

## 2. What you do when you write a test

Add one comment line directly above the test, in whatever comment syntax your language uses:

```typescript
// @covers: User can view a list of mock PA cases with key metadata
test("renders case list with metadata", () => { ... });
```

```python
# @covers: User can Reset a case to its seeded baseline state
def test_reset_restores_baseline():
    ...
```

**The text after `@covers:` should closely match the actual wording in the PRD's `[P0]`/`[P1]` line.** It doesn't need to be word-for-word, but it needs to be recognizably the same sentence, matching is done by substring comparison, not meaning. If you write something too different, it won't match, and it'll show up as an uncovered gap even though a test technically exists.

Commit the test with the tag. Push. Done, no other step.

## 3. What happens when you push

GitHub Actions runs automatically. You'll see a check called "Mercator — AC Coverage Check" on your commit or PR.

- **Green check:** every P0 acceptance criterion in the PRD has at least one tagged test somewhere in the codebase.
- **Red X:** something's missing, or something's broken. Click into the log to see exactly what.

## 4. Reading a failure

Open the failed run's log. You'll see one of three things:

**A P0 gap** (exit code 1):
```
FAIL: P0 acceptance criteria with zero mapped tests:
  - AC-017 (PRD line 134): User can Clone a case, creating an independent copy...
```
Means: this specific requirement has no test anywhere. Either write one and tag it, or if you believe it's actually covered, check your `@covers:` wording against the exact PRD line, it may just not be matching due to phrasing.

**Drift** (exit code 2):
```
FAIL: an entry references AC text that doesn't match anything in the PRD.
  - test 'caseList.test.ts:12' [code] covers="..." — no matching AC found
```
Means: a test claims to cover something, but nothing in the current PRD matches that text. Usually this means the PRD changed after the test was written, go check whether the requirement was reworded or removed, and update the tag to match.

## 5. Running it yourself, before pushing

If you want to check coverage locally before committing:

```bash
pip install pyyaml
python mercator/mercator.py --prd docs/PA_Status_Relay_PRD.md --test-dir src
```

Add `--strict` if you also want P1 gaps to count as failures:

```bash
python mercator/mercator.py --prd docs/PA_Status_Relay_PRD.md --test-dir src --strict
```

## 6. What Mercator does NOT do

- It does not run your tests. It only confirms a tagged test exists somewhere.
- It does not understand meaning, only text similarity. A correctly-covered requirement can still show as a gap if the tag's wording is too far from the PRD's wording.
- It does not check the Engineering Spec's transition table, only the PRD's own `[P0]`/`[P1]` lines. See `MERCATOR_SETUP.md` for the full limitations list.

## 7. If it breaks

Most likely cause: someone changed the test framework (Q2 in `DECISIONS.md` is still open) and the file extensions Mercator scans for (`.test.ts`, `.spec.js`, etc.) no longer match what's actually being used. If coverage suddenly drops to zero across the board after a framework change, this is almost certainly why, check `MERCATOR_TRACEABILITY.md`'s "Real, unresolved dependency" note.
