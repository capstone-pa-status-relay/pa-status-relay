import assert from "node:assert/strict";
import test from "node:test";

import { buildAuditCsv, buildAuditCsvExport, buildAuditCsvFilename } from "../src/backend/auditCsv.ts";
import type { AuditEntry } from "../src/backend/apiTypes.ts";

const baseAuditEntry: AuditEntry = {
  id: "audit_001",
  case_id: "case_001",
  timestamp: "2026-07-21T15:00:00Z",
  actor_id: "actor_001",
  actor_label: "Demo Coordinator",
  action: "status_transition",
  from_status: "new_order",
  to_status: "submitted",
  reason_code: null,
  message_sent: true,
  message_custom: false,
};

test("builds audit CSV with the locked header order", () => {
  assert.equal(
    buildAuditCsv([]),
    "timestamp,actor_label,action,from_status,to_status,reason_code,message_sent,message_custom",
  );
});

test("serializes audit entries and leaves null values empty", () => {
  assert.equal(
    buildAuditCsv([baseAuditEntry]),
    [
      "timestamp,actor_label,action,from_status,to_status,reason_code,message_sent,message_custom",
      "2026-07-21T15:00:00Z,Demo Coordinator,status_transition,new_order,submitted,,true,false",
    ].join("\n"),
  );
});

test("escapes CSV values that contain commas, quotes, or line breaks", () => {
  assert.equal(
    buildAuditCsv([
      {
        ...baseAuditEntry,
        actor_label: 'Coordinator, "Demo"',
        reason_code: "payer requested\nrecords",
      },
    ]),
    [
      "timestamp,actor_label,action,from_status,to_status,reason_code,message_sent,message_custom",
      '2026-07-21T15:00:00Z,"Coordinator, ""Demo""",status_transition,new_order,submitted,"payer requested\nrecords",true,false',
    ].join("\n"),
  );
});

test("builds the locked audit CSV filename format", () => {
  assert.equal(
    buildAuditCsvFilename("case_001", "2026-07-21T18:45:11Z"),
    "audit_case_001_2026-07-21.csv",
  );
});

test("builds a complete CSV export response payload", () => {
  assert.deepEqual(buildAuditCsvExport("case_001", [baseAuditEntry], "2026-07-21T18:45:11Z"), {
    filename: "audit_case_001_2026-07-21.csv",
    contentType: "text/csv",
    body: [
      "timestamp,actor_label,action,from_status,to_status,reason_code,message_sent,message_custom",
      "2026-07-21T15:00:00Z,Demo Coordinator,status_transition,new_order,submitted,,true,false",
    ].join("\n"),
  });
});
