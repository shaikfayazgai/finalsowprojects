"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  ArrowLeft,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn, fadeIn } from "@/lib/utils/motion-variants";
import { mockAssessmentMCQQuestions } from "@/mocks/data/contributor";

/* ═══ Constants ═══ */
const TOTAL_TIME_SECONDS = 45 * 60; /* 45 minutes */

/* ═══ PAGE ═══ */

/* ═══ Shuffle helper — FSD §5.2: Randomize MCQ questions per attempt ═══ */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MCQTestPage() {
  const questions = React.useMemo(() => shuffleArray(mockAssessmentMCQQuestions), []);
  const totalQuestions = questions.length;
  const startTimeRef = React.useRef(new Date().toISOString());

  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [flagged, setFlagged] = React.useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = React.useState(TOTAL_TIME_SECONDS);
  const [submitted, setSubmitted] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const mountedRef = React.useRef(true);
  React.useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const currentQ = questions[currentIdx] ?? null;
  const answeredCount = Object.keys(answers).length;

  /* ═══ Timer countdown ═══ */
  const handleSubmitRef = React.useRef<(() => void) | null>(null);
  React.useEffect(() => {
    if (submitted || serverError) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          if (mountedRef.current) handleSubmitRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [submitted, serverError]);

  /* ═══ Handlers ═══ */
  const handleSubmit = React.useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    // FSD §5.2: Server-side timer validation
    let serverValidation = { valid: true, error: "" };
    try {
      const res = await fetch("/api/assessment/validate-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentType: "mcq",
          startedAt: startTimeRef.current,
          serverTimeLimit: 45,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        serverValidation = { valid: false, error: errData.error || `Server error (${res.status})` };
      } else {
        serverValidation = await res.json();
      }
    } catch (err) {
      console.warn("Server validation unavailable:", err);
    }

    if (!mountedRef.current) return;
    if (serverValidation.valid === false) {
      setServerError(serverValidation.error || "Submission rejected: time limit exceeded");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }, [submitting]);

  handleSubmitRef.current = handleSubmit;

  function selectAnswer(optionId: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ!.id]: optionId }));
  }

  function toggleFlag() {
    if (!currentQ) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) next.delete(currentQ.id);
      else next.add(currentQ.id);
      return next;
    });
  }

  /* ═══ Score calculation ═══ */
  const score = React.useMemo(() => {
    if (!submitted) return 0;
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctAnswer) correct++;
    }
    return Math.round((correct / totalQuestions) * 100);
  }, [submitted, answers, questions, totalQuestions]);

  /* ═══ Format time ═══ */
  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  /* ═══ Server Error — Time Limit Exceeded ═══ */
  if (serverError) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="mb-8">
          <Link href="/contributor/assessment" className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-4" aria-label="Back to assessment overview">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessment
          </Link>
          <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
            Submission Rejected
          </h1>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-[20px] font-semibold text-red-800 mb-2">Time Limit Exceeded</h2>
          <p className="text-[13px] text-red-600 mb-6">{serverError}</p>
          <Link
            href="/contributor/assessment"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-teal-700 hover:text-teal-800 transition-colors"
            aria-label="Return to assessment overview"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Assessment
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  /* ═══ Submitted — Score View ═══ */
  if (submitted) {
    const correctCount = questions.filter((q) => answers[q.id] === q.correctAnswer).length;
    return (
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="mb-8">
          <Link href="/contributor/assessment" className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-4" aria-label="Back to assessment overview">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessment
          </Link>
          <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
            MCQ Test Complete
          </h1>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-8 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-[20px] font-semibold text-gray-900 mb-2">Your Score</h2>
          <div className="num-display text-[48px] text-gray-900 leading-none mb-1">{score}%</div>
          <p className="text-[13px] text-gray-400 mb-6">
            {correctCount} of {totalQuestions} correct
          </p>

          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mb-6">
            <div
              className={cn("h-full rounded-full transition-all", score >= 70 ? "bg-forest-500" : "bg-red-500")}
              style={{ width: `${score}%` }}
            />
          </div>

          <div className={cn(
            "inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full mb-6",
            score >= 70 ? "bg-forest-50 text-forest-700" : "bg-red-50 text-red-600"
          )}>
            {score >= 70 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {score >= 70 ? "Passed" : "Below passing threshold (70%)"}
          </div>

          <div className="space-y-2 text-left mt-4">
            {questions.map((q, i) => {
              const isCorrect = answers[q.id] === q.correctAnswer;
              return (
                <div key={q.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50/50">
                  <span className="text-[11px] font-mono text-gray-400 w-5 shrink-0">Q{i + 1}</span>
                  <span className="text-[12px] text-gray-600 flex-1 truncate">{q.question}</span>
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          <Link
            href="/contributor/assessment"
            className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-teal-700 hover:text-teal-800 transition-colors"
            aria-label="Return to assessment overview"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Assessment
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  /* ═══ Guard: no questions loaded ═══ */
  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8" role="alert">
        <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
        <p className="text-sm text-gray-600">Unable to load questions. Please try again.</p>
        <Link href="/contributor/assessment" className="mt-4 text-sm text-teal-600 hover:text-teal-700">Back to Assessment</Link>
      </div>
    );
  }

  /* ═══ Active Test View ═══ */
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <Link href="/contributor/assessment" className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-4" aria-label="Back to assessment overview">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessment
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
              MCQ Knowledge Test
            </h1>
            <p className="text-[13px] text-gray-400 mt-1">
              Question {currentIdx + 1} of {totalQuestions}
            </p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-[14px] font-semibold",
            timeLeft <= 300 ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-700"
          )}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </motion.div>

      {/* ═══ PROGRESS BAR ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
          <span>{answeredCount} of {totalQuestions} answered</span>
          <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* ═══ QUESTION PANEL ═══ */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6"
            >
              {/* Difficulty + Skill */}
              <div className="flex items-center gap-2 mb-4">
                <span className={cn(
                  "inline-flex items-center text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full",
                  currentQ.difficulty === "beginner" ? "bg-gray-100 text-gray-600" :
                  currentQ.difficulty === "intermediate" ? "bg-teal-50 text-teal-700" :
                  currentQ.difficulty === "advanced" ? "bg-gold-50 text-gold-700" :
                  "bg-brown-50 text-brown-700"
                )}>
                  {currentQ.difficulty}
                </span>
                <span className="inline-flex items-center text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-forest-50 text-forest-700">
                  {currentQ.skill}
                </span>
                {currentQ.points && (
                  <span className="text-[10px] text-gray-400 ml-auto">{currentQ.points} pts</span>
                )}
              </div>

              {/* Question */}
              <h2 className="text-[16px] font-semibold text-gray-800 mb-6">{currentQ.question}</h2>

              {/* Options */}
              <div className="space-y-3" role="radiogroup" aria-label={`Options for question ${currentIdx + 1}`}>
                {currentQ.options?.map((opt) => {
                  const selected = answers[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => selectAnswer(opt.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                        selected
                          ? "border-teal-400 bg-teal-50/60 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                      )}
                      role="radio"
                      aria-checked={selected}
                      aria-label={`Option ${opt.id}: ${opt.text}`}
                    >
                      <span className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        selected ? "border-teal-500 bg-teal-500" : "border-gray-300"
                      )}>
                        {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                      <span className={cn("text-[13px]", selected ? "text-teal-800 font-medium" : "text-gray-700")}>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                  disabled={currentIdx === 0}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-xl transition-colors",
                    currentIdx === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"
                  )}
                  aria-label="Previous question"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  onClick={toggleFlag}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors",
                    flagged.has(currentQ.id) ? "text-gold-700 bg-gold-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  )}
                  aria-label={flagged.has(currentQ.id) ? "Remove flag from question" : "Flag question for review"}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {flagged.has(currentQ.id) ? "Flagged" : "Flag"}
                </button>

                {currentIdx < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((p) => Math.min(totalQuestions - 1, p + 1))}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-colors"
                    aria-label="Next question"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-gradient-to-r from-forest-500 to-forest-600 px-4 py-2 rounded-xl hover:from-forest-600 hover:to-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Submit assessment"
                    aria-busy={submitting}
                  >
                    <Send className="w-3.5 h-3.5" /> {submitting ? "Submitting..." : "Submit"}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ═══ QUESTION NAV SIDEBAR ═══ */}
        <motion.div variants={fadeUp} className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-4">
            <h3 className="text-[12px] font-semibold text-gray-600 mb-3">Questions</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = i === currentIdx;
                const isFlagged = flagged.has(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(i)}
                    className={cn(
                      "w-full aspect-square rounded-lg text-[11px] font-medium flex items-center justify-center transition-all relative",
                      isCurrent
                        ? "bg-teal-500 text-white shadow-sm"
                        : isAnswered
                        ? "bg-forest-50 text-forest-700 border border-forest-200"
                        : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                    )}
                    aria-label={`Go to question ${i + 1}${isAnswered ? ", answered" : ""}${isFlagged ? ", flagged" : ""}`}
                  >
                    {i + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gold-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="w-3 h-3 rounded bg-forest-50 border border-forest-200" /> Answered
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="w-3 h-3 rounded bg-teal-500" /> Current
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="w-3 h-3 rounded bg-gray-50 border border-gray-200 relative">
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-gold-500" />
                </span> Flagged
              </div>
            </div>

            {answeredCount === totalQuestions && (
              <button
                onClick={handleSubmit}
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-[12px] font-medium text-white bg-gradient-to-r from-forest-500 to-forest-600 px-4 py-2.5 rounded-xl hover:from-forest-600 hover:to-forest-700 transition-colors"
                aria-label="Submit all answers"
              >
                <Send className="w-3.5 h-3.5" /> Submit All
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
