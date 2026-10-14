import type { CoursePart } from "@/lib/types/lesson";

export type ModuleMeta = {
  weeks: string;
  hours: string;
  projectTitle: string;
  starter?: string;
  blurb: string;
};

/** Hours aligned with lesson depth + project time (realistic part-time). */
export const MODULE_META: Record<CoursePart, ModuleMeta> = {
  tools: {
    weeks: "1 неделя",
    hours: "6–8 ч",
    projectTitle: "Репозиторий-визитка на GitHub",
    starter: "about-me",
    blurb: "Веб, терминал, Git и GitHub",
  },
  html: {
    weeks: "1–1,5 недели",
    hours: "8–12 ч",
    projectTitle: "Страница-резюме на HTML",
    starter: "html-resume",
    blurb: "Семантика, формы, a11y и SEO-база",
  },
  css: {
    weeks: "2 недели",
    hours: "16–22 ч",
    projectTitle: "Адаптивный лендинг",
    starter: "css-landing",
    blurb: "Flexbox, Grid, адаптив, переменные",
  },
  javascript: {
    weeks: "4–5 недель",
    hours: "35–45 ч",
    projectTitle: "Todo, погода и игра",
    starter: "js-todo",
    blurb: "Язык, DOM, async, API, инструменты",
  },
  typescript: {
    weeks: "1,5–2 недели",
    hours: "12–18 ч",
    projectTitle: "Проект на TypeScript strict",
    starter: "ts-todo",
    blurb: "Типы, generics, zod на границе",
  },
  react: {
    weeks: "6–7 недель",
    hours: "55–70 ч",
    projectTitle: "SPA-каталог с корзиной",
    starter: "react-catalog",
    blurb: "Компоненты, хуки, Router, Query, Next.js",
  },
  nodejs: {
    weeks: "3–4 недели",
    hours: "28–36 ч",
    projectTitle: "REST API блога",
    starter: "api-blog",
    blurb: "Express, REST, валидация, слои",
  },
  database: {
    weeks: "3–4 недели",
    hours: "28–36 ч",
    projectTitle: "API блога + PostgreSQL",
    starter: "api-blog-db",
    blurb: "SQL, Prisma, миграции, Redis",
  },
  security: {
    weeks: "2–3 недели",
    hours: "20–28 ч",
    projectTitle: "Auth: JWT, роли, сброс пароля",
    starter: "api-auth",
    blurb: "Аутентификация и OWASP-база",
  },
  fullstack: {
    weeks: "3–4 недели",
    hours: "30–40 ч",
    projectTitle: "Full-stack блог / таск-менеджер",
    starter: "fullstack-app",
    blurb: "Связка React ↔ API, realtime, админка",
  },
  testing: {
    weeks: "2–3 недели",
    hours: "20–28 ч",
    projectTitle: "Тесты, husky и 3 E2E",
    starter: "testing-kit",
    blurb: "Vitest, RTL, Playwright, ревью",
  },
  devops: {
    weeks: "2–3 недели",
    hours: "20–28 ч",
    projectTitle: "Деплой с HTTPS и CI",
    starter: "devops-deploy",
    blurb: "Docker, Actions, домен, мониторинг",
  },
  capstone: {
    weeks: "5–7 недель",
    hours: "50–70 ч",
    projectTitle: "Итоговый полноценный сайт",
    starter: "capstone",
    blurb: "От идеи до защиты продукта",
  },
  career: {
    weeks: "2 недели",
    hours: "12–18 ч",
    projectTitle: "Портфолио и отклики",
    starter: "career-kit",
    blurb: "Резюме, алгоритмы, собеседования",
  },
};
