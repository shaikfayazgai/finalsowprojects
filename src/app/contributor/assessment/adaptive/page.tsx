"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Send,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockAdaptiveQuestions } from "@/mocks/data/contributor";

/* ═══ Difficulty config ═══ */
const difficultyConfig: Record<string, { bg: string; text: string; label: string }> = {
  beginner: { bg: "bg-gray-100", text: "text-gray-600", label: "Beginner" },
  intermediate: { bg: "bg-teal-50", text: "text-teal-700", label: "Intermediate" },
  advanced: { bg: "bg-gold-50", text: "text-gold-700", label: "Advanced" },
  expert: { bg: "bg-brown-50", text: "text-brown-700", label: "Expert" },
};

/* ═══ PAGE ═══ */

export default function AdaptiveTestPage() {
  const questions = mockAdaptiveQuestions;
  const totalQuestions = questions.length;

  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [questionTimeLeft, setQuestionTimeLeft] = React.useState(questions[0]?.timeLimit ?? 120);
  const [submitted, setSubmitted] = React.useState(false);

  const mountedRef = React.useRef(true);
  React.useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const currentQ = questions[currentIdx] ?? null;
  const answeredCount = Object.keys(answers).length;
  const diff = difficultyConfig[currentQ?.difficulty ?? "intermediate"] || difficultyConfig.intermediate;

  /* ═══ Per-question timer ═══ */
  React.useEffect(() => {
    if (submitted) return;
    setQuestionTimeLeft(currentQ?.timeLimit ?? 120);
  }, [currentIdx, submitted, currentQ?.timeLimit]);

  React.useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!mountedRef.current) return 0;
          /* Auto-advance to next question if timer expires */
          if (currentIdx < totalQuestions - 1) {
            setCurrentIdx((p) => p + 1);
          } else {
            setSubmitted(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIdx, submitted, totalQuestions]);

  /* ═══ Handlers ═══ */
  function selectAnswer(optionId: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionId }));
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  /* ═══ Score ═══ */
  const score = React.useMemo(() => {
    if (!submitted) return 0;
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctAnswer) correct++;
    }
    return Math.round((correct / totalQuestions) * 100);
  }, [submitted, answers, questions, totalQuestions]);

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  /* ═══ Submitted ═══ */
  if (submitted) {
    const correctCount = questions.filter((q) => answers[q.id] === q.correctAnswer).length;
    return (
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="mb-8">
          <Link href="/contributor/assessment" className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-4" aria-label="Back to assessment overview">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessment
          </Link>
          <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
            Adaptive Test Complete
          </h1>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-8 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-4">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-[20px] font-semibold text-gray-900 mb-2">Your Score</h2>
          <div className="num-display text-[48px] text-gray-900 leading-none mb-1">{score}%</div>
          <p className="text-[13px] text-gray-400 mb-6">{correctCount} of {totalQuestions} correct</p>

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
              const qDiff = difficultyConfig[q.difficulty];
              return (
                <div key={q.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50/50">
                  <span className="text-[11px] font-mono text-gray-400 w-5 shrink-0">Q{i + 1}</span>
                  <span className={cn("text-[9px] font-medium uppercase px-2 py-0.5 rounded-full shrink-0", qDiff.bg, qDiff.text)}>
                    {qDiff.label}
                  </span>
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

  /* ═══ Active test ═══ */
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
              Adaptive Skills Test
            </h1>
            <p className="text-[13px] text-gray-400 mt-1">
              Question {currentIdx + 1} of {totalQuestions} &mdash; Targeted depth assessment
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ PROGRESS ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
          <span>{answeredCount} of {totalQuestions} answered</span>
          <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gold-500 transition-all"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </motion.div>

      {/* ═══ QUESTION ═══ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6 max-w-3xl mx-auto"
        >
          {/* Top bar: difficulty + timer */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full",
                diff.bg, diff.text
              )}>
                <Zap className="w-3 h-3" />
                {diff.label}
              </span>
              <span className="inline-flex items-center text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-forest-50 text-forest-700">
                {currentQ.skill}
              </span>
              <span className="text-[10px] text-gray-400">{currentQ.points} pts</span>
            </div>

            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-[13px] font-semibold",
              questionTimeLeft <= 30 ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-700"
            )}>
              <Clock className="w-3.5 h-3.5" />
              {formatTime(questionTimeLeft)}
            </div>
          </div>

          {/* Timer bar */}
          <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden mb-6">
            <motion.div
              className={cn("h-full rounded-full", questionTimeLeft <= 30 ? "bg-red-500" : "bg-teal-500")}
              style={{ width: `${(questionTimeLeft / (currentQ.timeLimit ?? 120)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
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
                      ? "border-gold-400 bg-gold-50/60 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                  )}
                  role="radio"
                  aria-checked={selected}
                  aria-label={`Option ${opt.id}: ${opt.text}`}
                >
                  <span className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    selected ? "border-gold-500 bg-gold-500" : "border-gray-300"
                  )}>
                    {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span className={cn("text-[13px]", selected ? "text-gold-800 font-medium" : "text-gray-700")}>
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

            {currentIdx < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIdx((p) => Math.min(totalQuestions - 1, p + 1))}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2 rounded-xl hover:from-gold-600 hover:to-gold-700 transition-colors"
                aria-label="Next question"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-gradient-to-r from-forest-500 to-forest-600 px-4 py-2 rounded-xl hover:from-forest-600 hover:to-forest-700 transition-colors"
                aria-label="Submit adaptive test"
              >
                <Send className="w-3.5 h-3.5" /> Submit
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ═══ QUESTION DOTS ═══ */}
      <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mt-6">
        {questions.map((q, i) => {
          const isAnswered = !!answers[q.id];
          const isCurrent = i === currentIdx;
          const qDiff = difficultyConfig[q.difficulty];
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(i)}
              className={cn(
                "w-8 h-8 rounded-lg text-[10px] font-medium flex items-center justify-center transition-all",
                isCurrent
                  ? "bg-gold-500 text-white shadow-sm"
                  : isAnswered
                  ? "bg-forest-50 text-forest-700 border border-forest-200"
                  : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
              )}
              aria-label={`Go to question ${i + 1}, ${qDiff.label} difficulty${isAnswered ? ", answered" : ""}`}
            >
              {i + 1}
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
