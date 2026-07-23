import assert from "node:assert/strict";
import test from "node:test";

import type { CaseDetail, TransitionCaseRequest } from "../src/backend/apiTypes.ts";
import {
  prepareTransition,
  resolveConfirmedMessage,
  type TransitionActor,
} from "../src/backend/transitionService.ts";

const baseCase: CaseDetail = {
  id: "case_001",
  patient_name: "Mock Patient",
  status: "new_order",
  consent_flag: true,
  doc_link: null,
  appointment_link: null,
  next_step_note: null,
  created_at: "2026-07-21T15:00:00Z",
  updated_at: "2026-07-21T15:00:00Z",
};

const actor: TransitionActor = {
  actor_id: "actor_001",
  actor_label: "Demo Coordinator",
};

const timestamp = "2026-07-22T01:30:00Z";

test("prepares case update, audit insert, and API response for a valid transition", () => {
  const request: TransitionCaseRequest = {
    to_status: "submitted",
    doc_link: "https://example.test/mock-doc",
    reason_code: null,
    appointment_link: null,
    next_step_note: null,
    message_text: "Your PA request has been submitted and is under insurance review.",
    message_sent: true,
    message_custom: false,
  };

  assert.deepEqual(prepareTransition(baseCase, request, actor, timestamp), {
    ok: true,
    transition: {
      case_update: {
        id: "case_001",
        status: "submitted",
        updated_at: timestamp,
        doc_link: "https://example.test/mock-doc",
        appointment_link: null,
        next_step_note: null,
      },
      audit_insert: {
        case_id: "case_001",
        from_status: "new_order",
        to_status: "submitted",
        actor_id: "actor_001",
        actor_label: "Demo Coordinator",
        timestamp,
        reason_code: null,
        doc_link: "https://example.test/mock-doc",
        message_sent: true,
        message_text: "Your PA request has been submitted and is under insurance review.",
        message_custom: false,
      },
      response: {
        case: {
          id: "case_001",
          status: "submitted",
          updated_at: timestamp,
        },
        audit_entry: {
          id: "",
          case_id: "case_001",
          timestamp,
          actor_id: "actor_001",
          actor_label: "Demo Coordinator",
          action: "status_transition",
          from_status: "new_order",
          to_status: "submitted",
          reason_code: null,
          message_sent: true,
          message_custom: false,
        },
      },
    },
  });
});

test("returns the shared API error shape when transition metadata is missing", () => {
  const result = prepareTransition(
    baseCase,
    {
      to_status: "submitted",
      message_text: null,
      message_sent: false,
      message_custom: false,
    },
    actor,
    timestamp,
  );

  assert.deepEqual(result, {
    ok: false,
    error: {
      status: 400,
      body: {
        error: "missing_doc_link",
        message: "Documentation required before submission. Attach a file or link to continue.",
      },
    },
  });
});

test("returns invalid transition errors without producing drafts", () => {
  const result = prepareTransition(
    { ...baseCase, status: "peer_to_peer" },
    {
      to_status: "approved",
      message_text: null,
      message_sent: false,
      message_custom: false,
    },
    actor,
    timestamp,
  );

  assert.deepEqual(result, {
    ok: false,
    error: {
      status: 400,
      body: {
        error: "invalid_transition",
        message: "This status transition is not allowed.",
      },
    },
  });
});

test("forces message fields to unsent when consent is false", () => {
  const result = prepareTransition(
    { ...baseCase, consent_flag: false },
    {
      to_status: "submitted",
      doc_link: "https://example.test/mock-doc",
      message_text: "Custom patient message",
      message_sent: true,
      message_custom: true,
    },
    actor,
    timestamp,
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.transition.audit_insert.message_sent, false);
  assert.equal(result.transition.audit_insert.message_text, null);
  assert.equal(result.transition.audit_insert.message_custom, false);
  assert.equal(result.transition.response.audit_entry.message_sent, false);
  assert.equal(result.transition.response.audit_entry.message_custom, false);
});

test("computes custom message true when final confirmed text differs from the template", () => {
  const result = prepareTransition(
    {
      ...baseCase,
      status: "pending_review",
      consent_flag: true,
    },
    {
      to_status: "denied",
      reason_code: "payer_denial",
      message_text: "Denied because of payer reason code ABC.",
      message_sent: true,
      message_custom: false,
    },
    actor,
    timestamp,
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.transition.audit_insert.message_text, "Denied because of payer reason code ABC.");
  assert.equal(result.transition.audit_insert.message_custom, true);
});

