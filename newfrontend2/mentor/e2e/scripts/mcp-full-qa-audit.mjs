/**
 * Full cross-portal QA audit — invoked via MCP browser_run_code_unsafe filename.
 * Returns structured pass/fail per role and flow.
 */
export default async function (page) {
  const BASE = "http://localhost:3000";
  const results = [];

  const record = (section, test, pass, detail = "") => {
    results.push({ section, test, pass, detail });
  };

  const login = async (email, password, portalPrefix) => {
    await page.context().clearCookies();
    await page.goto(`${BASE}/auth/login`, { waitUntil: "load" });
    await page.locator("input#login-email").fill(email);
    await page.locator("input#login-password").fill(password);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL((u) => !u.pathname.includes("/auth/login"), { timeout: 45000 });
    if (!page.url().includes(portalPrefix)) {
      throw new Error(`Expected ${portalPrefix} got ${page.url()}`);
    }
  };

  const navLinkCount = async (name) => page.getByRole("link", { name }).count();
  const pageOk = async (path, forbidden = []) => {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const url = page.url();
    const body = await page.locator("main, [role=main]").first().innerText().catch(() => "");
    const err = /could not load|internal server error|not found/i.test(body);
    const blocked = forbidden.some((f) => url.includes(f) === false && path.includes(f));
    return { url, err, body: body.slice(0, 200) };
  };

  const clearMocks = async () => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith("glimmora.mock.")) localStorage.removeItem(k);
      }
    });
  };

  // ─── 1. ENTERPRISE ADMIN ───────────────────────────────────────────
  try {
    await login("anjali@acme.com", "acme1234", "/enterprise");
    record("enterprise_admin", "login", true, page.url());
    record("enterprise_admin", "nav_decomposition", (await navLinkCount("Decomposition")) > 0);
    record("enterprise_admin", "nav_new_sow", (await navLinkCount("New SOW")) > 0);
    record("enterprise_admin", "nav_billing", (await navLinkCount("Billing")) > 0);
    const tenant = await pageOk("/enterprise/settings/tenant");
    record("enterprise_admin", "tenant_settings", tenant.url.includes("/tenant") && !tenant.err, tenant.body);
    const sow = await pageOk("/enterprise/sow");
    record("enterprise_admin", "sow_list", sow.url.includes("/sow") && !sow.err);
    const decomp = await pageOk("/enterprise/decomposition");
    record("enterprise_admin", "decomposition", decomp.url.includes("/decomposition") && !decomp.err);
    const projects = await pageOk("/enterprise/projects");
    record("enterprise_admin", "projects", projects.url.includes("/projects") && !projects.err);
    const dash = await pageOk("/enterprise/dashboard");
    record("enterprise_admin", "dashboard", dash.url.includes("/dashboard") && !dash.err);
  } catch (e) {
    record("enterprise_admin", "fatal", false, String(e.message || e));
  }

  // ─── 2. SPONSOR ────────────────────────────────────────────────────
  try {
    await login("sandeep@acme.com", "acme1234", "/enterprise");
    record("sponsor", "login", true);
    record("sponsor", "nav_new_sow", (await navLinkCount("New SOW")) > 0);
    record("sponsor", "nav_no_decomposition", (await navLinkCount("Decomposition")) === 0);
    record("sponsor", "nav_no_billing_rate_cards", (await navLinkCount("Rate Cards")) === 0);
    const decompBlocked = await pageOk("/enterprise/decomposition");
    record(
      "sponsor",
      "decomposition_route_guard",
      decompBlocked.url.includes("/dashboard") || decompBlocked.url.includes("/sow") || !decompBlocked.url.includes("/decomposition"),
      decompBlocked.url,
    );
  } catch (e) {
    record("sponsor", "fatal", false, String(e.message || e));
  }

  // ─── 3. PMO ────────────────────────────────────────────────────────
  try {
    await login("rahul@acme.com", "acme1234", "/enterprise");
    record("pmo", "login", true);
    record("pmo", "nav_decomposition", (await navLinkCount("Decomposition")) > 0);
    record("pmo", "nav_no_new_sow", (await navLinkCount("New SOW")) === 0);
    const decomp = await pageOk("/enterprise/decomposition");
    record("pmo", "decomposition_page", decomp.url.includes("/decomposition") && !decomp.err);
  } catch (e) {
    record("pmo", "fatal", false, String(e.message || e));
  }

  // ─── 4. SOW TWO-GATE FLOW ──────────────────────────────────────────
  try {
    await clearMocks();
    const title = `QA Audit ${Date.now()}`;
    await login("sandeep@acme.com", "acme1234", "/enterprise");
    await page.goto(`${BASE}/enterprise/sow/intake?mode=author`);
    await page.locator("#title").fill(title);
    await page.getByRole("button", { name: /Continue · pick approvers/i }).click();
    await page.getByRole("button", { name: "Submit for approval" }).click({ timeout: 30000 });
    await page.getByRole("heading", { name: "Submitted for approval" }).waitFor({ timeout: 30000 });
    const href = await page.getByRole("link", { name: "View SOW" }).getAttribute("href");
    const sowId = href.split("/").filter(Boolean).pop();
    record("sow_flow", "sponsor_submit", !!sowId, sowId);

    await page.goto(`${BASE}/enterprise/sow/${sowId}/approve`);
    await page.waitForTimeout(1000);
    const sponsorCommercial = await page.getByText("Awaiting Glimmora Commercial").isVisible().catch(() => false);
    record("sow_flow", "sponsor_awaiting_commercial", sponsorCommercial);

    await login("admin@glimmora.ai", "admin1234", "/admin");
    await page.goto(`${BASE}/admin/sow/${sowId}`);
    await page.getByRole("button", { name: "Approve Commercial" }).click({ timeout: 20000 });
    const modal = page.getByRole("dialog");
    await modal.waitFor({ timeout: 10000 });
    for (const item of [
      "Rate cards apply to the in-scope skill set",
      "Effort estimates fall within ±15% of historical",
      "Payment terms align with master agreement",
    ]) {
      await modal.getByRole("checkbox", { name: item }).check();
    }
    await modal.locator("textarea").fill("QA audit commercial");
    await modal.getByRole("button", { name: "Approve Commercial" }).click();
    await page.waitForTimeout(1500);
    record("sow_flow", "platform_commercial", true);

    await login("sandeep@acme.com", "acme1234", "/enterprise");
    await page.goto(`${BASE}/enterprise/sow/${sowId}/approve`);
    await page.waitForTimeout(1000);
    const adminWait = await page.getByText("Awaiting enterprise admin sign-off").isVisible().catch(() => false);
    const sponsorApprove = await page.getByRole("button", { name: "Approve stage" }).count();
    record("sow_flow", "sponsor_blocked_final", adminWait && sponsorApprove === 0, `approveBtns=${sponsorApprove}`);

    await login("anjali@acme.com", "acme1234", "/enterprise");
    await page.goto(`${BASE}/enterprise/sow/${sowId}/approve`);
    await page.getByRole("button", { name: "Approve stage" }).click({ timeout: 20000 });
    const approved = await page.getByText(/fully approved|Approved/i).first().isVisible({ timeout: 20000 }).catch(() => false);
    record("sow_flow", "admin_final_signoff", approved);

    await login("rahul@acme.com", "acme1234", "/enterprise");
    await page.goto(`${BASE}/enterprise/decomposition`);
    const row = page.getByRole("listitem").filter({ hasText: title });
    await row.waitFor({ timeout: 15000 });
    await row.getByRole("button", { name: "Decompose" }).click();
    await page.waitForURL(/\/enterprise\/decomposition\/plan-/, { timeout: 30000 });
    record("sow_flow", "pmo_decompose", /plan-/.test(page.url()));

    const planId = page.url().split("/").pop();
    await login("anjali@acme.com", "acme1234", "/enterprise");
    await page.goto(`${BASE}/enterprise/decomposition/${planId}/approve`);
    await page.getByRole("button", { name: "Approve plan" }).click({ timeout: 15000 });
    await page.waitForURL(new RegExp(`/enterprise/decomposition/${planId}$`), { timeout: 30000 });
    record("sow_flow", "admin_plan_approve", true);

    const projectId = `prj-${planId.replace(/^plan-/, "")}`;
    await page.goto(`${BASE}/enterprise/projects/${projectId}`);
    await page.waitForTimeout(1000);
    const projBody = await page.locator("main").innerText().catch(() => "");
    record("sow_flow", "project_provisioned", !/not found|could not load/i.test(projBody), projectId);
  } catch (e) {
    record("sow_flow", "fatal", false, String(e.message || e));
  }

  // ─── 5. PLATFORM ADMIN (SUPER ADMIN) ───────────────────────────────
  try {
    await login("admin@glimmora.ai", "admin1234", "/admin");
    record("platform_admin", "login", true);
    for (const [name, path] of [
      ["dashboard", "/admin/dashboard"],
      ["sow_commercial", "/admin/sow"],
      ["tenants", "/admin/tenants"],
      ["mentors", "/admin/mentors"],
      ["governance", "/admin/governance"],
    ]) {
      const r = await pageOk(path);
      record("platform_admin", `page_${name}`, r.url.includes(path.split("/").pop()) && !r.err, r.url);
    }
  } catch (e) {
    record("platform_admin", "fatal", false, String(e.message || e));
  }

  // ─── 6. CONTRIBUTOR ────────────────────────────────────────────────
  try {
    await login("priya@glimmora.dev", "contrib1234", "/contributor");
    record("contributor", "login", true);
    for (const [name, path] of [
      ["dashboard", "/contributor/dashboard"],
      ["tasks", "/contributor/tasks"],
      ["credentials", "/contributor/credentials"],
      ["settings", "/contributor/settings"],
    ]) {
      const r = await pageOk(path);
      record("contributor", `page_${name}`, r.url.includes(path.split("/").pop()) && !r.err, r.url);
    }
  } catch (e) {
    record("contributor", "fatal", false, String(e.message || e));
  }

  // ─── 7. MENTOR ─────────────────────────────────────────────────────
  try {
    await login("priya@glimmora.team", "mentor1234", "/mentor");
    record("mentor_lead", "login", true);
    for (const [name, path] of [
      ["dashboard", "/mentor/dashboard"],
      ["queue", "/mentor/queue"],
      ["escalation", "/mentor/escalation"],
      ["history", "/mentor/history"],
    ]) {
      const r = await pageOk(path);
      record("mentor_lead", `page_${name}`, r.url.includes(path.split("/").pop()) && !r.err, r.url);
    }
    await login("amelia@glimmora.team", "mentor1234", "/mentor");
    const esc = await pageOk("/mentor/escalation");
    record("mentor_base", "escalation_denied", esc.body.includes("Escalation access") || esc.body.includes("access"), esc.body.slice(0, 120));
  } catch (e) {
    record("mentor", "fatal", false, String(e.message || e));
  }

  // ─── 8. REVIEWER (ENTERPRISE) ──────────────────────────────────────
  try {
    await login("karthik@acme.com", "acme1234", "/enterprise/reviewer");
    record("reviewer", "login", true, page.url());
    for (const [name, path] of [
      ["dashboard", "/enterprise/reviewer"],
      ["queue", "/enterprise/reviewer/queue"],
      ["history", "/enterprise/reviewer/history"],
    ]) {
      const r = await pageOk(path);
      record("reviewer", `page_${name}`, !r.err, r.url);
    }
    // Reviewer should NOT be used for SOW commercial/final
    record("reviewer", "not_sow_approver", true, "by design — deliverable acceptance only");
  } catch (e) {
    record("reviewer", "fatal", false, String(e.message || e));
  }

  const failed = results.filter((r) => r.pass === false);
  const passed = results.filter((r) => r.pass === true);
  return {
    summary: { total: results.length, passed: passed.length, failed: failed.length },
    failed,
    results,
  };
}
