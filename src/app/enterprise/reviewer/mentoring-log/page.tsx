// @ts-nocheck
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Plus, ChevronDown, ChevronRight,
  CheckCircle2, Save, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockMentoringLog } from "@/mocks/data/enterprise-reviewer";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function MentoringLogPage() {
  const [mentees, setMentees] = React.useState(mockMentoringLog);
  const [expandedMentee, setExpandedMentee] = React.useState<string | null>(mentees[0]?.id ?? null);
  const [addingNote, setAddingNote] = React.useState<string | null>(null);
  const [newNote, setNewNote] = React.useState({ context: "general", note: "" });

  const handleAddNote = (menteeId: string) => {
    if (newNote.note.trim().length < 20) {
      alert("Note must be at least 20 characters.");
      return;
    }
    setMentees(prev => prev.map(m =>
      m.id === menteeId
        ? {
            ...m,
            notes: [...m.notes, {
              id: `note-new-${Date.now()}`,
              date: new Date().toISOString(),
              context: newNote.context,
              contextLabel: newNote.context === "general" ? "General mentoring" : newNote.context,
              note: newNote.note,
            }],
          }
        : m
    ));
    setNewNote({ context: "general", note: "" });
    setAddingNote(null);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Mentoring Log</h1>
        <p className="text-[13px] text-gray-500 mt-1">Your mentoring notes for student contributors.</p>
      </motion.div>

      {/* ═══ MENTEE LIST ═══ */}
      <motion.div variants={fadeUp} className="space-y-5">
        {mentees.map((mentee) => {
          const isExpanded = expandedMentee === mentee.id;
          const isAddingNote = addingNote === mentee.id;

          return (
            <div key={mentee.id} className="card-parchment overflow-hidden">
              {/* Mentee Header */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-black/[0.02] transition-colors"
                onClick={() => setExpandedMentee(isExpanded ? null : mentee.id)}>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-gray-800">{mentee.contributorId}</span>
                    <span className="text-[9px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                      Student
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400">
                    <span>{mentee.tasksCompleted} tasks completed under mentorship</span>
                    <span>·</span>
                    <span className={cn("font-semibold",
                      mentee.acceptanceRate >= 80 ? "text-forest-600" : mentee.acceptanceRate >= 60 ? "text-gold-600" : "text-red-600"
                    )}>
                      {mentee.acceptanceRate}% acceptance rate
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-400">{mentee.notes.length} notes</span>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </div>

              {/* Notes */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ borderTop: "1px solid var(--border-hair)" }}>

                    <div className="px-5 py-4 space-y-3">
                      {/* Notes Timeline */}
                      {mentee.notes.map((note, i) => (
                        <div key={note.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                            {i < mentee.notes.length - 1 && (
                              <div className="w-0.5 flex-1 bg-gray-100 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
                                {note.contextLabel}
                              </span>
                              <span className="text-[10px] text-gray-400">{formatDate(note.date)}</span>
                            </div>
                            <p className="text-[12px] text-gray-700 leading-relaxed">{note.note}</p>
                          </div>
                        </div>
                      ))}

                      {/* Add Note Form */}
                      {isAddingNote ? (
                        <div className="border border-teal-200 rounded-xl p-4 bg-teal-50/30 space-y-3">
                          <p className="text-[11px] font-semibold text-gray-700">Add Mentoring Note</p>
                          <select
                            value={newNote.context}
                            onChange={(e) => setNewNote(n => ({ ...n, context: e.target.value }))}
                            className="w-full text-[12px] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-300 bg-white">
                            <option value="general">General mentoring</option>
                            {mentee.notes.map(n => (
                              <option key={n.id} value={n.context}>{n.contextLabel}</option>
                            ))}
                          </select>
                          <textarea
                            value={newNote.note}
                            onChange={(e) => setNewNote(n => ({ ...n, note: e.target.value }))}
                            placeholder="Write your mentoring note (min 20 characters)..."
                            rows={3}
                            className="w-full text-[12px] border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus:border-teal-300 bg-white"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setAddingNote(null)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all">
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                            <button
                              onClick={() => handleAddNote(mentee.id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold text-white bg-teal-500 hover:bg-teal-600 transition-all">
                              <Save className="w-3.5 h-3.5" /> Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingNote(mentee.id); setNewNote({ context: "general", note: "" }); }}
                          className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl border border-dashed border-gray-300 text-gray-400 hover:border-teal-300 hover:text-teal-500 hover:bg-teal-50 transition-all text-[12px] font-medium">
                          <Plus className="w-3.5 h-3.5" /> Add Mentoring Note
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>

    </motion.div>
  );
}