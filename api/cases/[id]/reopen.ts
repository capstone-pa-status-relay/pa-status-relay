import { handleReopenCase } from "../../../src/backend/apiHandlers.ts";
import {
  createBackendContext,
  getCaseId,
  requireMethod,
  sendJson,
  type VercelRequest,
  type VercelResponse,
  withApiErrorBoundary,
} from "../../_shared.ts";

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  await withApiErrorBoundary(response, async () => {
    if (!requireMethod(request, response, "POST")) {
      return;
    }

    sendJson(response, await handleReopenCase(createBackendContext(request), getCaseId(request)));
  });
}
