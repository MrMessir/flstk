export type ProjectStatus = "submitted" | "accepted";

export type ProjectSubmission = {
  repoUrl: string;
  note: string;
  status: ProjectStatus;
  updatedAt: string;
};

export type ProgressState = {
  version: 2;
  completed: Record<string, true>;
  checklists: Record<string, boolean[]>;
  projects: Record<string, ProjectSubmission>;
};

export const PASS_RATIO = 0.7;
