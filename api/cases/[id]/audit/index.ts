import { handleGetAudit } from "../../../../src/backend/apiHandlers.ts";
import {
  createBackendContext,
  getCaseId,
  parseAuditQuery,
  requireMethod,
  sendJson,
  type VercelRequest,
  type VercelResponse,
  withApiErrorBoundary,
} from "../../../_shared.ts";

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  await withApiErrorBoundary(response, async () => {
    if (!requireMethod(request, response, "GET")) {
      return;
    }

    sendJson(response, await handleGetAudit(createBackendContext(request), getCaseId(request), parseAuditQuery(request)));
  });
}
