"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Plus,
  Copy,
  Pencil,
  Eye,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Star,
  Target,
  Save,
  GripVertical,
  Trash2,
  Scale,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Badge, Button, Input, Progress } from "@/components/ui";

/* ── Mock review rubric templates ── */
const mockRubrics = [
  {
    id: "rub-001",
    name: "Code Review Standard",
    description: "Standard rubric for evaluating code deliverables — correctness, style, tests, documentation",
    applicableTypes: ["Backend", "Frontend", "Full-Stack"],
    criteriaCount: 5,
    usageCount: 34,
    status: "active" as const,
    updatedAt: "2026-02-10T10:00:00Z",
    criteria: [
      { name: "Correctness", weight: 30, scale: "1-5", guidance: "Does the code produce correct output for all specified inputs?" },
      { name: "Code Quality", weight: 25, scale: "1-5", guidance: "Clean code, proper naming, no code smells" },
      { name: "Test Coverage", weight: 20, scale: "1-5", guidance: "Unit tests, integration tests, edge cases covered" },
      { name: "Documentation", weight: 15, scale: "1-5", guidance: "Inline comments, API docs, README updates" },
      { name: "Performance", weight: 10, scale: "1-5", guidance: "Response times, memory usage, query optimization" },
    ],
  },
  {
    id: "rub-002",
    name: "Design Deliverable",
    description: "Rubric for UI/UX design deliverables — usability, accessibility, brand alignment",
    applicableTypes: ["Design", "UX", "Figma"],
    criteriaCount: 4,
    usageCount: 12,
    status: "active" as const,
    updatedAt: "2026-02-18T14:30:00Z",
    criteria: [
      { name: "Usability", weight: 35, scale: "1-5", guidance: "Intuitive navigation, clear hierarchy, minimal clicks" },
      { name: "Accessibility", weight: 25, scale: "Pass-Fail", guidance: "WCAG 2.1 AA compliance, color contrast, screen reader support" },
      { name: "Brand Alignment", weight: 20, scale: "1-5", guidance: "Consistent with brand guidelines, color palette, typography" },
      { name: "Responsiveness", weight: 20, scale: "1-5", guidance: "Works on mobile, tablet, desktop breakpoints" },
    ],
  },
  {
    id: "rub-003",
    name: "Data Pipeline Review",
    description: "Rubric for data engineering deliverables — accuracy, performance, monitoring",
    applicableTypes: ["Data", "ETL", "Analytics"],
    criteriaCount: 4,
    usageCount: 8,
    status: "active" as const,
    updatedAt: "2026-03-01T09:00:00Z",
    criteria: [
      { name: "Data Accuracy", weight: 35, scale: "1-5", guidance: "Output data matches expected results, no data loss" },
      { name: "Pipeline Performance", weight: 25, scale: "1-5", guidance: "Execution time, resource usage, scalability" },
      { name: "Error Handling", weight: 25, scale: "1-5", guidance: "Graceful failures, retry logic, alerting" },
      { name: "Monitoring", weight: 15, scale: "1-5", guidance: "Logging, metrics, dashboard setup" },
    ],
  },
  {
    id: "rub-004",
    name: "DevOps Infrastructure",
    description: "Rubric for infrastructure and DevOps deliverables",
    applicableTypes: ["DevOps", "AWS", "Terraform"],
    criteriaCount: 5,
    usageCount: 0,
    status: "draft" as const,
    updatedAt: "2026-03-04T16:00:00Z",
    criteria: [
      { name: "Security", weight: 30, scale: "1-5", guidance: "IAM policies, encryption, network isolation" },
      { name: "Reliability", weight: 25, scale: "1-5", guidance: "High availability, disaster recovery, failover" },
      { name: "Automation", weight: 20, scale: "1-5", guidance: "IaC coverage, CI/CD integration, auto-scaling" },
      { name: "Cost Efficiency", weight: 15, scale: "1-5", guidance: "Right-sizing, reserved instances, waste elimination" },
      { name: "Observability", weight: 10, scale: "1-5", guidance: "Monitoring, logging, alerting, dashboards" },
    ],
  },
];

/* ── Weight bar colors ── */
const weightColors = ["bg-brown-400", "bg-teal-400", "bg-gold-400", "bg-forest-400", "bg-brown-300"];

