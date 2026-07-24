import { apiError, type ApiErrorResponse } from "./apiErrors.ts";
import { buildAuditCsvExport, type AuditCsvExport } from "./auditCsv.ts";
import { listAuditEntriesForCase } from "./auditService.ts";
import type {
  CaseId,
  CloneCaseResponse,
  CreateCaseRequest,
  CreateCaseResponse,
  GetAuditQuery,
  GetAuditResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesResponse,
  ReopenCaseResponse,
  ResetCaseRequest,
  ResetCaseResponse,
  TransitionCaseRequest,
  TransitionCaseResponse,
  UpdateCaseConsentRequest,
  UpdateCaseConsentResponse,
} from "./apiTypes.ts";
import type { BackendRequestContext, CaseInsertWithId } from "./apiRepository.ts";
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
import {
  prepareCloneCase,
  prepareReopenCase,
  prepareResetCaseFromSnapshot,
} from "./demoControlService.ts";
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

export async function handleGetAudit(
  context: BackendRequestContext,
  caseId: CaseId,
  query: GetAuditQuery = {},
): Promise<ApiHandlerResponse<GetAuditResponse>> {
  const caseResult = getCase(await context.repository.getCaseRowById(caseId));

  if (!caseResult.ok) {
    return caseResult.error;
  }

  const auditEntries = await context.repository.listAuditEntriesForCase(caseId);

  return {
    status: 200,
    body: listAuditEntriesForCase(auditEntries, caseId, query),
  };
}

export async function handleExportAudit(
  context: BackendRequestContext,
  caseId: CaseId,
  query: GetAuditQuery = {},
): Promise<ApiHandlerResponse<AuditCsvExport>> {
  const auditResult = await handleGetAudit(context, caseId, query);

  if (auditResult.status !== 200) {
    return auditResult as ApiErrorResponse;
  }

  return {
    status: 200,
    body: buildAuditCsvExport(caseId, auditResult.body.audit, context.now()),
  };
}

export async function handleResetCase(
  context: BackendRequestContext,
  caseId: CaseId,
  request: Partial<ResetCaseRequest>,
): Promise<ApiHandlerResponse<ResetCaseResponse>> {
  const caseResult = getCase(await context.repository.getCaseRowById(caseId));

  if (!caseResult.ok) {
    return caseResult.error;
  }

  if (request.confirm !== true) {
    return apiError("missing_reset_confirmation");
  }

  const baseline = await context.repository.getBaselineSnapshot(caseId);

  if (!baseline) {
    return apiError("case_not_found");
  }

  const demoEventId = context.generateDemoEventId();
  const result = prepareResetCaseFromSnapshot(
    caseId,
    baseline,
    context.actor.actor_id,
    context.now(),
    demoEventId,
  );

  await context.repository.resetCase(result.case_update, {
    id: demoEventId,
    ...result.demo_event_insert,
  });

  return {
    status: 200,
    body: result.response,
  };
}

export async function handleCloneCase(
  context: BackendRequestContext,
  caseId: CaseId,
): Promise<ApiHandlerResponse<CloneCaseResponse>> {
  const caseResult = getCase(await context.repository.getCaseRowById(caseId));

  if (!caseResult.ok) {
    return caseResult.error;
  }

  const caseIdForClone = context.generateCaseId();
  const demoEventId = context.generateDemoEventId();
  const result = prepareCloneCase(
    caseResult.response.case,
    context.actor.actor_id,
    context.now(),
    caseIdForClone,
    demoEventId,
  );

  await context.repository.cloneCase(
    {
      id: caseIdForClone,
      ...result.case_insert,
    } satisfies CaseInsertWithId,
    {
      id: demoEventId,
      ...result.source_demo_event_insert,
    },
  );

  return {
    status: 201,
    body: result.response,
  };
}

export async function handleReopenCase(
  context: BackendRequestContext,
  caseId: CaseId,
): Promise<ApiHandlerResponse<ReopenCaseResponse>> {
  const caseResult = getCase(await context.repository.getCaseRowById(caseId));

  if (!caseResult.ok) {
    return caseResult.error;
  }

  const demoEventId = context.generateDemoEventId();
  const result = prepareReopenCase(
    caseResult.response.case,
    context.actor.actor_id,
    context.now(),
    demoEventId,
  );

  await context.repository.insertDemoEvent({
    id: demoEventId,
    ...result.demo_event_insert,
  });

  return {
    status: 200,
    body: result.response,
  };
}

export type {
  CreateCaseRequest,
  ResetCaseRequest,
  UpdateCaseConsentRequest,
};
