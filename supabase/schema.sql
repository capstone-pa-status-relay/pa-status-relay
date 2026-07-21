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
  current_status pa_status not null default 'new_order',
  consent_flag boolean not null default false,
  doc_link text,
  appointment_link text,
  next_step_note text,
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
