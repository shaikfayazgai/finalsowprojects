"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Users, BookOpen, Compass, Star, Clock,
  ArrowRight, MessageCircle, Shield, CheckCircle2, Lock,
  Send, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";

/* === Badge === */

const badgeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  forest: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  gold: { bg: "bg-gold-50", text: "text-gold-700", dot: "bg-gold-500" },
  brown: { bg: "bg-brown-50", text: "text-brown-700", dot: "bg-brown-500" },
  beige: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  danger: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

function Badge({ variant, dot, children }: { variant: string; dot?: boolean; children: React.ReactNode }) {
  const s = badgeStyles[variant] || badgeStyles.beige;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full", s.bg, s.text)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />}
      {children}
    </span>
  );
}

/* === Mock Data === */

interface DiscussionReply {
  id: string;
  author: string;
  name: string;
  text: string;
  timeAgo: string;
}

const discussionReplies: Record<string, DiscussionReply[]> = {
  "disc-001": [
    { id: "r1", author: "MA", name: "Maria A.", text: "I recommend using OpenAPI spec with auto-generated docs. It keeps everything in sync.", timeAgo: "1h ago" },
    { id: "r2", author: "JL", name: "James L.", text: "Swagger is great but Redoc gives a nicer reading experience for stakeholders.", timeAgo: "45m ago" },
    { id: "r3", author: "SP", name: "Sara P.", text: "Don't forget to version your API docs alongside the code. Docusaurus works well for this.", timeAgo: "20m ago" },
  ],
  "disc-002": [
    { id: "r1", author: "RK", name: "Ravi K.", text: "Mock the timezone in your test setup. Use a library like timezone-mock for Node.js.", timeAgo: "3h ago" },
    { id: "r2", author: "MA", name: "Maria A.", text: "We freeze time using jest.useFakeTimers and set it to UTC for all tests.", timeAgo: "2h ago" },
  ],
  "disc-003": [
    { id: "r1", author: "JL", name: "James L.", text: "Start with small tasks labelled 'good first issue' to get comfortable with the workflow.", timeAgo: "18h ago" },
    { id: "r2", author: "RK", name: "Ravi K.", text: "Read the contribution guidelines carefully. Each project has different standards.", timeAgo: "12h ago" },
    { id: "r3", author: "SP", name: "Sara P.", text: "Ask questions early! The mentors here are very supportive.", timeAgo: "6h ago" },
  ],
  "disc-004": [
    { id: "r1", author: "MA", name: "Maria A.", text: "Multi-stage builds cut our image size by 60%. Definitely worth the effort.", timeAgo: "1d ago" },
    { id: "r2", author: "RK", name: "Ravi K.", text: "Cache your dependencies layer and only copy source code after. Big speed improvement.", timeAgo: "1d ago" },
  ],
};

const discussions = [
  { id: "disc-001", title: "Best practices for API documentation", replies: 12, timeAgo: "2h ago", author: "RK" },
  { id: "disc-002", title: "How to handle timezone-dependent tests", replies: 8, timeAgo: "5h ago", author: "SP" },
  { id: "disc-003", title: "Tips for first-time contributors", replies: 23, timeAgo: "1d ago", author: "MA" },
  { id: "disc-004", title: "Docker optimization for CI pipelines", replies: 6, timeAgo: "2d ago", author: "JL" },
];

const mentors = [
  { id: "mentor-001", name: "Mentor R-3K", skills: ["React", "TypeScript"], rating: 4.9, availability: "Available" as const },
  { id: "mentor-002", name: "Mentor P-8J", skills: ["Python", "Data Science"], rating: 4.7, availability: "Limited" as const },
  { id: "mentor-003", name: "Mentor S-2L", skills: ["Node.js", "DevOps"], rating: 4.8, availability: "Available" as const },
  { id: "mentor-004", name: "Mentor K-5M", skills: ["Mobile", "Flutter"], rating: 4.6, availability: "Offline" as const },
];

const mentorAvailabilityBadge: Record<string, string> = {
  Available: "forest",
  Limited: "gold",
  Offline: "beige",
};

const mentorGradients = [
  "from-teal-400 to-teal-600",
  "from-brown-400 to-brown-600",
  "from-forest-400 to-forest-600",
  "from-gold-400 to-gold-600",
];

interface PathwayStep {
  step: number;
  title: string;
  hours: number;
  status: "completed" | "in-progress" | "locked";
}

