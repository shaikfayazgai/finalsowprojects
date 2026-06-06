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
import { toast } from "@/lib/stores/toast-store";
import { mockProjects, mockDeliverables, mockMilestones } from "@/mocks/data/enterprise-projects";
import { mockInvoices } from "@/mocks/data/enterprise-billing";
import { useRateCardsStore } from "@/lib/stores/rate-cards-store";
import { buildSimpleReportPdf, downloadCSV, triggerDownload, todayStamp, type PdfTable } from "@/lib/utils/file-download";

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

interface ReportContent {
  title: string;
  table: PdfTable;
  summary?: { label: string; value: string }[];
  filename: string;
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

  const rateCards = useRateCardsStore((s) => s.rateCards);

  // Clean up object URL when preview closes
  React.useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectedReportData = reportTypes.find((r) => r.id === selectedReport);

  const buildReportContent = React.useCallback((reportId: string): ReportContent => {
    const stamp = todayStamp();
    const projectFilter = project === "all" ? null : project;

    if (reportId === "task-pricing") {
      const rows = rateCards.map((c) => [
        c.skill, c.level, c.region,
        formatCurrency(c.hourlyRate),
        formatCurrency(c.dailyRate),
        c.effectiveFrom, c.status,
      ]);
      return {
        title: "Task Pricing Report",
        filename: `task-pricing-report-${stamp}`,
        table: {
          headers: ["Skill", "Level", "Region", "Hourly Rate", "Daily Rate", "Effective From", "Status"],
          rows,
          colWeights: [2, 0.8, 1.4, 1.1, 1.1, 1.3, 0.9],
        },
        summary: [
          { label: "Active rate cards", value: String(rateCards.filter((c) => c.status === "active").length) },
          { label: "Draft rate cards",  value: String(rateCards.filter((c) => c.status === "draft").length) },
          { label: "Total cards",        value: String(rateCards.length) },
        ],
      };
    }

    if (reportId === "payout-report") {
      const approved = mockDeliverables.filter((d) => d.status === "approved");
      const filtered = projectFilter ? approved.filter((d) => d.projectId === projectFilter) : approved;
      const rows = filtered.map((d) => {
        const proj = mockProjects.find((p) => p.id === d.projectId);
        const milestone = mockMilestones.find((m) => m.id === d.milestoneId);
        const payout = milestone ? Math.round(milestone.budget / (milestone.deliverables || 1)) : 0;
        return [proj?.title ?? d.projectId, milestone?.title ?? d.milestoneId, d.id, "Approved", formatCurrency(payout)];
      });
      return {
        title: "Payout Report",
        filename: `payout-report-${stamp}`,
        table: {
          headers: ["Project", "Milestone", "Deliverable", "Status", "Payout"],
          rows,
          colWeights: [2, 2, 1.4, 1, 1.1],
        },
        summary: [
          { label: "Approved deliverables", value: String(filtered.length) },
          { label: "Total payout",          value: formatCurrency(rows.reduce((sum, r) => {
            const cell = String(r[4] ?? "").replace(/[^0-9.-]/g, "");
            return sum + (Number(cell) || 0);
          }, 0)) },
        ],
      };
    }

    if (selectedReport === "full-financial") {
      const rcRows = rateCards.map((c) => ["Rate Card", c.skill, `${c.level} / ${c.region}`, formatCurrency(c.hourlyRate), c.status]);
      const invRows = (projectFilter ? mockInvoices.filter((i) => i.projectId === projectFilter) : mockInvoices).map((inv) => [
        "Invoice", inv.number, mockProjects.find((p) => p.id === inv.projectId)?.title ?? inv.projectId,
        formatCurrency(inv.amount), inv.status,
      ]);
      const delRows = mockDeliverables.filter((d) => d.status === "approved").map((d) => {
        const milestone = mockMilestones.find((m) => m.id === d.milestoneId);
        const payout = milestone ? Math.round(milestone.budget / (milestone.deliverables || 1)) : 0;
        return ["Payout", d.id, mockProjects.find((p) => p.id === d.projectId)?.title ?? d.projectId, formatCurrency(payout), "Disbursed"];
      });
      const rows = [...rcRows, ...invRows, ...delRows];
      return {
        title: "Full Financial Report",
        filename: `full-financial-report-${stamp}`,
        table: {
          headers: ["Type", "Reference", "Description", "Amount", "Status"],
          rows,
          colWeights: [1, 1.4, 2.4, 1.2, 1],
        },
        summary: [
          { label: "Rate cards",   value: String(rcRows.length) },
          { label: "Invoices",     value: String(invRows.length) },
          { label: "Payouts",      value: String(delRows.length) },
        ],
      };
    }

    // billing-summary (default)
    const filteredInvoices = projectFilter ? mockInvoices.filter((i) => i.projectId === projectFilter) : mockInvoices;
    const rows = filteredInvoices.map((inv) => [
      inv.number,
      mockProjects.find((p) => p.id === inv.projectId)?.title ?? inv.projectId,
      inv.status,
      inv.issuedDate,
      inv.dueDate,
      formatCurrency(inv.amount),
      formatCurrency(inv.paidAmount),
    ]);
    const totalAmount = filteredInvoices.reduce((sum, i) => sum + i.amount, 0);
    const totalPaid = filteredInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
    return {
      title: "Billing Summary",
      filename: `billing-summary-${stamp}`,
      table: {
        headers: ["Invoice #", "Project", "Status", "Issued", "Due", "Amount", "Paid"],
        rows,
        colWeights: [1.3, 2.4, 1, 1.1, 1.1, 1.2, 1.2],
      },
      summary: [
        { label: "Invoices",   value: String(filteredInvoices.length) },
        { label: "Total",      value: formatCurrency(totalAmount) },
        { label: "Total paid", value: formatCurrency(totalPaid) },
        { label: "Outstanding", value: formatCurrency(totalAmount - totalPaid) },
      ],
    };
  }, [rateCards, project]);

