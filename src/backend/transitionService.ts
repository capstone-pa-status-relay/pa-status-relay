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
import { getPatientMessage, validateTransition } from "./statusMachine.ts";

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
  const metadata = normalizeTransitionMetadata(request);
  const validation = validateTransition({
    from_status: currentCase.status,
    to_status: request.to_status,
    doc_link: metadata.doc_link,
    reason_code: metadata.reason_code,
    appointment_link: metadata.appointment_link,
    next_step_note: metadata.next_step_note,
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
    doc_link: coalesceNullable(metadata.doc_link, currentCase.doc_link),
    appointment_link: coalesceNullable(metadata.appointment_link, currentCase.appointment_link),
    next_step_note: coalesceNullable(metadata.next_step_note, currentCase.next_step_note),
  };

  const auditInsert: TransitionAuditInsertDraft = {
    case_id: currentCase.id,
    from_status: currentCase.status,
    to_status: request.to_status,
    actor_id: actor.actor_id,
    actor_label: actor.actor_label,
    timestamp,
    reason_code: metadata.reason_code ?? null,
    doc_link: metadata.doc_link ?? null,
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
    action: !currentCase.consent_flag ? "message_suppressed" : "status_transition",
    from_status: auditInsert.from_status,
    to_status: auditInsert.to_status,
    reason_code: !currentCase.consent_flag ? "no_consent" : auditInsert.reason_code,
    message_sent: auditInsert.message_sent,
    message_text: auditInsert.message_text,
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

type TransitionMetadata = Pick<
  TransitionCaseRequest,
  "doc_link" | "reason_code" | "appointment_link" | "next_step_note"
>;

function normalizeTransitionMetadata(request: TransitionMetadata): TransitionMetadata {
  return {
    doc_link: normalizeOptionalText(request.doc_link),
    reason_code: normalizeOptionalText(request.reason_code),
    appointment_link: normalizeOptionalText(request.appointment_link),
    next_step_note: normalizeOptionalText(request.next_step_note),
  };
}

function getEffectiveMessageFields(
  currentCase: Pick<CaseDetail, "consent_flag">,
  request: TransitionCaseRequest,
): Pick<TransitionAuditInsertDraft, "message_sent" | "message_text" | "message_custom"> {
  if (!currentCase.consent_flag || !request.message_sent) {
    return {
      message_sent: false,
      message_text: null,
      message_custom: false,
    };
  }

  const confirmedMessage = resolveConfirmedMessage(request.to_status, request.message_text);

  return {
    message_sent: true,
    message_text: confirmedMessage.message_text,
    message_custom: confirmedMessage.message_custom,
  };
}

export function resolveConfirmedMessage(
  toStatus: PaStatus,
  finalMessageText: string | null,
): Pick<TransitionAuditInsertDraft, "message_text" | "message_custom"> {
  const template = getPatientMessage(toStatus);
  const messageText = finalMessageText ?? template;

  return {
    message_text: messageText,
    message_custom: messageText !== template,
  };
}

function coalesceNullable(nextValue: string | null | undefined, currentValue: string | null): string | null {
  return nextValue ?? currentValue;
}

function normalizeOptionalText(value: string | null | undefined): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}
