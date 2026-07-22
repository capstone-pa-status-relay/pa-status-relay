import { apiError, type ApiErrorResponse } from "./apiErrors.ts";
import type {
  ActorId,
  CaseDetail,
  CaseId,
  CaseSummary,
  CreateCaseRequest,
  CreateCaseResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesResponse,
  IsoTimestamp,
} from "./apiTypes.ts";
import type { PaStatus } from "./statusMachine.ts";

export type CaseRow = {
  id: CaseId;
  patient_name: string;
  current_status: PaStatus;
  consent_flag: boolean;
  doc_link: string | null;
  appointment_link: string | null;
  next_step_note: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by: ActorId | null;
};

export type CreateCaseInput = Partial<CreateCaseRequest>;

export type CaseInsertDraft = {
  patient_name: string;
  current_status: "new_order";
  consent_flag: boolean;
  doc_link: string | null;
  appointment_link: null;
  next_step_note: null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by: ActorId;
};

export type PreparedCaseCreate = {
  insert: CaseInsertDraft;
  response: CreateCaseResponse;
};

export type PrepareCaseCreateResult =
  | { ok: true; create: PreparedCaseCreate }
  | { ok: false; error: ApiErrorResponse };

export type PrepareGetCaseResult =
  | { ok: true; response: GetCaseResponse }
  | { ok: false; error: ApiErrorResponse };

export function listCases(rows: readonly CaseRow[], query: GetCasesQuery = {}): GetCasesResponse {
  const filteredRows = query.status
    ? rows.filter((row) => row.current_status === query.status)
    : [...rows];

  const sortedRows = query.sort === "updated_at"
    ? sortByUpdatedAt(filteredRows, query.order ?? "desc")
    : filteredRows;

  return {
    cases: sortedRows.map(mapCaseRowToSummary),
  };
}

export function getCase(row: CaseRow | null | undefined): PrepareGetCaseResult {
  if (!row) {
    return {
      ok: false,
      error: apiError("case_not_found"),
    };
  }

  return {
    ok: true,
    response: {
      case: mapCaseRowToDetail(row),
    },
  };
}

export function prepareCreateCase(
  request: CreateCaseInput,
  actorId: ActorId,
  timestamp: IsoTimestamp,
  generatedId: CaseId,
): PrepareCaseCreateResult {
  if (!hasValue(request.patient_name)) {
    return {
      ok: false,
      error: apiError("missing_patient_name"),
    };
  }

  if (typeof request.consent_flag !== "boolean") {
    return {
      ok: false,
      error: apiError("missing_consent_flag"),
    };
  }

  const patientName = request.patient_name.trim();
  const docLink = normalizeOptionalText(request.doc_link);
  const insert: CaseInsertDraft = {
    patient_name: patientName,
    current_status: "new_order",
    consent_flag: request.consent_flag,
    doc_link: docLink,
    appointment_link: null,
    next_step_note: null,
    created_at: timestamp,
    updated_at: timestamp,
    created_by: actorId,
  };

  return {
    ok: true,
    create: {
      insert,
      response: {
        case: {
          id: generatedId,
          patient_name: patientName,
          status: "new_order",
          consent_flag: request.consent_flag,
          doc_link: docLink,
          appointment_link: null,
          next_step_note: null,
          created_at: timestamp,
          updated_at: timestamp,
        },
      },
    },
  };
}

export function mapCaseRowToSummary(row: CaseRow): CaseSummary {
  return {
    id: row.id,
    patient_name: row.patient_name,
    status: row.current_status,
    consent_flag: row.consent_flag,
    updated_at: row.updated_at,
  };
}

export function mapCaseRowToDetail(row: CaseRow): CaseDetail {
  return {
    ...mapCaseRowToSummary(row),
    doc_link: row.doc_link,
    appointment_link: row.appointment_link,
    next_step_note: row.next_step_note,
    created_at: row.created_at,
  };
}

function sortByUpdatedAt(rows: readonly CaseRow[], order: "asc" | "desc"): CaseRow[] {
  const direction = order === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => (
    left.updated_at.localeCompare(right.updated_at) * direction
  ));
}

function hasValue(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!hasValue(value)) {
    return null;
  }

  return value.trim();
}
