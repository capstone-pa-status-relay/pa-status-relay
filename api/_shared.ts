import { randomUUID } from "node:crypto";

import type { ApiHandlerResponse } from "../src/backend/apiHandlers.ts";
import type {
  GetAuditQuery,
  GetCasesQuery,
  CaseId,
} from "../src/backend/apiTypes.ts";
import type { BackendRequestContext } from "../src/backend/apiRepository.ts";
import {
  BackendRepositoryNotImplementedError,
  createSupabaseBackendRepository,
} from "../src/backend/supabaseRepository.ts";
import type { AuditCsvExport } from "../src/backend/auditCsv.ts";

export type VercelRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
};

export type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  send(body: string): void;
  setHeader(name: string, value: string): void;
  end(): void;
};

export async function withApiErrorBoundary(
  response: VercelResponse,
  action: () => Promise<void>,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (error instanceof BackendRepositoryNotImplementedError) {
      response.status(501).json({
        error: "backend_repository_not_configured",
        message: "The API route is mounted, but the Supabase repository is not implemented yet.",
      });
      return;
    }

    console.error(error);
    response.status(500).json({
      error: "internal_server_error",
      message: "Unexpected server error.",
    });
  }
}

export function createBackendContext(request: VercelRequest): BackendRequestContext {
  const actorId = readHeaderFallback(request.query.actor_id, "auth_user_id");

  return {
    repository: createSupabaseBackendRepository(),
    actor: {
      actor_id: actorId,
      actor_label: "Demo Coordinator",
    },
    now: () => new Date().toISOString(),
    generateCaseId: () => randomUUID(),
    generateDemoEventId: () => randomUUID(),
  };
}

export function requireMethod(
  request: VercelRequest,
  response: VercelResponse,
  allowed: string | readonly string[],
): boolean {
  const allowedMethods = Array.isArray(allowed) ? allowed : [allowed];
  if (request.method && allowedMethods.includes(request.method)) {
    return true;
  }

  response.setHeader("Allow", allowedMethods.join(", "));
  response.status(405).json({
    error: "method_not_allowed",
    message: `Use ${allowedMethods.join(" or ")} for this endpoint.`,
  });
  return false;
}

export function getCaseId(request: VercelRequest): CaseId {
  return readQueryString(request.query.id);
}

export function parseBody<TBody>(request: VercelRequest): TBody {
  if (typeof request.body === "string") {
    return JSON.parse(request.body) as TBody;
  }

  return (request.body ?? {}) as TBody;
}

export function parseCasesQuery(request: VercelRequest): GetCasesQuery {
  return {
    status: readOptionalQueryString(request.query.status) as GetCasesQuery["status"],
    sort: readOptionalQueryString(request.query.sort) as GetCasesQuery["sort"],
    order: readOptionalQueryString(request.query.order) as GetCasesQuery["order"],
  };
}

export function parseAuditQuery(request: VercelRequest): GetAuditQuery {
  return {
    actor_id: readOptionalQueryString(request.query.actor_id),
    action_type: readOptionalQueryString(request.query.action_type) as GetAuditQuery["action_type"],
    date_from: readOptionalQueryString(request.query.date_from),
    date_to: readOptionalQueryString(request.query.date_to),
  };
}

export function sendJson<TBody>(
  response: VercelResponse,
  handlerResponse: ApiHandlerResponse<TBody>,
): void {
  response.status(handlerResponse.status).json(handlerResponse.body);
}

export function sendCsv(response: VercelResponse, handlerResponse: ApiHandlerResponse<AuditCsvExport>): void {
  if (handlerResponse.status !== 200) {
    sendJson(response, handlerResponse);
    return;
  }

  response.setHeader("Content-Type", handlerResponse.body.contentType);
  response.setHeader("Content-Disposition", `attachment; filename="${handlerResponse.body.filename}"`);
  response.status(200).send(handlerResponse.body.body);
}

function readQueryString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function readOptionalQueryString(value: string | string[] | undefined): string | undefined {
  const text = readQueryString(value);
  return text.length > 0 ? text : undefined;
}

function readHeaderFallback(value: string | string[] | undefined, fallback: string): string {
  return readOptionalQueryString(value) ?? fallback;
}
