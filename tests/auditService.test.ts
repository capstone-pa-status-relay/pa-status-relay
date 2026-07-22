import assert from "node:assert/strict";
import test from "node:test";

import { listAuditEntriesForCase } from "../src/backend/auditService.ts";
import type { AuditEntry } from "../src/backend/apiTypes.ts";

const auditEntries: AuditEntry[] = [
  {
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
  },
  {
    id: "audit_002",
    case_id: "case_001",
    timestamp: "2026-07-21T15:03:00Z",
    actor_id: "actor_001",
    actor_label: "Demo Coordinator",
    action: "message_suppressed",
    from_status: "submitted",
    to_status: "pending_review",
    reason_code: "no_consent",
    message_sent: false,
    message_custom: false,
  },
  {
    id: "audit_003",
    case_id: "case_001",
    timestamp: "2026-07-21T15:02:00Z",
    actor_id: "actor_002",
    actor_label: "Demo Coordinator",
    action: "status_transition",
    from_status: "pending_review",
    to_status: "approved",
    reason_code: null,
    message_sent: true,
    message_custom: true,
  },
  {
    id: "audit_004",
    case_id: "case_002",
    timestamp: "2026-07-21T15:04:00Z",
    actor_id: "actor_001",
    actor_label: "Demo Coordinator",
    action: "status_transition",
    from_status: "new_order",
    to_status: "needs_documentation",
    reason_code: null,
    message_sent: true,
    message_custom: false,
  },
];

test("returns audit entries for one case in reverse chronological order by default", () => {
  const response = listAuditEntriesForCase(auditEntries, "case_001");

  assert.deepEqual(
    response.audit.map((entry) => entry.id),
    ["audit_002", "audit_003", "audit_001"],
  );
});

test("does not include audit entries from other cases", () => {
  const response = listAuditEntriesForCase(auditEntries, "case_002");

  assert.deepEqual(
    response.audit.map((entry) => entry.id),
    ["audit_004"],
  );
});

test("filters audit entries by actor_id", () => {
  const response = listAuditEntriesForCase(auditEntries, "case_001", {
    actor_id: "actor_002",
  });

  assert.deepEqual(
    response.audit.map((entry) => entry.id),
    ["audit_003"],
  );
});

test("filters audit entries by action_type", () => {
  const response = listAuditEntriesForCase(auditEntries, "case_001", {
    action_type: "message_suppressed",
  });

  assert.deepEqual(
    response.audit.map((entry) => entry.id),
    ["audit_002"],
  );
});

test("filters audit entries by inclusive date range", () => {
  const response = listAuditEntriesForCase(auditEntries, "case_001", {
    date_from: "2026-07-21T15:02:00Z",
    date_to: "2026-07-21T15:03:00Z",
  });

  assert.deepEqual(
    response.audit.map((entry) => entry.id),
    ["audit_002", "audit_003"],
  );
});

test("combines actor, action, and date filters", () => {
  const response = listAuditEntriesForCase(auditEntries, "case_001", {
    actor_id: "actor_001",
    action_type: "status_transition",
    date_from: "2026-07-21T14:59:00Z",
    date_to: "2026-07-21T15:01:00Z",
  });

  assert.deepEqual(
    response.audit.map((entry) => entry.id),
    ["audit_001"],
  );
});
