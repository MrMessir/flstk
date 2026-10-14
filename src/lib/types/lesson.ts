export type CoursePart =
  | "tools"
  | "html"
  | "css"
  | "javascript"
  | "typescript"
  | "react"
  | "nodejs"
  | "database"
  | "security"
  | "fullstack"
  | "testing"
  | "devops"
  | "capstone"
  | "career";

export type CourseBlock = "basics" | "frontend" | "backend" | "advanced" | "finale";

export type TheoryBlock =
  | { type: "paragraph"; content: string }
  | { type: "heading"; content: string }
  | { type: "list"; ordered?: boolean; items: string[] };

export type PracticeTask = {
  title: string;
  description: string;
};

export type LessonLink = {
  title: string;
  url: string;
};

export type GlossaryEntry = {
  term: string;
  meaning: string;
  example: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  /** Index of the correct option in `options` */
  correctIndex: number;
  explanation?: string;
};

export type LessonStepType = "theory" | "quiz" | "practice" | "project";

export type TheoryStep = {
  type: "theory";
  title: string;
  theory: TheoryBlock[];
  codeExample?: string;
};

export type QuizStep = {
  type: "quiz";
  title: string;
  questions: QuizQuestion[];
};

export type PracticeStep = {
  type: "practice";
  title: string;
  practice: PracticeTask[];
  codeExample?: string;
  checklist: string[];
};

export type ProjectStep = {
  type: "project";
  title: string;
  theory: TheoryBlock[];
  practice: PracticeTask[];
  codeExample?: string;
  checklist: string[];
};

export type LessonStep =
  | TheoryStep
  | QuizStep
  | PracticeStep
  | ProjectStep;

export type Lesson = {
  id: string;
  part: CoursePart;
  module: string;
  order: number;
  title: string;
  goal: string;
  /** Derived Stepik-style flow; always filled after normalize */
  steps: LessonStep[];
  /** Legacy flat fields — kept for content JSON and glossary */
  theory: TheoryBlock[];
  codeExample: string;
  practice: PracticeTask[];
  checklist: string[];
  links: LessonLink[];
  glossary: GlossaryEntry[];
  quiz?: QuizQuestion[];
};

export type LessonMeta = Pick<
  Lesson,
  "id" | "part" | "module" | "order" | "title" | "goal"
> & {
  isProject: boolean;
  stepCount: number;
};

export const PART_ORDER: CoursePart[] = [
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
];

export const PART_LABELS: Record<CoursePart, string> = {
  tools: "1. Инструменты и веб",
  html: "2. HTML",
  css: "3. CSS",
  javascript: "4. JavaScript",
  typescript: "5. TypeScript",
  react: "6. React",
  nodejs: "7. Node.js и Express",
  database: "8. Базы данных",
  security: "9. Аутентификация",
  fullstack: "10. Full-stack",
  testing: "11. Тестирование",
  devops: "12. Деплой и DevOps",
  capstone: "13. Итоговый проект",
  career: "14. Карьера",
};

export const PART_BLOCK: Record<CoursePart, CourseBlock> = {
  tools: "basics",
  html: "basics",
  css: "basics",
  javascript: "frontend",
  typescript: "frontend",
  react: "frontend",
  nodejs: "backend",
  database: "backend",
  security: "backend",
  fullstack: "advanced",
  testing: "advanced",
  devops: "advanced",
  capstone: "finale",
  career: "finale",
};

export const BLOCK_LABELS: Record<CourseBlock, string> = {
  basics: "Блок 1. Основы",
  frontend: "Блок 2. Frontend",
  backend: "Блок 3. Backend",
  advanced: "Блок 4. Продвинутые навыки",
  finale: "Блок 5. Финал",
};

export const BLOCK_ORDER: CourseBlock[] = [
  "basics",
  "frontend",
  "backend",
  "advanced",
  "finale",
];

/** Planned lesson counts per module (including project lessons). */
export const PART_PLANNED_COUNT: Record<CoursePart, number> = {
  tools: 11,
  html: 13,
  css: 17,
  javascript: 31,
  typescript: 12,
  react: 21,
  nodejs: 16,
  database: 16,
  security: 15,
  fullstack: 14,
  testing: 13,
  devops: 13,
  capstone: 9,
  career: 12,
};

