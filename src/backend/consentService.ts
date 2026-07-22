import { apiError, type ApiErrorResponse } from "./apiErrors.ts";
import type {
  CaseDetail,
  CaseId,
  CaseSummary,
  IsoTimestamp,
  UpdateCaseConsentRequest,
  UpdateCaseConsentResponse,
} from "./apiTypes.ts";

export type ConsentCaseUpdateDraft = {
  id: CaseId;
  consent_flag: boolean;
  updated_at: IsoTimestamp;
};

export type PreparedConsentUpdate = {
  case_update: ConsentCaseUpdateDraft;
  response: UpdateCaseConsentResponse;
};

export type PrepareConsentUpdateResult =
  | { ok: true; consent_update: PreparedConsentUpdate }
  | { ok: false; error: ApiErrorResponse };

export type ConsentUpdateInput = Partial<UpdateCaseConsentRequest>;

export function prepareConsentUpdate(
  currentCase: Pick<CaseDetail, "id" | "status" | "consent_flag">,
  request: ConsentUpdateInput,
  timestamp: IsoTimestamp,
): PrepareConsentUpdateResult {
  if (typeof request.consent_flag !== "boolean") {
    return {
      ok: false,
      error: apiError("missing_consent_flag"),
    };
  }

  const caseUpdate: ConsentCaseUpdateDraft = {
    id: currentCase.id,
    consent_flag: request.consent_flag,
    updated_at: timestamp,
  };

  return {
    ok: true,
    consent_update: {
      case_update: caseUpdate,
      response: {
        case: buildConsentCaseResponse(currentCase, caseUpdate),
      },
    },
  };
}

function buildConsentCaseResponse(
  currentCase: Pick<CaseDetail, "id" | "status">,
  caseUpdate: ConsentCaseUpdateDraft,
): Pick<CaseSummary, "id" | "status" | "consent_flag" | "updated_at"> {
  return {
    id: currentCase.id,
    status: currentCase.status,
    consent_flag: caseUpdate.consent_flag,
    updated_at: caseUpdate.updated_at,
  };
}