const pathwaySteps: Record<string, PathwayStep[]> = {
  "path-001": [
    { step: 1, title: "Build a REST API with Express", hours: 20, status: "completed" },
    { step: 2, title: "Add Authentication & Authorization", hours: 22, status: "completed" },
    { step: 3, title: "Frontend with React & TypeScript", hours: 24, status: "in-progress" },
    { step: 4, title: "Database Design & ORM Integration", hours: 18, status: "locked" },
    { step: 5, title: "Testing & CI/CD Pipeline", hours: 16, status: "locked" },
    { step: 6, title: "Deploy & Monitor in Production", hours: 20, status: "locked" },
  ],
  "path-002": [
    { step: 1, title: "Linux Fundamentals & Shell Scripting", hours: 18, status: "in-progress" },
    { step: 2, title: "Docker & Container Orchestration", hours: 22, status: "locked" },
    { step: 3, title: "CI/CD with GitHub Actions", hours: 20, status: "locked" },
    { step: 4, title: "Infrastructure as Code with Terraform", hours: 22, status: "locked" },
    { step: 5, title: "Monitoring, Logging & Alerting", hours: 18, status: "locked" },
  ],
  "path-003": [
    { step: 1, title: "SQL Mastery & Query Optimization", hours: 20, status: "completed" },
    { step: 2, title: "ETL Pipelines with Python", hours: 22, status: "in-progress" },
    { step: 3, title: "Data Warehousing Concepts", hours: 18, status: "locked" },
    { step: 4, title: "Stream Processing with Kafka", hours: 22, status: "locked" },
    { step: 5, title: "Data Quality & Governance", hours: 20, status: "locked" },
    { step: 6, title: "Cloud Data Services (AWS/GCP)", hours: 18, status: "locked" },
    { step: 7, title: "Building a Complete Data Platform", hours: 20, status: "locked" },
  ],
};

const pathways = [
  { id: "path-001", title: "Full-Stack Developer", steps: 6, hours: 120, completed: 2 },
  { id: "path-002", title: "DevOps Engineer", steps: 5, hours: 100, completed: 0 },
  { id: "path-003", title: "Data Engineer", steps: 7, hours: 140, completed: 1 },
];

/* === PAGE === */

