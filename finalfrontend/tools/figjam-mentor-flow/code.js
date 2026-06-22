/**
 * Glimmora Mentor Portal — FigJam flow generator
 * Run once on your board: https://www.figma.com/board/xEkUNKsGoFrKf9sU6pj8VG/
 */

const COL = 300;
const ROW = 340;
const EDGE_ABOVE = -150;
const ORIGIN_X = 120;
const ORIGIN_Y = 120;

/** @type {Map<string, SceneNode>} */
const nodes = new Map();

async function setText(node, text) {
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  if ("text" in node && node.text) {
    await figma.loadFontAsync(node.text.fontName);
    node.text.characters = text;
  }
}

async function sticky(text, x, y, small = false) {
  const s = figma.createSticky();
  s.x = x;
  s.y = y;
  if (small) {
    s.resize(220, 180);
  }
  await setText(s, text);
  return s;
}

async function shapeLabel(text, x, y, w = 520) {
  const sh = figma.createShapeWithText();
  sh.shapeType = "ROUNDED_RECTANGLE";
  sh.x = x;
  sh.y = y;
  sh.resize(w, 72);
  sh.fills = [{ type: "SOLID", color: { r: 0.15, g: 0.22, b: 0.18 } }];
  sh.text.fontSize = 20;
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  sh.text.characters = text;
  sh.text.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  return sh;
}

function connect(from, to, label) {
  const c = figma.createConnector();
  c.connectorStart = { endpointNodeId: from.id, magnet: "AUTO" };
  c.connectorEnd = { endpointNodeId: to.id, magnet: "AUTO" };
  if (label) {
    c.text.characters = label;
  }
  return c;
}

async function node(id, text, col, row, edgeCases = [], sectionRow = 0) {
  const x = ORIGIN_X + col * COL;
  const y = ORIGIN_Y + sectionRow * ROW * 4 + row * ROW;

  for (let i = 0; i < edgeCases.length; i++) {
    const ec = edgeCases[i];
    await sticky(`⚠️ ${ec}`, x, y + EDGE_ABOVE - i * 95, true);
  }

  const n = await sticky(text, x, y);
  nodes.set(id, n);
  return n;
}

async function link(fromId, toId, label) {
  const a = nodes.get(fromId);
  const b = nodes.get(toId);
  if (a && b) connect(a, b, label || "");
}

async function buildLegend(sy) {
  await shapeLabel("LEGEND — data source colors", ORIGIN_X, sy, 640);
  const items = [
    "🟢 REAL — Prisma / Postgres (production-ready)",
    "🟡 RUNTIME — in-memory until server restart",
    "🔵 MOCK — static seed + mock API routes",
    "🟣 PROXY — API exists, UI not wired",
    "🔒 GATED — role or onboarding check",
    "⚠️ yellow stickies above a box = edge cases for that step",
  ];
  for (let i = 0; i < items.length; i++) {
    await sticky(items[i], ORIGIN_X + i * 320, sy + 90, true);
  }
}