  const reportContent = React.useMemo(
    () => buildReportContent(selectedReport),
    [buildReportContent, selectedReport],
  );

  const downloadReport = async (reportId: string, fmt: "csv" | "pdf") => {
    const content = buildReportContent(reportId);
    const filename = `${content.filename}.${fmt}`;
    if (fmt === "csv") {
      downloadCSV(filename, content.table.headers, content.table.rows);
    } else {
      const bytes = await buildSimpleReportPdf({
        title: content.title,
        subtitle: "Financial Report",
        meta: { Scope: scope, "Date Range": dateRange, Project: project },
        summary: content.summary,
        table: content.table,
        footerNote: content.table.rows.length === 0 ? "No data available for the selected scope." : undefined,
      });
      triggerDownload(new Blob([bytes as BlobPart], { type: "application/pdf" }), filename);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const bytes = await buildSimpleReportPdf({
        title: reportContent.title,
        subtitle: "Financial Report",
        meta: { Scope: scope, "Date Range": dateRange, Project: project },
        summary: reportContent.summary,
        table: reportContent.table,
        footerNote: reportContent.table.rows.length === 0 ? "No data available for the selected scope." : undefined,
      });
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
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

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const filename = `${reportContent.filename}.${format}`;
      if (format === "csv") {
        downloadCSV(filename, reportContent.table.headers, reportContent.table.rows);
      } else {
        const bytes = await buildSimpleReportPdf({
          title: reportContent.title,
          subtitle: "Financial Report",
          meta: { Scope: scope, "Date Range": dateRange, Project: project },
          summary: reportContent.summary,
          table: reportContent.table,
          footerNote: reportContent.table.rows.length === 0 ? "No data available for the selected scope." : undefined,
        });
        triggerDownload(new Blob([bytes as BlobPart], { type: "application/pdf" }), filename);
      }
      toast.success(
        "Report Downloaded",
        `${selectedReportData?.title} saved as ${filename} (${reportContent.table.rows.length} row${reportContent.table.rows.length === 1 ? "" : "s"}).`
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
                  onClick={async () => {
                    const reportId = exp.type.toLowerCase().replace(/\s+/g, "-");
                    const fmt = (exp.format.toLowerCase() === "pdf" ? "pdf" : "csv") as "csv" | "pdf";
                    try {
                      await downloadReport(reportId, fmt);
                      toast.success("Re-downloading", exp.name);
                    } catch {
                      toast.error("Download Failed", "Could not generate the report. Please try again.");
                    }
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
                    try {
                      await downloadReport(selectedReport, "pdf");
                    } catch {
                      toast.error("Download Failed", "Could not generate the report. Please try again.");
                    } finally {
                      closePreview();
                    }
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
