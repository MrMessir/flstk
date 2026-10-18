"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicQuizQuestion } from "@/lib/types/lesson";

type QuizStepViewProps = {
  lessonId: string;
  questions: PublicQuizQuestion[];
  onAllCorrectChange: (ok: boolean) => void;
  /** Тест уже пройден в этой сессии: держим «Далее» открытым. */
  initiallyPassed?: boolean;
};

type QuestionResult = {
  id: string;
  correct: boolean;
  correctIndex?: number;
  explanation?: string;
};

type SubmitResponse = {
  passed: boolean;
  correct: number;
  total: number;
  required: number;
  results: QuestionResult[];
};

export function QuizStepView({
  lessonId,
  questions,
  onAllCorrectChange,
  initiallyPassed = false,
}: QuizStepViewProps) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [outcome, setOutcome] = useState<SubmitResponse | null>(null);
  const [alreadyPassed, setAlreadyPassed] = useState(initiallyPassed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passed = alreadyPassed || outcome?.passed === true;
  const answeredAll = questions.every((q) => selected[q.id] !== undefined);

  // Если тест уже сдан раньше (например, до перезагрузки страницы), не заставляем сдавать заново.
  useEffect(() => {
    if (initiallyPassed) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/quiz/status?lessonId=${encodeURIComponent(lessonId)}`,
          { credentials: "same-origin" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { passed?: boolean };
        if (!cancelled && data.passed) setAlreadyPassed(true);
      } catch {
        // Нет сети: тест можно сдать позже, ничего не ломаем.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId, initiallyPassed]);

  useEffect(() => {
    onAllCorrectChange(passed);
  }, [passed, onAllCorrectChange]);

  const select = useCallback((questionId: string, optionIndex: number) => {
    setSelected((prev) => ({ ...prev, [questionId]: optionIndex }));
    setOutcome((prev) => (prev && !prev.passed ? null : prev));
    setError(null);
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ lessonId, answers: selected }),
      });
      const data = (await res.json()) as SubmitResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Не удалось проверить ответы. Попробуй ещё раз.");
        return;
      }
      setOutcome(data);
    } catch {
      setError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  if (alreadyPassed && !outcome) {
    return (
      <p className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-ink">
        Тест этого урока уже пройден. Можно идти дальше.
      </p>
    );
  }

  const resultById = new Map((outcome?.results ?? []).map((r) => [r.id, r]));
  const locked = outcome?.passed === true;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Ответь на все вопросы и нажми «Проверить». Чтобы пройти дальше, нужно{" "}
        {Math.ceil(questions.length * 0.7 - 1e-9)} верных ответа из{" "}
        {questions.length}.
      </p>

      <ol className="space-y-5">
        {questions.map((question, index) => {
          const result = resultById.get(question.id);
          return (
            <li
              key={question.id}
              className="rounded-xl border border-line bg-paper-elevated p-4 sm:p-5"
            >
              <p className="font-medium text-ink">
                <span className="mr-2 font-mono text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {question.prompt}
              </p>

              <ul className="mt-4 space-y-2">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selected[question.id] === optionIndex;
                  const showCorrect =
                    locked && result?.correctIndex === optionIndex;
                  const showWrong =
                    outcome && !outcome.passed && result && !result.correct && isSelected;
                  return (
                    <li key={`${question.id}-${optionIndex}`}>
                      <button
                        type="button"
                        disabled={locked || busy}
                        onClick={() => select(question.id, optionIndex)}
                        aria-pressed={isSelected}
                        className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                          showCorrect
                            ? "border-accent bg-accent-soft text-ink"
                            : showWrong
                              ? "border-warn/50 bg-[#fff7e8] text-ink"
                              : isSelected
                                ? "border-accent bg-white text-ink"
                                : "border-line bg-white/70 text-ink/85 hover:border-accent/50"
                        }`}
                      >
                        {option}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {result ? (
                <p
                  className={`mt-3 text-sm ${
                    result.correct ? "font-medium text-accent" : "text-[#7a4a00]"
                  }`}
                  role="status"
                >
                  {result.correct ? "Верно" : "Неверно"}
                  {result.explanation ? `. ${result.explanation}` : ""}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {error ? (
        <p className="text-sm text-[#7a4a00]" role="alert">
          {error}
        </p>
      ) : null}

      {outcome ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm text-ink ${
            outcome.passed
              ? "border-accent/30 bg-accent-soft"
              : "border-warn/40 bg-[#fff7e8]"
          }`}
          role="status"
        >
          {outcome.passed
            ? `Тест пройден: ${outcome.correct} из ${outcome.total}. Можно идти дальше.`
            : `Верно ${outcome.correct} из ${outcome.total}, нужно ${outcome.required}. Исправь отмеченные вопросы и проверь снова.`}
        </p>
      ) : null}

      {!locked ? (
        <button
          type="button"
          disabled={!answeredAll || busy}
          onClick={() => void submit()}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-signal disabled:opacity-40"
        >
          {busy ? "Проверяю…" : "Проверить ответы"}
        </button>
      ) : null}
    </div>
  );
}