async function buildSection1Entry(sr) {
  const base = sr * ROW * 4;
  await shapeLabel("1 · ENTRY & GATES", ORIGIN_X, ORIGIN_Y + base - 60, 480);

  await node(
    "invite",
    "Admin invite\n/auth/register/mentor?code=",
    0,
    0,
    [],
    sr
  );
  await node("login", "Login\n(credentials / SSO)", 1, 0, [], sr);
  await node(
    "reg",
    "registerMentorFromInvite()\nUser + UserRole rows",
    2,
    0,
    [],
    sr
  );
  await node(
    "hit",
    "Request /mentor/* ?",
    3,
    0,
    ["E5: wrong portal role → other dashboard", "E6: unauthenticated → /auth/login"],
    sr
  );
  await node(
    "onb-url",
    "/mentor/onboarding ?",
    4,
    0,
    ["E2: onboarding = no sidebar (AuthShell only)"],
    sr
  );

  await node(
    "shell-onb",
    "AuthShell only\n(no EnterpriseShell)",
    3,
    1,
    [],
    sr
  );
  await node(
    "shell-main",
    "EnterpriseShell\n+ sidebar",
    5,
    1,
    [],
    sr
  );
  await node(
    "demo",
    "MENTOR_DEMO=1 ?",
    4,
    1,
    ["E3: demo flag skips role guard + onboarding gate"],
    sr
  );
  await node(
    "guard",
    "useRoleGuard(['mentor'])",
    4,
    2,
    ["E1: JWT role always 'mentor'; tier from UserRole not JWT"],
    sr
  );
  await node(
    "gate",
    "MentorOnboardingGate\nonboardingComplete?",
    5,
    2,
    [
      "E4: dev emails priya/amelia auto-onboarded",
      "E7: incomplete → forced to /mentor/onboarding",
    ],
    sr
  );
  await node("portal", "Portal ready\n(dashboard, queue, …)", 6, 2, [], sr);

  await link("invite", "reg");
  await link("reg", "login");
  await link("login", "hit");
  await link("hit", "onb-url");
  await link("onb-url", "shell-onb", "yes");
  await link("onb-url", "shell-main", "no");
  await link("shell-onb", "demo");
  await link("shell-main", "demo");
  await link("demo", "guard", "no");
  await link("demo", "gate", "yes");
  await link("guard", "gate");
  await link("gate", "portal", "yes");
}

async function buildSection2Onboarding(sr) {
  await shapeLabel("2 · ONBOARDING WIZARD (first-time mentor)", ORIGIN_X, ORIGIN_Y + sr * ROW * 4 - 60, 620);
  await node("s1", "Step 1\nAgreements", 0, 0, ["E8: standalone white AuthShell UI"], sr);
  await node("s2", "Step 2\nCompetency attestation", 1, 0, [], sr);
  await node("s3", "Step 3\nAvailability preview", 2, 0, [], sr);
  await node("s4", "Done\nPOST /api/mentor/me", 3, 0, ["E9: completion is 🟡 RUNTIME not Postgres"], sr);
  await node("dash", "/mentor/dashboard", 4, 0, [], sr);
  await link("s1", "s2");
  await link("s2", "s3");
  await link("s3", "s4");
  await link("s4", "dash");
}

async function buildSection3Roles(sr) {
  await shapeLabel("3 · ROLE TIERS & NAV", ORIGIN_X, ORIGIN_Y + sr * ROW * 4 - 60, 480);
  await node("me", "GET /api/mentor/me", 0, 0, [], sr);
  await node("tier", "resolveMentorRoleForUser()\nmentor | senior | lead", 1, 0, ["E11: demo ?role= tier override"], sr);
  await node("nav", "useMentorNavConfig()", 2, 0, [], sr);
  await node(
    "esc-nav",
    "Hide Escalations\nif !isSeniorOrLead",
    3,
    0,
    ["E10: base mentor direct URL → access denied"],
    sr
  );
  await node("acct", "Account nav\nProfile · Settings · Notifications", 4, 0, [], sr);
  await link("me", "tier");
  await link("tier", "nav");
  await link("nav", "esc-nav");
  await link("esc-nav", "acct");
}

async function buildSection4Dashboard(sr) {
  await shapeLabel("4 · DASHBOARD 🔵 MOCK", ORIGIN_X, ORIGIN_Y + sr * ROW * 4 - 60, 420);
  await node(
    "d-page",
    "/mentor/dashboard",
    0,
    0,
    ["E12: entire payload 🔵 MOCK API", "E13: today sessions 🔵 may ≠ 🟢 mentorship page"],
    sr
  );
  await node("d-api", "GET /api/mock/mentor/dashboard", 1, 0, [], sr);
  await node("d-kpi", "KPIs\npending · SLA risk · done 7d", 2, 0, ["E14: empty queue → 'Queue clear' hero"], sr);
  await node("d-hero", "Hero: next review by SLA", 3, 0, [], sr);
  await node(
    "d-esc",
    "Open escalations panel\n(senior+ only)",
    2,
    1,
    ["E16: team load panel = mentor.lead only", "E15: AI signals = static copy"],
    sr
  );
  await node("d-sess", "Today sessions widget\n🔵 MOCK", 4, 0, [], sr);
  await link("d-page", "d-api");
  await link("d-api", "d-kpi");
  await link("d-kpi", "d-hero");
  await link("d-api", "d-esc");
  await link("d-api", "d-sess");
}

