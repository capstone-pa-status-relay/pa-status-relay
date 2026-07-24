import {
  handleCreateCase,
  handleListCases,
  type CreateCaseRequest,
} from "../../src/backend/apiHandlers.ts";
import {
  createBackendContext,
  parseBody,
  parseCasesQuery,
  requireMethod,
  sendJson,
  type VercelRequest,
  type VercelResponse,
  withApiErrorBoundary,
} from "../_shared.ts";

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  await withApiErrorBoundary(response, async () => {
    if (!requireMethod(request, response, ["GET", "POST"])) {
      return;
    }

    if (request.method === "GET") {
      sendJson(response, await handleListCases(createBackendContext(request), parseCasesQuery(request)));
      return;
    }

    if (request.method === "POST") {
      sendJson(response, await handleCreateCase(createBackendContext(request), parseBody<CreateCaseRequest>(request)));
      return;
    }
  });
}
