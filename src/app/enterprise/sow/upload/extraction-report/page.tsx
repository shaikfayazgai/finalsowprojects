"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  LayoutList,
  Brain,
  ShieldCheck,
  AlertCircle,
  Edit3,
  Save,
  X,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Button, Badge, Textarea, Input } from "@/components/ui";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

interface ExtractedSection {
  id: string;
  title: string;
  content: string;
  confidence: number;
  status: "complete" | "partial" | "missing" | "ambiguous";
  aiSuggestion?: string;
  gaps?: string[];
}

interface ExtractionData {
  documentName: string;
  uploadDate: string;
  overallConfidence: number;
  sections: ExtractedSection[];
}

/* ═══════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════ */

const MOCK_EXTRACTION: ExtractionData = {
  documentName: "MedFirst_Patient_Portal_SOW_2026.pdf",
  uploadDate: "2026-03-23T10:30:00Z",
  overallConfidence: 89,
  sections: [
    {
      id: "sec-1",
      title: "Project Overview",
      content: "MedFirst Health Systems requires a HIPAA-compliant patient portal enabling 2.4 million active patients to manage appointments, view medical records, communicate with providers, and process payments. Target launch is Q3 2026.",
      confidence: 94,
      status: "complete",
    },
    {
      id: "sec-2",
      title: "Scope & Deliverables",
      content: "Patient registration with KYC, appointment scheduling, secure messaging, medical records viewer, prescription refill requests, billing and payment processing via Stripe, telehealth video consultations via WebRTC.",
      confidence: 91,
      status: "complete",
    },
    {
      id: "sec-3",
      title: "Technical Architecture",
      content: "React frontend, Node.js/NestJS backend, PostgreSQL database, Redis caching, AWS infrastructure with EKS Kubernetes.",
      confidence: 87,
      status: "partial",
      aiSuggestion: "Specify frontend framework version (React 18+), add infrastructure details (CDN, monitoring, DR), and clarify DevOps toolchain.",
      gaps: ["Frontend version not specified", "Missing CDN/monitoring details", "DevOps toolchain unclear"],
    },
    {
      id: "sec-4",
      title: "Timeline & Milestones",
      content: "24-week delivery timeline with 4 phases. Phase 1: Infrastructure (Weeks 1-6). Phase 2: Core Features (Weeks 7-14). Phase 3: Advanced Features (Weeks 15-20). Phase 4: UAT & Launch (Weeks 21-24).",
      confidence: 92,
      status: "complete",
    },
    {
      id: "sec-5",
      title: "Budget",
      content: "Total budget approximately $1.2M across engineering, design, infrastructure, and security.",
      confidence: 76,
      status: "ambiguous",
      aiSuggestion: "Budget breakdown percentages should be clarified. Current allocation: Engineering (60%), Design (10%), Infrastructure (15%), Security (10%), PM (5%). Verify if this aligns with procurement policy.",
      gaps: ["Budget breakdown percentages inferred", "Contingency buffer not specified", "Payment milestones not defined"],
    },
    {
      id: "sec-6",
      title: "Team Structure",
      content: "18 team members: 1 PM, 1 Architect, 5 Frontend, 5 Backend, 2 DevOps, 2 QA, 1 Security, 2 UX.",
      confidence: 88,
      status: "partial",
      gaps: ["Seniority levels not specified for all roles", "Onboarding timeline not mentioned"],
    },
    {
      id: "sec-7",
      title: "Security & Compliance",
      content: "HIPAA compliance mandatory. AES-256 encryption. Multi-factor authentication. SOC 2 Type II targeted within 12 months.",
      confidence: 95,
      status: "complete",
    },
    {
      id: "sec-8",
      title: "Quality Standards",
      content: "99.95% uptime SLA. P95 page load under 2 seconds. WCAG 2.1 AA accessibility compliance.",
      confidence: 90,
      status: "complete",
    },
    {
      id: "sec-9",
      title: "Risk Management",
      content: "",
      confidence: 0,
      status: "missing",
      aiSuggestion: "Risk section appears to be missing from the document. Consider adding: third-party dependencies, timeline risks, budget contingency, and security breach protocols.",
      gaps: ["Risk section not found in document"],
    },
    {
      id: "sec-10",
      title: "Intellectual Property",
      content: "",
      confidence: 0,
      status: "missing",
      aiSuggestion: "IP ownership and licensing terms should be explicitly defined. Who owns the code? What open-source licenses are permitted?",
      gaps: ["IP ownership not specified", "Open-source policy undefined"],
    },
  ],
};

/* ═══════════════════════════════════════════════════════════
   COMPONENT: Section Navigator
   ═══════════════════════════════════════════════════════════ */

