import assert from "node:assert/strict";
import test from "node:test";

import { AUDIT_CSV_COLUMNS } from "../src/backend/apiTypes.ts";

test("keeps audit CSV columns in locked contract order", () => {
  assert.deepEqual(AUDIT_CSV_COLUMNS, [
    "timestamp",
    "actor_label",
    "action",
    "from_status",
    "to_status",
    "reason_code",
    "message_sent",
    "message_custom",
  ]);
});
