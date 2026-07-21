#!/usr/bin/env python3
"""
mercator.py — automated AC-to-test coverage checker for PA Status Relay

Runs on every push/PR (see .github/workflows/mercator.yml). Fails the build
if any P0 acceptance criterion in the PRD has no corresponding test.

Fully automated: coverage is detected directly from the actual test files by
scanning for a `@covers:` tag inline in test code. There is no separate
manifest file to remember to update — the moment a developer writes a test
with a @covers tag, the next push picks it up automatically. This closes the
gap in the first version of this script, which relied on a manually
maintained test_manifest.yaml that could silently go stale.

test_manifest.yaml still exists as a SECONDARY source, for coverage that
isn't code (e.g. a manual QA regression pass recorded in QA_SCENARIOS.md).
Code-based coverage from @covers tags always takes priority and requires
no manual step at all.

Tag convention, works in any language's comment syntax:
    // @covers: User can view a list of mock PA cases with key metadata
    # @covers: User can Reset a case to its seeded baseline state
    /* @covers: User can export the audit trail as a CSV */

Usage:
    python mercator.py --prd path/to/prd.md --test-dir src/
    python mercator.py --prd path/to/prd.md --test-dir src/ --manifest test_manifest.yaml

Exit codes:
    0 — full P0 coverage, no blocking gaps
    1 — one or more P0 acceptance criteria have zero mapped tests
    2 — a manifest entry references an AC that doesn't exist in the PRD (drift)
"""

import argparse
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("Missing dependency: pyyaml. Install with: pip install pyyaml --break-system-packages")
    sys.exit(2)


AC_PATTERN = re.compile(r"\\?\[(P0|P1|P2)\\?\]\s*(.+)")

# Matches @covers: tags in any comment style — //, #, or /* */
COVERS_TAG_PATTERN = re.compile(r"@covers:\s*(.+?)(?:\*/)?\s*$")

# Test file patterns across the likely frontend/backend stacks for this
# project (framework not yet locked per DECISIONS.md Q2, so this covers
# the realistic candidates: Jest/Vitest/Playwright for JS/TS, pytest if
# any Python tooling ends up in the mix).
TEST_FILE_GLOBS = [
    "**/*.test.js", "**/*.test.ts", "**/*.test.tsx",
    "**/*.spec.js", "**/*.spec.ts", "**/*.spec.tsx",
    "**/test_*.py", "**/*_test.py",
]


def extract_acs(prd_text: str) -> list[dict]:
    """Extract every [P0]/[P1]/[P2] acceptance criterion from the PRD text."""
    acs = []
    for i, line in enumerate(prd_text.splitlines(), start=1):
        match = AC_PATTERN.search(line)
        if match:
            priority, text = match.groups()
            text = text.strip().rstrip("\\").strip()
            acs.append({
                "id": f"AC-{len(acs) + 1:03d}",
                "priority": priority,
                "text": text,
                "line": i,
            })
    return acs


def scan_test_files_for_covers_tags(test_dir: Path) -> list[dict]:
    """
    Walk the actual test directory and extract every @covers: tag found in
    any test file. This is the automated path — no human has to maintain a
    separate list, the test code itself is the source of truth.
    """
    found = []
    if not test_dir.exists():
        return found

    seen_files = set()
    for pattern in TEST_FILE_GLOBS:
        for filepath in test_dir.glob(pattern):
            if filepath in seen_files:
                continue
            seen_files.add(filepath)
            try:
                text = filepath.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            for i, line in enumerate(text.splitlines(), start=1):
                match = COVERS_TAG_PATTERN.search(line)
                if match:
                    found.append({
                        "id": f"{filepath.relative_to(test_dir)}:{i}",
                        "covers": match.group(1).strip(),
                        "source": "code",
                    })
    return found


