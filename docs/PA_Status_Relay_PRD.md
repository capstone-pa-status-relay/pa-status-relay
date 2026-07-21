# **PA Status Relay PRD**

**PA Status Relay**  
**Product Requirements Document: Net New Build**

**Build name: Practice-Side PA Status Relay**  
**Owner: Jillian Krebsbach, Natalie Walker, Chris Wozniak, Lee Mcdonald**  
**Date: July 2026**

════════════════════════════════════════  
**1\. PROBLEM**  
════════════════════════════════════════

Oncology PA coordinators managing prior authorizations for infused, buy-and-bill drugs have no real-time visibility into case status — leaving coordinators checking payer portals manually, patients calling repeatedly for updates, and practices carrying financial risk on drug inventory they've already purchased but cannot yet administer.

Supporting Context  
• AMA 2023: Physicians submit an average of 43 PA requests/week; 95% report care delays from PA (prior authorization) requirements.  
• CoverMyMeds data: PA status notifications cut time to prescription pickup by 2.2 days, proving downstream impact.  
• Practices assume cash-flow risk on buy-and-bill drug inventory (e.g., $180K/year IV oncology drugs) pending PA approval; delays and denials translate directly to financial harm.

────────────────────────────────────────  
**1a. Opportunity**  
────────────────────────────────────────

Oncology practices need a purpose-built tool for the medical-benefit PA pathway — a gap no major competitor currently fills. Solving this creates a scalable beachhead in a market of \~2,600 US oncology practices with projected \>50% demand growth through 2040\.

**Market Opportunity**  
• \~2,600 addressable US oncology practices; \~16,700 physicians ordering PA-requiring drugs; \~1M patients on systemic therapy annually.  
• Competitive gap: leading PA status tools serve pharmacy benefit only — no major player addresses medical/infusion benefit authorization.

────────────────────────────────────────  
**1b. Users & Needs**  
────────────────────────────────────────

**Primary users:** PA/Infusion Coordinators — managing high-volume PA caseloads with fragmented tools, manual portal checks, and no single system of record.

**Secondary users:** Internal reviewers (product, engineering, design) evaluating the demo for feasibility and investment readiness. Tertiary: oncology patients receiving infused systemic therapy (simulated in MVP).

**Key User Needs**  
• As a coordinator, I need to log and update PA statuses with required metadata enforced so I can reduce manual effort and avoid downstream rework.  
• As a coordinator, I need to preview patient-facing messages before simulated delivery so I can confirm accuracy and consent compliance.  
• As a patient, I need plain-language updates on my authorization status so I can make treatment and life decisions without calling the office.

════════════════════════════════════════  
**2\. PROPOSED SOLUTION**  
════════════════════════════════════════

PA Status Relay is a web-based workflow tool that gives oncology coordinators a single dashboard to log, track, and relay prior authorization status updates for infused, buy-and-bill drugs. Coordinators create mock cases, walk through each status transition with required metadata enforced, preview patient-facing messages, and generate an immutable audit trail. The MVP is a 5-day, Supabase-backed demo with mock data — no live EHR or payer integrations — designed to validate the core workflow and generate internal buy-in for a production build.

────────────────────────────────────────  
**2a. Value Proposition**  
────────────────────────────────────────

PA coordinators who struggle with fragmented, portal-dependent authorization tracking use PA Status Relay, a workflow dashboard, to log status updates, preview patient communications, and maintain a clean audit trail in one place. Unlike manual portal checks and disconnected notes, it enforces required metadata at every transition and delivers plain-language patient updates — reducing per-case handling time and eliminating the guesswork that delays treatment starts.

────────────────────────────────────────  
**2b. Top 3 MVP Value Props**  
────────────────────────────────────────

• The Vitamin: A single, structured case list with status tracking and audit trail — the table-stakes foundation coordinators currently manage across portals and sticky notes.

• The Painkiller: Required-metadata enforcement and an immutable audit log that stops duplicate work, prevents incomplete submissions, and removes debate during stakeholder reviews.

• The Steroid: Plain-language patient message previews with consent gating — coordinators see exactly what patients receive before it goes out, eliminating inbound "where's my authorization" calls.

────────────────────────────────────────  
**2c. Goals & Non-Goals**  
────────────────────────────────────────

Goals  
• Validate the buy-and-bill PA relay workflow in a single 5-day sprint with 5 scripted demo scenarios.  
• Demonstrate measurable admin time savings: median coordinator status update ≤90 seconds vs. a \~5–10 minute manual baseline.  
• Generate internal stakeholder buy-in: ≥80% of reviewers rate the demo "useful/feasible."  
• Confirm that patient-facing message previews are jargon-free and consent-gated.

Non-Goals  
• No live EHR or payer integrations in MVP — integration work begins in v2.  
• No production SMS or message delivery — patient messages are UI previews only.  
• No PHI handling or compliance certification — all demo data is mock and non-identifiable.  
• No appeal/Denied → Submitted loop — deferred to v2 with payer-specific logic.

**────────────────────────────────────────**  
**2d. Success Metrics**  
────────────────────────────────────────

| Goal | Signal | Metric | Target |
| :---- | :---- | :---- | :---- |
| End-to-end flow completes | All 5 scenarios run error-free | % scenarios completed per session | 100% |
| Coordinator time savings | Faster than manual baseline | Median time: open case → audit entry | ≤90s |
| Patient message clarity | No jargon or denial rationale | % messages passing plain-language review | ≥95% |
| Stakeholder buy-in | Positive internal feedback | % reviewers rating "useful/feasible" | ≥80% |

════════════════════════════════════════  
**3\. REQUIREMENTS**  
════════════════════════════════════════

────────────────────────────────────────  
**User Journey 1: Coordinator — Case Triage & Status Logging**  
────────────────────────────────────────

**Context:** The primary demo flow. Coordinators need fast, discoverable actions to log status changes with required metadata enforced and see results immediately in the audit trail.

