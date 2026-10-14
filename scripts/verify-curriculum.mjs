import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
// Динамические импорты: tsx не отдаёт именованные экспорты из .ts при статическом import.
const { lessonSchema } = await import("../src/lib/lessons/schema.ts");
const { normalizeLesson } = await import("../src/lib/lessons/normalize-lesson.ts");
const { buildModuleOutlines, isModulePassed, isModuleUnlocked } = await import(
  "../src/lib/progress/gates.ts"
);
const { PART_PLANNED_COUNT, isProjectLesson } = await import(
  "../src/lib/types/lesson.ts"
);
const { judgeSubmission } = await import("../src/lib/duel/judge.ts");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith(".json")) acc.push(p);
  }
  return acc;
}

const files = walk("content/lessons");
const fail = [];
const metas = [];

for (const file of files) {
  try {
    const raw = JSON.parse(readFileSync(file, "utf8"));
    const parsed = lessonSchema.parse(raw);
    const lesson = normalizeLesson(parsed);
    metas.push({
      id: lesson.id,
      part: lesson.part,
      module: lesson.module,
      order: lesson.order,
      title: lesson.title,
      goal: lesson.goal,
      isProject: isProjectLesson(lesson),
      stepCount: lesson.steps.length,
    });
    if (!isProjectLesson(lesson)) {
      const quiz = lesson.steps.find((s) => s.type === "quiz");
      if (!quiz) fail.push(`${lesson.id}: no quiz step`);
      else if (quiz.type === "quiz" && quiz.questions.length === 0) {
        fail.push(`${lesson.id}: empty quiz`);
      }
    }
  } catch (e) {
    fail.push(`${file}: ${e.message}`);
  }
}

console.log(`schema+normalize: ${metas.length}/${files.length}`);

for (const [part, n] of Object.entries(PART_PLANNED_COUNT)) {
  const have = metas.filter((m) => m.part === part).length;
  if (have !== n) fail.push(`PLANNED MISMATCH ${part}: ${have} vs ${n}`);
}

const outlines = buildModuleOutlines(metas);
const tools = outlines.find((o) => o.part === "tools");
const js = outlines.find((o) => o.part === "javascript");

const afterTools = {
  version: 2,
  completed: Object.fromEntries(tools.lessonIds.map((id) => [id, true])),
  checklists: {},
  projects: {
    [tools.projectIds[0]]: {
      repoUrl: "https://github.com/a/b",
      note: "x".repeat(80),
      status: "accepted",
      updatedAt: new Date().toISOString(),
    },
  },
};

if (isModuleUnlocked("typescript", outlines, afterTools)) {
  fail.push("typescript unlocked after tools only — JS should block");
}
if (!isModuleUnlocked("html", outlines, afterTools)) {
  fail.push("html should unlock after tools (optional chain)");
}

const jsLessons = metas
  .filter((m) => m.part === "javascript")
  .sort((a, b) => a.order - b.order);
const need = Math.ceil(jsLessons.length * 0.7);
const onlyFinal = {
  ...afterTools,
  completed: {
    ...afterTools.completed,
    ...Object.fromEntries(jsLessons.slice(0, need).map((m) => [m.id, true])),
  },
  projects: {
    ...afterTools.projects,
    "js-project": {
      repoUrl: "https://github.com/a/b",
      note: "x".repeat(80),
      status: "accepted",
      updatedAt: new Date().toISOString(),
    },
  },
};
if (isModulePassed(js, onlyFinal)) {
  fail.push("JS passed with only js-project — weather/game also required");
}

const allJs = {
  ...onlyFinal,
  completed: {
    ...onlyFinal.completed,
    ...Object.fromEntries(js.projectIds.map((id) => [id, true])),
  },
  projects: {
    ...onlyFinal.projects,
    ...Object.fromEntries(
      js.projectIds.map((id) => [
        id,
        {
          repoUrl: "https://github.com/a/b",
          note: "x".repeat(80),
          status: "accepted",
          updatedAt: new Date().toISOString(),
        },
      ]),
    ),
  },
};
if (!isModulePassed(js, allJs)) fail.push("JS should pass with all 3 projects");
if (!isModuleUnlocked("typescript", outlines, allJs)) {
  fail.push("typescript should unlock after tools+js");
}

