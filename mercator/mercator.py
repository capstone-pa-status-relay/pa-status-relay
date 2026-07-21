#!/usr/bin/env python3
"""Mercator - acceptance-criteria traceability checker for PA Status Relay.

Mercator verifies that each PRD acceptance criterion is linked to evidence:

* an ``@covers:`` declaration inside a real test file; or
* a manifest entry that points to a real test specification and locator.

It does not run tests and does not claim that mapped tests pass. Use the normal
test runner in CI for execution. Mercator's job is traceability and drift
detection: requirements -> test evidence.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("Missing dependency: pyyaml. Install with: pip install pyyaml")
    raise SystemExit(2)


AC_PATTERN = re.compile(r"\\?\[(P0|P1|P2)\\?\]\s*(.*)")
COVERS_TAG_PATTERN = re.compile(r"@covers:\s*(.+?)(?:\*/)?\s*$")
SECTION_PATTERN = re.compile(
    r"^(?:#{1,6}\s+|[-=─━]{4,}|(?:user journey|sub-journey|context:|appendix|"
    r"goals?|non-goals?|requirements?|success criteria)\b)", re.IGNORECASE
)

TEST_FILE_GLOBS = [
    "**/*.test.js", "**/*.test.ts", "**/*.test.tsx",
    "**/*.spec.js", "**/*.spec.ts", "**/*.spec.tsx",
    "**/test_*.py", "**/*_test.py",
]


def clean_fragment(text: str) -> str:
    """Normalize layout residue without changing the requirement's meaning."""
    return re.sub(r"\s+", " ", text.replace("\f", " ").strip().rstrip("\\")).strip()


def extract_acs(prd_text: str) -> list[dict]:
    """Extract tagged ACs, joining wrapped continuation lines.

    PDF-to-text and copied Markdown often wrap one criterion across physical
    lines. The earlier implementation silently discarded every continuation.
    This parser collects nonblank continuation lines until another tagged AC or
    a clear section boundary is reached.
    """
    lines = prd_text.splitlines()
    acs: list[dict] = []
    i = 0
    while i < len(lines):
        match = AC_PATTERN.search(lines[i])
        if not match:
            i += 1
            continue

        priority, first = match.groups()
        fragments = [first]
        start_line = i + 1
        i += 1

        while i < len(lines):
            raw = lines[i]
            stripped = raw.strip()
            if AC_PATTERN.search(raw):
                break
            if not stripped or SECTION_PATTERN.search(stripped):
                break
            fragments.append(stripped)
            i += 1

        text = clean_fragment(" ".join(fragments))
        acs.append({
            "id": f"AC-{len(acs) + 1:03d}",
            "priority": priority,
            "text": text,
            "line": start_line,
        })

    return acs


def scan_test_files_for_covers_tags(test_dir: Path) -> list[dict]:
    """Return coverage declarations found inside real test files."""
    found: list[dict] = []
    if not test_dir.exists():
        return found

    seen_files: set[Path] = set()
    for pattern in TEST_FILE_GLOBS:
        for filepath in test_dir.glob(pattern):
            if filepath in seen_files or not filepath.is_file():
                continue
            seen_files.add(filepath)
            try:
                text = filepath.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            for line_number, line in enumerate(text.splitlines(), start=1):
                match = COVERS_TAG_PATTERN.search(line)
                if match:
                    found.append({
                        "id": f"{filepath.relative_to(test_dir)}:{line_number}",
                        "covers": clean_fragment(match.group(1)),
                        "source": "code",
                        "evidence": str(filepath),
                    })
    return found


def resolve_evidence_path(raw_path: str, manifest_path: Path, repo_root: Path) -> Path | None:
    """Resolve manual-QA evidence without accepting a nonexistent assertion."""
    candidate = Path(raw_path)
    candidates = [candidate] if candidate.is_absolute() else [
        repo_root / candidate,
        manifest_path.parent / candidate,
    ]
    for path in candidates:
        if path.is_file():
            return path.resolve()
    return None


def load_manifest(manifest_path: Path, repo_root: Path) -> tuple[list[dict], list[dict]]:
    """Load verified specification mappings and return invalid claims separately."""
    if not manifest_path.exists():
        return [], []

    with manifest_path.open("r", encoding="utf-8") as stream:
        data = yaml.safe_load(stream) or {}

    verified: list[dict] = []
    invalid: list[dict] = []
    for item in data.get("tests", []):
        entry_id = str(item.get("id", "UNKNOWN"))
        covers = clean_fragment(str(item.get("covers", "")))
        raw_path = str(item.get("evidence_path", "")).strip()
        locator = str(item.get("evidence_locator", entry_id)).strip()

        reason = None
        evidence_path = None
        if not covers:
            reason = "missing covers text"
        elif not raw_path:
            reason = "missing evidence_path"
        else:
            evidence_path = resolve_evidence_path(raw_path, manifest_path, repo_root)
            if evidence_path is None:
                reason = f"evidence file not found: {raw_path}"
            else:
                evidence_text = evidence_path.read_text(encoding="utf-8", errors="ignore")
                if not locator or locator not in evidence_text:
                    reason = f"evidence locator not found: {locator!r}"

        entry = {
            "id": entry_id,
            "covers": covers,
            "source": "specification",
            "evidence": str(evidence_path or raw_path),
        }
        if reason:
            entry["reason"] = reason
            invalid.append(entry)
        else:
            verified.append(entry)

    return verified, invalid


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def match_ac_to_evidence(acs: list[dict], entries: list[dict]) -> tuple[dict, list[dict]]:
    """Cross-reference AC text against verified code/manual evidence."""
    coverage = {ac["id"]: {"ac": ac, "evidence": []} for ac in acs}
    unmatched: list[dict] = []
    ac_lookup = {ac["id"]: normalize(ac["text"]) for ac in acs}

    for entry in entries:
        covers_norm = normalize(entry["covers"])
        matches = [
            ac_id for ac_id, ac_norm in ac_lookup.items()
            if covers_norm and (covers_norm in ac_norm or ac_norm in covers_norm)
        ]
        if not matches:
            unmatched.append(entry)
            continue
        for ac_id in matches:
            coverage[ac_id]["evidence"].append(entry)

    return coverage, unmatched


