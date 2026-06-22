"use client";

import * as React from "react";
import { ShieldAlert, AlertTriangle, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type {
  ExceptionType,
  ExceptionSeverity,
  RaiseEscalationPayload,
} from "@/types/enterprise";

interface MilestoneOption {
  id: string;
  title: string;
  projectId: string;
}

interface RaiseEscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: RaiseEscalationPayload) => void;
  /** Pre-populated project context */
  prefilledProjectId?: string;
  prefilledProjectName?: string;
  prefilledMilestoneId?: string;
  prefilledMilestoneName?: string;
  prefilledTaskId?: string;
  prefilledTaskName?: string;
  /** Available projects for dropdown */
  projects: { id: string; name: string }[];
  /** Available milestones for dropdown (filtered by project) */
  milestones?: MilestoneOption[];
}

const exceptionTypes: { value: ExceptionType; label: string }[] = [
  { value: "escalation", label: "Escalation" },
  { value: "sla_breach", label: "SLA Breach" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "overdue", label: "Overdue Task" },
  { value: "payment_delay", label: "Payment Delay" },
];

const severityLevels: { value: ExceptionSeverity; label: string; color: string; description: string }[] = [
  { value: "critical", label: "Critical", color: "border-red-600 bg-red-50 text-red-800", description: "Immediate governance intervention required" },
  { value: "high", label: "High", color: "border-danger bg-danger/10 text-danger", description: "Requires urgent attention within 24h" },
  { value: "medium", label: "Medium", color: "border-gold-500 bg-gold-50 text-gold-700", description: "Should be reviewed within 48h" },
];