test("computes custom message false when edited text is reverted to the template", () => {
  const template = "Your insurance did not approve your request. Your care team will discuss next steps.";
  const result = prepareTransition(
    {
      ...baseCase,
      status: "pending_review",
      consent_flag: true,
    },
    {
      to_status: "denied",
      reason_code: "payer_denial",
      message_text: template,
      message_sent: true,
      message_custom: true,
    },
    actor,
    timestamp,
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.transition.audit_insert.message_text, template);
  assert.equal(result.transition.audit_insert.message_custom, false);
});

test("preserves custom message text when consent is true", () => {
  const customMessage = "Your care team has an update and will contact you about next steps.";
  const result = prepareTransition(
    {
      ...baseCase,
      status: "pending_review",
      consent_flag: true,
    },
    {
      to_status: "denied",
      reason_code: "payer_denial",
      message_text: customMessage,
      message_sent: true,
      message_custom: true,
    },
    actor,
    timestamp,
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.transition.audit_insert.message_text, customMessage);
  assert.equal(result.transition.audit_insert.message_custom, true);
});

test("defaults missing sent message text to the locked template", () => {
  const result = prepareTransition(
    baseCase,
    {
      to_status: "submitted",
      doc_link: "https://example.test/mock-doc",
      message_text: null,
      message_sent: true,
      message_custom: true,
    },
    actor,
    timestamp,
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(
    result.transition.audit_insert.message_text,
    "Your PA request has been submitted and is under insurance review.",
  );
  assert.equal(result.transition.audit_insert.message_custom, false);
});

test("trims transition metadata before validation and draft creation", () => {
  const result = prepareTransition(
    baseCase,
    {
      to_status: "submitted",
      doc_link: "  uploaded-intake-packet  ",
      message_text: null,
      message_sent: false,
      message_custom: false,
    },
    actor,
    timestamp,
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.transition.case_update.doc_link, "uploaded-intake-packet");
  assert.equal(result.transition.audit_insert.doc_link, "uploaded-intake-packet");
});

test("trims reason code metadata before writing the audit draft", () => {
  const result = prepareTransition(
    {
      ...baseCase,
      status: "pending_review",
    },
    {
      to_status: "denied",
      reason_code: "  payer_requested_more_info  ",
      message_text: null,
      message_sent: false,
      message_custom: false,
    },
    actor,
    timestamp,
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.transition.audit_insert.reason_code, "payer_requested_more_info");
});

test("treats blank optional metadata as absent without replacing existing case metadata", () => {
  const result = prepareTransition(
    {
      ...baseCase,
      status: "pending_review",
      doc_link: "existing-doc",
    },
    {
      to_status: "approved",
      doc_link: "   ",
      reason_code: "   ",
      message_text: null,
      message_sent: false,
      message_custom: false,
    },
    actor,
    timestamp,
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.transition.case_update.doc_link, "existing-doc");
  assert.equal(result.transition.audit_insert.doc_link, null);
  assert.equal(result.transition.audit_insert.reason_code, null);
});

test("resolves confirmed message fields from final modal text", () => {
  assert.deepEqual(resolveConfirmedMessage("approved", "Your treatment is approved. Scheduling will contact you next."), {
    message_text: "Your treatment is approved. Scheduling will contact you next.",
    message_custom: false,
  });

  assert.deepEqual(resolveConfirmedMessage("approved", "Scheduling will call you soon."), {
    message_text: "Scheduling will call you soon.",
    message_custom: true,
  });

  assert.deepEqual(resolveConfirmedMessage("approved", null), {
    message_text: "Your treatment is approved. Scheduling will contact you next.",
    message_custom: false,
  });
});

test("keeps existing metadata when the transition request does not replace it", () => {
  const result = prepareTransition(
    {
      ...baseCase,
      status: "approved",
      doc_link: "https://example.test/existing-doc",
    },
    {
      to_status: "closed",
      appointment_link: "https://example.test/schedule",
      message_text: null,
      message_sent: false,
      message_custom: false,
    },
    actor,
    timestamp,
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.transition.case_update, {
    id: "case_001",
    status: "closed",
    updated_at: timestamp,
    doc_link: "https://example.test/existing-doc",
    appointment_link: "https://example.test/schedule",
    next_step_note: null,
  });
});
