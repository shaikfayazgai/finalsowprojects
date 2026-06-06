"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  Plus,
  Save,
  X,
  Clock,
  DollarSign,
  Layers,
  Trash2,
  ChevronDown,
  ChevronRight,
  Network,
  GitBranch,
  Tag,
  Sparkles,
  Check,
  CheckCircle2,
  Loader2,
  Bot,
  FileText,
  ShieldCheck,
  Search,
  AlertTriangle,
  History,
  FileEdit,
  Target,
  Route,
  ListChecks,
  PenLine,
  Shield,
  Zap,
  ArrowRight,
  Link2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Label,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Separator,
  ScrollArea,
} from "@/components/ui";
import type {
  DecompositionTask,
  DecompositionPlan,
  PlanMilestone,
  PlanStatus,
  Subtask,
  SkillTag,
  TaskDependency,
} from "@/types/enterprise";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDecompositionPlan,
  useTasks,
  useMilestones,
  decompositionKeys,
} from "@/lib/hooks/use-decomposition";
import {
  patchEnterpriseTask,
  postEnterpriseTask,
  deleteEnterpriseTask,
  postEnterpriseSubtask,
  patchEnterpriseSubtask,
  deleteEnterpriseSubtask,
  postEnterpriseSubmitForReview,
} from "@/lib/api/decomposition-plans";

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════ */

const skillsTaxonomy = [
  "TypeScript", "JavaScript", "React", "Next.js", "Vue.js", "Angular",
  "Node.js", "NestJS", "Python", "FastAPI", "Django", "Go", "Rust",
  "PostgreSQL", "MongoDB", "Redis", "GraphQL", "REST API",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
  "DevOps", "CI/CD", "Security", "OIDC", "OAuth",
  "Frontend", "Backend", "Full-Stack", "Mobile", "React Native",
  "QA", "Playwright", "Jest", "k6", "Performance Testing",
  "Design", "Figma", "UI/UX", "CSS", "Tailwind",
  "Data", "Machine Learning", "Analytics", "ETL",
  "Finance", "HR", "Architecture", "E-Commerce", "Migration",
];

const priorityColors: Record<string, string> = {
  low: "border-l-gray-300",
  medium: "border-l-teal-400",
  high: "border-l-gold-400",
  critical: "border-l-brown-500",
};

const milestoneColors = [
  "from-brown-400 to-brown-500",
  "from-teal-400 to-teal-500",
  "from-gold-400 to-gold-500",
  "from-forest-400 to-forest-500",
];

const milestoneBarColors = [
  "bg-brown-400",
  "bg-teal-400",
  "bg-gold-400",
  "bg-forest-400",
];

/* ── AI skill suggestions (simulated) ── */
const aiSkillSuggestions: Record<string, { name: string; confidence: number }[]> = {
  "task-001": [
    { name: "CI/CD", confidence: 0.92 },
    { name: "Docker", confidence: 0.87 },
    { name: "Terraform", confidence: 0.78 },
  ],
  "task-002": [
    { name: "OIDC", confidence: 0.95 },
    { name: "OAuth", confidence: 0.91 },
    { name: "Node.js", confidence: 0.84 },
  ],
  "task-003": [
    { name: "PostgreSQL", confidence: 0.96 },
    { name: "Migration", confidence: 0.82 },
  ],
  "task-004": [
    { name: "REST API", confidence: 0.89 },
    { name: "TypeScript", confidence: 0.86 },
  ],
  "task-005": [
    { name: "TypeScript", confidence: 0.88 },
    { name: "REST API", confidence: 0.83 },
  ],
  "task-006": [
    { name: "React", confidence: 0.90 },
    { name: "PostgreSQL", confidence: 0.85 },
  ],
  "task-007": [
    { name: "Python", confidence: 0.79 },
    { name: "ETL", confidence: 0.75 },
  ],
  "task-008": [
    { name: "Tailwind", confidence: 0.94 },
    { name: "Figma", confidence: 0.88 },
    { name: "React", confidence: 0.92 },
  ],
  "task-009": [
    { name: "React", confidence: 0.91 },
    { name: "TypeScript", confidence: 0.87 },
  ],
  "task-010": [
    { name: "Jest", confidence: 0.93 },
    { name: "k6", confidence: 0.86 },
    { name: "Docker", confidence: 0.78 },
  ],
};

/* ══════════════════════════════════════════════════════════════
   HELPER TYPES — Editable state shapes
   ══════════════════════════════════════════════════════════════ */

interface EditableSubtask {
  id: string;
  taskId: string;
  title: string;
  estimatedHours: number;
  skillsRequired: SkillTag[];
  itemStatus: "proposed" | "accepted" | "modified" | "deleted";
  aiConfidence: number;
  isNew?: boolean;
  isModified?: boolean;
}

interface EditableTask {
  id: string;
  planId: string;
  milestoneId: string;
  title: string;
  description: string;
  status: string;
  priority: "low" | "medium" | "high" | "critical";
  estimatedHours: number;
  startDate?: string;
  skillsRequired: SkillTag[];
  dependencies: TaskDependency[];
  phase: number;
  order: number;
  aiConfidence: number;
  itemStatus: "proposed" | "accepted" | "modified" | "deleted";
  acceptanceCriteria: string[];
  subtasks: EditableSubtask[];
  isNew?: boolean;
  isModified?: boolean;
}

interface EditableMilestone {
  id: string;
  planId: string;
  title: string;
  description: string;
  order: number;
  isNew?: boolean;
  isModified?: boolean;
}

/* ══════════════════════════════════════════════════════════════
   SKILLS POPOVER — C2: Skills Tagging
   ══════════════════════════════════════════════════════════════ */

