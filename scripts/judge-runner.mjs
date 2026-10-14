#!/usr/bin/env node
/**
 * Isolated judge process. Parent kills us on timeout.
 * Reads JSON from stdin: { code, functionName, tests }
 * Writes JSON to stdout: { ok, report }
 */
import vm from "node:vm";
import { readFileSync } from "node:fs";

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function looksDangerousJs(code) {
  const patterns = [
    /\brequire\s*\(/,
    /\bimport\s*\(/,
    /\bprocess\b/,
    /\bglobalThis\b/,
    /\bglobal\b/,
    /\bFunction\s*\(/,
    /\beval\s*\(/,
    /\bchild_process\b/,
    /\bfs\b\s*\./,
    /\bworker_threads\b/,
    /constructor\s*\[\s*['"]constructor['"]\s*\]/,
    /__proto__/,
    /\bProxy\b/,
    /\bReflect\b/,
    /\bWebAssembly\b/,
  ];
  for (const re of patterns) {
    if (re.test(code)) return true;
  }
  return false;
}

function fail(report) {
  process.stdout.write(JSON.stringify({ ok: false, report }));
  process.exit(0);
}

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  fail("Не удалось прочитать код.");
}

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  fail("Некорректный payload.");
}

const { code, functionName: fnName, tests } = payload ?? {};
if (typeof code !== "string" || typeof fnName !== "string" || !Array.isArray(tests)) {
  fail("Некорректный payload.");
}
if (code.length > 12_000) fail("Слишком длинный код.");
if (looksDangerousJs(code)) fail("Код отклонён: опасные конструкции.");
if (!/^[A-Za-z_$][\w$]*$/.test(fnName)) fail("Некорректное имя функции задания.");
if (tests.length === 0 || tests.length > 40) fail("У задания нет тестов.");

const safeTests = tests.map((t, i) => ({
  name: typeof t?.name === "string" ? t.name.slice(0, 80) : `test-${i}`,
  args: Array.isArray(t?.args) ? t.args : [],
  expected: t?.expected,
}));

// Run function definition + all tests inside one timed vm context.
const harness = `
${code}
;(() => {
  const __fn = ${fnName};
  if (typeof __fn !== "function") {
    return { error: "missing_fn" };
  }
  const __tests = ${JSON.stringify(safeTests)};
  const lines = [];
  let passed = 0;
  for (const t of __tests) {
    try {
      const result = __fn.apply(null, t.args);
      const ok = JSON.stringify(result) === JSON.stringify(t.expected);
      if (ok) {
        passed += 1;
        lines.push("✓ " + t.name);
      } else {
        lines.push(
          "✗ " + t.name + ": ожидали " + JSON.stringify(t.expected) +
          ", получили " + JSON.stringify(result),
        );
      }
    } catch (e) {
      lines.push("✗ " + t.name + ": ошибка — " + String(e && e.message ? e.message : e));
    }
  }
  return { passed, total: __tests.length, lines };
})();
`;

try {
  const context = vm.createContext(Object.create(null), {
    codeGeneration: { strings: false, wasm: false },
  });
  const script = new vm.Script(harness, { filename: "submission.js" });
  const out = script.runInContext(context, {
    timeout: 800,
    breakOnSigint: true,
  });

  if (!out || out.error === "missing_fn") {
    fail(`Не найдена функция ${fnName}. Объяви function ${fnName}(...) { ... }`);
  }

  const ok = out.passed === out.total;
  process.stdout.write(
    JSON.stringify({
      ok,
      report: `${out.passed}/${out.total} тестов\n${(out.lines || []).join("\n")}`,
    }),
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  fail(`Не удалось выполнить код: ${message}`);
}