**Sub-journey: Case management**  
\[P0\] User can view a list of mock PA cases with key metadata (patient name, status, timestamp, consent flag).  
\[P0\] User can search, sort, and filter cases by status, patient name, or date.  
\[P0\] User can create a new case with required fields (patient name, consent flag) and optional metadata.  
\[P1\] User can edit an existing case's metadata.

**Sub-journey: Status logging**  
\[P0\] User can select only valid status transitions from the current state (invalid transitions are disabled).  
\[P0\] User is blocked from completing a transition if required metadata is missing (e.g., doc link for Submitted), with a specific inline error.  
\[P0\] User sees an immutable audit entry within 500ms of a successful status change, including: new status, previous status, actor, timestamp, and reason code.  
\[P1\] User can provide an optional reason code on any transition; reason code is required for **Denied and Info Request transitions.**

**Sub-journey:** Patient message preview  
\[P0\] User sees a plain-language message preview modal on every status change when consent flag is TRUE.  
\[P0\] User sees a disabled send state with a consent CTA when consent flag is FALSE; a "message suppressed — no consent" event is logged to the audit trail.  
\[P1\] User can edit the templated message text in the preview modal; edited messages are flagged as "custom message" in the audit trail.

────────────────────────────────────────  
**User Journey 2: Coordinator / Reviewer — Audit Trail Review**  
────────────────────────────────────────

**Context:** Reviewers and coordinators need to verify demo fidelity and QA completeness. The audit trail is the primary evidence of workflow integrity.

Sub-journey: Audit inspection  
\[P0\] User can view a chronological, immutable audit trail per case with: timestamp, actor, action, previous status, new status, reason code, and message sent (Y/N).  
\[P0\] User cannot edit or delete audit trail entries — no edit or delete controls are rendered.  
\[P0\] User can filter the audit trail by action type, actor, or date range without a page reload.  
\[P1\] User can export the audit trail as a CSV with case ID and export date in the filename.

**Sub-journey: Demo controls**  
\[P0\] User can Reset a case to its seeded baseline state (with confirmation); reset event is logged as a demo\_event, not a status transition.  
\[P0\] User can Clone a case, creating an independent copy with an empty audit trail and status: New Order.  
\[P1\] User can replay a scenario from Clone without affecting the original case's audit trail.

════════════════════════════════════════  
4\. APPENDIX  
════════════════════════════════════════

**State Machine (9 statuses, MVP scope)**  
──────────────────────────────────────  
Statuses: new\_order · needs\_documentation · submitted · pending\_review · info\_request · peer\_to\_peer · approved · denied · closed

**Valid transitions:**  
  New Order          →  Needs Documentation, Submitted  
  Needs Documentation →  Submitted  
  Submitted          →  Pending Review, Needs Documentation (return, amber path)  
  Pending Review     →  Approved, Denied, Info Request, Peer-to-Peer  
  Info Request       →  Pending Review, Submitted (re-submit)  
  Peer-to-Peer       →  Pending Review only (MVP constraint)  
  Approved           →  Closed (requires appointment link)  
  Denied             →  Closed (requires next-step note; no appeal in MVP)  
  Closed             →  Terminal state

**MVP constraints:**  
• No Denied → Submitted (appeal path deferred to v2)  
• Peer-to-Peer → Pending Review only (direct P2P resolution deferred to v2)  
• Demo Re-open writes a demo\_event row only — not a status transition

**Patient-Friendly Status Mapping (Appendix C)**  
─────────────────────────────────────────────

