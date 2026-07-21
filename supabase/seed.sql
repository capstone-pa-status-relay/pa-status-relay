-- PA Status Relay — seed data (5 cases)
-- Starting states per Engineering Spec Section 2e — matches QA_SCENARIOS.md 1:1
-- (5 scripted demo scenarios). Run AFTER schema.sql, in the same SQL Editor.
--
-- created_by / audit_trail rows are intentionally omitted: no demo auth user
-- exists yet at seed time (created_by is nullable), and the spec's seed
-- section only calls for the 5 case rows, not synthetic audit history.

insert into cases (patient_name, current_status, consent_flag) values
  ('Demo Patient 1', 'new_order',           true),   -- Scenario 1: full happy path
  ('Demo Patient 2', 'needs_documentation', true),   -- Scenario 2: docs missing at intake
  ('Demo Patient 3', 'pending_review',      false),  -- Scenario 3: consent gating
  ('Demo Patient 4', 'info_request',        true),   -- Scenario 4: payer info request branch
  ('Demo Patient 5', 'peer_to_peer',        true);   -- Scenario 5: P2P → Pending Review constraint
