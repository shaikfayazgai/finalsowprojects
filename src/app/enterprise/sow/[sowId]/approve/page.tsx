"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  DollarSign,
  Clock,
  Users,
  Sparkles,
  BookOpen,
  Layers,
  Pen,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import { Badge, Button, Checkbox, Textarea } from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { mockSOWs, mockSOWSections } from "@/mocks/data/enterprise-sow";

const statusVariantMap: Record<string, "beige" | "gold" | "teal" | "forest" | "brown"> = {
  draft: "beige",
  approved: "forest",
};

const checklistItems = [
  {
    id: "sections",
    label: "All sections reviewed",
    description: "Every parsed section has been read and verified",
    icon: BookOpen,
  },
  {
    id: "budget",
    label: "Budget approved",
    description: "Estimated budget aligns with procurement limits",
    icon: DollarSign,
  },
  {
    id: "timeline",
    label: "Timeline confirmed",
    description: "Milestone dates are feasible and agreed upon",
    icon: Clock,
  },
  {
    id: "team",
    label: "Team requirements verified",
    description: "Skill requirements and headcount are adequate",
    icon: Users,
  },
  {
    id: "risk",
    label: "Risk assessment reviewed",
    description: "All identified risks have mitigation strategies",
    icon: Shield,
  },
];

