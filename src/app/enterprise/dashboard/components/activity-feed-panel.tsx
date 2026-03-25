"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp } from "@/lib/utils/motion-variants";
import { ActivityFeed } from "@/components/enterprise/activity-feed";
import type { ActivityEvent } from "@/types/enterprise";

interface ActivityFeedPanelProps {
  events: ActivityEvent[];
}

export function ActivityFeedPanel({ events }: ActivityFeedPanelProps) {
  return (
    <motion.div variants={fadeUp} className="card-parchment flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-800">Recent Activity</h2>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-forest-500" />
          </span>
        </div>
        <Link href="/enterprise/audit" className="flex items-center gap-1 text-[11px] font-medium text-brown-500 hover:text-brown-600">
          View full audit log <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Feed */}
      <div className="flex-1 px-5 py-3">
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-[12px] text-gray-400">
            No recent activity.
          </div>
        ) : (
          <ActivityFeed events={events} maxItems={5} />
        )}
      </div>
    </motion.div>
  );
}
