"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  UserPlus,
  Users,
  UserCheck,
  Mail,
  UserX,
  ChevronRight,
  Upload,
  Star,
  Briefcase,
  Filter,
  FileUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import {
  Badge,
  Input,
  Avatar,
  AvatarFallback,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  Label,
  Textarea,
} from "@/components/ui";

/* ── Contributor mock data (H5) ── */
interface Contributor {
  id: string;
  anonymizedId: string;
  skills: string[];
  track: "women" | "student" | "general";
  tasksCompleted: number;
  rating: number;
  status: "active" | "inactive" | "onboarding";
}

const mockContributors: Contributor[] = [
  { id: "c-001", anonymizedId: "CTR-A7X", skills: ["Full-Stack", "TypeScript", "React"], track: "women", tasksCompleted: 34, rating: 4.8, status: "active" },
  { id: "c-002", anonymizedId: "CTR-B3K", skills: ["Backend", "NestJS", "PostgreSQL"], track: "student", tasksCompleted: 28, rating: 4.7, status: "active" },
  { id: "c-003", anonymizedId: "CTR-C9R", skills: ["DevOps", "AWS", "Terraform"], track: "general", tasksCompleted: 45, rating: 4.9, status: "active" },
  { id: "c-004", anonymizedId: "CTR-D2M", skills: ["Backend", "Finance", "API"], track: "women", tasksCompleted: 22, rating: 4.6, status: "active" },
  { id: "c-005", anonymizedId: "CTR-E5L", skills: ["Full-Stack", "HR", "React"], track: "student", tasksCompleted: 19, rating: 4.5, status: "active" },
  { id: "c-006", anonymizedId: "CTR-F8W", skills: ["QA", "Playwright", "k6"], track: "general", tasksCompleted: 31, rating: 4.7, status: "active" },
  { id: "c-007", anonymizedId: "CTR-G1N", skills: ["Design", "Figma", "CSS"], track: "women", tasksCompleted: 26, rating: 4.8, status: "active" },
  { id: "c-008", anonymizedId: "CTR-H4P", skills: ["Mobile", "React Native"], track: "student", tasksCompleted: 15, rating: 4.6, status: "onboarding" },
  { id: "c-009", anonymizedId: "CTR-I6T", skills: ["Backend", "Security", "Node.js"], track: "women", tasksCompleted: 37, rating: 4.8, status: "active" },
  { id: "c-010", anonymizedId: "CTR-J2Y", skills: ["UX", "Figma", "Prototype"], track: "general", tasksCompleted: 23, rating: 4.5, status: "inactive" },
  { id: "c-011", anonymizedId: "CTR-K7Q", skills: ["Mobile", "iOS", "Android"], track: "student", tasksCompleted: 12, rating: 4.4, status: "onboarding" },
  { id: "c-012", anonymizedId: "CTR-L3V", skills: ["QA", "Mobile Testing"], track: "women", tasksCompleted: 29, rating: 4.6, status: "active" },
];

/* ── Track badge config ── */
const trackConfig: Record<string, { variant: "teal" | "gold" | "beige"; label: string }> = {
  women: { variant: "teal", label: "Women" },
  student: { variant: "gold", label: "Student" },
  general: { variant: "beige", label: "General" },
};

/* ── Status badge config ── */
const statusConfig: Record<string, { variant: "forest" | "gold" | "beige"; label: string }> = {
  active: { variant: "forest", label: "Active" },
  inactive: { variant: "beige", label: "Inactive" },
  onboarding: { variant: "gold", label: "Onboarding" },
};

/* ── Rating stars ── */
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
      <span className="text-[12px] font-bold text-brown-800 tabular-nums">{rating.toFixed(1)}</span>
    </div>
  );
}

/* ── Stat mini card ── */
function StatMini({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center gap-3 rounded-xl border border-beige-200/50 bg-white/70 backdrop-blur-sm px-4 py-3"
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br",
          accent
        )}
      >
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-[20px] font-bold text-brown-900 leading-none">{value}</p>
        <p className="text-[10px] text-beige-500 font-medium mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