| Internal Status | Patient-Facing Message |
| :---- | :---- |
| New Order | We've received your treatment order. We'll update you as we make progress. |
| Needs Documentation | Your care team is preparing everything needed for insurance review. |
| Submitted | Your PA request has been submitted and is under insurance review. |
| Pending Review | Your insurance is reviewing your request. We'll contact you when there's a decision. |
| Info Request | We're sending additional information to your insurer. |
| Peer-to-Peer | A clinical discussion has been requested by your insurance provider. |
| Approved | Your treatment is approved. Scheduling will contact you next. |
| Denied | Your insurance did not approve your request. Your care team will discuss next steps. |
| Closed | Your authorization case is complete. For questions, contact \[office \#\]. |

**Competitive Gap Summary**  
───────────────────────

| Competitor | Coverage | Gap vs. This Product |
| :---- | :---- | :---- |
| CoverMyMeds (McKesson) | Pharmacy-benefit PA status texts | No medical-benefit coverage; no infused/buy-and-bill flow |
| D2 Solutions | Real-time PA texts via pharma hub services | Hub-services model, not practice-facing; no medical-benefit |
| SmithRx / Prescryptive | PBM member portals with live PA tracker | Pharmacy-benefit only; consumer-facing |
| Infinx Patient Access | PA alerts pushed to EMR and patient portal | Not patient-facing status relay for infused drugs specifically |
| Clearwave / Curogram | Two-way texting and reminders; 98% SMS open | No PA-specific functionality |

**Tech Stack & Architecture**  
──────────────────────────  
• Backend/DB: Supabase (auth \+ Postgres \+ RLS). Free tier supports unlimited team members — one owner creates the project and invites collaborators.  
• Frontend: Figma design system → Claude Code component generation → Codex for state machine and logic-heavy pieces.  
• Architecture: Single-page app. No external integrations. Mock data only. Sized for internal demo use (\~2–4 concurrent users).  
• No PHI. No production SMS. No EHR or payer integration in MVP.

Audit Schema (written on every status transition):  
  { case\_id, from\_status, to\_status, user\_id, timestamp, reason\_code, doc\_link, message\_sent }

Demo controls (Reset, Clone, Re-open) write to a separate demo\_event table — not the audit trail — to keep QA export clean.

**5-Day Sprint Sequence**  
──────────────────────  
**Day 1**: Supabase setup \+ schema \+ seed data \+ auth flow \+ Case List UI  
**Day 2:** Case create/edit \+ status logging \+ transition validation \+ state machine UI  
**Day 3:** Audit trail \+ message preview modal \+ consent flag logic \+ demo controls  
**Day 4:** Polish \+ error states \+ accessibility \+ end-to-end QA \+ hosting confirmed  
**Day 5:** Internal run-through \+ bug fixes \+ reviewer access shared

**Key dependencies before Day 1:**  
• Figma tokens \+ Case List / Case Details frames locked (Day 0\)  
• Supabase project created, team invites sent and confirmed  
• Status enum and message copy (Appendix C) locked — schema changes after Day 1 are expensive

**Research Sources**  
─────────────────  
• AMA 2023 Prior Authorization Physician Survey  
• CoverMyMeds PA Status Notification Impact Data  
• Oncology Clinical Trials Product Evaluation Framework (July 2026, project folder)  
• Market sizing: \~2,600 US oncology practices; \~16,700 hematology/medical oncologists; \~1M Americans on systemic therapy annually; \>50% projected demand increase by 2040

End of Document · v0.4 Condensed · July 2026

# **Engineering spec**

**PA Status Relay — Engineering Spec**  
**MVP Scope · 5-Day Demo · Mock Data Only**  
**Version: 1.0 | July 2026**

════════════════════════════════════════  
**OVERVIEW**  
════════════════════════════════════════

This spec covers everything engineers need before Day 1 kickoff: schema, enums, API contracts, state machine enforcement, auth setup, and demo control logic. All decisions here should be locked before any code is written. Schema changes after Day 1 are expensive — they cascade across both backend devs and frontend.

Stack:  
  • Backend / DB:   Supabase (Postgres \+ Auth \+ RLS)  
  • Frontend:       Figma → Claude Code → Codex  
  • Hosting:        TBD at Day 1 kickoff (confirm before EOD Day 1\)  
  • No external integrations. No PHI. Mock data only.

════════════════════════════════════════  
**1\. SUPABASE SETUP**  
════════════════════════════════════════

Project setup  
─────────────  
• One team member creates the Supabase project (free tier).  
• Free tier supports unlimited team members — invite all 4 via Organization Members in the Supabase dashboard.  
• Roles to assign: Owner (project creator), Admin (Backend Dev 2), Developer (Frontend / you).  
• Free projects pause after 1 week of inactivity — keep the project active during the sprint by logging in or making API calls daily.  
• Confirm project URL and anon key are shared with all devs before Day 1 standup.

Auth setup  
──────────  
• Use Supabase email/password auth.  
• Disable email confirmation for demo (Settings → Auth → disable "Confirm email") — otherwise new demo logins require inbox access.  
• Create one shared demo credential set for the internal reviewer session.  
• Session persistence: confirm session survives page refresh before EOD Day 1\.  
• No SSO, no OAuth providers needed for MVP.

Environment variables (frontend)  
─────────────────────────────────  
  SUPABASE\_URL=https://\[your-project\].supabase.co  
  SUPABASE\_ANON\_KEY=\[your-anon-key\]

Do not commit these to a public repo.

════════════════════════════════════════  
**2\. DATABASE SCHEMA**  
════════════════════════════════════════

────────────────────────────────────────  
**2a. Status Enum**  
────────────────────────────────────────

Create as a Postgres enum type. Use exactly these values — frontend state machine logic depends on them.

  CREATE TYPE pa\_status AS ENUM (  
    'new\_order',  
    'needs\_documentation',  
    'submitted',  
    'pending\_review',  
    'info\_request',  
    'peer\_to\_peer',  
    'approved',  
    'denied',  
    'closed'  
  );

────────────────────────────────────────  
**2b. Cases Table**  
────────────────────────────────────────

  CREATE TABLE cases (  
    id                UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    patient\_name      TEXT NOT NULL,  
    current\_status    pa\_status NOT NULL DEFAULT 'new\_order',  
    consent\_flag      BOOLEAN NOT NULL DEFAULT FALSE,  
    doc\_link          TEXT,  
    appointment\_link  TEXT,  
    next\_step\_note    TEXT,  
    created\_at        TIMESTAMPTZ NOT NULL DEFAULT now(),  
    updated\_at        TIMESTAMPTZ NOT NULL DEFAULT now(),  
    created\_by        UUID REFERENCES auth.users(id)  
  );

Field notes:  
  • doc\_link          Required before transition to 'submitted'. Nullable otherwise.  
  • appointment\_link  Required before transition to 'closed' from 'approved'.  
  • next\_step\_note    Required before transition to 'closed' from 'denied'.  
  • consent\_flag      Controls message preview send state. FALSE \= suppress \+ log audit event.

────────────────────────────────────────  
**2c. Audit Trail Table**  
────────────────────────────────────────

  CREATE TABLE audit\_trail (  
    id               UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    case\_id          UUID NOT NULL REFERENCES cases(id),  
    from\_status      pa\_status,  
    to\_status        pa\_status NOT NULL,  
    actor\_id         UUID NOT NULL REFERENCES auth.users(id),  
    actor\_label      TEXT NOT NULL,  
    timestamp        TIMESTAMPTZ NOT NULL DEFAULT now(),  
    reason\_code      TEXT,  
    doc\_link         TEXT,  
    message\_sent     BOOLEAN NOT NULL DEFAULT FALSE,  
    message\_text     TEXT,  
    message\_custom   BOOLEAN NOT NULL DEFAULT FALSE  
  );

Immutability rules:  
  • No UPDATE or DELETE on this table — enforce via RLS policy.  
  • No edit or delete controls rendered on the frontend.  
  • API must return 403 on any attempted edit or delete.

RLS policy (audit\_trail):  
  • INSERT: allowed for authenticated users.  
  • SELECT: allowed for authenticated users.  
  • UPDATE: denied for all.  
  • DELETE: denied for all.

────────────────────────────────────────  
**2d. Demo Events Table**  
────────────────────────────────────────

Separate from audit\_trail. Reset, Clone, and Re-open actions write here — not to the audit trail — so QA CSV exports stay clean.

  CREATE TABLE demo\_events (  
    id          UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    case\_id     UUID NOT NULL REFERENCES cases(id),  
    event\_type  TEXT NOT NULL CHECK (event\_type IN ('reset', 'clone', 'reopen')),  
    actor\_id    UUID NOT NULL REFERENCES auth.users(id),  
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),  
    notes       TEXT  
  );

