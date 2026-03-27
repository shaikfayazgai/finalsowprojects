"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Github,
  Upload,
  Plus,
  X,
  FileText,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";

/* ═══ Types ═══ */

interface PortfolioLink {
  id: string;
  label: string;
  url: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
}

/* ═══ Helpers ═══ */

let nextId = 1;
function genId() {
  return `item-${nextId++}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ═══ PAGE ═══ */

export default function EvidenceUploadPage() {
  const router = useRouter();

  /* ── Portfolio links ── */
  const [portfolioLinks, setPortfolioLinks] = React.useState<PortfolioLink[]>(
    []
  );
  const [showLinkForm, setShowLinkForm] = React.useState(false);
  const [newLinkLabel, setNewLinkLabel] = React.useState("");
  const [newLinkUrl, setNewLinkUrl] = React.useState("");

  function addPortfolioLink() {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    setPortfolioLinks((prev) => [
      ...prev,
      { id: genId(), label: newLinkLabel.trim(), url: newLinkUrl.trim() },
    ]);
    setNewLinkLabel("");
    setNewLinkUrl("");
    setShowLinkForm(false);
  }

  function removePortfolioLink(id: string) {
    setPortfolioLinks((prev) => prev.filter((l) => l.id !== id));
  }

  /* ── GitHub ── */
  const [githubUrl, setGithubUrl] = React.useState("");

  /* ── File uploads ── */
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).map((f) => ({
      id: genId(),
      name: f.name,
      size: f.size,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(id: string) {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-tight">
          Show your work
        </h1>
        <p className="text-[13px] text-gray-400 mt-1.5 leading-relaxed">
          Add links and uploads to help verify your skills (all optional)
        </p>
      </motion.div>

      {/* Single card with 3 sections */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        {/* ── Section 1: Links ── */}
        <div
          className="px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-hair)" }}
        >
          <p className="text-[13px] font-semibold text-gray-800 mb-4">
            Portfolio & Project Links
          </p>

          {/* Added links */}
          <AnimatePresence mode="popLayout">
            {portfolioLinks.map((link) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 py-2">
                  <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-gray-600 truncate">
                      {link.label}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {link.url}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePortfolioLink(link.id)}
                    className="p-1 rounded-lg text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Inline form */}
          <AnimatePresence>
            {showLinkForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="e.g., Personal Portfolio"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                    className="text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400 flex-1"
                    autoFocus
                  />
                  <input
                    type="url"
                    placeholder="e.g., https://myportfolio.com"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addPortfolioLink();
                    }}
                    className="text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400 flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addPortfolioLink}
                    disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
                    className={cn(
                      "text-[12px] font-medium px-4 py-2 rounded-xl transition-colors",
                      newLinkLabel.trim() && newLinkUrl.trim()
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "bg-gray-100 text-gray-300 cursor-not-allowed"
                    )}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkForm(false);
                      setNewLinkLabel("");
                      setNewLinkUrl("");
                    }}
                    className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors px-3 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add link trigger */}
          {!showLinkForm && (
            <button
              type="button"
              onClick={() => setShowLinkForm(true)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700 transition-colors mt-1 border border-gray-200 rounded-xl px-3.5 py-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Add a link
            </button>
          )}

          {/* GitHub */}
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <Github className="w-3.5 h-3.5 text-gray-700" />
              <span className="text-[12px] font-medium text-gray-600">
                GitHub profile
              </span>
            </div>
            <input
              type="url"
              placeholder="e.g., https://github.com/arjun-mehta"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* ── Section 2: Files ── */}
        <div
          className="px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-hair)" }}
        >
          <p className="text-[13px] font-semibold text-gray-800 mb-4">
            Certificates & Documents
          </p>

          {/* Drop zone — compact */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl px-6 py-5 text-center cursor-pointer transition-all duration-200",
              isDragOver
                ? "border-brown-400 bg-brown-50/40"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
            )}
          >
            <Upload
              className={cn(
                "w-6 h-6 mx-auto mb-2",
                isDragOver ? "text-brown-400" : "text-gray-300"
              )}
            />
            <p className="text-[12px] font-medium text-gray-500">
              {isDragOver
                ? "Drop files here"
                : "Drag and drop files, or click to browse"}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              PDF, PNG, JPG up to 25 MB each
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Uploaded files as compact tags */}
          <AnimatePresence>
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap gap-2 mt-3"
              >
                {uploadedFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5"
                  >
                    <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="text-[11px] font-medium text-gray-600 max-w-[120px] truncate">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatFileSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="p-0.5 rounded text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Section 3: Skip note ── */}
        <div className="px-6 py-4">
          <p className="text-[12px] text-gray-400 leading-relaxed">
            You can add more evidence later from your profile
          </p>
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mt-5">
        <button
          type="button"
          onClick={() => router.push("/onboarding/skills")}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button
          type="button"
          onClick={() => router.push("/onboarding/availability")}
          className="flex items-center gap-1.5 text-[12px] font-medium text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl transition-all"
        >
          Continue <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </motion.div>
  );
}
