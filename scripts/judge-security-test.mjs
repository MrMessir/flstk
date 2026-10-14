#!/usr/bin/env node
import assert from "node:assert/strict";

const challenge = {
  id: "t",
  type: "js-function",
  title: "t",
  prompt: "t",
  difficulty: "easy",
  timeLimitSec: 60,
  starter: "",
  functionName: "add",
  tests: [{ name: "1+1", args: [1, 1], expected: 2 }],
};

async function main() {
  let judgeSubmission;
  try {
    ({ judgeSubmission } = await import("../src/lib/duel/judge.ts"));
  } catch (e) {
    console.error("Need Node with TS or run: npx tsx scripts/judge-security-test.mjs");
    console.error(e.message);
    process.exit(1);
  }

  const ok = await judgeSubmission(challenge, "function add(a,b){return a+b}");
  assert.equal(ok.ok, true, ok.report);

  const blocked = await judgeSubmission(
    challenge,
    "function add(a,b){return require('fs').readFileSync('/etc/passwd','utf8')}",
  );
  assert.equal(blocked.ok, false);
  assert.match(blocked.report, /require|запрещ/i);

  const evalBlocked = await judgeSubmission(
    challenge,
    "function add(a,b){return eval('1+1')}",
  );
  assert.equal(evalBlocked.ok, false);

  const hang = await judgeSubmission(
    challenge,
    "function add(a,b){while(true){}}",
  );
  assert.equal(hang.ok, false);
  assert.match(hang.report, /время|песочниц|сбой/i);

  const cheat = await judgeSubmission(
    challenge,
    "function add(a,b){ return 0 }\nJSON.stringify = function(){ return 'x' }",
  );
  assert.equal(cheat.ok, false, "JSON.stringify override must not fake a pass");
  assert.doesNotMatch(cheat.report, /ожидали|получили|expected/i);

  const oracle = await judgeSubmission(
    challenge,
    "function add(a,b){ return 999 }",
  );
  assert.equal(oracle.ok, false);
  assert.doesNotMatch(
    oracle.report,
    /ожидали|получили|: 2|: 999/,
    "report must not leak expected/got values",
  );


  // Названия тестов не должны попадать в отчёт.
  const named = await judgeSubmission(
    { ...challenge, tests: [{ name: "секретный-сценарий", args: [1, 1], expected: 3 }] },
    "function add(a,b){return a+b}",
  );
  assert.doesNotMatch(named.report, /секретный-сценарий/);

  // Память: взрыв памяти не должен валить сервер и не должен проходить.
  const memory = await judgeSubmission(
    challenge,
    "function add(a,b){ const a1=[]; for(;;) a1.push(new Array(1e6).fill(1)); }",
  );
  assert.equal(memory.ok, false);

  // Сервер не блокируется: пока идёт «вечный» цикл, таймеры продолжают тикать.
  let maxLag = 0;
  let last = Date.now();
  const ticker = setInterval(() => {
    const now = Date.now();
    maxLag = Math.max(maxLag, now - last - 50);
    last = now;
  }, 50);
  const started = Date.now();
  await Promise.all(
    [1, 2, 3, 4, 5, 6].map(() =>
      judgeSubmission(challenge, "function add(a,b){while(true){}}"),
    ),
  );
  clearInterval(ticker);
  assert.ok(maxLag < 300, `event loop blocked for ${maxLag}ms`);
  assert.ok(Date.now() - started < 8000, "queue took too long");

  console.log("ok judge security");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
