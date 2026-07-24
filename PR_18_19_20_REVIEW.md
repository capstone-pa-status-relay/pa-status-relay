# PR 18/19/20 Review

Date: 2026-07-24
Branch: chore/day-2-evening-acmappng-regression-test

## Part A1 - Merge Commits And Stats

`git log --merges --oneline` (target merges):

- `60900a8` Merge pull request #18 from capstone-pa-status-relay/jill/day4-frontend
- `981d517` Merge pull request #19 from capstone-pa-status-relay/jill/day5-frontend
- `280cc67` Merge pull request #20 from capstone-pa-status-relay/fix/audit-message-suppressed

`git diff [commit]^1..[commit] --stat`:

### PR #18 (`60900a8`)
- `docs/DECISIONS.md` (53 lines changed)
- `docs/ui-design-SKILL-PA-Status-Relay.md` (32 lines changed)
- `src/App.tsx` (418 lines changed)
- `src/index.css` (5 lines changed)
- `src/lib/supabase.ts` (6 lines changed)
- Total: 5 files changed, 361 insertions, 153 deletions

### PR #19 (`981d517`)
- `src/App.tsx` (100 lines changed)
- `src/index.css` (15 lines changed)
- Total: 2 files changed, 86 insertions, 29 deletions

### PR #20 (`280cc67`)
- `src/backend/apiTypes.ts` (1 line changed)
- `src/backend/transitionService.ts` (10 lines changed)
- `tests/apiHandlers.test.ts` (4 lines changed)
- `tests/auditCsv.test.ts` (1 line changed)
- `tests/auditService.test.ts` (4 lines changed)
- `tests/consentService.test.ts` (1 line changed)
- `tests/demoControlService.test.ts` (1 line changed)
- `tests/demoEventService.test.ts` (1 line changed)
- `tests/transitionService.test.ts` (7 lines changed)
- Total: 9 files changed, 27 insertions, 3 deletions

## Part A2 - Targeted Questions

### PR #18

- Did it wire any fetch calls to real API routes?
  - Yes. Added transition and consent fetch calls in `src/App.tsx` (`/api/cases/${selectedCaseId}/transition`, `/api/cases/${id}/consent`).
  - Evidence: [src/App.tsx](src/App.tsx#L1709), [src/App.tsx](src/App.tsx#L1747)

- Did it change transition handlers (persist now, or still close UI / log to console)?
  - It moved transition handling to `postTransition(...)` with real `fetch`, but in PR #18 the close behavior still happened in callers after awaiting call paths in some flows (later tightened in PR #19).
  - Current merged behavior is close-on-success only.
  - Evidence (current state): [src/App.tsx](src/App.tsx#L1732), [src/App.tsx](src/App.tsx#L1733), [src/App.tsx](src/App.tsx#L2256), [src/App.tsx](src/App.tsx#L2258)

- Did it touch audit trail rendering (live per-case data, or still static mock)?
  - Partially. Case summary card was wired to selected case props, but timeline entries remain static mock array.
  - Evidence: [src/App.tsx](src/App.tsx#L1289), [src/App.tsx](src/App.tsx#L1058), [src/App.tsx](src/App.tsx#L1372)

### PR #19

- Did it wire any fetch calls to real API routes?
  - Yes, continued same live API route usage and added success/failure return handling around transition calls.
  - Evidence: [src/App.tsx](src/App.tsx#L1709), [src/App.tsx](src/App.tsx#L1720)

- Did it change transition handlers (persist now, or still close UI / log to console)?
  - Yes. Transition calls now return boolean success; drawer/modal close only when call succeeds.
  - Evidence: [src/App.tsx](src/App.tsx#L1720), [src/App.tsx](src/App.tsx#L1733), [src/App.tsx](src/App.tsx#L2256), [src/App.tsx](src/App.tsx#L2264)

- Did it touch audit trail rendering (live per-case data, or still static mock)?
  - It adjusted UI behavior (status badge animation/key), but timeline is still static `TIMELINE_NODES` data.
  - Evidence: [src/App.tsx](src/App.tsx#L1058), [src/App.tsx](src/App.tsx#L1372)

### PR #20 (fix/audit-message-suppressed)

- Does the fix match Lebert's finding (suppressed message action + reason field)?
  - Yes. For consent false, action is set to `message_suppressed` and reason is set to `no_consent` in transition audit payload preparation.
  - Evidence: [src/backend/apiTypes.ts](src/backend/apiTypes.ts#L11), [src/backend/transitionService.ts](src/backend/transitionService.ts#L78), [src/backend/transitionService.ts](src/backend/transitionService.ts#L79), [src/backend/transitionService.ts](src/backend/transitionService.ts#L91), [src/backend/transitionService.ts](src/backend/transitionService.ts#L97)

## Phase 3 Execution Notes (Audit Only)

- Dev server start:
  - First sandboxed attempt failed (`EPERM` bind on 127.0.0.1:5173).
  - Unsandboxed retry succeeded. HTTP check returned `200`.

- Live app constraints observed:
  - Browser console warning: "Supabase env vars are not configured; skipping case fetch."
  - Evidence path in code: [src/lib/supabase.ts](src/lib/supabase.ts#L3), [src/lib/supabase.ts](src/lib/supabase.ts#L6), [src/App.tsx](src/App.tsx#L1637)

- Additional findings relevant to execution:
  - Create Case modal is not wired to persistence (logs only): [src/App.tsx](src/App.tsx#L1740), [src/App.tsx](src/App.tsx#L1741)
  - Vite config has no API proxy/server route wiring, so `/api/*` direct calls on dev server returned 404: [vite.config.ts](vite.config.ts#L5), [src/App.tsx](src/App.tsx#L1709)