function SectionNavigator({
  sections,
  activeSection,
  onSelect,
  completedSections,
}: {
  sections: ExtractedSection[];
  activeSection: string;
  onSelect: (id: string) => void;
  completedSections: Set<string>;
}) {
  const getStatusIcon = (section: ExtractedSection) => {
    if (completedSections.has(section.id)) {
      return <CheckCircle2 className="w-4 h-4 text-[#4D5741]" />;
    }
    switch (section.status) {
      case "complete":
        return <CheckCircle2 className="w-4 h-4 text-[#4D5741]" />;
      case "partial":
        return <AlertTriangle className="w-4 h-4 text-[#D0B060]" />;
      case "ambiguous":
        return <AlertCircle className="w-4 h-4 text-[#A67763]" />;
      case "missing":
        return <div className="w-4 h-4 rounded-full border-2 border-[#E5DDD4]" />;
      default:
        return null;
    }
  };

  const getStatusColor = (section: ExtractedSection) => {
    if (completedSections.has(section.id)) {
      return "text-[#4D5741] bg-[#4D5741]/5";
    }
    switch (section.status) {
      case "complete":
        return "text-[#4D5741] bg-[#4D5741]/5";
      case "partial":
        return "text-[#7A6030] bg-[#D0B060]/10";
      case "ambiguous":
        return "text-[#A67763] bg-[#A67763]/10";
      case "missing":
        return "text-[#8B7355] bg-[#F5F1ED]";
      default:
        return "";
    }
  };

  return (
    <div className="w-64 border-r border-[#E5DDD4] bg-[#FAFAF8] flex flex-col h-full">
      <div className="p-4 border-b border-[#E5DDD4]">
        <h3 className="text-sm font-semibold text-[#3D3126]">Sections</h3>
        <p className="text-xs text-[#8B7355] mt-1">
          {completedSections.size} of {sections.length} reviewed
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sections.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => onSelect(section.id)}
            className={cn(
              "w-full flex items-start gap-2 p-2.5 rounded-lg text-left transition-all duration-200",
              activeSection === section.id
                ? "bg-white shadow-sm border border-[#E5DDD4]"
                : "hover:bg-white/50",
              getStatusColor(section)
            )}
          >
            <span className="text-[10px] font-mono mt-0.5 opacity-50">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{section.title}</p>
              {section.confidence > 0 && (
                <p className="text-[10px] opacity-70 mt-0.5">
                  {section.confidence}% confidence
                </p>
              )}
            </div>
            <div className="shrink-0 mt-0.5">{getStatusIcon(section)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT: Extraction Panel
   ═══════════════════════════════════════════════════════════ */

function ExtractionPanel({
  section,
  isCompleted,
  onToggleComplete,
  onEdit,
  isEditing,
  editContent,
  setEditContent,
  onSaveEdit,
  onCancelEdit,
}: {
  section: ExtractedSection;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onEdit: () => void;
  isEditing: boolean;
  editContent: string;
  setEditContent: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) {
  const getStatusBadge = () => {
    switch (section.status) {
      case "complete":
        return (
          <Badge variant="beige" className="bg-[#4D5741]/10 text-[#344028] border-[#4D5741]/20">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="beige" className="bg-[#D0B060]/10 text-[#7A6030] border-[#D0B060]/20">
            <AlertTriangle className="w-3 h-3 mr-1" /> Partial
          </Badge>
        );
      case "ambiguous":
        return (
          <Badge variant="beige" className="bg-[#A67763]/10 text-[#A67763] border-[#A67763]/20">
            <AlertCircle className="w-3 h-3 mr-1" /> Ambiguous
          </Badge>
        );
      case "missing":
        return (
          <Badge variant="beige" className="bg-[#F5F1ED] text-[#8B7355] border-[#E5DDD4]">
            Missing
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#E5DDD4]">
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          {section.confidence > 0 && (
            <span className="text-xs text-[#8B7355]">
              AI Confidence: <span className="font-semibold text-[#3D3126]">{section.confidence}%</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
              <Button
                variant={isCompleted ? "outline" : "default"}
                size="sm"
                onClick={onToggleComplete}
                className={cn(
                  isCompleted && "border-[#4D5741] text-[#4D5741]"
                )}
              >
                {isCompleted ? (
                  <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Reviewed</>
                ) : (
                  "Mark Reviewed"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={onCancelEdit}>
                <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
              </Button>
              <Button size="sm" onClick={onSaveEdit}>
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-[#3D3126] mb-4">{section.title}</h2>

        {isEditing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[200px] resize-none"
          />
        ) : (
          <div className="prose prose-sm max-w-none">
            {section.content ? (
              <p className="text-sm text-[#5B4538] leading-relaxed whitespace-pre-wrap">
                {section.content}
              </p>
            ) : (
              <div className="p-4 bg-[#F5F1ED] rounded-lg border border-dashed border-[#E5DDD4]">
                <p className="text-sm text-[#8B7355] italic">No content extracted for this section.</p>
              </div>
            )}
          </div>
        )}

        {/* AI Suggestion */}
        {section.aiSuggestion && !isEditing && (
          <div className="mt-6 p-4 bg-[#5B9BA2]/5 rounded-lg border border-[#5B9BA2]/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-[#5B9BA2]" />
              <span className="text-xs font-semibold text-[#3A6368] uppercase tracking-wider">AI Suggestion</span>
            </div>
            <p className="text-sm text-[#5B4538]">{section.aiSuggestion}</p>
          </div>
        )}

        {/* Gaps */}
        {section.gaps && section.gaps.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider mb-3">
              Identified Gaps
            </h4>
            <ul className="space-y-2">
              {section.gaps.map((gap, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-[#5B4538]">
                  <AlertTriangle className="w-4 h-4 text-[#D0B060] shrink-0 mt-0.5" />
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT: Document Viewer (Placeholder)
   ═══════════════════════════════════════════════════════════ */

function DocumentViewer({ zoom, setZoom }: { zoom: number; setZoom: (z: number) => void }) {
  return (
    <div className="flex-1 flex flex-col bg-[#F5F1ED] h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-[#E5DDD4]">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(50, zoom - 10))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-[#8B7355] w-16 text-center">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(200, zoom + 10))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Document Placeholder */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
        <div
          className="bg-white shadow-lg transition-transform duration-200"
          style={{ 
            width: `${8.5 * 12 * (zoom / 100)}px`, 
            height: `${11 * 12 * (zoom / 100)}px`,
            padding: `${1 * 12 * (zoom / 100)}px`,
          }}
        >
          <div className="w-full h-full border border-dashed border-[#E5DDD4] rounded flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-[#E5DDD4] mx-auto mb-3" />
              <p className="text-sm text-[#8B7355]">Document Preview</p>
              <p className="text-xs text-[#A99B8C] mt-1">PDF viewer integration placeholder</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE: Extraction Intelligence Report
   ═══════════════════════════════════════════════════════════ */

export default function ExtractionReportPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = React.useState("sec-1");
  const [completedSections, setCompletedSections] = React.useState<Set<string>>(new Set());
  const [editingSection, setEditingSection] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState("");
  const [zoom, setZoom] = React.useState(100);
  const [sections, setSections] = React.useState(MOCK_EXTRACTION.sections);

  const currentSection = sections.find((s) => s.id === activeSection)!;

  const toggleComplete = (id: string) => {
    setCompletedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEdit = () => {
    setEditingSection(activeSection);
    setEditContent(currentSection.content);
  };

  const saveEdit = () => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === activeSection ? { ...s, content: editContent } : s
      )
    );
    setEditingSection(null);
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditContent("");
  };

  const allSectionsReviewed = completedSections.size === sections.length;
  const completionPercentage = Math.round((completedSections.size / sections.length) * 100);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#8B7355] mb-1">
            <Link href="/enterprise/sow/upload" className="hover:text-[#A67763] transition-colors">
              Upload
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#3D3126]">Extraction Report</span>
          </div>
          <h1 className="text-xl font-bold text-[#3D3126]">Extraction Intelligence Report</h1>
          <p className="text-sm text-[#8B7355] mt-1">
            Review AI-extracted sections from <span className="font-medium text-[#3D3126]">{MOCK_EXTRACTION.documentName}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="text-right">
            <p className="text-xs text-[#8B7355]">Review Progress</p>
            <p className="text-lg font-semibold text-[#3D3126]">{completionPercentage}%</p>
          </div>
          <div className="w-32 h-2 bg-[#E5DDD4] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#A67763] transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Continue Button */}
          <Link href="/enterprise/sow/upload/preview-confirm">
            <Button
              variant="default"
              disabled={!allSectionsReviewed}
              className={cn(
                "gap-2",
                !allSectionsReviewed && "opacity-50 cursor-not-allowed"
              )}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={fadeUp} className="flex-1 flex rounded-xl border border-[#E5DDD4] overflow-hidden bg-white">
        {/* Section Navigator */}
        <SectionNavigator
          sections={sections}
          activeSection={activeSection}
          onSelect={setActiveSection}
          completedSections={completedSections}
        />

        {/* Document Viewer */}
        <DocumentViewer zoom={zoom} setZoom={setZoom} />

        {/* Extraction Panel */}
        <div className="w-[450px] border-l border-[#E5DDD4]">
          <ExtractionPanel
            section={currentSection}
            isCompleted={completedSections.has(activeSection)}
            onToggleComplete={() => toggleComplete(activeSection)}
            onEdit={startEdit}
            isEditing={editingSection === activeSection}
            editContent={editContent}
            setEditContent={setEditContent}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
          />
        </div>
      </motion.div>

      {/* Bottom Info Bar */}
      <motion.div variants={fadeUp} className="mt-4 flex items-center justify-between text-xs text-[#8B7355]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4D5741]" />
            {sections.filter((s) => s.status === "complete").length} Complete
          </span>
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D0B060]" />
            {sections.filter((s) => s.status === "partial" || s.status === "ambiguous").length} Needs Review
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#E5DDD4]" />
            {sections.filter((s) => s.status === "missing").length} Missing
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Overall Confidence: <span className="font-semibold text-[#3D3126]">{MOCK_EXTRACTION.overallConfidence}%</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
