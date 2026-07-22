#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

HISTORY_FILE="ac-mapping-history.md"
LOG_DIR="$ROOT_DIR/.chronicle-logs"
mkdir -p "$LOG_DIR"
BUILD_LOG="$LOG_DIR/chronicle_build.log"
TEST_LOG="$LOG_DIR/chronicle_tests.log"
DATE_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
BRANCH_NAME="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"

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

if npm run -s build >"$BUILD_LOG" 2>&1; then
  BUILD_RESULT="PASS"
else
  BUILD_RESULT="FAIL"
  FAILURES+=("npm run build failed; see $BUILD_LOG")
fi

if node --test tests/*.test.ts >"$TEST_LOG" 2>&1; then
  TEST_RESULT="PASS"
else
  TEST_RESULT="FAIL"
  FAILURES+=("node --test tests/*.test.ts failed; see $TEST_LOG")
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