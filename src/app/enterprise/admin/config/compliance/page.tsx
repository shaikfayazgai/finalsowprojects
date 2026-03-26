"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Badge, Button } from "@/components/ui";

/* ── Mock compliance settings ── */
const mockSettings = [
  {
    id: "cs-001",
    name: "Auto-generate Evidence Packs",
    description: "Automatically compile evidence packs on milestone completion",
    category: "Evidence",
    enabled: true,
    lastUpdated: "2026-02-15",
  },
  {
    id: "cs-002",
    name: "Mandatory PoDL Sign-off",
    description: "Require digital sign-off on all Proof of Delivery Logs before payment release",
    category: "Delivery",
    enabled: true,
    lastUpdated: "2026-01-20",
  },
  {
    id: "cs-003",
    name: "ESG Data Collection",
    description: "Enable ESG metric tracking and reporting on all active projects",
    category: "ESG",
    enabled: true,
    lastUpdated: "2026-03-01",
  },
  {
    id: "cs-004",
    name: "Audit Trail Retention",
    description: "Retain full audit trail logs for a minimum of 7 years",
    category: "Audit",
    enabled: true,
    lastUpdated: "2025-12-10",
  },
  {
    id: "cs-005",
    name: "SOW Clause Compliance Check",
    description: "Validate SOW clauses against regulatory templates before approval",
    category: "SOW",
    enabled: false,
    lastUpdated: "2026-02-28",
  },
  {
    id: "cs-006",
    name: "Contributor Background Verification",
    description: "Require identity and background verification for all new contributors",
    category: "Onboarding",
    enabled: true,
    lastUpdated: "2026-01-05",
  },
  {
    id: "cs-007",
    name: "Data Residency Enforcement",
    description: "Enforce data residency rules based on project jurisdiction",
    category: "Data",
    enabled: false,
    lastUpdated: "2026-03-10",
  },
];

const categoryColors: Record<string, string> = {
  Evidence: "bg-brown-100 text-brown-600",
  Delivery: "bg-teal-100 text-teal-600",
  ESG: "bg-forest-100 text-forest-600",
  Audit: "bg-gold-100 text-gold-700",
  SOW: "bg-brown-100 text-brown-600",
  Onboarding: "bg-teal-100 text-teal-600",
  Data: "bg-forest-100 text-forest-600",
};

export default function ComplianceSettingsPage() {
  const [settings, setSettings] = React.useState(mockSettings);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, enabled: !s.enabled };
          toast.success(
            updated.enabled ? "Enabled" : "Disabled",
            `"${s.name}" has been ${updated.enabled ? "enabled" : "disabled"}.`
          );
          return updated;
        }
        return s;
      })
    );
  };

  const enabledCount = settings.filter((s) => s.enabled).length;

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
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <Link
            href="/enterprise/admin/config"
            className="inline-flex items-center gap-1.5 text-[12px] text-beige-500 hover:text-brown-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Settings
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
              Compliance Settings
            </h1>
          </div>
          <p className="text-[13px] text-beige-500 mt-1">
            Configure compliance policies, evidence generation, and regulatory requirements.
          </p>
        </div>
        <Button
          variant="gradient-primary"
          size="sm"
          onClick={() => toast.info("Export", "Compliance report export started.")}
        >
          <Download className="w-3.5 h-3.5" />
          Export Report
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-forest-600" />
            </div>
            <span className="text-[10px] font-bold text-beige-500 uppercase tracking-wider">Active</span>
          </div>
          <p className="text-[20px] font-bold text-brown-900">{enabledCount}</p>
          <p className="text-[10px] text-beige-500">of {settings.length} policies</p>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gold-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-gold-700" />
            </div>
            <span className="text-[10px] font-bold text-beige-500 uppercase tracking-wider">Disabled</span>
          </div>
          <p className="text-[20px] font-bold text-brown-900">{settings.length - enabledCount}</p>
          <p className="text-[10px] text-beige-500">review recommended</p>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brown-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-brown-600" />
            </div>
            <span className="text-[10px] font-bold text-beige-500 uppercase tracking-wider">Categories</span>
          </div>
          <p className="text-[20px] font-bold text-brown-900">
            {new Set(settings.map((s) => s.category)).size}
          </p>
          <p className="text-[10px] text-beige-500">policy areas</p>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-teal-600" />
            </div>
            <span className="text-[10px] font-bold text-beige-500 uppercase tracking-wider">Last Updated</span>
          </div>
          <p className="text-[20px] font-bold text-brown-900">Mar 10</p>
          <p className="text-[10px] text-beige-500">2026</p>
        </div>
      </motion.div>

      {/* Settings Table */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-beige-100 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-brown-900">All Compliance Policies</h2>
          <span className="text-[11px] text-beige-500">{settings.length} policies configured</span>
        </div>

        <div className="divide-y divide-beige-100">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className={cn(
                "flex items-center gap-4 px-5 py-4 transition-colors",
                !setting.enabled && "opacity-60"
              )}
            >
              {/* Toggle */}
              <button
                onClick={() => toggleSetting(setting.id)}
                className="shrink-0"
                aria-label={setting.enabled ? "Disable policy" : "Enable policy"}
              >
                {setting.enabled ? (
                  <ToggleRight className="w-6 h-6 text-forest-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-beige-400" />
                )}
              </button>

              {/* Name & Description */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-brown-900 truncate">
                  {setting.name}
                </p>
                <p className="text-[11px] text-beige-500 mt-0.5 truncate">
                  {setting.description}
                </p>
              </div>

              {/* Category */}
              <Badge
                variant="beige"
                size="sm"
                className={cn(
                  "hidden md:inline-flex",
                  categoryColors[setting.category]
                )}
              >
                {setting.category}
              </Badge>

              {/* Last Updated */}
              <div className="hidden lg:flex items-center gap-1.5 w-32 shrink-0">
                <Clock className="w-3 h-3 text-beige-400" />
                <span className="text-[11px] text-beige-600">{setting.lastUpdated}</span>
              </div>

              {/* Status badge */}
              <Badge variant={setting.enabled ? "forest" : "beige"} size="sm" dot>
                {setting.enabled ? "Active" : "Disabled"}
              </Badge>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl bg-gradient-to-r from-brown-50 to-beige-50 border border-brown-100/60 p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brown-400 to-brown-500 flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-brown-900 mb-1">
              Compliance Framework
            </h3>
            <p className="text-[12px] text-brown-700 leading-relaxed">
              These settings control how compliance is enforced across your projects.
              Disabled policies will not block workflows but are recommended for full regulatory coverage.
              For audit-specific configurations, evidence packs are auto-generated when the corresponding policy is active.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
