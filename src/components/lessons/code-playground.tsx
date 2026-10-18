"use client";

import dynamic from "next/dynamic";
import { useId, useMemo, useRef, useState } from "react";
import type { BeforeMount, OnMount } from "@monaco-editor/react";
import type { CoursePart } from "@/lib/types/lesson";
import { getLessonLanguage } from "@/lib/types/lesson";
import {
  buildCssPage,
  buildHtmlPage,
  buildScriptHtml,
  detectPlaygroundMode,
  stripEmptyExport,
  usesModules,
} from "@/lib/playground/mode";

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

type Monaco = Parameters<OnMount>[1];
type Editor = Parameters<OnMount>[0];

type Diagnostic = { line: number; column: number; message: string };

type DiagnosticChain = { messageText: string; next?: DiagnosticChain[] };

function flatten(message: string | DiagnosticChain): string {
  if (typeof message === "string") return message;
  const parts = [message.messageText];
  for (const next of message.next ?? []) parts.push(flatten(next));
  return parts.join(" ");
}

export function CodePlayground({ initialCode, part }: CodePlaygroundProps) {
  const language = getLessonLanguage(part);
  const mode = useMemo(
    () => detectPlaygroundMode(initialCode, part),
    [initialCode, part],
  );
  const [code, setCode] = useState(initialCode);
  const [preview, setPreview] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const fileLabel = useMemo(() => {
    if (part === "css") return "styles.css";
    if (part === "javascript") return mode === "html" ? "index.html" : "script.js";
    if (part === "typescript") return "script.ts";
    if (part === "html") return "example.html";
    return "example.txt";
  }, [part, mode]);

  // Для TS каждая песочница получает свой «файл», чтобы они не конфликтовали на странице.
  const modelPath = `file:///playground-${uid}/${fileLabel}`;

  const beforeMount: BeforeMount = (monaco) => {
    const ts = monaco.languages.typescript;
    ts.typescriptDefaults.setCompilerOptions({
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      lib: ["es2020", "dom"],
      strict: true,
      allowNonTsExtensions: true,
      // Каждый файл считается модулем: имена вроде name или status
      // не конфликтуют с глобальными именами браузера.
      moduleDetection: 3,
    });
    ts.typescriptDefaults.setEagerModelSync(true);
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  async function runTypeScript() {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) {
      setNotice("Редактор ещё загружается. Попробуй через секунду.");
      return;
    }
    setRunning(true);
    try {
      const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
      const client = await getWorker(model.uri);
      const uri = model.uri.toString();
      const [syntactic, semantic, emit] = await Promise.all([
        client.getSyntacticDiagnostics(uri),
        client.getSemanticDiagnostics(uri),
        client.getEmitOutput(uri),
      ]);
      const toDiagnostic = (d: {
        start?: number;
        messageText: string | DiagnosticChain;
      }): Diagnostic => {
        const pos = model.getPositionAt(d.start ?? 0);
        return {
          line: pos.lineNumber,
          column: pos.column,
          message: flatten(d.messageText),
        };
      };
      setDiagnostics([...syntactic, ...semantic].map(toDiagnostic));

      if (syntactic.length > 0) {
        setPreview(null);
        setNotice("Код не запущен: сначала исправь синтаксические ошибки.");
        return;
      }
      const js = stripEmptyExport(emit.outputFiles[0]?.text ?? "");
      if (!js.trim()) {
        setPreview(null);
        setNotice("Нечего запускать: после компиляции код пустой.");
        return;
      }
      if (usesModules(js)) {
        setPreview(null);
        setNotice(
          "В коде есть import или export. Такие примеры запускай в своём проекте.",
        );
        return;
      }
      setPreview(buildScriptHtml(js));
      setNotice(
        semantic.length > 0
          ? "Есть ошибки типов, они ниже. Код всё равно запущен, как это делает tsc."
          : null,
      );
    } catch {
      setPreview(null);
      setNotice("Не удалось проверить код. Обнови страницу и попробуй снова.");
    } finally {
      setRunning(false);
    }
  }

  async function run() {
    setNotice(null);
    setDiagnostics([]);
    if (mode === "css") setPreview(buildCssPage(code));
    else if (mode === "html") setPreview(buildHtmlPage(code));
    else if (mode === "js") setPreview(buildScriptHtml(code));
    else if (mode === "ts") await runTypeScript();
  }

  if (mode === "none") {
    return (
      <div className="space-y-2">
        <pre className="overflow-x-auto rounded-xl border border-line bg-code-bg p-4 text-sm leading-relaxed text-[#c8d4e8]">
          <code>{initialCode}</code>
        </pre>
        {part === "javascript" || part === "typescript" ? (
          <p className="text-xs text-muted">
            Это пример из нескольких файлов или фрагмент конфига: запусти его у
            себя в проекте.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-code-bg shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-xs text-white/45">{fileLabel}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setCode(initialCode);
              setDiagnostics([]);
              setNotice(null);
            }}
            className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/80 hover:bg-white/5"
          >
            Сбросить
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => void run()}
            className="rounded-md bg-signal px-2.5 py-1 text-xs font-semibold text-signal-ink disabled:opacity-60"
          >
            {mode === "js" || mode === "ts" ? "Запустить" : "Показать"}
          </button>
        </div>
      </div>

      <MonacoEditor
        height="320px"
        path={modelPath}
        language={mode === "html" ? "html" : language}
        theme="vs-dark"
        value={code}
        beforeMount={beforeMount}
        onMount={handleMount}
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

      {notice ? (
        <p className="border-t border-white/10 px-4 py-2 text-xs text-white/70">
          {notice}
        </p>
      ) : null}

      {diagnostics.length > 0 ? (
        <ul className="max-h-40 space-y-1 overflow-y-auto border-t border-white/10 px-4 py-2 font-mono text-xs text-[#ffb4a8]">
          {diagnostics.map((d, index) => (
            <li key={`${d.line}-${d.column}-${index}`}>
              строка {d.line}:{d.column}: {d.message}
            </li>
          ))}
        </ul>
      ) : null}

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
