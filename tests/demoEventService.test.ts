import assert from "node:assert/strict";
import test from "node:test";

import { DEMO_EVENT_TYPES, type AuditEntry } from "../src/backend/apiTypes.ts";
import {
  mapDemoEventRowToApi,
  prepareCloneDemoEvent,
  prepareDemoEventInsert,
  prepareReopenDemoEvent,
  prepareResetDemoEvent,
  type DemoEventRow,
} from "../src/backend/demoEventService.ts";

const timestamp = "2026-07-22T12:00:00Z";

const demoEventRow: DemoEventRow = {
  id: "event_001",
  case_id: "case_001",
  event_type: "reset",
  actor_id: "actor_001",
  timestamp,
  notes: null,
};

const auditEntries: AuditEntry[] = [
  {
    id: "audit_001",
    case_id: "case_001",
    timestamp: "2026-07-22T11:00:00Z",
    actor_id: "actor_001",
    actor_label: "Demo Coordinator",
    action: "status_transition",
    from_status: "new_order",
    to_status: "submitted",
    reason_code: null,
    message_sent: true,
    message_custom: false,
  },
];

test("defines the locked demo event types", () => {
  assert.deepEqual(DEMO_EVENT_TYPES, ["reset", "clone", "reopen"]);
});

test("prepares a reset demo event insert draft", () => {
  assert.deepEqual(prepareResetDemoEvent("case_001", "actor_001", timestamp), {
    case_id: "case_001",
    event_type: "reset",
    actor_id: "actor_001",
    timestamp,
    notes: null,
  });
});

test("prepares a clone demo event insert draft for the source case", () => {
  assert.deepEqual(prepareCloneDemoEvent("source_case_001", "actor_001", timestamp), {
    case_id: "source_case_001",
    event_type: "clone",
    actor_id: "actor_001",
    timestamp,
    notes: null,
  });
});

test("prepares a reopen demo event insert draft without changing case status", () => {
  assert.deepEqual(prepareReopenDemoEvent("case_001", "actor_001", timestamp), {
    case_id: "case_001",
    event_type: "reopen",
    actor_id: "actor_001",
    timestamp,
    notes: null,
  });
});

test("normalizes optional notes on generic demo event inserts", () => {
  assert.deepEqual(
    prepareDemoEventInsert("case_001", "reset", "actor_001", timestamp, "  restored baseline  "),
    {
      case_id: "case_001",
      event_type: "reset",
      actor_id: "actor_001",
      timestamp,
      notes: "restored baseline",
    },
  );

  assert.equal(
    prepareDemoEventInsert("case_001", "reset", "actor_001", timestamp, "   ").notes,
    null,
  );
});

test("maps Supabase demo event timestamp to API created_at", () => {
  assert.deepEqual(mapDemoEventRowToApi(demoEventRow, "Demo Coordinator"), {
    id: "event_001",
    case_id: "case_001",
    event_type: "reset",
    actor_id: "actor_001",
    actor_label: "Demo Coordinator",
    created_at: timestamp,
  });
});

test("keeps demo events separate from audit trail rows", () => {
  const beforeAudit = structuredClone(auditEntries);
  const demoEvent = prepareResetDemoEvent("case_001", "actor_001", timestamp);

  assert.equal(demoEvent.event_type, "reset");
  assert.deepEqual(auditEntries, beforeAudit);
  assert.equal(Object.hasOwn(demoEvent, "from_status"), false);
  assert.equal(Object.hasOwn(demoEvent, "to_status"), false);
  assert.equal(Object.hasOwn(demoEvent, "message_sent"), false);
});
