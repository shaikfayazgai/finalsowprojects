"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  TrendingUp,
  Shield,
  DollarSign,
  Users,
  Calendar,
  ListChecks,
  Layers,
  ChevronRight,
  Download,
  Eye,
  Clock,
  BarChart3,
  LineChart,
  Table2,
  Share2,
  Star,
  Bookmark,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Badge, Button, Input, Checkbox } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";

/* ══════════════════════════════════════════
   I4 — Self-service Analytics
   Report builder with save/share, drill-down
   ══════════════════════════════════════════ */

/* ── Metric categories ── */
const metricCategories: Record<string, { label: string; icon: React.ReactNode; gradient: string; metrics: string[] }> = {
  delivery: {
    label: "Delivery Metrics",
    icon: <TrendingUp className="w-4 h-4" />,
    gradient: "from-forest-400 to-forest-600",
    metrics: ["On-Time Delivery", "Avg Cycle Time", "First-Pass Acceptance", "Rework Rate", "Tasks Completed", "Active Projects"],
  },
  quality: {
    label: "Quality Metrics",
    icon: <Shield className="w-4 h-4" />,
    gradient: "from-teal-400 to-teal-600",
    metrics: ["Acceptance Rate", "Defect Density", "Test Coverage", "Review Scores", "Rework Cycles"],
  },
  team: {
    label: "Team Metrics",
    icon: <Users className="w-4 h-4" />,
    gradient: "from-brown-400 to-brown-600",
    metrics: ["Active Contributors", "Utilization Rate", "Skill Match Score", "Avg Completion Time", "Track Distribution"],
  },
  financial: {
    label: "Financial Metrics",
    icon: <DollarSign className="w-4 h-4" />,
    gradient: "from-gold-400 to-gold-600",
    metrics: ["Total Spend", "Cost per Task", "Budget Utilization", "ROI Index", "Escrow Balance", "Payment Timeline"],
  },
};

const groupByOptions = [
  { id: "project", label: "By Project" },
  { id: "team", label: "By Team" },
  { id: "skill", label: "By Skill" },
  { id: "time", label: "By Time Period" },
];

const vizTypes = [
  { id: "table", label: "Table", icon: Table2 },
  { id: "bar", label: "Bar Chart", icon: BarChart3 },
  { id: "line", label: "Line Chart", icon: LineChart },
];

/* ── Saved reports mock ── */
const savedReports = [
  { id: "sr-001", name: "Q1 2026 Delivery Summary", category: "delivery", date: "2026-03-01", shared: true, starred: true },
  { id: "sr-002", name: "February Quality Analysis", category: "quality", date: "2026-02-28", shared: false, starred: false },
  { id: "sr-003", name: "Monthly Financial Report — Feb", category: "financial", date: "2026-02-28", shared: true, starred: true },
  { id: "sr-004", name: "Team Performance — Sprint 14", category: "team", date: "2026-02-20", shared: false, starred: false },
  { id: "sr-005", name: "Custom Executive Dashboard", category: "delivery", date: "2026-02-15", shared: true, starred: true },
  { id: "sr-006", name: "Cost Per Task Trend — Q4 2025", category: "financial", date: "2026-01-05", shared: false, starred: false },
];

const categoryBadge: Record<string, "forest" | "teal" | "brown" | "gold"> = {
  delivery: "forest",
  quality: "teal",
  team: "brown",
  financial: "gold",
};

