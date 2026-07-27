-- PA Status Relay — seed data (5 cases)
-- Starting states per Engineering Spec Section 2e — matches QA_SCENARIOS.md 1:1
-- (5 scripted demo scenarios). Run AFTER schema.sql, in the same SQL Editor.
--
-- created_by / audit_trail rows are intentionally omitted: no demo auth user
-- exists yet at seed time (created_by is nullable), and the spec's seed
-- section only calls for the 5 case rows, not synthetic audit history.

-- baseline_snapshot mirrors each row's starting status/consent/metadata exactly —
-- Reset restores to this, so it must match the seeded state, not an empty state.
insert into cases (patient_name, drug, payer_name, current_status, consent_flag, baseline_snapshot) values
  ('Demo Patient 1', 'Pembrolizumab', 'Aetna',                 'new_order',           true,
    jsonb_build_object('patient_name', 'Demo Patient 1', 'status', 'new_order', 'consent_flag', true, 'doc_link', null, 'appointment_link', null, 'next_step_note', null)),
  ('Demo Patient 2', 'Nivolumab',     'UnitedHealthcare',      'needs_documentation', true,
    jsonb_build_object('patient_name', 'Demo Patient 2', 'status', 'needs_documentation', 'consent_flag', true, 'doc_link', null, 'appointment_link', null, 'next_step_note', null)),
  ('Demo Patient 3', 'Trastuzumab',   'Cigna',                 'pending_review',      false,
    jsonb_build_object('patient_name', 'Demo Patient 3', 'status', 'pending_review', 'consent_flag', false, 'doc_link', null, 'appointment_link', null, 'next_step_note', null)),
  ('Demo Patient 4', 'Rituximab',     'Blue Cross Blue Shield', 'info_request',       true,
    jsonb_build_object('patient_name', 'Demo Patient 4', 'status', 'info_request', 'consent_flag', true, 'doc_link', null, 'appointment_link', null, 'next_step_note', null)),
  ('Demo Patient 5', 'Bevacizumab',   'Humana',                'peer_to_peer',        true,
    jsonb_build_object('patient_name', 'Demo Patient 5', 'status', 'peer_to_peer', 'consent_flag', true, 'doc_link', null, 'appointment_link', null, 'next_step_note', null));
-- Scenario 1: full happy path · Scenario 2: docs missing at intake · Scenario 3: consent gating
-- Scenario 4: payer info request branch · Scenario 5: P2P → Pending Review constraint
