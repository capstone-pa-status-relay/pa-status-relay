import assert from "node:assert/strict";
import test from "node:test";

import {
  PA_STATUSES,
  PATIENT_MESSAGES,
  STATUS_LABELS,
  VALID_TRANSITIONS,
  canTransition,
  getPatientMessage,
  getTransitionGate,
  validateTransition,
  type PaStatus,
} from "../src/backend/statusMachine.ts";

test("defines the locked PA status enum values", () => {
  assert.deepEqual(PA_STATUSES, [
    "new_order",
    "needs_documentation",
    "submitted",
    "pending_review",
    "info_request",
    "peer_to_peer",
    "approved",
    "denied",
    "closed",
  ]);
});

test("matches the locked valid transition map", () => {
  assert.deepEqual(VALID_TRANSITIONS, {
    new_order: ["needs_documentation", "submitted"],
    needs_documentation: ["submitted"],
    submitted: ["pending_review", "needs_documentation"],
    pending_review: ["approved", "denied", "info_request", "peer_to_peer"],
    info_request: ["pending_review", "submitted"],
    peer_to_peer: ["pending_review"],
    approved: ["closed"],
    denied: ["closed"],
    closed: [],
  });
});

test("accepts every valid transition when required metadata is present", () => {
  const metadata = {
    doc_link: "https://example.test/mock-document",
    reason_code: "payer_requested_more_info",
    appointment_link: "https://example.test/schedule",
    next_step_note: "Coordinator will follow up.",
  };

  for (const [fromStatus, toStatuses] of Object.entries(VALID_TRANSITIONS)) {
    for (const toStatus of toStatuses) {
      assert.deepEqual(
        validateTransition({
          from_status: fromStatus,
          to_status: toStatus,
          ...metadata,
        }),
        {
          ok: true,
          from_status: fromStatus,
          to_status: toStatus,
        },
      );
    }
  }
});

test("rejects explicit MVP hard blocks as invalid transitions", () => {
  const hardBlocks: Array<[PaStatus, PaStatus]> = [
    ["peer_to_peer", "approved"],
    ["peer_to_peer", "denied"],
    ["denied", "submitted"],
    ["closed", "new_order"],
    ["closed", "submitted"],
  ];

  for (const [fromStatus, toStatus] of hardBlocks) {
    assert.equal(canTransition(fromStatus, toStatus), false);
    assert.deepEqual(validateTransition({ from_status: fromStatus, to_status: toStatus }), {
      ok: false,
      error: {
        error: "invalid_transition",
        message: "This status transition is not allowed.",
      },
    });
  }
});

test("returns the locked missing-field errors for gated transitions", () => {
  assert.deepEqual(validateTransition({ from_status: "new_order", to_status: "submitted" }), {
    ok: false,
    error: {
      error: "missing_doc_link",
      message: "Documentation required before submission. Attach a file or link to continue.",
    },
  });

  assert.deepEqual(validateTransition({ from_status: "submitted", to_status: "needs_documentation" }), {
    ok: false,
    error: {
      error: "missing_reason_code",
      message: "A reason code is required for this return path.",
    },
  });

  assert.deepEqual(validateTransition({ from_status: "approved", to_status: "closed" }), {
    ok: false,
    error: {
      error: "missing_appointment",
      message: "An appointment link is required to close an approved case.",
    },
  });

  assert.deepEqual(validateTransition({ from_status: "denied", to_status: "closed" }), {
    ok: false,
    error: {
      error: "missing_next_step",
      message: "A next-step note is required to close a denied case.",
    },
  });
});

test("treats blank gated metadata as missing", () => {
  assert.deepEqual(
    validateTransition({
      from_status: "pending_review",
      to_status: "denied",
      reason_code: "   ",
    }),
    {
      ok: false,
      error: {
        error: "missing_reason_code",
        message: "A reason code is required for denial transitions.",
      },
    },
  );
});

test("exposes locked patient-facing message copy and labels", () => {
  assert.equal(STATUS_LABELS.peer_to_peer, "Peer-to-Peer");
  assert.deepEqual(PATIENT_MESSAGES, {
    new_order: "We've received your treatment order. We'll update you as we make progress.",
    needs_documentation: "Your care team is preparing everything needed for insurance review.",
    submitted: "Your PA request has been submitted and is under insurance review.",
    pending_review: "Your insurance is reviewing your request. We'll contact you when there's a decision.",
    info_request: "We're sending additional information to your insurer.",
    peer_to_peer: "A clinical discussion has been requested by your insurance provider.",
    approved: "Your treatment is approved. Scheduling will contact you next.",
    denied: "Your insurance did not approve your request. Your care team will discuss next steps.",
    closed: "Your authorization case is complete. For questions, contact [office #].",
  });
  assert.equal(
    getPatientMessage("approved"),
    "Your treatment is approved. Scheduling will contact you next.",
  );
  assert.equal(
    PATIENT_MESSAGES.denied,
    "Your insurance did not approve your request. Your care team will discuss next steps.",
  );
});

test("keeps denied patient message free of denial rationale and reason-code detail", () => {
  const deniedMessage = getPatientMessage("denied").toLowerCase();

  assert.equal(deniedMessage.includes("reason code"), false);
  assert.equal(deniedMessage.includes("clinical rationale"), false);
  assert.equal(deniedMessage.includes("medical necessity"), false);
  assert.equal(deniedMessage.includes("diagnosis"), false);
  assert.equal(deniedMessage.includes("criteria"), false);
});

test("exposes transition gate metadata for frontend/API contract checks", () => {
  assert.deepEqual(getTransitionGate("info_request", "submitted"), {
    field: "doc_link",
    error: "missing_doc_link",
    message: "Documentation required before re-submission. Attach a file or link to continue.",
  });

  assert.equal(getTransitionGate("pending_review", "approved"), null);
});
