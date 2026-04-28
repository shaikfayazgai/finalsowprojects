"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FileDown,
  Download,
  BarChart3,
  CheckCircle2,
  Receipt,
  DollarSign,
  ClipboardList,
  TrendingUp,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import {
  Badge,
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toast } from "@/lib/stores/toast-store";
import { mockProjects } from "@/mocks/data/enterprise-projects";

/* ── Report Type Definitions ── */
const reportTypes = [
  {
    id: "billing-summary",
    title: "Billing Summary",
    description: "Overview of all billing activity including invoices, payments, and outstanding balances.",
    icon: Receipt,
    accent: "text-teal-600",
    bg: "bg-teal-50",
    gradient: "from-teal-500 to-teal-600",
    lastGenerated: "Mar 7, 2026",
    records: 42,
    recordLabel: "invoices",
  },
  {
    id: "payout-report",
    title: "Payout Report",
    description: "Detailed payout records per contributor, task acceptance dates, and amounts disbursed.",
    icon: DollarSign,
    accent: "text-forest-600",
    bg: "bg-forest-50",
    gradient: "from-forest-500 to-forest-600",
    lastGenerated: "Mar 5, 2026",
    records: 128,
    recordLabel: "payouts",
  },
  {
    id: "task-pricing",
    title: "Task Pricing Report",
    description: "Rate card applications across all tasks, effort breakdowns, and pricing analytics.",
    icon: ClipboardList,
    accent: "text-gold-600",
    bg: "bg-gold-50",
    gradient: "from-gold-500 to-gold-600",
    lastGenerated: "Mar 3, 2026",
    records: 86,
    recordLabel: "tasks priced",
  },
  {
    id: "full-financial",
    title: "Full Financial Report",
    description: "Comprehensive report covering billing, payouts, escrow, pricing, and forecasts.",
    icon: TrendingUp,
    accent: "text-brown-600",
    bg: "bg-brown-50",
    gradient: "from-brown-500 to-brown-600",
    lastGenerated: "Feb 28, 2026",
    records: 310,
    recordLabel: "line items",
  },
];

/* ── Recent Exports ── */
const recentExports = [
  { id: 1, name: "billing-summary-mar-2026.csv", type: "Billing Summary", format: "CSV", date: "Mar 7, 2026", size: "128 KB" },
  { id: 2, name: "payout-report-q1-2026.pdf", type: "Payout Report", format: "PDF", date: "Mar 5, 2026", size: "2.4 MB" },
  { id: 3, name: "full-financial-feb-2026.csv", type: "Full Financial", format: "CSV", date: "Feb 28, 2026", size: "456 KB" },
  { id: 4, name: "task-pricing-feb-2026.pdf", type: "Task Pricing", format: "PDF", date: "Feb 20, 2026", size: "1.8 MB" },
];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function buildPdfBytes(reportId: string): Promise<Uint8Array> {
  const date = new Date().toISOString().split("T")[0];
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const reportLabel = reportId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Header bar
  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: rgb(0.11, 0.47, 0.44) });
  page.drawText("GlimmoraTeam", { x: margin, y: height - 30, size: 14, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Financial Report", { x: margin, y: height - 50, size: 10, font: regular, color: rgb(0.8, 0.95, 0.93) });

  y = height - 100;

  page.drawText(reportLabel, { x: margin, y, size: 18, font: bold, color: rgb(0.13, 0.15, 0.18) });
  y -= 20;
  page.drawText(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, {
    x: margin, y, size: 9, font: regular, color: rgb(0.45, 0.45, 0.5),
  });
  y -= 6;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.85, 0.87, 0.9) });
  y -= 24;

  const rows = [
    ["Type",     "Date",       "Description",               "Amount",  "Status"],
    ["Invoice",  "2026-03-01", "SOW #2024-001 Milestone 1", "$12,500", "Paid"],
    ["Invoice",  "2026-03-05", "SOW #2024-002 Delivery",    "$8,200",  "Pending"],
    ["Payout",   "2026-03-02", "Contributor Disbursement",  "$3,400",  "Disbursed"],
    ["Invoice",  "2026-02-28", "Platform Fee Q1",            "$1,200",  "Paid"],
    ["Payout",   "2026-02-25", "Milestone Bonus Pool",       "$950",    "Disbursed"],
  ];
  const colX = [margin, 130, 210, 360, 460];

  rows.forEach((row, i) => {
    const isHeader = i === 0;
    if (isHeader) {
      page.drawRectangle({ x: margin - 4, y: y - 4, width: width - margin * 2 + 8, height: 18, color: rgb(0.95, 0.97, 0.97) });
    } else if (i % 2 === 0) {
      page.drawRectangle({ x: margin - 4, y: y - 4, width: width - margin * 2 + 8, height: 18, color: rgb(0.98, 0.99, 0.99) });
    }
    row.forEach((cell, ci) => {
      page.drawText(cell, {
        x: colX[ci], y,
        size: isHeader ? 9 : 8.5,
        font: isHeader ? bold : regular,
        color: isHeader ? rgb(0.13, 0.15, 0.18) : rgb(0.25, 0.27, 0.32),
      });
    });
    y -= 22;
  });

  y -= 12;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.85, 0.87, 0.9) });
  y -= 18;
  page.drawText("* This is a mock report. Connect the backend API to generate live data.", {
    x: margin, y, size: 7.5, font: regular, color: rgb(0.6, 0.6, 0.65),
  });

  page.drawText(`GlimmoraTeam  ·  Confidential  ·  ${date}`, {
    x: margin, y: 30, size: 8, font: regular, color: rgb(0.65, 0.65, 0.7),
  });
  page.drawText("Page 1 of 1", {
    x: width - margin - 40, y: 30, size: 8, font: regular, color: rgb(0.65, 0.65, 0.7),
  });

  return pdfDoc.save();
}

