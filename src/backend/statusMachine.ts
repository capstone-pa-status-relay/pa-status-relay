export const PA_STATUSES = [
  "new_order",
  "needs_documentation",
  "submitted",
  "pending_review",
  "info_request",
  "peer_to_peer",
  "approved",
  "denied",
  "closed",
] as const;

export type PaStatus = (typeof PA_STATUSES)[number];

export type TransitionErrorCode =
  | "invalid_transition"
  | "missing_doc_link"
  | "missing_reason_code"
  | "missing_appointment"
  | "missing_next_step";

export type TransitionError = {
  error: TransitionErrorCode;
  message: string;
};

export type TransitionGateField =
  | "doc_link"
  | "reason_code"
  | "appointment_link"
  | "next_step_note";

export type TransitionGate = {
  field: TransitionGateField;
  error: TransitionErrorCode;
  message: string;
};

export type TransitionPayload = {
  from_status: string;
  to_status: string;
  doc_link?: string | null;
  reason_code?: string | null;
  appointment_link?: string | null;
  next_step_note?: string | null;
};

export type TransitionValidationResult =
  | { ok: true; from_status: PaStatus; to_status: PaStatus }
  | { ok: false; error: TransitionError };

export const STATUS_LABELS: Record<PaStatus, string> = {
  new_order: "New Order",
  needs_documentation: "Needs Documentation",
  submitted: "Submitted",
  pending_review: "Pending Review",
  info_request: "Info Request",
  peer_to_peer: "Peer-to-Peer",
  approved: "Approved",
  denied: "Denied",
  closed: "Closed",
};

export const PATIENT_MESSAGES: Record<PaStatus, string> = {
  new_order: "We've received your treatment order. We'll update you as we make progress.",
  needs_documentation: "Your care team is preparing everything needed for insurance review.",
  submitted: "Your PA request has been submitted and is under insurance review.",
  pending_review: "Your insurance is reviewing your request. We'll contact you when there's a decision.",
  info_request: "We're sending additional information to your insurer.",
  peer_to_peer: "A clinical discussion has been requested by your insurance provider.",
  approved: "Your treatment is approved. Scheduling will contact you next.",
  denied: "Your insurance did not approve your request. Your care team will discuss next steps.",
  closed: "Your authorization case is complete. For questions, contact [office #].",
};

export const VALID_TRANSITIONS: Record<PaStatus, readonly PaStatus[]> = {
  new_order: ["needs_documentation", "submitted"],
  needs_documentation: ["submitted"],
  submitted: ["pending_review", "needs_documentation"],
  pending_review: ["approved", "denied", "info_request", "peer_to_peer"],
  info_request: ["pending_review", "submitted"],
  peer_to_peer: ["pending_review"],
  approved: ["closed"],
  denied: ["closed"],
  closed: [],
};

const INVALID_TRANSITION_ERROR: TransitionError = {
  error: "invalid_transition",
  message: "This status transition is not allowed.",
};

const TRANSITION_GATES: Record<string, TransitionGate> = {
  "new_order->submitted": {
    field: "doc_link",
    error: "missing_doc_link",
    message: "Documentation required before submission. Attach a file or link to continue.",
  },
  "needs_documentation->submitted": {
    field: "doc_link",
    error: "missing_doc_link",
    message: "Documentation required before submission. Attach a file or link to continue.",
  },
  "info_request->submitted": {
    field: "doc_link",
    error: "missing_doc_link",
    message: "Documentation required before re-submission. Attach a file or link to continue.",
  },
  "submitted->needs_documentation": {
    field: "reason_code",
    error: "missing_reason_code",
    message: "A reason code is required for this return path.",
  },
  "pending_review->denied": {
    field: "reason_code",
    error: "missing_reason_code",
    message: "A reason code is required for denial transitions.",
  },
  "pending_review->info_request": {
    field: "reason_code",
    error: "missing_reason_code",
    message: "A reason code is required for info request transitions.",
  },
  "info_request->pending_review": {
    field: "reason_code",
    error: "missing_reason_code",
    message: "A reason code is required to return to pending review.",
  },
  "peer_to_peer->pending_review": {
    field: "reason_code",
    error: "missing_reason_code",
    message: "A reason code is required to return to pending review.",
  },
  "approved->closed": {
    field: "appointment_link",
    error: "missing_appointment",
    message: "An appointment link is required to close an approved case.",
  },
  "denied->closed": {
    field: "next_step_note",
    error: "missing_next_step",
    message: "A next-step note is required to close a denied case.",
  },
};

export function isPaStatus(value: string): value is PaStatus {
  return (PA_STATUSES as readonly string[]).includes(value);
}

export function getValidTransitions(fromStatus: PaStatus): readonly PaStatus[] {
  return VALID_TRANSITIONS[fromStatus];
}

export function canTransition(fromStatus: PaStatus, toStatus: PaStatus): boolean {
  return VALID_TRANSITIONS[fromStatus].includes(toStatus);
}

export function getTransitionGate(
  fromStatus: PaStatus,
  toStatus: PaStatus,
): TransitionGate | null {
  return TRANSITION_GATES[transitionKey(fromStatus, toStatus)] ?? null;
}

export function getPatientMessage(status: PaStatus): string {
  return PATIENT_MESSAGES[status];
}

export function validateTransition(payload: TransitionPayload): TransitionValidationResult {
  if (!isPaStatus(payload.from_status) || !isPaStatus(payload.to_status)) {
    return { ok: false, error: INVALID_TRANSITION_ERROR };
  }

  if (!canTransition(payload.from_status, payload.to_status)) {
    return { ok: false, error: INVALID_TRANSITION_ERROR };
  }

  const gate = getTransitionGate(payload.from_status, payload.to_status);
  if (gate && !hasValue(payload[gate.field])) {
    return {
      ok: false,
      error: {
        error: gate.error,
        message: gate.message,
      },
    };
  }

  return {
    ok: true,
    from_status: payload.from_status,
    to_status: payload.to_status,
  };
}

function transitionKey(fromStatus: PaStatus, toStatus: PaStatus): string {
  return `${fromStatus}->${toStatus}`;
}

function hasValue(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
