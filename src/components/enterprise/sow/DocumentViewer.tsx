"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SOWSection } from "@/types/enterprise";

interface DocumentViewerProps {
  sections: SOWSection[];
  highlightText?: string;
  highlightPage?: number;
  className?: string;
  fileUrl?: string;
  fileType?: string;
}

export function DocumentViewer({ sections, highlightText, highlightPage, className }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [zoom, setZoom] = React.useState(100);
  const [searchQuery, setSearchQuery] = React.useState("");
  const contentRef = React.useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(sections.length / 2));

  /* Jump to page when highlight changes */
  React.useEffect(() => {
    if (highlightPage && highlightPage > 0) {
      const targetPage = Math.ceil(highlightPage / 2);
      setCurrentPage(Math.min(targetPage, totalPages));
    }
  }, [highlightPage, totalPages]);

  /* Scroll to highlighted text */
  React.useEffect(() => {
    if (highlightText && contentRef.current) {
      const marks = contentRef.current.querySelectorAll("mark");
      if (marks.length > 0) {
        marks[0].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightText, currentPage]);

  const visibleSections = sections.slice((currentPage - 1) * 2, currentPage * 2);

  function renderContent(text: string) {
    if (!highlightText) return text;
    const idx = text.toLowerCase().indexOf(highlightText.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-gold-200 text-gold-900 px-0.5 rounded">{text.slice(idx, idx + highlightText.length)}</mark>
        {text.slice(idx + highlightText.length)}
      </>
    );
  }

  return (
    <div className={cn("card-parchment flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 shrink-0" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        {/* Search */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search in document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-[11px] text-gray-600 bg-transparent outline-none flex-1 min-w-0"
          />
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
            <ZoomOut className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <span className="text-[10px] font-mono text-gray-400 w-8 text-center">{zoom}%</span>
          <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
            <ZoomIn className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Page nav */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30">
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <span className="text-[10px] font-mono text-gray-500">{currentPage}/{totalPages}</span>
          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30">
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-5" style={{ fontSize: `${zoom}%` }}>
        {visibleSections.length > 0 ? (
          <div className="space-y-6">
            {visibleSections.map((sec, idx) => (
              <div key={sec.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                    p.{(currentPage - 1) * 2 + idx + 1}
                  </span>
                  <h3 className="text-[14px] font-semibold text-gray-800">{sec.title}</h3>
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {renderContent(sec.content)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-[12px] text-gray-400">No content available for this page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
