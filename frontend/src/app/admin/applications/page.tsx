"use client";

/**
 * Super Admin — applications approval queue. Women-in-tech self-applicants
 * land here as 'pending'; the admin approves (→ they can sign in + complete
 * profile) or rejects (→ blocked). Approve/reject emails the applicant with
 * their login URL. Themed to match the platform (warm brown/gold/beige).
 */

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle2, XCircle, Inbox, ShieldCheck } from "lucide-react";
import { apiCall } from "@/lib/api/client";

interface Application {
  id: string; email: string; firstName?: string; lastName?: string;
  role: string; approval_status?: string; created_at?: string;
}

export default function ApplicationsPage() {
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken ?? "";
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiCall<{ applications: Application[] }>("/api/superadmin/applications?status=pending", { method: "GET", token });
      setApps(res.applications ?? []);
    } catch {
      setError("Couldn't load applications.");
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, decision: "approve" | "reject") => {
    setBusyId(id);
    try {
      await apiCall(`/api/superadmin/applications/${id}/decision`, {
        method: "POST", token, body: JSON.stringify({ decision }),
      });
      setApps((a) => a.filter((x) => x.id !== id));
    } catch {
      setError("Action failed. Try again.");
    } finally { setBusyId(null); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brown-500">
          <ShieldCheck className="h-4 w-4 text-gold-600" /> Approvals
        </div>
        <h1 className="font-heading text-3xl font-bold text-brown-950">Applications</h1>
        <p className="text-sm text-beige-600">Review and approve Women in Tech applicants. Approved members can sign in and complete their profile.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brown-500" /></div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-beige-200 bg-white py-16 text-center">
          <Inbox className="h-10 w-10 text-beige-300" />
          <p className="text-sm font-medium text-brown-800">No pending applications</p>
          <p className="text-xs text-beige-500">New applications will appear here for review.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {apps.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-2xl border border-beige-200 bg-white p-5 shadow-sm">
              <div>
                <p className="font-medium text-brown-900">{a.firstName} {a.lastName}</p>
                <p className="text-sm text-beige-600">{a.email}</p>
                <span className="mt-1 inline-block rounded-full bg-gold-100 px-2 py-0.5 text-xs font-medium text-brown-800">Pending review</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => decide(a.id, "approve")} disabled={busyId === a.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-forest-600 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-60">
                  {busyId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve
                </button>
                <button onClick={() => decide(a.id, "reject")} disabled={busyId === a.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-beige-200 px-4 py-2 text-sm font-semibold text-brown-700 hover:bg-beige-50 disabled:opacity-60">
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
