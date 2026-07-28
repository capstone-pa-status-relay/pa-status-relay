import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// tsconfig.app.json scopes `types` to `vite/client` only (correct for browser
// code under src/), so @types/node's ambient declarations aren't visible here
// even though @types/node is installed. This file runs only in Vercel's Node
// runtime, never the browser bundle — declaring just what's needed avoids a
// shared tsconfig change for one server-only file.
declare const process: { env: Record<string, string | undefined> };

import type {
  BackendRepository,
  CaseInsertWithId,
  ClonePersistenceResult,
  DemoEventInsertWithId,
  ResetPersistenceResult,
  TransitionPersistenceResult,
} from "./apiRepository.ts";
import type { AuditEntry, CaseId, DemoEvent } from "./apiTypes.ts";
import type { CaseRow } from "./caseService.ts";
import type { ConsentCaseUpdateDraft } from "./consentService.ts";
import type { CaseBaselineSnapshot, ResetCaseUpdateDraft } from "./demoControlService.ts";
import type { TransitionAuditInsertDraft, TransitionCaseUpdateDraft } from "./transitionService.ts";

export class BackendRepositoryNotImplementedError extends Error {
  constructor() {
    super("Supabase BackendRepository is not implemented yet.");
    this.name = "BackendRepositoryNotImplementedError";
  }
}

// D09: single shared demo credential set, no per-user auth yet. Interim fix for
// a correctness bug (not the auth-enforcement gap Natalie flagged separately):
// api/_shared.ts currently falls back to the literal string "auth_user_id" when
// no actor_id query param is present, which App.tsx never sends — every write
// would otherwise violate actor_id's uuid/FK constraint on every request.
// Real actor-identity binding still belongs in api/_shared.ts once auth lands.
const SHARED_DEMO_ACTOR_ID = "d03a754e-ee55-4064-868c-75483cbab1fb";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveActorId(actorId: string): string {
  return UUID_PATTERN.test(actorId) ? actorId : SHARED_DEMO_ACTOR_ID;
}

let cachedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new BackendRepositoryNotImplementedError();
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

// Raw Postgres row shapes, as returned by Supabase (snake_case) -------------

