"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Settings,
  Bot,
  Plug,
  ChevronRight,
  Globe,
  DollarSign,
  Clock,
  Calendar,
  Building2,
  Users,
  Upload,
  Palette,
  Shield,
  Database,
  Save,
  ImageIcon,
  Mail,
  Phone,
  Briefcase,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  Badge,
  Input,
  Label,
  Switch,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";

/* ── Org details mock ── */
const orgDetails = {
  companyName: "TechVista Solutions",
  industry: "Information Technology",
  companySize: "500-1000",
  primaryContact: "Priya Nair",
  contactEmail: "priya@techvista.com",
  contactPhone: "+91 98765 43210",
  logoUrl: "",
};

/* ── Platform settings mock ── */
const platformSettings = {
  defaultCurrency: "USD",
  timezone: "Asia/Karachi",
  dateFormat: "MMM DD, YYYY",
  language: "English",
};

/* ── Navigation sub-page card ── */
function ConfigNavCard({
  href,
  icon: Icon,
  title,
  description,
  gradient,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  badge?: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        variants={scaleIn}
        className="group relative rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-brown-100/20 transition-all cursor-pointer hover:-translate-y-0.5"
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm shrink-0",
              gradient
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-brown-800 group-hover:text-brown-900 transition-colors">
                {title}
              </h3>
              {badge && (
                <Badge variant="teal" size="sm">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-beige-500 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-beige-300 group-hover:text-brown-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
        </div>
      </motion.div>
    </Link>
  );
}

/* ── Setting row with input ── */
function SettingInputRow({
  label,
  value,
  icon: Icon,
  readOnly = false,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  readOnly?: boolean;
}) {
  const [val, setVal] = React.useState(value);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-beige-100 last:border-0">
      <Icon className="w-4 h-4 text-beige-400 shrink-0" />
      <span className="text-[12px] text-beige-500 font-medium w-36 shrink-0">{label}</span>
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        readOnly={readOnly}
        className="h-9 text-[12px] bg-beige-50/60 max-w-[280px]"
      />
    </div>
  );
}

/* ── Data retention toggle row ── */
function RetentionRow({
  title,
  description,
  duration,
  enabled,
}: {
  title: string;
  description: string;
  duration: string;
  enabled: boolean;
}) {
  const [on, setOn] = React.useState(enabled);
  return (
    <div className="flex items-center gap-4 py-3.5 px-4 rounded-xl border border-beige-100 hover:bg-beige-50/40 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-brown-800">{title}</p>
          <Badge variant="beige" size="sm">{duration}</Badge>
        </div>
        <p className="text-[11px] text-beige-500 mt-0.5">{description}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} />
    </div>
  );
}

/* ═══════════════════════════════════
   TENANT SETUP / CONFIG PAGE (H1)
   ═══════════════════════════════════ */
