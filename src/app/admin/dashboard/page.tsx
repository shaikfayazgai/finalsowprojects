"use client";

import { useSession } from "next-auth/react";
import {
  Users,
  Building2,
  FileText,
  ShieldCheck,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const STATS = [
  { label: "Total Users", value: "12,480", change: "+8%", icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
  { label: "Organisations", value: "2,412", change: "+3%", icon: Building2, color: "text-brown-600", bg: "bg-brown-50" },
  { label: "Active SOWs", value: "348", change: "+12%", icon: FileText, color: "text-gold-600", bg: "bg-gold-50" },
  { label: "Compliance Rate", value: "98.7%", change: "+0.2%", icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50" },
];

const RECENT_ACTIVITY = [
  { type: "user", message: "New enterprise registration: Acme Corp", time: "2 min ago", status: "info" },
  { type: "alert", message: "SOW flagged for compliance review: SOW-2041", time: "15 min ago", status: "warning" },
  { type: "success", message: "SOW approved: SOW-2038 — TechVault Inc.", time: "1 hr ago", status: "success" },
  { type: "user", message: "Contributor onboarded: Sarah Mitchell", time: "2 hr ago", status: "info" },
  { type: "alert", message: "Failed login attempts detected: 3 accounts", time: "3 hr ago", status: "warning" },
  { type: "success", message: "System health check passed — all services nominal", time: "4 hr ago", status: "success" },
];

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const name = session?.user?.name?.split(" ")[0] ?? "Admin";

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-600 mb-1">Platform Admin</p>
        <h1 className="font-heading text-3xl font-bold text-brown-950">
          Welcome back, {name}
        </h1>
        <p className="text-sm text-beige-600 mt-1">Full platform visibility and control</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, change, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl p-5 bg-white border border-beige-100 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {change}
              </span>
            </div>
            <p className="font-heading text-2xl font-bold text-brown-950">{value}</p>
            <p className="text-xs text-beige-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-beige-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-brown-950">Recent Activity</h2>
            <Activity className="w-4 h-4 text-beige-400" />
          </div>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map(({ message, time, status }, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-beige-50 last:border-0">
                <div className="mt-0.5 shrink-0">
                  {status === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  {status === "success" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {status === "info" && <TrendingUp className="w-4 h-4 text-teal-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brown-800 leading-snug">{message}</p>
                  <p className="text-xs text-beige-400 mt-0.5">{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl bg-white border border-beige-100 shadow-sm p-6">
          <h2 className="font-heading font-semibold text-brown-950 mb-5">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: "Manage Users", href: "/admin/users", icon: Users },
              { label: "View Organisations", href: "/admin/organisations", icon: Building2 },
              { label: "SOW Oversight", href: "/admin/sow", icon: FileText },
              { label: "Audit Log", href: "/admin/audit", icon: ShieldCheck },
              { label: "System Health", href: "/admin/system", icon: Activity },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-beige-50 transition-colors group"
              >
                <Icon className="w-4 h-4 text-beige-400 group-hover:text-brown-600 transition-colors" />
                <span className="text-sm text-brown-700 group-hover:text-brown-950 font-medium transition-colors">
                  {label}
                </span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
