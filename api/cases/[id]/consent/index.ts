import {
  handleUpdateCaseConsent,
  type UpdateCaseConsentRequest,
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
    if (!requireMethod(request, response, "PATCH")) {
      return;
    }

    sendJson(
      response,
      await handleUpdateCaseConsent(
        createBackendContext(request),
        getCaseId(request),
        parseBody<UpdateCaseConsentRequest>(request),
      ),
    );
  });
}