/* ── Rubric Card ── */
function RubricCard({
  rubric,
}: {
  rubric: (typeof mockRubrics)[0];
}) {
  const [expanded, setExpanded] = React.useState(false);
  const updatedDate = new Date(rubric.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      variants={scaleIn}
      className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden hover:shadow-xl hover:shadow-brown-100/15 transition-all duration-300"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-forest-50 flex items-center justify-center group-hover:from-teal-100 group-hover:to-forest-100 transition-colors">
              <ClipboardCheck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-brown-900">
                {rubric.name}
              </h3>
              <p className="text-[11px] text-beige-500 mt-0.5">
                {rubric.description}
              </p>
            </div>
          </div>
          <Badge
            variant={rubric.status === "active" ? "forest" : "beige"}
            size="sm"
            dot
          >
            {rubric.status === "active" ? "Active" : "Draft"}
          </Badge>
        </div>

        {/* Applicable types */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {rubric.applicableTypes.map((type) => (
            <span
              key={type}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-beige-100 text-beige-600"
            >
              {type}
            </span>
          ))}
        </div>

        {/* Weight distribution bar */}
        <div className="mb-3">
          <p className="text-[10px] text-beige-500 font-medium mb-1.5">
            Criteria Weight Distribution
          </p>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
            {rubric.criteria.map((c, i) => (
              <div
                key={c.name}
                className={cn("rounded-full", weightColors[i % weightColors.length])}
                style={{ width: `${c.weight}%` }}
                title={`${c.name}: ${c.weight}%`}
              />
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 pt-3 border-t border-beige-100">
          <div>
            <p className="text-[16px] font-bold text-brown-800">
              {rubric.criteriaCount}
            </p>
            <p className="text-[10px] text-beige-500">Criteria</p>
          </div>
          <div>
            <p className="text-[16px] font-bold text-teal-700">
              {rubric.usageCount}
            </p>
            <p className="text-[10px] text-beige-500">Reviews</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-beige-500">Updated</p>
            <p className="text-[11px] text-brown-700 font-medium">
              {updatedDate}
            </p>
          </div>
        </div>
      </div>

      {/* Expandable criteria detail */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-beige-50/50 border-t border-beige-100 text-[11px] font-medium text-beige-600 hover:text-brown-700 hover:bg-beige-100/50 transition-colors"
      >
        {expanded ? "Hide" : "View"} Criteria Details
      </button>

      {expanded && (
        <div className="border-t border-beige-100 p-4 space-y-2.5 bg-beige-50/30">
          {rubric.criteria.map((criterion, i) => (
            <div
              key={criterion.name}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/80 border border-beige-200/40"
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white text-[10px] font-bold",
                  weightColors[i % weightColors.length]
                )}
              >
                {criterion.weight}%
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-brown-900">
                    {criterion.name}
                  </p>
                  <Badge variant="beige" size="sm">
                    {criterion.scale}
                  </Badge>
                </div>
                <p className="text-[10px] text-beige-500 mt-0.5 leading-relaxed">
                  {criterion.guidance}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 p-4 pt-2 border-t border-beige-100">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-beige-600 hover:text-brown-700 hover:bg-beige-50 transition-colors">
          <Eye className="w-3 h-3" />
          Preview
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-beige-600 hover:text-brown-700 hover:bg-beige-50 transition-colors">
          <Pencil className="w-3 h-3" />
          Edit
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-beige-600 hover:text-brown-700 hover:bg-beige-50 transition-colors">
          <Copy className="w-3 h-3" />
          Clone
        </button>
        {rubric.status === "active" ? (
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-beige-600 hover:text-gold-700 hover:bg-gold-50 transition-colors ml-auto">
            <ToggleRight className="w-3.5 h-3.5" />
            Deactivate
          </button>
        ) : (
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-forest-600 hover:text-forest-700 hover:bg-forest-50 transition-colors ml-auto">
            <ToggleLeft className="w-3.5 h-3.5" />
            Activate
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   REVIEW RUBRIC CONFIGURATION PAGE (H7)
   ══════════════════════════════════════════ */
export default function ReviewRubricsPage() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Page header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <Link
            href="/enterprise/admin/config"
            className="inline-flex items-center gap-1.5 text-[12px] text-beige-500 hover:text-brown-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Admin & Configuration
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-forest-500 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
              Review Rubrics
            </h1>
          </div>
          <p className="text-[13px] text-beige-500 mt-1">
            Configure review rubric templates for evaluating deliverables. Each rubric
            defines criteria, weights, and scoring scales used by mentors and reviewers.
          </p>
        </div>
        <Button variant="gradient-primary" size="sm">
          <Plus className="w-3.5 h-3.5" />
          Create Rubric
        </Button>
      </motion.div>

      {/* Summary stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Active Rubrics",
            value: mockRubrics.filter((r) => r.status === "active").length,
            icon: Award,
            accent: "bg-forest-100 text-forest-600",
          },
          {
            label: "Total Reviews",
            value: mockRubrics.reduce((s, r) => s + r.usageCount, 0),
            icon: ClipboardCheck,
            accent: "bg-teal-100 text-teal-600",
          },
          {
            label: "Avg Criteria",
            value: Math.round(mockRubrics.reduce((s, r) => s + r.criteriaCount, 0) / mockRubrics.length),
            icon: Target,
            accent: "bg-gold-100 text-gold-700",
          },
          {
            label: "Draft Rubrics",
            value: mockRubrics.filter((r) => r.status === "draft").length,
            icon: Scale,
            accent: "bg-brown-100 text-brown-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.accent)}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[20px] font-bold text-brown-900 tracking-tight leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] text-beige-500 font-medium mt-1">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Rubric cards */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {mockRubrics.map((rubric) => (
          <RubricCard key={rubric.id} rubric={rubric} />
        ))}
      </motion.div>
    </motion.div>
  );
}
