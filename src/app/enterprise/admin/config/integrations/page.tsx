"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plug,
  KeyRound,
  Users,
  Building2,
  GraduationCap,
  Webhook,
  Clock,
  ExternalLink,
  Copy,
  CheckCircle2,
  Plus,
  Shield,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Badge, Switch } from "@/components/ui";

/* ── Integration data (H4) ── */
interface IntegrationConfig {
  id: string;
  name: string;
  category: "sso" | "hris" | "erp" | "lms" | "webhook";
  description: string;
  icon: React.ElementType;
  gradient: string;
  status: "connected" | "not_configured" | "error";
  provider?: string;
  lastSynced?: string;
}

const integrations: IntegrationConfig[] = [
  {
    id: "int-sso",
    name: "SSO / Identity Provider",
    category: "sso",
    description: "SAML 2.0 or OIDC-based single sign-on. Supports Azure AD, Okta, Google Workspace, and custom providers.",
    icon: KeyRound,
    gradient: "from-brown-400 to-brown-600",
    status: "connected",
    provider: "Azure AD (SAML 2.0)",
    lastSynced: "2 min ago",
  },
  {
    id: "int-hris",
    name: "HRIS Integration",
    category: "hris",
    description: "Sync employee data, org charts, and department structures from your HR system. Supports BambooHR, Workday, SAP SuccessFactors.",
    icon: Users,
    gradient: "from-teal-400 to-teal-600",
    status: "connected",
    provider: "BambooHR",
    lastSynced: "1 hour ago",
  },
  {
    id: "int-erp",
    name: "ERP / Finance System",
    category: "erp",
    description: "Connect your ERP for automated invoice reconciliation, budget tracking, and financial reporting. Supports SAP, Oracle, NetSuite.",
    icon: Building2,
    gradient: "from-gold-400 to-gold-600",
    status: "not_configured",
  },
  {
    id: "int-lms",
    name: "Learning Management System",
    category: "lms",
    description: "Sync skill certifications and training completions. Supports Cornerstone, Docebo, and custom LMS via API.",
    icon: GraduationCap,
    gradient: "from-forest-400 to-forest-600",
    status: "not_configured",
  },
  {
    id: "int-webhook",
    name: "Webhooks",
    category: "webhook",
    description: "Configure outbound webhook endpoints for real-time event notifications. Supports milestone completion, payment release, escalation events.",
    icon: Webhook,
    gradient: "from-teal-500 to-forest-500",
    status: "connected",
    provider: "3 endpoints active",
    lastSynced: "Just now",
  },
];

/* ── Webhook endpoints ── */
interface WebhookEndpoint {
  id: string;
  url: string;
  event: string;
  status: "active" | "inactive";
  lastTriggered?: string;
}

const webhookEndpoints: WebhookEndpoint[] = [
  { id: "wh-1", url: "https://api.acme.com/hooks/glimmora-delivery", event: "milestone.completed", status: "active", lastTriggered: "12 min ago" },
  { id: "wh-2", url: "https://hooks.internal.net/sow-events", event: "sow.status_changed", status: "active", lastTriggered: "1 hour ago" },
  { id: "wh-3", url: "https://staging.example.io/webhooks/alerts", event: "escalation.triggered", status: "inactive" },
];

/* ── Status config ── */
const statusConfig = {
  connected: { variant: "forest" as const, label: "Connected", icon: CheckCircle2 },
  not_configured: { variant: "beige" as const, label: "Not Configured", icon: AlertCircle },
  error: { variant: "danger" as const, label: "Error", icon: AlertCircle },
};

