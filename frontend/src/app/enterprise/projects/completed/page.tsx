"use client";

import Link from "next/link";
import { useCompletedProjects } from "@/lib/hooks/use-portfolio";
import { CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui";

export default function CompletedProjectsPage() {
  const { data, isLoading } = useCompletedProjects();

  return (
    <div className="max-w-[1200px] mx-auto p-8 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold" style={{ color: "var(--ink)" }}>Completed Projects</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>View completed projects with final status and ratings.</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-beige-200/50 bg-white/70 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="w-4 h-4 rounded-full shrink-0" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.projects && data.projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.projects.map((project) => (
            <Link
              key={project.id}
              href={`/enterprise/projects/${project.id}`}
              className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-[14px] font-bold text-brown-900">{project.name}</h3>
                <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
              </div>
              {project.summary && (
                <p className="text-[12px] text-beige-500 mb-3 line-clamp-2">{project.summary}</p>
              )}
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-md">
                  {project.completion_pct}% Complete
                </span>
                <span className="text-beige-400">
                  {new Date(project.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-beige-300 mx-auto mb-3" />
            <p className="text-[13px] text-beige-500">No completed projects yet.</p>
          </div>
        )
      )}
    </div>
  );
}
