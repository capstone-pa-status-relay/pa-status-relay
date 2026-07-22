import assert from "node:assert/strict";
import test from "node:test";

import { API_ERROR_MESSAGES, apiError, forbidden } from "../src/backend/apiErrors.ts";

test("creates the shared API error response shape", () => {
  assert.deepEqual(apiError("invalid_transition"), {
    status: 400,
    body: {
      error: "invalid_transition",
      message: "This status transition is not allowed.",
    },
  });
});

test("allows endpoint-specific messages while preserving the shared shape", () => {
  assert.deepEqual(apiError("missing_reason_code", "A reason code is required for denial transitions."), {
    status: 400,
    body: {
      error: "missing_reason_code",
      message: "A reason code is required for denial transitions.",
    },
  });
});

test("uses 403 for forbidden authorization failures when requested", () => {
  assert.deepEqual(forbidden(), {
    status: 403,
    body: {
      error: "unauthorized",
      message: API_ERROR_MESSAGES.unauthorized,
    },
  });
});

test("uses 403 for immutable audit trail violations", () => {
  assert.deepEqual(apiError("audit_immutable"), {
    status: 403,
    body: {
      error: "audit_immutable",
      message: "Audit trail entries cannot be edited or deleted.",
    },
  });
});