def report(
    coverage: dict,
    unmatched: list[dict],
    invalid_manual: list[dict],
    code_count: int,
    manual_count: int,
    fail_on_p1: bool = False,
) -> int:
    p0_gaps: list[dict] = []
    p1_gaps: list[dict] = []

    print("=" * 76)
    print("MERCATOR - Acceptance-Criteria Traceability Report")
    print("=" * 76)
    print(f"Code evidence declarations discovered: {code_count}")
    print(f"Verified specification evidence:     {manual_count}")
    print("Execution status: NOT CHECKED (Mercator maps evidence; test runners execute tests)")

    for ac_id, data in coverage.items():
        ac = data["ac"]
        evidence = data["evidence"]
        status = f"{len(evidence)} verified mapping(s)" if evidence else "NO VERIFIED EVIDENCE"
        print(f"[{ac['priority']}] {ac_id}: {status}")
        print(f"       {ac['text'][:110]}")
        for entry in evidence:
            print(f"       -> {entry['id']} [{entry['source']}] {entry['evidence']}")
        if not evidence:
            if ac["priority"] == "P0":
                p0_gaps.append(ac)
            elif ac["priority"] == "P1":
                p1_gaps.append(ac)

    print("-" * 76)
    print(f"Total ACs extracted:                  {len(coverage)}")
    print(f"P0 traceability gaps (blocking):      {len(p0_gaps)}")
    print(f"P1 traceability gaps (warning):       {len(p1_gaps)}")
    print(f"Unmatched verified mappings (drift):  {len(unmatched)}")
    print(f"Invalid specification evidence:       {len(invalid_manual)}")

    if invalid_manual:
        print("\nInvalid specification evidence:")
        for entry in invalid_manual:
            print(f"  - {entry['id']}: {entry['reason']}")

    if unmatched:
        print("\nDrift detail:")
        for entry in unmatched:
            print(f"  - {entry['id']} [{entry['source']}] covers={entry['covers']!r}")

    print("=" * 76)

    if invalid_manual or unmatched:
        print("\nFAIL: invalid evidence or requirement drift must be resolved.")
        return 2
    if p0_gaps:
        print("\nFAIL: P0 acceptance criteria have no verified test evidence:")
        for ac in p0_gaps:
            print(f"  - {ac['id']} (PRD line {ac['line']}): {ac['text'][:100]}")
        return 1
    if p1_gaps and fail_on_p1:
        print("\nFAIL (--strict): P1 criteria have no verified test evidence.")
        return 1

    print("\nPASS: every P0 criterion has verified traceability evidence.")
    if p1_gaps:
        print(f"WARNING: {len(p1_gaps)} P1 gap(s); use --strict to make them blocking.")
    print("NOTE: A mapping pass is not a test-execution pass.")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Mercator AC traceability checker")
    parser.add_argument("--prd", required=True, help="Path to PRD Markdown/text")
    parser.add_argument("--test-dir", default="src", help="Directory containing test files")
    parser.add_argument("--manifest", default="mercator/test_manifest.yaml",
                        help="Manual-QA evidence manifest")
    parser.add_argument("--repo-root", default=".", help="Repository root for evidence paths")
    parser.add_argument("--strict", action="store_true", help="Also block on P1 gaps")
    args = parser.parse_args()

    prd_path = Path(args.prd)
    if not prd_path.is_file():
        print(f"ERROR: PRD file not found: {prd_path}")
        raise SystemExit(2)

    acs = extract_acs(prd_path.read_text(encoding="utf-8", errors="ignore"))
    if not acs:
        print("ERROR: no [P0]/[P1]/[P2] acceptance criteria found in the PRD")
        raise SystemExit(2)

    code_entries = scan_test_files_for_covers_tags(Path(args.test_dir))
    manual_entries, invalid_manual = load_manifest(Path(args.manifest), Path(args.repo_root))
    coverage, unmatched = match_ac_to_evidence(acs, code_entries + manual_entries)
    raise SystemExit(report(
        coverage,
        unmatched,
        invalid_manual,
        len(code_entries),
        len(manual_entries),
        fail_on_p1=args.strict,
    ))


if __name__ == "__main__":
    main()
