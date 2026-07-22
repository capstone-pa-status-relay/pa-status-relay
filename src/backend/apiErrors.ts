import type { TransitionErrorCode } from "./statusMachine.ts";

export type ApiErrorCode =
  | TransitionErrorCode
  | "audit_immutable"
  | "unauthorized";

export type ApiErrorBody = {
  error: ApiErrorCode;
  message: string;
};

export type ApiErrorResponse = {
  status: 400 | 401 | 403 | 404 | 500;
  body: ApiErrorBody;
};

export const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  invalid_transition: "This status transition is not allowed.",
  missing_doc_link: "Documentation required before submission. Attach a file or link to continue.",
  missing_reason_code: "A reason code is required for this transition.",
  missing_appointment: "An appointment link is required to close an approved case.",
  missing_next_step: "A next-step note is required to close a denied case.",
  audit_immutable: "Audit trail entries cannot be edited or deleted.",
  unauthorized: "You are not authorized to perform this action.",
};

export const DEFAULT_ERROR_STATUS: Record<ApiErrorCode, ApiErrorResponse["status"]> = {
  invalid_transition: 400,
  missing_doc_link: 400,
  missing_reason_code: 400,
  missing_appointment: 400,
  missing_next_step: 400,
  audit_immutable: 403,
  unauthorized: 401,
};

export function apiError(
  error: ApiErrorCode,
  message = API_ERROR_MESSAGES[error],
  status = DEFAULT_ERROR_STATUS[error],
): ApiErrorResponse {
  return {
    status,
    body: {
      error,
      message,
    },
  };
}

export function forbidden(message = API_ERROR_MESSAGES.unauthorized): ApiErrorResponse {
  return apiError("unauthorized", message, 403);
}