export default function TenantSetupPage() {
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-500 to-brown-600 flex items-center justify-center shadow-md shadow-brown-500/20">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em] font-heading">
              Tenant Setup
            </h1>
            <p className="text-[13px] text-beige-500 mt-1">
              Organization details, platform settings, data retention, and branding.
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brown-600 hover:bg-brown-700 text-white text-[12px] font-semibold shadow-md hover:shadow-lg hover:shadow-brown-500/25 transition-all hover:-translate-y-0.5">
          <Save className="w-3.5 h-3.5" />
          Save Changes
        </button>
      </motion.div>

      {/* Quick Nav to sub-pages */}
      <motion.div variants={fadeUp}>
        <p className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider mb-3">
          Configuration Modules
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ConfigNavCard
            href="/enterprise/admin/config/apg"
            icon={Shield}
            title="Policies"
            description="SLA templates, pricing rules, governance thresholds, stage gates"
            gradient="from-forest-400 to-forest-600"
            badge="H3"
          />
          <ConfigNavCard
            href="/enterprise/admin/config/integrations"
            icon={Plug}
            title="Integrations"
            description="SSO/Identity, HRIS, ERP, LMS, webhooks"
            gradient="from-teal-400 to-teal-600"
            badge="H4"
          />
          <ConfigNavCard
            href="/enterprise/admin/config/notifications"
            icon={Bot}
            title="Notifications"
            description="Email, Slack, in-app, and webhook notification rules"
            gradient="from-gold-400 to-gold-600"
          />
        </div>
      </motion.div>

      {/* Organization Details */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-4 h-4 text-brown-500" />
          <h3 className="text-[14px] font-semibold text-brown-800">Organization Details</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Logo placeholder */}
          <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-beige-200 bg-beige-50/40">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brown-100 to-beige-200 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-brown-400" />
            </div>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-beige-200 text-[11px] font-semibold text-brown-700 hover:bg-beige-50 transition-colors">
              <Upload className="w-3 h-3" />
              Upload Logo
            </button>
            <p className="text-[10px] text-beige-400 text-center">SVG, PNG, or JPG. Max 2MB.</p>
          </div>

          {/* Company details */}
          <div className="lg:col-span-2">
            <div className="space-y-0">
              <SettingInputRow label="Company Name" value={orgDetails.companyName} icon={Building2} />
              <SettingInputRow label="Industry" value={orgDetails.industry} icon={Briefcase} />
              <SettingInputRow label="Company Size" value={orgDetails.companySize} icon={Users} />
              <SettingInputRow label="Primary Contact" value={orgDetails.primaryContact} icon={Users} />
              <SettingInputRow label="Contact Email" value={orgDetails.contactEmail} icon={Mail} />
              <SettingInputRow label="Contact Phone" value={orgDetails.contactPhone} icon={Phone} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Platform Settings + Branding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Platform Settings */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-4 h-4 text-teal-500" />
            <h3 className="text-[14px] font-semibold text-brown-800">Platform Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[12px] text-brown-700 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-beige-400" />
                Default Currency
              </Label>
              <Select defaultValue={platformSettings.defaultCurrency}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="PKR">PKR</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] text-brown-700 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-beige-400" />
                Timezone
              </Label>
              <Select defaultValue={platformSettings.timezone}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Karachi">Asia/Karachi (UTC+5)</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] text-brown-700 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-beige-400" />
                Date Format
              </Label>
              <Select defaultValue={platformSettings.dateFormat}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MMM DD, YYYY">MMM DD, YYYY (Mar 06, 2026)</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (06/03/2026)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (03/06/2026)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2026-03-06)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Branding Customization */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Palette className="w-4 h-4 text-gold-500" />
            <h3 className="text-[14px] font-semibold text-brown-800">Branding Customization</h3>
          </div>

          <div className="space-y-4">
            {/* Brand colors preview */}
            <div>
              <Label className="text-[12px] text-brown-700 mb-2 block">Brand Colors</Label>
              <div className="flex gap-2">
                {[
                  { name: "Primary", color: "bg-brown-500", hex: "#A67763" },
                  { name: "Secondary", color: "bg-forest-500", hex: "#4D5741" },
                  { name: "Accent", color: "bg-teal-500", hex: "#5B9BA2" },
                  { name: "Warning", color: "bg-gold-500", hex: "#D0B060" },
                  { name: "Surface", color: "bg-beige-100", hex: "#C9B09D" },
                ].map((c) => (
                  <div key={c.name} className="flex flex-col items-center gap-1.5">
                    <div className={cn("w-10 h-10 rounded-xl border border-beige-200/60", c.color)} />
                    <span className="text-[9px] font-medium text-beige-500">{c.name}</span>
                    <span className="text-[8px] font-mono text-beige-400">{c.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom portal title */}
            <div className="space-y-2">
              <Label className="text-[12px] text-brown-700">Portal Display Name</Label>
              <Input defaultValue="TechVista Delivery Portal" className="h-9 text-[12px]" />
            </div>

            {/* Favicon upload */}
            <div className="space-y-2">
              <Label className="text-[12px] text-brown-700">Favicon</Label>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-beige-200 bg-beige-50/40">
                <div className="w-8 h-8 rounded-lg bg-brown-100 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-brown-400" />
                </div>
                <button className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                  Upload favicon (32x32 px)
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Data Retention Policies */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Database className="w-4 h-4 text-forest-500" />
          <h3 className="text-[14px] font-semibold text-brown-800">Data Retention Policies</h3>
          <Badge variant="forest" size="sm">GDPR Compliant</Badge>
        </div>

        <p className="text-[11px] text-beige-500 mb-4 leading-relaxed">
          Configure how long different categories of data are retained. Policies comply with GDPR and local regulations.
        </p>

        <div className="space-y-3">
          <RetentionRow
            title="Project Data"
            description="Completed project deliverables, evidence files, and task history"
            duration="7 years"
            enabled={true}
          />
          <RetentionRow
            title="Audit Logs"
            description="User actions, system events, and compliance audit trail"
            duration="5 years"
            enabled={true}
          />
          <RetentionRow
            title="User Sessions"
            description="Login history, session tokens, and access patterns"
            duration="90 days"
            enabled={true}
          />
          <RetentionRow
            title="Analytics Data"
            description="Aggregated performance metrics and trend data"
            duration="3 years"
            enabled={true}
          />
          <RetentionRow
            title="Draft SOWs"
            description="Unpublished statement of work documents and parsing artifacts"
            duration="1 year"
            enabled={false}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
