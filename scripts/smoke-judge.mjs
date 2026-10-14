import { readFileSync } from "node:fs";
const { judgeSubmission } = await import("../src/lib/duel/judge.ts");

const challenges = JSON.parse(
  readFileSync("content/duels/challenges.json", "utf8"),
);

const cases = [
  {
    id: "js-sum",
    label: "sum correct",
    code: "function sum(a, b) { return a + b; }",
    expectOk: true,
  },
  {
    id: "js-sum",
    label: "sum wrong",
    code: "function sum(a, b) { return a - b; }",
    expectOk: false,
  },
  {
    id: "js-palindrome",
    label: "palindrome correct",
    code: `function isPalindrome(s) {
  const t = s.toLowerCase().replace(/\\s+/g, "");
  return t === [...t].reverse().join("");
}`,
    expectOk: true,
  },
  {
    id: "bug-max",
    label: "findMax fixed",
    code: `function findMax(nums) {
  let max = nums[0];
  for (const n of nums) if (n > max) max = n;
  return max;
}`,
    expectOk: true,
  },
  {
    id: "bug-max",
    label: "findMax buggy starter",
    code: `function findMax(nums) {
  let max = 0;
  for (const n of nums) if (n > max) max = n;
  return max;
}`,
    expectOk: false,
  },
  {
    id: "html-card",
    label: "html card correct",
    code: `<!DOCTYPE html><html lang="ru"><body>
<article class="card"><h2>Товар</h2><p>100</p><button>Купить</button></article>
</body></html>`,
    expectOk: true,
  },
  {
    id: "html-card",
    label: "html card missing button",
    code: `<article class="card"><h2>Товар</h2><p>100</p></article>`,
    expectOk: false,
  },
  {
    id: "html-form",
    label: "html form correct",
    code: `<form>
  <input type="email" required />
  <textarea></textarea>
  <button type="submit">Ok</button>
</form>`,
    expectOk: true,
  },
  {
    id: "ts-pick",
    label: "pick correct",
    code: `function pick(obj, keys) {
  const o = {};
  for (const k of keys) if (Object.hasOwn(obj, k)) o[k] = obj[k];
  return o;
}`,
    expectOk: true,
  },
  {
    id: "api-status",
    label: "httpStatus correct",
    code: `function httpStatus({ authorized, found, method }) {
  if (!authorized) return 401;
  if (!found) return 404;
  if (method === "GET") return 200;
  if (method === "POST") return 201;
  return 405;
}`,
    expectOk: true,
  },
  {
    id: "api-status",
    label: "httpStatus wrong",
    code: `function httpStatus() { return 200; }`,
    expectOk: false,
  },
  {
    id: "react-filter",
    label: "filterProducts correct",
    code: `function filterProducts(products, query) {
  const q = String(query).toLowerCase();
  return products.filter((p) => p.title.toLowerCase().includes(q));
}`,
    expectOk: true,
  },
  {
    id: "sql-where",
    label: "selectWhere correct",
    code: `function selectWhere(rows, column, value) {
  return rows.filter((r) => r[column] === value);
}`,
    expectOk: true,
  },
  {
    id: "js-debounce-count",
    label: "groupBy correct",
    code: `function groupBy(arr, key) {
  const o = {};
  for (const item of arr) {
    const k = item[key];
    (o[k] ||= []).push(item);
  }
  return o;
}`,
    expectOk: true,
  },
];

let passed = 0;
let failed = 0;

for (const c of cases) {
  const challenge = challenges.find((x) => x.id === c.id);
  if (!challenge) {
    console.log(`MISS  ${c.label}`);
    failed += 1;
    continue;
  }
  const result = await judgeSubmission(challenge, c.code);
  const ok = result.ok === c.expectOk;
  if (ok) {
    passed += 1;
    console.log(`OK    ${c.label}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${c.label}`);
    console.log(`      expected ok=${c.expectOk}, got ok=${result.ok}`);
    console.log(`      ${result.report.split("\n").slice(0, 5).join(" | ")}`);
  }
}

console.log(`\nSummary: ${passed}/${cases.length} checks matched expectation`);
if (failed) process.exit(1);
