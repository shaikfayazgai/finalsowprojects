"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  FileUp,
  FileText,
  Sparkles,
  CheckCircle2,
  Calendar,
  Users,
  DollarSign,
  Plus,
  X,
  Shield,
  ClipboardList,
  ListChecks,
  AlertTriangle,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import {
  Badge,
  Button,
  Input,
  Textarea,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";
import { StatusTimeline } from "@/components/enterprise/status-timeline";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { mockSOWs } from "@/mocks/data/enterprise-sow";

const recentUploads = mockSOWs.slice(0, 2);

export default function SOWUploadPage() {
  const [isDragging, setIsDragging] = React.useState(false);

  // Structured form state
  const [formTitle, setFormTitle] = React.useState("");
  const [formClient, setFormClient] = React.useState("");
  const [formStartDate, setFormStartDate] = React.useState("");
  const [formEndDate, setFormEndDate] = React.useState("");
  const [formConfidentiality, setFormConfidentiality] = React.useState("internal");
  const [formBudget, setFormBudget] = React.useState("");
  const [formNotes, setFormNotes] = React.useState("");

  // Dynamic lists
  const [stakeholders, setStakeholders] = React.useState<string[]>([""]);
  const [deliverables, setDeliverables] = React.useState<string[]>([""]);
  const [dependencies, setDependencies] = React.useState<string[]>([""]);
  const [assumptions, setAssumptions] = React.useState<string[]>([""]);
  const [constraints, setConstraints] = React.useState<string[]>([""]);

  const addItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => [...prev, ""]);
  };

  const removeItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    idx: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    idx: number,
    value: string
  ) => {
    setter((prev) => prev.map((item, i) => (i === idx ? value : item)));
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Back Link */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/sow"
          className="inline-flex items-center gap-2 text-sm text-beige-600 hover:text-brown-700 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to SOW Repository
        </Link>
      </motion.div>

      {/* Page Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-brown-900 tracking-tight font-heading">
          Upload Statement of Work
        </h1>
        <p className="text-sm text-beige-600 mt-1">
          Upload your SOW document or fill in the structured form. Our AI will
          parse and extract key sections for project decomposition.
        </p>
      </motion.div>

      {/* Main Content — Tabs */}
      <motion.div variants={fadeUp}>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="upload" className="gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Upload Document
            </TabsTrigger>
            <TabsTrigger value="structured" className="gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              Structured Form
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB: Upload Document ===== */}
          <TabsContent value="upload">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* LEFT: Upload Area */}
              <div className="lg:col-span-3 space-y-5">
                {/* Drag & Drop Zone */}
                <div
                  className={cn(
                    "relative rounded-2xl border-2 border-dashed transition-all duration-300 p-10",
                    isDragging
                      ? "border-brown-500 bg-brown-50/50 shadow-lg shadow-brown-100/30"
                      : "border-brown-200 bg-beige-50/60 hover:border-brown-300 hover:bg-beige-100/40"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Animated icon cluster */}
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brown-100 to-beige-100 flex items-center justify-center">
                        <FileUp className="w-9 h-9 text-brown-500" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shadow-md">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-brown-900 mb-1">
                      Drag & drop your SOW document
                    </h3>
                    <p className="text-sm text-beige-500 mb-4 max-w-sm">
                      or click to browse your files
                    </p>

                    <Button variant="outline" size="md" className="mb-4">
                      <Upload className="w-4 h-4" />
                      Browse Files
                    </Button>

                    <div className="flex items-center gap-4 text-[11px] text-beige-400">
                      <span>Supported: PDF, DOCX, DOC</span>
                      <span className="w-1 h-1 rounded-full bg-beige-300" />
                      <span>Max size: 50MB</span>
                    </div>
                  </div>

                  {/* Subtle corner decorations */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-brown-200/60 rounded-tl-md" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-brown-200/60 rounded-tr-md" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-brown-200/60 rounded-bl-md" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-brown-200/60 rounded-br-md" />
                </div>

                {/* Upload & Parse CTA */}
                <Button
                  variant="gradient-primary"
                  size="lg"
                  className="w-full"
                  disabled
                >
                  <Upload className="w-4 h-4" />
                  Upload & Parse
                </Button>

                {/* Recent Uploads */}
                <div>
                  <h3 className="text-sm font-semibold text-brown-800 mb-3">
                    Recent Uploads
                  </h3>
                  <div className="space-y-2.5">
                    {recentUploads.map((sow) => (
                      <Link
                        key={sow.id}
                        href={`/enterprise/sow/${sow.id}`}
                        className="block group"
                      >
                        <div className="flex items-center gap-3 rounded-xl border border-beige-200/50 bg-white/60 backdrop-blur-sm p-3.5 hover:shadow-md hover:border-beige-300 transition-all">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brown-100 to-beige-100 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-brown-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-brown-800 truncate group-hover:text-brown-600 transition-colors">
                              {sow.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-beige-500">
                                {sow.client}
                              </span>
                              <span className="text-beige-300">|</span>
                              <span className="text-[11px] text-beige-500">
                                {sow.fileSize}
                              </span>
                            </div>
                          </div>
                          <MetricRing
                            value={sow.aiConfidence}
                            size={40}
                            strokeWidth={3}
                            color={sow.aiConfidence >= 90 ? "forest" : "teal"}
                            className="shrink-0"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: What Happens Next */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6 sticky top-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-brown-900">
                      What happens next?
                    </h3>
                  </div>

                  <StatusTimeline
                    steps={[
                      {
                        label: "Upload Document",
                        description:
                          "Drop your SOW file -- PDF or DOCX supported",
                        status: "current",
                      },
                      {
                        label: "AI Parsing",
                        description:
                          "Our AI engine reads and interprets every clause",
                        status: "upcoming",
                      },
                      {
                        label: "Section Extraction",
                        description:
                          "Scope, budget, timeline, risks -- all auto-structured",
                        status: "upcoming",
                      },
                      {
                        label: "Review & Edit",
                        description:
                          "Verify AI interpretations, accept or modify suggestions",
                        status: "upcoming",
                      },
                      {
                        label: "Approve & Decompose",
                        description:
                          "Lock the SOW and generate your project blueprint",
                        status: "upcoming",
                      },
                    ]}
                  />

                  {/* AI Features Callout */}
                  <div className="mt-6 rounded-xl bg-gradient-to-br from-teal-50 to-beige-50 border border-teal-100/60 p-4">
                    <h4 className="text-[12px] font-bold text-teal-800 uppercase tracking-wider mb-2">
                      AI-Powered Features
                    </h4>
                    <ul className="space-y-2">
                      {[
                        "Smart section detection with 94%+ accuracy",
                        "Automated risk & ambiguity flagging",
                        "Budget estimation from scope analysis",
                        "Timeline feasibility assessment",
                      ].map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                          <span className="text-[12px] text-teal-700">
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB: Structured Form ===== */}
          <TabsContent value="structured">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT: Form (2/3) */}
              <div className="lg:col-span-2 space-y-5">
                {/* Basic Info */}
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
                  <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-4">
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[12px] font-semibold text-brown-800 mb-1.5 block">
                        SOW Title *
                      </Label>
                      <Input
                        placeholder="e.g., Enterprise Resource Planning Platform"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-[12px] font-semibold text-brown-800 mb-1.5 block">
                        Client Name *
                      </Label>
                      <Input
                        placeholder="e.g., TechVista Solutions"
                        value={formClient}
                        onChange={(e) => setFormClient(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[12px] font-semibold text-brown-800 mb-1.5 block">
                          Start Date
                        </Label>
                        <Input
                          type="date"
                          value={formStartDate}
                          onChange={(e) => setFormStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-[12px] font-semibold text-brown-800 mb-1.5 block">
                          End Date
                        </Label>
                        <Input
                          type="date"
                          value={formEndDate}
                          onChange={(e) => setFormEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[12px] font-semibold text-brown-800 mb-1.5 block">
                          Confidentiality Level
                        </Label>
                        <Select
                          value={formConfidentiality}
                          onValueChange={setFormConfidentiality}
                        >
                          <SelectTrigger>
                            <Shield className="w-3.5 h-3.5 mr-1.5 text-beige-400" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="internal">Internal</SelectItem>
                            <SelectItem value="confidential">Confidential</SelectItem>
                            <SelectItem value="restricted">Restricted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[12px] font-semibold text-brown-800 mb-1.5 block">
                          Budget (USD)
                        </Label>
                        <Input
                          type="number"
                          placeholder="e.g., 250000"
                          icon={<DollarSign className="w-4 h-4" />}
                          value={formBudget}
                          onChange={(e) => setFormBudget(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stakeholders */}
                <DynamicListSection
                  title="Stakeholders"
                  icon={<Users className="w-4 h-4 text-brown-500" />}
                  items={stakeholders}
                  placeholder="Stakeholder name"
                  onAdd={() => addItem(setStakeholders)}
                  onRemove={(idx) => removeItem(setStakeholders, idx)}
                  onUpdate={(idx, val) => updateItem(setStakeholders, idx, val)}
                />

                {/* Deliverables */}
                <DynamicListSection
                  title="Deliverables"
                  icon={<ListChecks className="w-4 h-4 text-forest-500" />}
                  items={deliverables}
                  placeholder="Describe a deliverable"
                  onAdd={() => addItem(setDeliverables)}
                  onRemove={(idx) => removeItem(setDeliverables, idx)}
                  onUpdate={(idx, val) => updateItem(setDeliverables, idx, val)}
                />

                {/* Dependencies */}
                <DynamicListSection
                  title="Dependencies"
                  icon={<ClipboardList className="w-4 h-4 text-teal-500" />}
                  items={dependencies}
                  placeholder="Describe a dependency"
                  onAdd={() => addItem(setDependencies)}
                  onRemove={(idx) => removeItem(setDependencies, idx)}
                  onUpdate={(idx, val) => updateItem(setDependencies, idx, val)}
                />

                {/* Assumptions */}
                <DynamicListSection
                  title="Assumptions"
                  icon={<AlertTriangle className="w-4 h-4 text-gold-500" />}
                  items={assumptions}
                  placeholder="Describe an assumption"
                  onAdd={() => addItem(setAssumptions)}
                  onRemove={(idx) => removeItem(setAssumptions, idx)}
                  onUpdate={(idx, val) => updateItem(setAssumptions, idx, val)}
                />

                {/* Constraints */}
                <DynamicListSection
                  title="Constraints"
                  icon={<Shield className="w-4 h-4 text-brown-500" />}
                  items={constraints}
                  placeholder="Describe a constraint"
                  onAdd={() => addItem(setConstraints)}
                  onRemove={(idx) => removeItem(setConstraints, idx)}
                  onUpdate={(idx, val) => updateItem(setConstraints, idx, val)}
                />

                {/* Notes */}
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <StickyNote className="w-4 h-4 text-beige-500" />
                    <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider">
                      Additional Notes
                    </h3>
                  </div>
                  <Textarea
                    placeholder="Any additional context, notes, or special requirements..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                {/* Submit */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="gradient-primary"
                    size="lg"
                    className="flex-1"
                    disabled={!formTitle.trim() || !formClient.trim()}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Create SOW
                  </Button>
                  <Button variant="outline" size="lg">
                    Save as Draft
                  </Button>
                </div>
              </div>

              {/* RIGHT: Form Guide */}
              <div>
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6 sticky top-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brown-400 to-brown-500 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-brown-900">
                      Form Guide
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        title: "Title & Client",
                        description: "The SOW name and requesting organization.",
                        required: true,
                      },
                      {
                        title: "Dates & Budget",
                        description: "Project timeline and estimated total cost.",
                        required: false,
                      },
                      {
                        title: "Stakeholders",
                        description: "Key contacts involved in approval and delivery.",
                        required: false,
                      },
                      {
                        title: "Deliverables",
                        description: "What concrete outputs this SOW commits to.",
                        required: false,
                      },
                      {
                        title: "Dependencies & Assumptions",
                        description: "External factors and prerequisites.",
                        required: false,
                      },
                      {
                        title: "Constraints",
                        description: "Budget caps, regulatory limits, tech restrictions.",
                        required: false,
                      },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-beige-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-beige-400" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-brown-800">
                            {item.title}
                            {item.required && (
                              <span className="text-brown-500 ml-1">*</span>
                            )}
                          </p>
                          <p className="text-[11px] text-beige-500 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tip */}
                  <div className="mt-5 rounded-xl bg-gradient-to-br from-gold-50 to-beige-50 border border-gold-100/60 p-4">
                    <h4 className="text-[12px] font-bold text-gold-800 uppercase tracking-wider mb-1.5">
                      Pro Tip
                    </h4>
                    <p className="text-[12px] text-gold-700 leading-relaxed">
                      The more detailed your deliverables and dependencies, the
                      more accurate the AI decomposition will be.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   Dynamic List Section — reused for stakeholders, deliverables, etc.
   ──────────────────────────────────────────────────────────── */
function DynamicListSection({
  title,
  icon,
  items,
  placeholder,
  onAdd,
  onRemove,
  onUpdate,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  placeholder: string;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider">
            {title}
          </h3>
          <span className="text-[11px] text-beige-400">({items.length})</span>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-beige-100 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-beige-500">
                {idx + 1}
              </span>
            </div>
            <Input
              placeholder={placeholder}
              value={item}
              onChange={(e) => onUpdate(idx, e.target.value)}
              className="h-9 text-[13px]"
            />
            {items.length > 1 && (
              <button
                onClick={() => onRemove(idx)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-beige-400 hover:text-brown-600 hover:bg-beige-100 transition-all shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
