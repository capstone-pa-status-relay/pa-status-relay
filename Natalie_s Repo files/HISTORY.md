# History — PA Status Relay

A narrative record of how this project arrived at its current form. Distinct from `DECISIONS.md` (which logs locked technical decisions with rationale), this file tracks the project's actual timeline and pivots, so future collaborators understand *why* things are the way they are, not just what the current spec says.

---

## July 2026 — Initial capstone direction: Oncology Trial Access Navigator

The team's original capstone concept was a patient-facing web application ("Metu," later "Metu Systems") addressing oncology clinical trial access, connecting eligibility, biomarker requirements, and practical access barriers (travel, site distance, treatment modality) into a single sequential patient journey. This concept included:

- A full PRD with problem framing, persona set (a primary caregiver persona plus three professional personas: a referring physician's office contact, a trial site coordinator, and a sponsor-side barrier intelligence analyst)
- A mid-fidelity clickable wireframe covering the patient journey, a physician referral tool, a site coordinator screening view, and a sponsor analyst dashboard
- Original branding work, including the name "Metu" (from the ancient Egyptian anatomical term for the body's internal channels), a hero video concept, and visual identity work

## Pivot — PA Status Relay adopted as the team capstone

The team, Jillian Krebsbach, Natalie Walker, Chris Wozniak, and Lee McDonald, converged on a different project as the actual capstone build: **PA Status Relay**, a practice-side tool for oncology PA/infusion coordinators to track prior authorization status for buy-and-bill drugs, with an immutable audit trail and patient-facing message previews.

This was a full replacement, not a parallel effort. The Metu/Oncology Trial Access Navigator work is not being carried forward into this build. Reasoning for the switch, based on comparing the two PRDs: PA Status Relay had a concrete, implementable state machine, a scoped 5-day sprint sequence, and measurable demo success criteria, whereas Metu was still at the product-strategy stage, strong research and personas, but no equivalent technical backbone ready for a sprint.

## Governance documentation, built from incomplete and complete sources respectively

Following the pivot, two sets of governance and QA documentation exist:

- One set of files (`README.md`, `SECURITY.md`, `RULES.md`, `REGRESSION_TESTS.md`, `REGRESSION_TRACEABILITY.md`, `SECURITY_TRACEABILITY.md`, `EVAL_CARD.md`, `QA_CHECKLIST.md`, `chronicle.sh`) was originally built from only the condensed PRD section of the full document.
- A separate set of files (`CLAUDE.md`, `QA_SCENARIOS.md`, and the companion files it references: `STATE_MACHINE.md`, `DESIGN_SYSTEM.md`, `DECISIONS.md`, `BUILD_CHECKLIST.md`) was built against the complete document, including the Engineering Spec and Build Checklist sections.

See the correction below for what this actually means.

## Correction — the documentation "conflict" was an information gap, not a divergence

An earlier version of this file characterized Jillian's `CLAUDE.md` and `QA_SCENARIOS.md` as a separate, independently-built documentation effort running in parallel to files built from the PRD. That framing was wrong, and worth correcting explicitly rather than quietly editing away.

The actual PRD document is a single combined file containing three sections: the condensed PRD (problem, solution, requirements, appendix), a full Engineering Spec (exact schema, RLS policies, API contracts, error codes), and a full day-by-day Build Checklist (four named functional roles: You/Design-Frontend, Backend Dev 1, Backend Dev 2, QA/Slides). Only the first section, the condensed PRD, was available when the initial round of documentation (`README.md`, `RULES.md`, `SECURITY.md`, `REGRESSION_TESTS.md`, `EVAL_CARD.md`, `QA_CHECKLIST.md`) was built.

Jillian's `CLAUDE.md` and `QA_SCENARIOS.md` were built against the complete document, and match it closely, exact audit schema fields, exact seed case starting states, exact named roles. They were not a competing or divergent interpretation. They were accurate, and the PRD-only files were the ones working from an incomplete picture.

All PRD-derived files have since been rebuilt against the complete document. `QA_SCENARIOS.md` remains the authoritative scenario reference; it was correct from the start.

