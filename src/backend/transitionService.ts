import { apiError, type ApiErrorResponse } from "./apiErrors.ts";
import type {
  ActorId,
  AuditEntry,
  CaseDetail,
  CaseId,
  IsoTimestamp,
  TransitionCaseRequest,
  TransitionCaseResponse,
} from "./apiTypes.ts";
import type { PaStatus } from "./statusMachine.ts";
import { validateTransition } from "./statusMachine.ts";

export type TransitionActor = {
  actor_id: ActorId;
  actor_label: string;
};

export type TransitionCaseUpdateDraft = {
  id: CaseId;
  status: PaStatus;
  updated_at: IsoTimestamp;
  doc_link: string | null;
  appointment_link: string | null;
  next_step_note: string | null;
};

export type TransitionAuditInsertDraft = {
  case_id: CaseId;
  from_status: PaStatus;
  to_status: PaStatus;
  actor_id: ActorId;
  actor_label: string;
  timestamp: IsoTimestamp;
  reason_code: string | null;
  doc_link: string | null;
  message_sent: boolean;
  message_text: string | null;
  message_custom: boolean;
};

export type PreparedTransition = {
  case_update: TransitionCaseUpdateDraft;
  audit_insert: TransitionAuditInsertDraft;
  response: TransitionCaseResponse;
};

export type PrepareTransitionResult =
  | { ok: true; transition: PreparedTransition }
  | { ok: false; error: ApiErrorResponse };

export function prepareTransition(
  currentCase: CaseDetail,
  request: TransitionCaseRequest,
  actor: TransitionActor,
  timestamp: IsoTimestamp,
): PrepareTransitionResult {
  const validation = validateTransition({
    from_status: currentCase.status,
    to_status: request.to_status,
    doc_link: request.doc_link,
    reason_code: request.reason_code,
    appointment_link: request.appointment_link,
    next_step_note: request.next_step_note,
  });

  if (!validation.ok) {
    return {
      ok: false,
      error: apiError(validation.error.error, validation.error.message),
    };
  }

  const effectiveMessage = getEffectiveMessageFields(currentCase, request);
  const caseUpdate: TransitionCaseUpdateDraft = {
    id: currentCase.id,
    status: request.to_status,
    updated_at: timestamp,
    doc_link: coalesceNullable(request.doc_link, currentCase.doc_link),
    appointment_link: coalesceNullable(request.appointment_link, currentCase.appointment_link),
    next_step_note: coalesceNullable(request.next_step_note, currentCase.next_step_note),
  };

  const auditInsert: TransitionAuditInsertDraft = {
    case_id: currentCase.id,
    from_status: currentCase.status,
    to_status: request.to_status,
    actor_id: actor.actor_id,
    actor_label: actor.actor_label,
    timestamp,
    reason_code: request.reason_code ?? null,
    doc_link: request.doc_link ?? null,
    message_sent: effectiveMessage.message_sent,
    message_text: effectiveMessage.message_text,
    message_custom: effectiveMessage.message_custom,
  };

  const auditEntry: AuditEntry = {
    id: "",
    case_id: auditInsert.case_id,
    timestamp: auditInsert.timestamp,
    actor_id: auditInsert.actor_id,
    actor_label: auditInsert.actor_label,
    action: "status_transition",
    from_status: auditInsert.from_status,
    to_status: auditInsert.to_status,
    reason_code: auditInsert.reason_code,
    message_sent: auditInsert.message_sent,
    message_custom: auditInsert.message_custom,
  };

  return {
    ok: true,
    transition: {
      case_update: caseUpdate,
      audit_insert: auditInsert,
      response: {
        case: {
          id: caseUpdate.id,
          status: caseUpdate.status,
          updated_at: caseUpdate.updated_at,
        },
        audit_entry: auditEntry,
      },
    },
  };
}

function getEffectiveMessageFields(
  currentCase: Pick<CaseDetail, "consent_flag">,
  request: TransitionCaseRequest,
): Pick<TransitionAuditInsertDraft, "message_sent" | "message_text" | "message_custom"> {
  if (!currentCase.consent_flag) {
    return {
      message_sent: false,
      message_text: null,
      message_custom: false,
    };
  }

  return {
    message_sent: request.message_sent,
    message_text: request.message_sent ? request.message_text : null,
    message_custom: request.message_sent ? request.message_custom : false,
  };
}

function coalesceNullable(nextValue: string | null | undefined, currentValue: string | null): string | null {
  return nextValue ?? currentValue;
}