export function RaiseEscalationModal({
  isOpen,
  onClose,
  onSubmit,
  prefilledProjectId,
  prefilledProjectName,
  prefilledMilestoneId,
  prefilledTaskName,
  projects,
  milestones = [],
}: RaiseEscalationModalProps) {
  const [type, setType] = React.useState<ExceptionType>("escalation");
  const [severity, setSeverity] = React.useState<ExceptionSeverity>("high");
  const [projectId, setProjectId] = React.useState(prefilledProjectId ?? "");
  const [milestoneId, setMilestoneId] = React.useState(prefilledMilestoneId ?? "");
  const [taskName, setTaskName] = React.useState(prefilledTaskName ?? "");
  const [description, setDescription] = React.useState("");
  const [expectedDate, setExpectedDate] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  /* Milestones filtered by selected project */
  const projectMilestones = React.useMemo(
    () => milestones.filter((m) => m.projectId === projectId),
    [milestones, projectId]
  );

  React.useEffect(() => {
    if (isOpen) {
      setType("escalation");
      setSeverity("high");
      setProjectId(prefilledProjectId ?? "");
      setMilestoneId(prefilledMilestoneId ?? "");
      setTaskName(prefilledTaskName ?? "");
      setDescription("");
      setExpectedDate("");
      setErrors({});
    }
  }, [isOpen, prefilledProjectId, prefilledMilestoneId, prefilledTaskName]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!projectId) errs.projectId = "Project is required";
    if (description.trim().length < 20)
      errs.description = "Description must be at least 20 characters";
    if (expectedDate) {
      const d = new Date(expectedDate);
      if (d <= new Date()) errs.expectedDate = "Expected resolution date must be in the future";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      type,
      severity,
      projectId,
      milestoneId: milestoneId || undefined,
      taskId: taskName.trim() || undefined,
      description: description.trim(),
      expectedResolutionDate: expectedDate || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-danger to-danger-dark flex items-center justify-center text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-brown-900">
                Raise Exception
              </DialogTitle>
              <DialogDescription className="text-[12px] text-beige-500">
                {prefilledProjectName
                  ? `For: ${prefilledProjectName}`
                  : "Create a new exception across any project"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Warning banner */}
          <div className="rounded-lg bg-gold-50 border border-gold-200 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gold-700">
              This will create a formal exception requiring governance review. SLA timers begin
              immediately upon creation.
            </p>
          </div>

          {/* Exception Type */}
          <div>
            <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
              Exception Type <span className="text-danger">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ExceptionType)}
              className="w-full h-10 rounded-xl border border-beige-200/60 bg-white/60 px-3 text-[13px] text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-200/40"
            >
              {exceptionTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
              Severity <span className="text-danger">*</span>
            </label>
            <div className="space-y-2">
              {severityLevels.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border-2 transition-all",
                    severity === s.value
                      ? s.color
                      : "border-beige-200/60 bg-white/40 text-brown-700 hover:border-beige-300"
                  )}
                >
                  <span className="text-[13px] font-semibold">{s.label}</span>
                  <span className="text-[11px] ml-2 opacity-70">{s.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          <div>
            <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
              Project <span className="text-danger">*</span>
            </label>
            {prefilledProjectId ? (
              <div className="h-10 rounded-xl border border-beige-200/60 bg-beige-50 px-3 flex items-center text-[13px] text-brown-700">
                {prefilledProjectName}
              </div>
            ) : (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={cn(
                  "w-full h-10 rounded-xl border bg-white/60 px-3 text-[13px] text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-200/40",
                  errors.projectId ? "border-danger" : "border-beige-200/60"
                )}
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            {errors.projectId && (
              <p className="text-[11px] text-danger mt-1">{errors.projectId}</p>
            )}
          </div>

          {/* Milestone — pre-populated or dropdown */}
          <div>
            <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
              Affected Milestone
              <span className="text-beige-400 font-normal ml-1">(optional)</span>
            </label>
            {prefilledMilestoneId ? (
              <div className="h-10 rounded-xl border border-beige-200/60 bg-beige-50 px-3 flex items-center text-[13px] text-brown-700">
                {prefilledMilestoneId}
              </div>
            ) : (
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                disabled={!projectId}
                className="w-full h-10 rounded-xl border border-beige-200/60 bg-white/60 px-3 text-[13px] text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-200/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{projectId ? "Select a milestone..." : "Select a project first"}</option>
                {projectMilestones.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Task — pre-populated or free-text input */}
          <div>
            <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
              Affected Task
              <span className="text-beige-400 font-normal ml-1">(optional)</span>
            </label>
            {prefilledTaskName ? (
              <div className="h-10 rounded-xl border border-beige-200/60 bg-beige-50 px-3 flex items-center text-[13px] text-brown-700">
                {prefilledTaskName}
              </div>
            ) : (
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Enter task name or ID..."
                className="w-full h-10 rounded-xl border border-beige-200/60 bg-white/60 px-3 text-[13px] text-brown-800 placeholder:text-beige-400 focus:outline-none focus:ring-2 focus:ring-brown-200/40"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
              Description <span className="text-danger">*</span>
              <span className="text-beige-400 font-normal ml-1">(min 20 characters)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
              }}
              placeholder="Describe the issue requiring escalation in detail..."
              className={cn(
                "w-full min-h-[100px] rounded-xl border bg-white/60 p-3 text-[13px] text-brown-800 placeholder:text-beige-400 transition-all resize-none",
                errors.description
                  ? "border-danger focus:ring-2 focus:ring-danger/20"
                  : "border-beige-200/60 focus:ring-2 focus:ring-brown-200/40 focus:border-brown-200/60 focus:bg-white/80"
              )}
            />
            <div className="flex items-center justify-between mt-1">
              <span className={cn("text-[11px]", errors.description ? "text-danger" : "text-beige-400")}>
                {errors.description || `${description.length} characters`}
              </span>
              <span className={cn("text-[11px]", description.length >= 20 ? "text-forest-600" : "text-beige-400")}>
                {description.length >= 20 ? "✓ Valid" : `${20 - description.length} more needed`}
              </span>
            </div>
          </div>

          {/* Expected Resolution Date */}
          <div>
            <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
              Expected Resolution Date
              <span className="text-beige-400 font-normal ml-1">(optional)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige-400 pointer-events-none" />
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => {
                  setExpectedDate(e.target.value);
                  if (errors.expectedDate) setErrors((prev) => ({ ...prev, expectedDate: "" }));
                }}
                min={new Date().toISOString().split("T")[0]}
                className={cn(
                  "w-full h-10 rounded-xl border bg-white/60 pl-10 pr-3 text-[13px] text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-200/40",
                  errors.expectedDate ? "border-danger" : "border-beige-200/60"
                )}
              />
            </div>
            {errors.expectedDate && (
              <p className="text-[11px] text-danger mt-1">{errors.expectedDate}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={description.trim().length < 20 || !projectId}
            className="flex-1 bg-gradient-to-r from-danger to-danger-dark hover:opacity-90"
          >
            Raise Exception
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
