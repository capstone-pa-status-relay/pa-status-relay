import { AUDIT_CSV_COLUMNS, type AuditEntry, type CaseId, type IsoTimestamp } from "./apiTypes.ts";

export type AuditCsvExport = {
  filename: string;
  contentType: "text/csv";
  body: string;
};

export function buildAuditCsvExport(
  caseId: CaseId,
  auditEntries: readonly AuditEntry[],
  exportedAt: IsoTimestamp,
): AuditCsvExport {
  return {
    filename: buildAuditCsvFilename(caseId, exportedAt),
    contentType: "text/csv",
    body: buildAuditCsv(auditEntries),
  };
}

export function buildAuditCsv(auditEntries: readonly AuditEntry[]): string {
  const header = AUDIT_CSV_COLUMNS.join(",");
  const rows = auditEntries.map((entry) =>
    AUDIT_CSV_COLUMNS.map((column) => formatCsvValue(entry[column])).join(","),
  );

  return [header, ...rows].join("\n");
}

export function buildAuditCsvFilename(caseId: CaseId, exportedAt: IsoTimestamp): string {
  const datePart = exportedAt.slice(0, 10);
  return `audit_${caseId}_${datePart}.csv`;
}

function formatCsvValue(value: string | boolean | null): string {
  if (value === null) {
    return "";
  }

  const text = String(value);
  if (!/[",\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}
