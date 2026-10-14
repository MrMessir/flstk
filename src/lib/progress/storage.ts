import type { ProgressState, ProjectSubmission } from "@/lib/progress/types";

const STORAGE_KEY = "fullstacker-progress-v2";
const LEGACY_KEY = "fullstacker-progress-v1";

function emptyState(): ProgressState {
  return {
    version: 2,
    completed: {},
    checklists: {},
    projects: {},
  };
}

function migrateLegacy(raw: unknown): ProgressState {
  const state = emptyState();
  if (!raw || typeof raw !== "object") {
    return state;
  }

  const record = raw as Record<string, unknown>;

  // v2 already
  if (record.version === 2 && record.completed && typeof record.completed === "object") {
    return {
      version: 2,
      completed: record.completed as Record<string, true>,
      checklists: (record.checklists as Record<string, boolean[]>) ?? {},
      projects: (record.projects as Record<string, ProjectSubmission>) ?? {},
    };
  }

  // v1: { [lessonId]: "completed" }
  for (const [id, status] of Object.entries(record)) {
    if (status === "completed") {
      state.completed[id] = true;
    }
  }
  return state;
}

export function readProgressState(): ProgressState {
  if (typeof window === "undefined") {
    return emptyState();
  }

  try {
    const v2 = window.localStorage.getItem(STORAGE_KEY);
    if (v2) {
      return migrateLegacy(JSON.parse(v2));
    }
    const v1 = window.localStorage.getItem(LEGACY_KEY);
    if (v1) {
      const migrated = migrateLegacy(JSON.parse(v1));
      writeProgressState(migrated);
      return migrated;
    }
    return emptyState();
  } catch {
    return emptyState();
  }
}

export function writeProgressState(state: ProgressState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** @deprecated use readProgressState — kept for gradual migration */
export type ProgressMap = Record<string, "completed">;

export function readLocalProgress(): ProgressMap {
  const state = readProgressState();
  const map: ProgressMap = {};
  for (const id of Object.keys(state.completed)) {
    map[id] = "completed";
  }
  return map;
}

export function writeLocalProgress(map: ProgressMap) {
  const state = readProgressState();
  state.completed = {};
  for (const [id, status] of Object.entries(map)) {
    if (status === "completed") {
      state.completed[id] = true;
    }
  }
  writeProgressState(state);
}

export function markLocalCompleted(lessonId: string) {
  const state = readProgressState();
  state.completed[lessonId] = true;
  writeProgressState(state);
  return state;
}

export function unmarkLocalCompleted(lessonId: string) {
  const state = readProgressState();
  delete state.completed[lessonId];
  writeProgressState(state);
  return state;
}

export function isLocalCompleted(lessonId: string) {
  return Boolean(readProgressState().completed[lessonId]);
}

export function setChecklistLocal(lessonId: string, checks: boolean[]) {
  const state = readProgressState();
  state.checklists[lessonId] = checks;
  writeProgressState(state);
  return state;
}

export function saveProjectLocal(
  lessonId: string,
  submission: Omit<ProjectSubmission, "updatedAt"> & { updatedAt?: string },
) {
  const state = readProgressState();
  state.projects[lessonId] = {
    ...submission,
    updatedAt: submission.updatedAt ?? new Date().toISOString(),
  };
  if (submission.status === "accepted") {
    state.completed[lessonId] = true;
  }
  writeProgressState(state);
  return state;
}