const challenges = JSON.parse(
  readFileSync("content/duels/challenges.json", "utf8"),
);
const solutions = {
  "ts-pick":
    "function pick(obj, keys) { const o={}; for (const k of keys) if (k in obj) o[k]=obj[k]; return o; }",
  "react-filter":
    "function filterProducts(products, query) { const q=query.toLowerCase(); return products.filter(p=>p.title.toLowerCase().includes(q)); }",
  "sql-where":
    "function selectWhere(rows, column, value) { return rows.filter(r=>r[column]===value); }",
  "api-status":
    "function httpStatus({authorized,found,method}){ if(!authorized) return 401; if(!found) return 404; if(method==='GET') return 200; if(method==='POST') return 201; return 405; }",
  "js-debounce-count":
    "function groupBy(arr, key){ const o={}; for(const item of arr){ const k=item[key]; (o[k]||=[]).push(item);} return o; }",
};

for (const [id, code] of Object.entries(solutions)) {
  const c = challenges.find((x) => x.id === id);
  if (!c) {
    fail.push(`missing duel ${id}`);
    continue;
  }
  const r = await judgeSubmission(c, code);
  if (!r.ok) fail.push(`duel ${id} FAIL: ${r.report}`);
  else console.log(`duel ${id}: PASS`);
}

console.log("JS gate projects:", js.projectIds.join(", "));
console.log("authored quiz lessons:", metas.filter((m) => {
  const raw = JSON.parse(
    readFileSync(
      files.find((f) => f.endsWith(`${m.id}.json`)),
      "utf8",
    ),
  );
  return Boolean(raw.quiz?.length);
}).length);

// --- Качество текста ---------------------------------------------------
{
  const rawLessons = files.map((f) => ({ f, d: JSON.parse(readFileSync(f, "utf8")) }));
  const mixed = /(?=[A-Za-z]*[А-Яа-яЁё])(?=[А-Яа-яЁё]*[A-Za-z])[A-Za-zА-Яа-яЁё]{4,}/g;
  const walkStrings = (v, cb) => {
    if (typeof v === "string") cb(v);
    else if (Array.isArray(v)) v.forEach((x) => walkStrings(x, cb));
    else if (v && typeof v === "object") Object.values(v).forEach((x) => walkStrings(x, cb));
  };
  const blockText = (b) => b.content ?? (b.items ?? []).join(" ");
  const byPart = new Map();
  const short = [];
  for (const { d } of rawLessons) {
    // 1. Слова, где смешаны кириллица и латиница (опечатки-«гомоглифы»).
    walkStrings(d, (str) => {
      for (const w of str.match(mixed) ?? []) fail.push(`${d.id}: смешанный алфавит в слове «${w}»`);
    });
    // 2. Повторяющиеся блоки теории внутри модуля (признак шаблонного текста).
    const seen = byPart.get(d.part) ?? new Map();
    for (const b of d.theory ?? []) {
      const t = blockText(b);
      if (t.length < 40) continue;
      seen.set(t, (seen.get(t) ?? 0) + 1);
    }
    byPart.set(d.part, seen);
    const total = (d.theory ?? []).reduce((n, b) => n + blockText(b).length, 0);
    if (total < 900) short.push(`${d.id} (${total})`);
  }
  for (const [part, seen] of byPart) {
    for (const [t, n] of seen) {
      if (n >= 3) fail.push(`${part}: блок теории повторяется в ${n} уроках: «${t.slice(0, 50)}…»`);
    }
  }
  if (short.length) console.warn(`Предупреждение: теория короче 900 символов в ${short.length} уроках из ${rawLessons.length} (первые: ${short.slice(0, 12).join(", ")})`);
}

if (fail.length) {
  console.error("FAILS:");
  for (const f of fail) console.error(" -", f);
  process.exit(1);
}
console.log("ALL CHECKS PASSED");
