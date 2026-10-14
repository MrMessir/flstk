"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Lesson } from "@/lib/types/lesson";
import { PART_LABELS, PART_ORDER } from "@/lib/types/lesson";
import { collectGlossaryTopics } from "@/lib/glossary/collect";
import { useProgress } from "@/lib/progress/use-progress";

type GlossaryViewProps = {
  lessons: Lesson[];
  focusLessonId?: string;
};

export function GlossaryView({ lessons, focusLessonId }: GlossaryViewProps) {
  const { ready, isCompleted } = useProgress();

  const topics = useMemo(
    () => collectGlossaryTopics(lessons, isCompleted),
    [lessons, isCompleted],
  );

  const unlockedCount = topics.filter((topic) => topic.unlocked).length;
  const termCount = topics
    .filter((topic) => topic.unlocked)
    .reduce((sum, topic) => sum + topic.entries.length, 0);

  const visibleTopics = focusLessonId
    ? topics.filter((topic) => topic.lessonId === focusLessonId)
    : topics;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-wider text-accent">
          справочник
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Словарь</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Команды и понятия появляются здесь только после того, как ты отметишь
          урок пройденным. Тема = урок, в котором это изучали.
        </p>
        <p className="text-sm text-ink">
          {ready
            ? `Открыто тем: ${unlockedCount} · слов: ${termCount}`
            : "Загрузка прогресса…"}
        </p>
        {focusLessonId ? (
          <p className="text-sm">
            Показан урок{" "}
            <span className="font-medium">{focusLessonId}</span>.{" "}
            <Link href="/glossary" className="text-accent hover:underline">
              Весь словарь
            </Link>
          </p>
        ) : null}
      </div>

      {PART_ORDER.map((part) => {
        const partTopics = visibleTopics.filter((topic) => topic.part === part);
        if (partTopics.length === 0) {
          return null;
        }

        return (
          <section key={part} className="space-y-4">
            <h2 className="border-b border-line pb-2 text-xl font-semibold">
              {PART_LABELS[part]}
            </h2>

            {partTopics.map((topic) => (
              <article
                key={topic.lessonId}
                id={topic.lessonId}
                className="space-y-3 rounded-xl border border-line bg-paper-elevated p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                      {topic.moduleLabel}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight">
                      {topic.lessonTitle}
                    </h3>
                  </div>
                  <Link
                    href={`/lessons/${topic.lessonId}`}
                    className="text-xs text-accent hover:underline"
                  >
                    к уроку
                  </Link>
                </div>

                {!topic.unlocked ? (
                  <p className="rounded-md border border-line bg-white px-3 py-2 text-sm text-muted">
                    Закрыто. Пройди урок — и сюда добавятся{" "}
                    {topic.entries.length}{" "}
                    {topic.entries.length === 1
                      ? "слово"
                      : topic.entries.length < 5
                        ? "слова"
                        : "слов"}
                    .
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {topic.entries.map((entry) => (
                      <li
                        key={entry.term}
                        className="rounded-lg border border-line bg-white px-3 py-3"
                      >
                        <p className="font-mono text-sm font-semibold text-accent">
                          {entry.term}
                        </p>
                        <p className="mt-1 text-sm text-ink">{entry.meaning}</p>
                        <pre className="mt-2 overflow-x-auto rounded-md bg-code-bg px-3 py-2 font-mono text-xs text-[#d7e0f0]">
                          {entry.example}
                        </pre>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
