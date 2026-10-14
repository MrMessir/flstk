"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { Lesson, LessonMeta, LessonStep } from "@/lib/types/lesson";
import {
  MODULE_LABELS,
  PART_LABELS,
  STEP_LABELS,
  isProjectLesson,
  supportsPlayground,
} from "@/lib/types/lesson";
import { TheoryBlocks } from "@/components/lessons/theory-blocks";
import { CodePlayground } from "@/components/lessons/code-playground";
import { CompleteButton } from "@/components/lessons/complete-button";
import { PracticeChecklist } from "@/components/lessons/practice-checklist";
import { ProjectSubmit } from "@/components/lessons/project-submit";
import { GlossaryIconLink } from "@/components/glossary/glossary-icon-link";
import { QuizStepView } from "@/components/lessons/quiz-step";
import { isPublished } from "@/lib/lessons/is-published";
import { MODULE_META } from "@/lib/course/meta";

type LessonPlayerProps = {
  lesson: Lesson;
  prev: LessonMeta | null;
  next: LessonMeta | null;
};

function PracticeBody({
  step,
  part,
  lessonId,
}: {
  step: Extract<LessonStep, { type: "practice" | "project" }>;
  part: Lesson["part"];
  lessonId: string;
}) {
  const starter = MODULE_META[part].starter;

  return (
    <div className="space-y-8">
      {step.type === "project" && step.theory.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight">Задание</h3>
          <TheoryBlocks blocks={step.theory} />
        </div>
      ) : null}

      {step.type === "project" && starter ? (
        <p className="rounded-xl border border-line bg-paper-elevated px-4 py-3 text-sm">
          Стартовый шаблон:{" "}
          <a
            href={`/starters/${starter}/README.md`}
            className="font-medium text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            /starters/{starter}
          </a>
        </p>
      ) : null}

      {step.codeExample ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold tracking-tight">
            {supportsPlayground(part) ? "Песочница" : "Пример кода"}
          </h3>
          {supportsPlayground(part) ? (
            <p className="text-sm text-muted">
              Меняй код прямо здесь. Кнопка «Показать» / «Запустить» откроет
              результат ниже.
            </p>
          ) : (
            <p className="text-sm text-muted">
              Разбери пример и повтори у себя в редакторе или терминале.
            </p>
          )}
          <CodePlayground initialCode={step.codeExample} part={part} />
        </div>
      ) : null}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Что сделать</h3>
        <ol className="space-y-3">
          {step.practice.map((task, index) => (
            <li
              key={task.title}
              className="rounded-xl border border-line bg-paper-elevated p-4 sm:p-5"
            >
              <p className="font-medium text-ink">
                <span className="mr-2 font-mono text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {task.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[15px]">
                {task.description}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {step.checklist.length > 0 ? (
        <PracticeChecklist lessonId={lessonId} items={step.checklist} />
      ) : null}

      {step.type === "project" ? (
        <ProjectSubmit
          lessonId={lessonId}
          part={part}
          checklistLength={step.checklist.length}
        />
      ) : null}
    </div>
  );
}

export function LessonPlayer({ lesson, prev, next }: LessonPlayerProps) {
  const published = isPublished(lesson);
  const moduleLabel = MODULE_LABELS[lesson.module] ?? lesson.module;
  const project = isProjectLesson(lesson);
  const steps = lesson.steps;
  const [stepIndex, setStepIndex] = useState(0);
  /** Highest step index the learner may open (unlocked by Далее). */
  const [maxUnlocked, setMaxUnlocked] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizCleared, setQuizCleared] = useState(false);

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;
  const isFirst = stepIndex === 0;

  const onQuizGate = useCallback((ok: boolean) => {
    setQuizPassed(ok);
    if (ok) setQuizCleared(true);
  }, []);

  const canGoNext = useMemo(() => {
    if (!step) return false;
    if (step.type === "quiz") return quizPassed || quizCleared;
    return true;
  }, [quizCleared, quizPassed, step]);

  function goNext() {
    if (!canGoNext || isLast) return;
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    setMaxUnlocked((m) => Math.max(m, nextIndex));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrev() {
    if (isFirst) return;
    setStepIndex((i) => i - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function jumpTo(index: number) {
    if (index < 0 || index >= steps.length) return;
    if (index > maxUnlocked && !(index === stepIndex + 1 && canGoNext)) {
      return;
    }
    if (index === stepIndex + 1 && canGoNext) {
      goNext();
      return;
    }
    setStepIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 space-y-4 border-b border-line pb-6">
        <p className="text-sm text-muted">
          <Link href="/lessons" className="hover:text-accent">
            Уроки
          </Link>
          <span className="mx-2 text-line">/</span>
          <Link href={`/lessons#${lesson.part}`} className="hover:text-accent">
            {PART_LABELS[lesson.part]}
          </Link>
          <span className="mx-2 text-line">/</span>
          <span>{moduleLabel}</span>
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-ink px-2.5 py-1 text-xs font-medium text-signal">
            {project ? "Итоговая работа" : `Урок ${lesson.order}`}
          </span>
          <span className="text-sm text-muted">
            Шаг {stepIndex + 1} из {steps.length}
          </span>
          <GlossaryIconLink lessonId={lesson.id} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {lesson.title}
        </h1>

        <p className="rounded-xl border border-accent/20 bg-accent-soft px-4 py-3 text-ink">
          <span className="font-semibold">Цель. </span>
          {lesson.goal}
        </p>
      </div>

      {!published ? (
        <div className="rounded-xl border border-warn/30 bg-[#fff7e8] px-5 py-4 text-[#7a4a00]">
          Контент урока ещё готовится. Пока доступны название и цель — вернись к
          готовым урокам в{" "}
          <Link
            href="/lessons"
            className="font-medium underline underline-offset-2"
          >
            программе
          </Link>
          .
        </div>
      ) : (
        <>
          <nav
            className="mb-8 flex flex-wrap gap-2"
            aria-label="Шаги урока"
          >
            {steps.map((s, index) => {
              const active = index === stepIndex;
              const unlocked =
                index <= maxUnlocked || (index === stepIndex + 1 && canGoNext);
              return (
                <button
                  key={`${s.type}-${index}`}
                  type="button"
                  onClick={() => jumpTo(index)}
                  disabled={!unlocked}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                    active
                      ? "bg-accent text-white"
                      : index <= maxUnlocked
                        ? "bg-accent-soft text-accent"
                        : "bg-line/60 text-muted"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {index + 1}. {STEP_LABELS[s.type]}
                </button>
              );
            })}
          </nav>

          <article className="min-w-0 space-y-6">
            <header>
              <h2 className="text-xl font-semibold tracking-tight">
                {step ? STEP_LABELS[step.type] : ""}
                {step && step.title !== STEP_LABELS[step.type]
                  ? ` · ${step.title}`
                  : ""}
              </h2>
            </header>

            {step?.type === "theory" ? (
              <div className="space-y-6">
                <TheoryBlocks blocks={step.theory} />
                {step.codeExample ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold tracking-tight">
                      Пример
                    </h3>
                    <CodePlayground
                      initialCode={step.codeExample}
                      part={lesson.part}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {step?.type === "quiz" ? (
              <QuizStepView
                key={`${lesson.id}-quiz-${stepIndex}`}
                questions={step.questions}
                onAllCorrectChange={onQuizGate}
                initiallyPassed={quizCleared}
              />
            ) : null}

            {step?.type === "practice" || step?.type === "project" ? (
              <PracticeBody
                step={step}
                part={lesson.part}
                lessonId={lesson.id}
              />
            ) : null}

            {lesson.links.length > 0 && isLast ? (
              <section className="space-y-3 border-t border-line pt-6">
                <h3 className="text-lg font-semibold tracking-tight">Ссылки</h3>
                <ul className="space-y-2">
                  {lesson.links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-accent underline-offset-2 hover:underline"
                      >
                        <span aria-hidden className="font-mono text-xs">
                          ↗
                        </span>
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
              <button
                type="button"
                onClick={goPrev}
                disabled={isFirst}
                className="rounded-md border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-40"
              >
                Назад
              </button>

              {!isLast ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="rounded-md bg-signal px-5 py-2.5 text-sm font-semibold text-signal-ink disabled:opacity-40"
                >
                  Далее
                </button>
              ) : (
                <span className="text-sm text-muted">Последний шаг</span>
              )}
            </div>

            {isLast ? (
              <div className="space-y-3">
                <CompleteButton
                  lessonId={lesson.id}
                  checklistLength={lesson.checklist.length}
                  isProject={project}
                />
                {next ? (
                  <Link
                    href={`/lessons/${next.id}`}
                    className="inline-flex rounded-md border border-accent px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent-soft"
                  >
                    Следующий урок →
                  </Link>
                ) : null}
              </div>
            ) : null}
          </article>
        </>
      )}

      <nav
        className="mt-12 grid gap-3 border-t border-line pt-8 sm:grid-cols-2"
        aria-label="Соседние уроки"
      >
        {prev ? (
          <Link
            href={`/lessons/${prev.id}`}
            className="rounded-xl border border-line bg-paper-elevated p-4 transition-colors hover:border-accent"
          >
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
              предыдущий
            </p>
            <p className="mt-1 font-medium text-ink">{prev.title}</p>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/lessons/${next.id}`}
            className="rounded-xl border border-line bg-paper-elevated p-4 text-right transition-colors hover:border-accent sm:justify-self-stretch"
          >
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
              следующий
            </p>
            <p className="mt-1 font-medium text-ink">{next.title}</p>
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