async function buildSection5Queue(sr) {
  await shapeLabel("5 · REVIEW QUEUE 🔵 list + 🟡 decisions", ORIGIN_X, ORIGIN_Y + sr * ROW * 4 - 60, 560);
  await node(
    "q-list",
    "/mentor/queue",
    0,
    0,
    [
      "E17: list 🔵 MOCK; writes 🟡 runtime-store",
      "E18: empty filters → No matches",
      "E22: runtime lost on server restart",
    ],
    sr
  );
  await node("q-api", "GET /api/mock/mentor/reviews", 1, 0, [], sr);
  await node("q-filt", "Filters\nscope · group · SLA · flags", 2, 0, [], sr);
  await node(
    "q-det",
    "/mentor/queue/[reviewId]\nReview cockpit",
    3,
    0,
    ["E19: unknown reviewId → 404", "E21: backend 🟣 proxy exists, UI uses mock"],
    sr
  );
  await node("q-diff", "/diff\nround evidence 🔵", 4, 0, [], sr);
  await node("q-audit", "/audit\ntimeline 🔵", 5, 0, [], sr);
  await node("q-draft", "Save draft\nPUT 🟡", 3, 1, [], sr);
  await node(
    "q-decide",
    "Decide modal\nAccept · Rework · Reject",
    4,
    1,
    ["Accept: tentative confidence → confirm", "Rework: requires correction bullets"],
    sr
  );
  await node("q-rea", "Reassign / Withdraw\n🔵 picker · conflict", 5, 1, [], sr);
  await node(
    "q-post",
    "POST /api/mentor/reviews/:id 🟡",
    6,
    1,
    ["E20: redirect ?refresh=timestamp refetches list"],
    sr
  );
  await node("q-hist", "→ /mentor/history\n🔵+🟡", 7, 1, [], sr);
  await link("q-list", "q-api");
  await link("q-api", "q-filt");
  await link("q-filt", "q-det");
  await link("q-det", "q-diff");
  await link("q-det", "q-audit");
  await link("q-det", "q-draft");
  await link("q-det", "q-decide");
  await link("q-decide", "q-rea");
  await link("q-rea", "q-post");
  await link("q-post", "q-hist");
  await link("q-post", "q-list", "refresh");
}

async function buildSection6Escalation(sr) {
  await shapeLabel("6 · ESCALATIONS 🔵 MOCK · 🔒 senior + lead", ORIGIN_X, ORIGIN_Y + sr * ROW * 4 - 60, 560);
  await node(
    "e-page",
    "/mentor/escalation",
    0,
    0,
    ["E23: adjudication simulated ~700ms, no persist", "E24: base mentor → access denied"],
    sr
  );
  await node("e-gate", "isSeniorOrLead?", 1, 0, [], sr);
  await node("e-deny", "Access denied panel", 1, 1, [], sr);
  await node("e-list", "GET mock escalations", 2, 0, [], sr);
  await node("e-det", "/escalation/[id]", 3, 0, [], sr);
  await node(
    "e-adj",
    "Adjudicate\nuphold · override · reassign",
    4,
    0,
    ["Statuses: open → assigned → in_review → resolved"],
    sr
  );
  await link("e-page", "e-gate");
  await link("e-gate", "e-deny", "no");
  await link("e-gate", "e-list", "yes");
  await link("e-list", "e-det");
  await link("e-det", "e-adj");
}

