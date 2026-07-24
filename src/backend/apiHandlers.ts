import { type ApiErrorResponse } from "./apiErrors.ts";
import type {
  CaseId,
  CreateCaseRequest,
  CreateCaseResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesResponse,
  TransitionCaseRequest,
  TransitionCaseResponse,
  UpdateCaseConsentRequest,
  UpdateCaseConsentResponse,
} from "./apiTypes.ts";
import type { BackendRequestContext } from "./apiRepository.ts";
import {
  getCase,
  listCases,
  mapCaseRowToSummary,
  prepareCreateCase,
  type CreateCaseInput,
} from "./caseService.ts";
import {
  prepareConsentUpdate,
  type ConsentUpdateInput,
} from "./consentService.ts";
import { prepareTransition } from "./transitionService.ts";

export type ApiSuccessResponse<TBody> = {
  status: 200 | 201;
  body: TBody;
};

export type ApiHandlerResponse<TBody> = ApiSuccessResponse<TBody> | ApiErrorResponse;

export async function handleListCases(
  context: BackendRequestContext,
  query: GetCasesQuery = {},
): Promise<ApiHandlerResponse<GetCasesResponse>> {
  const rows = await context.repository.listCaseRows();

  return {
    status: 200,
    body: listCases(rows, query),
  };
}

export async function handleGetCase(
  context: BackendRequestContext,
  caseId: CaseId,
): Promise<ApiHandlerResponse<GetCaseResponse>> {
  const result = getCase(await context.repository.getCaseRowById(caseId));

  if (!result.ok) {
    return result.error;
  }

  return {
    status: 200,
    body: result.response,
  };
}

export async function handleCreateCase(
  context: BackendRequestContext,
  request: CreateCaseInput,
): Promise<ApiHandlerResponse<CreateCaseResponse>> {
  const caseId = context.generateCaseId();
  const result = prepareCreateCase(request, context.actor.actor_id, context.now(), caseId);

  if (!result.ok) {
    return result.error;
  }

  await context.repository.insertCase({
    id: caseId,
    ...result.create.insert,
  });

  return {
    status: 201,
    body: result.create.response,
  };
}

export async function handleUpdateCaseConsent(
  context: BackendRequestContext,
  caseId: CaseId,
  request: ConsentUpdateInput,
): Promise<ApiHandlerResponse<UpdateCaseConsentResponse>> {
  const caseResult = getCase(await context.repository.getCaseRowById(caseId));

  if (!caseResult.ok) {
    return caseResult.error;
  }

  const result = prepareConsentUpdate(caseResult.response.case, request, context.now());

  if (!result.ok) {
    return result.error;
  }

  await context.repository.updateCaseConsent(result.consent_update.case_update);

  return {
    status: 200,
    body: result.consent_update.response,
  };
}

export async function handleTransitionCase(
  context: BackendRequestContext,
  caseId: CaseId,
  request: TransitionCaseRequest,
): Promise<ApiHandlerResponse<TransitionCaseResponse>> {
  const caseResult = getCase(await context.repository.getCaseRowById(caseId));

  if (!caseResult.ok) {
    return caseResult.error;
  }

  const result = prepareTransition(
    caseResult.response.case,
    request,
    context.actor,
    context.now(),
  );

  if (!result.ok) {
    return result.error;
  }

  const persisted = await context.repository.applyTransition(
    result.transition.case_update,
    result.transition.audit_insert,
  );

  return {
    status: 200,
    body: {
      case: {
        ...result.transition.response.case,
        status: mapCaseRowToSummary(persisted.case_row).status,
      },
      audit_entry: persisted.audit_entry,
    },
  };
}

export type {
  CreateCaseRequest,
  UpdateCaseConsentRequest,
};
