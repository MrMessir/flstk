import { z } from "zod";

export const theoryBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("paragraph"),
    content: z.string().min(1),
  }),
  z.object({
    type: z.literal("heading"),
    content: z.string().min(1),
  }),
  z.object({
    type: z.literal("list"),
    ordered: z.boolean().optional(),
    items: z.array(z.string().min(1)).min(1),
  }),
]);

export const practiceTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const quizQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctIndex: z.number().int().nonnegative(),
  explanation: z.string().optional(),
});

export const lessonStepSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("theory"),
    title: z.string().min(1),
    theory: z.array(theoryBlockSchema),
    codeExample: z.string().optional(),
  }),
  z.object({
    type: z.literal("quiz"),
    title: z.string().min(1),
    questions: z.array(quizQuestionSchema).min(1),
  }),
  z.object({
    type: z.literal("practice"),
    title: z.string().min(1),
    practice: z.array(practiceTaskSchema).min(1),
    codeExample: z.string().optional(),
    checklist: z.array(z.string().min(1)).default([]),
  }),
  z.object({
    type: z.literal("project"),
    title: z.string().min(1),
    theory: z.array(theoryBlockSchema),
    practice: z.array(practiceTaskSchema).min(1),
    codeExample: z.string().optional(),
    checklist: z.array(z.string().min(1)).default([]),
  }),
]);

/** Raw content file shape — steps optional (will be derived). */
export const lessonSchema = z.object({
  id: z.string().min(1),
  part: z.enum([
    "tools",
    "html",
    "css",
    "javascript",
    "typescript",
    "react",
    "nodejs",
    "database",
    "security",
    "fullstack",
    "testing",
    "devops",
    "capstone",
    "career",
  ]),
  module: z.string().min(1),
  order: z.number().int().positive(),
  title: z.string().min(1),
  goal: z.string().min(1),
  theory: z.array(theoryBlockSchema).default([]),
  codeExample: z.string().default(""),
  practice: z.array(practiceTaskSchema).default([]),
  checklist: z.array(z.string().min(1)).default([]),
  links: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .default([]),
  glossary: z
    .array(
      z.object({
        term: z.string().min(1),
        meaning: z.string().min(1),
        example: z.string().min(1),
      }),
    )
    .default([]),
  /** Authored MCQ — preferred over glossary flashcards when present. */
  quiz: z.array(quizQuestionSchema).optional(),
  steps: z.array(lessonStepSchema).optional(),
});

export type LessonSchema = z.infer<typeof lessonSchema>;
