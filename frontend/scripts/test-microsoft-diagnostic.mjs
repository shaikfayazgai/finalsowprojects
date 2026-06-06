// Live test of GET /api/v1/auth/oauth/microsoft/diagnostic
// Simulates a real user calling authApi.getMicrosoftOAuthDiagnostic()
import "dotenv/config";

const baseUrl =
  process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL;

if (!baseUrl) {
  console.error("Missing NEXT_PUBLIC_GLIMMORA_API_URL / GLIMMORA_API_URL");
  process.exit(1);
}

const url = `${baseUrl}/api/v1/auth/oauth/microsoft/diagnostic`;
console.log(`GET ${url}\n`);

const start = Date.now();
const res = await fetch(url, {
  method: "GET",
  headers: { "Content-Type": "application/json" },
});
const ms = Date.now() - start;

console.log(`HTTP ${res.status} ${res.statusText}  (${ms} ms)`);
const data = await res.json();
console.log("\nResponse body:");
console.log(JSON.stringify(data, null, 2));

if (res.status !== 200) {
  console.error("\nFAIL — expected 200");
  process.exit(1);
}

const required = [
  "microsoft_oauth_configured",
  "redirect_uri_register_this_exactly_in_azure",
  "microsoft_tenant_id",
];
const missing = required.filter((k) => !(k in data));
if (missing.length) {
  console.error(`\nFAIL — missing fields: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("\nPASS — 200 OK with expected fields.");
console.log(
  `\n→ Register THIS exact URI in Azure App Registration:\n  ${data.redirect_uri_register_this_exactly_in_azure}`,
);
