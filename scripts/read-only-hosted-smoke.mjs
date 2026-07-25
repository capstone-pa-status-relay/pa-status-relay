const DEFAULT_BASE_URL = "https://pa-status-relay.vercel.app";

const baseUrl = normalizeBaseUrl(process.argv[2] ?? process.env.PA_STATUS_RELAY_URL ?? DEFAULT_BASE_URL);

const checks = [];

await checkJson("GET /api/cases", `${baseUrl}/api/cases`, 200, (body) => {
  if (!Array.isArray(body.cases)) {
    throw new Error("Expected response body to include a cases array.");
  }
});

const casesResponse = await fetchJson(`${baseUrl}/api/cases`);
const caseId = casesResponse.body.cases?.[0]?.id;

if (!caseId) {
  checks.push({
    name: "Seed case lookup",
    ok: false,
    detail: "No case id found in /api/cases response.",
  });
} else {
  await checkJson("GET /api/cases/:id/audit", `${baseUrl}/api/cases/${caseId}/audit`, 200, (body) => {
    if (!Array.isArray(body.audit)) {
      throw new Error("Expected response body to include an audit array.");
    }
  });

  await checkCsv("GET /api/cases/:id/audit/export", `${baseUrl}/api/cases/${caseId}/audit/export`, 200);

  await checkStatus("GET /api/cases/:id/transition returns 405", `${baseUrl}/api/cases/${caseId}/transition`, 405);
  await checkStatus("GET /api/cases/:id/consent returns 405", `${baseUrl}/api/cases/${caseId}/consent`, 405);
  await checkStatus("GET /api/cases/:id/reset returns 405", `${baseUrl}/api/cases/${caseId}/reset`, 405);
  await checkStatus("GET /api/cases/:id/clone returns 405", `${baseUrl}/api/cases/${caseId}/clone`, 405);
  await checkStatus("GET /api/cases/:id/reopen returns 405", `${baseUrl}/api/cases/${caseId}/reopen`, 405);
}

for (const check of checks) {
  const marker = check.ok ? "PASS" : "FAIL";
  console.log(`${marker} ${check.name} - ${check.detail}`);
}

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  process.exitCode = 1;
}

async function checkJson(name, url, expectedStatus, validate) {
  const result = await fetchJson(url);
  if (result.response.status !== expectedStatus) {
    checks.push({
      name,
      ok: false,
      detail: `expected ${expectedStatus}, got ${result.response.status}`,
    });
    return;
  }

  try {
    validate(result.body);
    checks.push({ name, ok: true, detail: `HTTP ${result.response.status}` });
  } catch (error) {
    checks.push({ name, ok: false, detail: error.message });
  }
}

async function checkCsv(name, url, expectedStatus) {
  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type") ?? "";
    const contentDisposition = response.headers.get("content-disposition") ?? "";

    if (response.status !== expectedStatus) {
      checks.push({ name, ok: false, detail: `expected ${expectedStatus}, got ${response.status}` });
      return;
    }

    if (!contentType.includes("text/csv")) {
      checks.push({ name, ok: false, detail: `expected text/csv, got ${contentType || "missing content-type"}` });
      return;
    }

    if (!contentDisposition.includes("attachment")) {
      checks.push({ name, ok: false, detail: "expected attachment content-disposition" });
      return;
    }

    checks.push({ name, ok: true, detail: `HTTP ${response.status}, CSV attachment` });
  } catch (error) {
    checks.push({ name, ok: false, detail: error.message });
  }
}

async function checkStatus(name, url, expectedStatus) {
  try {
    const response = await fetch(url, { method: "GET" });
    checks.push({
      name,
      ok: response.status === expectedStatus,
      detail: `expected ${expectedStatus}, got ${response.status}`,
    });
  } catch (error) {
    checks.push({ name, ok: false, detail: error.message });
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  let body = {};

  try {
    body = await response.json();
  } catch {
    body = {};
  }

  return { response, body };
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}
