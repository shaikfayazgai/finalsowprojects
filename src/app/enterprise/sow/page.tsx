"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  Search,
  ArrowUpDown,
  Tag,
  DollarSign,
  Sparkles,
  Activity,
  Shield,
  Eye,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  Badge,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { mockSOWs } from "@/mocks/data/enterprise-sow";

const statusVariantMap: Record<string, "beige" | "forest"> = {
  draft: "beige",
  approved: "forest",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  approved: "Approved",
};

const confidentialityVariantMap: Record<string, "teal" | "beige" | "gold" | "brown"> = {
  public: "teal",
  internal: "beige",
  confidential: "gold",
  restricted: "brown",
};

const confidentialityIcon: Record<string, string> = {
  public: "Public",
  internal: "Internal",
  confidential: "Confidential",
  restricted: "Restricted",
};

function formatCurrency(amount: number): string {
  if (amount === 0) return "--";
  return `$${(amount / 1000).toFixed(0)}K`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function confidenceColor(c: number): string {
  if (c >= 90) return "text-forest-600";
  if (c >= 70) return "text-teal-600";
  if (c > 0) return "text-gold-600";
  return "text-beige-400";
}

function confidenceBg(c: number): string {
  if (c >= 90) return "bg-forest-500";
  if (c >= 70) return "bg-teal-500";
  if (c > 0) return "bg-gold-500";
  return "bg-beige-300";
}

export default function SOWListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [confidentialityFilter, setConfidentialityFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("newest");

  const filtered = React.useMemo(() => {
    let list = [...mockSOWs];

    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }

    if (confidentialityFilter !== "all") {
      list = list.filter((s) => s.confidentiality === confidentialityFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.client.toLowerCase().includes(q)
      );
    }

    if (sort === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sort === "confidence") {
      list.sort((a, b) => b.aiConfidence - a.aiConfidence);
    } else if (sort === "budget") {
      list.sort((a, b) => b.estimatedBudget - a.estimatedBudget);
    }

    return list;
  }, [statusFilter, confidentialityFilter, search, sort]);

  const totalSOWs = mockSOWs.length;
  const approvedCount = mockSOWs.filter((s) => s.status === "approved").length;
  const draftCount = mockSOWs.filter((s) => s.status === "draft").length;
  const avgConfidence = Math.round(
    mockSOWs.filter((s) => s.aiConfidence > 0).reduce((sum, s) => sum + s.aiConfidence, 0) /
      mockSOWs.filter((s) => s.aiConfidence > 0).length
  );
  const totalBudget = mockSOWs.reduce((sum, s) => sum + s.estimatedBudget, 0);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] mx-auto space-y-6"
    >
      {/* Page Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-brown-900 tracking-tight font-heading">
            SOW Repository
          </h1>
          <p className="text-sm text-beige-600 mt-1">
            Manage all Statements of Work -- upload, track, and approve across projects.
          </p>
        </div>
        <Link href="/enterprise/sow/upload">
          <Button variant="gradient-primary" size="md">
            <Upload className="w-4 h-4" />
            Upload SOW
          </Button>
        </Link>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
      >
        {[
          {
            label: "Total SOWs",
            value: totalSOWs.toString(),
            icon: FileText,
            accent: "text-brown-500",
            bg: "bg-brown-50",
          },
          {
            label: "Approved",
            value: approvedCount.toString(),
            icon: Activity,
            accent: "text-forest-600",
            bg: "bg-forest-50",
          },
          {
            label: "Drafts",
            value: draftCount.toString(),
            icon: Eye,
            accent: "text-beige-600",
            bg: "bg-beige-100",
          },
          {
            label: "Avg AI Confidence",
            value: `${avgConfidence}%`,
            icon: Sparkles,
            accent: "text-teal-600",
            bg: "bg-teal-50",
          },
          {
            label: "Total Budget",
            value: `$${(totalBudget / 1000).toFixed(0)}K`,
            icon: DollarSign,
            accent: "text-gold-600",
            bg: "bg-gold-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  stat.bg
                )}
              >
                <stat.icon className={cn("w-3.5 h-3.5", stat.accent)} />
              </div>
              <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-brown-900 tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Filter Row */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        <div className="w-full sm:w-36">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-44">
          <Select value={confidentialityFilter} onValueChange={setConfidentialityFilter}>
            <SelectTrigger className="h-10 text-sm">
              <Shield className="w-3.5 h-3.5 mr-1.5 text-beige-400" />
              <SelectValue placeholder="Confidentiality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="confidential">Confidential</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search by title or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="w-full sm:w-40">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-10 text-sm">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-beige-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="confidence">AI Confidence</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* SOW Table */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Confidentiality</TableHead>
              <TableHead className="text-center">Version</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-center">AI Confidence</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((sow, idx) => (
              <motion.tr
                key={sow.id}
                variants={scaleIn}
                onClick={() => router.push(`/enterprise/sow/${sow.id}`)}
                className="border-b border-beige-100 transition-colors hover:bg-brown-50/50 cursor-pointer group"
              >
                <TableCell className="max-w-[220px]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brown-100 to-beige-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-brown-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-brown-900 truncate group-hover:text-brown-700 transition-colors">
                        {sow.title}
                      </p>
                      <p className="text-[11px] text-beige-500">
                        {sow.pages} pages / {sow.fileSize}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[13px] text-brown-800">{sow.client}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusVariantMap[sow.status]}
                    size="sm"
                    dot
                  >
                    {statusLabel[sow.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={confidentialityVariantMap[sow.confidentiality]}
                    size="sm"
                  >
                    <Shield className="w-2.5 h-2.5" />
                    {confidentialityIcon[sow.confidentiality]}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-[13px] font-mono font-semibold text-brown-700">
                    v{sow.version}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-beige-400" />
                    <span className="text-[12px] text-beige-600">
                      {formatDate(sow.createdAt)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {sow.aiConfidence > 0 ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-beige-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            confidenceBg(sow.aiConfidence)
                          )}
                          style={{ width: `${sow.aiConfidence}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-[12px] font-mono font-bold",
                          confidenceColor(sow.aiConfidence)
                        )}
                      >
                        {sow.aiConfidence}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-beige-400">--</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {sow.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-beige-100/80 text-[10px] font-medium text-beige-700"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                    {sow.tags.length > 2 && (
                      <span className="text-[10px] text-beige-400 font-medium px-1">
                        +{sow.tags.length - 2}
                      </span>
                    )}
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-beige-100 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-beige-400" />
            </div>
            <p className="text-sm font-semibold text-brown-800 mb-1">
              No SOWs found
            </p>
            <p className="text-xs text-beige-500 max-w-xs">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}
      </motion.div>

      {/* Row count */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <p className="text-[12px] text-beige-500">
          Showing {filtered.length} of {totalSOWs} SOWs
        </p>
      </motion.div>
    </motion.div>
  );
}
