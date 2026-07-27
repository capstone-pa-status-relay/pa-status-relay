-- PA Status Relay — Supabase schema
-- Source of truth: Engineering Spec Section 2 (Database Schema), PA Status Relay
-- PRD v1.0, July 2026 — confirmed against the real spec on 2026-07-21 (previously
-- this file held a placeholder enum copied from src/statusMachine.js; the real
-- spec uses different values entirely).
--
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run.

create extension if not exists pgcrypto;

-- 2a. Status enum — 9 values, exact strings per spec
create type pa_status as enum (
  'new_order',
  'needs_documentation',
  'submitted',
  'pending_review',
  'info_request',
  'peer_to_peer',
  'approved',
  'denied',
  'closed'
);

-- 2b. Cases table
create table cases (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  drug text,
  payer_name text,
  current_status pa_status not null default 'new_order',
  consent_flag boolean not null default false,
  doc_link text,
  appointment_link text,
  next_step_note text,
  -- D14 (Reset = snapshot restore) target. Captured once at case creation;
  -- restored verbatim by resetCase(). Shape matches CaseBaselineSnapshot in
  -- demoControlService.ts exactly: patient_name, status, consent_flag,
  -- doc_link, appointment_link, next_step_note. drug is intentionally excluded
  -- (not part of CaseBaselineSnapshot — it's case identity, not workflow state).
  baseline_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table cases enable row level security;

-- Any signed-in coordinator can read/create/update cases (one shared demo
-- credential set per spec Section "Auth setup" — no per-user ownership in MVP).
create policy "cases_select_authenticated" on cases
  for select to authenticated using (true);

create policy "cases_insert_authenticated" on cases
  for insert to authenticated with check (true);

create policy "cases_update_authenticated" on cases
  for update to authenticated using (true) with check (true);

-- 2c. Audit trail table — append-only (INSERT + SELECT allowed, UPDATE + DELETE denied)
create table audit_trail (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  -- Set by transitionService.ts: consent_flag ? 'status_transition' : 'message_suppressed'.
  -- When 'message_suppressed', reason_code is always the literal 'no_consent'
  -- (same column reused deliberately — see transitionService.ts's auditReasonCode).
  action text not null default 'status_transition'
    check (action in ('status_transition', 'message_suppressed')),
  from_status pa_status,
  to_status pa_status not null,
  actor_id uuid not null references auth.users(id),
  actor_label text not null,
  timestamp timestamptz not null default now(),
  reason_code text,
  doc_link text,
  message_sent boolean not null default false,
  message_text text,
  message_custom boolean not null default false
);

alter table audit_trail enable row level security;

create policy "audit_trail_select_authenticated" on audit_trail
  for select to authenticated using (true);

create policy "audit_trail_insert_authenticated" on audit_trail
  for insert to authenticated with check (true);

-- Deliberately no UPDATE or DELETE policy. Under RLS, an operation with no
-- matching policy is denied by default — this is what makes the audit trail
-- tamper-proof (append-only) even for signed-in users. API must also return
-- 403 on any attempted edit/delete (Day 2 work, Backend Dev 1).

-- 2d. Demo events table — Reset / Clone / Re-open write here, not audit_trail,
-- so the QA audit CSV export (Section 5) stays clean.
create table demo_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  event_type text not null check (event_type in ('reset', 'clone', 'reopen')),
  actor_id uuid not null references auth.users(id),
  timestamp timestamptz not null default now(),
  notes text
);

alter table demo_events enable row level security;

create policy "demo_events_select_authenticated" on demo_events
  for select to authenticated using (true);

create policy "demo_events_insert_authenticated" on demo_events
  for insert to authenticated with check (true);

-- 2e. Atomic write functions (D19). supabaseRepository.ts calls these instead
-- of two sequential writes — a single function call is one DB transaction, so
-- a failed second write rolls back the first. EXECUTE is explicitly revoked
-- from anon/authenticated below: these bypass all application-layer validation
-- (state machine gates, consent logic in transitionService.ts) and must only
-- ever be called by the service-role-backed repository, never directly via
-- PostgREST. Supabase's default privileges auto-grant EXECUTE to anon/
-- authenticated on new functions — REVOKE ... FROM PUBLIC does not remove
-- those; they must be revoked from the roles directly.

create or replace function apply_transition(
  p_case_id uuid,
  p_status pa_status,
  p_doc_link text,
  p_appointment_link text,
  p_next_step_note text,
  p_updated_at timestamptz,
  p_action text,
  p_from_status pa_status,
  p_to_status pa_status,
  p_actor_id uuid,
  p_actor_label text,
  p_timestamp timestamptz,
  p_reason_code text,
  p_audit_doc_link text,
  p_message_sent boolean,
  p_message_text text,
  p_message_custom boolean
) returns jsonb
language plpgsql
as $$
declare
  v_case cases;
  v_audit audit_trail;
begin
  update cases
  set current_status = p_status,
      doc_link = p_doc_link,
      appointment_link = p_appointment_link,
      next_step_note = p_next_step_note,
      updated_at = p_updated_at
  where id = p_case_id
  returning * into v_case;

  if not found then
    raise exception 'case % not found', p_case_id;
  end if;

  insert into audit_trail (
    case_id, action, from_status, to_status, actor_id, actor_label,
    timestamp, reason_code, doc_link, message_sent, message_text, message_custom
  ) values (
    p_case_id, p_action, p_from_status, p_to_status, p_actor_id, p_actor_label,
    p_timestamp, p_reason_code, p_audit_doc_link, p_message_sent, p_message_text, p_message_custom
  )
  returning * into v_audit;

  return jsonb_build_object('case_row', to_jsonb(v_case), 'audit_entry', to_jsonb(v_audit));
end;
$$;

revoke execute on function apply_transition(uuid, pa_status, text, text, text, timestamptz, text, pa_status, pa_status, uuid, text, timestamptz, text, text, boolean, text, boolean) from public, anon, authenticated;
grant execute on function apply_transition(uuid, pa_status, text, text, text, timestamptz, text, pa_status, pa_status, uuid, text, timestamptz, text, text, boolean, text, boolean) to service_role;

create or replace function reset_case(
  p_case_id uuid,
  p_patient_name text,
  p_status pa_status,
  p_consent_flag boolean,
  p_doc_link text,
  p_appointment_link text,
  p_next_step_note text,
  p_updated_at timestamptz,
  p_demo_event_id uuid,
  p_actor_id uuid,
  p_demo_timestamp timestamptz,
  p_notes text
) returns jsonb
language plpgsql
as $$
declare
  v_case cases;
  v_event demo_events;
begin
  update cases
  set patient_name = p_patient_name,
      current_status = p_status,
      consent_flag = p_consent_flag,
      doc_link = p_doc_link,
      appointment_link = p_appointment_link,
      next_step_note = p_next_step_note,
      updated_at = p_updated_at
  where id = p_case_id
  returning * into v_case;

  if not found then
    raise exception 'case % not found', p_case_id;
  end if;

  insert into demo_events (id, case_id, event_type, actor_id, timestamp, notes)
  values (p_demo_event_id, p_case_id, 'reset', p_actor_id, p_demo_timestamp, p_notes)
  returning * into v_event;

  return jsonb_build_object('case_row', to_jsonb(v_case), 'demo_event', to_jsonb(v_event));
end;
$$;

revoke execute on function reset_case(uuid, text, pa_status, boolean, text, text, text, timestamptz, uuid, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function reset_case(uuid, text, pa_status, boolean, text, text, text, timestamptz, uuid, uuid, timestamptz, text) to service_role;

-- payer_name added the clone_case parameter after this function's initial
-- deployment. CREATE OR REPLACE only swaps a function whose signature is
-- unchanged — a different parameter list creates a new overload instead of
-- replacing the old one, so the prior 12-arg version is dropped explicitly
-- if this is being re-run against a database that already has it.
drop function if exists clone_case(uuid, text, text, boolean, jsonb, timestamptz, uuid, uuid, uuid, uuid, timestamptz, text);

create or replace function clone_case(
  p_new_case_id uuid,
  p_patient_name text,
  p_drug text,
  p_payer_name text,
  p_consent_flag boolean,
  p_baseline_snapshot jsonb,
  p_created_at timestamptz,
  p_created_by uuid,
  p_demo_event_id uuid,
  p_source_case_id uuid,
  p_actor_id uuid,
  p_demo_timestamp timestamptz,
  p_notes text
) returns jsonb
language plpgsql
as $$
declare
  v_case cases;
  v_event demo_events;
begin
  insert into cases (
    id, patient_name, drug, payer_name, current_status, consent_flag,
    doc_link, appointment_link, next_step_note, baseline_snapshot,
    created_at, updated_at, created_by
  ) values (
    p_new_case_id, p_patient_name, p_drug, p_payer_name, 'new_order', p_consent_flag,
    null, null, null, p_baseline_snapshot,
    p_created_at, p_created_at, p_created_by
  )
  returning * into v_case;

  insert into demo_events (id, case_id, event_type, actor_id, timestamp, notes)
  values (p_demo_event_id, p_source_case_id, 'clone', p_actor_id, p_demo_timestamp, p_notes)
  returning * into v_event;

  return jsonb_build_object('case_row', to_jsonb(v_case), 'source_demo_event', to_jsonb(v_event));
end;
$$;

revoke execute on function clone_case(uuid, text, text, text, boolean, jsonb, timestamptz, uuid, uuid, uuid, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function clone_case(uuid, text, text, text, boolean, jsonb, timestamptz, uuid, uuid, uuid, uuid, timestamptz, text) to service_role;
