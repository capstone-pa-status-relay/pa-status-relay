import assert from "node:assert/strict";
import test from "node:test";

import {
  prepareCloneCase,
  prepareResetCaseFromSnapshot,
  type CaseBaselineSnapshot,
} from "../src/backend/demoControlService.ts";
import type { AuditEntry, CaseDetail } from "../src/backend/apiTypes.ts";

const timestamp = "2026-07-22T13:00:00Z";
const actorId = "actor_001";

const currentCase: CaseDetail = {
  id: "case_001",
  patient_name: "Edited Demo Patient",
  status: "approved",
  consent_flag: true,
  doc_link: "https://example.test/edited-doc",
  appointment_link: "https://example.test/schedule",
  next_step_note: "Edited note",
  created_at: "2026-07-21T13:00:00Z",
  updated_at: "2026-07-22T12:00:00Z",
};

const baseline: CaseBaselineSnapshot = {
  patient_name: "Demo Patient 1",
  status: "new_order",
  consent_flag: false,
  doc_link: null,
  appointment_link: null,
  next_step_note: null,
};

const auditEntries: AuditEntry[] = [
  {
    id: "audit_001",
    case_id: "case_001",
    timestamp: "2026-07-22T12:00:00Z",
    actor_id: actorId,
    actor_label: "Demo Coordinator",
    action: "status_transition",
    from_status: "pending_review",
    to_status: "approved",
    reason_code: null,
    message_sent: true,
    message_custom: false,
  },
];

test("prepares reset update from a baseline snapshot", () => {
  const result = prepareResetCaseFromSnapshot(
    currentCase.id,
    baseline,
    actorId,
    timestamp,
    "event_001",
  );

  assert.deepEqual(result.case_update, {
    id: "case_001",
    patient_name: "Demo Patient 1",
    current_status: "new_order",
    consent_flag: false,
    doc_link: null,
    appointment_link: null,
    next_step_note: null,
    updated_at: timestamp,
  });
});

test("prepares reset response and demo event without audit mutations", () => {
  const beforeAudit = structuredClone(auditEntries);
  const result = prepareResetCaseFromSnapshot(
    currentCase.id,
    baseline,
    actorId,
    timestamp,
    "event_001",
  );

  assert.deepEqual(result.demo_event_insert, {
    case_id: "case_001",
    event_type: "reset",
    actor_id: actorId,
    timestamp,
    notes: null,
  });
  assert.deepEqual(result.response, {
    case: {
      id: "case_001",
      status: "new_order",
      updated_at: timestamp,
    },
    demo_event: {
      id: "event_001",
      case_id: "case_001",
      event_type: "reset",
      actor_id: actorId,
      created_at: timestamp,
    },
  });
  assert.deepEqual(auditEntries, beforeAudit);
  assert.equal(Object.hasOwn(result, "audit_insert"), false);
});

test("prepares clone case insert with new_order status and empty metadata", () => {
  const result = prepareCloneCase(
    currentCase,
    actorId,
    timestamp,
    "case_clone_001",
    "event_002",
  );

  assert.deepEqual(result.case_insert, {
    patient_name: "Edited Demo Patient",
    current_status: "new_order",
    consent_flag: true,
    doc_link: null,
    appointment_link: null,
    next_step_note: null,
    created_at: timestamp,
    updated_at: timestamp,
    created_by: actorId,
  });
});

test("prepares clone response and source demo event without copying audit rows", () => {
  const beforeAudit = structuredClone(auditEntries);
  const result = prepareCloneCase(
    currentCase,
    actorId,
    timestamp,
    "case_clone_001",
    "event_002",
  );

  assert.deepEqual(result.source_demo_event_insert, {
    case_id: "case_001",
    event_type: "clone",
    actor_id: actorId,
    timestamp,
    notes: null,
  });
  assert.deepEqual(result.response, {
    case: {
      id: "case_clone_001",
      status: "new_order",
      consent_flag: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    source_demo_event: {
      id: "event_002",
      case_id: "case_001",
      event_type: "clone",
      actor_id: actorId,
      created_at: timestamp,
    },
  });
  assert.deepEqual(auditEntries, beforeAudit);
  assert.equal(Object.hasOwn(result, "audit_inserts"), false);
});
