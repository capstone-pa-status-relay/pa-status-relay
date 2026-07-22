import type {
  ActorId,
  CaseDetail,
  CaseId,
  CloneCaseResponse,
  DemoEvent,
  DemoEventId,
  IsoTimestamp,
  ResetCaseResponse,
} from "./apiTypes.ts";
import type { CaseInsertDraft } from "./caseService.ts";
import {
  prepareCloneDemoEvent,
  prepareResetDemoEvent,
  type DemoEventInsertDraft,
} from "./demoEventService.ts";
import type { PaStatus } from "./statusMachine.ts";

export type CaseBaselineSnapshot = Pick<
  CaseDetail,
  "patient_name" | "status" | "consent_flag" | "doc_link" | "appointment_link" | "next_step_note"
>;

export type ResetCaseUpdateDraft = {
  id: CaseId;
  patient_name: string;
  current_status: PaStatus;
  consent_flag: boolean;
  doc_link: string | null;
  appointment_link: string | null;
  next_step_note: string | null;
  updated_at: IsoTimestamp;
};

export type PreparedResetCase = {
  case_update: ResetCaseUpdateDraft;
  demo_event_insert: DemoEventInsertDraft;
  response: ResetCaseResponse;
};

export type PreparedCloneCase = {
  case_insert: CaseInsertDraft;
  source_demo_event_insert: DemoEventInsertDraft;
  response: CloneCaseResponse;
};

export function prepareResetCaseFromSnapshot(
  caseId: CaseId,
  baseline: CaseBaselineSnapshot,
  actorId: ActorId,
  timestamp: IsoTimestamp,
  generatedDemoEventId: DemoEventId,
): PreparedResetCase {
  const demoEventInsert = prepareResetDemoEvent(caseId, actorId, timestamp);
  const caseUpdate: ResetCaseUpdateDraft = {
    id: caseId,
    patient_name: baseline.patient_name,
    current_status: baseline.status,
    consent_flag: baseline.consent_flag,
    doc_link: baseline.doc_link,
    appointment_link: baseline.appointment_link,
    next_step_note: baseline.next_step_note,
    updated_at: timestamp,
  };

  return {
    case_update: caseUpdate,
    demo_event_insert: demoEventInsert,
    response: {
      case: {
        id: caseId,
        status: baseline.status,
        updated_at: timestamp,
      },
      demo_event: buildDemoEventResponse(generatedDemoEventId, demoEventInsert),
    },
  };
}

export function prepareCloneCase(
  sourceCase: Pick<CaseDetail, "id" | "patient_name" | "consent_flag">,
  actorId: ActorId,
  timestamp: IsoTimestamp,
  generatedCaseId: CaseId,
  generatedDemoEventId: DemoEventId,
): PreparedCloneCase {
  const sourceDemoEventInsert = prepareCloneDemoEvent(sourceCase.id, actorId, timestamp);
  const caseInsert: CaseInsertDraft = {
    patient_name: sourceCase.patient_name,
    current_status: "new_order",
    consent_flag: sourceCase.consent_flag,
    doc_link: null,
    appointment_link: null,
    next_step_note: null,
    created_at: timestamp,
    updated_at: timestamp,
    created_by: actorId,
  };

  return {
    case_insert: caseInsert,
    source_demo_event_insert: sourceDemoEventInsert,
    response: {
      case: {
        id: generatedCaseId,
        status: "new_order",
        consent_flag: sourceCase.consent_flag,
        created_at: timestamp,
        updated_at: timestamp,
      },
      source_demo_event: buildDemoEventResponse(generatedDemoEventId, sourceDemoEventInsert),
    },
  };
}

function buildDemoEventResponse(
  id: DemoEventId,
  insert: DemoEventInsertDraft,
): DemoEvent {
  return {
    id,
    case_id: insert.case_id,
    event_type: insert.event_type,
    actor_id: insert.actor_id,
    created_at: insert.timestamp,
  };
}
