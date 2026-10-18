import type { CoursePart } from "@/lib/types/lesson";

/**
 * Как запускать пример кода в уроке:
 * - js   — обычный JavaScript, вывод console.log показывается на странице;
 * - ts   — TypeScript: сначала проверка типов и компиляция, затем запуск как JS;
 * - html — готовая HTML-страница (в том числе с <script> внутри);
 * - css  — стили на демо-странице;
 * - none — пример из нескольких файлов или фрагмент конфига: только чтение.
 */
export type PlaygroundMode = "js" | "ts" | "html" | "css" | "none";

const JSON_FRAGMENT = /^\/\*\s*[\w./-]+\.json\b/i;
const LOCAL_SCRIPT_SRC = /<script[^>]*\ssrc=["'](?!https?:|\/\/)/i;
const LOOKS_LIKE_HTML = /^<(!doctype|html|head|body|!--|[a-z][\w-]*[\s>/])/i;

export function detectPlaygroundMode(
  code: string,
  part: CoursePart,
): PlaygroundMode {
  if (part === "html") return "html";
  if (part === "css") return "css";
  if (part !== "javascript" && part !== "typescript") return "none";

  const text = code.trim();
  if (!text) return "none";
  // Фрагмент package.json и т. п.
  if (JSON_FRAGMENT.test(text)) return "none";
  // Пример ссылается на отдельный файл (script.js): одним блоком не запустить.
  if (LOCAL_SCRIPT_SRC.test(text)) return "none";
  // JavaScript с разметкой: запускаем как HTML-страницу.
  if (LOOKS_LIKE_HTML.test(text)) {
    return part === "javascript" ? "html" : "none";
  }
  // Примеры с import/export рассчитаны на проект с модулями и пакетами (zod, dayjs).
  if (/^\s*(import\s|export\s)/m.test(text)) return "none";
  return part === "typescript" ? "ts" : "js";
}

/** Перехват console.* и вывод на страницу (в том числе асинхронный). */
const CONSOLE_CAPTURE = `<script>
(function () {
  var lines = [];
  var pre = null;
  function fmt(v) {
    if (typeof v === "string") return v;
    if (v instanceof Error) return v.name + ": " + v.message;
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }
  function render() {
    if (!document.body) return;
    if (!pre) {
      pre = document.createElement("pre");
      pre.id = "__console";
      pre.style.cssText = "margin:12px 0 0;padding:8px 10px;background:#f4f4f5;color:#111;border-radius:6px;font:12px/1.5 ui-monospace,monospace;white-space:pre-wrap";
      document.body.appendChild(pre);
    }
    pre.textContent = lines.join("\\n");
  }
  ["log", "info", "warn", "error"].forEach(function (k) {
    console[k] = function () {
      lines.push((k === "error" ? "Ошибка: " : "") + Array.prototype.map.call(arguments, fmt).join(" "));
      render();
    };
  });
  window.addEventListener("error", function (e) { lines.push("Ошибка: " + e.message); render(); });
  window.addEventListener("unhandledrejection", function (e) { lines.push("Ошибка: " + fmt(e.reason)); render(); });
})();
</script>`;

function escapeScript(code: string): string {
  return code.replace(/<\/script/gi, "<\\/script");
}

export function buildScriptHtml(js: string): string {
  return `<!DOCTYPE html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body style="font-family:system-ui,sans-serif;margin:12px">
    ${CONSOLE_CAPTURE}
    <script>
      try {
${escapeScript(js)}
      } catch (error) {
        console.error(error);
      }
    </script>
  </body>
</html>`;
}

export function buildHtmlPage(code: string): string {
  if (/<html[\s>]/i.test(code)) {
    return /<head[^>]*>/i.test(code)
      ? code.replace(/<head[^>]*>/i, (m) => `${m}${CONSOLE_CAPTURE}`)
      : `${CONSOLE_CAPTURE}${code}`;
  }
  return `<!DOCTYPE html>
<html>
  <head><meta charset="UTF-8" />${CONSOLE_CAPTURE}</head>
  <body style="font-family:system-ui,sans-serif;margin:12px">${code}</body>
</html>`;
}

export function buildCssPage(code: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>${code}</style>
  </head>
  <body>
    <header class="header">
      <strong>Logo</strong>
      <nav><a href="#">Уроки</a></nav>
    </header>
    <main class="hero">
      <h1>Заголовок</h1>
      <p>Текст для проверки стилей.</p>
      <a class="button" href="#">Кнопка</a>
    </main>
    <section class="cards">
      <article class="card">Карточка 1</article>
      <article class="card">Карточка 2</article>
      <article class="card">Карточка 3</article>
    </section>
  </body>
</html>`;
}

/** Скомпилированный TS использует модули — одним блоком такой пример не запустить. */
export function usesModules(js: string): boolean {
  return /^\s*(import\s|export\s)/m.test(js.replace(/^\s*export\s*\{\s*\}\s*;?\s*$/gm, ""));
}

/** Убирает служебный `export {}`, который TypeScript добавляет в модули. */
export function stripEmptyExport(js: string): string {
  return js.replace(/^\s*export\s*\{\s*\}\s*;?\s*$/gm, "");
}