export default function SOWApprovePage() {
  const params = useParams();
  const sowId = params.sowId as string;
  const sow = mockSOWs.find((s) => s.id === sowId) || mockSOWs[0];
  const sections = mockSOWSections.filter((s) => s.sowId === sow.id);

  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  const [comments, setComments] = React.useState("");

  const allChecked = checklistItems.every((item) => checked[item.id]);
  const checkedCount = checklistItems.filter((item) => checked[item.id]).length;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-5"
    >
      {/* Back Link */}
      <motion.div variants={fadeUp}>
        <Link
          href={`/enterprise/sow/${sow.id}`}
          className="inline-flex items-center gap-2 text-sm text-beige-600 hover:text-brown-700 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to {sow.title}
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-brown-900 tracking-tight font-heading">
            Approve SOW
          </h1>
          <Badge variant={statusVariantMap[sow.status]} size="md" dot>
            {sow.status.charAt(0).toUpperCase() + sow.status.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-beige-600">
          {sow.title} — {sow.client}
        </p>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT — Approval Form (2/3) */}
        <motion.div
          variants={stagger}
          className="lg:col-span-2 space-y-5"
        >
          {/* Progress Indicator */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-brown-900">
                Approval Progress
              </h2>
              <span className="text-[12px] font-semibold text-beige-500">
                {checkedCount}/{checklistItems.length} completed
              </span>
            </div>
            <div className="h-2 rounded-full bg-beige-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  allChecked
                    ? "bg-gradient-to-r from-forest-500 to-teal-500"
                    : "bg-gradient-to-r from-brown-400 to-brown-500"
                )}
                style={{
                  width: `${(checkedCount / checklistItems.length) * 100}%`,
                }}
              />
            </div>
          </motion.div>

          {/* Approval Checklist */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
          >
            <h2 className="text-[14px] font-semibold text-brown-900 mb-4">
              Approval Checklist
            </h2>
            <div className="space-y-1">
              {checklistItems.map((item) => {
                const Icon = item.icon;
                const isChecked = !!checked[item.id];

                return (
                  <label
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3.5 rounded-xl p-3.5 cursor-pointer transition-all duration-200",
                      isChecked
                        ? "bg-forest-50/50 border border-forest-200/50"
                        : "hover:bg-beige-50/60 border border-transparent"
                    )}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(val) =>
                        setChecked((prev) => ({
                          ...prev,
                          [item.id]: !!val,
                        }))
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={cn(
                            "w-3.5 h-3.5",
                            isChecked ? "text-forest-600" : "text-beige-400"
                          )}
                        />
                        <span
                          className={cn(
                            "text-[13px] font-semibold transition-colors",
                            isChecked ? "text-forest-800" : "text-brown-800"
                          )}
                        >
                          {item.label}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-[11px] mt-0.5 ml-5.5",
                          isChecked ? "text-forest-600" : "text-beige-500"
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                    {isChecked && (
                      <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0 mt-0.5" />
                    )}
                  </label>
                );
              })}
            </div>
          </motion.div>

          {/* Comments */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
          >
            <h2 className="text-[14px] font-semibold text-brown-900 mb-3">
              Comments & Notes
            </h2>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any approval notes, conditions, or comments..."
              className="min-h-[120px]"
            />
          </motion.div>

          {/* Sign-off Section */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
          >
            <h2 className="text-[14px] font-semibold text-brown-900 mb-4">
              Sign-off
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[12px] font-semibold text-beige-600 uppercase tracking-wider block mb-1.5">
                  Approver Name
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-beige-200 bg-beige-50/60 px-4 py-2.5">
                  <User className="w-4 h-4 text-beige-400" />
                  <span className="text-sm text-brown-800 font-medium">
                    Priya Nair
                  </span>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-beige-600 uppercase tracking-wider block mb-1.5">
                  Role
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-beige-200 bg-beige-50/60 px-4 py-2.5">
                  <Shield className="w-4 h-4 text-beige-400" />
                  <span className="text-sm text-brown-800 font-medium">
                    Enterprise Owner
                  </span>
                </div>
              </div>
            </div>

            {/* Digital Signature Placeholder */}
            <div>
              <label className="text-[12px] font-semibold text-beige-600 uppercase tracking-wider block mb-1.5">
                Digital Signature
              </label>
              <div className="rounded-xl border-2 border-dashed border-beige-200 bg-beige-50/30 h-24 flex items-center justify-center">
                <div className="flex items-center gap-2 text-beige-400">
                  <Pen className="w-4 h-4" />
                  <span className="text-sm">
                    Click to add digital signature
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <Button
              variant="gradient-primary"
              size="lg"
              className="flex-1"
              disabled={!allChecked}
            >
              <CheckCircle2 className="w-4 h-4" />
              {allChecked ? "Approve SOW" : `Complete checklist (${checkedCount}/${checklistItems.length})`}
            </Button>
            <Button variant="outline" size="lg" className="flex-1">
              <AlertTriangle className="w-4 h-4" />
              Request Changes
            </Button>
          </motion.div>
        </motion.div>

        {/* RIGHT — SOW Summary Sidebar (1/3) */}
        <motion.div variants={slideInRight} className="space-y-4">
          {/* SOW Quick Summary */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-4">
              SOW Summary
            </h3>
            <div className="space-y-3">
              {[
                { label: "Title", value: sow.title },
                { label: "Client", value: sow.client },
                { label: "Version", value: `v${sow.version}` },
                { label: "Pages", value: `${sow.pages} pages` },
                {
                  label: "Budget",
                  value:
                    sow.estimatedBudget > 0
                      ? `$${sow.estimatedBudget.toLocaleString()}`
                      : "TBD",
                },
                { label: "Duration", value: sow.estimatedDuration },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-[12px] text-beige-600">{label}</span>
                  <span className="text-[12px] font-semibold text-brown-800 text-right max-w-[60%] truncate">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Confidence */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 text-center">
            <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-3">
              AI Confidence
            </h3>
            <div className="flex justify-center mb-2">
              <MetricRing
                value={sow.aiConfidence}
                size={80}
                strokeWidth={6}
                color={
                  sow.aiConfidence >= 90
                    ? "forest"
                    : sow.aiConfidence >= 70
                    ? "teal"
                    : "gold"
                }
                label="Overall"
              />
            </div>
            <p className="text-[11px] text-beige-500">
              {sow.aiConfidence >= 90
                ? "High confidence analysis"
                : "Review flagged sections"}
            </p>
          </div>

          {/* Sections Parsed */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-3">
              Parsed Sections
            </h3>
            <div className="space-y-2">
              {sections.slice(0, 6).map((section) => (
                <div
                  key={section.id}
                  className="flex items-center gap-2 py-1"
                >
                  <CheckCircle2
                    className={cn(
                      "w-3.5 h-3.5 shrink-0",
                      section.confidence >= 90
                        ? "text-forest-500"
                        : section.confidence >= 75
                        ? "text-teal-500"
                        : "text-gold-500"
                    )}
                  />
                  <span className="text-[12px] text-brown-700 truncate flex-1">
                    {section.title}
                  </span>
                  <span className="text-[10px] font-mono text-beige-500 shrink-0">
                    {section.confidence}%
                  </span>
                </div>
              ))}
              {sections.length > 6 && (
                <p className="text-[11px] text-beige-400 text-center pt-1">
                  +{sections.length - 6} more sections
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-3">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {sow.tags.map((tag) => (
                <Badge key={tag} variant="beige" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
