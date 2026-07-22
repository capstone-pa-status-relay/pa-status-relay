import type {
  AuditEntry,
  CaseId,
  GetAuditQuery,
  GetAuditResponse,
} from "./apiTypes.ts";

export function listAuditEntriesForCase(
  auditEntries: readonly AuditEntry[],
  caseId: CaseId,
  query: GetAuditQuery = {},
): GetAuditResponse {
  return {
    audit: auditEntries
      .filter((entry) => entry.case_id === caseId)
      .filter((entry) => matchesActor(entry, query))
      .filter((entry) => matchesAction(entry, query))
      .filter((entry) => matchesDateRange(entry, query))
      .sort(reverseChronological),
  };
}

function matchesActor(entry: AuditEntry, query: GetAuditQuery): boolean {
  return query.actor_id ? entry.actor_id === query.actor_id : true;
}

function matchesAction(entry: AuditEntry, query: GetAuditQuery): boolean {
  return query.action_type ? entry.action === query.action_type : true;
}

function matchesDateRange(entry: AuditEntry, query: GetAuditQuery): boolean {
  if (query.date_from && entry.timestamp < query.date_from) {
    return false;
  }

  if (query.date_to && entry.timestamp > query.date_to) {
    return false;
  }

  return true;
}

function reverseChronological(left: AuditEntry, right: AuditEntry): number {
  return right.timestamp.localeCompare(left.timestamp);
}
