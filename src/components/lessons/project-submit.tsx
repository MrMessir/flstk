"use client";

import { useState } from "react";
import { MODULE_META } from "@/lib/course/meta";
import type { CoursePart } from "@/lib/types/lesson";
import { useProgress } from "@/lib/progress/use-progress";
import { checklistComplete } from "@/lib/progress/gates";

type ProjectSubmitProps = {
  lessonId: string;
  part: CoursePart;
  checklistLength: number;
};

const SELF_CHECKS = [
  "README с запуском, скрином (если UI) и ссылкой на демо",
  "Нет секретов в git; .env.example без реальных ключей",
  "Критерии готовности урока выполнены в коде",
  "Могу объяснить решение вслух за 3 минуты",
] as const;

function looksLikeRepoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      parsed.hostname.length > 0 &&
      parsed.pathname.length > 1
    );
  } catch {
    return false;
  }
}

export function ProjectSubmit({
  lessonId,
  part,
  checklistLength,
}: ProjectSubmitProps) {
  const { ready, state, getProject, saveProject, markCompleted } =
    useProgress();
  const existing = ready ? getProject(lessonId) : null;
  const [repoUrl, setRepoUrl] = useState(existing?.repoUrl ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [honest, setHonest] = useState(false);
  const [selfChecks, setSelfChecks] = useState<boolean[]>(() =>
    SELF_CHECKS.map(() => false),
  );
  const meta = MODULE_META[part];
  const checksOk = ready
    ? checklistComplete(lessonId, checklistLength, state)
    : false;

  if (!ready) {
    return <p className="text-sm text-muted">Загрузка формы сдачи…</p>;
  }

  const accepted = existing?.status === "accepted";
  const urlOk = looksLikeRepoUrl(repoUrl.trim());
  const noteOk = note.trim().length >= 80;
  const selfOk = selfChecks.every(Boolean);
  const canSubmit = checksOk && urlOk && noteOk && honest && selfOk;

  async function submit() {
    if (!canSubmit) return;
    saveProject(lessonId, {
      repoUrl: repoUrl.trim(),
      note: note.trim(),
      status: "accepted",
    });
    await markCompleted(lessonId);
  }

  return (
    <div className="space-y-4 rounded-xl border border-line bg-paper-elevated p-4 sm:p-5">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Сдача проекта</h3>
        <p className="mt-1 text-sm text-muted">
          {meta.projectTitle}. Без ручной проверки: отметь чек-листы, укажи
          репозиторий — проект засчитывается сразу.
        </p>
      </div>

      {meta.starter ? (
        <p className="text-sm">
          Стартер:{" "}
          <a
            href={`/starters/${meta.starter}/README.md`}
            className="text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            /starters/{meta.starter}
          </a>
        </p>
      ) : null}

      {accepted ? (
        <div className="rounded-md bg-accent-soft px-3 py-2 text-sm text-accent">
          Проект засчитан
          {existing?.repoUrl ? (
            <>
              :{" "}
              <a
                href={existing.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {existing.repoUrl}
              </a>
            </>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Ссылка на репозиторий / демо</span>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/you/project"
              className="w-full rounded-md border border-line bg-white px-3 py-2"
            />
            {repoUrl.trim() && !urlOk ? (
              <span className="text-[#7a4a00]">
                Нужен полный URL (https://…/репозиторий).
              </span>
            ) : null}
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">
              Что сделал (минимум 80 символов)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-line bg-white px-3 py-2"
              placeholder="Стек, ключевые коммиты, что проверял вручную…"
            />
            <span className="text-muted">{note.trim().length}/80</span>
          </label>

          <div className="space-y-2 rounded-md border border-line p-3">
            <p className="text-sm font-medium">Самопроверка перед сдачей</p>
            <ul className="space-y-2">
              {SELF_CHECKS.map((item, index) => (
                <li key={item}>
                  <label className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selfChecks[index]}
                      onChange={(e) => {
                        const next = [...selfChecks];
                        next[index] = e.target.checked;
                        setSelfChecks(next);
                      }}
                      className="mt-1"
                    />
                    <span>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={honest}
              onChange={(e) => setHonest(e.target.checked)}
              className="mt-1"
            />
            <span>
              Подтверждаю, что критерии готовности выполнены и это моя работа.
            </span>
          </label>
          {!checksOk ? (
            <p className="text-sm text-[#7a4a00]">
              Сначала отметь все пункты чек-листа выше.
            </p>
          ) : null}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void submit()}
            className="rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-signal-ink disabled:opacity-40"
          >
            Сдать проект
          </button>
        </div>
      )}
    </div>
  );
}
