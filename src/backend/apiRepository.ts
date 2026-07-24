import type {
  ActorId,
  AuditEntry,
  CaseId,
  DemoEvent,
  DemoEventId,
} from "./apiTypes.ts";
import type {
  CaseInsertDraft,
  CaseRow,
} from "./caseService.ts";
import type { ConsentCaseUpdateDraft } from "./consentService.ts";
import type {
  CaseBaselineSnapshot,
  ResetCaseUpdateDraft,
} from "./demoControlService.ts";
import type { DemoEventInsertDraft } from "./demoEventService.ts";
import type {
  TransitionAuditInsertDraft,
  TransitionCaseUpdateDraft,
} from "./transitionService.ts";

export type CaseInsertWithId = CaseInsertDraft & {
  id: CaseId;
};

export type DemoEventInsertWithId = DemoEventInsertDraft & {
  id: DemoEventId;
};

export type TransitionPersistenceResult = {
  case_row: CaseRow;
  audit_entry: AuditEntry;
};

export type ResetPersistenceResult = {
  case_row: CaseRow;
  demo_event: DemoEvent;
};

export type ClonePersistenceResult = {
  case_row: CaseRow;
  source_demo_event: DemoEvent;
};

export type BackendRepository = {
  listCaseRows(): Promise<readonly CaseRow[]>;
  getCaseRowById(caseId: CaseId): Promise<CaseRow | null>;
  insertCase(insert: CaseInsertWithId): Promise<CaseRow>;
  updateCaseConsent(update: ConsentCaseUpdateDraft): Promise<CaseRow>;
  listAuditEntriesForCase(caseId: CaseId): Promise<readonly AuditEntry[]>;
  getBaselineSnapshot(caseId: CaseId): Promise<CaseBaselineSnapshot | null>;
  applyTransition(
    caseUpdate: TransitionCaseUpdateDraft,
    auditInsert: TransitionAuditInsertDraft,
  ): Promise<TransitionPersistenceResult>;
  resetCase(
    caseUpdate: ResetCaseUpdateDraft,
    demoEventInsert: DemoEventInsertWithId,
  ): Promise<ResetPersistenceResult>;
  cloneCase(
    caseInsert: CaseInsertWithId,
    sourceDemoEventInsert: DemoEventInsertWithId,
  ): Promise<ClonePersistenceResult>;
  insertDemoEvent(insert: DemoEventInsertWithId): Promise<DemoEvent>;
};

export type BackendRequestContext = {
  repository: BackendRepository;
  actor: {
    actor_id: ActorId;
    actor_label: string;
  };
  now(): string;
  generateCaseId(): CaseId;
  generateDemoEventId(): DemoEventId;
};
