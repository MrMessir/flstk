import { spawn } from "node:child_process";
import path from "node:path";
import type { Challenge, JudgeResult } from "@/lib/duel/types";

function safeRegExp(pattern: string): RegExp | null {
  if (pattern.length > 120) return null;
  // Reject consecutive quantifiers and nested quantifier smells (ReDoS-ish).
  // Do not use a backreference into an unmatched alternate group — in JS that
  // becomes an empty match and false-rejects every pattern with a single `*`.
  if (/\+\+|\*\*/.test(pattern)) return null;
  if (/\([^)]*[+*][^)]*\)[+*]/.test(pattern)) return null;
  try {
    return new RegExp(pattern, "i");
  } catch {
    return null;
  }
}

const MAX_PARALLEL = 3;
const MAX_WAITING = 20;
const WORKER_TIMEOUT_MS = 2000;
const MAX_OUTPUT_BYTES = 512 * 1024;
const WORKER_FAIL: JudgeResult = {
  ok: false,
  report: "Превышено время или сбой песочницы.",
};

let running = 0;
const waiting: Array<() => void> = [];

/** Не больше MAX_PARALLEL проверок одновременно, остальные ждут в очереди. */
async function acquireSlot(): Promise<boolean> {
  if (running < MAX_PARALLEL) {
    running += 1;
    return true;
  }
  if (waiting.length >= MAX_WAITING) return false;
  await new Promise<void>((resolve) => waiting.push(resolve));
  return true;
}

function releaseSlot() {
  const next = waiting.shift();
  if (next) {
    next();
  } else {
    running -= 1;
  }
}

/** Отдельный процесс: не блокирует сервер, убивается по таймауту. */
function runWorker(input: string): Promise<JudgeResult> {
  const worker = path.join(process.cwd(), "scripts/judge-worker.mjs");
  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let output = "";
    let size = 0;

    const child = spawn(
      process.execPath,
      ["--max-old-space-size=96", worker],
      {
        // Минимум окружения: ни секретов, ни PATH.
        env: { NODE_ENV: "production" },
        stdio: ["pipe", "pipe", "ignore"],
      },
    );

    const finish = (result: JudgeResult) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      child.kill("SIGKILL");
      resolve(result);
    };

    timer = setTimeout(() => finish(WORKER_FAIL), WORKER_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_OUTPUT_BYTES) {
        finish(WORKER_FAIL);
        return;
      }
      output += chunk.toString("utf8");
    });
    child.on("error", () => finish(WORKER_FAIL));
    child.on("close", (code) => {
      if (settled) return;
      if (code !== 0) {
        finish(WORKER_FAIL);
        return;
      }
      const stdout = output.trim();
      if (!stdout) {
        finish({ ok: false, report: "Пустой ответ песочницы." });
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as JudgeResult;
        if (typeof parsed.ok !== "boolean" || typeof parsed.report !== "string") {
          finish({ ok: false, report: "Битый ответ песочницы." });
          return;
        }
        finish(parsed);
      } catch {
        finish({ ok: false, report: "Битый ответ песочницы." });
      }
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

async function runJsChallenge(
  challenge: Challenge,
  code: string,
): Promise<JudgeResult> {
  const fnName = challenge.functionName;
  const tests = challenge.tests ?? [];
  if (!fnName || tests.length === 0) {
    return { ok: false, report: "У задания нет тестов." };
  }
  if (code.length > 12_000) {
    return { ok: false, report: "Слишком длинный код." };
  }
  if (!/^[A-Za-z_$][\w$]*$/.test(fnName)) {
    return { ok: false, report: "Некорректное имя функции задания." };
  }

  if (!(await acquireSlot())) {
    return {
      ok: false,
      report: "Проверка перегружена. Попробуй через несколько секунд.",
    };
  }
  try {
    return await runWorker(JSON.stringify({ code, fnName, tests }));
  } finally {
    releaseSlot();
  }
}

function runHtmlChallenge(challenge: Challenge, code: string): JudgeResult {
  const checks = challenge.checks ?? [];
  if (checks.length === 0) {
    return { ok: false, report: "У задания нет проверок." };
  }
  if (code.length > 40_000) {
    return { ok: false, report: "Слишком длинная вёрстка." };
  }

  const lines: string[] = [];
  let passed = 0;

  for (const check of checks) {
    const re = safeRegExp(check.pattern);
    if (!re) {
      lines.push(`✗ ${check.description} (небезопасный/битый паттерн)`);
      continue;
    }
    if (re.test(code)) {
      passed += 1;
      lines.push(`✓ ${check.description}`);
    } else {
      lines.push(`✗ ${check.description}`);
    }
  }

  return {
    ok: passed === checks.length,
    report: `${passed}/${checks.length} проверок\n${lines.join("\n")}`,
  };
}

export async function judgeSubmission(
  challenge: Challenge,
  code: string,
): Promise<JudgeResult> {
  if (challenge.type === "html-checklist") {
    return runHtmlChallenge(challenge, code);
  }
  return runJsChallenge(challenge, code);
}