def load_manifest(manifest_path: Path) -> list[dict]:
    """Load the SECONDARY manifest — non-code coverage only (manual QA passes)."""
    if not manifest_path.exists():
        return []
    with open(manifest_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    entries = []
    for test in data.get("tests", []):
        entries.append({
            "id": test.get("id", "UNKNOWN"),
            "covers": test.get("covers", ""),
            "source": "manifest",
        })
    return entries


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def match_ac_to_tests(acs: list[dict], test_entries: list[dict]) -> tuple[dict, list]:
    """Cross-reference every AC against every discovered test entry (code + manifest)."""
    coverage = {ac["id"]: {"ac": ac, "tests": []} for ac in acs}
    unmatched = []
    ac_lookup = {ac["id"]: normalize(ac["text"]) for ac in acs}

    for entry in test_entries:
        covers_norm = normalize(entry["covers"])
        matched = False
        for ac_id, ac_norm in ac_lookup.items():
            if covers_norm and (covers_norm in ac_norm or ac_norm in covers_norm):
                coverage[ac_id]["tests"].append(f"{entry['id']} [{entry['source']}]")
                matched = True
        if not matched:
            unmatched.append(entry)

    return coverage, unmatched


def report(coverage: dict, unmatched: list, code_test_count: int, fail_on_p1: bool = False) -> int:
    p0_gaps, p1_gaps = [], []

    print("=" * 70)
    print("MERCATOR — AC-to-Test Coverage Report (automated)")
    print("=" * 70)
    print(f"Tests discovered automatically from code (@covers tags): {code_test_count}")

    for ac_id, data in coverage.items():
        ac = data["ac"]
        test_ids = data["tests"]
        status = f"{len(test_ids)} test(s)" if test_ids else "NO TESTS MAPPED"
        print(f"[{ac['priority']}] {ac_id}: {status}")
        print(f"       {ac['text'][:90]}")
        if test_ids:
            print(f"       -> {', '.join(test_ids)}")
        if not test_ids:
            (p0_gaps if ac["priority"] == "P0" else p1_gaps if ac["priority"] == "P1" else []).append(ac)

    print("-" * 70)
    print(f"Total ACs extracted: {len(coverage)}")
    print(f"P0 gaps (blocking):  {len(p0_gaps)}")
    print(f"P1 gaps (warning):   {len(p1_gaps)}")
    print(f"Unmatched entries (manifest/code drift): {len(unmatched)}")

    if unmatched:
        print("\nDrift detail:")
        for e in unmatched:
            print(f"  - '{e['id']}' [{e['source']}] covers=\"{e['covers']}\" — no matching AC found")

    print("=" * 70)

    if p0_gaps:
        print("\nFAIL: P0 acceptance criteria with zero mapped tests:")
        for ac in p0_gaps:
            print(f"  - {ac['id']} (PRD line {ac['line']}): {ac['text'][:80]}")
        return 1

    if unmatched:
        print("\nFAIL: an entry references AC text that doesn't match anything in the PRD.")
        return 2

    if p1_gaps and fail_on_p1:
        print("\nFAIL (--strict): P1 acceptance criteria with zero mapped tests.")
        return 1

    print("\nPASS: all P0 acceptance criteria have at least one mapped test.")
    if p1_gaps:
        print(f"({len(p1_gaps)} P1 gap(s) noted but not blocking — re-run with --strict to enforce)")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Mercator — automated AC-to-test coverage checker")
    parser.add_argument("--prd", required=True, help="Path to the PRD markdown file")
    parser.add_argument("--test-dir", default="src", help="Directory to scan for @covers tags in test files")
    parser.add_argument("--manifest", default="test_manifest.yaml",
                         help="Optional secondary manifest for non-code coverage (manual QA passes)")
    parser.add_argument("--strict", action="store_true", help="Also fail the build on P1 gaps")
    args = parser.parse_args()

    prd_path = Path(args.prd)
    if not prd_path.exists():
        print(f"ERROR: PRD file not found at {prd_path}")
        sys.exit(2)

    prd_text = prd_path.read_text(encoding="utf-8")
    acs = extract_acs(prd_text)
    if not acs:
        print("ERROR: no [P0]/[P1]/[P2] acceptance criteria found in the PRD.")
        sys.exit(2)

    code_entries = scan_test_files_for_covers_tags(Path(args.test_dir))
    manifest_entries = load_manifest(Path(args.manifest))
    all_entries = code_entries + manifest_entries

    coverage, unmatched = match_ac_to_tests(acs, all_entries)
    exit_code = report(coverage, unmatched, len(code_entries), fail_on_p1=args.strict)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

