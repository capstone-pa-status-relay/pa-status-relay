import type { PaStatus } from "./statusMachine.ts";

export type IsoTimestamp = string;
export type CaseId = string;
export type AuditEntryId = string;
export type DemoEventId = string;
export type ActorId = string;

export type SortOrder = "asc" | "desc";
export type CaseSortField = "updated_at";
export type AuditActionType = "status_transition" | "message_suppressed";
export type DemoEventType = "reset" | "clone" | "reopen";

export const DEMO_EVENT_TYPES: readonly DemoEventType[] = ["reset", "clone", "reopen"];

export type CaseSummary = {
  id: CaseId;
  patient_name: string;
  status: PaStatus;
  consent_flag: boolean;
  updated_at: IsoTimestamp;
};

export type CaseDetail = CaseSummary & {
  doc_link: string | null;
  appointment_link: string | null;
  next_step_note: string | null;
  created_at: IsoTimestamp;
};

export type AuditEntry = {
  id: AuditEntryId;
  case_id: CaseId;
  timestamp: IsoTimestamp;
  actor_id: ActorId;
  actor_label: string;
  action: AuditActionType;
  from_status: PaStatus | null;
  to_status: PaStatus;
  reason_code: string | null;
  message_sent: boolean;
  message_text: string | null;
  message_custom: boolean;
};

export type DemoEvent = {
  id: DemoEventId;
  case_id: CaseId;
  event_type: DemoEventType;
  actor_id: ActorId;
  actor_label?: string;
  created_at: IsoTimestamp;
};

export type GetCasesQuery = {
  status?: PaStatus;
  sort?: CaseSortField;
  order?: SortOrder;
};

export type GetCasesResponse = {
  cases: CaseSummary[];
};

export type CreateCaseRequest = {
  patient_name: string;
  consent_flag: boolean;
  doc_link?: string | null;
};

export type CreateCaseResponse = {
  case: CaseDetail;
};

export type GetCaseResponse = {
  case: CaseDetail;
};

export type UpdateCaseConsentRequest = {
  consent_flag: boolean;
};

export type UpdateCaseConsentResponse = {
  case: Pick<CaseSummary, "id" | "status" | "consent_flag" | "updated_at">;
};

export type TransitionCaseRequest = {
  to_status: PaStatus;
  doc_link?: string | null;
  reason_code?: string | null;
  appointment_link?: string | null;
  next_step_note?: string | null;
  message_text: string | null;
  message_sent: boolean;
  message_custom: boolean;
};

export type TransitionCaseResponse = {
  case: Pick<CaseSummary, "id" | "status" | "updated_at">;
  audit_entry: AuditEntry;
};

export type GetAuditQuery = {
  actor_id?: ActorId;
  action_type?: AuditActionType;
  date_from?: IsoTimestamp;
  date_to?: IsoTimestamp;
};

export type GetAuditResponse = {
  audit: AuditEntry[];
};

export type AuditCsvColumn =
  | "timestamp"
  | "actor_label"
  | "action"
  | "from_status"
  | "to_status"
  | "reason_code"
  | "message_sent"
  | "message_custom";

export const AUDIT_CSV_COLUMNS: readonly AuditCsvColumn[] = [
  "timestamp",
  "actor_label",
  "action",
  "from_status",
  "to_status",
  "reason_code",
  "message_sent",
  "message_custom",
];

export type ResetCaseRequest = {
  confirm: true;
};

export type ResetCaseResponse = {
  case: Pick<CaseSummary, "id" | "status" | "updated_at">;
  demo_event: DemoEvent;
};

export type CloneCaseResponse = {
  case: Pick<CaseSummary, "id" | "status" | "consent_flag" | "updated_at"> & {
    created_at: IsoTimestamp;
  };
  source_demo_event: DemoEvent;
};
