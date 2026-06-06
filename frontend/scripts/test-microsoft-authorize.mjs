// Live test of GET /api/v1/auth/oauth/microsoft/authorize
// Verifies the backend issues a proper 302 redirect to Microsoft login.
import "dotenv/config";

const baseUrl =
  process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL;

if (!baseUrl) {
  console.error("Missing NEXT_PUBLIC_GLIMMORA_API_URL / GLIMMORA_API_URL");
  process.exit(1);
}

const url = `${baseUrl}/api/v1/auth/oauth/microsoft/authorize`;
console.log(`GET ${url}\n`);

const start = Date.now();
const res = await fetch(url, { method: "GET", redirect: "manual" });
const ms = Date.now() - start;

console.log(`HTTP ${res.status} ${res.statusText}  (${ms} ms)`);
const location = res.headers.get("location");
console.log(`Location: ${location}\n`);

if (res.status !== 302) {
  console.error(`FAIL — expected 302, got ${res.status}`);
  process.exit(1);
}
if (!location || !location.startsWith("https://login.microsoftonline.com/")) {
  console.error("FAIL — Location header is not a Microsoft login URL");
  process.exit(1);
}

const u = new URL(location);
const checks = {
  client_id: u.searchParams.get("client_id"),
  redirect_uri: u.searchParams.get("redirect_uri"),
  response_type: u.searchParams.get("response_type"),
  scope: u.searchParams.get("scope"),
  code_challenge_method: u.searchParams.get("code_challenge_method"),
  state_present: !!u.searchParams.get("state"),
};
console.log("Microsoft authorize URL params:");
console.log(JSON.stringify(checks, null, 2));

const required = ["client_id", "redirect_uri", "response_type", "scope"];
const missing = required.filter((k) => !checks[k]);
if (missing.length || !checks.state_present) {
  console.error(`\nFAIL — missing OAuth params: ${[...missing, !checks.state_present && "state"].filter(Boolean).join(", ")}`);
  process.exit(1);
}

console.log("\nPASS — 302 redirect to Microsoft login with valid OAuth params.");
