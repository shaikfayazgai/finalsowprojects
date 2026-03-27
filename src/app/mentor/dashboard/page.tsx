"use client";

import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  ArrowUpRight,
  Star,
  Timer,
} from "lucide-react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  StatCard,
  Badge,
  Button,
  Progress,
  Avatar,
  AvatarFallback,
} from "@/components/ui";

export default function MentorDashboardPage() {
  const router = useRouter();
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-semibold text-brown-950">
          Reviewer Dashboard
        </h1>
        <p className="text-sm text-beige-600 mt-1">
          Welcome back, Rajesh. You have 6 items in your review queue.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          variant="gradient-forest"
          label="Queue Size"
          value="6"
          change="2 urgent"
          changeType="neutral"
          icon={<ClipboardCheck className="w-5 h-5 text-white/80" />}
        />
        <StatCard
          variant="glass"
          label="Avg Review Time"
          value="2.4h"
          change="-15%"
          changeType="positive"
          subtitle="vs target 4h"
          icon={<Timer className="w-5 h-5 text-forest-600" />}
        />
        <StatCard
          variant="glass"
          label="Completed (MTD)"
          value="23"
          change="+8"
          changeType="positive"
          subtitle="vs last month"
          icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />}
        />
        <StatCard
          variant="glass"
          label="Approval Rate"
          value="82%"
          change="18% rework"
          changeType="neutral"
          icon={<Star className="w-5 h-5 text-gold-600" />}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Review Queue */}
        <GlassCard className="lg:col-span-2" hover="none">
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <GlassCardTitle>Review Queue</GlassCardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/mentor/queue")}>
                View Full Queue <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              {[
                {
                  task: "Payment Module — Unit Tests",
                  contributor: "FA",
                  contributorName: "Fatima A.",
                  project: "Cloud Migration",
                  sla: "2h 15m left",
                  urgent: true,
                  type: "Deliverable",
                },
                {
                  task: "Auth Endpoint Documentation",
                  contributor: "AM",
                  contributorName: "Arjun M.",
                  project: "API Gateway",
                  sla: "6h left",
                  urgent: false,
                  type: "Deliverable",
                },
                {
                  task: "Database Schema — Rework v2",
                  contributor: "SB",
                  contributorName: "Sarah B.",
                  project: "Data Pipeline",
                  sla: "4h left",
                  urgent: false,
                  type: "Rework",
                },
                {
                  task: "CSS Component Library",
                  contributor: "VP",
                  contributorName: "Vikram P.",
                  project: "Mobile Backend",
                  sla: "1d 2h left",
                  urgent: false,
                  type: "Deliverable",
                },
              ].map((item) => (
                <div
                  key={item.task}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-beige-100 hover:border-forest-200 hover:bg-forest-50/30 transition-all cursor-pointer"
                  onClick={() => router.push("/mentor/queue")}
                >
                  <Avatar size="sm">
                    <AvatarFallback>{item.contributor}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-brown-900 truncate">
                        {item.task}
                      </p>
                      <Badge
                        variant={item.type === "Rework" ? "gold" : "forest"}
                        size="sm"
                      >
                        {item.type}
                      </Badge>
                      {item.urgent && (
                        <Badge variant="danger" size="sm" dot>
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-beige-600">
                      <span>{item.contributorName}</span>
                      <span>{item.project}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Clock className={`w-3.5 h-3.5 ${item.urgent ? "text-gold-600" : "text-beige-400"}`} />
                    <span className={`text-xs font-semibold ${item.urgent ? "text-gold-700" : "text-beige-600"}`}>
                      {item.sla}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Review Metrics */}
        <GlassCard hover="none">
          <GlassCardHeader>
            <GlassCardTitle>Review Breakdown</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {[
                { label: "Approved", count: 19, total: 23, color: "gradient-forest" as const, icon: CheckCircle2 },
                { label: "Rework Requested", count: 3, total: 23, color: "gold" as const, icon: RotateCcw },
                { label: "Rejected", count: 1, total: 23, color: "brown" as const, icon: AlertTriangle },
              ].map((metric) => (
                <div key={metric.label} className="p-3 rounded-xl bg-beige-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <metric.icon className="w-4 h-4 text-beige-500" />
                      <p className="text-sm font-medium text-brown-800">{metric.label}</p>
                    </div>
                    <p className="text-sm font-bold text-brown-900">{metric.count}</p>
                  </div>
                  <Progress
                    value={Math.round((metric.count / metric.total) * 100)}
                    size="sm"
                    variant={metric.color}
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-forest-500 to-teal-600 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Mentor Score
              </p>
              <p className="font-heading text-3xl font-bold">4.8</p>
              <p className="text-xs text-white/60 mt-1">Based on 23 reviews this month</p>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