type CasesTableRow = {
  id: string;
  patient_name: string;
  drug: string | null;
  current_status: CaseRow["current_status"];
  consent_flag: boolean;
  doc_link: string | null;
  appointment_link: string | null;
  next_step_note: string | null;
  baseline_snapshot: CaseBaselineSnapshot | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

type AuditTrailTableRow = {
  id: string;
  case_id: string;
  action: AuditEntry["action"];
  from_status: AuditEntry["from_status"];
  to_status: AuditEntry["to_status"];
  actor_id: string;
  actor_label: string;
  timestamp: string;
  reason_code: string | null;
  doc_link: string | null;
  message_sent: boolean;
  message_text: string | null;
  message_custom: boolean;
};

type DemoEventsTableRow = {
  id: string;
  case_id: string;
  event_type: DemoEvent["event_type"];
  actor_id: string;
  timestamp: string;
  notes: string | null;
};

function toCaseRow(row: CasesTableRow): CaseRow {
  return {
    id: row.id,
    patient_name: row.patient_name,
    drug: row.drug,
    current_status: row.current_status,
    consent_flag: row.consent_flag,
    doc_link: row.doc_link,
    appointment_link: row.appointment_link,
    next_step_note: row.next_step_note,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
  };
}

function toAuditEntry(row: AuditTrailTableRow): AuditEntry {
  return {
    id: row.id,
    case_id: row.case_id,
    timestamp: row.timestamp,
    actor_id: row.actor_id,
    actor_label: row.actor_label,
    action: row.action,
    from_status: row.from_status,
    to_status: row.to_status,
    reason_code: row.reason_code,
    message_sent: row.message_sent,
    message_text: row.message_text,
    message_custom: row.message_custom,
  };
}

function toDemoEvent(row: DemoEventsTableRow): DemoEvent {
  return {
    id: row.id,
    case_id: row.case_id,
    event_type: row.event_type,
    actor_id: row.actor_id,
    created_at: row.timestamp,
  };
}

// baseline_snapshot is captured at write time (insertCase/cloneCase), not
// supplied by the service layer — its shape is exactly CaseBaselineSnapshot,
// which is exactly the subset of insert fields below.
function baselineSnapshotFor(fields: {
  patient_name: string;
  current_status: CaseRow["current_status"];
  consent_flag: boolean;
  doc_link: string | null;
  appointment_link: string | null;
  next_step_note: string | null;
}): CaseBaselineSnapshot {
  return {
    patient_name: fields.patient_name,
    status: fields.current_status,
    consent_flag: fields.consent_flag,
    doc_link: fields.doc_link,
    appointment_link: fields.appointment_link,
    next_step_note: fields.next_step_note,
  };
}

async function insertDemoEventRow(insert: DemoEventInsertWithId): Promise<DemoEvent> {
  const { data, error } = await getClient()
    .from("demo_events")
    .insert({
      id: insert.id,
      case_id: insert.case_id,
      event_type: insert.event_type,
      actor_id: resolveActorId(insert.actor_id),
      timestamp: insert.timestamp,
      notes: insert.notes,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`insertDemoEvent: ${error.message}`);
  }
  return toDemoEvent(data as DemoEventsTableRow);
}

export function createSupabaseBackendRepository(): BackendRepository {
  return {
    async listCaseRows(): Promise<readonly CaseRow[]> {
      const { data, error } = await getClient()
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`listCaseRows: ${error.message}`);
      }
      return ((data as CasesTableRow[]) ?? []).map(toCaseRow);
    },

    async getCaseRowById(caseId: CaseId): Promise<CaseRow | null> {
      // A malformed (non-UUID) id can never match a row — querying Postgres
      // with one throws an "invalid input syntax for type uuid" error that
      // isn't a real "unexpected" failure, so it's treated as not-found here
      // instead of falling through to withApiErrorBoundary's generic 500.
      if (!UUID_PATTERN.test(caseId)) {
        return null;
      }

      const { data, error } = await getClient()
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .maybeSingle();

      if (error) {
        throw new Error(`getCaseRowById: ${error.message}`);
      }
      return data ? toCaseRow(data as CasesTableRow) : null;
    },

    async insertCase(insert: CaseInsertWithId): Promise<CaseRow> {
      const baseline = baselineSnapshotFor(insert);
      const { data, error } = await getClient()
        .from("cases")
        .insert({
          id: insert.id,
          patient_name: insert.patient_name,
          drug: insert.drug,
          current_status: insert.current_status,
          consent_flag: insert.consent_flag,
          doc_link: insert.doc_link,
          appointment_link: insert.appointment_link,
          next_step_note: insert.next_step_note,
          baseline_snapshot: baseline,
          created_at: insert.created_at,
          updated_at: insert.updated_at,
          created_by: resolveActorId(insert.created_by),
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(`insertCase: ${error.message}`);
      }
      return toCaseRow(data as CasesTableRow);
    },

    async updateCaseConsent(update: ConsentCaseUpdateDraft): Promise<CaseRow> {
      const { data, error } = await getClient()
        .from("cases")
        .update({ consent_flag: update.consent_flag, updated_at: update.updated_at })
        .eq("id", update.id)
        .select("*")
        .single();

      if (error) {
        throw new Error(`updateCaseConsent: ${error.message}`);
      }
      return toCaseRow(data as CasesTableRow);
    },

    async listAuditEntriesForCase(caseId: CaseId): Promise<readonly AuditEntry[]> {
      const { data, error } = await getClient()
        .from("audit_trail")
        .select("*")
        .eq("case_id", caseId)
        .order("timestamp", { ascending: false }); // D12: reverse chronological everywhere

      if (error) {
        throw new Error(`listAuditEntriesForCase: ${error.message}`);
      }
      return ((data as AuditTrailTableRow[]) ?? []).map(toAuditEntry);
    },

    async getBaselineSnapshot(caseId: CaseId): Promise<CaseBaselineSnapshot | null> {
      const { data, error } = await getClient()
        .from("cases")
        .select("baseline_snapshot")
        .eq("id", caseId)
        .maybeSingle();

      if (error) {
        throw new Error(`getBaselineSnapshot: ${error.message}`);
      }
      return (data?.baseline_snapshot as CaseBaselineSnapshot | null) ?? null;
    },

    async applyTransition(
      caseUpdate: TransitionCaseUpdateDraft,
      auditInsert: TransitionAuditInsertDraft,
    ): Promise<TransitionPersistenceResult> {
      // Case update + audit insert in one DB transaction (apply_transition RPC) —
      // a single plpgsql function call is implicitly atomic, so a failed audit
      // insert rolls back the case update too. See D19: previously these were
      // two sequential writes, and a failure between them left a status change
      // with no corresponding audit row.
      const { data, error } = await getClient().rpc("apply_transition", {
        p_case_id: caseUpdate.id,
        p_status: caseUpdate.status,
        p_doc_link: caseUpdate.doc_link,
        p_appointment_link: caseUpdate.appointment_link,
        p_next_step_note: caseUpdate.next_step_note,
        p_updated_at: caseUpdate.updated_at,
        p_action: auditInsert.action,
        p_from_status: auditInsert.from_status,
        p_to_status: auditInsert.to_status,
        p_actor_id: resolveActorId(auditInsert.actor_id),
        p_actor_label: auditInsert.actor_label,
        p_timestamp: auditInsert.timestamp,
        p_reason_code: auditInsert.reason_code,
        p_audit_doc_link: auditInsert.doc_link,
        p_message_sent: auditInsert.message_sent,
        p_message_text: auditInsert.message_text,
        p_message_custom: auditInsert.message_custom,
      });

      if (error) {
        throw new Error(`applyTransition: ${error.message}`);
      }

      const result = data as { case_row: CasesTableRow; audit_entry: AuditTrailTableRow };
      return {
        case_row: toCaseRow(result.case_row),
        audit_entry: toAuditEntry(result.audit_entry),
      };
    },

    async resetCase(
      caseUpdate: ResetCaseUpdateDraft,
      demoEventInsert: DemoEventInsertWithId,
    ): Promise<ResetPersistenceResult> {
      // Case update + demo_events insert in one DB transaction (reset_case RPC) — D19.
      const { data, error } = await getClient().rpc("reset_case", {
        p_case_id: caseUpdate.id,
        p_patient_name: caseUpdate.patient_name,
        p_status: caseUpdate.current_status,
        p_consent_flag: caseUpdate.consent_flag,
        p_doc_link: caseUpdate.doc_link,
        p_appointment_link: caseUpdate.appointment_link,
        p_next_step_note: caseUpdate.next_step_note,
        p_updated_at: caseUpdate.updated_at,
        p_demo_event_id: demoEventInsert.id,
        p_actor_id: resolveActorId(demoEventInsert.actor_id),
        p_demo_timestamp: demoEventInsert.timestamp,
        p_notes: demoEventInsert.notes,
      });

      if (error) {
        throw new Error(`resetCase: ${error.message}`);
      }

      const result = data as { case_row: CasesTableRow; demo_event: DemoEventsTableRow };
      return {
        case_row: toCaseRow(result.case_row),
        demo_event: toDemoEvent(result.demo_event),
      };
    },

    async cloneCase(
      caseInsert: CaseInsertWithId,
      sourceDemoEventInsert: DemoEventInsertWithId,
    ): Promise<ClonePersistenceResult> {
      // New case insert + source demo_events insert in one DB transaction
      // (clone_case RPC) — D19.
      const baseline = baselineSnapshotFor(caseInsert);
      const { data, error } = await getClient().rpc("clone_case", {
        p_new_case_id: caseInsert.id,
        p_patient_name: caseInsert.patient_name,
        p_drug: caseInsert.drug,
        p_consent_flag: caseInsert.consent_flag,
        p_baseline_snapshot: baseline,
        p_created_at: caseInsert.created_at,
        p_created_by: resolveActorId(caseInsert.created_by),
        p_demo_event_id: sourceDemoEventInsert.id,
        p_source_case_id: sourceDemoEventInsert.case_id,
        p_actor_id: resolveActorId(sourceDemoEventInsert.actor_id),
        p_demo_timestamp: sourceDemoEventInsert.timestamp,
        p_notes: sourceDemoEventInsert.notes,
      });

      if (error) {
        throw new Error(`cloneCase: ${error.message}`);
      }

      const result = data as { case_row: CasesTableRow; source_demo_event: DemoEventsTableRow };
      return {
        case_row: toCaseRow(result.case_row),
        source_demo_event: toDemoEvent(result.source_demo_event),
      };
    },

    async insertDemoEvent(insert: DemoEventInsertWithId): Promise<DemoEvent> {
      return insertDemoEventRow(insert);
    },
  };
}
