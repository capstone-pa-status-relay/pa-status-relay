import type {
  ActorId,
  CaseId,
  DemoEvent,
  DemoEventId,
  DemoEventType,
  IsoTimestamp,
} from "./apiTypes.ts";

export type DemoEventRow = {
  id: DemoEventId;
  case_id: CaseId;
  event_type: DemoEventType;
  actor_id: ActorId;
  timestamp: IsoTimestamp;
  notes: string | null;
};

export type DemoEventInsertDraft = {
  case_id: CaseId;
  event_type: DemoEventType;
  actor_id: ActorId;
  timestamp: IsoTimestamp;
  notes: string | null;
};

export function prepareDemoEventInsert(
  caseId: CaseId,
  eventType: DemoEventType,
  actorId: ActorId,
  timestamp: IsoTimestamp,
  notes: string | null = null,
): DemoEventInsertDraft {
  return {
    case_id: caseId,
    event_type: eventType,
    actor_id: actorId,
    timestamp,
    notes: normalizeOptionalText(notes),
  };
}

export function prepareResetDemoEvent(
  caseId: CaseId,
  actorId: ActorId,
  timestamp: IsoTimestamp,
): DemoEventInsertDraft {
  return prepareDemoEventInsert(caseId, "reset", actorId, timestamp);
}

export function prepareCloneDemoEvent(
  sourceCaseId: CaseId,
  actorId: ActorId,
  timestamp: IsoTimestamp,
): DemoEventInsertDraft {
  return prepareDemoEventInsert(sourceCaseId, "clone", actorId, timestamp);
}

export function prepareReopenDemoEvent(
  caseId: CaseId,
  actorId: ActorId,
  timestamp: IsoTimestamp,
): DemoEventInsertDraft {
  return prepareDemoEventInsert(caseId, "reopen", actorId, timestamp);
}

export function mapDemoEventRowToApi(row: DemoEventRow, actorLabel?: string): DemoEvent {
  return {
    id: row.id,
    case_id: row.case_id,
    event_type: row.event_type,
    actor_id: row.actor_id,
    actor_label: actorLabel,
    created_at: row.timestamp,
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
