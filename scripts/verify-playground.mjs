// Проверяет, что каждый пример кода в JS и TS уроках можно запустить в песочнице
// (или он явно помечен «только чтение»). Запуск: npm run content:verify:playground
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const { detectPlaygroundMode } = await import("../src/lib/playground/mode.ts");

const options = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  lib: ["lib.es2020.d.ts", "lib.dom.d.ts"],
  strict: true,
  noEmit: true,
  moduleDetection: ts.ModuleDetectionKind.Force,
  skipLibCheck: true,
};

function checkTypeScript(code) {
  const name = "/virtual/script.ts";
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (file, lang, ...rest) =>
    file === name ? ts.createSourceFile(file, code, lang) : original(file, lang, ...rest);
  host.fileExists = (f) => f === name || ts.sys.fileExists(f);
  host.readFile = (f) => (f === name ? code : ts.sys.readFile(f));
  const program = ts.createProgram([name], options, host);
  const diags = [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ];
  return diags.map((d) => {
    const pos = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start) : null;
    return `${pos ? `${pos.line + 1}:${pos.character + 1} ` : ""}${ts.flattenDiagnosticMessageText(d.messageText, " ")}`;
  });
}

function checkScriptBlocks(html) {
  const errors = [];
  for (const m of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      new vm.Script(`try{\n${m[1]}\n}catch(e){}`);
    } catch (e) {
      errors.push(String(e.message));
    }
  }
  return errors;
}

const counts = { js: 0, ts: 0, html: 0, none: 0 };
const problems = [];
for (const part of ["javascript", "typescript"]) {
  const dir = path.join("content", "lessons", part);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const lesson = JSON.parse(readFileSync(path.join(dir, file), "utf8"));
    const mode = detectPlaygroundMode(lesson.codeExample, part);
    counts[mode] = (counts[mode] ?? 0) + 1;
    let errors = [];
    if (mode === "js") {
      try {
        new vm.Script(`try{\n${lesson.codeExample}\n}catch(e){}`);
      } catch (e) {
        errors = [String(e.message)];
      }
    } else if (mode === "ts") {
      errors = checkTypeScript(lesson.codeExample);
    } else if (mode === "html") {
      errors = checkScriptBlocks(lesson.codeExample);
    }
    if (errors.length) problems.push(`${lesson.id} [${mode}]: ${errors.slice(0, 3).join(" | ")}`);
  }
}
console.log("Режимы песочницы:", counts);
if (problems.length) {
  console.error("Примеры, которые не запустятся без ошибок:");
  for (const p of problems) console.error(" -", p);
  process.exit(1);
}
console.log("ok: все примеры JS и TS запускаются или помечены «только чтение»");
