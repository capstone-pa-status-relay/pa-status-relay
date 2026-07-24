import assert from "node:assert/strict";
import test from "node:test";

import casesHandler from "../api/cases/index.ts";
import auditExportHandler from "../api/cases/[id]/audit/export.ts";
import auditHandler from "../api/cases/[id]/audit/index.ts";
import cloneHandler from "../api/cases/[id]/clone.ts";
import consentHandler from "../api/cases/[id]/consent.ts";
import caseHandler from "../api/cases/[id]/index.ts";
import reopenHandler from "../api/cases/[id]/reopen.ts";
import resetHandler from "../api/cases/[id]/reset.ts";
import transitionHandler from "../api/cases/[id]/transition.ts";
import type { VercelResponse } from "../api/_shared.ts";

test("mounted case routes return a configured 501 until Supabase repository is implemented", async () => {
  const response = new MockResponse();

  await casesHandler({ method: "GET", query: {} }, response);

  assert.equal(response.statusCode, 501);
  assert.deepEqual(response.jsonBody, {
    error: "backend_repository_not_configured",
    message: "The API route is mounted, but the Supabase repository is not implemented yet.",
  });
});

test("mounted transition route imports handler glue and returns the repository 501", async () => {
  const response = new MockResponse();

  await transitionHandler(
    {
      method: "POST",
      query: { id: "case_001" },
      body: {
        to_status: "submitted",
        doc_link: "mock-doc",
        message_text: null,
        message_sent: false,
        message_custom: false,
      },
    },
    response,
  );

  assert.equal(response.statusCode, 501);
});

test("all mounted case subroutes import handler glue", async () => {
  const mountedRoutes = [
    { handler: caseHandler, method: "GET" },
    { handler: consentHandler, method: "PATCH", body: { consent_flag: true } },
    { handler: auditHandler, method: "GET" },
    { handler: resetHandler, method: "POST", body: { confirm: true } },
    { handler: cloneHandler, method: "POST" },
    { handler: reopenHandler, method: "POST" },
  ] as const;

  for (const route of mountedRoutes) {
    const response = new MockResponse();
    await route.handler(
      {
        method: route.method,
        query: { id: "case_001" },
        body: route.body,
      },
      response,
    );

    assert.equal(response.statusCode, 501);
  }
});

test("mounted CSV route imports handler glue and sets method guard", async () => {
  const response = new MockResponse();

  await auditExportHandler({ method: "POST", query: { id: "case_001" } }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "GET");
});

class MockResponse implements VercelResponse {
  statusCode = 200;
  headers: Record<string, string> = {};
  jsonBody: unknown;
  sentBody = "";

  status(code: number): VercelResponse {
    this.statusCode = code;
    return this;
  }

  json(body: unknown): void {
    this.jsonBody = body;
  }

  send(body: string): void {
    this.sentBody = body;
  }

  setHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  end(): void {
    return;
  }
}