export default function CommunityPage() {
  const [mentorFormOpen, setMentorFormOpen] = React.useState<string | null>(null);
  const [mentorRequested, setMentorRequested] = React.useState<Record<string, boolean>>({});
  const [mentorFormData, setMentorFormData] = React.useState<Record<string, { message: string; time: string }>>({});
  const [expandedPathway, setExpandedPathway] = React.useState<string | null>(null);
  const [expandedDiscussion, setExpandedDiscussion] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState<Record<string, string>>({});

  const handleOpenMentorForm = (mentorId: string) => {
    if (mentorRequested[mentorId]) return;
    setMentorFormOpen((prev) => (prev === mentorId ? null : mentorId));
  };

  const handleSendMentorRequest = (mentorId: string) => {
    setMentorRequested((prev) => ({ ...prev, [mentorId]: true }));
    setMentorFormOpen(null);
  };

  const handleCancelMentorForm = (mentorId: string) => {
    setMentorFormOpen(null);
    setMentorFormData((prev) => {
      const next = { ...prev };
      delete next[mentorId];
      return next;
    });
  };

  const togglePathway = (pathwayId: string) => {
    setExpandedPathway((prev) => (prev === pathwayId ? null : pathwayId));
  };

  const toggleDiscussion = (discId: string) => {
    setExpandedDiscussion((prev) => (prev === discId ? null : discId));
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* === HEADER === */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
          Community
        </h1>
        <p className="text-[13px] text-gray-400 mt-1">
          Connect with mentors, join discussions, and explore career pathways
        </p>
      </motion.div>

      {/* === KPI ROW === */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active Discussions", value: "12", icon: MessageSquare, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600", sub: "3 new today" },
          { label: "Mentors Available", value: "8", icon: Users, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600", sub: "2 in your area" },
          { label: "Learning Pathways", value: "5", icon: Compass, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600", sub: "1 in progress" },
          { label: "Community Members", value: "342", icon: Users, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600", sub: "+18 this week" },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.iconBg)}>
                <KpiIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>
                <div className="text-[10px] text-gray-400 mt-1">{kpi.sub}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* === 3-COLUMN GRID === */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* -- Column 1: Discussions -- */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Recent Discussions</span>
            <span className="text-[12px] text-gray-400 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="py-2">
            {discussions.map((disc, i) => {
              const isExpanded = expandedDiscussion === disc.id;
              const replies = discussionReplies[disc.id] || [];
              return (
                <div
                  key={disc.id}
                  style={{ borderBottom: i < discussions.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                >
                  <button
                    onClick={() => toggleDiscussion(disc.id)}
                    className="group w-full flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50/50 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-[11px] font-semibold text-gray-500">
                      {disc.author}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-700 leading-snug">
                        {disc.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> {disc.replies} replies
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {disc.timeAgo}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-gray-300 shrink-0 mt-1 transition-transform duration-200", isExpanded && "rotate-180")} />
                  </button>

                  {/* Expanded replies */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-3 ml-11">
                          <div className="border-l-2 border-gray-100 pl-3 space-y-2.5">
                            {replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-[9px] font-semibold text-gray-400">
                                  {reply.author}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[11px] font-semibold text-gray-600">{reply.name}</span>
                                    <span className="text-[10px] text-gray-300">{reply.timeAgo}</span>
                                  </div>
                                  <p className="text-[12px] text-gray-500 leading-relaxed">{reply.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Reply input */}
                          <div className="flex items-center gap-2 mt-3 ml-0">
                            <input
                              type="text"
                              placeholder="Write a reply..."
                              value={replyText[disc.id] || ""}
                              onChange={(e) => setReplyText((prev) => ({ ...prev, [disc.id]: e.target.value }))}
                              className="flex-1 text-[12px] text-gray-600 placeholder:text-gray-300 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brown-300 transition-colors"
                            />
                            <button
                              onClick={() => setReplyText((prev) => ({ ...prev, [disc.id]: "" }))}
                              className="w-8 h-8 rounded-lg bg-gradient-to-r from-brown-400 to-brown-600 flex items-center justify-center text-white shrink-0 hover:from-brown-500 hover:to-brown-700 transition-all"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* -- Column 2: Mentor Directory -- */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Available Mentors</span>
            <span className="text-[12px] text-gray-400 flex items-center gap-1">
              All mentors <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="py-2">
            {mentors.map((mentor, i) => {
              const badgeVariant = mentorAvailabilityBadge[mentor.availability] || "beige";
              const gradient = mentorGradients[i % mentorGradients.length];
              const initials = mentor.name.split(" ").pop()?.replace("-", "") || "??";
              const isRequested = mentorRequested[mentor.id] === true;
              const isFormOpen = mentorFormOpen === mentor.id;
              const formData = mentorFormData[mentor.id] || { message: "", time: "morning" };
              return (
                <div
                  key={mentor.id}
                  className="px-5 py-3.5"
                  style={{ borderBottom: i < mentors.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-[11px] font-semibold shrink-0", gradient)}>
                      {initials.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-gray-700">{mentor.name}</span>
                        <Badge variant={badgeVariant} dot>{mentor.availability}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {mentor.skills.map((skill) => (
                          <span key={skill} className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                        <span className="flex items-center gap-0.5 text-[10px] text-gold-600 ml-1">
                          <Star className="w-3 h-3 fill-gold-400 text-gold-400" /> {mentor.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  {mentor.availability !== "Offline" && (
                    <>
                      <button
                        onClick={() => handleOpenMentorForm(mentor.id)}
                        disabled={isRequested}
                        className={cn(
                          "mt-2.5 w-full text-[11px] font-medium rounded-lg py-1.5 transition-colors flex items-center justify-center gap-1.5",
                          isRequested
                            ? "bg-forest-50 text-forest-600 cursor-default"
                            : "text-brown-600 bg-brown-50 hover:bg-brown-100"
                        )}
                      >
                        {isRequested && <CheckCircle2 className="w-3 h-3" />}
                        {isRequested ? "Requested" : "Request Mentor"}
                      </button>

                      {/* Mentor request form */}
                      <AnimatePresence>
                        {isFormOpen && !isRequested && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 space-y-2.5">
                              <div>
                                <label className="text-[10px] font-medium text-gray-500 mb-1 block">What would you like help with?</label>
                                <textarea
                                  rows={2}
                                  placeholder="Describe what you need guidance on..."
                                  value={formData.message}
                                  onChange={(e) =>
                                    setMentorFormData((prev) => ({
                                      ...prev,
                                      [mentor.id]: { ...formData, message: e.target.value },
                                    }))
                                  }
                                  className="w-full text-[12px] text-gray-600 placeholder:text-gray-300 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brown-300 transition-colors resize-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-medium text-gray-500 mb-1 block">Preferred time</label>
                                <select
                                  value={formData.time}
                                  onChange={(e) =>
                                    setMentorFormData((prev) => ({
                                      ...prev,
                                      [mentor.id]: { ...formData, time: e.target.value },
                                    }))
                                  }
                                  className="w-full text-[12px] text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brown-300 transition-colors"
                                >
                                  <option value="morning">Morning</option>
                                  <option value="afternoon">Afternoon</option>
                                  <option value="evening">Evening</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSendMentorRequest(mentor.id)}
                                  className="flex-1 text-[11px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 rounded-lg py-2 transition-all flex items-center justify-center gap-1.5"
                                >
                                  <Send className="w-3 h-3" /> Send Request
                                </button>
                                <button
                                  onClick={() => handleCancelMentorForm(mentor.id)}
                                  className="text-[11px] font-medium text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* -- Column 3: Career Pathways -- */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Explore Pathways</span>
            <span className="text-[12px] text-gray-400 flex items-center gap-1">
              Browse all <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="py-2">
            {pathways.map((path, i) => {
              const progressPct = path.steps > 0 ? Math.round((path.completed / path.steps) * 100) : 0;
              const isExpanded = expandedPathway === path.id;
              const steps = pathwaySteps[path.id] || [];
              return (
                <div
                  key={path.id}
                  style={{ borderBottom: i < pathways.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                >
                  <button
                    onClick={() => togglePathway(path.id)}
                    className="w-full text-left px-5 py-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium text-gray-700">{path.title}</span>
                      <ChevronDown className={cn("w-4 h-4 text-gray-300 shrink-0 transition-transform duration-200", isExpanded && "rotate-180")} />
                    </div>
                    <div className="flex items-center gap-2 mb-2.5 text-[11px] text-gray-400">
                      <span>{path.steps} steps</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>{path.hours}h</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>{path.completed}/{path.steps} completed</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          path.completed > 0 ? "bg-teal-500" : "bg-gray-200"
                        )}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </button>

                  {/* Expanded pathway steps */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 space-y-1.5">
                          {steps.map((step, si) => {
                            const isFirstIncomplete = step.status !== "completed" && (si === 0 || steps[si - 1].status === "completed" || steps[si - 1].status === "in-progress");
                            const showStartButton = step.status === "in-progress" || (step.status === "locked" && isFirstIncomplete);
                            return (
                              <div
                                key={step.step}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2.5",
                                  step.status === "completed" && "bg-forest-50/50",
                                  step.status === "in-progress" && "bg-brown-50/50",
                                  step.status === "locked" && "bg-gray-50/50"
                                )}
                              >
                                <div className="shrink-0">
                                  {step.status === "completed" && (
                                    <CheckCircle2 className="w-4 h-4 text-forest-500" />
                                  )}
                                  {step.status === "in-progress" && (
                                    <div className="w-4 h-4 rounded-full border-2 border-brown-400 flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-brown-400" />
                                    </div>
                                  )}
                                  {step.status === "locked" && (
                                    <Lock className="w-4 h-4 text-gray-300" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={cn(
                                    "text-[12px] font-medium leading-snug",
                                    step.status === "completed" && "text-forest-700",
                                    step.status === "in-progress" && "text-gray-700",
                                    step.status === "locked" && "text-gray-400"
                                  )}>
                                    Step {step.step}: {step.title}
                                  </div>
                                  <span className={cn(
                                    "text-[10px]",
                                    step.status === "locked" ? "text-gray-300" : "text-gray-400"
                                  )}>
                                    {step.hours}h estimated
                                  </span>
                                </div>
                                {step.status === "in-progress" && (
                                  <Link href="/contributor/tasks">
                                    <button className="text-[10px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-3 py-1.5 rounded-lg transition-all shrink-0">
                                      Start
                                    </button>
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* === COMMUNITY GUIDELINES === */}
      <motion.div variants={fadeUp} className="card-parchment mb-8">
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <Shield className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">Community Guidelines</span>
        </div>
        <div className="px-5 py-4">
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Our community thrives on respectful communication and mutual support. Be constructive in discussions,
            maintain confidentiality about project details, and treat all members with dignity regardless of
            experience level. Mentors volunteer their time — please be mindful and prepared when requesting
            guidance. Harassment, discrimination, or sharing of proprietary information will result in
            community access being revoked.
          </p>
        </div>
      </motion.div>

    </motion.div>
  );
}
