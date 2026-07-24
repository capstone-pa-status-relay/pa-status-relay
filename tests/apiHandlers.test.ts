import assert from "node:assert/strict";
import test from "node:test";

import {
  handleCloneCase,
  handleCreateCase,
  handleExportAudit,
  handleGetCase,
  handleGetAudit,
  handleListCases,
  handleReopenCase,
  handleResetCase,
  handleTransitionCase,
  handleUpdateCaseConsent,
} from "../src/backend/apiHandlers.ts";
import type { AuditEntry, DemoEvent } from "../src/backend/apiTypes.ts";
import type {
  BackendRepository,
  BackendRequestContext,
  CaseInsertWithId,
  ClonePersistenceResult,
  DemoEventInsertWithId,
  ResetPersistenceResult,
  TransitionPersistenceResult,
} from "../src/backend/apiRepository.ts";
import type { CaseRow } from "../src/backend/caseService.ts";
import type { ConsentCaseUpdateDraft } from "../src/backend/consentService.ts";
import type {
  CaseBaselineSnapshot,
  ResetCaseUpdateDraft,
} from "../src/backend/demoControlService.ts";
import type {
  TransitionAuditInsertDraft,
  TransitionCaseUpdateDraft,
} from "../src/backend/transitionService.ts";

const timestamp = "2026-07-23T10:00:00Z";

const seedRows: CaseRow[] = [
  {
    id: "case_001",
    patient_name: "Mock Patient One",
    current_status: "new_order",
    consent_flag: true,
    doc_link: null,
    appointment_link: null,
    next_step_note: null,
    created_at: "2026-07-21T15:00:00Z",
    updated_at: "2026-07-21T15:00:00Z",
    created_by: "actor_001",
  },
  {
    id: "case_002",
    patient_name: "Mock Patient Two",
    current_status: "pending_review",
    consent_flag: false,
    doc_link: "https://example.test/doc",
    appointment_link: null,
    next_step_note: null,
    created_at: "2026-07-21T14:00:00Z",
    updated_at: "2026-07-21T14:00:00Z",
    created_by: "actor_001",
  },
];

const seedAuditEntries: AuditEntry[] = [
  {
    id: "audit_001",
    case_id: "case_001",
    timestamp: "2026-07-23T09:00:00Z",
    actor_id: "actor_001",
    actor_label: "Demo Coordinator",
    action: "status_transition",
    from_status: "new_order",
    to_status: "submitted",
    reason_code: null,
    message_sent: true,
    message_text: "Your PA request has been submitted and is under insurance review.",
    message_custom: false,
  },
  {
    id: "audit_002",
    case_id: "case_001",
    timestamp: "2026-07-23T09:05:00Z",
    actor_id: "actor_001",
    actor_label: "Demo Coordinator",
    action: "message_suppressed",
    from_status: "submitted",
    to_status: "pending_review",
    reason_code: "no_consent",
    message_sent: false,
    message_text: null,
    message_custom: false,
  },
];

test("lists cases through the repository boundary using API response field names", async () => {
  const context = makeContext();

  assert.deepEqual(await handleListCases(context, { sort: "updated_at" }), {
    status: 200,
    body: {
      cases: [
        {
          id: "case_001",
          patient_name: "Mock Patient One",
          status: "new_order",
          consent_flag: true,
          updated_at: "2026-07-21T15:00:00Z",
        },
        {
          id: "case_002",
          patient_name: "Mock Patient Two",
          status: "pending_review",
          consent_flag: false,
          updated_at: "2026-07-21T14:00:00Z",
        },
      ],
    },
  });
});

test("returns one case detail or shared not-found error", async () => {
  const context = makeContext();

  assert.equal((await handleGetCase(context, "case_001")).status, 200);
  assert.deepEqual(await handleGetCase(context, "missing_case"), {
    status: 404,
    body: {
      error: "case_not_found",
      message: "Case not found.",
    },
  });
});

