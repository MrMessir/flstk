import fs from "fs";
import path from "path";

const BOILER = [
  "Зачем это в работе",
  "Ключевые понятия",
  "Типичные ошибки",
  "Как закрепить",
];
const GENERIC = [
  "Объясни «",
  "Мини-задача по теме",
  "Проверка через документацию",
];

const folders = {
  javascript: [
    ...Array.from({ length: 20 }, (_, i) => `js-${String(i + 1).padStart(2, "0")}.json`),
    ...["js-21", "js-22", "js-23", "js-24", "js-25", "js-26", "js-27", "js-28"].map(
      (id) => `${id}.json`,
    ),
    "js-project.json",
    "js-project-weather.json",
    "js-project-game.json",
  ],
  typescript: fs
    .readdirSync("content/lessons/typescript")
    .filter((f) => f.endsWith(".json")),
  react: fs.readdirSync("content/lessons/react").filter((f) => f.endsWith(".json")),
};

let failed = false;

for (const [folder, files] of Object.entries(folders)) {
  for (const file of files) {
    const p = path.join("content/lessons", folder, file);
    if (!fs.existsSync(p)) {
      console.error("MISSING", p);
      failed = true;
      continue;
    }
    const lesson = JSON.parse(fs.readFileSync(p, "utf8"));
    const id = lesson.id ?? file.replace(".json", "");

    let paragraphTotal = 0;
    for (const block of lesson.theory ?? []) {
      if (block.type === "heading" && BOILER.includes(block.content)) {
        console.error(`${id}: boiler heading "${block.content}"`);
        failed = true;
      }
      if (block.type === "paragraph") {
        paragraphTotal += (block.content ?? "").length;
      }
    }
    const fullRewrite =
      folder !== "javascript" ||
      /^js-(2[1-8]|project)/.test(id) ||
      id.startsWith("js-project");
    if (fullRewrite && paragraphTotal < 350) {
      console.error(`${id}: theory paragraphs total too short (${paragraphTotal} chars)`);
      failed = true;
    }

    const practice = lesson.practice ?? [];
    if (practice.length !== 3) {
      console.error(`${id}: practice count ${practice.length}`);
      failed = true;
    }
    for (const item of practice) {
      const blob = `${item.title} ${item.description}`;
      if (GENERIC.some((g) => blob.includes(g))) {
        console.error(`${id}: generic practice "${item.title}"`);
        failed = true;
      }
    }

    if ((lesson.checklist ?? []).length < 4) {
      console.error(`${id}: checklist < 4`);
      failed = true;
    }
    if ((lesson.glossary ?? []).length < 3) {
      console.error(`${id}: glossary < 3`);
      failed = true;
    }
    if ((lesson.links ?? []).length < 1) {
      console.error(`${id}: no links`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("All scoped lessons passed GOLD checks.");