export const PART_ACCENT: Record<CoursePart, string> = {
  tools: "border-l-[#64748b]",
  html: "border-l-accent",
  css: "border-l-[#3b82f6]",
  javascript: "border-l-[#eab308]",
  typescript: "border-l-[#3178c6]",
  react: "border-l-[#61dafb]",
  nodejs: "border-l-[#68a063]",
  database: "border-l-[#336791]",
  security: "border-l-[#ef4444]",
  fullstack: "border-l-[#8b5cf6]",
  testing: "border-l-[#14b8a6]",
  devops: "border-l-[#0ea5e9]",
  capstone: "border-l-[#f97316]",
  career: "border-l-[#a855f7]",
};

export const MODULE_LABELS: Record<string, string> = {
  // tools
  web: "Как устроен веб",
  setup: "Рабочее окружение",
  git: "Git и GitHub",
  learning: "Как учиться",
  // html
  intro: "Введение в HTML",
  elements: "Основные элементы",
  structure: "Структура и формы",
  quality: "Качество и SEO",
  // css
  "css-basics": "Основы CSS",
  "css-box": "Блочная модель и позиционирование",
  "css-layout": "Современная вёрстка",
  "css-polish": "Оформление и адаптивность",
  "css-modern": "Современный CSS и макеты",
  // javascript
  "js-basics": "Основы языка",
  "js-data": "Функции и структуры данных",
  "js-dom": "DOM и события",
  "js-advanced": "Продвинутый JS",
  "js-tooling": "Инструменты",
  "js-practice": "Тренажёр и проекты",
  // typescript
  "ts-basics": "Основы TypeScript",
  "ts-types": "Типы и generics",
  "ts-app": "TS в приложениях",
  // react
  "react-basics": "Основы React",
  "react-hooks": "Хуки и состояние",
  "react-data": "Данные и маршруты",
  "react-ui": "UI и производительность",
  "react-next": "Next.js App Router",
  // nodejs
  "node-basics": "Основы Node.js",
  "node-express": "Express и REST",
  "node-arch": "Архитектура сервера",
  // database
  "db-sql": "SQL и PostgreSQL",
  "db-design": "Проектирование и ORM",
  "db-ops": "Запросы и эксплуатация",
  "db-cache": "Кэш и Redis",
  // security
  "sec-auth": "Аутентификация",
  "sec-tokens": "Сессии и JWT",
  "sec-hardening": "Безопасность API",
  // fullstack
  "fs-connect": "Связка фронта и бэка",
  "fs-features": "Продуктовые функции",
  "fs-admin": "Админка и UX",
  // testing
  "test-unit": "Unit и интеграция",
  "test-e2e": "E2E и качество процесса",
  "test-craft": "Ревью и рефакторинг",
  // devops
  "ops-docker": "Docker",
  "ops-ci": "CI/CD и хостинг",
  "ops-prod": "Прод и мониторинг",
  // capstone
  "cap-plan": "Идея и проектирование",
  "cap-build": "Разработка",
  "cap-ship": "Качество и защита",
  // career
  "career-market": "Рынок и портфолио",
  "career-interview": "Собеседования",
  "career-offer": "Оффер и рост",
  project: "Итоговая работа",
};

export const STEP_LABELS: Record<LessonStepType, string> = {
  theory: "Теория",
  quiz: "Вопросы",
  practice: "Практика",
  project: "Итоговая работа",
};

export type PlaygroundLanguage = "html" | "css" | "javascript" | "typescript";

const PLAYGROUND_PARTS: CoursePart[] = [
  "html",
  "css",
  "javascript",
  "typescript",
];

export function supportsPlayground(part: CoursePart): boolean {
  return PLAYGROUND_PARTS.includes(part);
}

export function getLessonLanguage(part: CoursePart): PlaygroundLanguage {
  if (part === "css") {
    return "css";
  }
  if (part === "javascript") {
    return "javascript";
  }
  if (part === "typescript") {
    return "typescript";
  }
  return "html";
}

export function isProjectLesson(lesson: Pick<Lesson, "module">): boolean {
  return lesson.module === "project";
}

export function partsForBlock(block: CourseBlock): CoursePart[] {
  return PART_ORDER.filter((part) => PART_BLOCK[part] === block);
}
