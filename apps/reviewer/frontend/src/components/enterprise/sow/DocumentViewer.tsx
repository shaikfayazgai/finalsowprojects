"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ParsedSection {
  id: string;
  title: string;
  content: string;
  pageNumber?: number;
}

interface DocumentViewerProps {
  sections?: ParsedSection[];
  highlightText?: string;
  highlightPage?: number;
  className?: string;
  fileUrl?: string;
  fileType?: string;
}

export function DocumentViewer({
  sections = [],
  highlightText,
  highlightPage,
  className,
}: DocumentViewerProps) {
  const [zoom, setZoom] = React.useState(100);
  const [docPage, setDocPage] = React.useState(1);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const sorted = React.useMemo(
    () => [...sections].sort((a, b) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0)),
    [sections],
  );

  const totalSections = sorted.length;
  const currentSection = sorted[docPage - 1] ?? null;

  /* Jump to section when highlight page changes */
  React.useEffect(() => {
    if (highlightPage == null) return;
    const idx = sorted.findIndex((s) => s.pageNumber === highlightPage);
    if (idx !== -1) setDocPage(idx + 1);
  }, [highlightPage, sorted]);

  /* Scroll highlight into view */
  React.useEffect(() => {
    if (!highlightText || !contentRef.current) return;
    const id = setTimeout(() => {
      const mark = contentRef.current?.querySelector("mark");
      if (mark) mark.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => clearTimeout(id);
  }, [highlightText, highlightPage, docPage]);

  /* Reset when sections reload */
  React.useEffect(() => { setDocPage(1); }, [totalSections]);

  function renderContent(text: string) {
    if (!highlightText?.trim()) return <>{text}</>;
    const needle = highlightText.trim().toLowerCase();
    const lower = text.toLowerCase();
    const idx = lower.indexOf(needle);
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-amber-200 text-amber-900 px-0.5 rounded-sm font-medium">
          {text.slice(idx, idx + highlightText.trim().length)}
        </mark>
        {text.slice(idx + highlightText.trim().length)}
      </>
    );
  }

  /* Smart page number range — show at most 7 buttons with ellipsis logic */
  function pageNumbers(): (number | "…")[] {
    if (totalSections <= 7) return Array.from({ length: totalSections }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (docPage > 3) pages.push("…");
    for (let i = Math.max(2, docPage - 1); i <= Math.min(totalSections - 1, docPage + 1); i++) pages.push(i);
    if (docPage < totalSections - 2) pages.push("…");
    pages.push(totalSections);
    return pages;
  }

  return (
    <div className={cn("flex flex-col bg-white", className)}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/80 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <BookOpen className="w-3.5 h-3.5 text-brown-400 shrink-0" />
          <span className="text-[11px] font-semibold text-gray-600 truncate">
            {totalSections > 0 ? currentSection?.title ?? `Section ${docPage}` : "Document Preview"}
          </span>
        </div>
        {totalSections > 0 && (
          <span className="text-[10px] text-gray-400 font-medium shrink-0">
            {docPage} / {totalSections}
          </span>
        )}
        <div className="flex items-center gap-0.5 shrink-0 border border-gray-200 rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => setZoom((z) => Math.max(70, z - 10))}
            className="px-2 py-1.5 hover:bg-gray-50 transition-colors border-r border-gray-200"
          >
            <ZoomOut className="w-3 h-3 text-gray-500" />
          </button>
          <span className="text-[10px] font-mono text-gray-500 w-9 text-center select-none">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(140, z + 10))}
            className="px-2 py-1.5 hover:bg-gray-50 transition-colors border-l border-gray-200"
          >
            <ZoomIn className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ── Section content ── */}
      <div
        ref={contentRef}
        className="overflow-y-auto px-5 py-5"
        style={{ fontSize: `${zoom}%`, height: 400 }}
      >
        {currentSection ? (
          <div className="space-y-4">
            {/* Section header */}
            <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brown-50 border border-brown-100 shrink-0 mt-0.5">
                <span className="text-[11px] font-bold text-brown-600">{docPage}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-gray-900 leading-snug">
                  {currentSection.title}
                </h3>
                {currentSection.pageNumber && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-gray-400">
                    <FileText className="w-3 h-3" />
                    Source page {currentSection.pageNumber}
                  </span>
                )}
              </div>
              {highlightPage === currentSection.pageNumber && (
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                  Highlighted
                </span>
              )}
            </div>

            {/* Content body */}
            <p
              className="text-[12.5px] text-gray-600 leading-relaxed whitespace-pre-wrap"
              style={{
                background: highlightPage === currentSection.pageNumber ? "rgba(251,191,36,0.04)" : undefined,
                borderRadius: 8,
                padding: highlightPage === currentSection.pageNumber ? "12px" : undefined,
                border: highlightPage === currentSection.pageNumber ? "1px solid rgba(251,191,36,0.2)" : undefined,
              }}
            >
              {renderContent(currentSection.content)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-400">No sections parsed yet</p>
              <p className="text-[11px] text-gray-300 mt-0.5">
                Click an extracted item to jump to its source.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalSections > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-gray-100 bg-gray-50/60 shrink-0">

          {/* Prev */}
          <button
            onClick={() => setDocPage((p) => Math.max(1, p - 1))}
            disabled={docPage === 1}
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all select-none",
              docPage === 1
                ? "opacity-30 cursor-not-allowed text-gray-400 border-gray-200 bg-white"
                : "text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300",
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers().map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="w-7 text-center text-[11px] text-gray-400 select-none">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setDocPage(p)}
                  className={cn(
                    "w-7 h-7 rounded-lg text-[11px] font-semibold border transition-all select-none",
                    docPage === p
                      ? "bg-brown-500 text-white border-brown-500 shadow-sm"
                      : "text-gray-500 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300",
                  )}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Next */}
          <button
            onClick={() => setDocPage((p) => Math.min(totalSections, p + 1))}
            disabled={docPage === totalSections}
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all select-none",
              docPage === totalSections
                ? "opacity-30 cursor-not-allowed text-gray-400 border-gray-200 bg-white"
                : "text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300",
            )}
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

        </div>
      )}

    </div>
  );
}
