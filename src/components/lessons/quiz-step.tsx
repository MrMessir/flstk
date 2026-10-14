"use client";

import { useEffect, useMemo, useState } from "react";
import type { QuizQuestion } from "@/lib/types/lesson";

type QuizStepViewProps = {
  questions: QuizQuestion[];
  onAllCorrectChange: (ok: boolean) => void;
  /** If learner already passed this quiz in the session, keep the gate open. */
  initiallyPassed?: boolean;
}

type AnswerState = {
  selected: number | null;
  checked: boolean;
};

export function QuizStepView({
  questions,
  onAllCorrectChange,
  initiallyPassed = false,
}: QuizStepViewProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() =>
    Object.fromEntries(
      questions.map((q) => [
        q.id,
        initiallyPassed
          ? { selected: q.correctIndex, checked: true }
          : { selected: null, checked: false },
      ]),
    ),
  );

  const allCorrect = useMemo(
    () =>
      initiallyPassed ||
      questions.every((q) => {
        const state = answers[q.id];
        return (
          state?.checked &&
          state.selected !== null &&
          state.selected === q.correctIndex
        );
      }),
    [answers, initiallyPassed, questions],
  );

  useEffect(() => {
    onAllCorrectChange(allCorrect);
  }, [allCorrect, onAllCorrectChange]);

  function selectOption(questionId: string, optionIndex: number) {
    setAnswers((prev) => {
      const question = questions.find((q) => q.id === questionId);
      const current = prev[questionId];
      if (
        current?.checked &&
        question &&
        current.selected === question.correctIndex
      ) {
        return prev;
      }
      return {
        ...prev,
        [questionId]: { selected: optionIndex, checked: false },
      };
    });
  }

  function checkAnswer(question: QuizQuestion) {
    setAnswers((prev) => {
      const current = prev[question.id];
      if (current?.selected === null || current?.selected === undefined) {
        return prev;
      }
      return {
        ...prev,
        [question.id]: { ...current, checked: true },
      };
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Ответь на вопросы. Кнопка «Далее» откроется после верных ответов.
      </p>

      <ol className="space-y-5">
        {questions.map((question, index) => {
          const state = answers[question.id] ?? {
            selected: null,
            checked: false,
          };
          const isCorrect =
            state.checked && state.selected === question.correctIndex;
          const isWrong =
            state.checked && state.selected !== question.correctIndex;

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
                  const selected = state.selected === optionIndex;
                  const showAsCorrect =
                    state.checked && optionIndex === question.correctIndex;
                  const showAsWrong =
                    state.checked &&
                    selected &&
                    optionIndex !== question.correctIndex;

                  return (
                    <li key={`${question.id}-${optionIndex}`}>
                      <button
                        type="button"
                        disabled={isCorrect}
                        onClick={() => selectOption(question.id, optionIndex)}
                        className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                          showAsCorrect
                            ? "border-accent bg-accent-soft text-ink"
                            : showAsWrong
                              ? "border-warn/50 bg-[#fff7e8] text-ink"
                              : selected
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

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {!isCorrect ? (
                  <button
                    type="button"
                    disabled={state.selected === null}
                    onClick={() => checkAnswer(question)}
                    className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-signal disabled:opacity-40"
                  >
                    Проверить
                  </button>
                ) : null}
                {isCorrect ? (
                  <p className="text-sm font-medium text-accent">Верно</p>
                ) : null}
                {isWrong ? (
                  <p className="text-sm text-[#7a4a00]">
                    Неверно — попробуй ещё раз
                    {question.explanation ? `. ${question.explanation}` : ""}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {allCorrect ? (
        <p className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-ink">
          Все ответы верны — можно идти дальше.
        </p>
      ) : null}
    </div>
  );
}
