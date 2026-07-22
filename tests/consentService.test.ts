import assert from "node:assert/strict";
import test from "node:test";

import { prepareConsentUpdate } from "../src/backend/consentService.ts";
import type { AuditEntry, CaseDetail } from "../src/backend/apiTypes.ts";

const baseCase: CaseDetail = {
  id: "case_001",
  patient_name: "Mock Patient",
  status: "pending_review",
  consent_flag: false,
  doc_link: null,
  appointment_link: null,
  next_step_note: null,
  created_at: "2026-07-21T14:00:00Z",
  updated_at: "2026-07-21T15:00:00Z",
};

const priorAuditEntries: AuditEntry[] = [
  {
    id: "audit_001",
    case_id: "case_001",
    timestamp: "2026-07-21T15:00:00Z",
    actor_id: "actor_001",
    actor_label: "Demo Coordinator",
    action: "message_suppressed",
    from_status: "submitted",
    to_status: "pending_review",
    reason_code: "no_consent",
    message_sent: false,
    message_custom: false,
  },
];

test("prepares a consent flag update and API response", () => {
  const result = prepareConsentUpdate(
    baseCase,
    { consent_flag: true },
    "2026-07-22T11:00:00Z",
  );

  assert.deepEqual(result, {
    ok: true,
    consent_update: {
      case_update: {
        id: "case_001",
        consent_flag: true,
        updated_at: "2026-07-22T11:00:00Z",
      },
      response: {
        case: {
          id: "case_001",
          status: "pending_review",
          consent_flag: true,
          updated_at: "2026-07-22T11:00:00Z",
        },
      },
    },
  });
});

test("prepares a consent flag update to false", () => {
  const result = prepareConsentUpdate(
    { ...baseCase, consent_flag: true },
    { consent_flag: false },
    "2026-07-22T11:00:00Z",
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.consent_update.case_update.consent_flag, false);
  assert.equal(result.consent_update.response.case.consent_flag, false);
});

test("returns the shared error shape when consent_flag is missing", () => {
  assert.deepEqual(
    prepareConsentUpdate(baseCase, {}, "2026-07-22T11:00:00Z"),
    {
      ok: false,
      error: {
        status: 400,
        body: {
          error: "missing_consent_flag",
          message: "Consent flag is required.",
        },
      },
    },
  );
});

test("does not create retroactive audit or message changes when consent becomes true", () => {
  const before = structuredClone(priorAuditEntries);
  const result = prepareConsentUpdate(
    baseCase,
    { consent_flag: true },
    "2026-07-22T11:00:00Z",
  );

  assert.equal(result.ok, true);
  assert.deepEqual(priorAuditEntries, before);
  if (!result.ok) {
    return;
  }

  assert.equal(Object.hasOwn(result.consent_update, "audit_insert"), false);
  assert.equal(Object.hasOwn(result.consent_update, "message_send"), false);
  assert.equal(priorAuditEntries[0].message_sent, false);
});
