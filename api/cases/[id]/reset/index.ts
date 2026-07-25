import {
  handleResetCase,
  type ResetCaseRequest,
} from "../../../../src/backend/apiHandlers.ts";
import {
  createBackendContext,
  getCaseId,
  parseBody,
  requireMethod,
  sendJson,
  type VercelRequest,
  type VercelResponse,
  withApiErrorBoundary,
} from "../../../_shared.ts";

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  await withApiErrorBoundary(response, async () => {
    if (!requireMethod(request, response, "POST")) {
      return;
    }

    sendJson(
      response,
      await handleResetCase(
        createBackendContext(request),
        getCaseId(request),
        parseBody<ResetCaseRequest>(request),
      ),
    );
  });
}
