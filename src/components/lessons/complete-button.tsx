"use client";

import Link from "next/link";
import { useState } from "react";
import { useProgress } from "@/lib/progress/use-progress";
import { checklistComplete } from "@/lib/progress/gates";

type CompleteButtonProps = {
  lessonId: string;
  checklistLength: number;
  isProject?: boolean;
};

export function CompleteButton({
  lessonId,
  checklistLength,
  isProject = false,
}: CompleteButtonProps) {
  const {
    ready,
    saving,
    state,
    isCompleted,
    markCompleted,
    supabaseConfigured,
    userEmail,
  } = useProgress();
  const [error, setError] = useState<string | null>(null);

  if (!ready) {
    return (
      <p className="text-sm text-muted" aria-live="polite">
        Загрузка прогресса…
      </p>
    );
  }

  const done = isCompleted(lessonId);
  const checksOk = checklistComplete(lessonId, checklistLength, state);
  const projectOk =
    !isProject || state.projects[lessonId]?.status === "accepted";

  const canComplete = checksOk && projectOk && !done;

  return (
    <div className="space-y-3 rounded-xl border border-line bg-paper-elevated p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canComplete || saving || isProject}
          onClick={() => {
            setError(null);
            void markCompleted(lessonId).then((result) => {
              if (!result.ok) setError(result.error ?? "Ошибка сохранения");
            });
          }}
          className={`rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
            done
              ? "bg-accent-soft text-accent"
              : "bg-signal text-signal-ink hover:brightness-105"
          } disabled:opacity-40`}
        >
          {done
            ? "Урок пройден · слова в словаре"
            : isProject
              ? "Закрывается через сдачу проекта"
              : saving
                ? "Сохраняю…"
                : "Отметить пройденным"}
        </button>
        {done ? (
          <Link
            href={`/glossary?lesson=${lessonId}`}
            className="text-sm text-accent hover:underline"
          >
            Открыть слова урока
          </Link>
        ) : null}
        {!supabaseConfigured ? (
          <span className="text-xs text-muted">Сохранение в этом браузере</span>
        ) : userEmail ? (
          <span className="text-xs text-muted">{userEmail}</span>
        ) : (
          <Link href="/login" className="text-xs text-accent hover:underline">
            Войди, чтобы синхронизировать прогресс
          </Link>
        )}
      </div>
      {!done && !checksOk ? (
        <p className="text-sm text-[#7a4a00]">
          Отметь все пункты чек-листа, чтобы закрыть урок.
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-warn" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
