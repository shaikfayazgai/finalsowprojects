"use client";

import * as React from "react";
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Search, X, ChevronUp, ChevronDown, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SOWSection } from "@/types/enterprise";

/* ═══════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════ */
interface DocumentViewerProps {
  /** Structured text sections (fallback when no file URL) */
  sections?: SOWSection[];
  highlightText?: string;
  highlightPage?: number;
  /** Actual uploaded file — Object URL from URL.createObjectURL() */
  fileUrl?: string;
  /** MIME type of uploaded file */
  fileType?: string;
  className?: string;
}

/* ═══════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════ */
const isPdf = (type?: string) => type === "application/pdf";
const isDocx = (type?: string) =>
  type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
  type === "application/msword";

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */
export function DocumentViewer({
  sections = [],
  highlightText,
  highlightPage,
  fileUrl,
  fileType,
  className,
}: DocumentViewerProps) {
  /* Decide render mode: pdf | docx | sections */
  const mode = fileUrl
    ? isPdf(fileType) ? "pdf" : isDocx(fileType) ? "docx" : "sections"
    : "sections";

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {mode === "pdf" && <PdfViewer fileUrl={fileUrl!} highlightPage={highlightPage} />}
      {mode === "docx" && <DocxViewer fileUrl={fileUrl!} highlightText={highlightText} />}
      {mode === "sections" && (
        <SectionViewer
          sections={sections}
          highlightText={highlightText}
          highlightPage={highlightPage}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   PDF Viewer — uses browser-native <iframe>
   Built-in search (Ctrl+F), zoom, page nav
   ───────────────────────────────────────────────── */
function PdfViewer({ fileUrl, highlightPage }: { fileUrl: string; highlightPage?: number }) {
  const src = highlightPage ? `${fileUrl}#page=${highlightPage}` : fileUrl;

  return (
    <iframe
      src={src}
      title="SOW Document"
      className="w-full h-full border-0"
      style={{ minHeight: 400 }}
    />
  );
}

/* ─────────────────────────────────────────────────
   DOCX Viewer — mammoth conversion to HTML + search
   ───────────────────────────────────────────────── */
function DocxViewer({ fileUrl, highlightText }: { fileUrl: string; highlightText?: string }) {
  const [html, setHtml] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  /* Convert DOCX to HTML via mammoth */
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(fileUrl);
        const arrayBuffer = await res.arrayBuffer();
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) setHtml(result.value);
      } catch {
        if (!cancelled) setError("Failed to render document. Try uploading as PDF.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [fileUrl]);

  /* Highlight search matches in the rendered HTML */
  const activeQuery = searchQuery.length >= 2 ? searchQuery : highlightText;

  const highlightedHtml = React.useMemo(() => {
    if (!activeQuery || !html) return html;
    const escaped = activeQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return html.replace(regex, '<mark class="bg-gold-200 text-gold-900 px-0.5 rounded">$1</mark>');
  }, [html, activeQuery]);

  /* Scroll to first highlight */
  React.useEffect(() => {
    if (activeQuery && contentRef.current) {
      const timer = setTimeout(() => {
        const mark = contentRef.current?.querySelector("mark");
        mark?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeQuery, highlightedHtml]);

  React.useEffect(() => {
    if (showSearch && searchInputRef.current) searchInputRef.current.focus();
  }, [showSearch]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-brown-500 rounded-full animate-spin" />
        <p className="text-[12px]">Rendering document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 px-6 text-center">
        <FileText className="w-8 h-8 text-gray-200" />
        <p className="text-[12px]">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 shrink-0">
        <span className="text-[11px] font-medium text-gray-500 flex-1">DOCX Preview</span>
        <button
          onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery(""); }}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            showSearch ? "bg-brown-100 text-brown-600" : "hover:bg-gray-100 text-gray-400"
          )}
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50/60 shrink-0">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in document..."
            className="flex-1 text-[12px] text-gray-700 bg-transparent outline-none placeholder:text-gray-300"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-0.5 rounded hover:bg-gray-200 transition-colors">
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-6 py-5 prose prose-sm prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </>
  );
}

/* ─────────────────────────────────────────────────
   Section Viewer — original mock-section rendering
   Used as fallback when no file URL is available
   ───────────────────────────────────────────────── */
function SectionViewer({
  sections,
  highlightText,
  highlightPage,
}: {
  sections: SOWSection[];
  highlightText?: string;
  highlightPage?: number;
}) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [zoom, setZoom] = React.useState(100);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchMatches, setSearchMatches] = React.useState<{ page: number }[]>([]);
  const [activeMatchIdx, setActiveMatchIdx] = React.useState(0);
  const [showSearch, setShowSearch] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const totalPages = Math.max(1, Math.ceil(sections.length / 2));

  React.useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchMatches([]); setActiveMatchIdx(0); return; }
    const q = searchQuery.toLowerCase();
    const matches: { page: number }[] = [];
    sections.forEach((sec, idx) => {
      if (sec.content.toLowerCase().includes(q) || sec.title.toLowerCase().includes(q)) {
        matches.push({ page: Math.ceil((idx + 1) / 2) });
      }
    });
    setSearchMatches(matches);
    setActiveMatchIdx(0);
    if (matches.length > 0) setCurrentPage(matches[0].page);
  }, [searchQuery, sections]);

  React.useEffect(() => {
    if (highlightPage && highlightPage > 0) setCurrentPage(Math.min(Math.ceil(highlightPage / 2), totalPages));
  }, [highlightPage, totalPages]);

  React.useEffect(() => {
    if ((highlightText || searchQuery) && contentRef.current) {
      const t = setTimeout(() => {
        const m = contentRef.current?.querySelectorAll("mark");
        if (m && m.length > 0) m[0].scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [highlightText, searchQuery, currentPage]);

  React.useEffect(() => { if (showSearch && searchInputRef.current) searchInputRef.current.focus(); }, [showSearch]);

  const navigateMatch = (dir: "next" | "prev") => {
    if (searchMatches.length === 0) return;
    const i = dir === "next" ? (activeMatchIdx + 1) % searchMatches.length : (activeMatchIdx - 1 + searchMatches.length) % searchMatches.length;
    setActiveMatchIdx(i);
    setCurrentPage(searchMatches[i].page);
  };

  const visibleSections = sections.slice((currentPage - 1) * 2, currentPage * 2);
  const activeHighlight = searchQuery.length >= 2 ? searchQuery : highlightText;

  function renderContent(text: string) {
    if (!activeHighlight) return text;
    const idx = text.toLowerCase().indexOf(activeHighlight.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-gold-200 text-gold-900 px-0.5 rounded">{text.slice(idx, idx + activeHighlight.length)}</mark>
        {text.slice(idx + activeHighlight.length)}
      </>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
            <ZoomOut className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <span className="text-[10px] font-mono text-gray-400 w-8 text-center">{zoom}%</span>
          <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
            <ZoomIn className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30">
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <span className="text-[10px] font-mono text-gray-500">{currentPage}/{totalPages}</span>
          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30">
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setShowSearch(!showSearch); if (showSearch) { setSearchQuery(""); setSearchMatches([]); } }}
          className={cn("p-1.5 rounded-md transition-colors", showSearch ? "bg-brown-100 text-brown-600" : "hover:bg-gray-100 text-gray-400")}
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      {showSearch && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50/60 shrink-0">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search in document..." className="flex-1 text-[12px] text-gray-700 bg-transparent outline-none placeholder:text-gray-300" />
          {searchQuery && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-mono text-gray-400">{searchMatches.length > 0 ? `${activeMatchIdx + 1}/${searchMatches.length}` : "0 results"}</span>
              <button onClick={() => navigateMatch("prev")} disabled={searchMatches.length === 0} className="p-0.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30"><ChevronUp className="w-3 h-3 text-gray-500" /></button>
              <button onClick={() => navigateMatch("next")} disabled={searchMatches.length === 0} className="p-0.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30"><ChevronDown className="w-3 h-3 text-gray-500" /></button>
              <button onClick={() => { setSearchQuery(""); setSearchMatches([]); }} className="p-0.5 rounded hover:bg-gray-200 transition-colors"><X className="w-3 h-3 text-gray-400" /></button>
            </div>
          )}
        </div>
      )}

      <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-5" style={{ fontSize: `${zoom}%` }}>
        {visibleSections.length > 0 ? (
          <div className="space-y-6">
            {visibleSections.map((sec, idx) => (
              <div key={sec.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">p.{(currentPage - 1) * 2 + idx + 1}</span>
                  <h3 className="text-[14px] font-semibold text-gray-800">{renderContent(sec.title)}</h3>
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{renderContent(sec.content)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-[12px] text-gray-400">No content available for this page.</p>
          </div>
        )}
      </div>
    </>
  );
}
