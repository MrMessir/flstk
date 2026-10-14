"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { CoursePart } from "@/lib/types/lesson";
import { getLessonLanguage, supportsPlayground } from "@/lib/types/lesson";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center bg-code-bg text-sm text-white/50">
      Загрузка редактора…
    </div>
  ),
});

type CodePlaygroundProps = {
  initialCode: string;
  part: CoursePart;
};

function buildPreviewHtml(code: string, part: CoursePart) {
  if (part === "html") {
    return code.includes("<html")
      ? code
      : `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body>${code}</body></html>`;
  }

  if (part === "css") {
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

  // javascript + typescript (TS runs as JS in sandbox for demos)
  return `<!DOCTYPE html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <p id="out">Открой консоль ниже после запуска.</p>
    <script>
      const logs = [];
      const out = document.getElementById("out");
      const print = (...args) => {
        logs.push(args.map(String).join(" "));
        out.textContent = logs.join("\\n");
      };
      console.log = print;
      console.error = print;
      try {
        ${code}
      } catch (error) {
        print("Ошибка: " + error);
      }
    </script>
  </body>
</html>`;
}

export function CodePlayground({ initialCode, part }: CodePlaygroundProps) {
  const language = getLessonLanguage(part);
  const [code, setCode] = useState(initialCode);
  const [preview, setPreview] = useState<string | null>(null);
  const canRun = supportsPlayground(part);

  const fileLabel = useMemo(() => {
    if (part === "css") return "styles.css";
    if (part === "javascript") return "script.js";
    if (part === "typescript") return "script.ts";
    if (part === "html") return "example.html";
    return "example.txt";
  }, [part]);

  if (!canRun) {
    return (
      <pre className="overflow-x-auto rounded-xl border border-line bg-code-bg p-4 text-sm leading-relaxed text-[#c8d4e8]">
        <code>{initialCode}</code>
      </pre>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-code-bg shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-xs text-white/45">{fileLabel}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCode(initialCode)}
            className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/80 hover:bg-white/5"
          >
            Сбросить
          </button>
          <button
            type="button"
            onClick={() => setPreview(buildPreviewHtml(code, part))}
            className="rounded-md bg-signal px-2.5 py-1 text-xs font-semibold text-signal-ink"
          >
            {part === "javascript" || part === "typescript"
              ? "Запустить"
              : "Показать"}
          </button>
        </div>
      </div>

      <MonacoEditor
        height="320px"
        language={language === "typescript" ? "typescript" : language}
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
        }}
      />

      {preview ? (
        <div className="border-t border-white/10 bg-white">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
              результат
            </span>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="text-xs text-muted hover:text-ink"
            >
              Скрыть
            </button>
          </div>
          <iframe
            title="Предпросмотр кода"
            srcDoc={preview}
            sandbox="allow-scripts"
            className="h-[280px] w-full bg-white"
          />
        </div>
      ) : null}
    </div>
  );
}
