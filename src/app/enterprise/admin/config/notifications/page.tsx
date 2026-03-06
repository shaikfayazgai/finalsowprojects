"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageSquare,
  Webhook,
  ToggleLeft,
  ToggleRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Badge, Button, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";

/* ── Mock notification rules ── */
const mockRules = [
  {
    id: "nr-001",
    name: "SOW Upload Complete",
    event: "sow.upload.complete",
    channels: ["email", "in-app"],
    recipients: "Owner + Admins",
    enabled: true,
    delay: "Immediate",
  },
  {
    id: "nr-002",
    name: "Deliverable Submitted",
    event: "deliverable.submitted",
    channels: ["email", "in-app", "slack"],
    recipients: "Project Reviewers",
    enabled: true,
    delay: "Immediate",
  },
  {
    id: "nr-003",
    name: "SLA Breach Warning",
    event: "sla.breach.warning",
    channels: ["email", "in-app", "slack", "webhook"],
    recipients: "Owner + Project Manager",
    enabled: true,
    delay: "30 min before breach",
  },
  {
    id: "nr-004",
    name: "Payment Released",
    event: "payment.released",
    channels: ["email"],
    recipients: "Billing Admins",
    enabled: true,
    delay: "Immediate",
  },
  {
    id: "nr-005",
    name: "Exception Escalated",
    event: "exception.escalated",
    channels: ["email", "in-app", "slack"],
    recipients: "Owner + Admins",
    enabled: true,
    delay: "Immediate",
  },
  {
    id: "nr-006",
    name: "Weekly Digest",
    event: "digest.weekly",
    channels: ["email"],
    recipients: "All Stakeholders",
    enabled: false,
    delay: "Every Monday 9:00 AM",
  },
  {
    id: "nr-007",
    name: "Team Formation Complete",
    event: "team.formation.complete",
    channels: ["email", "in-app"],
    recipients: "Owner",
    enabled: true,
    delay: "Immediate",
  },
  {
    id: "nr-008",
    name: "Milestone Completed",
    event: "milestone.completed",
    channels: ["in-app"],
    recipients: "Owner + Project Manager",
    enabled: false,
    delay: "Immediate",
  },
];

const channelConfig = {
  email: { icon: Mail, label: "Email", accent: "bg-brown-100 text-brown-600" },
  "in-app": { icon: Bell, label: "In-App", accent: "bg-teal-100 text-teal-600" },
  slack: { icon: MessageSquare, label: "Slack", accent: "bg-forest-100 text-forest-600" },
  webhook: { icon: Webhook, label: "Webhook", accent: "bg-gold-100 text-gold-700" },
} as const;

type Channel = keyof typeof channelConfig;

export default function NotificationsConfigPage() {
  const [rules, setRules] = React.useState(mockRules);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const enabledCount = rules.filter((r) => r.enabled).length;
  const channelCounts = rules.reduce(
    (acc, r) => {
      if (r.enabled) {
        r.channels.forEach((ch) => {
          acc[ch] = (acc[ch] || 0) + 1;
        });
      }
      return acc;
    },
    {} as Record<string, number>
  );

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
            Tenant Setup
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
              Notification Rules
            </h1>
          </div>
          <p className="text-[13px] text-beige-500 mt-1">
            Configure when and how notifications are sent for platform events.
          </p>
        </div>
        <Button variant="gradient-primary" size="sm">
          <Plus className="w-3.5 h-3.5" />
          Add Rule
        </Button>
      </motion.div>

      {/* Channel Summary */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brown-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-brown-600" />
            </div>
            <span className="text-[10px] font-bold text-beige-500 uppercase tracking-wider">Active</span>
          </div>
          <p className="text-[20px] font-bold text-brown-900">{enabledCount}</p>
          <p className="text-[10px] text-beige-500">of {rules.length} rules</p>
        </div>
        {(Object.entries(channelConfig) as [Channel, (typeof channelConfig)[Channel]][]).map(([key, ch]) => {
          const Icon = ch.icon;
          return (
            <div key={key} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", ch.accent)}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-beige-500 uppercase tracking-wider">{ch.label}</span>
              </div>
              <p className="text-[20px] font-bold text-brown-900">{channelCounts[key] || 0}</p>
              <p className="text-[10px] text-beige-500">active rules</p>
            </div>
          );
        })}
      </motion.div>

      {/* Rules Table */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-beige-100 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-brown-900">All Rules</h2>
          <span className="text-[11px] text-beige-500">{rules.length} rules configured</span>
        </div>

        <div className="divide-y divide-beige-100">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "flex items-center gap-4 px-5 py-4 transition-colors",
                !rule.enabled && "opacity-60"
              )}
            >
              {/* Toggle */}
              <button
                onClick={() => toggleRule(rule.id)}
                className="shrink-0"
                aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
              >
                {rule.enabled ? (
                  <ToggleRight className="w-6 h-6 text-forest-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-beige-400" />
                )}
              </button>

              {/* Name & Event */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-brown-900 truncate">
                  {rule.name}
                </p>
                <p className="text-[10px] font-mono text-beige-500 mt-0.5">
                  {rule.event}
                </p>
              </div>

              {/* Channels */}
              <div className="hidden md:flex items-center gap-1.5 shrink-0">
                {rule.channels.map((ch) => {
                  const config = channelConfig[ch as Channel];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <div
                      key={ch}
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center",
                        config.accent
                      )}
                      title={config.label}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  );
                })}
              </div>

              {/* Recipients */}
              <div className="hidden lg:block w-40 shrink-0">
                <p className="text-[11px] text-beige-600 truncate">{rule.recipients}</p>
              </div>

              {/* Delay */}
              <div className="hidden lg:flex items-center gap-1.5 w-44 shrink-0">
                <Clock className="w-3 h-3 text-beige-400" />
                <span className="text-[11px] text-beige-600">{rule.delay}</span>
              </div>

              {/* Status badge */}
              <Badge variant={rule.enabled ? "forest" : "beige"} size="sm" dot>
                {rule.enabled ? "Active" : "Disabled"}
              </Badge>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl bg-gradient-to-r from-teal-50 to-beige-50 border border-teal-100/60 p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-teal-900 mb-1">
              Notification Delivery
            </h3>
            <p className="text-[12px] text-teal-700 leading-relaxed">
              Email notifications use your configured SMTP or SendGrid integration.
              Slack notifications require the Slack integration to be connected in{" "}
              <Link href="/enterprise/admin/config/integrations" className="underline font-medium">
                Integrations
              </Link>
              . Webhook payloads follow the platform event schema and support retry with exponential backoff.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