test("creates a case with generated id and repository insert draft", async () => {
  const repository = new InMemoryBackendRepository();
  const context = makeContext(repository);
  const result = await handleCreateCase(context, {
    patient_name: "  New Demo Patient  ",
    consent_flag: true,
    doc_link: "  intake-packet  ",
  });

  assert.equal(result.status, 201);
  assert.deepEqual(repository.insertedCases[0], {
    id: "generated_case_001",
    patient_name: "New Demo Patient",
    current_status: "new_order",
    consent_flag: true,
    doc_link: "intake-packet",
    appointment_link: null,
    next_step_note: null,
    created_at: timestamp,
    updated_at: timestamp,
    created_by: "actor_001",
  });
});

test("does not insert a case when create validation fails", async () => {
  const repository = new InMemoryBackendRepository();
  const context = makeContext(repository);
  const result = await handleCreateCase(context, {
    patient_name: " ",
    consent_flag: true,
  });

  assert.deepEqual(result, {
    status: 400,
    body: {
      error: "missing_patient_name",
      message: "Patient name is required.",
    },
  });
  assert.equal(repository.insertedCases.length, 0);
});

test("updates consent through the repository boundary", async () => {
  const repository = new InMemoryBackendRepository();
  const context = makeContext(repository);
  const result = await handleUpdateCaseConsent(context, "case_002", {
    consent_flag: true,
  });

  assert.deepEqual(result, {
    status: 200,
    body: {
      case: {
        id: "case_002",
        status: "pending_review",
        consent_flag: true,
        updated_at: timestamp,
      },
    },
  });
  assert.deepEqual(repository.consentUpdates[0], {
    id: "case_002",
    consent_flag: true,
    updated_at: timestamp,
  });
});

test("persists a valid transition with case update and audit insert drafts", async () => {
  const repository = new InMemoryBackendRepository();
  const context = makeContext(repository);
  const result = await handleTransitionCase(context, "case_001", {
    to_status: "submitted",
    doc_link: "  uploaded-doc  ",
    reason_code: null,
    appointment_link: null,
    next_step_note: null,
    message_text: "Your PA request has been submitted and is under insurance review.",
    message_sent: true,
    message_custom: true,
  });

  assert.equal(result.status, 200);
  assert.deepEqual(repository.transitionCaseUpdates[0], {
    id: "case_001",
    status: "submitted",
    updated_at: timestamp,
    doc_link: "uploaded-doc",
    appointment_link: null,
    next_step_note: null,
  });
  assert.deepEqual(repository.transitionAuditInserts[0], {
    case_id: "case_001",
    action: "status_transition",
    from_status: "new_order",
    to_status: "submitted",
    actor_id: "actor_001",
    actor_label: "Demo Coordinator",
    timestamp,
    reason_code: null,
    doc_link: "uploaded-doc",
    message_sent: true,
    message_text: "Your PA request has been submitted and is under insurance review.",
    message_custom: false,
  });
});

test("does not persist an invalid transition", async () => {
  const repository = new InMemoryBackendRepository();
  const context = makeContext(repository);
  const result = await handleTransitionCase(context, "case_002", {
    to_status: "submitted",
    doc_link: null,
    reason_code: null,
    appointment_link: null,
    next_step_note: null,
    message_text: null,
    message_sent: false,
    message_custom: false,
  });

  assert.deepEqual(result, {
    status: 400,
    body: {
      error: "invalid_transition",
      message: "This status transition is not allowed.",
    },
  });
  assert.equal(repository.transitionCaseUpdates.length, 0);
  assert.equal(repository.transitionAuditInserts.length, 0);
});

test("returns audit entries through the repository boundary in reverse chronological order", async () => {
  const context = makeContext();

  assert.deepEqual(await handleGetAudit(context, "case_001"), {
    status: 200,
    body: {
      audit: [seedAuditEntries[1], seedAuditEntries[0]],
    },
  });
});

test("exports audit CSV through the repository boundary", async () => {
  const context = makeContext();
  const result = await handleExportAudit(context, "case_001");

  assert.equal(result.status, 200);
  if (result.status !== 200) {
    return;
  }

  assert.equal(result.body.filename, "audit_case_001_2026-07-23.csv");
  assert.equal(result.body.contentType, "text/csv");
  assert.match(result.body.body, /^timestamp,actor_label,action,from_status,to_status,reason_code,message_sent,message_custom/);
  assert.match(result.body.body, /message_suppressed,submitted,pending_review,no_consent,false,false/);
});

