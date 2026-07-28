import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import casesHandler from "../api/cases/index.ts";
import auditExportHandler from "../api/cases/[id]/audit/export/index.ts";
import auditHandler from "../api/cases/[id]/audit/index.ts";
import cloneHandler from "../api/cases/[id]/clone/index.ts";
import consentHandler from "../api/cases/[id]/consent/index.ts";
import caseHandler from "../api/cases/[id]/index.ts";
import reopenHandler from "../api/cases/[id]/reopen/index.ts";
import resetHandler from "../api/cases/[id]/reset/index.ts";
import transitionHandler from "../api/cases/[id]/transition/index.ts";
import type { VercelResponse } from "../api/_shared.ts";

const ORIGINAL_SUPABASE_URL = process.env.SUPABASE_URL;
const ORIGINAL_SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

beforeEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

afterEach(() => {
  restoreEnv("SUPABASE_URL", ORIGINAL_SUPABASE_URL);
  restoreEnv("SUPABASE_SERVICE_ROLE_KEY", ORIGINAL_SUPABASE_SERVICE_ROLE_KEY);
});

test("mounted case routes return repository-not-configured when Supabase env vars are missing", async () => {
  const response = new MockResponse();

  await casesHandler({ method: "GET", query: {} }, response);

  assert.equal(response.statusCode, 501);
  assert.deepEqual(response.jsonBody, {
    error: "backend_repository_not_configured",
    message: "The API route is mounted, but the Supabase repository is not implemented yet.",
  });
});

test("mounted transition route imports handler glue and reports missing Supabase config", async () => {
  const response = new MockResponse();

  await transitionHandler(
    {
      method: "POST",
      query: { id: "00000000-0000-0000-0000-000000000001" },
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

test("all mounted case subroutes import handler glue and report missing Supabase config", async () => {
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
        query: { id: "00000000-0000-0000-0000-000000000001" },
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

test("moved write-only case subroutes are registered and reject read-only GET checks", async () => {
  const mountedWriteRoutes = [
    { handler: transitionHandler, allow: "POST" },
    { handler: consentHandler, allow: "PATCH" },
    { handler: resetHandler, allow: "POST" },
    { handler: cloneHandler, allow: "POST" },
    { handler: reopenHandler, allow: "POST" },
  ] as const;

  for (const route of mountedWriteRoutes) {
    const response = new MockResponse();

    await route.handler({ method: "GET", query: { id: "case_001" } }, response);

    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.Allow, route.allow);
  }
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

function restoreEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY", value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
