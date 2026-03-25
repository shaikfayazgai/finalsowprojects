"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { mockRecentUploads } from "@/mocks/data/sow-upload-flow";
import { SowBadge, statusVariantMap, confidenceVariant } from "@/components/enterprise/sow/SowBadge";

export function RecentUploads() {
  return (
    <div className="card-parchment px-5 py-5">
      <h3 className="text-[13px] font-semibold text-gray-800 mb-3">Recent Uploads</h3>
      <div className="space-y-2">
        {mockRecentUploads.map((item) => {
          const sv = statusVariantMap[item.status] || statusVariantMap.draft;
          return (
            <Link key={item.id} href={`/enterprise/sow/${item.id}`}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <FileText className="w-4 h-4 text-brown-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-gray-700 truncate">{item.fileName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400">{item.client}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-[10px] text-gray-400">{item.fileSize}</span>
                  </div>
                </div>
                {/* Mini confidence ring */}
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center",
                  item.aiConfidence >= 90 ? "border-forest-400" : item.aiConfidence >= 80 ? "border-teal-400" : "border-gold-400"
                )}>
                  <span className={cn(
                    "text-[8px] font-bold",
                    item.aiConfidence >= 90 ? "text-forest-600" : item.aiConfidence >= 80 ? "text-teal-600" : "text-gold-600"
                  )}>{item.aiConfidence}%</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