test("resets a case through baseline snapshot and demo event repository methods", async () => {
  const repository = new InMemoryBackendRepository();
  const context = makeContext(repository);
  const result = await handleResetCase(context, "case_001", { confirm: true });

  assert.equal(result.status, 200);
  assert.deepEqual(repository.resetCaseUpdates[0], {
    id: "case_001",
    patient_name: "Baseline Demo Patient",
    current_status: "new_order",
    consent_flag: true,
    doc_link: null,
    appointment_link: null,
    next_step_note: null,
    updated_at: timestamp,
  });
  assert.deepEqual(repository.demoEventInserts[0], {
    id: "generated_event_001",
    case_id: "case_001",
    event_type: "reset",
    actor_id: "actor_001",
    timestamp,
    notes: null,
  });
});

test("requires explicit reset confirmation", async () => {
  const context = makeContext();

  assert.deepEqual(await handleResetCase(context, "case_001", {}), {
    status: 400,
    body: {
      error: "missing_reset_confirmation",
      message: "Reset confirmation is required.",
    },
  });
});

test("clones a case with an independent new_order case and source demo event", async () => {
  const repository = new InMemoryBackendRepository();
  const context = makeContext(repository);
  const result = await handleCloneCase(context, "case_001");

  assert.equal(result.status, 201);
  assert.deepEqual(repository.insertedCases[0], {
    id: "generated_case_001",
    patient_name: "Mock Patient One",
    current_status: "new_order",
    consent_flag: true,
    doc_link: null,
    appointment_link: null,
    next_step_note: null,
    created_at: timestamp,
    updated_at: timestamp,
    created_by: "actor_001",
  });
  assert.deepEqual(repository.demoEventInserts[0], {
    id: "generated_event_001",
    case_id: "case_001",
    event_type: "clone",
    actor_id: "actor_001",
    timestamp,
    notes: null,
  });
});

test("reopen writes a demo event without changing case status", async () => {
  const repository = new InMemoryBackendRepository();
  const context = makeContext(repository);
  const result = await handleReopenCase(context, "case_002");

  assert.equal(result.status, 200);
  assert.deepEqual(repository.demoEventInserts[0], {
    id: "generated_event_001",
    case_id: "case_002",
    event_type: "reopen",
    actor_id: "actor_001",
    timestamp,
    notes: null,
  });
  assert.equal(repository.requireCaseForTest("case_002").current_status, "pending_review");
});

function makeContext(repository = new InMemoryBackendRepository()): BackendRequestContext {
  return {
    repository,
    actor: {
      actor_id: "actor_001",
      actor_label: "Demo Coordinator",
    },
    now: () => timestamp,
    generateCaseId: () => "generated_case_001",
    generateDemoEventId: () => "generated_event_001",
  };
}

class InMemoryBackendRepository implements BackendRepository {
  readonly insertedCases: CaseInsertWithId[] = [];
  readonly consentUpdates: ConsentCaseUpdateDraft[] = [];
  readonly transitionCaseUpdates: TransitionCaseUpdateDraft[] = [];
  readonly transitionAuditInserts: TransitionAuditInsertDraft[] = [];
  readonly resetCaseUpdates: ResetCaseUpdateDraft[] = [];
  readonly demoEventInserts: DemoEventInsertWithId[] = [];
  private readonly auditEntries: AuditEntry[];
  private readonly baselines = new Map<string, CaseBaselineSnapshot>([
    [
      "case_001",
      {
        patient_name: "Baseline Demo Patient",
        status: "new_order",
        consent_flag: true,
        doc_link: null,
        appointment_link: null,
        next_step_note: null,
      },
    ],
  ]);
  private readonly rows: CaseRow[];

  constructor(rows: readonly CaseRow[] = seedRows, auditEntries: readonly AuditEntry[] = seedAuditEntries) {
    this.rows = rows.map((row) => ({ ...row }));
    this.auditEntries = auditEntries.map((entry) => ({ ...entry }));
  }

  async listCaseRows(): Promise<readonly CaseRow[]> {
    return this.rows;
  }

  async getCaseRowById(caseId: string): Promise<CaseRow | null> {
    return this.rows.find((row) => row.id === caseId) ?? null;
  }

