#!/usr/bin/env python3
"""Deepen thin generated lessons to closer-to-handwritten quality."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "content" / "lessons"

GENERIC_PRACTICE_TITLES = {
    "Повтори теорию своими словами",
    "Сделай мини-упражнение",
    "Найди ответ в документации",
}

DOC_LINKS = {
    "tools": ("MDN: как работает веб", "https://developer.mozilla.org/ru/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works"),
    "html": ("MDN HTML", "https://developer.mozilla.org/ru/docs/Web/HTML"),
    "css": ("MDN CSS", "https://developer.mozilla.org/ru/docs/Web/CSS"),
    "javascript": ("MDN JavaScript", "https://developer.mozilla.org/ru/docs/Web/JavaScript"),
    "typescript": ("TypeScript Handbook", "https://www.typescriptlang.org/docs/handbook/intro.html"),
    "react": ("React docs", "https://react.dev/learn"),
    "nodejs": ("Node.js docs", "https://nodejs.org/docs/latest/api/"),
    "database": ("PostgreSQL docs", "https://www.postgresql.org/docs/current/"),
    "security": ("OWASP Top 10", "https://owasp.org/www-project-top-ten/"),
    "fullstack": ("MDN Fetch", "https://developer.mozilla.org/ru/docs/Web/API/Fetch_API"),
    "testing": ("Testing Library", "https://testing-library.com/docs/react-testing-library/intro/"),
    "devops": ("Docker docs", "https://docs.docker.com/get-started/"),
    "capstone": ("GitHub Projects", "https://docs.github.com/en/issues/planning-and-tracking-with-projects"),
    "career": ("MDN Learn", "https://developer.mozilla.org/ru/docs/Learn_web_development"),
}

CODE_SNIPPETS = {
    "typescript": "type User = { id: number; name: string };\n\nfunction greet(user: User): string {\n  return `Привет, ${user.name}`;\n}\n\nconsole.log(greet({ id: 1, name: \"Ada\" }));",
    "react": "import { useState } from \"react\";\n\nexport function Counter() {\n  const [n, setN] = useState(0);\n  return (\n    <button type=\"button\" onClick={() => setN((x) => x + 1)}>\n      Клики: {n}\n    </button>\n  );\n}",
    "nodejs": "import express from \"express\";\n\nconst app = express();\napp.use(express.json());\n\napp.get(\"/health\", (_req, res) => {\n  res.json({ ok: true });\n});\n\napp.listen(3000, () => console.log(\"API on :3000\"));",
    "database": "-- users 1—N posts\nCREATE TABLE users (\n  id uuid PRIMARY KEY,\n  email text UNIQUE NOT NULL\n);\n\nCREATE TABLE posts (\n  id uuid PRIMARY KEY,\n  author_id uuid REFERENCES users(id),\n  title text NOT NULL\n);",
    "security": "import bcrypt from \"bcrypt\";\n\nconst hash = await bcrypt.hash(password, 12);\nconst ok = await bcrypt.compare(password, hash);\nconsole.log({ ok });",
    "fullstack": "async function api<T>(path: string, init?: RequestInit): Promise<T> {\n  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {\n    ...init,\n    headers: { \"Content-Type\": \"application/json\", ...(init?.headers || {}) },\n  });\n  if (!res.ok) throw new Error(await res.text());\n  return res.json() as Promise<T>;\n}",
    "testing": "import { describe, it, expect } from \"vitest\";\n\ndescribe(\"sum\", () => {\n  it(\"adds numbers\", () => {\n    expect(1 + 2).toBe(3);\n  });\n});",
    "devops": "FROM node:22-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:22-alpine\nWORKDIR /app\nCOPY --from=build /app/dist ./dist\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCMD [\"node\", \"dist/index.js\"]",
}

MISTAKES = {
    "tools": "пропускать сообщения git/терминала и копировать команды «вслепую»",
    "html": "забывать семантику и alt, класть всё в div",
    "css": "воевать специфичностью вместо простой структуры классов",
    "javascript": "игнорировать ошибки в Console и мутировать данные бездумно",
    "typescript": "ставить any или as, чтобы «заткнуть» компилятор",
    "react": "класть серверные данные в лишний global state и забывать ключи списков",
    "nodejs": "валить всю логику в один route-файл без валидации",
    "database": "делать SELECT * и N+1, забывать миграции",
    "security": "проверять права только на клиенте и хранить секреты в репозитории",
    "fullstack": "не обрабатывать loading/error и дублировать валидацию криво",
    "testing": "тестировать детали реализации вместо поведения пользователя",
    "devops": "класть .env в образ и деплоить без healthcheck",
    "capstone": "раздувать MVP и откладывать деплой «на потом»",
    "career": "писать резюме клише без ссылок на проекты",
}


def theory_chars(data: dict) -> int:
    return sum(
        len(block.get("content", ""))
        for block in data.get("theory", [])
        if block.get("type") == "paragraph"
    )


def is_generic_practice(data: dict) -> bool:
    titles = {p.get("title") for p in data.get("practice", [])}
    return len(titles & GENERIC_PRACTICE_TITLES) >= 2


def should_skip(data: dict) -> bool:
    """Keep early handwritten html/css/js lessons intact."""
    lid = data["id"]
    part = data["part"]
    thin = theory_chars(data) < 480
    generic = is_generic_practice(data)

    if part == "html" and lid.startswith("html-") and lid[5:7].isdigit():
        n = int(lid[5:7])
        if 1 <= n <= 10 and not thin and not generic:
            return True
    if part == "css" and lid.startswith("css-") and lid[4:6].isdigit():
        n = int(lid[4:6])
        if 1 <= n <= 14 and not thin and not generic:
            return True
    if part == "javascript" and lid.startswith("js-") and lid[3:5].isdigit():
        n = int(lid[3:5])
        if 1 <= n <= 20 and not thin and not generic:
            return True
    return False


def build_expanded(data: dict) -> dict:
    title = data["title"]
    goal = data["goal"]
    terms = data.get("glossary", [])
    part = data["part"]
    module = data.get("module", "")
    lid = data.get("id", "")

    blocks = list(data.get("theory", []))
    goal_tail = goal
    if goal_tail and goal_tail[0].isupper():
        goal_tail = goal_tail[0].lower() + goal_tail[1:]

    blocks.append({"type": "heading", "content": "Зачем это в работе"})
    blocks.append({
        "type": "paragraph",
        "content": (
            f"Этот урок помогает {goal_tail} "
            "На собеседовании и в задачах junior чаще спрашивают понимание «почему так», "
            "а не только название технологии. После чтения запиши одну мысль своими словами."
        ),
    })

    if terms:
        blocks.append({"type": "heading", "content": "Ключевые понятия"})
        blocks.append({
            "type": "list",
            "items": [f"{t['term']} — {t['meaning']}" for t in terms[:5]],
        })
        blocks.append({
            "type": "paragraph",
            "content": (
                "Проговори каждый термин вслух и придумай свой крошечный пример. "
                "Если термин не связывается с практикой — вернись к коду или команде из урока."
            ),
        })

    blocks.append({"type": "heading", "content": "Типичные ошибки"})
    blocks.append({
        "type": "paragraph",
        "content": (
            f"Частая ловушка здесь: {MISTAKES.get(part, 'пропустить практику и сразу следующий урок')}. "
            "Лучше маленький рабочий результат, чем идеальный план без кода."
        ),
    })

    blocks.append({"type": "heading", "content": "Как закрепить"})
    blocks.append({
        "type": "paragraph",
        "content": (
            "Сделай практику ниже без подсказок. Потом открой документацию по ссылке и найди "
            "один факт, которого не было в уроке. Так тренируется навык учиться самостоятельно."
        ),
    })

    term0 = terms[0]["term"] if terms else title
    term1 = terms[1]["term"] if len(terms) > 1 else "основной приём"
    is_project = module == "project" or lid.endswith("project") or "-project-" in lid

    if is_project:
        practices = [
            {
                "title": "Собери MVP по чек-листу",
                "description": (
                    f"Реализуй проект «{title}» в отдельном репозитории. "
                    "Ориентир — критерии готовности ниже, а не идеальный дизайн."
                ),
            },
            {
                "title": "Оформи README",
                "description": (
                    "В README: цель, стек, как запустить, скриншот или GIF, "
                    "что сделано и что осознанно отложено."
                ),
            },
            {
                "title": "Подготовь сдачу",
                "description": (
                    "Проверь чек-лист, положи ссылку на репозиторий или демо "
                    "и коротко опиши решения в форме сдачи урока."
                ),
            },
        ]
    else:
        practices = [
            {
                "title": f"Объясни «{term0}» без шпаргалки",
                "description": (
                    f"Закрой урок. Объясни, что такое {term0}, зачем оно нужно "
                    "и где встретится в проекте модуля. Если запнулся — перечитай только этот кусок."
                ),
            },
            {
                "title": f"Мини-задача по теме «{title}»",
                "description": (
                    f"Сделай маленький артефакт: файл, сниппет, запрос, схему или скрин — "
                    f"который доказывает, что ты применил {term1}. Сохрани в папку модуля курса."
                ),
            },
            {
                "title": "Проверка через документацию",
                "description": (
                    "Открой ссылку урока, найди раздел по теме и выпиши одно правило или "
                    "предупреждение, которого не было в тексте."
                ),
            },
        ]

    checklist = list(data.get("checklist") or [])
    if len(checklist) < 4:
        checklist = [
            f"Могу объяснить цель урока: {goal}",
            f"Понимаю термины: {', '.join(t['term'] for t in terms[:3])}",
            "Есть свой мини-артефакт по теме (файл/скрин/репо)",
            "Знаю, куда смотреть в документации, если застрял",
        ]

    links = list(data.get("links") or [])
    doc = DOC_LINKS.get(part)
    if doc and not any(doc[1] == (link.get("url") or "") for link in links):
        links = [{"title": doc[0], "url": doc[1]}, *links]

    code = data.get("codeExample") or ""
    if (
        not code
        and not is_project
        and part in CODE_SNIPPETS
    ):
        code = CODE_SNIPPETS[part]

    glossary = []
    for g in terms:
        glossary.append({
            "term": g["term"],
            "meaning": g["meaning"],
            "example": g.get("example") or g["term"],
        })
    while len(glossary) < 3:
        glossary.append({
            "term": f"идея-{len(glossary) + 1}",
            "meaning": goal,
            "example": title,
        })

    out = dict(data)
    out["theory"] = blocks
    out["practice"] = practices
    out["checklist"] = checklist
    out["links"] = links[:4]
    out["codeExample"] = code
    out["glossary"] = glossary
    return out


def main() -> None:
    updated = 0
    skipped = 0
    for path in sorted(ROOT.rglob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if should_skip(data):
            skipped += 1
            continue
        enriched = build_expanded(data)
        path.write_text(
            json.dumps(enriched, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        updated += 1
    print(f"done: updated={updated} skipped={skipped}")


if __name__ == "__main__":
    main()