/* ══════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════ */
export default function SelfServiceAnalyticsPage() {
  const [metricCategory, setMetricCategory] = React.useState("delivery");
  const [dateFrom, setDateFrom] = React.useState("2026-01-01");
  const [dateTo, setDateTo] = React.useState("2026-03-06");
  const [groupBy, setGroupBy] = React.useState("project");
  const [vizType, setVizType] = React.useState("table");
  const [selectedMetrics, setSelectedMetrics] = React.useState<string[]>([
    "On-Time Delivery",
    "Avg Cycle Time",
    "First-Pass Acceptance",
  ]);

  const toggleMetric = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  const currentCategory = metricCategories[metricCategory];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Back + header */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/analytics"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-teal-600 hover:text-teal-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Analytics
        </Link>
        <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
          Self-service Analytics
        </h1>
        <p className="text-[13px] text-beige-500 mt-1">
          Build custom reports with flexible metrics, drill-down grouping, and share with your team.
        </p>
      </motion.div>

      {/* ── Report Builder ── */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <FileText className="w-4 h-4 text-brown-500" />
          <h2 className="text-[14px] font-semibold text-brown-800">
            Report Builder
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Controls */}
          <div className="space-y-5">
            {/* Metric Selector */}
            <div>
              <label className="text-[11px] font-semibold text-brown-600 uppercase tracking-wider mb-2 block">
                Metric Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(metricCategories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setMetricCategory(key);
                      setSelectedMetrics(cat.metrics.slice(0, 3));
                    }}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                      metricCategory === key
                        ? "border-brown-400 bg-brown-50/60 shadow-sm"
                        : "border-beige-200/50 bg-white/40 hover:border-beige-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                        cat.gradient
                      )}
                    >
                      {cat.icon}
                    </div>
                    <span className="text-[11px] font-medium text-brown-700">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-[11px] font-semibold text-brown-600 uppercase tracking-wider mb-2 block">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-beige-500 mb-1 block">From</span>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-beige-500 mb-1 block">To</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {["Last 7 days", "Last 30 days", "This Quarter", "This Year"].map(
                  (preset) => (
                    <button
                      key={preset}
                      className="text-[10px] font-medium text-teal-600 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors"
                    >
                      {preset}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Group By */}
            <div>
              <label className="text-[11px] font-semibold text-brown-600 uppercase tracking-wider mb-2 block">
                Group By
              </label>
              <div className="flex flex-wrap gap-2">
                {groupByOptions.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGroupBy(g.id)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-[11px] font-medium border transition-all",
                      groupBy === g.id
                        ? "border-brown-400 bg-brown-500 text-white shadow-sm"
                        : "border-beige-200 bg-white/60 text-brown-600 hover:border-beige-300"
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visualization Type */}
            <div>
              <label className="text-[11px] font-semibold text-brown-600 uppercase tracking-wider mb-2 block">
                Visualization
              </label>
              <div className="flex items-center gap-2">
                {vizTypes.map((vt) => {
                  const Icon = vt.icon;
                  return (
                    <button
                      key={vt.id}
                      onClick={() => setVizType(vt.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-medium border transition-all",
                        vizType === vt.id
                          ? "border-teal-400 bg-teal-50 text-teal-700 shadow-sm"
                          : "border-beige-200 bg-white/60 text-brown-600 hover:border-beige-300"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {vt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Metrics Selection */}
          <div>
            <label className="text-[11px] font-semibold text-brown-600 uppercase tracking-wider mb-2 block">
              Select Metrics ({selectedMetrics.length} selected)
            </label>
            <div className="space-y-2 mb-5">
              {currentCategory.metrics.map((metric) => (
                <label
                  key={metric}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    selectedMetrics.includes(metric)
                      ? "border-brown-300 bg-brown-50/40"
                      : "border-beige-200/50 bg-white/40 hover:border-beige-300"
                  )}
                >
                  <Checkbox
                    checked={selectedMetrics.includes(metric)}
                    onCheckedChange={() => toggleMetric(metric)}
                  />
                  <span className="text-[12px] font-medium text-brown-700">
                    {metric}
                  </span>
                </label>
              ))}
            </div>

            {/* Preview card */}
            <div className="rounded-xl border border-beige-200/50 bg-beige-50/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-3.5 h-3.5 text-beige-400" />
                <span className="text-[11px] font-semibold text-brown-700">
                  Report Preview
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] text-brown-600">
                <p>
                  <span className="font-semibold text-brown-800">Category:</span>{" "}
                  {currentCategory.label}
                </p>
                <p>
                  <span className="font-semibold text-brown-800">Date Range:</span>{" "}
                  {dateFrom} to {dateTo}
                </p>
                <p>
                  <span className="font-semibold text-brown-800">Metrics ({selectedMetrics.length}):</span>{" "}
                  {selectedMetrics.join(", ")}
                </p>
                <p>
                  <span className="font-semibold text-brown-800">Grouped:</span>{" "}
                  {groupByOptions.find((g) => g.id === groupBy)?.label}
                </p>
                <p>
                  <span className="font-semibold text-brown-800">Visualization:</span>{" "}
                  {vizTypes.find((v) => v.id === vizType)?.label}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-beige-100">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Bookmark className="w-3.5 h-3.5" />
              Save Report
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </Button>
            <Button variant="primary" size="md">
              <FileText className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Saved Reports ── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-brown-800">
            Saved Reports
          </h2>
          <span className="text-[11px] text-beige-500">
            {savedReports.length} reports
          </span>
        </div>

        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-beige-100 text-[10px] font-semibold text-beige-500 uppercase tracking-wider">
            <div className="col-span-1" />
            <div className="col-span-4">Report Name</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Date Generated</div>
            <div className="col-span-1 text-center">Shared</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Rows */}
          {savedReports.map((report) => (
            <div
              key={report.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3 border-b border-beige-50 last:border-0 hover:bg-beige-50/40 transition-colors items-center"
            >
              {/* Star */}
              <div className="col-span-1 hidden md:flex items-center">
                <Star
                  className={cn(
                    "w-3.5 h-3.5",
                    report.starred
                      ? "fill-gold-400 text-gold-400"
                      : "text-beige-300"
                  )}
                />
              </div>

              {/* Name */}
              <div className="col-span-4 flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-beige-400 shrink-0" />
                <span className="text-[12px] font-medium text-brown-700 truncate">
                  {report.name}
                </span>
              </div>

              {/* Category */}
              <div className="col-span-2">
                <Badge variant={categoryBadge[report.category]} size="sm">
                  {report.category}
                </Badge>
              </div>

              {/* Date */}
              <div className="col-span-2 hidden md:flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-beige-400" />
                <span className="text-[11px] text-beige-500">{report.date}</span>
              </div>

              {/* Shared */}
              <div className="col-span-1 hidden md:flex items-center justify-center">
                {report.shared ? (
                  <Share2 className="w-3.5 h-3.5 text-teal-500" />
                ) : (
                  <span className="text-[10px] text-beige-300">--</span>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 hover:text-teal-700 transition-colors">
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button className="inline-flex items-center gap-1 text-[11px] font-medium text-brown-500 hover:text-brown-700 transition-colors">
                  <Download className="w-3 h-3" />
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
