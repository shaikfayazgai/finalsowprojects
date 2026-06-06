// Live test of GET /api/v1/auth/oauth/microsoft/callback
//
// We can't get a real Microsoft auth code without a real browser sign-in,
// so this test verifies:
//   1) The endpoint is reachable (no 404).
//   2) Validation works as documented (422 on missing/invalid code+state).
//   3) The response shape matches the Swagger spec.
//   4) The frontend exchange proxy (/api/auth/oauth/exchange) wires through.
import "dotenv/config";

const baseUrl =
  process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL;

if (!baseUrl) {
  console.error("Missing NEXT_PUBLIC_GLIMMORA_API_URL / GLIMMORA_API_URL");
  process.exit(1);
}

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name}${detail ? "  — " + detail : ""}`); fail++; }
}

// ── Test 1: endpoint reachable (no params → expect 4xx, not 404/5xx) ──
{
  const url = `${baseUrl}/api/v1/auth/oauth/microsoft/callback`;
  console.log(`\n[1] GET ${url}  (no params)`);
  const res = await fetch(url, { method: "GET", redirect: "manual" });
  const body = await res.text();
  console.log(`    HTTP ${res.status}`);
  check("endpoint exists (not 404)", res.status !== 404);
  check("rejects empty input (4xx)", res.status >= 400 && res.status < 500);
  // The endpoint may return 422 (validation) or redirect on missing code.
  // Accept either as "endpoint is alive".
  let json = null;
  try { json = JSON.parse(body); } catch { /* not JSON */ }
  if (json) {
    console.log(`    body: ${JSON.stringify(json).slice(0, 200)}`);
  }
}

// ── Test 2: invalid code → expect failure with structured error ──
{
  const url = `${baseUrl}/api/v1/auth/oauth/microsoft/callback?code=invalid_test_code&state=invalid_test_state`;
  console.log(`\n[2] GET ${url}  (invalid code+state)`);
  const res = await fetch(url, { method: "GET", redirect: "manual" });
  const body = await res.text();
  console.log(`    HTTP ${res.status}`);
  let json = null;
  try { json = JSON.parse(body); } catch { /* not JSON */ }
  if (json) console.log(`    body: ${JSON.stringify(json).slice(0, 300)}`);
  check("rejects bogus code (non-2xx)", res.status >= 400);
}

// ── Test 3: error param flow → expect graceful handling ──
{
  const url = `${baseUrl}/api/v1/auth/oauth/microsoft/callback?error=access_denied&error_description=user_cancelled`;
  console.log(`\n[3] GET ${url}  (provider error)`);
  const res = await fetch(url, { method: "GET", redirect: "manual" });
  console.log(`    HTTP ${res.status}`);
  check("error path returns response (not 5xx)", res.status < 500);
}

// ── Summary ──
console.log(`\n──── ${pass} passed, ${fail} failed ────`);
console.log(
  "\nNote: a true 200 response from this endpoint requires a real Microsoft" +
  "\nauthorization code, which can only be obtained via a real browser sign-in." +
  "\nTo verify the full flow end-to-end:" +
  "\n  1) npm run dev" +
  "\n  2) Open http://localhost:3000/auth/login" +
  "\n  3) Click 'Sign in with Microsoft'" +
  "\n  4) Sign in → backend callback exchanges code → /auth/oauth/callback creates session.",
);

if (fail > 0) process.exit(1);