function SkillsPopover({
  taskId,
  currentSkills,
  onAdd,
}: {
  taskId: string;
  currentSkills: SkillTag[];
  onAdd: (skill: SkillTag) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const currentNames = currentSkills.map((s) => s.name);
  const suggestions = aiSkillSuggestions[taskId] ?? [];

  const filteredTaxonomy = skillsTaxonomy
    .filter((s) => !currentNames.includes(s))
    .filter((s) => s.toLowerCase().includes(search.toLowerCase()));

  const filteredSuggestions = suggestions.filter(
    (s) => !currentNames.includes(s.name)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="text-[10px] font-semibold px-2 py-1 rounded-md border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1">
          <Plus className="w-3 h-3" />
          Add Skill
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 border-gray-200 bg-white shadow-xl"
        align="start"
      >
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="h-8 pl-8 text-[12px] border-gray-200 rounded-lg"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-64">
          <div className="p-2">
            {/* AI Suggestions section */}
            {filteredSuggestions.length > 0 && search === "" && (
              <>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold px-2 py-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-gold-500" />
                  AI Suggested
                </p>
                {filteredSuggestions.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => {
                      onAdd({
                        name: s.name,
                        source: "ai",
                        confidence: s.confidence,
                      });
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gold-50/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-gold-400" />
                      <span className="text-[12px] font-medium text-gray-800">
                        {s.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-gold-600 bg-gold-50 px-1.5 py-0.5 rounded">
                        {Math.round(s.confidence * 100)}%
                      </span>
                      <Plus className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
                <Separator className="my-1.5 bg-gray-100" />
              </>
            )}

            {/* Taxonomy list */}
            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold px-2 py-1.5">
              {search ? "Search Results" : "All Skills"}
            </p>
            {filteredTaxonomy.length === 0 && (
              <p className="text-[11px] text-gray-400 px-2 py-3 text-center">
                No matching skills
              </p>
            )}
            {filteredTaxonomy.slice(0, 15).map((s) => (
              <button
                key={s}
                onClick={() => {
                  onAdd({ name: s, source: "manual" });
                  setSearch("");
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="text-[12px] text-gray-700">{s}</span>
                <Plus className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
            {filteredTaxonomy.length > 15 && (
              <p className="text-[10px] text-gray-400 text-center py-1.5">
                +{filteredTaxonomy.length - 15} more...
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/* ── Proficiency badge on skill chip ── */
function SkillProficiencySelect({
  skill,
  onChangeProficiency,
}: {
  skill: SkillTag;
  onChangeProficiency: (p: SkillTag["proficiency"]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const levels: { value: SkillTag["proficiency"]; label: string; color: string }[] = [
    { value: "beginner", label: "Beginner", color: "text-gray-400" },
    { value: "intermediate", label: "Intermediate", color: "text-teal-600" },
    { value: "advanced", label: "Advanced", color: "text-gold-600" },
    { value: "expert", label: "Expert", color: "text-brown-600" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="text-[8px] font-mono text-gray-400 hover:text-gray-600 transition-colors underline decoration-dashed underline-offset-2"
          title="Set proficiency level"
        >
          {skill.proficiency
            ? skill.proficiency.charAt(0).toUpperCase() + skill.proficiency.slice(1, 3)
            : "Lvl"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1 border-gray-200 bg-white shadow-lg" align="start">
        {levels.map((l) => (
          <button
            key={l.value}
            onClick={() => {
              onChangeProficiency(l.value);
              setOpen(false);
            }}
            className={cn(
              "w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-medium hover:bg-gray-50 transition-colors flex items-center gap-2",
              skill.proficiency === l.value ? "bg-gray-50" : ""
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", l.color, "bg-current")} />
            {l.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/* ══════════════════════════════════════════════════════════════
   EDITABLE SUBTASK CARD
   ══════════════════════════════════════════════════════════════ */

function EditableSubtaskCard({
  subtask,
  onUpdate,
  onDelete,
}: {
  subtask: EditableSubtask;
  onUpdate: (updated: EditableSubtask) => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "flex items-center gap-2 p-2.5 rounded-lg border bg-gray-50 group/sub",
        subtask.isNew
          ? "border-forest-200 bg-forest-50/20"
          : subtask.isModified
            ? "border-gold-200 bg-gold-50/20"
            : "border-gray-200"
      )}
    >
      <GripVertical className="w-3 h-3 text-gray-300 shrink-0 cursor-grab" />
      <Input
        value={subtask.title}
        onChange={(e) =>
          onUpdate({ ...subtask, title: e.target.value, isModified: true })
        }
        className="flex-1 h-7 text-[11px] border-transparent bg-transparent hover:bg-white focus:bg-white px-2 rounded-md"
        placeholder="Subtask title..."
      />
      <div className="flex items-center gap-1 shrink-0">
        <Clock className="w-2.5 h-2.5 text-gray-400" />
        <Input
          type="number"
          min={0}
          value={subtask.estimatedHours}
          onChange={(e) =>
            onUpdate({
              ...subtask,
              estimatedHours: Math.max(0, parseInt(e.target.value) || 0),
              isModified: true,
            })
          }
          className="h-7 w-12 text-[10px] text-center px-1 rounded-md border-gray-200"
        />
        <span className="text-[9px] text-gray-400">h</span>
      </div>
      {subtask.isNew && (
        <span className="inline-flex items-center text-[8px] font-semibold h-4 border border-forest-300 text-forest-600 bg-forest-50 px-1 rounded-full">
          New
        </span>
      )}
      {subtask.isModified && !subtask.isNew && (
        <span className="inline-flex items-center text-[8px] font-semibold h-4 border border-gold-300 text-gold-600 bg-gold-50 px-1 rounded-full">
          Modified
        </span>
      )}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover/sub:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all shrink-0"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EDITABLE TASK CARD — C1 Step 3-4 + C2
   ══════════════════════════════════════════════════════════════ */

const PRIORITY_DOT_COLOR: Record<string, string> = {
  low: "bg-gray-300",
  medium: "bg-teal-400",
  high: "bg-gold-400",
  critical: "bg-brown-500",
};
const PRIORITY_TEXT_COLOR: Record<string, string> = {
  low: "text-gray-500",
  medium: "text-teal-600",
  high: "text-gold-600",
  critical: "text-brown-600",
};
const PRIORITY_ACCENT: Record<string, string> = {
  low: "border-l-gray-300",
  medium: "border-l-teal-400",
  high: "border-l-gold-400",
  critical: "border-l-brown-500",
};

function EditableTaskCard({
  task,
  index,
  allTasks,
  onUpdate,
  onDelete,
}: {
  task: EditableTask;
  index: number;
  allTasks: EditableTask[];
  onUpdate: (updated: EditableTask) => void;
  onDelete: () => void;
}) {
  const [descOpen, setDescOpen] = React.useState(false);
  const [criteriaOpen, setCriteriaOpen] = React.useState(false);
  const [subtasksOpen, setSubtasksOpen] = React.useState(false);
  const [newCriteria, setNewCriteria] = React.useState("");

  const handleSkillAdd = (skill: SkillTag) => {
    onUpdate({
      ...task,
      skillsRequired: [...task.skillsRequired, { ...skill, proficiency: "intermediate" }],
      isModified: true,
    });
  };
  const handleSkillRemove = (skillName: string) => {
    onUpdate({ ...task, skillsRequired: task.skillsRequired.filter((s) => s.name !== skillName), isModified: true });
  };
  const handleSkillProficiency = (skillName: string, proficiency: SkillTag["proficiency"]) => {
    onUpdate({ ...task, skillsRequired: task.skillsRequired.map((s) => s.name === skillName ? { ...s, proficiency } : s), isModified: true });
  };
  const handleSubtaskUpdate = (updated: EditableSubtask) => {
    onUpdate({ ...task, subtasks: task.subtasks.map((st) => (st.id === updated.id ? updated : st)), isModified: true });
  };
  const handleSubtaskDelete = (subtaskId: string) => {
    onUpdate({ ...task, subtasks: task.subtasks.filter((st) => st.id !== subtaskId), isModified: true });
  };
  const handleAddSubtask = () => {
    const newSt: EditableSubtask = {
      id: `st-new-${Date.now()}`, taskId: task.id, title: "", estimatedHours: 8,
      skillsRequired: [], itemStatus: "proposed", aiConfidence: 0, isNew: true,
    };
    onUpdate({ ...task, subtasks: [...task.subtasks, newSt], isModified: true });
    setSubtasksOpen(true);
  };
  const handleAddCriteria = () => {
    if (!newCriteria.trim()) return;
    onUpdate({ ...task, acceptanceCriteria: [...task.acceptanceCriteria, newCriteria.trim()], isModified: true });
    setNewCriteria("");
  };
  const handleRemoveCriteria = (idx: number) => {
    onUpdate({ ...task, acceptanceCriteria: task.acceptanceCriteria.filter((_, i) => i !== idx), isModified: true });
  };

  const fieldLabel = (text: string) => (
    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 w-24 shrink-0">{text}</span>
  );

  return (
    <motion.div
      layout
      variants={fadeUp}
      className={cn(
        "group relative bg-white rounded-2xl border border-l-[3px] overflow-hidden transition-all duration-200 hover:shadow-lg",
        PRIORITY_ACCENT[task.priority],
        task.isNew ? "border-forest-200 ring-1 ring-forest-100" : task.isModified ? "border-gold-200 ring-1 ring-gold-100" : "border-gray-200",
      )}
    >
      {/* ── Card top bar ── */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-0">
        <div className="flex items-center gap-2 shrink-0 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
          <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
            {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          {task.isNew && <span className="text-[9px] font-semibold border border-forest-300 text-forest-600 bg-forest-50 px-2 py-0.5 rounded-full">New</span>}
          {task.isModified && !task.isNew && <span className="text-[9px] font-semibold border border-gold-300 text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full">Modified</span>}
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Labeled fields ── */}
      <div className="px-4 pt-3 pb-4 space-y-0" style={{ borderBottom: "1px solid var(--border-soft)" }}>

        {/* Title */}
        <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          {fieldLabel("Title")}
          <Input
            value={task.title}
            onChange={(e) => onUpdate({ ...task, title: e.target.value, isModified: true })}
            className="flex-1 h-8 text-[13px] font-semibold text-gray-900 border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl px-3"
            placeholder="Task title…"
          />
        </div>

        {/* Priority */}
        <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          {fieldLabel("Priority")}
          <Select value={task.priority} onValueChange={(v) => onUpdate({ ...task, priority: v as EditableTask["priority"], isModified: true })}>
            <SelectTrigger className="h-8 w-[140px] text-[11px] rounded-xl border-gray-200 bg-gray-50">
              <div className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full shrink-0", PRIORITY_DOT_COLOR[task.priority])} />
                <span className={cn("font-medium capitalize", PRIORITY_TEXT_COLOR[task.priority])}>{task.priority}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {(["low","medium","high","critical"] as const).map(p => (
                <SelectItem key={p} value={p}>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", PRIORITY_DOT_COLOR[p])} />
                    <span className="capitalize">{p}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estimated Hours */}
        <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          {fieldLabel("Est. Hours")}
          <div className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-gray-200 bg-gray-50">
            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
            <Input
              type="number"
              min={0}
              value={task.estimatedHours}
              onChange={(e) => onUpdate({ ...task, estimatedHours: Math.max(0, parseInt(e.target.value) || 0), isModified: true })}
              className="h-6 w-14 text-[12px] font-medium text-center border-none bg-transparent p-0 focus:ring-0"
            />
            <span className="text-[10px] text-gray-400">hrs</span>
          </div>
        </div>

        {/* Skills */}
        <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 w-24 shrink-0 pt-1.5">Skills</span>
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {task.skillsRequired.map((skill) => (
              <span
                key={skill.name}
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg border",
                  skill.source === "ai" ? "bg-gold-50 text-gold-700 border-gold-200" : "bg-gray-100 text-gray-600 border-gray-200",
                )}
              >
                {skill.source === "ai" && <Sparkles className="w-2.5 h-2.5 text-gold-400" />}
                {skill.name}
                <SkillProficiencySelect skill={skill} onChangeProficiency={(p) => handleSkillProficiency(skill.name, p)} />
                <button onClick={() => handleSkillRemove(skill.name)} className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <SkillsPopover taskId={task.id} currentSkills={task.skillsRequired} onAdd={handleSkillAdd} />
          </div>
        </div>

        {/* Description */}
        <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 w-24 shrink-0 pt-1">Description</span>
          <div className="flex-1">
            <button
              onClick={() => setDescOpen(!descOpen)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors mb-1"
            >
              {descOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {descOpen ? "Hide" : task.description ? "Edit" : "Add description"}
              {task.description && !descOpen && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 ml-1" />}
            </button>
            <AnimatePresence>
              {descOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <Textarea
                    value={task.description}
                    onChange={(e) => onUpdate({ ...task, description: e.target.value, isModified: true })}
                    className="text-[12px] min-h-[72px] border-gray-200 bg-gray-50 rounded-xl resize-none"
                    placeholder="Describe the task goals and context…"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Acceptance Criteria */}
        <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 w-24 shrink-0 pt-1">Criteria</span>
          <div className="flex-1">
            <button
              onClick={() => setCriteriaOpen(!criteriaOpen)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors mb-1"
            >
              {criteriaOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {criteriaOpen ? "Hide" : "Acceptance Criteria"}
              <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">{task.acceptanceCriteria.length}</span>
            </button>
            <AnimatePresence>
              {criteriaOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="space-y-1 bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                    {task.acceptanceCriteria.map((criteria, idx) => (
                      <div key={idx} className="flex items-center gap-2 group/crit py-1 border-b border-gray-100 last:border-0">
                        <Check className="w-3 h-3 text-forest-400 shrink-0" />
                        <span className="text-[11px] text-gray-700 flex-1">{criteria}</span>
                        <button onClick={() => handleRemoveCriteria(idx)} className="opacity-0 group-hover/crit:opacity-100 p-0.5 text-gray-300 hover:text-red-400 transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        value={newCriteria}
                        onChange={(e) => setNewCriteria(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCriteria()}
                        className="flex-1 h-7 text-[11px] border-gray-200 bg-white rounded-lg px-2"
                        placeholder="Add criteria and press Enter…"
                      />
                      {newCriteria && (
                        <button onClick={handleAddCriteria} className="text-[10px] font-semibold text-teal-600 hover:text-teal-700 px-2 py-1 rounded-lg hover:bg-teal-50 transition-all">Add</button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Subtasks */}
        <div className="flex items-start gap-3 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 w-24 shrink-0 pt-1">Subtasks</span>
          <div className="flex-1">
            <button
              onClick={() => setSubtasksOpen(!subtasksOpen)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors mb-1"
            >
              {subtasksOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {subtasksOpen ? "Hide" : "Subtasks"}
              <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">{task.subtasks.length}</span>
            </button>
            <AnimatePresence>
              {subtasksOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="space-y-1.5">
                    <AnimatePresence>
                      {task.subtasks.map((st) => (
                        <EditableSubtaskCard key={st.id} subtask={st} onUpdate={handleSubtaskUpdate} onDelete={() => handleSubtaskDelete(st.id)} />
                      ))}
                    </AnimatePresence>
                    <button
                      onClick={handleAddSubtask}
                      className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl border border-dashed border-gray-300 text-gray-400 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/40 transition-all text-[10px] font-medium"
                    >
                      <Plus className="w-3 h-3" /> Add Subtask
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* ── Footer info row ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap" style={{ background: "rgba(0,0,0,0.012)" }}>
        {task.dependencies.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-teal-600 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
            <GitBranch className="w-3 h-3" />
            {task.dependencies.length} dep{task.dependencies.length > 1 ? "s" : ""}
          </span>
        )}
        {task.aiConfidence > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-gold-600 bg-gold-50 border border-gold-200 px-2.5 py-1 rounded-lg">
            <Sparkles className="w-3 h-3" />
            AI {task.aiConfidence}% confidence
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EDITABLE MILESTONE GROUP
   ══════════════════════════════════════════════════════════════ */

function EditableMilestoneGroup({
  milestone,
  milestoneIndex,
  tasks,
  allTasks,
  onUpdateMilestone,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
}: {
  milestone: EditableMilestone;
  milestoneIndex: number;
  tasks: EditableTask[];
  allTasks: EditableTask[];
  onUpdateMilestone: (m: EditableMilestone) => void;
  onUpdateTask: (t: EditableTask) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (milestoneId: string) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const [editingTitle, setEditingTitle] = React.useState(false);
  const milestoneHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);
  const subtaskCount = tasks.reduce((s, t) => s + t.subtasks.length, 0);

  return (
    <motion.div variants={fadeUp} className="space-y-3">
      {/* Milestone header */}
      <div className="flex items-center gap-3 group">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div
            className={cn(
              "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform",
              milestoneColors[milestoneIndex % milestoneColors.length]
            )}
          >
            <Target className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <Input
                value={milestone.title}
                onChange={(e) =>
                  onUpdateMilestone({
                    ...milestone,
                    title: e.target.value,
                    isModified: true,
                  })
                }
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                className="h-8 text-[14px] font-bold border-brown-300 bg-white rounded-lg"
                autoFocus
              />
            ) : (
              <h3 className="text-[14px] font-bold text-gray-900 truncate">
                Milestone {milestoneIndex + 1}: {milestone.title}
              </h3>
            )}
            <p className="text-[11px] text-gray-400">
              {tasks.length} tasks &middot; {subtaskCount} subtasks &middot;{" "}
              {milestoneHours.toLocaleString()}h
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {milestone.isNew && (
            <span className="inline-flex items-center text-[8px] font-semibold h-4 border border-forest-300 text-forest-600 bg-forest-50 px-1.5 rounded-full">
              New
            </span>
          )}
          {milestone.isModified && !milestone.isNew && (
            <span className="inline-flex items-center text-[8px] font-semibold h-4 border border-gold-300 text-gold-600 bg-gold-50 px-1.5 rounded-full">
              Modified
            </span>
          )}
          <button
            onClick={() => setEditingTitle(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
          >
            <PenLine className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setOpen(!open)} className="p-1">
            {open ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Tasks */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-2.5 pl-3 border-l-2 border-gray-200 ml-4"
            >
              {tasks.map((task, i) => (
                <EditableTaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  allTasks={allTasks}
                  onUpdate={onUpdateTask}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))}
              <button
                onClick={() => onAddTask(milestone.id)}
                className="flex items-center gap-2 w-full py-3 px-4 rounded-xl border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all text-[12px] font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task to {milestone.title}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DEPENDENCY VIEW TAB — C3: Dependencies & Critical Path
   ══════════════════════════════════════════════════════════════ */

function DependencyView({
  tasks,
  milestones,
  onAddDependency,
}: {
  tasks: EditableTask[];
  milestones: EditableMilestone[];
  onAddDependency: (sourceId: string, targetId: string, type: "blocks" | "related") => void;
}) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [sourceTask, setSourceTask] = React.useState("");
  const [targetTask, setTargetTask] = React.useState("");
  const [depType, setDepType] = React.useState<"blocks" | "related">("blocks");

  const maxHours = Math.max(...tasks.map((t) => t.estimatedHours), 1);
  const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);

  /* Simple critical path detection: tasks with the most downstream dependencies */
  const criticalTaskIds = React.useMemo(() => {
    const downstreamCount: Record<string, number> = {};
    const computeDownstream = (taskId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(taskId)) return 0;
      visited.add(taskId);
      const downstream = tasks.filter((t) =>
        t.dependencies.some((d) => d.targetId === taskId && d.type === "blocks")
      );
      let count = downstream.length;
      for (const d of downstream) {
        count += computeDownstream(d.id, visited);
      }
      return count;
    };

    for (const t of tasks) {
      downstreamCount[t.id] = computeDownstream(t.id);
    }

    /* Also identify root tasks with blocking deps that chain longest */
    const sorted = Object.entries(downstreamCount).sort(([, a], [, b]) => b - a);
    const criticalIds = new Set<string>();

    /* Mark tasks that are on the longest chain */
    const chainTasks = (taskId: string) => {
      criticalIds.add(taskId);
      const blockedBy = tasks.find((t) => t.id === taskId)?.dependencies
        .filter((d) => d.type === "blocks")
        .map((d) => d.targetId) ?? [];
      for (const bId of blockedBy) {
        chainTasks(bId);
      }
    };

    /* Start from tasks with most downstream */
    for (const [id] of sorted.slice(0, 4)) {
      chainTasks(id);
    }

    return criticalIds;
  }, [tasks]);

  const criticalPathDuration = tasks
    .filter((t) => criticalTaskIds.has(t.id))
    .reduce((s, t) => s + t.estimatedHours, 0);

  const getMilestoneForTask = (task: EditableTask) => {
    const mIdx = milestones.findIndex((m) => m.id === task.milestoneId);
    return mIdx;
  };

  const handleAddDep = () => {
    if (sourceTask && targetTask && sourceTask !== targetTask) {
      onAddDependency(sourceTask, targetTask, depType);
      setAddOpen(false);
      setSourceTask("");
      setTargetTask("");
    }
  };

  return (
    <motion.div variants={fadeUp} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center">
            <Route className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-gray-900">
              Dependencies & Critical Path
            </h3>
            <p className="text-[11px] text-gray-400">
              {tasks.reduce((s, t) => s + t.dependencies.length, 0)} dependencies
              &middot; Critical path: {criticalPathDuration.toLocaleString()}h
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddOpen(true)}
          className="text-[11px]"
        >
          <Link2 className="w-3.5 h-3.5" />
          Add Dependency
        </Button>
      </div>

      {/* Critical path highlight bar */}
      <div className="rounded-xl border border-gold-200/50 bg-gold-50/30 backdrop-blur-sm p-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-gold-800">
            Critical Path Duration
          </p>
          <p className="text-[11px] text-gold-600">
            {criticalTaskIds.size} tasks on the critical path, totaling{" "}
            {criticalPathDuration.toLocaleString()} hours
          </p>
        </div>
        <span className="text-[20px] font-bold text-gold-700 font-mono">
          {criticalPathDuration.toLocaleString()}h
        </span>
      </div>

      {/* Gantt-like timeline */}
      <div className="card-parchment overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-gray-900">
              Task Timeline
            </p>
            <div className="flex items-center gap-3 text-[9px] text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-1.5 rounded-full bg-brown-400" />
                Milestone 1
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-1.5 rounded-full bg-teal-400" />
                Milestone 2
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-1.5 rounded-full bg-gold-400" />
                Milestone 3
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-1.5 rounded-full bg-forest-400" />
                Milestone 4
              </span>
              <span className="flex items-center gap-1">
                <span className="w-8 h-4 rounded border-2 border-gold-400 shadow-[0_0_6px_rgba(208,176,96,0.4)]" />
                Critical Path
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-1">
          {/* Scale markers */}
          <div className="flex items-center ml-[180px] mb-2">
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className="text-[8px] text-gray-400 font-mono"
                style={{
                  position: "absolute" as const,
                  left: `calc(180px + ${pct}% * (100% - 200px) / 100)`,
                }}
              >
                {Math.round((pct / 100) * maxHours)}h
              </div>
            ))}
          </div>

          {/* Gantt rows */}
          {milestones.map((ms, msIdx) => {
            const msTasks = tasks.filter((t) => t.milestoneId === ms.id);
            if (msTasks.length === 0) return null;
            return (
              <React.Fragment key={ms.id}>
                {/* Milestone label row */}
                <div className="flex items-center gap-2 py-1.5">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                      msIdx === 0
                        ? "text-brown-600 bg-brown-50"
                        : msIdx === 1
                          ? "text-teal-600 bg-teal-50"
                          : msIdx === 2
                            ? "text-gold-600 bg-gold-50"
                            : "text-forest-600 bg-forest-50"
                    )}
                  >
                    {ms.title}
                  </span>
                </div>

                {/* Task bars */}
                {msTasks.map((task) => {
                  const isCritical = criticalTaskIds.has(task.id);
                  const barWidth = Math.max(
                    (task.estimatedHours / maxHours) * 100,
                    8
                  );
                  /* Calculate offset based on task dependencies (simplified) */
                  const depTasks = task.dependencies
                    .filter((d) => d.type === "blocks")
                    .map((d) => tasks.find((t) => t.id === d.targetId))
                    .filter(Boolean) as EditableTask[];
                  const offset =
                    depTasks.length > 0
                      ? Math.max(
                          ...depTasks.map(
                            (dt) =>
                              (dt.estimatedHours / maxHours) * 100 +
                              (dt.dependencies
                                .filter((d) => d.type === "blocks")
                                .map((d) =>
                                  tasks.find((t) => t.id === d.targetId)
                                )
                                .filter(Boolean)
                                .reduce(
                                  (s, t) =>
                                    s +
                                    ((t as EditableTask).estimatedHours /
                                      maxHours) *
                                      100,
                                  0
                                ))
                          )
                        )
                      : 0;

                  return (
                    <div key={task.id} className="flex items-center gap-2 py-1 group/row">
                      {/* Task label */}
                      <div className="w-[170px] shrink-0 truncate text-[11px] text-gray-700 font-medium pr-2">
                        {task.title}
                      </div>

                      {/* Bar container */}
                      <div className="flex-1 relative h-7">
                        {/* The bar */}
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={cn(
                            "absolute top-0.5 h-6 rounded-md flex items-center px-2 origin-left transition-all",
                            milestoneBarColors[msIdx % milestoneBarColors.length],
                            isCritical
                              ? "ring-2 ring-gold-400 shadow-[0_0_8px_rgba(208,176,96,0.4)] z-10"
                              : "opacity-80"
                          )}
                          style={{
                            left: `${Math.min(offset, 70)}%`,
                            width: `${Math.min(barWidth, 100 - Math.min(offset, 70))}%`,
                          }}
                        >
                          <span className="text-[9px] text-white font-semibold truncate">
                            {task.estimatedHours}h
                          </span>
                          {isCritical && (
                            <Zap className="w-3 h-3 text-gold-200 ml-auto shrink-0" />
                          )}
                        </motion.div>

                        {/* Dependency arrow indicators */}
                        {task.dependencies
                          .filter((d) => d.type === "blocks")
                          .map((dep) => {
                            const depTask = tasks.find(
                              (t) => t.id === dep.targetId
                            );
                            if (!depTask) return null;
                            return (
                              <div
                                key={dep.targetId}
                                className="absolute top-3 w-2 h-0.5 bg-brown-300 rounded-full"
                                style={{
                                  left: `calc(${Math.min(offset, 70)}% - 10px)`,
                                }}
                                title={`Blocked by: ${depTask.title}`}
                              >
                                <ArrowRight className="w-3 h-3 text-brown-400 absolute -right-2 -top-1" />
                              </div>
                            );
                          })}
                      </div>

                      {/* Hours label */}
                      <span className="text-[9px] text-gray-400 font-mono w-10 text-right shrink-0">
                        {task.estimatedHours}h
                      </span>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Dependency list */}
      <div className="card-parchment p-4 space-y-3">
        <p className="text-[12px] font-semibold text-gray-900">
          All Dependencies
        </p>
        <div className="space-y-2">
          {tasks
            .filter((t) => t.dependencies.length > 0)
            .map((task) =>
              task.dependencies.map((dep) => {
                const target = tasks.find((t) => t.id === dep.targetId);
                if (!target) return null;
                return (
                  <div
                    key={`${task.id}-${dep.targetId}`}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg border",
                      dep.type === "blocks"
                        ? "border-brown-200/40 bg-brown-50/20"
                        : "border-gray-200 bg-gray-50"
                    )}
                  >
                    <span className="text-[11px] font-medium text-gray-700 flex-1 truncate">
                      {target.title}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center text-[9px] font-semibold h-5 shrink-0 px-2 rounded-full border",
                        dep.type === "blocks"
                          ? "border-brown-300 text-brown-600 bg-brown-50"
                          : "border-gray-300 text-gray-500 bg-gray-50"
                      )}
                    >
                      {dep.type === "blocks" ? "blocks" : "related"}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="text-[11px] font-medium text-gray-700 flex-1 truncate">
                      {task.title}
                    </span>
                  </div>
                );
              })
            )}
        </div>
      </div>

      {/* Add Dependency Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[440px] border-gray-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-teal-500" />
              Add Dependency
            </DialogTitle>
            <DialogDescription className="text-[12px] text-gray-400">
              Define a dependency between two tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-gray-800">
                Source Task (blocks other)
              </Label>
              <Select value={sourceTask} onValueChange={setSourceTask}>
                <SelectTrigger className="h-9 text-[12px] border-gray-200">
                  <SelectValue placeholder="Select source task..." />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-gray-800">
                Target Task (is blocked)
              </Label>
              <Select value={targetTask} onValueChange={setTargetTask}>
                <SelectTrigger className="h-9 text-[12px] border-gray-200">
                  <SelectValue placeholder="Select target task..." />
                </SelectTrigger>
                <SelectContent>
                  {tasks
                    .filter((t) => t.id !== sourceTask)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-gray-800">
                Dependency Type
              </Label>
              <Select
                value={depType}
                onValueChange={(v) => setDepType(v as "blocks" | "related")}
              >
                <SelectTrigger className="h-9 text-[12px] border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocks">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-brown-500" />
                      Blocks (hard dependency)
                    </span>
                  </SelectItem>
                  <SelectItem value="related">
                    <span className="flex items-center gap-1.5">
                      <Link2 className="w-3 h-3 text-gray-400" />
                      Related (soft dependency)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient-primary"
              size="sm"
              onClick={handleAddDep}
              disabled={!sourceTask || !targetTask}
            >
              <Link2 className="w-3.5 h-3.5" />
              Add Dependency
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CHANGE SUMMARY TAB — C6: Plan Revision
   ══════════════════════════════════════════════════════════════ */

function ChangeSummaryView({
  tasks,
  milestones,
  plan,
}: {
  tasks: EditableTask[];
  milestones: EditableMilestone[];
  plan: DecompositionPlan;
}) {
  const newTasks = tasks.filter((t) => t.isNew);
  const modifiedTasks = tasks.filter((t) => t.isModified && !t.isNew);
  const newMilestones = milestones.filter((m) => m.isNew);
  const modifiedMilestones = milestones.filter((m) => m.isModified && !m.isNew);

  const totalNewSubtasks = tasks.reduce(
    (s, t) => s + t.subtasks.filter((st) => st.isNew).length,
    0
  );
  const totalModifiedSubtasks = tasks.reduce(
    (s, t) => s + t.subtasks.filter((st) => st.isModified && !st.isNew).length,
    0
  );

  const hasChanges =
    newTasks.length > 0 ||
    modifiedTasks.length > 0 ||
    newMilestones.length > 0 ||
    modifiedMilestones.length > 0 ||
    totalNewSubtasks > 0 ||
    totalModifiedSubtasks > 0;

  return (
    <motion.div variants={fadeUp} className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center">
          <History className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-gray-900">
            Change Summary
          </h3>
          <p className="text-[11px] text-gray-400">
            Version {plan.version} to v{plan.version + 1}-draft
          </p>
        </div>
      </div>

      {/* Change stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-forest-200/40 bg-forest-50/20 backdrop-blur-sm p-3 text-center">
          <p className="text-[22px] font-bold text-forest-700">
            {newTasks.length + newMilestones.length + totalNewSubtasks}
          </p>
          <p className="text-[10px] text-forest-600 font-medium">Items Added</p>
        </div>
        <div className="rounded-xl border border-gold-200/40 bg-gold-50/20 backdrop-blur-sm p-3 text-center">
          <p className="text-[22px] font-bold text-gold-700">
            {modifiedTasks.length + modifiedMilestones.length + totalModifiedSubtasks}
          </p>
          <p className="text-[10px] text-gold-600 font-medium">Items Modified</p>
        </div>
        <div className="rounded-xl border border-red-200/40 bg-red-50/20 backdrop-blur-sm p-3 text-center">
          <p className="text-[22px] font-bold text-red-600">0</p>
          <p className="text-[10px] text-red-500 font-medium">Items Removed</p>
        </div>
        <div className="rounded-xl border border-teal-200/40 bg-teal-50/20 backdrop-blur-sm p-3 text-center">
          <p className="text-[22px] font-bold text-teal-700">
            {tasks.reduce(
              (s, t) =>
                s +
                t.subtasks.filter(
                  (st) => st.itemStatus === "accepted" || st.itemStatus === "proposed"
                ).length,
              0
            )}
          </p>
          <p className="text-[10px] text-teal-600 font-medium">Total Subtasks</p>
        </div>
      </div>

      {/* Impact analysis */}
      {hasChanges && (
        <div className="rounded-xl border border-gold-200/40 bg-gold-50/20 backdrop-blur-sm p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-semibold text-gold-800">
              Impact Analysis
            </p>
            <p className="text-[11px] text-gold-600 mt-1">
              {modifiedTasks.length > 0
                ? `${modifiedTasks.length} tasks modified`
                : ""}
              {modifiedTasks.length > 0 && newTasks.length > 0 ? ", " : ""}
              {newTasks.length > 0
                ? `${newTasks.length} new task${newTasks.length > 1 ? "s" : ""} added`
                : ""}
              {(modifiedTasks.length > 0 || newTasks.length > 0) &&
              totalNewSubtasks > 0
                ? ", "
                : ""}
              {totalNewSubtasks > 0
                ? `${totalNewSubtasks} new subtask${totalNewSubtasks > 1 ? "s" : ""} added`
                : ""}
              .{" "}
              {modifiedTasks.length > 0 &&
                "Existing assignments may need reassignment."}
            </p>
          </div>
        </div>
      )}

      {/* Detailed change list */}
      <div className="card-parchment overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <p className="text-[12px] font-semibold text-gray-900">
            Detailed Changes
          </p>
        </div>
        <div className="p-4 space-y-2">
          {/* New milestones */}
          {newMilestones.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-forest-200/40 bg-forest-50/20"
            >
              <span className="inline-flex items-center text-[9px] font-semibold h-5 border border-forest-300 text-forest-600 bg-forest-50 px-2 rounded-full">
                Added
              </span>
              <Target className="w-3.5 h-3.5 text-forest-500" />
              <span className="text-[11px] font-medium text-gray-700">
                Milestone: {m.title}
              </span>
            </div>
          ))}

          {/* Modified milestones */}
          {modifiedMilestones.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gold-200/40 bg-gold-50/20"
            >
              <span className="inline-flex items-center text-[9px] font-semibold h-5 border border-gold-300 text-gold-600 bg-gold-50 px-2 rounded-full">
                Modified
              </span>
              <Target className="w-3.5 h-3.5 text-gold-500" />
              <span className="text-[11px] font-medium text-gray-700">
                Milestone: {m.title}
              </span>
            </div>
          ))}

          {/* New tasks */}
          {newTasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-forest-200/40 bg-forest-50/20"
            >
              <span className="inline-flex items-center text-[9px] font-semibold h-5 border border-forest-300 text-forest-600 bg-forest-50 px-2 rounded-full">
                Added
              </span>
              <FileEdit className="w-3.5 h-3.5 text-forest-500" />
              <span className="text-[11px] font-medium text-gray-700 flex-1 truncate">
                Task: {t.title || "(untitled)"}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {t.estimatedHours}h
              </span>
            </div>
          ))}

          {/* Modified tasks */}
          {modifiedTasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gold-200/40 bg-gold-50/20"
            >
              <span className="inline-flex items-center text-[9px] font-semibold h-5 border border-gold-300 text-gold-600 bg-gold-50 px-2 rounded-full">
                Modified
              </span>
              <FileEdit className="w-3.5 h-3.5 text-gold-500" />
              <span className="text-[11px] font-medium text-gray-700 flex-1 truncate">
                Task: {t.title}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {t.estimatedHours}h
              </span>
            </div>
          ))}

          {!hasChanges && (
            <div className="text-center py-8 text-[12px] text-gray-400">
              No changes made yet. Edit tasks above to see changes here.
            </div>
          )}
        </div>
      </div>

      {/* Version history */}
      <div className="card-parchment p-4 space-y-3">
        <p className="text-[12px] font-semibold text-gray-900 flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-gray-400" />
          Version History
        </p>
        <div className="space-y-2">
          {plan.version >= 1 && (
            <div
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-beige-200 to-beige-300 flex items-center justify-center shrink-0 text-[11px] font-bold text-brown-600">
                v{plan.version}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-800">
                    AI Decomposition Engine
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center text-[8px] font-semibold h-4 px-1.5 rounded-full border",
                      plan.status === "draft"
                        ? "border-gray-300 text-gray-400"
                        : "border-teal-300 text-teal-600"
                    )}
                  >
                    {plan.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Current version from API</p>
                <p className="text-[9px] text-gray-400 mt-1 font-mono">
                  {new Date(plan.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Current draft entry */}
          <div className="flex items-start gap-3 p-3 rounded-lg border border-gold-200/40 bg-gold-50/20">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-300 to-gold-400 flex items-center justify-center shrink-0 text-[11px] font-bold text-white">
              v{plan.version + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-800">
                  Current Session
                </span>
                <span className="inline-flex items-center text-[8px] font-semibold h-4 border border-gold-300 text-gold-600 bg-gold-50 px-1.5 rounded-full">
                  draft
                </span>
              </div>
              <p className="text-[10px] text-gold-600 mt-0.5">
                {hasChanges
                  ? `${newTasks.length + newMilestones.length} added, ${modifiedTasks.length + modifiedMilestones.length} modified`
                  : "No changes yet"}
              </p>
              <p className="text-[9px] text-gray-400 mt-1 font-mono">
                In progress...
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PLAN SUMMARY SIDEBAR
   ══════════════════════════════════════════════════════════════ */

function PlanSummarySidebar({
  tasks,
  milestones,
  plan,
}: {
  tasks: EditableTask[];
  milestones: EditableMilestone[];
  plan: DecompositionPlan;
}) {
  const totalTasks = tasks.length;
  const totalSubtasks = tasks.reduce((s, t) => s + t.subtasks.length, 0);
  const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);
  const totalSubtaskHours = tasks.reduce(
    (s, t) => s + t.subtasks.reduce((ss, st) => ss + st.estimatedHours, 0),
    0
  );
  const hourlyRate = plan.estimatedCost > 0 && plan.estimatedHours > 0
    ? plan.estimatedCost / plan.estimatedHours
    : 85;
  const estimatedCost = totalHours * hourlyRate;
  const costFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(estimatedCost);

  const allSkills = Array.from(
    new Set(tasks.flatMap((t) => t.skillsRequired.map((s) => s.name)))
  );

  return (
    <motion.div variants={slideInRight} className="space-y-5">
      <div className="card-parchment p-5 space-y-4 sticky top-4">
        <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-400" />
          Plan Summary
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-[12px] text-gray-500">Milestones</span>
            <span className="text-[16px] font-bold text-gray-900">
              {milestones.length}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-[12px] text-gray-500">Tasks</span>
            <span className="text-[16px] font-bold text-gray-900">
              {totalTasks}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-[12px] text-gray-500">Subtasks</span>
            <span className="text-[16px] font-bold text-gray-900">
              {totalSubtasks}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Total Hours
            </span>
            <span className="text-[16px] font-bold text-gray-900">
              {totalHours.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
              <DollarSign className="w-3 h-3" />
              Est. Cost
            </span>
            <span className="text-[16px] font-bold text-teal-700">
              {costFormatted}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              Critical Path
            </span>
            <span className="text-[16px] font-bold text-gold-600">
              {plan.criticalPathDuration.toLocaleString()}h
            </span>
          </div>
        </div>

        {/* Hours by milestone breakdown */}
        <div className="pt-3 border-t border-gray-100 space-y-2.5">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
            Hours by Milestone
          </p>
          {milestones.map((ms, msIdx) => {
            const msTasks = tasks.filter((t) => t.milestoneId === ms.id);
            const msHours = msTasks.reduce((s, t) => s + t.estimatedHours, 0);
            const pct = totalHours > 0 ? Math.round((msHours / totalHours) * 100) : 0;
            return (
              <div key={ms.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-700 font-semibold truncate pr-2">
                    {ms.title}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono shrink-0">
                    {msHours}h ({pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 bg-gradient-to-r",
                      milestoneColors[msIdx % milestoneColors.length]
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Required skills */}
        <div className="pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2">
            Required Skills ({allSkills.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allSkills.map((skill) => (
              <span
                key={skill}
                className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EDIT PLAN CONTENT — receives mapped data as props
   ══════════════════════════════════════════════════════════════ */

interface EditPlanContentProps {
  plan: DecompositionPlan;
  planId: string;
  initialTasks: EditableTask[];
  initialMilestones: EditableMilestone[];
}

function EditPlanContent({ plan, planId, initialTasks, initialMilestones }: EditPlanContentProps) {
  const router = useRouter();
  const qc = useQueryClient();

  const isApproved = plan.status === "approved" || plan.status === "completed" || plan.status === "in_progress" || plan.status === "ai_review_in_progress";
  const [showRevisionWarning, setShowRevisionWarning] = React.useState(isApproved);

  const [aiReviewOpen, setAiReviewOpen] = React.useState(false);
  const [aiReviewStage, setAiReviewStage] = React.useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);
  const [submitReviewError, setSubmitReviewError] = React.useState<string | null>(null);
  const aiReviewStages = [
    { icon: Layers,      label: "Analyzing plan structure…" },
    { icon: Search,      label: "Checking task dependencies…" },
    { icon: ShieldCheck, label: "Compliance & risk review…" },
    { icon: FileText,    label: "Generating AI insights…" },
  ];

  const [editableTasks, setEditableTasks] = React.useState<EditableTask[]>(initialTasks);
  const [editableMilestones, setEditableMilestones] = React.useState<EditableMilestone[]>(initialMilestones);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Snapshot of initial tasks for diffing deletions on save
  const initialTasksRef = React.useRef<EditableTask[]>(initialTasks);

  React.useEffect(() => {
    setEditableTasks(initialTasks);
    initialTasksRef.current = initialTasks;
  }, [initialTasks]);
  React.useEffect(() => { setEditableMilestones(initialMilestones); }, [initialMilestones]);

  async function handleSaveDraft() {
    setIsSaving(true);
    setSaveError(null);
    try {
      const original = initialTasksRef.current;
      const originalTaskIds = new Set(original.filter((t) => !t.isNew).map((t) => t.id));
      const currentTaskIds = new Set(editableTasks.map((t) => t.id));

      // 1. Delete removed tasks (existed originally, no longer in current state)
      const deletedTaskIds = [...originalTaskIds].filter((id) => !currentTaskIds.has(id));
      await Promise.allSettled(deletedTaskIds.map((id) => deleteEnterpriseTask(planId, id)));

      // 2. PATCH modified existing tasks in parallel
      const modifiedTasks = editableTasks.filter((t) => t.isModified && !t.isNew);
      await Promise.allSettled(
        modifiedTasks.map((t) =>
          patchEnterpriseTask(planId, t.id, {
            title: t.title,
            priority: t.priority,
            effort: t.estimatedHours,
            skills: t.skillsRequired.map((s) => s.name),
            description: t.description,
            acceptance_criteria: t.acceptanceCriteria,
          })
        )
      );

      // 3. POST new tasks sequentially (need returned ID for subtasks)
      const newTasks = editableTasks.filter((t) => t.isNew);
      for (const task of newTasks) {
        const res = await postEnterpriseTask(planId, {
          task_name: task.title,
          milestone_id: task.milestoneId,
          priority: task.priority,
          effort: task.estimatedHours,
          skills: task.skillsRequired.map((s) => s.name),
          description: task.description,
          acceptance_criteria: task.acceptanceCriteria,
        });
        // Extract the real task ID from the response to attach subtasks
        const resData = res?.data as Record<string, unknown> | null | undefined;
        const newTaskId = (resData?.task_id ?? resData?.id ?? resData?._id) as string | undefined;
        if (newTaskId && task.subtasks.length > 0) {
          await Promise.allSettled(
            task.subtasks.map((st) =>
              postEnterpriseSubtask(planId, newTaskId, {
                title: st.title,
                estimated_hours: st.estimatedHours,
              })
            )
          );
        }
      }

      // 4. Handle subtask changes on existing tasks
      const originalMap = new Map(original.map((t) => [t.id, t]));
      for (const task of editableTasks.filter((t) => !t.isNew)) {
        const orig = originalMap.get(task.id);
        if (!orig) continue;

        const origSubtaskIds = new Set(orig.subtasks.map((st) => (st as { id: string }).id));
        const curSubtaskIds = new Set(task.subtasks.map((st) => st.id));

        const deletedSubtaskIds = [...origSubtaskIds].filter((id) => !curSubtaskIds.has(id));
        const newSubtasks = task.subtasks.filter((st) => st.isNew);
        const modifiedSubtasks = task.subtasks.filter((st) => st.isModified && !st.isNew);

        await Promise.allSettled([
          ...deletedSubtaskIds.map((stId) => deleteEnterpriseSubtask(planId, task.id, stId)),
          ...newSubtasks.map((st) =>
            postEnterpriseSubtask(planId, task.id, {
              title: st.title,
              estimated_hours: st.estimatedHours,
            })
          ),
          ...modifiedSubtasks.map((st) =>
            patchEnterpriseSubtask(planId, task.id, st.id, {
              title: st.title,
              estimated_hours: st.estimatedHours,
            })
          ),
        ]);
      }

      // 5. Invalidate cache so the page reflects updated data
      qc.invalidateQueries({ queryKey: decompositionKeys.tasks(planId) });
      qc.invalidateQueries({ queryKey: decompositionKeys.plan(planId) });
      qc.invalidateQueries({ queryKey: decompositionKeys.milestones(planId) });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const [activeTab, setActiveTab] = React.useState("tasks");

  async function handleSubmitAiReview() {
    setIsSubmittingReview(true);
    setSubmitReviewError(null);
    setAiReviewOpen(true);
    setAiReviewStage(0);

    try {
      await postEnterpriseSubmitForReview(planId);

      qc.invalidateQueries({ queryKey: decompositionKeys.plan(planId) });
      qc.invalidateQueries({ queryKey: decompositionKeys.tasks(planId) });
      qc.invalidateQueries({ queryKey: decompositionKeys.plans() });

      let stage = 0;
      const interval = setInterval(() => {
        stage += 1;
        setAiReviewStage(stage);
        if (stage >= aiReviewStages.length) {
          clearInterval(interval);
          setTimeout(() => {
            setAiReviewOpen(false);
            router.push(`/enterprise/decomposition/${planId}`);
          }, 600);
        }
      }, 900);
    } catch (err) {
      setAiReviewOpen(false);
      setSubmitReviewError(err instanceof Error ? err.message : "Failed to submit for AI review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  const handleUpdateTask = (updated: EditableTask) => {
    setEditableTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDeleteTask = (taskId: string) => {
    setEditableTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleAddTask = (milestoneId: string) => {
    const msIdx = editableMilestones.findIndex((m) => m.id === milestoneId);
    const existingTasks = editableTasks.filter((t) => t.milestoneId === milestoneId);
    const newTask: EditableTask = {
      id: `task-new-${Date.now()}`,
      planId: plan.id,
      milestoneId,
      title: "",
      description: "",
      status: "backlog",
      priority: "medium",
      estimatedHours: 40,
      skillsRequired: [],
      dependencies: [],
      phase: msIdx + 1,
      order: existingTasks.length + 1,
      aiConfidence: 0,
      itemStatus: "proposed",
      acceptanceCriteria: [],
      subtasks: [],
      isNew: true,
    };
    setEditableTasks((prev) => [...prev, newTask]);
  };

  const handleAddMilestone = () => {
    const newMs: EditableMilestone = {
      id: `pm-new-${Date.now()}`,
      planId: plan.id,
      title: "New Milestone",
      description: "",
      order: editableMilestones.length + 1,
      isNew: true,
    };
    setEditableMilestones((prev) => [...prev, newMs]);
  };

  const handleUpdateMilestone = (updated: EditableMilestone) => {
    setEditableMilestones((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleAddDependency = (sourceId: string, targetId: string, type: "blocks" | "related") => {
    setEditableTasks((prev) =>
      prev.map((t) =>
        t.id === targetId
          ? { ...t, dependencies: [...t.dependencies, { targetId: sourceId, type }], isModified: true }
          : t
      )
    );
  };

  const newTasksCount = editableTasks.filter((t) => t.isNew).length;
  const modifiedTasksCount = editableTasks.filter((t) => t.isModified && !t.isNew).length;
  const totalChanges = newTasksCount + modifiedTasksCount;

  return (
    <>
      {/* C6: Revision warning modal */}
      <Dialog open={showRevisionWarning} onOpenChange={setShowRevisionWarning}>
        <DialogContent className="sm:max-w-[480px] border-gray-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gold-500" />
              Editing an Approved Plan
            </DialogTitle>
            <DialogDescription className="text-[12px] text-gray-500 mt-2 leading-relaxed">
              Editing an approved plan will create a new version and require
              re-approval. Existing assignments may be affected.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-gold-200/40 bg-gold-50/20 p-3 my-2">
            <div className="flex items-center gap-2 text-[11px] text-gold-700">
              <History className="w-3.5 h-3.5" />
              <span className="font-semibold">
                Current version: v{plan.version}
              </span>
              <ArrowRight className="w-3 h-3 text-gold-400" />
              <span className="font-semibold">
                New draft: v{plan.version + 1}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Link href={`/enterprise/decomposition/${plan.id}`}>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              variant="gradient-primary"
              size="sm"
              onClick={() => setShowRevisionWarning(false)}
            >
              <FileEdit className="w-3.5 h-3.5" />
              Confirm Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ AI Reviewing overlay ═══ */}
      <AnimatePresence>
        {aiReviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="w-[460px] max-w-[92vw] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200"
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-brown-50 via-white to-amber-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-brown-500 to-brown-700 flex items-center justify-center shadow-lg">
                    <Bot className="w-6 h-6 text-white" />
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-brown-400"
                      animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-heading font-bold text-gray-900">
                      AI Reviewing Your Plan
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Analyzing structure, dependencies & compliance…
                    </p>
                  </div>
                </div>
              </div>

              {/* Stages */}
              <div className="px-6 py-5 space-y-3">
                {aiReviewStages.map((stage, idx) => {
                  const done = idx < aiReviewStage;
                  const active = idx === aiReviewStage;
                  const Icon = stage.icon;
                  return (
                    <div key={stage.label} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all",
                          done && "bg-gradient-to-br from-forest-500 to-teal-500 text-white",
                          active && "bg-brown-100 text-brown-700",
                          !done && !active && "bg-gray-100 text-gray-400"
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : active ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[12.5px] font-medium transition-colors",
                          done && "text-forest-700",
                          active && "text-gray-900",
                          !done && !active && "text-gray-400"
                        )}
                      >
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="px-6 pb-5">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-brown-500 to-amber-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (aiReviewStage / aiReviewStages.length) * 100)}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  Redirecting to Task Breakdown when complete…
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main page */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-[1400px] mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-gold-50 text-gold-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                  Editing
                </span>
                <span className="inline-flex items-center text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  v{plan.version} → v{plan.version + 1}-draft
                </span>
              </div>
              <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">Edit Plan</h1>
              <p className="text-[12px] text-gray-400 mt-2">{plan.title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/enterprise/decomposition/${plan.id}`}>
                <button className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                  <X className="w-3 h-3" /> Cancel
                </button>
              </Link>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                {isSaving ? "Saving…" : "Save Draft"}
              </button>
              <button
                onClick={handleSubmitAiReview}
                disabled={isSubmittingReview}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReview ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {isSubmittingReview ? "Submitting…" : "Submit AI Review"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Save error banner */}
        {saveError && (
          <motion.div variants={fadeUp} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[12px]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{saveError}</span>
            <button onClick={() => setSaveError(null)} className="shrink-0 text-red-400 hover:text-red-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* Submit AI review error banner */}
        {submitReviewError && (
          <motion.div variants={fadeUp} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[12px]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{submitReviewError}</span>
            <button onClick={() => setSubmitReviewError(null)} className="shrink-0 text-red-400 hover:text-red-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div variants={fadeUp}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-gray-100 border border-gray-200 p-1 rounded-xl">
              <TabsTrigger
                value="tasks"
                className="text-[12px] rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm px-4"
              >
                <FileEdit className="w-3.5 h-3.5 mr-1.5" />
                Tasks
              </TabsTrigger>
              <TabsTrigger
                value="dependencies"
                className="text-[12px] rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm px-4"
              >
                <GitBranch className="w-3.5 h-3.5 mr-1.5" />
                Dependencies
              </TabsTrigger>
              <TabsTrigger
                value="changes"
                className="text-[12px] rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm px-4"
              >
                <History className="w-3.5 h-3.5 mr-1.5" />
                Change Summary
                {totalChanges > 0 && (
                  <span className="ml-1.5 text-[9px] font-bold bg-gold-400 text-white rounded-full w-4 h-4 inline-flex items-center justify-center">
                    {totalChanges}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mt-5">
              {/* Left: Main content (3/4) */}
              <div className="lg:col-span-3">
                <TabsContent value="tasks" className="mt-0 space-y-6">
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                  >
                    {editableMilestones
                      .sort((a, b) => a.order - b.order)
                      .map((ms, idx) => (
                        <EditableMilestoneGroup
                          key={ms.id}
                          milestone={ms}
                          milestoneIndex={idx}
                          tasks={editableTasks
                            .filter((t) => t.milestoneId === ms.id)
                            .sort((a, b) => a.order - b.order)}
                          allTasks={editableTasks}
                          onUpdateMilestone={handleUpdateMilestone}
                          onUpdateTask={handleUpdateTask}
                          onDeleteTask={handleDeleteTask}
                          onAddTask={handleAddTask}
                        />
                      ))}

                    {/* Add new milestone */}
                    <motion.div variants={fadeUp}>
                      <button
                        onClick={handleAddMilestone}
                        className="flex items-center gap-2 w-full py-4 px-5 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all text-[13px] font-semibold"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Milestone
                      </button>
                    </motion.div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="dependencies" className="mt-0">
                  <DependencyView
                    tasks={editableTasks}
                    milestones={editableMilestones}
                    onAddDependency={handleAddDependency}
                  />
                </TabsContent>

                <TabsContent value="changes" className="mt-0">
                  <ChangeSummaryView
                    tasks={editableTasks}
                    milestones={editableMilestones}
                    plan={plan}
                  />
                </TabsContent>
              </div>

              {/* Right: Sidebar (1/4) */}
              <PlanSummarySidebar
                tasks={editableTasks}
                milestones={editableMilestones}
                plan={plan}
              />
            </div>
          </Tabs>
        </motion.div>
      </motion.div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE — fetches data, maps it, passes as props
   ══════════════════════════════════════════════════════════════ */

export default function EditDecompositionPage() {
  const params = useParams();
  const planId = params.planId as string;

  const { data: apiPlanRes, isLoading: planLoading } = useDecompositionPlan(planId);
  const { data: apiTasksRes, isLoading: tasksLoading } = useTasks(planId);
  const { data: apiMilestonesRes, isLoading: milestonesLoading } = useMilestones(planId);

  const plan = React.useMemo(() => {
    const resp = apiPlanRes as unknown as Record<string, unknown> | null;
    if (!resp) return null;

    // Unwrap: { data: { plan_id/id/_id } } OR { data: { plan: {...} } } OR plan directly
    let raw: Record<string, unknown> | null = null;
    if (resp.data && typeof resp.data === "object") {
      const d = resp.data as Record<string, unknown>;
      if (d.plan_id || d._id || d.id) {
        raw = d;
      } else if (d.plan && typeof d.plan === "object") {
        raw = d.plan as Record<string, unknown>;
      }
    }
    if (!raw && (resp.plan_id || resp._id || resp.id)) {
      raw = resp;
    }
    if (!raw) return null;

    return {
      id: (raw.plan_id ?? raw._id ?? raw.id ?? planId) as string,
      sowId: (raw.sow_id ?? raw.sowId ?? "") as string,
      title: (raw.title ?? raw.project_name ?? "Untitled Plan") as string,
      status: (raw.status ?? "draft") as PlanStatus,
      createdAt: (raw.created_at ?? raw.createdAt ?? new Date().toISOString()) as string,
      updatedAt: (raw.updated_at ?? raw.updatedAt ?? new Date().toISOString()) as string,
      totalTasks: Number(raw.total_tasks ?? raw.totalTasks ?? 0),
      totalSubtasks: Number(raw.total_subtasks ?? raw.totalSubtasks ?? 0),
      totalMilestones: Number(raw.total_milestones ?? raw.totalMilestones ?? 0),
      estimatedHours: Number(raw.estimated_hours ?? raw.estimatedHours ?? 0),
      estimatedCost: Number(raw.estimated_cost ?? raw.estimatedCost ?? 0),
      complexity: (raw.complexity ?? "medium") as "low" | "medium" | "high" | "critical",
      version: Number(raw.version ?? 1),
      teamId: (raw.team_id ?? raw.teamId) as string | undefined,
      projectId: (raw.project_id ?? raw.projectId) as string | undefined,
      aiConfidence: Number(raw.ai_confidence ?? raw.aiConfidence ?? 0),
      criticalPathDuration: Number(raw.critical_path_duration ?? raw.criticalPathDuration ?? 0),
      uniqueSkills: Number(raw.unique_skills ?? raw.uniqueSkills ?? 0),
      dependencyCount: Number(raw.dependency_count ?? raw.dependencyCount ?? 0),
    } as DecompositionPlan;
  }, [apiPlanRes, planId]);

  const initialTasks = React.useMemo((): EditableTask[] => {
    const resp = apiTasksRes as unknown as Record<string, unknown> | null;
    let arr: Record<string, unknown>[] | null = null;
    if (Array.isArray(resp)) {
      arr = resp;
    } else if (resp) {
      const d = resp.data;
      if (Array.isArray(d)) arr = d;
      else if (d && typeof d === "object") {
        const inner = (d as Record<string, unknown>).tasks;
        if (Array.isArray(inner)) arr = inner;
      } else if (Array.isArray(resp.tasks)) {
        arr = resp.tasks as Record<string, unknown>[];
      }
    }
    if (!arr || arr.length === 0) return [];
    return arr.map((t, idx) => {
      const rawSkills = t.skills ?? t.skills_required ?? t.skillsRequired;
      const skillsRequired: SkillTag[] = Array.isArray(rawSkills)
        ? (rawSkills as string[]).map((s) => ({ name: s, source: "manual" as const }))
        : rawSkills && typeof rawSkills === "string"
          ? [{ name: rawSkills as string, source: "manual" as const }]
          : [];
      return {
        id: String(t.task_id ?? t._id ?? t.id ?? idx),
        planId: (t.plan_id ?? t.planId ?? planId) as string,
        milestoneId: (t.milestone ?? t.milestone_id ?? t.milestoneId ?? "") as string,
        title: (t.task_name ?? t.title ?? "") as string,
        description: (t.description ?? "") as string,
        status: (t.status ?? "backlog") as DecompositionTask["status"],
        priority: (t.critical ? "high" : (t.priority ?? "medium")) as DecompositionTask["priority"],
        estimatedHours: Number(t.effort ?? t.estimated_hours ?? t.estimatedHours ?? 0),
        skillsRequired,
        dependencies: (t.dependencies ?? []) as TaskDependency[],
        phase: Number(t.phase ?? 1),
        order: Number(t.order ?? idx),
        assigneeId: (t.assignee_id ?? t.assigneeId) as string | undefined,
        acceptanceCriteria: (t.acceptance_criteria ?? t.acceptanceCriteria ?? []) as string[],
        aiConfidence: Number(t.ai_confidence ?? t.aiConfidence ?? 0),
        itemStatus: (t.item_status ?? t.itemStatus ?? "proposed") as DecompositionTask["itemStatus"],
        subtasks: ((t.subtasks ?? []) as Subtask[]).map((st) => ({ ...st })),
      };
    });
  }, [apiTasksRes, planId]);

  const initialMilestones = React.useMemo((): EditableMilestone[] => {
    const resp = apiMilestonesRes as unknown as Record<string, unknown> | null;
    if (!resp) return [];

    // Locate the milestones value — could be under .data.milestones, .milestones, or .data
    let milestonesValue: unknown =
      (resp.data && typeof resp.data === "object"
        ? (resp.data as Record<string, unknown>).milestones ?? resp.data
        : null) ?? resp.milestones ?? null;

    // Case 1: plain array  [{ id, title, ... }]
    if (Array.isArray(milestonesValue)) {
      return (milestonesValue as Record<string, unknown>[]).map((m, idx) => ({
        id: (m.milestone_id ?? m._id ?? m.id ?? String(idx)) as string,
        planId: (m.plan_id ?? m.planId ?? planId) as string,
        title: (m.title ?? m.name ?? String(idx)) as string,
        description: (m.description ?? "") as string,
        order: Number(m.order ?? idx),
      }));
    }

    // Case 2: dict keyed by milestone name  { "M1": [...], "M2": [...] }
    if (milestonesValue && typeof milestonesValue === "object" && !Array.isArray(milestonesValue)) {
      return Object.keys(milestonesValue as Record<string, unknown>).map((key, idx) => ({
        id: key,
        planId,
        title: key,
        description: "",
        order: idx,
      }));
    }

    return [];
  }, [apiMilestonesRes, planId]);

  const isLoading = planLoading || tasksLoading || milestonesLoading;

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6 animate-pulse">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-24 bg-gray-200 rounded-full" />
            <div className="h-8 w-64 bg-gray-200 rounded-lg" />
            <div className="h-3 w-48 bg-gray-100 rounded-full" />
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="h-9 w-20 bg-gray-100 rounded-xl" />
            <div className="h-9 w-24 bg-gray-100 rounded-xl" />
            <div className="h-9 w-36 bg-gray-200 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="lg:col-span-3 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="h-5 w-48 bg-gray-200 rounded-lg" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-3/4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 h-fit">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between border-b border-gray-100 pb-2">
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-3 w-10 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Network className="w-10 h-10 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Plan not found</h2>
        <p className="text-sm text-gray-500 mb-4">The decomposition plan could not be loaded.</p>
        <Link href="/enterprise/decomposition" className="text-sm text-brown-500 hover:text-brown-600 font-medium">Back to plans</Link>
      </div>
    );
  }

  return (
    <EditPlanContent
      plan={plan}
      planId={planId}
      initialTasks={initialTasks}
      initialMilestones={initialMilestones}
    />
  );
}
