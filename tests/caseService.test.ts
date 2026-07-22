import assert from "node:assert/strict";
import test from "node:test";

import {
  getCase,
  listCases,
  mapCaseRowToDetail,
  mapCaseRowToSummary,
  prepareCreateCase,
  type CaseRow,
} from "../src/backend/caseService.ts";

const rows: CaseRow[] = [
  {
    id: "case_001",
    patient_name: "Mock Patient One",
    current_status: "submitted",
    consent_flag: true,
    doc_link: "https://example.test/doc-1",
    appointment_link: null,
    next_step_note: null,
    created_at: "2026-07-21T13:00:00Z",
    updated_at: "2026-07-21T15:00:00Z",
    created_by: "actor_001",
  },
  {
    id: "case_002",
    patient_name: "Mock Patient Two",
    current_status: "new_order",
    consent_flag: false,
    doc_link: null,
    appointment_link: null,
    next_step_note: null,
    created_at: "2026-07-21T12:00:00Z",
    updated_at: "2026-07-21T14:00:00Z",
    created_by: "actor_001",
  },
  {
    id: "case_003",
    patient_name: "Mock Patient Three",
    current_status: "submitted",
    consent_flag: true,
    doc_link: "https://example.test/doc-3",
    appointment_link: null,
    next_step_note: null,
    created_at: "2026-07-21T11:00:00Z",
    updated_at: "2026-07-21T16:00:00Z",
    created_by: "actor_002",
  },
];

test("maps Supabase case rows to API case summaries", () => {
  assert.deepEqual(mapCaseRowToSummary(rows[0]), {
    id: "case_001",
    patient_name: "Mock Patient One",
    status: "submitted",
    consent_flag: true,
    updated_at: "2026-07-21T15:00:00Z",
  });
});

test("maps Supabase current_status to API status for case details", () => {
  assert.deepEqual(mapCaseRowToDetail(rows[0]), {
    id: "case_001",
    patient_name: "Mock Patient One",
    status: "submitted",
    consent_flag: true,
    doc_link: "https://example.test/doc-1",
    appointment_link: null,
    next_step_note: null,
    created_at: "2026-07-21T13:00:00Z",
    updated_at: "2026-07-21T15:00:00Z",
  });
});

test("lists cases with the correct API response shape", () => {
  assert.deepEqual(listCases(rows), {
    cases: [
      {
        id: "case_001",
        patient_name: "Mock Patient One",
        status: "submitted",
        consent_flag: true,
        updated_at: "2026-07-21T15:00:00Z",
      },
      {
        id: "case_002",
        patient_name: "Mock Patient Two",
        status: "new_order",
        consent_flag: false,
        updated_at: "2026-07-21T14:00:00Z",
      },
      {
        id: "case_003",
        patient_name: "Mock Patient Three",
        status: "submitted",
        consent_flag: true,
        updated_at: "2026-07-21T16:00:00Z",
      },
    ],
  });
});

test("filters cases by status", () => {
  const response = listCases(rows, { status: "submitted" });

  assert.deepEqual(
    response.cases.map((caseSummary) => caseSummary.id),
    ["case_001", "case_003"],
  );
});

test("sorts cases by updated_at descending by default when sort is requested", () => {
  const response = listCases(rows, { sort: "updated_at" });

  assert.deepEqual(
    response.cases.map((caseSummary) => caseSummary.id),
    ["case_003", "case_001", "case_002"],
  );
});

test("sorts cases by updated_at ascending when requested", () => {
  const response = listCases(rows, { sort: "updated_at", order: "asc" });

  assert.deepEqual(
    response.cases.map((caseSummary) => caseSummary.id),
    ["case_002", "case_001", "case_003"],
  );
});

test("returns a single case detail", () => {
  assert.deepEqual(getCase(rows[1]), {
    ok: true,
    response: {
      case: {
        id: "case_002",
        patient_name: "Mock Patient Two",
        status: "new_order",
        consent_flag: false,
        doc_link: null,
        appointment_link: null,
        next_step_note: null,
        created_at: "2026-07-21T12:00:00Z",
        updated_at: "2026-07-21T14:00:00Z",
      },
    },
  });
});

test("returns the shared error shape when a case is missing", () => {
  assert.deepEqual(getCase(null), {
    ok: false,
    error: {
      status: 404,
      body: {
        error: "case_not_found",
        message: "Case not found.",
      },
    },
  });
});

test("prepares a create-case insert draft and API response", () => {
  const result = prepareCreateCase(
    {
      patient_name: "  Mock Patient Four  ",
      consent_flag: true,
      doc_link: "  https://example.test/doc-4  ",
    },
    "actor_001",
    "2026-07-22T10:00:00Z",
    "case_004",
  );

  assert.deepEqual(result, {
    ok: true,
    create: {
      insert: {
        patient_name: "Mock Patient Four",
        current_status: "new_order",
        consent_flag: true,
        doc_link: "https://example.test/doc-4",
        appointment_link: null,
        next_step_note: null,
        created_at: "2026-07-22T10:00:00Z",
        updated_at: "2026-07-22T10:00:00Z",
        created_by: "actor_001",
      },
      response: {
        case: {
          id: "case_004",
          patient_name: "Mock Patient Four",
          status: "new_order",
          consent_flag: true,
          doc_link: "https://example.test/doc-4",
          appointment_link: null,
          next_step_note: null,
          created_at: "2026-07-22T10:00:00Z",
          updated_at: "2026-07-22T10:00:00Z",
        },
      },
    },
  });
});

test("requires patient_name when creating a case", () => {
  assert.deepEqual(
    prepareCreateCase(
      {
        patient_name: "   ",
        consent_flag: true,
      },
      "actor_001",
      "2026-07-22T10:00:00Z",
      "case_004",
    ),
    {
      ok: false,
      error: {
        status: 400,
        body: {
          error: "missing_patient_name",
          message: "Patient name is required.",
        },
      },
    },
  );
});

test("requires consent_flag when creating a case", () => {
  assert.deepEqual(
    prepareCreateCase(
      {
        patient_name: "Mock Patient Four",
      },
      "actor_001",
      "2026-07-22T10:00:00Z",
      "case_004",
    ),
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