async function generateMockReport(reportId: string, fmt: string): Promise<void> {
  const date = new Date().toISOString().split("T")[0];
  const filename = `${reportId}-report-${date}.${fmt}`;

  if (fmt === "csv") {
    const content = [
      `"Report","${reportId}","Generated","${new Date().toISOString()}"`,
      `"Type","Date","Amount","Status"`,
      `"Invoice","2026-03-01","$12,500","Paid"`,
      `"Invoice","2026-03-05","$8,200","Pending"`,
      `"Payout","2026-03-02","$3,400","Disbursed"`,
    ].join("\n");
    triggerDownload(new Blob([content], { type: "text/csv" }), filename);
    return;
  }

  const pdfBytes = await buildPdfBytes(reportId);
  triggerDownload(new Blob([pdfBytes as BlobPart], { type: "application/pdf" }), filename);
}

export default function FinancialReportsPage() {
  const [selectedReport, setSelectedReport] = React.useState("billing-summary");
  const [format, setFormat] = React.useState("csv");
  const [scope, setScope] = React.useState("all");
  const [dateRange, setDateRange] = React.useState("last-30");
  const [project, setProject] = React.useState("all");
  const [generating, setGenerating] = React.useState(false);
  const [previewing, setPreviewing] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Clean up object URL when preview closes
  React.useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const pdfBytes = await buildPdfBytes(selectedReport);
      const url = URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: "application/pdf" }));
      setPreviewUrl(url);
    } catch {
      toast.error("Preview Failed", "Could not generate the preview. Please try again.");
    } finally {
      setPreviewing(false);
    }
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };

  const selectedReportData = reportTypes.find((r) => r.id === selectedReport);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateMockReport(selectedReport, format);
      toast.success(
        "Report Downloaded",
        `${selectedReportData?.title} saved as ${selectedReport}-report-${new Date().toISOString().split("T")[0]}.${format}`
      );
    } catch {
      toast.error("Download Failed", "Could not generate the report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center shadow-md shadow-forest-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brown-900 tracking-tight font-heading">
              Financial Reports
            </h1>
            <p className="text-sm text-beige-600">
              Generate and export billing, payout, and pricing reports.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content: Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Report Configuration */}
        <motion.div variants={fadeUp} className="lg:col-span-3 space-y-5">
          {/* Report Type Selection */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[13px] font-semibold text-brown-800 mb-3">
              Select Report Type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reportTypes.map((report) => {
                const isSelected = selectedReport === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "text-left p-4 rounded-xl border-[1.5px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brown-500 focus-visible:ring-offset-2",
                      isSelected
                        ? "border-brown-400 bg-brown-50/60 shadow-sm"
                        : "border-beige-200/50 bg-white/60 hover:border-beige-300 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br shadow-sm",
                          report.gradient
                        )}
                      >
                        <report.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-brown-900">
                          {report.title}
                        </p>
                        <p className="text-[11px] text-beige-500 mt-0.5 line-clamp-2">
                          {report.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] text-beige-400">
                            Last: {report.lastGenerated}
                          </span>
                          <span className="text-[9px] bg-beige-100 text-beige-600 px-1.5 py-0.5 rounded-full font-medium">
                            {report.records} {report.recordLabel}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-brown-600 shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Settings */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[13px] font-semibold text-brown-800 mb-4">
              Export Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Format */}
              <div>
                <label className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider mb-1.5 block">
                  Format
                </label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider mb-1.5 block">
                  Date Range
                </label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-7">Last 7 Days</SelectItem>
                    <SelectItem value="last-30">Last 30 Days</SelectItem>
                    <SelectItem value="last-90">Last 90 Days</SelectItem>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project Status */}
              <div>
                <label className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider mb-1.5 block">
                  Project Status
                </label>
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="completed">Completed Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Specific Project */}
              <div>
                <label className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider mb-1.5 block">
                  Specific Project
                </label>
                <Select value={project} onValueChange={setProject}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {mockProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Buttons */}
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-beige-100/60">
              <Button
                variant="gradient-forest"
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {generating ? "Generating…" : "Generate & Download"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={previewing}
              >
                {previewing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                {previewing ? "Loading…" : "Preview"}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Right: Recent Exports + Quick Stats */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-5">
          {/* Quick Stats */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[13px] font-semibold text-brown-800 mb-3">
              Report Stats
            </h3>
            <div className="space-y-3">
              {[
                { label: "Reports Generated", value: "23", sub: "This month", accent: "text-teal-600", bg: "bg-teal-50" },
                { label: "Total Downloads", value: "67", sub: "All time", accent: "text-forest-600", bg: "bg-forest-50" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between p-3 rounded-xl border border-beige-100/60 bg-beige-50/30"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bg)}>
                      <FileDown className={cn("w-3.5 h-3.5", stat.accent)} />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-brown-800">{stat.label}</p>
                      <p className="text-[10px] text-beige-500">{stat.sub}</p>
                    </div>
                  </div>
                  <p className="text-[18px] font-bold text-brown-900 tracking-tight">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Exports */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[13px] font-semibold text-brown-800 mb-3">
              Recent Exports
            </h3>
            <div className="space-y-2">
              {recentExports.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => {
                    const reportId = exp.type.toLowerCase().replace(/\s+/g, "-");
                    const fmt = exp.format.toLowerCase();
                    generateMockReport(reportId, fmt);
                    toast.success("Re-downloading", exp.name);
                  }}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-beige-100/60 hover:border-beige-200 hover:bg-beige-50/40 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brown-500 focus-visible:ring-offset-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-beige-100 flex items-center justify-center shrink-0">
                    {exp.format === "CSV" ? (
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5 text-brown-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-brown-800 truncate">
                      {exp.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-beige-500">{exp.date}</span>
                      <span className="text-[10px] text-beige-400">·</span>
                      <span className="text-[10px] text-beige-500">{exp.size}</span>
                    </div>
                  </div>
                  <Badge
                    variant={exp.format === "CSV" ? "teal" : "brown"}
                    size="sm"
                  >
                    {exp.format}
                  </Badge>
                  <Download className="w-3 h-3 text-beige-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-beige-100 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <FileDown className="w-4 h-4 text-forest-600" />
                <span className="text-sm font-semibold text-brown-900">
                  {selectedReportData?.title} — Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await generateMockReport(selectedReport, "pdf");
                    closePreview();
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
                <button
                  onClick={closePreview}
                  className="p-1.5 rounded-lg text-beige-400 hover:text-brown-700 hover:bg-beige-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PDF iframe */}
            <iframe
              src={previewUrl}
              className="flex-1 w-full border-0"
              title="Report Preview"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
