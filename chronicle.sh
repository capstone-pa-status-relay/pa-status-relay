#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

HISTORY_FILE="ac-mapping-history.md"
DATE_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
BRANCH_NAME="$(git branch --show-current 2>/dev/null || echo unknown)"

if [[ -f "decisions.md" ]]; then
  DECISIONS_FILE="decisions.md"
elif [[ -f "DECISIONS.md" ]]; then
  DECISIONS_FILE="DECISIONS.md"
elif [[ -f "docs/DECISIONS.md" ]]; then
  DECISIONS_FILE="docs/DECISIONS.md"
else
  DECISIONS_FILE=""
fi

FAILURES=()
MISMATCHES=()
BLOCKERS=()

if [[ -n "$DECISIONS_FILE" ]]; then
  while IFS= read -r line; do
    [[ -n "$line" ]] && BLOCKERS+=("Open decision: ${line}")
  done < <(grep -n "^### Q[0-9]" "$DECISIONS_FILE" || true)
fi

if [[ -f "package.json" && -n "$DECISIONS_FILE" ]]; then
  if grep -q '"react"' package.json && grep -q "^### Q2" "$DECISIONS_FILE"; then
    MISMATCHES+=("Q2 is still open, but React scaffold exists in package.json")
  fi
fi

if [[ -f "docs/REGRESSION_TESTS.md" ]]; then
  while IFS= read -r line; do
    [[ -n "$line" ]] && BLOCKERS+=("Regression blocker: ${line}")
  done < <(grep -n "BLOCKED" docs/REGRESSION_TESTS.md || true)
fi

BUILD_RESULT="NOT_RUN"
TEST_RESULT="NOT_RUN"

if npm run -s build >/tmp/chronicle_build.log 2>&1; then
  BUILD_RESULT="PASS"
else
  BUILD_RESULT="FAIL"
  FAILURES+=("npm run build failed; see /tmp/chronicle_build.log")
fi

if node --test tests/*.test.ts >/tmp/chronicle_tests.log 2>&1; then
  TEST_RESULT="PASS"
else
  TEST_RESULT="FAIL"
  FAILURES+=("node --test tests/*.test.ts failed; see /tmp/chronicle_tests.log")
fi

{
  echo ""
  echo "## ${DATE_UTC}"
  echo "- Branch: ${BRANCH_NAME}"
  if [[ -n "$DECISIONS_FILE" ]]; then
    echo "- Decisions source: ${DECISIONS_FILE}"
  else
    echo "- Decisions source: NOT_FOUND"
  fi
  echo "- Build: ${BUILD_RESULT}"
  echo "- Tests: ${TEST_RESULT}"

  echo ""
  echo "### Mismatches"
  if [[ ${#MISMATCHES[@]} -eq 0 ]]; then
    echo "- None"
  else
    for item in "${MISMATCHES[@]}"; do
      echo "- ${item}"
    done
  fi

  echo ""
  echo "### Failures"
  if [[ ${#FAILURES[@]} -eq 0 ]]; then
    echo "- None"
  else
    for item in "${FAILURES[@]}"; do
      echo "- ${item}"
    done
  fi

  echo ""
  echo "### Blockers"
  if [[ ${#BLOCKERS[@]} -eq 0 ]]; then
    echo "- None"
  else
    for item in "${BLOCKERS[@]}"; do
      echo "- ${item}"
    done
  fi
} >> "$HISTORY_FILE"

echo "Appended chronicle entry to ${HISTORY_FILE}"