/* ── Bulk Import Dialog ── */
function BulkImportDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-brown-900 font-heading">Bulk Import Contributors</DialogTitle>
          <DialogDescription className="text-beige-500">
            Upload a CSV file with contributor data. Expected columns: Anonymized ID, Skills (comma-separated), Track, Status.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Drop zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
              dragOver
                ? "border-teal-400 bg-teal-50/50"
                : "border-beige-200 bg-beige-50/40"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-3 shadow-md">
              <FileUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-[13px] font-semibold text-brown-800 mb-1">
              Drop your CSV file here
            </p>
            <p className="text-[11px] text-beige-500 mb-3">
              or click to browse your files
            </p>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-beige-200 text-[12px] font-semibold text-brown-700 hover:bg-beige-50 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Choose File
            </button>
          </div>

          {/* Template download */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-beige-100">
            <span className="text-[11px] text-beige-500">Need a template?</span>
            <button className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              Download CSV Template
            </button>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-xl border border-beige-200 text-[12px] font-semibold text-brown-700 hover:bg-beige-50 transition-colors"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2.5 rounded-xl bg-brown-600 hover:bg-brown-700 text-white text-[12px] font-semibold shadow-md hover:shadow-lg hover:shadow-brown-500/25 transition-all opacity-50 cursor-not-allowed"
            disabled
          >
            Import
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════
   CONTRIBUTOR MANAGEMENT PAGE (H5)
   ═══════════════════════════════════ */
export default function ContributorManagementPage() {
  const [search, setSearch] = React.useState("");
  const [segmentFilter, setSegmentFilter] = React.useState("all");

  const filteredContributors = mockContributors.filter((c) => {
    const matchesSearch =
      c.anonymizedId.toLowerCase().includes(search.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesSegment = segmentFilter === "all" || c.track === segmentFilter;
    return matchesSearch && matchesSegment;
  });

  const activeCount = mockContributors.filter((c) => c.status === "active").length;
  const womenCount = mockContributors.filter((c) => c.track === "women").length;
  const studentCount = mockContributors.filter((c) => c.track === "student").length;
  const onboardingCount = mockContributors.filter((c) => c.status === "onboarding").length;

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
        <div>
          <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em] font-heading">
            Contributor Management
          </h1>
          <p className="text-[13px] text-beige-500 mt-1">
            View anonymized contributor profiles, skills, and track segments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BulkImportDialog
            trigger={
              <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-beige-200 bg-white/80 hover:bg-beige-50 text-[12px] font-semibold text-brown-700 transition-all hover:-translate-y-0.5">
                <Upload className="w-3.5 h-3.5" />
                Bulk Import
              </button>
            }
          />
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brown-600 hover:bg-brown-700 text-white text-[12px] font-semibold shadow-md hover:shadow-lg hover:shadow-brown-500/25 transition-all hover:-translate-y-0.5">
            <UserPlus className="w-3.5 h-3.5" />
            Add Contributor
          </button>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatMini
          icon={Users}
          label="Total Contributors"
          value={mockContributors.length}
          accent="from-brown-400 to-brown-600"
        />
        <StatMini
          icon={UserCheck}
          label="Active"
          value={activeCount}
          accent="from-forest-400 to-forest-600"
        />
        <StatMini
          icon={Users}
          label="Women Track"
          value={womenCount}
          accent="from-teal-400 to-teal-600"
        />
        <StatMini
          icon={Briefcase}
          label="Student Track"
          value={studentCount}
          accent="from-gold-400 to-gold-600"
        />
      </div>

      {/* Search + Segment Filter bar */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1">
          <Input
            placeholder="Search by anonymized ID or skill..."
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            <SelectItem value="women">Women Track</SelectItem>
            <SelectItem value="student">Student Track</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Contributors table */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anonymized ID</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Track / Segment</TableHead>
              <TableHead className="text-center">Tasks Done</TableHead>
              <TableHead className="text-center">Rating</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContributors.map((contributor) => {
              const tConfig = trackConfig[contributor.track];
              const sConfig = statusConfig[contributor.status];

              return (
                <TableRow key={contributor.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="text-[10px]">
                          {contributor.anonymizedId.slice(-3)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[13px] font-semibold font-mono text-brown-800">
                        {contributor.anonymizedId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[240px]">
                      {contributor.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-beige-100 text-beige-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tConfig.variant} size="sm" dot>
                      {tConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-[13px] font-bold text-brown-800 tabular-nums">
                      {contributor.tasksCompleted}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <RatingStars rating={contributor.rating} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sConfig.variant} size="sm" dot>
                      {sConfig.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredContributors.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-[13px] text-beige-400">No contributors match your filters.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Count footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-beige-100 bg-beige-50/30">
          <span className="text-[11px] text-beige-500">
            Showing <span className="font-semibold text-brown-700">{filteredContributors.length}</span> of{" "}
            <span className="font-semibold text-brown-700">{mockContributors.length}</span> contributors
          </span>
          <div className="flex items-center gap-2">
            {segmentFilter !== "all" && (
              <button
                onClick={() => setSegmentFilter("all")}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear filter
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
