import type {
  ActorId,
  AuditEntry,
  CaseId,
} from "./apiTypes.ts";
import type {
  CaseInsertDraft,
  CaseRow,
} from "./caseService.ts";
import type { ConsentCaseUpdateDraft } from "./consentService.ts";
import type {
  TransitionAuditInsertDraft,
  TransitionCaseUpdateDraft,
} from "./transitionService.ts";

export type CaseInsertWithId = CaseInsertDraft & {
  id: CaseId;
};

export type TransitionPersistenceResult = {
  case_row: CaseRow;
  audit_entry: AuditEntry;
};

export type BackendRepository = {
  listCaseRows(): Promise<readonly CaseRow[]>;
  getCaseRowById(caseId: CaseId): Promise<CaseRow | null>;
  insertCase(insert: CaseInsertWithId): Promise<CaseRow>;
  updateCaseConsent(update: ConsentCaseUpdateDraft): Promise<CaseRow>;
  applyTransition(
    caseUpdate: TransitionCaseUpdateDraft,
    auditInsert: TransitionAuditInsertDraft,
  ): Promise<TransitionPersistenceResult>;
};

export type BackendRequestContext = {
  repository: BackendRepository;
  actor: {
    actor_id: ActorId;
    actor_label: string;
  };
  now(): string;
  generateCaseId(): CaseId;
};
