"use client";

/**
 * Platform Admin — analytics overview. Surfaces real platform counts from
 * /api/superadmin/dashboard (accounts by role, pending approvals) + recent
 * activity from the audit log. Themed to match the platform.
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, BarChart3, Users, Building2, GraduationCap, ShieldCheck, Activity } from "lucide-react";
import { apiCall } from "@/lib/api/client";

interface Dash {
  stats: {
    total_accounts: number; contributors: number; enterprises: number; mentors: number;
    pending_applications: number; by_role?: Record<string, number>;
  };
  recent_activity: { id: string; action: string; actor: string; service?: string; timestamp?: string }[];
}

export default function AdminAnalyticsPage() {
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken ?? "";
  const [d, setD] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiCall<Dash>("/api/superadmin/dashboard", { method: "GET", token })
      .then((res) => { if (!cancelled) setD(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const s = d?.stats;
  const cards = [
    { label: "Total accounts", value: s?.total_accounts, icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Enterprises", value: s?.enterprises, icon: Building2, color: "text-brown-600", bg: "bg-brown-50" },
    { label: "Contributors", value: s?.contributors, icon: GraduationCap, color: "text-gold-600", bg: "bg-gold-50" },
    { label: "Mentors", value: s?.mentors, icon: ShieldCheck, color: "text-forest-600", bg: "bg-forest-50" },
    { label: "Pending approvals", value: s?.pending_applications, icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brown-500">
          <BarChart3 className="h-4 w-4 text-gold-600" /> Insights
        </div>
        <h1 className="font-heading text-3xl font-bold text-brown-950">Platform analytics</h1>
        <p className="text-sm text-beige-600">Live workforce and account metrics across the platform.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brown-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-beige-100 bg-white p-5 shadow-sm">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="font-heading text-2xl font-bold text-brown-950">{value ?? "—"}</p>
                <p className="mt-0.5 text-xs text-beige-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-beige-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-heading font-semibold text-brown-950">Accounts by role</h2>
              <div className="space-y-3">
                {s?.by_role && Object.entries(s.by_role).sort((a, b) => b[1] - a[1]).map(([role, n]) => {
                  const max = Math.max(...Object.values(s.by_role ?? { x: 1 }));
                  return (
                    <div key={role} className="space-y-1">
                      <div className="flex justify-between text-sm"><span className="capitalize text-brown-800">{role}</span><span className="font-medium text-brown-900">{n}</span></div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-beige-100">
                        <div className="h-full rounded-full bg-[linear-gradient(90deg,#6b4a22,#a47b2e)]" style={{ width: `${(n / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-beige-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-heading font-semibold text-brown-950">Recent activity</h2>
              <ul className="space-y-2.5">
                {(d?.recent_activity ?? []).slice(0, 8).map((a) => (
                  <li key={a.id} className="flex items-start gap-2 border-b border-beige-50 pb-2.5 text-sm last:border-0">
                    <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-brown-800">{a.actor} · {a.action}</p>
                      <p className="text-xs text-beige-400">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ""}</p>
                    </div>
                  </li>
                ))}
                {(!d?.recent_activity || d.recent_activity.length === 0) && (
                  <li className="text-sm text-beige-500">No recent activity.</li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