async function buildSection7History(sr) {
  await shapeLabel("7 · HISTORY & METRICS 🔵+🟡", ORIGIN_X, ORIGIN_Y + sr * ROW * 4 - 60, 480);
  await node(
    "h-page",
    "/mentor/history",
    0,
    0,
    ["E25: mock seed + runtime decisions merged", "E26: unknown decisionId → 404"],
    sr
  );
  await node("h-api", "GET mock decisions", 1, 0, [], sr);
  await node("h-filt", "Filter: accept · rework · reject", 2, 0, [], sr);
  await node("h-det", "/history/[decisionId]\nread-only", 3, 0, [], sr);
  await node(
    "h-met",
    "/history/metrics\n30d rollups",
    2,
    1,
    ["E27: metrics from same mock endpoint"],
    sr
  );
  await link("h-page", "h-api");
  await link("h-api", "h-filt");
  await link("h-filt", "h-det");
  await link("h-page", "h-met");
}

async function buildSection8Mentorship(sr) {
  await shapeLabel("8 · MENTORSHIP 🟢 REAL (system-assigned)", ORIGIN_X, ORIGIN_Y + sr * ROW * 4 - 60, 620);

  await node(
    "c-set",
    "Contributor\n/settings/mentorship",
    0,
    0,
    ["E28: mentor does NOT assign sessions", "Contributor opt-in only (not main nav)"],
    sr
  );
  await node("c-opt", "POST opt-in 🟢\nmentorshipOptInAt", 1, 0, [], sr);
  await node(
    "sys-assign",
    "assignMentorshipSession()",
    2,
    0,
    ["E29: idempotent — existing scheduled → return", "E30: no active mentor → 409"],
    sr
  );
  await node(
    "sys-match",
    "findBestMentorForContributor()\nskills · acceptsMentorshipSessions",
    3,
    0,
    ["E33: OOO/capacity in settings not enforced yet", "dev: prefers priya@glimmora.team"],
    sr
  );
  await node(
    "sys-db",
    "scheduleSession() → Prisma 🟢\ntomorrow 14:00 UTC · 45min",
    4,
    0,
    ["E31: scheduled | held | no_show | cancelled"],
    sr
  );
  await node(
    "m-list",
    "/mentor/mentorship\nGET /api/mentor/sessions 🟢",
    5,
    0,
    ["E32: dashboard sessions widget still 🔵 mock", "Sidebar: section Mentorship → link 'Sessions'"],
    sr
  );
  await node("m-det", "/mentorship/[sessionId]", 6, 0, [], sr);
  await node("m-notes", "POST coaching notes 🟢", 7, 0, [], sr);
  await node("m-done", "Mark held / no-show / cancel 🟢", 8, 0, [], sr);

  await link("c-set", "c-opt");
  await link("c-opt", "sys-assign");
  await link("sys-assign", "sys-match");
  await link("sys-match", "sys-db");
  await link("sys-db", "m-list");
  await link("m-list", "m-det");
  await link("m-det", "m-notes");
  await link("m-notes", "m-done");
}

async function buildSection9Settings(sr) {
  await shapeLabel("9 · PROFILE · SETTINGS · NOTIFICATIONS", ORIGIN_X, ORIGIN_Y + sr * ROW * 4 - 60, 620);
  await node(
    "prof",
    "/mentor/profile",
    0,
    0,
    ["E34: competency matrix read-only (admin mock merge)"],
    sr
  );
  await node("prof-ed", "/profile/edit\nPATCH 🟡", 1, 0, ["E35: runtime overrides only"], sr);
  await node("set", "/mentor/settings", 2, 0, [], sr);
  await node(
    "set-avail",
    "Availability OOO 🟡",
    3,
    0,
    ["E36: OOO copy says pause matching — not wired"],
    sr
  );
  await node(
    "notif",
    "/mentor/notifications 🔵",
    4,
    0,
    ["E39: mark-all-read client only", "E40: mentorship_reminder cron not wired", "E37: some notification toggles locked on"],
    sr
  );
  await node("priv", "/settings/privacy\nstatic copy", 3, 1, ["E38: privacy page static only"], sr);
  await link("prof", "prof-ed");
  await link("set", "set-avail");
  await link("set", "notif");
  await link("set", "priv");
}