────────────────────────────────────────  
**2e. Seed Data**  
**─────────────**───────────────────────────

Seed 5 demo cases covering the key scenario starting points. Suggested seed set:

  Case 1: status \= new\_order,           consent \= TRUE   (Scenario: full happy path)  
  Case 2: status \= needs\_documentation, consent \= TRUE   (Scenario: docs missing at intake)  
  Case 3: status \= pending\_review,      consent \= FALSE  (Scenario: consent gating demo)  
  Case 4: status \= info\_request,        consent \= TRUE   (Scenario: payer info request branch)  
  Case 5: status \= peer\_to\_peer,        consent \= TRUE   (Scenario: P2P → Pending Review constraint)

Seed data quality matters — bad starting states mean broken scenario runs on Day 5\. Review seed data against the 5 QA scripts before Day 2 standup.

════════════════════════════════════════  
**3\. STATE MACHINE & TRANSITION API**  
════════════════════════════════════════

────────────────────────────────────────  
**3a. Valid Transition Map**  
────────────────────────────────────────

This is the authoritative transition table. Both the API and the frontend enforce this. Any transition not listed is invalid and must return 400\.

  From                  → To                      Pre-condition / gate  
  ─────────────────────────────────────────────────────────────────────  
  new\_order             → needs\_documentation      None  
  new\_order             → submitted                doc\_link must be present  
  needs\_documentation   → submitted                doc\_link must be present  
  submitted             → pending\_review           None  
  submitted             → needs\_documentation      reason\_code required (amber return path)  
  pending\_review        → approved                 None  
  pending\_review        → denied                   reason\_code required  
  pending\_review        → info\_request             reason\_code required  
  pending\_review        → peer\_to\_peer             None  
  info\_request          → pending\_review           reason\_code required  
  info\_request          → submitted                doc\_link required (re-submit)  
  peer\_to\_peer          → pending\_review           reason\_code required  
  approved              → closed                   appointment\_link required  
  denied                → closed                   next\_step\_note required

MVP constraints (enforce at API level, not just UI):  
  • peer\_to\_peer → approved: INVALID in MVP  
  • peer\_to\_peer → denied: INVALID in MVP  
  • denied → submitted: INVALID in MVP (no appeal path)  
  • closed → \[any status\]: INVALID (terminal state)

────────────────────────────────────────  
**3b. Transition API Endpoint**  
────────────────────────────────────────

POST /api/cases/:id/transition

Request body:  
  {  
    "to\_status":    "submitted",         // required  
    "reason\_code":  "payer\_request",     // required for: denied, info\_request, peer\_to\_peer → pending\_review, submitted → needs\_documentation  
    "doc\_link":     "https://...",       // required for: new\_order → submitted, needs\_documentation → submitted, info\_request → submitted  
    "message\_text": "Your treatment...", // optional — coordinator-edited message copy  
    "message\_custom": true               // set to true if coordinator edited the template  
  }

Success response (200):  
  {  
    "case\_id":      "uuid",  
    "from\_status":  "new\_order",  
    "to\_status":    "submitted",  
    "audit\_id":     "uuid",  
    "timestamp":    "2026-07-20T10:00:00Z",  
    "message\_sent": true  
  }

Error responses:  
  400 invalid\_transition   — transition not in valid map  
  400 missing\_doc\_link     — doc\_link required for this transition  
  400 missing\_reason\_code  — reason\_code required for this transition  
  400 missing\_appointment  — appointment\_link required to close approved case  
  400 missing\_next\_step    — next\_step\_note required to close denied case  
  403 audit\_immutable      — attempted edit or delete on audit trail  
  401 unauthorized         — not authenticated

Error response shape (use consistently across all endpoints):  
  {  
    "error": "missing\_doc\_link",  
    "message": "Documentation required before submission. Attach a file or link to continue."  
  }

Performance target:  
  Audit entry must appear in the UI within 500ms of a successful transition response.  
  For the demo, this is achievable with a simple Supabase insert \+ client-side refetch.  
  Do not use realtime subscriptions unless polling proves too slow — adds complexity for no demo benefit.

════════════════════════════════════════  
4\. MESSAGE PREVIEW LOGIC  
════════════════════════════════════════

────────────────────────────────────────  
**4a. Status → Message Mapping**  
────────────────────────────────────────

Every status transition triggers a message preview modal on the frontend. The backend returns the template text for the target status. Use exactly these strings (from Appendix C of PRD):

  new\_order              → "We've received your treatment order. We'll update you as we make progress."

