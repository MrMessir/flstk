#!/usr/bin/env node
/**
 * Isolated judge process. Parent kills via spawn timeout.
 *
 * User code is defined in a null-prototype vm context. Each test call runs
 * inside runInContext (timeout) and deepEqual runs on the host so a
 * submission cannot rewrite the harness (e.g. JSON.stringify) to fake a pass.
 */
import vm from "node:vm";
import { readFileSync } from "node:fs";

function fail(report) {
  process.stdout.write(JSON.stringify({ ok: false, report }));
  process.exit(0);
}

function looksDangerousJs(code) {
  const patterns = [
    [/\brequire\s*\(/, "require() запрещён"],
    [/\bimport\s*\(/, "динамический import запрещён"],
    [/\bimport\s+/, "import запрещён"],
    [/\bprocess\b/, "process запрещён"],
    [/\bglobalThis\b/, "globalThis запрещён"],
    [/\bglobal\b/, "global запрещён"],
    [/\bFunction\s*\(/, "Function() запрещён"],
    [/\beval\s*\(/, "eval запрещён"],
    [/\bchild_process\b/, "child_process запрещён"],
    [/\bfs\b\s*\./, "fs запрещён"],
    [/\bworker_threads\b/, "worker_threads запрещён"],
    [/constructor\s*\[\s*['"]constructor['"]\s*\]/, "constructor escape запрещён"],
    [/__proto__/, "__proto__ запрещён"],
    [/\bProxy\b/, "Proxy запрещён"],
    [/\bReflect\b/, "Reflect запрещён"],
    [/\bWebAssembly\b/, "WebAssembly запрещён"],
  ];
  for (const [re, msg] of patterns) {
    if (re.test(code)) return msg;
  }
  return null;
}

/** Host-side deep equal — never uses values from the sandbox realm. */
function deepEqual(a, b, seen = new WeakMap()) {
  if (Object.is(a, b)) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;

  if (seen.has(a)) return seen.get(a) === b;
  seen.set(a, b);

  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i], seen)) return false;
    }
    return true;
  }

  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i += 1) {
    if (aKeys[i] !== bKeys[i]) return false;
    if (!deepEqual(a[aKeys[i]], b[bKeys[i]], seen)) return false;
  }
  return true;
}

function safeClone(value, depth = 0) {
  if (depth > 20) return null;
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "object") return null;
  if (Array.isArray(value)) {
    return value.map((item) => safeClone(item, depth + 1));
  }
  const out = {};
  for (const key of Object.keys(value).slice(0, 40)) {
    out[key] = safeClone(value[key], depth + 1);
  }
  return out;
}

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  fail("Нет входных данных.");
}

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  fail("Битый JSON.");
}

const { code, fnName, tests } = payload ?? {};
if (typeof code !== "string" || typeof fnName !== "string" || !Array.isArray(tests)) {
  fail("Некорректный payload.");
}
if (code.length > 12_000) fail("Слишком длинный код.");
if (!/^[A-Za-z_$][\w$]*$/.test(fnName)) fail("Некорректное имя функции задания.");
if (tests.length === 0 || tests.length > 40) fail("Некорректные тесты.");

const dangerous = looksDangerousJs(code);
if (dangerous) fail(`Код отклонён: ${dangerous}.`);

const context = vm.createContext(Object.create(null), {
  codeGeneration: { strings: false, wasm: false },
});

const defineScriptSource = `
${code}
;
if (typeof ${fnName} !== "function") {
  throw new Error("NO_FN");
}
`;

try {
  const defineScript = new vm.Script(defineScriptSource, {
    filename: "submission.js",
  });
  defineScript.runInContext(context, {
    timeout: 800,
    breakOnSigint: true,
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "NO_FN" || /NO_FN/.test(message)) {
    fail(`Не найдена функция ${fnName}. Объяви function ${fnName}(...) { ... }`);
  }
  if (/Script execution timed out/i.test(message) || /timed out/i.test(message)) {
    fail("Превышено время выполнения.");
  }
  fail(`Не удалось выполнить код: ${message}`);
}

const lines = [];
let passed = 0;

for (const test of tests) {
  const name = `тест ${tests.indexOf(test) + 1}`;
  const args = Array.isArray(test?.args) ? test.args : [];
  const expected = test?.expected;

  let argsJson;
  try {
    argsJson = JSON.stringify(args);
  } catch {
    lines.push(`✗ ${name}`);
    continue;
  }

  const callSource = `(function () { return ${fnName}.apply(null, ${argsJson}); })()`;

  try {
    const callScript = new vm.Script(callSource, { filename: "call.js" });
    const gotRaw = callScript.runInContext(context, {
      timeout: 800,
      breakOnSigint: true,
    });
    const got = safeClone(gotRaw);
    if (deepEqual(got, expected)) {
      passed += 1;
      lines.push(`✓ ${name}`);
    } else {
      // Do not leak expected/got values (test-oracle).
      lines.push(`✗ ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Script execution timed out/i.test(message) || /timed out/i.test(message)) {
      fail("Превышено время выполнения.");
    }
    lines.push(`✗ ${name}`);
  }
}

process.stdout.write(
  JSON.stringify({
    ok: passed === tests.length,
    report: `${passed}/${tests.length} тестов\n${lines.join("\n")}`,
  }),
);
