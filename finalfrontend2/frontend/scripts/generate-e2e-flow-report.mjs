#!/usr/bin/env node
/**
 * Regenerate docs/e2e/FLOW-REPORT.md from Playwright JSON output.
 * Usage: npm run test:e2e && npm run test:e2e:flow-report
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const resultsPath = path.join(root, "e2e/report/results.json");
const outPath = path.join(root, "..", "docs/e2e/FLOW-REPORT.md");

if (!fs.existsSync(resultsPath)) {
  console.error("Missing e2e/report/results.json — run npm run test:e2e first.");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
const suites = raw.suites ?? [];

function flattenSuites(suite, out = []) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const project = test.projectName ?? "default";
      for (const result of test.results ?? []) {
        out.push({
          project,
          title: [...(suite.titlePath ?? []), spec.title].filter(Boolean).join(" › "),
          status: result.status,
          error: result.error?.message,
        });
      }
    }
  }
  for (const child of suite.suites ?? []) flattenSuites(child, out);
  return out;
}

let rows = [];
for (const s of suites) rows = flattenSuites(s, rows);

const passed = rows.filter((r) => r.status === "passed").length;
const failed = rows.filter((r) => r.status === "failed").length;
const skipped = rows.filter((r) => r.status === "skipped").length;
const total = rows.length;
const passRate = total ? Math.round((passed / total) * 100) : 0;

const byProject = new Map();
for (const r of rows) {
  if (!byProject.has(r.project)) byProject.set(r.project, { passed: 0, failed: 0, skipped: 0 });
  const b = byProject.get(r.project);
  if (r.status === "passed") b.passed++;
  else if (r.status === "failed") b.failed++;
  else if (r.status === "skipped") b.skipped++;
}

const failedRows = rows.filter((r) => r.status === "failed");

const lines = [
  "# E2E Flow Report",
  "",
  `> Generated: **${new Date().toISOString().slice(0, 10)}** · \`npm run test:e2e\``,
  "",
  "## Summary",
  "",
  "| Metric | Count |",
  "|--------|------:|",
  `| **Total results** | ${total} |`,
  `| **Passed** | **${passed}** |`,
  `| **Failed** | ${failed} |`,
  `| **Skipped** | ${skipped} |`,
  `| **Pass rate** | **${passRate}%** |`,
  "",
  "## By project",
  "",
  "| Project | Pass | Fail | Skip |",
  "|---------|-----:|-----:|-----:|",
];

for (const [project, b] of [...byProject.entries()].sort()) {
  lines.push(`| ${project} | ${b.passed} | ${b.failed} | ${b.skipped} |`);
}

if (failedRows.length) {
  lines.push("", "## Failed tests", "", "| Test | Project | Error |", "|------|---------|-------|");
  for (const f of failedRows.slice(0, 30)) {
    const err = (f.error ?? "").replace(/\|/g, "\\|").split("\n")[0].slice(0, 120);
    lines.push(`| ${f.title} | ${f.project} | ${err} |`);
  }
}

lines.push(
  "",
  "## Commands",
  "",
  "```bash",
  "cd frontend && npm run test:e2e:smoke   # route smoke only",
  "cd frontend && npm run test:e2e:flows    # golden paths + edge cases",
  "cd frontend && npm run test:e2e          # full suite",
  "cd frontend && npm run test:e2e:report   # HTML report",
  "```",
  "",
);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n"));
console.log(`Wrote ${outPath} (${passed}/${total} passed)`);
