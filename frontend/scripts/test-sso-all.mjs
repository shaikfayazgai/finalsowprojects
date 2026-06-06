// Live test of all 6 SSO endpoints used by the contributor + enterprise SSO flow.
// Confirms each endpoint returns its expected status code:
//   * /diagnostic  → 200 with JSON
//   * /authorize   → 302 redirect to provider login URL
//   * /callback    → 400 with structured error (true 200 needs a real auth code)
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

async function testDiagnostic(provider) {
  const url = `${baseUrl}/api/v1/auth/oauth/${provider}/diagnostic`;
  console.log(`\n[${provider} diagnostic]`);
  const res = await fetch(url, { method: "GET" });
  const body = await res.json().catch(() => ({}));
  check(`HTTP 200`, res.status === 200, `got ${res.status}`);
  check(`returns JSON object`, typeof body === "object" && body !== null);
  if (provider === "microsoft") {
    check(
      `redirect_uri_register_this_exactly_in_azure present`,
      typeof body.redirect_uri_register_this_exactly_in_azure === "string",
    );
  }
}

async function testAuthorize(provider) {
  const url = `${baseUrl}/api/v1/auth/oauth/${provider}/authorize`;
  console.log(`\n[${provider} authorize]`);
  const res = await fetch(url, { method: "GET", redirect: "manual" });
  const location = res.headers.get("location") ?? "";
  check(`HTTP 302`, res.status === 302, `got ${res.status}`);
  const expectedHost = provider === "google"
    ? "accounts.google.com"
    : "login.microsoftonline.com";
  check(`redirects to ${expectedHost}`, location.includes(expectedHost), `Location=${location.slice(0, 80)}…`);
  if (location) {
    const u = new URL(location);
    check(`has client_id`, !!u.searchParams.get("client_id"));
    check(`has redirect_uri`, !!u.searchParams.get("redirect_uri"));
    check(`has state`, !!u.searchParams.get("state"));
    check(`has code_challenge_method=S256`, u.searchParams.get("code_challenge_method") === "S256");
  }
}

async function testCallback(provider) {
  const url = `${baseUrl}/api/v1/auth/oauth/${provider}/callback`;
  console.log(`\n[${provider} callback]`);
  // Without real code+state, expect a 4xx — never 404 or 5xx
  const res = await fetch(url, { method: "GET", redirect: "manual" });
  check(`endpoint exists (not 404)`, res.status !== 404);
  check(`validates input (4xx)`, res.status >= 400 && res.status < 500, `got ${res.status}`);
  const body = await res.json().catch(() => null);
  check(`returns structured error`, body !== null && typeof body === "object");
}

console.log(`Base URL: ${baseUrl}\n`);
console.log("═══════════════════════════════════════════════════════════");
console.log("  Live test of all 6 SSO endpoints");
console.log("═══════════════════════════════════════════════════════════");

await testDiagnostic("google");
await testDiagnostic("microsoft");
await testAuthorize("google");
await testAuthorize("microsoft");
await testCallback("google");
await testCallback("microsoft");

console.log(`\n═══════════════════════════════════════════════════════════`);
console.log(`  ${pass} passed, ${fail} failed`);
console.log(`═══════════════════════════════════════════════════════════\n`);

if (fail > 0) process.exit(1);
console.log(
  "All SSO endpoints reachable and behaving correctly.\n" +
  "Status codes:\n" +
  "  /diagnostic → 200 (JSON)\n" +
  "  /authorize  → 302 (redirect to IdP)\n" +
  "  /callback   → 400 without real code (200 only after real browser sign-in)\n",
);
