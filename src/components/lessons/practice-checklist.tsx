"use client";

import { useProgress } from "@/lib/progress/use-progress";

type PracticeChecklistProps = {
  lessonId: string;
  items: string[];
  onChange?: (allChecked: boolean) => void;
};

export function PracticeChecklist({
  lessonId,
  items,
  onChange,
}: PracticeChecklistProps) {
  const { ready, getChecklist, setChecklist } = useProgress();
  const checks = ready ? getChecklist(lessonId, items.length) : items.map(() => false);

  function toggle(index: number) {
    const next = [...checks];
    next[index] = !next[index];
    setChecklist(lessonId, next);
    onChange?.(next.every(Boolean));
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold tracking-tight">Чек-лист</h3>
      <p className="text-sm text-muted">
        Отметь пункты после практики — без полного чек-листа урок нельзя закрыть.
      </p>
      <ul className="space-y-2 rounded-xl border border-line bg-paper-elevated p-4 sm:p-5">
        {items.map((item, index) => (
          <li key={item}>
            <label className="flex cursor-pointer gap-3 text-sm text-ink sm:text-[15px]">
              <input
                type="checkbox"
                checked={checks[index] ?? false}
                onChange={() => toggle(index)}
                className="mt-1 h-4 w-4 accent-[var(--accent,#0f766e)]"
              />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