/* ── Integration card ── */
function IntegrationCard({ integration }: { integration: IntegrationConfig }) {
  const Icon = integration.icon;
  const sConfig = statusConfig[integration.status];
  const StatusIcon = sConfig.icon;

  return (
    <motion.div
      variants={scaleIn}
      className={cn(
        "rounded-2xl border bg-white/70 backdrop-blur-sm p-5 transition-all hover:shadow-lg",
        integration.status === "connected"
          ? "border-beige-200/50 hover:shadow-brown-100/15"
          : "border-beige-200/30"
      )}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md shrink-0",
            integration.gradient
          )}
        >
          <Icon className="w-5.5 h-5.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-semibold text-brown-800">{integration.name}</h3>
          </div>
          <p className="text-[11px] text-beige-500 leading-relaxed">
            {integration.description}
          </p>
        </div>
      </div>

      {/* Status + Provider */}
      <div className="flex items-center justify-between pt-3 border-t border-beige-100">
        <div className="flex items-center gap-3">
          <Badge variant={sConfig.variant} size="sm" dot>
            {sConfig.label}
          </Badge>
          {integration.provider && (
            <span className="text-[10px] font-medium text-beige-600">
              {integration.provider}
            </span>
          )}
        </div>
        <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-beige-200 text-[11px] font-semibold text-brown-700 hover:bg-beige-50 transition-colors">
          Configure
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </button>
      </div>

      {/* Last synced */}
      {integration.status === "connected" && integration.lastSynced && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-beige-100">
          <Clock className="w-3 h-3 text-beige-400" />
          <span className="text-[10px] text-beige-500">Last synced: {integration.lastSynced}</span>
        </div>
      )}
    </motion.div>
  );
}

/* ── Webhook row ── */
function WebhookRow({ endpoint }: { endpoint: WebhookEndpoint }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(endpoint.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-beige-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant={endpoint.status === "active" ? "forest" : "beige"}
            size="sm"
            dot
          >
            {endpoint.status === "active" ? "Active" : "Inactive"}
          </Badge>
          <span className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider">
            {endpoint.event}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-[11px] text-brown-700 font-mono truncate block">
            {endpoint.url}
          </code>
          <button
            onClick={handleCopy}
            className="shrink-0 text-beige-400 hover:text-teal-600 transition-colors"
          >
            {copied ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
      {endpoint.lastTriggered && (
        <div className="flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3 text-beige-400" />
          <span className="text-[10px] text-beige-500">{endpoint.lastTriggered}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════
   INTEGRATIONS PAGE (H4)
   ═══════════════════════════════════ */
export default function IntegrationsPage() {
  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Back link */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/admin/config"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Config
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600 shadow-sm shrink-0">
            <Plug className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em] font-heading">
              Integrations
            </h1>
            <p className="text-[13px] text-beige-500 mt-1">
              Connect SSO/Identity, HRIS, ERP, LMS, and Webhook services.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Summary bar */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-4 px-5 py-3 rounded-xl border border-beige-200/50 bg-white/60 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-forest-500" />
          <span className="text-[12px] text-beige-600">
            <span className="font-semibold text-brown-800">{connectedCount}</span> connected
          </span>
        </div>
        <div className="w-px h-4 bg-beige-200" />
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-beige-400" />
          <span className="text-[12px] text-beige-600">
            <span className="font-semibold text-brown-800">{integrations.length - connectedCount}</span> not configured
          </span>
        </div>
        <div className="w-px h-4 bg-beige-200" />
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-500" />
          <span className="text-[12px] text-beige-600">
            <span className="font-semibold text-brown-800">{integrations.length}</span> total integrations
          </span>
        </div>
      </motion.div>

      {/* Integration cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {integrations
          .filter((i) => i.category !== "webhook")
          .map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
      </div>

      {/* Webhook Section */}
      {(() => {
        const webhookIntegration = integrations.find((i) => i.category === "webhook")!;
        return (
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm", webhookIntegration.gradient)}>
                  <Webhook className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-brown-800">
                      {webhookIntegration.name}
                    </h3>
                    <Badge variant="forest" size="sm" dot>Connected</Badge>
                  </div>
                  <p className="text-[11px] text-beige-500 mt-0.5">
                    Outbound webhook URLs that receive event payloads.
                  </p>
                </div>
              </div>
              <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brown-600 hover:bg-brown-700 text-white text-[11px] font-semibold shadow-md hover:shadow-lg hover:shadow-brown-500/25 transition-all hover:-translate-y-0.5">
                <Plus className="w-3 h-3" />
                Add Endpoint
              </button>
            </div>

            <div className="mb-3">
              <Badge variant="beige" size="sm">{webhookEndpoints.length} configured</Badge>
            </div>

            <div>
              {webhookEndpoints.map((endpoint) => (
                <WebhookRow key={endpoint.id} endpoint={endpoint} />
              ))}
            </div>
          </motion.div>
        );
      })()}
    </motion.div>
  );
}
