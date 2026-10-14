"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProgressState, ProjectSubmission } from "@/lib/progress/types";
import {
  markLocalCompleted,
  readProgressState,
  saveProjectLocal,
  setChecklistLocal,
  unmarkLocalCompleted,
  writeProgressState,
} from "@/lib/progress/storage";

function empty(): ProgressState {
  return {
    version: 2,
    completed: {},
    checklists: {},
    projects: {},
  };
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(empty);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const supabaseConfigured = Boolean(supabase);

  useEffect(() => {
    let active = true;

    async function boot() {
      const local = readProgressState();
      if (active) {
        setState(local);
      }

      if (!supabase) {
        if (active) setReady(true);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setUserEmail(null);
        setReady(true);
        return;
      }

      setUserEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id, status")
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (!error && data) {
        const next = { ...local, completed: { ...local.completed } };
        for (const row of data) {
          next.completed[row.lesson_id] = true;
        }
        setState(next);
        writeProgressState(next);
      }

      setReady(true);
    }

    void boot();
    return () => {
      active = false;
    };
  }, [supabase]);

  const isCompleted = useCallback(
    (lessonId: string) => Boolean(state.completed[lessonId]),
    [state.completed],
  );

  const getChecklist = useCallback(
    (lessonId: string, length: number) => {
      const saved = state.checklists[lessonId] ?? [];
      return Array.from({ length }, (_, i) => Boolean(saved[i]));
    },
    [state.checklists],
  );

  const setChecklist = useCallback((lessonId: string, checks: boolean[]) => {
    const next = setChecklistLocal(lessonId, checks);
    setState({ ...next });
  }, []);

  const getProject = useCallback(
    (lessonId: string) => state.projects[lessonId] ?? null,
    [state.projects],
  );

  const saveProject = useCallback(
    (lessonId: string, submission: Omit<ProjectSubmission, "updatedAt">) => {
      const next = saveProjectLocal(lessonId, submission);
      setState({ ...next });
      return next;
    },
    [],
  );

  const markCompleted = useCallback(
    async (lessonId: string): Promise<{ ok: boolean; error?: string }> => {
      setSaving(true);
      const next = markLocalCompleted(lessonId);
      setState({ ...next });

      if (supabaseConfigured) {
        const res = await fetch("/api/progress/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId }),
        }).catch(() => null);
        if (!res || !res.ok) {
          const reverted = unmarkLocalCompleted(lessonId);
          setState({ ...reverted });
          setSaving(false);
          return {
            ok: false,
            error:
              "Не удалось сохранить прогресс на сервере. Проверь сеть и попробуй ещё раз.",
          };
        }
      }

      setSaving(false);
      return { ok: true };
    },
    [supabaseConfigured],
  );

  return {
    ready,
    saving,
    state,
    progress: state,
    userEmail,
    supabaseConfigured,
    isCompleted,
    markCompleted,
    getChecklist,
    setChecklist,
    getProject,
    saveProject,
    completedCount: Object.keys(state.completed).length,
  };
}
