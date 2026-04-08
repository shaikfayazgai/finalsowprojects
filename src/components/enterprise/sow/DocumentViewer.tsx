"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ParsedSection {
  id: string;
  title: string;
  content: string;
  pageNumber?: number;
}

interface DocumentViewerProps {
  /** Parsed text sections from /api/v1/sow/{id}/sections */
  sections?: ParsedSection[];
  /** Text to highlight (from clicked extraction item's sourceHighlight) */
  highlightText?: string;
  /** Page number to jump to */
  highlightPage?: number;
  className?: string;
  /** Legacy props — ignored */
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
  const contentRef = React.useRef<HTMLDivElement>(null);
  const highlightRef = React.useRef<HTMLElement | null>(null);

  /* Scroll highlighted mark into view whenever highlight changes */
  React.useEffect(() => {
    if (!highlightText || !contentRef.current) return;
    // Small delay to let the DOM update after re-render
    const id = setTimeout(() => {
      const mark = contentRef.current?.querySelector("mark");
      if (mark) {
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
        highlightRef.current = mark;
      }
    }, 50);
    return () => clearTimeout(id);
  }, [highlightText, highlightPage]);

  /* Highlight matching text inside a string */
  function renderContent(text: string) {
    if (!highlightText || !highlightText.trim()) return <>{text}</>;
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

  /* Sort sections by page number */
  const sorted = React.useMemo(
    () => [...sections].sort((a, b) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0)),
    [sections],
  );

  const totalPages = sorted.length;

  /* Which page is highlighted */
  const activePage = highlightPage ?? null;

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0 bg-gray-50/60">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-1">
          {totalPages > 0 ? `${totalPages} section${totalPages !== 1 ? "s" : ""} parsed` : "Parsed Document"}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setZoom((z) => Math.max(70, z - 10))}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <span className="text-[10px] font-mono text-gray-500 w-8 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(140, z + 10))}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
        style={{ fontSize: `${zoom}%` }}
      >
        {sorted.length > 0 ? (
          sorted.map((sec) => {
            const isActive = activePage !== null && sec.pageNumber === activePage;
            return (
              <div
                key={sec.id}
                className={cn(
                  "rounded-xl border px-4 py-3.5 transition-colors duration-200",
                  isActive
                    ? "border-amber-300 bg-amber-50/40"
                    : "border-gray-100 bg-white",
                )}
              >
                {/* Section header */}
                <div className="flex items-center gap-2 mb-2">
                  {sec.pageNumber && (
                    <span className="text-[9px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                      p.{sec.pageNumber}
                    </span>
                  )}
                  <h3 className="text-[13px] font-semibold text-gray-800 leading-snug">
                    {sec.title}
                  </h3>
                </div>
                {/* Section content with highlight */}
                <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {renderContent(sec.content)}
                </p>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <FileText className="w-8 h-8 text-gray-200 mb-3" />
            <p className="text-[12px] font-medium text-gray-400">
              {highlightText
                ? "Parsed sections loading…"
                : "Click an extracted item to see its source text here."}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