async function buildSection10Admin(sr) {
  await shapeLabel("10 · ADMIN & REGISTRATION INTEGRATION", ORIGIN_X, ORIGIN_Y + sr * ROW * 4 - 60, 560);
  await node(
    "adm",
    "/admin/mentors 🔵",
    0,
    0,
    ["E41: admin pool UI mock — no live assignment", "E42: real match uses Prisma Mentor table"],
    sr
  );
  await node("inv", "Invite mentor", 1, 0, ["E43: invite sets UserRole tier"], sr);
  await node("reg2", "/auth/register/mentor", 2, 0, [], sr);
  await node("user", "User + Mentor + UserRole 🟢", 3, 0, [], sr);
  await node("onb2", "→ /mentor/onboarding", 4, 0, [], sr);
  await link("adm", "inv");
  await link("inv", "reg2");
  await link("reg2", "user");
  await link("user", "onb2");
}

async function buildSection11Data(sr) {
  await shapeLabel("11 · DATA LAYER SUMMARY (stakeholder view)", ORIGIN_X, ORIGIN_Y + sr * ROW * 4 - 60, 620);
  const rows = [
    "Dashboard · queue · escalations · history · notifications → 🔵 MOCK / 🟡 RUNTIME → NOT prod-ready",
    "Mentorship (/mentor/mentorship/*) → 🟢 Prisma read+write → PRODUCTION READY",
    "Auth tier (/api/mentor/me) → 🟢+🟡 partial",
    "Submissions backend → 🟣 PROXY only (no mentor UI)",
    "Manual POST /api/mentor/sessions exists — NO mentor UI to schedule manually",
  ];
  for (let i = 0; i < rows.length; i++) {
    await sticky(rows[i], ORIGIN_X + (i % 3) * 320, ORIGIN_Y + sr * ROW * 4 + Math.floor(i / 3) * 200, true);
  }
}

async function buildSection12Lifecycle(sr) {
  await shapeLabel("12 · ONE-PAGE LIFECYCLE", ORIGIN_X, ORIGIN_Y + sr * ROW * 4 - 60, 420);
  await node("lc1", "Invite / Register", 0, 0, [], sr);
  await node("lc2", "Login → Onboarding", 1, 0, [], sr);
  await node("lc3", "Dashboard hub", 2, 0, [], sr);
  await node("lc4", "Review queue 🔵+🟡", 3, 0, [], sr);
  await node("lc5", "Escalations 🔵 senior+", 4, 0, [], sr);
  await node("lc6", "Mentorship 🟢", 3, 1, [], sr);
  await node("lc7", "Profile / Settings", 2, 1, [], sr);
  await link("lc1", "lc2");
  await link("lc2", "lc3");
  await link("lc3", "lc4");
  await link("lc3", "lc5");
  await link("lc3", "lc6");
  await link("lc3", "lc7");
}

async function main() {
  figma.viewport.scrollAndZoomIntoView([figma.currentPage]);

  await buildLegend(0);

  await buildSection1Entry(1);
  await buildSection2Onboarding(2);
  await buildSection3Roles(3);
  await buildSection4Dashboard(4);
  await buildSection5Queue(5);
  await buildSection6Escalation(6);
  await buildSection7History(7);
  await buildSection8Mentorship(8);
  await buildSection9Settings(9);
  await buildSection10Admin(10);
  await buildSection11Data(11);
  await buildSection12Lifecycle(12);

  const all = figma.currentPage.children;
  figma.viewport.scrollAndZoomIntoView(all);
  figma.closePlugin(
    "✅ Mentor portal flow drawn!\n12 sections · 43 edge cases · scroll down to review.\nTip: select all → tidy up with FigJam organize if needed."
  );
}

main();