| Status | Message |
| :---- | :---- |
| new\_order | We've received your treatment order. We'll update you as we make progress. |
| needs\_documentation | Your care team is preparing everything needed for insurance review. |
| submitted | Your PA request has been submitted and is under insurance review. |
| pending\_review | Your insurance is reviewing your request. We'll contact you when there's a decision. |
| info\_request | We're sending additional information to your insurer. |
| peer\_to\_peer | A clinical discussion has been requested by your insurance provider. |
| approved | Your treatment is approved. Scheduling will contact you next. |
| denied | Your insurance did not approve your request. Your care team will discuss next steps. |
| closed | Your authorization case is complete. For questions, contact \[office \#\]. |

  needs\_documentation    → "Your care team is preparing everything needed for insurance review."  
  submitted              → "Your PA request has been submitted and is under insurance review."  
  pending\_review         → "Your insurance is reviewing your request. We'll contact you when there's a decision."  
  info\_request           → "We're sending additional information to your insurer."  
  peer\_to\_peer           → "A clinical discussion has been requested by your insurance provider."  
  approved               → "Your treatment is approved. Scheduling will contact you next."  
  denied                 → "Your insurance did not approve your request. Your care team will discuss next steps."  
  closed                 → "Your authorization case is complete. For questions, contact \[office \#\]."

Rules:  
  • No clinical abbreviations, payer jargon, or authorization reference numbers in any patient-facing string.  
  • Denied message must NOT include denial reason code or clinical rationale.  
  • \[office \#\] is a placeholder — leave as-is for demo.

────────────────────────────────────────  
**4b. Consent Gating Logic**  
────────────────────────────────────────

  IF consent\_flag \= TRUE:  
    → Show preview modal with message text and channel label (SMS/Portal)  
    → Coordinator can edit message text  
    → On confirm: set message\_sent \= TRUE in audit row  
    → If coordinator edited text: set message\_custom \= TRUE in audit row

  IF consent\_flag \= FALSE:  
    → Show preview modal BUT disable send button  
    → Display label: "Consent required — record consent to enable message delivery."  
    → Show CTA linking to consent-capture flow (demo: button only, no live flow)  
    → Log audit event: action \= "message\_suppressed", reason \= "no\_consent"  
    → Set message\_sent \= FALSE in audit row

  IF consent\_flag transitions from FALSE → TRUE mid-case:  
    → Do NOT retroactively send messages for prior status changes  
    → Send applicable message on the NEXT status change only

════════════════════════════════════════  
**5\. AUDIT TRAIL API**  
════════════════════════════════════════

GET /api/cases/:id/audit

Query params (all optional):  
  actor\_id     — filter by user  
  action\_type  — filter by action (status\_change | message\_suppressed | custom\_message | consent\_captured)  
  date\_from    — ISO date string  
  date\_to      — ISO date string

Response:  
  \[  
    {  
      "id":             "uuid",  
      "case\_id":        "uuid",  
      "from\_status":    "new\_order",  
      "to\_status":      "submitted",  
      "actor\_id":       "uuid",  
      "actor\_label":    "Demo Coordinator",  
      "timestamp":      "2026-07-20T10:00:00Z",  
      "reason\_code":    null,  
      "message\_sent":   true,  
      "message\_text":   "Your PA request has been submitted...",  
      "message\_custom": false  
    }  
  \]

GET /api/cases/:id/audit/export

Returns CSV. Filename format: audit\_{case\_id}\_{YYYY-MM-DD}.csv

CSV columns (in order):  
  timestamp, actor\_label, action, from\_status, to\_status, reason\_code, message\_sent, message\_custom

Immutability enforcement:  
  • No PUT, PATCH, or DELETE endpoint for audit\_trail rows.  
  • RLS policy denies all UPDATE and DELETE on audit\_trail table.  
  • Frontend renders no edit or delete controls on audit rows.

════════════════════════════════════════  
**6\. DEMO CONTROLS API**  
════════════════════════════════════════

Reset  
──────  
POST /api/cases/:id/reset

Behavior:  
  • Restores case row to seeded baseline values (status, consent\_flag, doc\_link, etc.)  
  • Does NOT delete audit\_trail rows — they remain for QA inspection  
  • Writes a demo\_event row: event\_type \= 'reset'  
  • Returns updated case object

Decision required before building (Day 2 morning standup):  
  Option A — Store a snapshot of each seed case at creation time; reset restores from snapshot.  
  Option B — Re-run the seed insert for that case\_id; simpler but requires seed data to be parameterized by case\_id.  
  Recommend Option A — more reliable for cases that have been edited after seeding.

Clone  
──────  
POST /api/cases/:id/clone

Behavior:  
  • Creates a new case row copying patient\_name and consent\_flag from source  
  • Sets cloned case status \= 'new\_order'  
  • Creates empty audit trail for the new case (no rows copied)  
  • Writes a demo\_event row on the SOURCE case: event\_type \= 'clone'  
  • Returns new case object (with new case\_id)  
  • Frontend navigates immediately to the cloned case

Re-open (demo only)  
────────────────────  
POST /api/cases/:id/reopen

Behavior:  
  • Does NOT change case status (closed is terminal)  
  • Writes a demo\_event row: event\_type \= 'reopen'  
  • Used for demo iteration only — not a production feature  
  • Frontend shows a "Demo only" label on this control

════════════════════════════════════════  
**7\. FRONTEND INTEGRATION NOTES**  
════════════════════════════════════════

State machine UI enforcement  
─────────────────────────────  
  • Buttons for invalid transitions are DISABLED (not hidden) so reviewers can see the full set of possible actions.  
  • Tooltip on disabled button explains why: e.g., "Attach documentation to submit."  
  • Both UI and API enforce transitions — disabling in UI is UX; 400 from API is the real guard.  
  • Feed the full transition table (Section 3a) directly into Claude Code as a prompt input — don't rely on it inferring the logic.

Audit trail display  
────────────────────  
  • Render in reverse chronological order (most recent first).  
  • Filter updates client-side without page reload — use local state filtering on the fetched array.  
  • Show filter summary label when filters are active: e.g., "Filtered by: Status Change · Last 24h"  
  • Clearing filters restores all entries.

500ms audit entry target  
─────────────────────────  
  • On successful transition API response, immediately refetch audit trail for that case.  
  • Do not wait for a realtime event — just refetch on success.  
  • If refetch returns the new entry, target is met. If not within 500ms, check Supabase insert latency.

Demo controls UX  
──────────────────  
  • Mark Reset, Clone, and Re-open controls clearly as "Demo only" — use a distinct visual treatment (badge or muted color) so reviewers don't confuse them with production features.  
  • Reset: show a confirmation toast before executing. "This will restore the case to its baseline state."  
  • Clone: navigate to new case immediately after API returns.

════════════════════════════════════════  
**8\. OPEN QUESTIONS (resolve at Day 1 kickoff)**  
════════════════════════════════════════

  \#   Question                                                          Owner  
  ─────────────────────────────────────────────────────────────────────────────  
  1   Hosting: Vercel, Netlify, or Supabase hosting? Confirm URL.       Backend Dev 1  
  2   Frontend framework: React, Next.js, or plain Vite?               You (Design/FE)  
  3   Reset strategy: snapshot vs. re-seed? (See Section 6\)            Backend Dev 1 \+ Dev 2  
  4   Demo credentials: how many sets? Who gets access on Day 5?        QA / Slides  
  5   Browser targets: Chrome only for demo, or also Safari/Firefox?   You (Design/FE)  
  6   actor\_label source: pull from auth.users metadata or hardcode     Backend Dev 1  
      "Demo Coordinator" for MVP?

End of Engineering Spec · v1.0 · July 2026

# **build checklist**

**PA Status Relay — Day-by-Day Build Checklist**  
**MVP Scope · 5-Day Demo · AI-Assisted Build**  
**Version: 1.0 | July 2026**

**HOW TO USE THIS CHECKLIST**  
─────────────────────────  
Each item is written as a "done when" statement — not a task description. Check it off only when the stated condition is true, not when you've started the work. Items marked \[BLOCKER\] must be resolved before the next day's work begins. Items marked \[SYNC\] require a quick team check-in before proceeding.

**════════════════════════════════════════**  
**DAY 0 — Pre-Sprint (You · \~1.5 hrs)**  
════════════════════════════════════════

Design  
  \[ \] Figma design tokens locked: color, type scale, spacing, border radius  
  \[ \] Case List frame is handoff-ready (columns: patient name, status chip, timestamp, consent flag)  
  \[ \] Case Details frame is handoff-ready (status chip, action buttons, metadata form area, audit panel placeholder)  
  \[ \] \[BLOCKER\] Both frames shared with Backend Dev 1 before EOD — they need to confirm data shape matches

Supabase  
  \[ \] Supabase project created (free tier)  
  \[ \] All 4 team members invited and confirmed access  
  \[ \] Project URL and anon key shared with all devs  
  \[ \] Email confirmation disabled in Supabase Auth settings (Settings → Auth → uncheck "Confirm email")

Notes / concerns for Day 0:  
  • If Figma frames aren't done before Day 1, frontend loses its foundation and backend may build toward the wrong data shape. This is the highest-leverage prep of the whole sprint.

════════════════════════════════════════  
**DAY 1 — Foundation**  
**Goal: Auth works · Case List renders seeded data · Schema locked**  
════════════════════════════════════════

**YOU — Design / Frontend (\~2 hrs human time)**  
  \[ \] Figma tokens imported into Claude Code design system  
  \[ \] App shell scaffolded: nav, layout, routing skeleton  
  \[ \] Sign-in screen built and renders correctly  
  \[ \] Case List UI built against hardcoded mock array (do not wait for Supabase)  
  \[ \] \[SYNC\] Reviewed Backend Dev 1's schema draft — no data shape mismatches flagged  
  \[ \] \[BLOCKER\] Figma handoff for Message Preview modal and Audit Trail panel scheduled for Day 2 EOD

**BACKEND DEV 1 — Schema \+ Auth (\~2.25 hrs human time)**  
  \[ \] pa\_status enum created with all 9 values (exact strings from Engineering Spec Section 2a)  
  \[ \] cases table created with all fields and correct types  
  \[ \] audit\_trail table created with RLS: INSERT \+ SELECT allowed, UPDATE \+ DELETE denied  
  \[ \] demo\_events table created  
  \[ \] 5 seed cases inserted covering all scenario starting states (see Engineering Spec Section 2e)  
  \[ \] Supabase auth flow working: sign in → session → case list redirect  
  \[ \] Session persists on page refresh (tested manually)  
  \[ \] \[BLOCKER\] Schema reviewed and locked — no changes after today without team sign-off  
  \[ \] Project URL \+ demo credentials shared with full team

**BACKEND DEV 2 — Case CRUD (\~2 hrs human time)**  
  \[ \] GET /api/cases — returns list with correct fields  
  \[ \] POST /api/cases — creates case with required field validation  
  \[ \] GET /api/cases/:id — returns single case  
  \[ \] Filter by status working  
  \[ \] Sort by date working  
  \[ \] Consistent error response shape defined and shared with team (see Engineering Spec Section 3b)  
  \[ \] \[SYNC\] Reviewed Figma Case List frame — API response shape matches what frontend needs

**QA / SLIDES (\~2.5 hrs human time)**  
  \[ \] 5 scripted demo scenarios written: each has named starting state, step-by-step actions, and expected output  
  \[ \] Every acceptance criterion from PRD Section 3 mapped to at least one test case  
  \[ \] Ambiguous ACs flagged and shared with team for resolution  
  \[ \] Presentation deck structure created: problem, solution, demo flow, metrics, next steps (placeholder slides)

**END OF DAY 1 CHECK**  
  \[ \] Auth flow works end-to-end (sign in → see case list)  
  \[ \] Case list renders seeded mock data  
  \[ \] Schema is locked and all devs are working from the same enum strings  
  \[ \] Hosting decision made and URL confirmed (even if not deployed yet)

════════════════════════════════════════  
**DAY 2 — Core Flows**  
**Goal: Coordinator can create a case · update status · see audit entry appear**  
════════════════════════════════════════

**YOU — Design / Frontend (\~3 hrs human time)**  
  \[ \] Case List wired to live Supabase data (replace mock array)  
  \[ \] Case Details UI built: status chip showing current state, action buttons for valid transitions  
  \[ \] State machine button logic implemented: invalid transitions disabled, tooltip explains why  
      (Feed Engineering Spec Section 3a directly to Claude Code as prompt input)  
  \[ \] Create Case modal built with required field validation (patient name, consent flag)  
  \[ \] Inline error messages match API error copy exactly (coordinate with Backend Dev 1\)  
  \[ \] Figma handoff complete: Message Preview modal \+ Audit Trail panel frames ready for Day 3

**BACKEND DEV 1 — Transition API (\~2.25 hrs human time)**  
  \[ \] POST /api/cases/:id/transition implemented  
  \[ \] All valid transitions in map return 200  
  \[ \] All invalid transitions return 400 with correct error code  
  \[ \] Pre-condition gates enforced:  
      \[ \] doc\_link required for new\_order → submitted  
      \[ \] doc\_link required for needs\_documentation → submitted  
      \[ \] doc\_link required for info\_request → submitted (re-submit)  
      \[ \] reason\_code required for pending\_review → denied  
      \[ \] reason\_code required for pending\_review → info\_request  
      \[ \] reason\_code required for info\_request → pending\_review  
      \[ \] reason\_code required for peer\_to\_peer → pending\_review  
      \[ \] reason\_code required for submitted → needs\_documentation (amber return)  
      \[ \] appointment\_link required for approved → closed  
      \[ \] next\_step\_note required for denied → closed  
  \[ \] MVP constraints enforced at API level (not just UI):  
      \[ \] peer\_to\_peer → approved returns 400  
      \[ \] peer\_to\_peer → denied returns 400  
      \[ \] denied → submitted returns 400  
      \[ \] closed → \[any\] returns 400  
  \[ \] Audit row written on every successful transition (all required fields populated)  
  \[ \] Audit row appears within 500ms (verified manually)

**BACKEND DEV 2 — Message \+ Consent \+ Demo Controls (\~2.5 hrs human time)**  
  \[ \] consent\_flag readable and writable on case record  
  \[ \] Message template engine: each of 9 statuses maps to correct patient-facing string (Engineering Spec Section 4a)  
  \[ \] \[SYNC\] Reset strategy decided with Backend Dev 1 at morning standup (snapshot vs. re-seed)  
  \[ \] POST /api/cases/:id/reset implemented per agreed strategy  
  \[ \] demo\_events row written on reset (event\_type \= 'reset')  
  \[ \] POST /api/cases/:id/clone implemented  
  \[ \] Clone creates new case with status \= new\_order, empty audit trail  
  \[ \] demo\_events row written on source case (event\_type \= 'clone')

**QA / SLIDES (\~2.5 hrs human time)**  
  \[ \] Dry-run of Scenario 1 (New Order → Submitted → Pending Review) against live build  
  \[ \] Bugs documented with repro steps (even if build isn't complete — note what was and wasn't testable)  
  \[ \] Problem slide complete with market data  
  \[ \] Market Opportunity slide complete  
  \[ \] State machine diagram slide built (use Mermaid diagram from PRD Appendix G as base)

**END OF DAY 2 CHECK**  
  \[ \] Coordinator can create a case and see it in the list  
  \[ \] At least one valid status transition saves and writes an audit row  
  \[ \] At least one invalid transition returns the correct error  
  \[ \] Reset and Clone return success responses (even if frontend not wired yet)

════════════════════════════════════════  
**DAY 3 — Audit, Preview, Consent**  
**Goal: Full case detail working end-to-end · status → preview → audit**  
════════════════════════════════════════

**\[SYNC\] You \+ Backend Dev 2: 15-minute integration sync at start of day**  
  → Align on: how the transition API response triggers the preview modal  
  → Align on: how audit trail data is fetched and rendered  
  → Do this before anyone builds — misalignment here costs hours

**YOU — Design / Frontend (\~2.5 hrs human time)**  
  \[ \] Message Preview modal built — consent TRUE state:  
      \[ \] Shows plain-language message text  
      \[ \] Shows channel label (SMS/Portal)  
      \[ \] Confirm button triggers audit write (message\_sent \= TRUE)  
      \[ \] Coordinator can edit message text in modal  
      \[ \] Edited message flagged as "custom message" in audit row  
  \[ \] Message Preview modal built — consent FALSE state:  
      \[ \] Send button disabled  
      \[ \] Label: "Consent required — record consent to enable message delivery."  
      \[ \] CTA button present (demo: no live flow behind it)  
  \[ \] Audit Trail panel built:  
      \[ \] Chronological list of entries with all required fields  
      \[ \] Filter by action type, actor, date range — client-side, no page reload  
      \[ \] Filter summary label shows when filters are active  
      \[ \] Clearing filter restores all entries  
  \[ \] Consent flag wired to preview modal send button state (TRUE/FALSE drives enabled/disabled)  
  \[ \] Accessibility pass on Days 1–2 work: tab order correct, ARIA labels present, WCAG AA contrast

**BACKEND DEV 1 — Audit Trail API (\~2 hrs human time)**  
  \[ \] GET /api/cases/:id/audit returns all entries in correct shape  
  \[ \] Audit filter query params working: actor\_id, action\_type, date\_from, date\_to  
  \[ \] GET /api/cases/:id/audit/export returns CSV  
  \[ \] CSV filename format correct: audit\_{case\_id}\_{YYYY-MM-DD}.csv  
  \[ \] CSV columns in correct order: timestamp, actor\_label, action, from\_status, to\_status, reason\_code, message\_sent, message\_custom  
  \[ \] RLS confirmed: direct API call attempting UPDATE on audit\_trail returns 403  
  \[ \] POST /api/cases/:id/clone wired and tested end-to-end  
  \[ \] demo\_events confirmed separate from audit\_trail in CSV export

**BACKEND DEV 2 — Consent \+ Message Integration (\~2.5 hrs human time)**  
  \[ \] Consent FALSE → message suppressed → "message\_suppressed" audit event logged (action type visible in audit trail)  
  \[ \] message\_sent \= FALSE written to audit row when suppressed  
  \[ \] Custom message flag: if coordinator edits template, message\_custom \= TRUE in audit row  
  \[ \] Edge case decided and implemented: coordinator edits message then reverts to original → define behavior now  
  \[ \] Consent FALSE → TRUE mid-case: confirmed no retroactive messages sent, only next transition triggers preview  
  \[ \] Full integration tested: status change → preview modal → confirm → audit row appears

**QA / SLIDES (\~3 hrs human time)**  
  \[ \] Scenarios 1, 2, and 3 run against Day 3 build  
  \[ \] All bugs logged with severity (demo-blocking / cosmetic / nice-to-fix)  
  \[ \] Demo-blocking bugs shared with team before EOD  
  \[ \] Demo Flow slide complete (use Scenario 1 as narrative spine)  
  \[ \] Success Metrics slide first draft complete

**END OF DAY 3 CHECK**  
  \[ \] Status change → message preview modal → confirm → audit entry: works end-to-end  
  \[ \] Consent FALSE: send button disabled, suppressed audit event logged  
  \[ \] Audit trail filters work without page reload  
  \[ \] CSV export produces correct file with correct columns  
  \[ \] No demo-blocking bugs outstanding (or fix plan assigned)

════════════════════════════════════════  
**DAY 4 — Polish \+ Edge Cases**  
**Goal: Demo-ready UI · all P0 and critical P1 complete · no demo-blocking bugs**  
════════════════════════════════════════

This is your float day. If anything from Days 2–3 slipped, it gets caught here.  
Be honest in the morning standup about what is truly done vs. "almost done."

**YOU — Design / Frontend (\~2.25 hrs human time)**  
  \[ \] All demo-blocking UI bugs from Day 3 QA fixed  
  \[ \] Status chip animation on transition: smooth, not jarring  
  \[ \] Success banner appears on confirmed transition  
  \[ \] Error state UI built:  
      \[ \] Missing metadata: inline error identifying exact missing field  
      \[ \] Network/server failure: persistent error banner with Retry option, inputs retained  
      \[ \] Unauthorized access: clear message with demo access note  
  \[ \] Empty state for Case List: shows example demo case prompt  
  \[ \] Demo control buttons clearly marked as "Demo only" (badge or muted visual treatment)  
  \[ \] Reset confirmation toast implemented  
  \[ \] \[BLOCKER\] Demo URL confirmed and tested — not left for Day 5 morning

**BACKEND DEV 1 — Validation \+ Hosting (\~1.25 hrs human time)**  
  \[ \] All API bugs from Day 3 QA fixed  
  \[ \] Every transition in valid map tested manually against QA checklist (not just happy path)  
  \[ \] Every invalid transition confirmed to return correct 400 error code  
  \[ \] 500ms audit entry target confirmed on hosted URL (not just local)  
  \[ \] Reviewer credentials created and tested on fresh browser session  
  \[ \] \[BLOCKER\] Demo URL live and shared with full team before EOD

**BACKEND DEV 2 — Final Integration (\~2 hrs human time)**  
  \[ \] All message/consent bugs from Day 3 QA fixed  
  \[ \] All 5 demo scenarios run independently by Backend Dev 2 (separate from QA)  
  \[ \] CSV export tested: download file, open, confirm all columns and data correct  
  \[ \] demo\_event rows confirmed separate from audit rows in export  
  \[ \] Clone → navigate to new case → run scenario: works without errors

**QA / SLIDES (\~3 hrs human time)**  
  \[ \] Full regression: all 5 scenarios run as dress rehearsal  
  \[ \] Each scenario checked against QA checklist line by line  
  \[ \] No demo-blocking bugs remaining (or escalated to team immediately)  
  \[ \] All slides complete except live demo screenshots  
  \[ \] Presenter notes written for each slide  
  \[ \] Reviewer feedback form or collection method ready (even a simple 2-question form)

**END OF DAY 4 CHECK**  
  \[ \] All 5 scenarios run without errors on the hosted demo URL  
  \[ \] No demo-blocking bugs open  
  \[ \] Demo URL confirmed and shared  
  \[ \] Reviewer credentials confirmed and tested  
  \[ \] Slides complete and ready for Day 5

════════════════════════════════════════  
**DAY 5 — Run-Through \+ Reviewer Access**  
**Goal: One complete run-through · no blockers · reviewer access shared**  
════════════════════════════════════════

**MORNING (all roles)**  
  \[ \] Backend Dev 1: smoke test on hosted URL — auth, case list, at least one transition, audit entry  
  \[ \] Backend Dev 1: confirm Supabase project is active (not paused)  
  \[ \] You: quick UI pass on hosted URL — anything visually broken gets fixed before run-through  
  \[ \] QA: confirm reviewer credentials work on a fresh incognito browser session

**RUN-THROUGH (QA facilitates · all roles present)**  
  \[ \] Run-through conducted as if it were the real reviewer session — no skipping steps, no narrating around bugs  
  \[ \] All 5 scenarios completed in order  
  \[ \] Any blocking issues fixed in real time (devs on standby)  
  \[ \] Run-through completed successfully with no blocking issues

**POST RUN-THROUGH**  
  \[ \] Reviewer access shared (credentials \+ demo URL)  
  \[ \] Reviewer feedback collected (target: ≥80% "useful/feasible")  
  \[ \] QA: slides finalized with any screenshots from run-through  
  \[ \] Team: open questions and v2 next steps documented while context is fresh

**SUCCESS CRITERIA — FINAL SIGN-OFF**  
  \[ \] 5/5 demo scenarios completed without errors  
  \[ \] Median coordinator status update time ≤90 seconds (measured from screen recording)  
  \[ \] 0 patient-facing messages contain clinical jargon or denial rationale  
  \[ \] ≥80% of reviewers rate demo "useful/feasible"  
  \[ \] Audit trail export produces correct CSV for all scenarios  
  \[ \] No PHI present anywhere in the demo data

════════════════════════════════════════  
**RISKS & NOTES**  
════════════════════════════════════════

**Highest risk items**  
───────────────────  
1\. State machine button logic (Day 2, You \+ Backend Dev 1\)  
   Feed the full transition table from Engineering Spec Section 3a directly into Claude Code.  
   Don't rely on AI inferring the logic — give it the explicit table.

2\. Frontend/backend integration on preview modal (Day 3\)  
   Schedule the 15-minute sync with Backend Dev 2 before anyone starts building.  
   Misalignment on the API response shape → UI trigger contract costs hours to untangle.

3\. Reset strategy (Day 2 morning)  
   Must be decided before Backend Dev 2 touches the Reset endpoint.  
   15 minutes at morning standup. Default recommendation: snapshot approach (Option A in Engineering Spec).

4\. Hosting / demo URL (Day 4\)  
   Commonly left for Day 5 morning and then becomes a blocker.  
   Confirm and test the hosted URL before EOD Day 4 — non-negotiable.

5\. Supabase free tier project pausing  
   Free projects pause after 1 week of inactivity. Since the sprint is 5 days this shouldn't trigger,  
   but confirm the project is active on Day 5 morning before the run-through.

**Buffer absorbed here**  
─────────────────────  
  Day 4 is the intentional float day. If state machine logic (Day 2\) or preview/audit integration (Day 3\) runs over, the buffer is in Day 4 polish time. With AI-assisted builds, each task runs roughly half he time of a manual build — the buffer is real.

End of Build Checklist · v1.0 · July 2026  
