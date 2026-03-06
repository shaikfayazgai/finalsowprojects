"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Copy,
  Pencil,
  Eye,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Calendar,
  Hash,
  Type,
  List,
  Upload,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Badge, Button, Input } from "@/components/ui";

/* ── Mock SOW intake form templates ── */
const mockTemplates = [
  {
    id: "tpl-001",
    name: "Standard SOW Template",
    description: "Default template with all standard fields for IT project SOWs",
    fieldCount: 14,
    usageCount: 12,
    status: "active" as const,
    isDefault: true,
    updatedAt: "2026-02-15T10:00:00Z",
  },
  {
    id: "tpl-002",
    name: "Quick Brief Template",
    description: "Simplified template for small projects under $50K",
    fieldCount: 8,
    usageCount: 5,
    status: "active" as const,
    isDefault: false,
    updatedAt: "2026-02-20T14:30:00Z",
  },
  {
    id: "tpl-003",
    name: "Enterprise RFP Template",
    description: "Comprehensive template for large-scale enterprise RFP responses",
    fieldCount: 22,
    usageCount: 3,
    status: "active" as const,
    isDefault: false,
    updatedAt: "2026-03-01T09:15:00Z",
  },
  {
    id: "tpl-004",
    name: "Maintenance & Support",
    description: "Template for ongoing maintenance and support contracts",
    fieldCount: 10,
    usageCount: 0,
    status: "draft" as const,
    isDefault: false,
    updatedAt: "2026-03-04T11:00:00Z",
  },
];

/* ── Field type icons ── */
const fieldTypeIcons: Record<string, React.ElementType> = {
  text: Type,
  date: Calendar,
  number: Hash,
  dropdown: List,
  file: Upload,
};

/* ── Template fields (for the detail/editor preview) ── */
const standardFields = [
  { id: "f-01", label: "Project Title", type: "text", required: true },
  { id: "f-02", label: "Client Name", type: "text", required: true },
  { id: "f-03", label: "Start Date", type: "date", required: true },
  { id: "f-04", label: "End Date", type: "date", required: true },
  { id: "f-05", label: "Stakeholders", type: "text", required: true },
  { id: "f-06", label: "Confidentiality Level", type: "dropdown", required: true },
  { id: "f-07", label: "Deliverables", type: "text", required: true },
  { id: "f-08", label: "Dependencies", type: "text", required: false },
  { id: "f-09", label: "Assumptions", type: "text", required: false },
  { id: "f-10", label: "Constraints", type: "text", required: false },
  { id: "f-11", label: "Budget / Commercial Terms", type: "number", required: true },
  { id: "f-12", label: "Supporting Documents", type: "file", required: false },
  { id: "f-13", label: "Additional Notes", type: "text", required: false },
  { id: "f-14", label: "Priority Level", type: "dropdown", required: false },
];

/* ── Template Card ── */
function TemplateCard({
  template,
}: {
  template: (typeof mockTemplates)[0];
}) {
  const updatedDate = new Date(template.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      variants={scaleIn}
      className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-xl hover:shadow-brown-100/15 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-50 to-beige-100 flex items-center justify-center group-hover:from-brown-100 group-hover:to-beige-200 transition-colors">
            <FileText className="w-5 h-5 text-brown-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-bold text-brown-900">
                {template.name}
              </h3>
              {template.isDefault && (
                <Badge variant="brown" size="sm">Default</Badge>
              )}
            </div>
            <p className="text-[11px] text-beige-500 mt-0.5">
              {template.description}
            </p>
          </div>
        </div>
        <Badge
          variant={template.status === "active" ? "forest" : "beige"}
          size="sm"
          dot
        >
          {template.status === "active" ? "Active" : "Draft"}
        </Badge>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 mt-4 pt-3 border-t border-beige-100">
        <div>
          <p className="text-[16px] font-bold text-brown-800">
            {template.fieldCount}
          </p>
          <p className="text-[10px] text-beige-500">Fields</p>
        </div>
        <div>
          <p className="text-[16px] font-bold text-teal-700">
            {template.usageCount}
          </p>
          <p className="text-[10px] text-beige-500">SOWs Created</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] text-beige-500">Updated</p>
          <p className="text-[11px] text-brown-700 font-medium">
            {updatedDate}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-beige-100">
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
        {template.status === "active" ? (
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
   SOW INTAKE FORM CONFIGURATION PAGE (H6)
   ══════════════════════════════════════════ */
export default function SowIntakeFormsPage() {
  const [showEditor, setShowEditor] = React.useState(false);

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brown-500 to-brown-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
              SOW Intake Forms
            </h1>
          </div>
          <p className="text-[13px] text-beige-500 mt-1">
            Configure intake form templates for SOW creation. Each template defines
            the fields available when users create SOWs via the structured form.
          </p>
        </div>
        <Button
          variant="gradient-primary"
          size="sm"
          onClick={() => setShowEditor(!showEditor)}
        >
          <Plus className="w-3.5 h-3.5" />
          Create Template
        </Button>
      </motion.div>

      {/* Summary stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Active Templates", value: mockTemplates.filter((t) => t.status === "active").length, accent: "bg-forest-100 text-forest-600" },
          { label: "Total SOWs Created", value: mockTemplates.reduce((s, t) => s + t.usageCount, 0), accent: "bg-teal-100 text-teal-600" },
          { label: "Draft Templates", value: mockTemplates.filter((t) => t.status === "draft").length, accent: "bg-gold-100 text-gold-700" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
          >
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", stat.accent)}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-brown-900 tracking-tight leading-none">
                {stat.value}
              </p>
              <p className="text-[11px] text-beige-500 font-medium mt-1">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Editor preview (toggleable) */}
      {showEditor && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-2xl border-2 border-dashed border-brown-200 bg-gradient-to-br from-brown-50/40 to-white/80 p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-brown-900">
              New Template Editor
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowEditor(false)}>
                Cancel
              </Button>
              <Button variant="gradient-primary" size="sm">
                <Save className="w-3.5 h-3.5" />
                Save Template
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-brown-700 uppercase tracking-wider mb-1.5 block">
                Template Name
              </label>
              <Input placeholder="e.g., Standard SOW Template" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-brown-700 uppercase tracking-wider mb-1.5 block">
                Description
              </label>
              <Input placeholder="Brief description of this template..." />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-brown-700 uppercase tracking-wider mb-2">
              Form Fields
            </p>
            <div className="space-y-2">
              {standardFields.slice(0, 6).map((field) => {
                const FieldIcon = fieldTypeIcons[field.type] || Type;
                return (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-beige-200/60 bg-white/80"
                  >
                    <GripVertical className="w-3.5 h-3.5 text-beige-300 cursor-grab" />
                    <FieldIcon className="w-3.5 h-3.5 text-beige-500" />
                    <span className="text-[12px] font-medium text-brown-800 flex-1">
                      {field.label}
                    </span>
                    <Badge
                      variant={field.required ? "brown" : "beige"}
                      size="sm"
                    >
                      {field.required ? "Required" : "Optional"}
                    </Badge>
                    <span className="text-[10px] text-beige-500 capitalize">
                      {field.type}
                    </span>
                    <button className="p-1 text-beige-400 hover:text-brown-600 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
              <button className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl border border-dashed border-beige-300 text-beige-500 hover:border-brown-400 hover:text-brown-600 transition-all text-[12px] font-medium">
                <Plus className="w-3.5 h-3.5" />
                Add Field
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Template cards */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {mockTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </motion.div>
    </motion.div>
  );
}