  async insertCase(insert: CaseInsertWithId): Promise<CaseRow> {
    this.insertedCases.push(insert);
    const row: CaseRow = {
      ...insert,
      created_by: insert.created_by,
    };
    this.rows.push(row);

    return row;
  }

  async updateCaseConsent(update: ConsentCaseUpdateDraft): Promise<CaseRow> {
    this.consentUpdates.push(update);
    const row = this.requireCase(update.id);
    row.consent_flag = update.consent_flag;
    row.updated_at = update.updated_at;

    return row;
  }

  async listAuditEntriesForCase(caseId: string): Promise<readonly AuditEntry[]> {
    return this.auditEntries.filter((entry) => entry.case_id === caseId);
  }

  async getBaselineSnapshot(caseId: string): Promise<CaseBaselineSnapshot | null> {
    return this.baselines.get(caseId) ?? null;
  }

  async applyTransition(
    caseUpdate: TransitionCaseUpdateDraft,
    auditInsert: TransitionAuditInsertDraft,
  ): Promise<TransitionPersistenceResult> {
    this.transitionCaseUpdates.push(caseUpdate);
    this.transitionAuditInserts.push(auditInsert);

    const row = this.requireCase(caseUpdate.id);
    row.current_status = caseUpdate.status;
    row.updated_at = caseUpdate.updated_at;
    row.doc_link = caseUpdate.doc_link;
    row.appointment_link = caseUpdate.appointment_link;
    row.next_step_note = caseUpdate.next_step_note;

    return {
      case_row: row,
      audit_entry: buildAuditEntry(auditInsert),
    };
  }

  async resetCase(
    caseUpdate: ResetCaseUpdateDraft,
    demoEventInsert: DemoEventInsertWithId,
  ): Promise<ResetPersistenceResult> {
    this.resetCaseUpdates.push(caseUpdate);
    this.demoEventInserts.push(demoEventInsert);

    const row = this.requireCase(caseUpdate.id);
    row.patient_name = caseUpdate.patient_name;
    row.current_status = caseUpdate.current_status;
    row.consent_flag = caseUpdate.consent_flag;
    row.doc_link = caseUpdate.doc_link;
    row.appointment_link = caseUpdate.appointment_link;
    row.next_step_note = caseUpdate.next_step_note;
    row.updated_at = caseUpdate.updated_at;

    return {
      case_row: row,
      demo_event: buildDemoEvent(demoEventInsert),
    };
  }

  async cloneCase(
    caseInsert: CaseInsertWithId,
    sourceDemoEventInsert: DemoEventInsertWithId,
  ): Promise<ClonePersistenceResult> {
    this.demoEventInserts.push(sourceDemoEventInsert);
    const row = await this.insertCase(caseInsert);

    return {
      case_row: row,
      source_demo_event: buildDemoEvent(sourceDemoEventInsert),
    };
  }

  async insertDemoEvent(insert: DemoEventInsertWithId): Promise<DemoEvent> {
    this.demoEventInserts.push(insert);
    return buildDemoEvent(insert);
  }

  requireCaseForTest(caseId: string): CaseRow {
    return this.requireCase(caseId);
  }

  private requireCase(caseId: string): CaseRow {
    const row = this.rows.find((caseRow) => caseRow.id === caseId);

    if (!row) {
      throw new Error(`Missing test case row: ${caseId}`);
    }

    return row;
  }
}

function buildAuditEntry(insert: TransitionAuditInsertDraft): AuditEntry {
  return {
    id: "generated_audit_001",
    case_id: insert.case_id,
    timestamp: insert.timestamp,
    actor_id: insert.actor_id,
    actor_label: insert.actor_label,
    action: insert.action,
    from_status: insert.from_status,
    to_status: insert.to_status,
    reason_code: insert.reason_code,
    message_sent: insert.message_sent,
    message_text: insert.message_text,
    message_custom: insert.message_custom,
  };
}

function buildDemoEvent(insert: DemoEventInsertWithId): DemoEvent {
  return {
    id: insert.id,
    case_id: insert.case_id,
    event_type: insert.event_type,
    actor_id: insert.actor_id,
    actor_label: "Demo Coordinator",
    created_at: insert.timestamp,
  };
}
