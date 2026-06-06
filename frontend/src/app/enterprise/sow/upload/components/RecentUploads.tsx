"use client";

import Link from "next/link";
import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui";
import { SowBadge, statusVariantMap } from "@/components/enterprise/sow/SowBadge";
import { useManualSOWList } from "@/lib/hooks/use-manual-sow";

interface APISOWItem {
  id: string;
  title?: string;
  project_title?: string;
  projectTitle?: string;
  client_organisation?: string;
  clientOrganisation?: string;
  status?: string;
  ai_confidence?: number;
  aiConfidence?: number;
  file_size?: string;
  fileSize?: string;
  created_at?: string;
}

export function RecentUploads() {
  const { data: listRes, isLoading } = useManualSOWList({ limit: 5, sort: "created_at", order: "desc" });

  const items: APISOWItem[] = (() => {
    const res = listRes as unknown as { data?: unknown } | null;
    const payload = res?.data as { items?: unknown[] } | unknown[] | null;
    const list = Array.isArray(payload) ? payload : (payload as { items?: unknown[] } | null)?.items ?? [];
    return list as APISOWItem[];
  })();

  return (
    <div className="card-parchment px-5 py-5">
      <h3 className="text-[13px] font-semibold text-gray-800 mb-3">Recent Uploads</h3>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <p className="text-[11px] text-gray-400 text-center py-3">No uploads yet.</p>
      )}

      {!isLoading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => {
            const status = item.status ?? "draft";
            const confidence = item.ai_confidence ?? item.aiConfidence ?? 0;
            const sv = statusVariantMap[status] || statusVariantMap.draft;
            return (
              <Link key={item.id} href={`/enterprise/sow/${item.id}`}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  <FileText className="w-4 h-4 text-brown-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-gray-700 truncate">
                      {item.projectTitle ?? item.title ?? item.project_title ?? "Untitled SOW"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-400">
                        {item.client_organisation ?? item.clientOrganisation ?? ""}
                      </span>
                      {(item.file_size ?? item.fileSize) && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-[10px] text-gray-400">{item.file_size ?? item.fileSize}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {confidence > 0 && (
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center",
                      confidence >= 90 ? "border-forest-400" : confidence >= 80 ? "border-teal-400" : "border-gold-400"
                    )}>
                      <span className={cn(
                        "text-[8px] font-bold",
                        confidence >= 90 ? "text-forest-600" : confidence >= 80 ? "text-teal-600" : "text-gold-600"
                      )}>{confidence}%</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
