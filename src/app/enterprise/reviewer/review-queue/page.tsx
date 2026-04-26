"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { reviewerApi, type ReviewerAssignment } from "@/lib/api/reviewer";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui";

function syntheticDeadline(assignedAt?: string | null): string {
  if (!assignedAt) return new Date(Date.now() + 72 * 3600000).toISOString();
  const t = new Date(assignedAt).getTime();
  return new Date(t + 72 * 3600000).toISOString();
}

function formatTimeLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return { label: "OVERDUE", color: "text-red-600", bg: "bg-red-50 border-red-200" };
  const hours = Math.floor(diff / 3600000);
  if (hours < 4) return { label: `Due in ${hours}h`, color: "text-red-600", bg: "bg-red-50 border-red-200" };
  if (hours < 24) return { label: `Due in ${hours}h`, color: "text-gold-600", bg: "bg-gold-50 border-gold-200" };
  const days = Math.floor(hours / 24);
  return { label: `Due in ${days}d`, color: "text-forest-600", bg: "bg-forest-50 border-forest-200" };
}

export default function ReviewQueuePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;

  const [assignments, setAssignments] = React.useState<ReviewerAssignment[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const rows = await reviewerApi.listAssignments(token);
      setAssignments(rows);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load queue.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const pendingCount = assignments.filter((a) => a.status === "pending").length;
  const overdueCount = assignments.filter((a) => {
    if (a.status === "completed") return false;
    return new Date(syntheticDeadline(a.assignedAt)).getTime() < Date.now();
  }).length;
  const dueTodayCount = assignments.filter((a) => {
    if (a.status === "completed") return false;
    const diff = new Date(syntheticDeadline(a.assignedAt)).getTime() - Date.now();
    return diff > 0 && diff < 24 * 3600000;
  }).length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Review queue</h1>
          <p className="text-[13px] text-gray-500 mt-1">Assignments from your organization&rsquo;s reviewer API.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          <span className="ml-2">Refresh</span>
        </Button>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Pending", value: pendingCount, color: "text-gold-600" },
          { label: "Overdue window", value: overdueCount, color: "text-red-600" },
          { label: "Due within 24h", value: dueTodayCount, color: "text-gold-600" },
          { label: "Total", value: assignments.length, color: "text-gray-700" },
        ].map((m) => (
          <div key={m.label} className="card-parchment px-5 py-4 text-center">
            <div className={cn("text-[28px] font-bold font-mono", m.color)}>{m.value}</div>
            <div className="text-[11px] text-gray-400 mt-1">{m.label}</div>
          </div>
        ))}
      </motion.div>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      <motion.div variants={fadeUp} className="space-y-4">
        {loading && <p className="text-sm text-gray-500">Loading assignments…</p>}
        {!loading && assignments.length === 0 && (
          <div className="card-parchment p-8 text-center text-sm text-gray-500">
            No assignments yet. Ask your administrator to assign a task to your reviewer account.
          </div>
        )}
        {!loading &&
          assignments.map((item) => {
            const sla = formatTimeLeft(syntheticDeadline(item.assignedAt));
            return (
              <div key={item.id} className="card-parchment overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold text-gray-800">{item.title}</span>
                      <span className="text-[9px] font-bold uppercase text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                        {item.taskKind?.replace("_", " ") ?? "task"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                      <span>Status: {item.status}</span>
                      {item.relatedId && (
                        <>
                          <span>·</span>
                          <span>Ref: {item.relatedId}</span>
                        </>
                      )}
                      {item.notes && (
                        <>
                          <span>·</span>
                          <span className="truncate">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-lg border", sla.bg, sla.color)}>
                      {sla.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push(`/enterprise/reviewer/review-queue/${item.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold text-white bg-teal-500 hover:bg-teal-600 transition-all">
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </motion.div>
    </motion.div>
  );
}
