#!/usr/bin/env python3
"""Apply curriculum review fixes: typos, theory, quizzes, new lessons, starters, duels."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS = ROOT / "content" / "lessons"
STARTERS = ROOT / "content" / "starters"
PUBLIC_STARTERS = ROOT / "public" / "starters"
DUELS = ROOT / "content" / "duels" / "challenges.json"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save(path: Path, data: dict | list) -> None:
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


# --- 1. Typos / RU ---

REPLACEMENTS = [
    ("как долго данные считаются свежими", "как долго данные считаются свежими"),
    ("артефакт", "артефакт"),
    ("ради галочки", "ради галочки"),
    ("с менторством", "с менторством"),
    ("Младший dev с менторством.", "Младший разработчик с менторством."),
    ("Бэкенд итогового проекта", "Бэкенд итогового проекта"),
    (
        "npx create-next-app@latest next-demo --typescript --eslint --app --src-dir --import-alias \"@/*\" --turbopack --yes",
        "npx create-next-app@latest next-demo --typescript --eslint --app --src-dir --turbopack --yes",
    ),
]


def fix_typos() -> int:
    n = 0
    for path in LESSONS.rglob("*.json"):
        text = path.read_text(encoding="utf-8")
        original = text
        for old, new in REPLACEMENTS:
            text = text.replace(old, new)
        if text != original:
            path.write_text(text, encoding="utf-8")
            n += 1
    # source scripts too
    for path in (ROOT / "scripts").glob("*.py"):
        text = path.read_text(encoding="utf-8")
        original = text
        for old, new in REPLACEMENTS:
            text = text.replace(old, new)
        if text != original:
            path.write_text(text, encoding="utf-8")
            n += 1
    return n


# --- 2. Enrich thin theory ---

ENRICHMENTS: dict[str, list[dict]] = {
    "testing": [
        {
            "type": "heading",
            "content": "Зачем это на практике",
        },
        {
            "type": "paragraph",
            "content": "Тест фиксирует контракт: что должно произойти при нормальном и ошибочном входе. Пиши сначала один падающий тест на баг или фичу, затем код. Имена тестов — предложение: «returns 401 when token missing». Не гонись за процентом покрытия: важны auth, деньги, запись в БД и критичные ветки UI.",
        },
        {
            "type": "list",
            "items": [
                "Arrange — данные и моки.",
                "Act — один вызов функции/клик.",
                "Assert — одно ясное ожидание.",
                "Cleanup — сброс БД/моков между тестами.",
            ],
        },
    ],
    "devops": [
        {
            "type": "heading",
            "content": "Как проверить, что сделал правильно",
        },
        {
            "type": "paragraph",
            "content": "Инфраструктура считается готовой, когда чужой разработчик поднимает стек по README без устных пояснений. Секреты только в env/Secrets, образы воспроизводимы (lockfile + pinned base image), откат описан. После каждого шага смотри логи контейнера и ответ health-check — «зелёный CI» без работающего /health ещё не деплой.",
        },
        {
            "type": "list",
            "items": [
                "Локально: docker compose up и curl health.",
                "В CI: lint → test → build на каждом PR.",
                "На проде: HTTPS, бэкап БД, план отката миграции.",
            ],
        },
    ],
    "fullstack": [
        {
            "type": "heading",
            "content": "Склейка фронта и бэка",
        },
        {
            "type": "paragraph",
            "content": "Full-stack урок про контракт: одни и те же типы/zod-схемы на клиенте и сервере, единые коды ошибок, состояния loading/empty/error. Перед оптимистичным UI убедись, что API идемпотентен или у тебя есть откат. Документируй в README переменные NEXT_PUBLIC_* и серверные секреты отдельно.",
        },
        {
            "type": "list",
            "items": [
                "Клиент не знает SQL — только HTTP/WS контракт.",
                "Ошибки API → понятный текст пользователю + лог на сервере.",
                "После мутации инвалидируй кэш Query, не дублируй state вручную.",
            ],
        },
    ],
    "capstone": [
        {
            "type": "heading",
            "content": "Критерии качества итога",
        },
        {
            "type": "paragraph",
            "content": "Capstone — продукт, а не набор уроков. Зафиксируй MVP в одном абзаце, отрежь всё лишнее. К сдаче нужны: auth, основной CRUD, тесты на критичный путь, деплой по HTTPS, README с демо и case study. Защита — рассказ «проблема → решение → компромиссы», а не пересказ документации.",
        },
        {
            "type": "list",
            "items": [
                "Must-требования закрыты ссылками на код/демо.",
                "Секреты не в репозитории.",
                "Есть хотя бы один метрический артефакт (Lighthouse, coverage, uptime).",
            ],
        },
    ],
    "career": [
        {
            "type": "heading",
            "content": "Как это выглядит для работодателя",
        },
        {
            "type": "paragraph",
            "content": "Рекрутер смотрит 30–60 секунд: ясный README, живое демо, осмысленные коммиты, стек из вакансии. В резюме — глаголы результата («ускорил загрузку», «закрыл XSS»), не список курсов. На собеседовании готовься объяснить любой файл из своего репозитория: зачем зависимость, где граница слоёв, как откатишь миграцию.",
        },
    ],
}


def enrich_theory() -> int:
    # ОТКЛЮЧЕНО: раньше добавляла один и тот же текст в каждый «тонкий» урок
    # (шаблонный текст в 61 уроке). Теперь каждому уроку нужна своя теория.
    # Очистка старых вставок: python3 scripts/dedupe_boilerplate.py
    return 0
    n = 0
    for part, blocks in ENRICHMENTS.items():
        for path in (LESSONS / part).glob("*.json"):
            data = load(path)
            theory = data.get("theory") or []
            chars = sum(
                len(str(b.get("content", "")))
                + sum(len(i) for i in (b.get("items") or []))
                for b in theory
            )
            marker = blocks[0].get("content")
            already = any(b.get("content") == marker for b in theory)
            if chars < 900 and not already:
                data["theory"] = theory + blocks
                save(path, data)
                n += 1
    return n


# --- 3. Authored quizzes for key lessons ---

AUTH_QUIZZES: dict[str, list[dict]] = {
    "html-01": [
        {
            "id": "html-01-q1",
            "prompt": "Что отвечает за структуру содержимого страницы?",
            "options": ["HTML", "CSS", "JavaScript", "HTTP-заголовок Host"],
            "correctIndex": 0,
            "explanation": "HTML описывает, что есть на странице; CSS — как выглядит; JS — поведение.",
        },
        {
            "id": "html-01-q2",
            "prompt": "Где лежит видимый пользователю контент?",
            "options": ["Внутри <body>", "Только в <head>", "В файле .css", "В cookie"],
            "correctIndex": 0,
        },
        {
            "id": "html-01-q3",
            "prompt": "Что делает браузер с тегами в угловых скобках?",
            "options": [
                "Читает как пометки и рисует страницу",
                "Всегда показывает скобки на экране",
                "Игнорирует любой HTML",
                "Компилирует в машинный код CPU",
            ],
            "correctIndex": 0,
        },
    ],
    "js-15": [
        {
            "id": "js-15-q1",
            "prompt": "Зачем на submit вызывают preventDefault?",
            "options": [
                "Чтобы страница не перезагружалась при отправке формы",
                "Чтобы очистить localStorage",
                "Чтобы отключить CSS",
                "Чтобы создать новый DOM-узел",
            ],
            "correctIndex": 0,
        },
        {
            "id": "js-15-q2",
            "prompt": "Как обычно читают значение текстового поля формы?",
            "options": [
                "input.value или form.elements.name.value",
                "input.checked для любого поля",
                "document.cookie только",
                "window.location.hash",
            ],
            "correctIndex": 0,
        },
        {
            "id": "js-15-q3",
            "prompt": "Что поставить при ошибке валидации для a11y?",
            "options": [
                "aria-invalid=\"true\" на поле",
                "display:none на всей форме",
                "Удалить label",
                "type=\"hidden\"",
            ],
            "correctIndex": 0,
        },
    ],
    "react-10": [
        {
            "id": "react-10-q1",
            "prompt": "Зачем нужен queryKey в useQuery?",
            "options": [
                "Идентифицировать запись в кэше и связать refetch",
                "Задать CSS-класс списка",
                "Отключить React Strict Mode",
                "Заменить ключ в localStorage браузера",
            ],
            "correctIndex": 0,
        },
        {
            "id": "react-10-q2",
            "prompt": "Что делает invalidateQueries после mutation?",
            "options": [
                "Помечает кэш устаревшим и запускает refetch",
                "Удаляет компонент из дерева React",
                "Очищает всю историю браузера",
                "Отключает QueryClientProvider",
            ],
            "correctIndex": 0,
        },
        {
            "id": "react-10-q3",
            "prompt": "Когда React Query обычно окупается?",
            "options": [
                "Списки, пагинация, дедупликация и синхронизация серверных данных",
                "Только для анимаций CSS",
                "Вместо HTML-семантики",
                "Только в Internet Explorer",
            ],
            "correctIndex": 0,
        },
    ],
    "nodejs-11": [
        {
            "id": "nodejs-11-q1",
            "prompt": "Кто должен содержать SQL/обращения к БД?",
            "options": [
                "repository",
                "route handler напрямую всегда",
                "CSS-модуль",
                "browser localStorage",
            ],
            "correctIndex": 0,
        },
        {
            "id": "nodejs-11-q2",
            "prompt": "Где жить бизнес-правилу «автор редактирует только свой пост»?",
            "options": ["service", "Dockerfile", "favicon.ico", "nginx gzip"],
            "correctIndex": 0,
        },
        {
            "id": "nodejs-11-q3",
            "prompt": "Route может импортировать repository напрямую?",
            "options": [
                "Нет, лучше только service — иначе слои смешиваются",
                "Да, это единственный правильный способ",
                "Только в React",
                "Только через WebSocket",
            ],
            "correctIndex": 0,
        },
    ],
    "security-05": [
        {
            "id": "security-05-q1",
            "prompt": "Зачем разделяют access и refresh JWT?",
            "options": [
                "Короткий access снижает ущерб при утечке; refresh обновляет сессию",
                "Refresh нужен только для CSS",
                "Access хранит пароль в открытом виде",
                "Оба токена обязаны жить вечно",
            ],
            "correctIndex": 0,
        },
        {
            "id": "security-05-q2",
            "prompt": "Куда нельзя класть JWT access token?",
            "options": [
                "В URL query-параметр (утечёт в логи и Referer)",
                "В память клиента на время сессии",
                "В Authorization: Bearer заголовок",
                "В httpOnly cookie при продуманном CSRF",
            ],
            "correctIndex": 0,
        },
        {
            "id": "security-05-q3",
            "prompt": "Что делать со старым refresh при ротации?",
            "options": [
                "Инвалидировать (отозвать) после выдачи нового",
                "Оставить навсегда для удобства",
                "Записать в git",
                "Отправить в Discord webhook",
            ],
            "correctIndex": 0,
        },
    ],
    "devops-06": [
        {
            "id": "devops-06-q1",
            "prompt": "Какую команду ставят в CI вместо npm install?",
            "options": [
                "npm ci — воспроизводимая установка по lockfile",
                "npm install -g без lock",
                "rm -rf /",
                "npx create-react-app",
            ],
            "correctIndex": 0,
        },
        {
            "id": "devops-06-q2",
            "prompt": "Где хранить DATABASE_URL для CI?",
            "options": [
                "В GitHub Secrets / переменных окружения",
                "Прямо в yaml репозитория plaintext",
                "В README.md",
                "В клиентском bundle React",
            ],
            "correctIndex": 0,
        },
        {
            "id": "devops-06-q3",
            "prompt": "Зачем workflow на pull_request?",
            "options": [
                "Ловить поломки до merge в main",
                "Ускорить CSS анимации",
                "Заменить code review людьми",
                "Отключить HTTPS",
            ],
            "correctIndex": 0,
        },
    ],
    "database-09": [
        {
            "id": "database-09-q1",
            "prompt": "Зачем смотреть EXPLAIN (ANALYZE)?",
            "options": [
                "Понять план запроса и узкие места (seq scan, cost)",
                "Удалить все индексы автоматически",
                "Сгенерировать React-компоненты",
                "Заменить миграции",
            ],
            "correctIndex": 0,
        },
        {
            "id": "database-09-q2",
            "prompt": "Индекс всегда ускоряет запись?",
            "options": [
                "Нет: индексы ускоряют чтение, но замедляют INSERT/UPDATE",
                "Да, всегда и везде",
                "Индексы нужны только MongoDB",
                "Индекс удаляет необходимость PRIMARY KEY",
            ],
            "correctIndex": 0,
        },
    ],
    "typescript-09": [
        {
            "id": "typescript-09-q1",
            "prompt": "Зачем zod на границе API?",
            "options": [
                "Проверить runtime-данные; TypeScript типы исчезают в JS",
                "Заменить HTTP статусы",
                "Скомпилировать CSS",
                "Отключить strict mode",
            ],
            "correctIndex": 0,
        },
        {
            "id": "typescript-09-q2",
            "prompt": "Что даёт z.infer<typeof schema>?",
            "options": [
                "Тип TypeScript из zod-схемы",
                "SQL-миграцию",
                "Docker image",
                "JWT secret",
            ],
            "correctIndex": 0,
        },
    ],
    "testing-02": [
        {
            "id": "testing-02-q1",
            "prompt": "Что проверяет unit-тест сервиса?",
            "options": [
                "Одну функцию/правило без поднятия всего HTTP-стека",
                "Только визуальный скриншот Safari",
                "Скорость CDN",
                "Цвет кнопки в Figma",
            ],
            "correctIndex": 0,
        },
        {
            "id": "testing-02-q2",
            "prompt": "Почему flaky e2e вредны?",
            "options": [
                "Ломают доверие к CI: красный прогон без реального бага",
                "Ускоряют деплой",
                "Заменяют unit-тесты полностью",
                "Нужны только для HTML",
            ],
            "correctIndex": 0,
        },
    ],
    "fullstack-04": [
        {
            "id": "fullstack-04-q1",
            "prompt": "Какие три состояния UI обязательны для списка с API?",
            "options": [
                "loading, empty, error (плюс success с данными)",
                "только success",
                "только CSS hover",
                "только SSR без клиента",
            ],
            "correctIndex": 0,
        },
        {
            "id": "fullstack-04-q2",
            "prompt": "Что показать, если API вернул []?",
            "options": [
                "Пустое состояние с пояснением, не вечный spinner",
                "Ошибку 500 всегда",
                "Белый экран без текста",
                "redirect на google.com",
            ],
            "correctIndex": 0,
        },
    ],
}


def inject_quizzes() -> int:
    n = 0
    for lesson_id, quiz in AUTH_QUIZZES.items():
        matches = list(LESSONS.rglob(f"{lesson_id}.json"))
        if not matches:
            continue
        path = matches[0]
        data = load(path)
        data["quiz"] = quiz
        save(path, data)
        n += 1
    return n


# --- 4. New lessons: Next track + Redis ---

REACT_18 = {
    "id": "react-18",
    "part": "react",
    "module": "react-next",
    "order": 18,
    "title": "Next.js: layouts, loading и вложенные маршруты",
    "goal": "Соберёшь App Router с layout, вложенным сегментом и loading.tsx.",
    "theory": [
        {
            "type": "paragraph",
            "content": "В App Router каждый сегмент папки может иметь layout.tsx — общий UI (шапка, сайдбар), который не размонтируется при навигации между дочерними page.tsx. loading.tsx показывает fallback на время серверного рендера сегмента. error.tsx ловит ошибки ниже по дереву. Параллельные маршруты и route groups (папки в скобках) не меняют URL, но помогают организовать layouts.",
        },
        {
            "type": "heading",
            "content": "Вложенность",
        },
        {
            "type": "paragraph",
            "content": "app/dashboard/layout.tsx оборачивает app/dashboard/page.tsx и app/dashboard/settings/page.tsx. Ссылки — через next/link, активное состояние можно читать из usePathname в клиентском компоненте. Не клади всё приложение в один «use client»: держи серверные page тонкими, интерактив выноси в листовые компоненты.",
        },
        {
            "type": "list",
            "items": [
                "layout.tsx — оболочка сегмента.",
                "page.tsx — UI маршрута.",
                "loading.tsx — мгновенный skeleton.",
                "Link prefetch — по умолчанию для видимых ссылок.",
            ],
        },
    ],
    "codeExample": "// app/dashboard/layout.tsx\nexport default function DashboardLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <div className=\"dashboard\">\n      <aside>Меню</aside>\n      <main>{children}</main>\n    </div>\n  );\n}\n\n// app/dashboard/loading.tsx\nexport default function Loading() {\n  return <p>Загрузка дашборда…</p>;\n}",
    "practice": [
        {
            "title": "Сегмент dashboard",
            "description": "Создай app/dashboard/layout.tsx с aside и app/dashboard/page.tsx. Перейди с главной через Link — layout остаётся.",
        },
        {
            "title": "loading.tsx",
            "description": "Добавь loading.tsx и искусственную задержку await new Promise(r => setTimeout(r, 800)) в page — увидишь fallback.",
        },
        {
            "title": "Вложенный settings",
            "description": "app/dashboard/settings/page.tsx. Проверь, что меню из layout видно на обоих URL.",
        },
    ],
    "checklist": [
        "Понимаю разницу layout и page",
        "Добавил loading.tsx для сегмента",
        "Навигация через next/link",
        "Не пометил весь layout как use client без нужды",
    ],
    "links": [
        {
            "title": "Next.js: Layouts and Pages",
            "url": "https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts",
        }
    ],
    "glossary": [
        {"term": "layout", "meaning": "Общий UI сегмента маршрута.", "example": "app/dashboard/layout.tsx"},
        {"term": "loading.tsx", "meaning": "Fallback при загрузке сегмента.", "example": "skeleton"},
        {"term": "route segment", "meaning": "Папка в app/, часть URL.", "example": "app/blog/[slug]"},
        {"term": "Link", "meaning": "Клиентская навигация Next.", "example": "import Link from 'next/link'"},
    ],
    "quiz": [
        {
            "id": "react-18-q1",
            "prompt": "Что сохраняется при переходе между дочерними page одного layout?",
            "options": [
                "Состояние и DOM оболочки layout",
                "Только CSS файлы сайта",
                "Все cookies удаляются",
                "Node process перезапускается",
            ],
            "correctIndex": 0,
        },
        {
            "id": "react-18-q2",
            "prompt": "Для чего loading.tsx?",
            "options": [
                "Показать fallback, пока сегмент грузится",
                "Заменить nginx",
                "Хранить JWT secret",
                "Отключить TypeScript",
            ],
            "correctIndex": 0,
        },
    ],
}

REACT_19 = {
    "id": "react-19",
    "part": "react",
    "module": "react-next",
    "order": 19,
    "title": "Next.js: Server Actions и формы",
    "goal": "Отправишь форму через Server Action без отдельного API route.",
    "theory": [
        {
            "type": "paragraph",
            "content": "Server Actions — асинхронные функции с директивой 'use server', которые можно вызвать из формы (action={fn}) или из клиентского кода. Они выполняются на сервере: доступ к БД и секретам без публичного REST endpoint. Валидируй вход (zod) внутри action: клиент ненадёжен. После мутации вызывай revalidatePath или revalidateTag, чтобы обновить кэш RSC.",
        },
        {
            "type": "heading",
            "content": "Границы безопасности",
        },
        {
            "type": "paragraph",
            "content": "Action — публичная точка входа, как POST-эндпоинт. Проверяй сессию/права до записи в БД. Не доверяй скрытым полям формы. Для прогресса UI на клиенте используй useFormStatus / useActionState. Тяжёлую интерактивность оставляй в Client Components; action держи тонким: validate → mutate → revalidate.",
        },
        {
            "type": "list",
            "items": [
                "'use server' в файле или над функцией.",
                "form action={createPost}.",
                "zod.safeParse перед записью.",
                "revalidatePath('/posts') после успеха.",
            ],
        },
    ],
    "codeExample": "// app/actions.ts\n'use server';\nimport { revalidatePath } from 'next/cache';\nimport { z } from 'zod';\n\nconst schema = z.object({ title: z.string().min(1).max(120) });\n\nexport async function createPost(formData: FormData) {\n  const parsed = schema.safeParse({ title: formData.get('title') });\n  if (!parsed.success) return { error: 'Некорректный заголовок' };\n  // await db.post.create({ data: parsed.data })\n  revalidatePath('/posts');\n  return { ok: true };\n}\n\n// app/posts/new/page.tsx\nimport { createPost } from '@/app/actions';\nexport default function NewPostPage() {\n  return (\n    <form action={createPost}>\n      <input name=\"title\" required />\n      <button type=\"submit\">Создать</button>\n    </form>\n  );\n}",
    "practice": [
        {
            "title": "Action createPost",
            "description": "Файл app/actions.ts с 'use server' и zod-проверкой title. Пока без БД — console.log и revalidatePath('/').",
        },
        {
            "title": "Форма",
            "description": "Страница с <form action={createPost}>. После submit заголовок появляется в логе сервера (терминал next dev).",
        },
        {
            "title": "Ошибка валидации",
            "description": "Отправь пустой title (убери required) — action возвращает error; покажи текст на странице через useActionState или searchParams.",
        },
    ],
    "checklist": [
        "Понимаю, что action — серверная точка входа",
        "Валидирую FormData на сервере",
        "Вызываю revalidatePath после мутации",
        "Не храню секреты в клиентском бандле",
    ],
    "links": [
        {
            "title": "Next.js: Server Actions",
            "url": "https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations",
        }
    ],
    "glossary": [
        {"term": "Server Action", "meaning": "Серверная функция, вызываемая из UI/формы.", "example": "'use server'"},
        {"term": "revalidatePath", "meaning": "Сброс кэша RSC для пути.", "example": "revalidatePath('/posts')"},
        {"term": "FormData", "meaning": "Данные формы в action.", "example": "formData.get('title')"},
        {"term": "useActionState", "meaning": "Хук состояния результата action.", "example": "ошибка валидации в UI"},
    ],
    "quiz": [
        {
            "id": "react-19-q1",
            "prompt": "Нужно ли валидировать FormData внутри Server Action?",
            "options": [
                "Да — клиент нельзя считать доверенным",
                "Нет, HTML required достаточно",
                "Только если используешь CSS",
                "Только в Pages Router",
            ],
            "correctIndex": 0,
        },
        {
            "id": "react-19-q2",
            "prompt": "Зачем revalidatePath после записи?",
            "options": [
                "Обновить закэшированный серверный UI",
                "Удалить Docker volume",
                "Сбросить DNS",
                "Отключить ESLint",
            ],
            "correctIndex": 0,
        },
    ],
}

REACT_20 = {
    "id": "react-20",
    "part": "react",
    "module": "react-next",
    "order": 20,
    "title": "Next.js: данные на сервере и граница client",
    "goal": "Загрузишь данные в Server Component и вынесешь интерактив в client island.",
    "theory": [
        {
            "type": "paragraph",
            "content": "Server Component может быть async и делать fetch/БД прямо в компоненте. По умолчанию fetch в Next кэшируется; для динамики — cache: 'no-store' или revalidate. Передавать в Client Component можно только сериализуемые props. Хуки (useState, useEffect) — только после 'use client'. Паттерн: сервер готовит данные → клиентский виджет отвечает за клики.",
        },
        {
            "type": "heading",
            "content": "Когда оставаться на Vite SPA",
        },
        {
            "type": "paragraph",
            "content": "Админка за логином, тяжёлый canvas, офлайн-first — часто проще Vite SPA + отдельный API. Маркетинг, SEO-каталог, dashboard с cookie-auth — Next. В курсе основной портфельный React-проект остаётся Vite; Next-уроки закрывают пробел рынка. Не смешивай без нужды: один репозиторий — один способ роутинга.",
        },
        {
            "type": "list",
            "items": [
                "async Server Component + fetch.",
                "'use client' только для интерактива.",
                "Не импортируй серверный модуль с секретами в client.",
                "Для SEO смотри View Source — контент должен быть в HTML.",
            ],
        },
    ],
    "codeExample": "// app/posts/page.tsx — Server Component\nasync function getPosts() {\n  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5', {\n    next: { revalidate: 60 },\n  });\n  return res.json();\n}\n\nexport default async function PostsPage() {\n  const posts = await getPosts();\n  return (\n    <main>\n      <h1>Посты</h1>\n      <PostListClient initial={posts} />\n    </main>\n  );\n}\n\n// app/posts/post-list-client.tsx\n'use client';\nexport function PostListClient({ initial }: { initial: { id: number; title: string }[] }) {\n  return <ul>{initial.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;\n}",
    "practice": [
        {
            "title": "Server fetch",
            "description": "Страница /posts: async page, 5 постов, title в HTML (View Source).",
        },
        {
            "title": "Client island",
            "description": "Кнопка «Показать id» в 'use client' компоненте; данные приходят props с сервера.",
        },
        {
            "title": "no-store",
            "description": "Сделай вариант fetch с cache: 'no-store' и сравни поведение при обновлении.",
        },
    ],
    "checklist": [
        "Умею async Server Component с fetch",
        "Вынес интерактив в client component",
        "Проверил контент в View Source",
        "Понимаю, когда Vite SPA уместнее Next",
    ],
    "links": [
        {
            "title": "Next.js: Data Fetching",
            "url": "https://nextjs.org/docs/app/building-your-application/data-fetching",
        }
    ],
    "glossary": [
        {"term": "Server Component", "meaning": "Компонент на сервере без хуков клиента.", "example": "async function Page()"},
        {"term": "client island", "meaning": "Островок 'use client' внутри серверного дерева.", "example": "кнопка с useState"},
        {"term": "revalidate", "meaning": "Интервал ISR/кэша fetch.", "example": "next: { revalidate: 60 }"},
        {"term": "no-store", "meaning": "Не кэшировать fetch.", "example": "cache: 'no-store'"},
    ],
    "quiz": [
        {
            "id": "react-20-q1",
            "prompt": "Можно ли вызывать useState в Server Component?",
            "options": [
                "Нет — хуки только в Client Components",
                "Да, всегда",
                "Только в CSS modules",
                "Только через iframe",
            ],
            "correctIndex": 0,
        },
        {
            "id": "react-20-q2",
            "prompt": "Как проверить, что SEO-контент пришёл с сервера?",
            "options": [
                "View Source / «Просмотр кода страницы» — текст в HTML",
                "Только React DevTools Components",
                "Только Lighthouse mobile",
                "Только ping DNS",
            ],
            "correctIndex": 0,
        },
    ],
}

DATABASE_15 = {
    "id": "database-15",
    "part": "database",
    "module": "db-cache",
    "order": 15,
    "title": "Redis: кэш и rate-limit на практике",
    "goal": "Поднимешь Redis в Docker и сделаешь кэш ответа + счётчик лимита запросов.",
    "theory": [
        {
            "type": "paragraph",
            "content": "Redis — in-memory store с простыми структурами: STRING, HASH, LIST, SET. Для API чаще всего: кэш тяжёлого SELECT (ключ → JSON, TTL) и rate-limit (INCR + EXPIRE на IP или userId). Данные в Redis не заменяют Postgres как source of truth: при промахе кэша читаешь БД и заполняешь ключ. После UPDATE/DELETE инвалидируй ключ (DEL) или короткий TTL.",
        },
        {
            "type": "heading",
            "content": "Rate-limit окном",
        },
        {
            "type": "paragraph",
            "content": "Ключ rl:login:IP, INCR. Если значение 1 — EXPIRE 60. Если больше N — 429 Too Many Requests. Это грубая, но рабочая защита login от перебора. В проде добавь префикс окружения и не логируй PII в ключах без нужды.",
        },
        {
            "type": "list",
            "items": [
                "docker run redis или redis в compose.",
                "GET/SET/SET EX для кэша.",
                "INCR + EXPIRE для лимита.",
                "DEL ключа после мутации сущности.",
            ],
        },
        {
            "type": "heading",
            "content": "Как проверить, что сделал правильно",
        },
        {
            "type": "paragraph",
            "content": "Первый запрос к эндпоинту медленнее (miss), второй с тем же ключом — быстрее и без SQL в логах. После 10 быстрых login с одного IP — 429. redis-cli KEYS 'cache:*' показывает ключи (на проде KEYS осторожно — лучше SCAN).",
        },
    ],
    "codeExample": "import Redis from 'ioredis';\nconst redis = new Redis(process.env.REDIS_URL);\n\nexport async function getCachedPosts() {\n  const key = 'cache:posts:list';\n  const hit = await redis.get(key);\n  if (hit) return JSON.parse(hit);\n  const posts = await db.post.findMany({ take: 20 }); // Postgres\n  await redis.set(key, JSON.stringify(posts), 'EX', 60);\n  return posts;\n}\n\nexport async function rateLimit(ip: string, limit = 10) {\n  const key = `rl:login:${ip}`;\n  const n = await redis.incr(key);\n  if (n === 1) await redis.expire(key, 60);\n  return n <= limit;\n}",
    "practice": [
        {
            "title": "Redis в Docker",
            "description": "Добавь сервис redis:7-alpine в compose (порт 6379). redis-cli PING → PONG.",
        },
        {
            "title": "Кэш списка",
            "description": "GET /posts: если cache:posts:list есть — отдай JSON из Redis; иначе из БД/массива и SET EX 60. Второй запрос без обращения к «БД» (лог).",
        },
        {
            "title": "Rate-limit login",
            "description": "На POST /auth/login INCR по IP. После превышения лимита — 429. Покажи скрин или лог двух ответов: 200 и 429.",
        },
    ],
    "checklist": [
        "Redis поднимается через Docker",
        "Кэш отдаёт hit по TTL",
        "Rate-limit возвращает 429",
        "Понимаю, что Postgres остаётся источником истины",
    ],
    "links": [
        {
            "title": "Redis docs: SET",
            "url": "https://redis.io/docs/latest/commands/set/",
        }
    ],
    "glossary": [
        {"term": "TTL", "meaning": "Время жизни ключа в секундах.", "example": "SET key val EX 60"},
        {"term": "cache hit", "meaning": "Данные найдены в Redis.", "example": "GET не null"},
        {"term": "INCR", "meaning": "Атомарно увеличить счётчик.", "example": "rate-limit"},
        {"term": "invalidation", "meaning": "Сброс кэша после изменения данных.", "example": "DEL cache:posts:list"},
    ],
    "quiz": [
        {
            "id": "database-15-q1",
            "prompt": "Redis заменяет PostgreSQL как основное хранилище бизнес-данных?",
            "options": [
                "Нет — обычно кэш/очереди/лимиты, source of truth в БД",
                "Да, всегда удаляем Postgres",
                "Только для HTML",
                "Только вместе с Mongo обязателен",
            ],
            "correctIndex": 0,
        },
        {
            "id": "database-15-q2",
            "prompt": "Как ограничить попытки login?",
            "options": [
                "INCR + EXPIRE по ключу IP/user, при превышении 429",
                "Удалить индекс в Postgres",
                "Отключить HTTPS",
                "Хранить пароли в Redis без хеша",
            ],
            "correctIndex": 0,
        },
    ],
}


def add_new_lessons() -> list[str]:
    created = []
    # shift react-project
    rp = LESSONS / "react" / "react-project.json"
    data = load(rp)
    data["order"] = 21
    save(rp, data)

    for lesson in (REACT_18, REACT_19, REACT_20):
        path = LESSONS / "react" / f"{lesson['id']}.json"
        save(path, lesson)
        created.append(lesson["id"])

    # shift database-project
    dp = LESSONS / "database" / "database-project.json"
    data = load(dp)
    data["order"] = 16
    save(dp, data)

    path = LESSONS / "database" / "database-15.json"
    save(path, DATABASE_15)
    created.append("database-15")
    return created


# --- 5. Starters with real files ---

def write_starter(name: str, files: dict[str, str]) -> None:
    for base in (STARTERS / name, PUBLIC_STARTERS / name):
        if base.exists():
            shutil.rmtree(base)
        base.mkdir(parents=True, exist_ok=True)
        for rel, content in files.items():
            target = base / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")


def build_starters() -> int:
    starters: dict[str, dict[str, str]] = {
        "about-me": {
            "README.md": "# Визитка\n\nСтартер модуля tools.\n\n## Цель\nРепозиторий-визитка: README о себе + скрин/ссылки.\n\n## Старт\n1. Скопируй папку в новый git-репозиторий.\n2. Заполни `profile.md`.\n3. Закоммить и запушь на GitHub.\n",
            "profile.md": "# Имя\n\n- Город:\n- Цель курса:\n- Стек, который хочу:\n\n## Ссылки\n- GitHub:\n- Telegram:\n",
            ".gitignore": ".DS_Store\n.env\n",
        },
        "html-resume": {
            "README.md": "# HTML Resume\n\nОткрой `index.html` в браузере. Без сборки.\n\n## Сдача\nСемантика, контакты, секции опыта, валидная вёрстка.\n",
            "index.html": "<!DOCTYPE html>\n<html lang=\"ru\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n  <title>Резюме — Имя Фамилия</title>\n</head>\n<body>\n  <header>\n    <h1>Имя Фамилия</h1>\n    <p>Junior Frontend Developer</p>\n  </header>\n  <main>\n    <section id=\"about\">\n      <h2>О себе</h2>\n      <p>Кратко о цели и стеке.</p>\n    </section>\n    <section id=\"skills\">\n      <h2>Навыки</h2>\n      <ul>\n        <li>HTML</li>\n        <li>CSS</li>\n      </ul>\n    </section>\n  </main>\n  <footer>\n    <a href=\"mailto:you@example.com\">you@example.com</a>\n  </footer>\n</body>\n</html>\n",
            ".gitignore": ".DS_Store\n",
        },
        "css-landing": {
            "README.md": "# CSS Landing\n\nАдаптивный лендинг. Открой `index.html`.\n\n## Старт\nПравь `styles.css`: переменные, flex/grid, media queries.\n",
            "index.html": "<!DOCTYPE html>\n<html lang=\"ru\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n  <title>Лендинг</title>\n  <link rel=\"stylesheet\" href=\"styles.css\" />\n</head>\n<body>\n  <header class=\"site-header\">\n    <a class=\"logo\" href=\"#\">Product</a>\n    <nav>\n      <a href=\"#features\">Возможности</a>\n      <a href=\"#cta\">Контакт</a>\n    </nav>\n  </header>\n  <main>\n    <section class=\"hero\" id=\"hero\">\n      <h1>Заголовок продукта</h1>\n      <p>Короткое ценностное предложение.</p>\n      <a class=\"button\" href=\"#cta\">Начать</a>\n    </section>\n    <section id=\"features\" class=\"features\">\n      <article><h2>Быстро</h2><p>Описание.</p></article>\n      <article><h2>Просто</h2><p>Описание.</p></article>\n      <article><h2>Надёжно</h2><p>Описание.</p></article>\n    </section>\n    <section id=\"cta\" class=\"cta\">\n      <h2>Связаться</h2>\n      <form>\n        <label>Email <input type=\"email\" required /></label>\n        <button type=\"submit\">Отправить</button>\n      </form>\n    </section>\n  </main>\n</body>\n</html>\n",
            "styles.css": ":root {\n  --bg: #f6f3ee;\n  --ink: #1c1917;\n  --accent: #0f766e;\n  --max: 960px;\n}\n* { box-sizing: border-box; }\nbody {\n  margin: 0;\n  font-family: Georgia, 'Times New Roman', serif;\n  color: var(--ink);\n  background: var(--bg);\n}\n.site-header, .hero, .features, .cta {\n  max-width: var(--max);\n  margin: 0 auto;\n  padding: 1.25rem;\n}\n.site-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n.hero { padding-block: 4rem; }\n.features {\n  display: grid;\n  gap: 1rem;\n  grid-template-columns: 1fr;\n}\n.button, button {\n  display: inline-block;\n  background: var(--accent);\n  color: white;\n  border: 0;\n  padding: 0.7rem 1rem;\n  text-decoration: none;\n}\n@media (min-width: 720px) {\n  .features { grid-template-columns: repeat(3, 1fr); }\n}\n",
            ".gitignore": ".DS_Store\n",
        },
        "js-todo": {
            "README.md": "# JS Todo\n\nВанильный JS + Vite.\n\n```bash\nnpm install\nnpm run dev\n```\n",
            "package.json": '{\n  "name": "js-todo",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "preview": "vite preview"\n  },\n  "devDependencies": {\n    "vite": "^6.0.0"\n  }\n}\n',
            "index.html": "<!DOCTYPE html>\n<html lang=\"ru\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n  <title>Todo</title>\n</head>\n<body>\n  <div id=\"app\">\n    <h1>Todo</h1>\n    <form id=\"form\">\n      <input id=\"input\" placeholder=\"Новая задача\" required />\n      <button type=\"submit\">Добавить</button>\n    </form>\n    <ul id=\"list\"></ul>\n  </div>\n  <script type=\"module\" src=\"/main.js\"></script>\n</body>\n</html>\n",
            "main.js": "const form = document.querySelector('#form');\nconst input = document.querySelector('#input');\nconst list = document.querySelector('#list');\n\n/** @type {{ id: string, title: string, done: boolean }[]} */\nlet todos = JSON.parse(localStorage.getItem('todos') || '[]');\n\nfunction save() {\n  localStorage.setItem('todos', JSON.stringify(todos));\n}\n\nfunction render() {\n  list.innerHTML = '';\n  for (const todo of todos) {\n    const li = document.createElement('li');\n    li.textContent = todo.title;\n    if (todo.done) li.style.textDecoration = 'line-through';\n    li.addEventListener('click', () => {\n      todo.done = !todo.done;\n      save();\n      render();\n    });\n    list.append(li);\n  }\n}\n\nform.addEventListener('submit', (e) => {\n  e.preventDefault();\n  todos.push({ id: crypto.randomUUID(), title: input.value.trim(), done: false });\n  input.value = '';\n  save();\n  render();\n});\n\nrender();\n",
            ".gitignore": "node_modules\ndist\n.DS_Store\n",
        },
        "ts-todo": {
            "README.md": "# TS Todo\n\n```bash\nnpm install\nnpm run dev\n```\n\nStrict TypeScript + Vite.\n",
            "package.json": '{\n  "name": "ts-todo",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build",\n    "preview": "vite preview"\n  },\n  "devDependencies": {\n    "typescript": "^5.7.0",\n    "vite": "^6.0.0"\n  }\n}\n',
            "tsconfig.json": '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "ESNext",\n    "moduleResolution": "bundler",\n    "strict": true,\n    "noEmit": true,\n    "skipLibCheck": true\n  },\n  "include": ["src"]\n}\n',
            "index.html": "<!DOCTYPE html>\n<html lang=\"ru\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <title>TS Todo</title>\n</head>\n<body>\n  <div id=\"app\"></div>\n  <script type=\"module\" src=\"/src/main.ts\"></script>\n</body>\n</html>\n",
            "src/main.ts": "type Todo = { id: string; title: string; done: boolean };\n\nconst app = document.querySelector('#app');\nif (!app) throw new Error('#app missing');\n\nlet todos: Todo[] = [];\n\nfunction render(): void {\n  app.innerHTML = `\n    <h1>TS Todo</h1>\n    <form id=\"form\"><input id=\"title\" required /><button>Add</button></form>\n    <ul>${todos.map((t) => `<li data-id=\"${t.id}\">${t.title}</li>`).join('')}</ul>`;\n  document.querySelector('#form')?.addEventListener('submit', (e) => {\n    e.preventDefault();\n    const input = document.querySelector<HTMLInputElement>('#title');\n    if (!input?.value.trim()) return;\n    todos = [...todos, { id: crypto.randomUUID(), title: input.value.trim(), done: false }];\n    render();\n  });\n}\n\nrender();\n",
            ".gitignore": "node_modules\ndist\n.DS_Store\n",
        },
        "react-catalog": {
            "README.md": "# React Catalog\n\n```bash\nnpm install\nnpm run dev\n```\n\nКаталог: список, фильтр, корзина (Zustand).\n",
            "package.json": '{\n  "name": "react-catalog",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc -b && vite build",\n    "preview": "vite preview"\n  },\n  "dependencies": {\n    "react": "^19.0.0",\n    "react-dom": "^19.0.0",\n    "zustand": "^5.0.0"\n  },\n  "devDependencies": {\n    "@types/react": "^19.0.0",\n    "@types/react-dom": "^19.0.0",\n    "@vitejs/plugin-react": "^4.3.0",\n    "typescript": "^5.7.0",\n    "vite": "^6.0.0"\n  }\n}\n',
            "vite.config.ts": "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });\n",
            "tsconfig.json": '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "lib": ["ES2022", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "moduleResolution": "bundler",\n    "jsx": "react-jsx",\n    "strict": true,\n    "noEmit": true,\n    "skipLibCheck": true\n  },\n  "include": ["src"]\n}\n',
            "index.html": "<!DOCTYPE html>\n<html lang=\"ru\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n  <title>Catalog</title>\n</head>\n<body>\n  <div id=\"root\"></div>\n  <script type=\"module\" src=\"/src/main.tsx\"></script>\n</body>\n</html>\n",
            "src/main.tsx": "import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport { App } from './App';\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>,\n);\n",
            "src/App.tsx": "import { useMemo, useState } from 'react';\nimport { useCart } from './store';\n\nconst PRODUCTS = [\n  { id: '1', title: 'Ноутбук', price: 800 },\n  { id: '2', title: 'Мышь', price: 25 },\n  { id: '3', title: 'Клавиатура', price: 60 },\n];\n\nexport function App() {\n  const [q, setQ] = useState('');\n  const { items, add } = useCart();\n  const list = useMemo(\n    () => PRODUCTS.filter((p) => p.title.toLowerCase().includes(q.toLowerCase())),\n    [q],\n  );\n\n  return (\n    <main style={{ fontFamily: 'system-ui', padding: 24 }}>\n      <h1>Каталог</h1>\n      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder=\"Поиск\" />\n      <p>В корзине: {items.length}</p>\n      <ul>\n        {list.map((p) => (\n          <li key={p.id}>\n            {p.title} — ${'{'}p.price{'}'}{' '}\n            <button type=\"button\" onClick={() => add(p.id)}>В корзину</button>\n          </li>\n        ))}\n      </ul>\n    </main>\n  );\n}\n",
            "src/store.ts": "import { create } from 'zustand';\n\ntype CartState = {\n  items: string[];\n  add: (id: string) => void;\n};\n\nexport const useCart = create<CartState>((set) => ({\n  items: [],\n  add: (id) => set((s) => ({ items: [...s.items, id] })),\n}));\n",
            ".gitignore": "node_modules\ndist\n.DS_Store\n",
        },
        "api-blog": {
            "README.md": "# API Blog\n\n```bash\nnpm install\nnpm run dev\n```\n\nExpress REST skeleton: routes → services → repositories.\n",
            "package.json": '{\n  "name": "api-blog",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "dev": "node --watch src/index.js",\n    "start": "node src/index.js"\n  },\n  "dependencies": {\n    "express": "^4.21.0",\n    "zod": "^3.24.0"\n  }\n}\n',
            "src/index.js": "import express from 'express';\nimport { postsRouter } from './routes/posts.js';\n\nconst app = express();\napp.use(express.json());\napp.get('/health', (_req, res) => res.json({ ok: true }));\napp.use('/posts', postsRouter);\n\nconst port = Number(process.env.PORT || 4000);\napp.listen(port, () => console.log(`API http://localhost:${port}`));\n",
            "src/routes/posts.js": "import { Router } from 'express';\nimport { z } from 'zod';\nimport * as postsService from '../services/postsService.js';\n\nexport const postsRouter = Router();\nconst createSchema = z.object({ title: z.string().min(1), body: z.string().min(1) });\n\npostsRouter.get('/', (_req, res) => {\n  res.json(postsService.list());\n});\n\npostsRouter.post('/', (req, res) => {\n  const parsed = createSchema.safeParse(req.body);\n  if (!parsed.success) return res.status(400).json(parsed.error.flatten());\n  const post = postsService.create(parsed.data);\n  res.status(201).json(post);\n});\n",
            "src/services/postsService.js": "import * as repo from '../repositories/postsRepo.js';\n\nexport function list() {\n  return repo.findAll();\n}\n\nexport function create(dto) {\n  return repo.insert(dto);\n}\n",
            "src/repositories/postsRepo.js": "const store = new Map();\n\nexport function findAll() {\n  return [...store.values()];\n}\n\nexport function insert(dto) {\n  const row = { id: crypto.randomUUID(), ...dto, createdAt: new Date().toISOString() };\n  store.set(row.id, row);\n  return row;\n}\n",
            ".gitignore": "node_modules\n.env\n.DS_Store\n",
            ".env.example": "PORT=4000\n",
        },
        "api-blog-db": {
            "README.md": "# API Blog + Postgres + Prisma\n\n```bash\ndocker compose up -d\ncp .env.example .env\nnpm install\nnpx prisma migrate dev\nnpm run dev\n```\n",
            "package.json": '{\n  "name": "api-blog-db",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "dev": "node --watch src/index.js",\n    "prisma": "prisma"\n  },\n  "dependencies": {\n    "@prisma/client": "^6.0.0",\n    "express": "^4.21.0",\n    "zod": "^3.24.0"\n  },\n  "devDependencies": {\n    "prisma": "^6.0.0"\n  }\n}\n',
            "docker-compose.yml": "services:\n  db:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_USER: blog\n      POSTGRES_PASSWORD: blog\n      POSTGRES_DB: blog\n    ports:\n      - '5432:5432'\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n  redis:\n    image: redis:7-alpine\n    ports:\n      - '6379:6379'\nvolumes:\n  pgdata:\n",
            "prisma/schema.prisma": 'generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\nmodel Post {\n  id        String   @id @default(cuid())\n  title     String\n  body      String\n  createdAt DateTime @default(now())\n}\n',
            "src/index.js": "import express from 'express';\nimport { PrismaClient } from '@prisma/client';\n\nconst prisma = new PrismaClient();\nconst app = express();\napp.use(express.json());\n\napp.get('/health', (_req, res) => res.json({ ok: true }));\napp.get('/posts', async (_req, res) => {\n  res.json(await prisma.post.findMany({ orderBy: { createdAt: 'desc' } }));\n});\napp.post('/posts', async (req, res) => {\n  const { title, body } = req.body ?? {};\n  if (!title || !body) return res.status(400).json({ error: 'title and body required' });\n  const post = await prisma.post.create({ data: { title, body } });\n  res.status(201).json(post);\n});\n\napp.listen(4000, () => console.log('API http://localhost:4000'));\n",
            ".env.example": "DATABASE_URL=postgresql://blog:blog@localhost:5432/blog\nREDIS_URL=redis://localhost:6379\n",
            ".gitignore": "node_modules\n.env\n.DS_Store\n",
        },
        "api-auth": {
            "README.md": "# API Auth\n\nКаркас auth поверх blog API.\n\n```bash\nnpm install\nnpm run dev\n```\n\nДобавь bcrypt, JWT access/refresh, роли (см. модуль security).\n",
            "package.json": '{\n  "name": "api-auth",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "dev": "node --watch src/index.js"\n  },\n  "dependencies": {\n    "bcryptjs": "^2.4.3",\n    "express": "^4.21.0",\n    "jsonwebtoken": "^9.0.2",\n    "zod": "^3.24.0"\n  }\n}\n',
            "src/index.js": "import express from 'express';\nimport bcrypt from 'bcryptjs';\nimport jwt from 'jsonwebtoken';\nimport { z } from 'zod';\n\nconst app = express();\napp.use(express.json());\nconst users = new Map();\nconst secret = process.env.JWT_SECRET || 'dev-only-change-me';\n\nconst credSchema = z.object({\n  email: z.string().email(),\n  password: z.string().min(8),\n});\n\napp.post('/auth/register', async (req, res) => {\n  const parsed = credSchema.safeParse(req.body);\n  if (!parsed.success) return res.status(400).json(parsed.error.flatten());\n  if (users.has(parsed.data.email)) return res.status(409).json({ error: 'exists' });\n  const passwordHash = await bcrypt.hash(parsed.data.password, 10);\n  const user = { id: crypto.randomUUID(), email: parsed.data.email, passwordHash, role: 'user' };\n  users.set(user.email, user);\n  res.status(201).json({ id: user.id, email: user.email, role: user.role });\n});\n\napp.post('/auth/login', async (req, res) => {\n  const parsed = credSchema.safeParse(req.body);\n  if (!parsed.success) return res.status(400).json(parsed.error.flatten());\n  const user = users.get(parsed.data.email);\n  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {\n    return res.status(401).json({ error: 'invalid' });\n  }\n  const access = jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '15m' });\n  res.json({ access });\n});\n\napp.listen(4000, () => console.log('Auth API http://localhost:4000'));\n",
            ".env.example": "JWT_SECRET=change-me\nPORT=4000\n",
            ".gitignore": "node_modules\n.env\n.DS_Store\n",
        },
        "fullstack-app": {
            "README.md": "# Fullstack App\n\nМонорепо-лайт: `web` (Vite React) + `api` (Express).\n\n```bash\n# терминал 1\ncd api && npm install && npm run dev\n# терминал 2\ncd web && npm install && npm run dev\n```\n",
            "api/package.json": '{\n  "name": "fullstack-api",\n  "private": true,\n  "type": "module",\n  "scripts": { "dev": "node --watch index.js" },\n  "dependencies": { "cors": "^2.8.5", "express": "^4.21.0" }\n}\n',
            "api/index.js": "import express from 'express';\nimport cors from 'cors';\nconst app = express();\napp.use(cors({ origin: 'http://localhost:5173' }));\napp.use(express.json());\nconst tasks = [];\napp.get('/tasks', (_req, res) => res.json(tasks));\napp.post('/tasks', (req, res) => {\n  const task = { id: crypto.randomUUID(), title: String(req.body?.title || '').trim() };\n  if (!task.title) return res.status(400).json({ error: 'title required' });\n  tasks.push(task);\n  res.status(201).json(task);\n});\napp.listen(4000, () => console.log('API :4000'));\n",
            "web/package.json": '{\n  "name": "fullstack-web",\n  "private": true,\n  "type": "module",\n  "scripts": { "dev": "vite" },\n  "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" },\n  "devDependencies": {\n    "@vitejs/plugin-react": "^4.3.0",\n    "vite": "^6.0.0"\n  }\n}\n',
            "web/vite.config.js": "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()], server: { port: 5173 } });\n",
            "web/index.html": "<!DOCTYPE html><html lang=\"ru\"><head><meta charset=\"UTF-8\" /><title>Tasks</title></head><body><div id=\"root\"></div><script type=\"module\" src=\"/src/main.jsx\"></script></body></html>\n",
            "web/src/main.jsx": "import { createRoot } from 'react-dom/client';\nimport { useEffect, useState } from 'react';\n\nconst API = 'http://localhost:4000';\n\nfunction App() {\n  const [tasks, setTasks] = useState([]);\n  const [title, setTitle] = useState('');\n  const [error, setError] = useState('');\n  const [loading, setLoading] = useState(true);\n\n  async function load() {\n    setLoading(true);\n    setError('');\n    try {\n      const res = await fetch(`${API}/tasks`);\n      setTasks(await res.json());\n    } catch {\n      setError('API недоступен');\n    } finally {\n      setLoading(false);\n    }\n  }\n\n  useEffect(() => { load(); }, []);\n\n  async function onSubmit(e) {\n    e.preventDefault();\n    const res = await fetch(`${API}/tasks`, {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ title }),\n    });\n    if (!res.ok) return setError('Не удалось создать');\n    setTitle('');\n    await load();\n  }\n\n  if (loading) return <p>Загрузка…</p>;\n  if (error) return <p role=\"alert\">{error}</p>;\n\n  return (\n    <main>\n      <h1>Tasks</h1>\n      <form onSubmit={onSubmit}>\n        <input value={title} onChange={(e) => setTitle(e.target.value)} />\n        <button type=\"submit\">Add</button>\n      </form>\n      {tasks.length === 0 ? <p>Пусто</p> : (\n        <ul>{tasks.map((t) => <li key={t.id}>{t.title}</li>)}</ul>\n      )}\n    </main>\n  );\n}\n\ncreateRoot(document.getElementById('root')).render(<App />);\n",
            ".gitignore": "node_modules\n.env\n.DS_Store\n",
        },
        "testing-kit": {
            "README.md": "# Testing Kit\n\n```bash\nnpm install\nnpm test\nnpm run test:e2e\n```\n",
            "package.json": '{\n  "name": "testing-kit",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "test": "vitest run",\n    "test:e2e": "playwright test"\n  },\n  "devDependencies": {\n    "@playwright/test": "^1.49.0",\n    "vitest": "^2.1.0"\n  }\n}\n',
            "src/sum.js": "export function sum(a, b) {\n  return a + b;\n}\n",
            "src/sum.test.js": "import { describe, expect, it } from 'vitest';\nimport { sum } from './sum.js';\n\ndescribe('sum', () => {\n  it('adds numbers', () => {\n    expect(sum(2, 3)).toBe(5);\n  });\n});\n",
            "playwright.config.js": "export default { testDir: './e2e', timeout: 15_000 };\n",
            "e2e/smoke.spec.js": "import { test, expect } from '@playwright/test';\n\ntest('example.com has title', async ({ page }) => {\n  await page.goto('https://example.com');\n  await expect(page).toHaveTitle(/Example/);\n});\n",
            ".gitignore": "node_modules\ntest-results\nplaywright-report\n.DS_Store\n",
        },
        "devops-deploy": {
            "README.md": "# DevOps Deploy\n\n```bash\ndocker compose up --build\ncurl http://localhost:8080/health\n```\n\nCI: см. `.github/workflows/ci.yml`.\n",
            "docker-compose.yml": "services:\n  api:\n    build: .\n    ports:\n      - '8080:4000'\n    environment:\n      NODE_ENV: production\n",
            "Dockerfile": "FROM node:22-alpine AS deps\nWORKDIR /app\nCOPY package.json ./\nRUN npm install --omit=dev\n\nFROM node:22-alpine\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=deps /app/node_modules ./node_modules\nCOPY package.json ./\nCOPY src ./src\nEXPOSE 4000\nCMD [\"node\", \"src/index.js\"]\n",
            "package.json": '{\n  "name": "devops-deploy",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "start": "node src/index.js",\n    "test": "node --test"\n  }\n}\n',
            "src/index.js": "import http from 'node:http';\nconst server = http.createServer((req, res) => {\n  if (req.url === '/health') {\n    res.writeHead(200, { 'content-type': 'application/json' });\n    res.end(JSON.stringify({ ok: true }));\n    return;\n  }\n  res.writeHead(404);\n  res.end();\n});\nserver.listen(4000, () => console.log('listening 4000'));\n",
            ".github/workflows/ci.yml": "name: CI\non:\n  pull_request:\n  push:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n      - run: npm test\n",
            ".gitignore": "node_modules\n.DS_Store\n",
        },
        "capstone": {
            "README.md": "# Capstone\n\nЧеклист итогового продукта.\n\n## Must\n- [ ] Auth\n- [ ] Основной CRUD\n- [ ] Admin или realtime\n- [ ] Тесты критичного пути\n- [ ] Deploy HTTPS\n- [ ] README + demo + case study\n\nСкопируй в свой репозиторий и веди прогресс здесь.\n",
            "docs/acceptance.md": "# Acceptance\n\n| Требование | Статус | Ссылка |\n|---|---|---|\n| Auth | | |\n| CRUD | | |\n| Tests | | |\n| Deploy | | |\n",
            ".gitignore": "node_modules\n.env\n.DS_Store\n",
        },
        "career-kit": {
            "README.md": "# Career Kit\n\nШаблоны резюме, питча и трекера откликов.\n",
            "resume.md": "# Имя Фамилия\n\nJunior Full-stack Developer\n\n## Стек\nTypeScript, React, Node.js, PostgreSQL\n\n## Проекты\n1. Capstone — …\n2. Blog API — …\n",
            "outreach.md": "# Трекер откликов\n\n| Дата | Компания | Вакансия | Статус | Заметки |\n|---|---|---|---|---|\n| | | | | |\n",
            "pitch.txt": "30-секундный питч:\nЯ junior full-stack на TypeScript. Сделал … с auth, Postgres и деплоем.\nИщу команду, где могу закрывать фичи end-to-end.\n",
            ".gitignore": ".DS_Store\n",
        },
    }

    # Fix react-catalog App.tsx template - I made a mistake with nested braces
    starters["react-catalog"]["src/App.tsx"] = """import { useMemo, useState } from 'react';
import { useCart } from './store';

const PRODUCTS = [
  { id: '1', title: 'Ноутбук', price: 800 },
  { id: '2', title: 'Мышь', price: 25 },
  { id: '3', title: 'Клавиатура', price: 60 },
];

export function App() {
  const [q, setQ] = useState('');
  const { items, add } = useCart();
  const list = useMemo(
    () => PRODUCTS.filter((p) => p.title.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Каталог</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" />
      <p>В корзине: {items.length}</p>
      <ul>
        {list.map((p) => (
          <li key={p.id}>
            {p.title} — {p.price}{" "}
            <button type="button" onClick={() => add(p.id)}>
              В корзину
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
"""

    for name, files in starters.items():
        write_starter(name, files)
    return len(starters)


# --- 6. Duels ---

NEW_DUELS = [
    {
        "id": "ts-pick",
        "type": "js-function",
        "title": "TS-мышление: pick полей",
        "prompt": "Функция pick(obj, keys) возвращает новый объект только с указанными ключами. Ключей может не быть в obj — пропускай.",
        "difficulty": "medium",
        "timeLimitSec": 480,
        "starter": "function pick(obj, keys) {\n  // напиши решение\n}\n",
        "functionName": "pick",
        "tests": [
            {"name": "базовый", "args": [{"a": 1, "b": 2, "c": 3}, ["a", "c"]], "expected": {"a": 1, "c": 3}},
            {"name": "нет ключа", "args": [{"x": 1}, ["x", "y"]], "expected": {"x": 1}},
            {"name": "пусто", "args": [{"a": 1}, []], "expected": {}},
        ],
    },
    {
        "id": "react-filter",
        "type": "js-function",
        "title": "Фильтр каталога",
        "prompt": "Функция filterProducts(products, query) фильтрует товары по подстроке в title без учёта регистра. products: [{id,title,price}].",
        "difficulty": "medium",
        "timeLimitSec": 420,
        "starter": "function filterProducts(products, query) {\n  // напиши решение\n}\n",
        "functionName": "filterProducts",
        "tests": [
            {
                "name": "подстрока",
                "args": [
                    [{"id": "1", "title": "iPhone", "price": 10}, {"id": "2", "title": "Case", "price": 2}],
                    "pho",
                ],
                "expected": [{"id": "1", "title": "iPhone", "price": 10}],
            },
            {
                "name": "регистр",
                "args": [[{"id": "1", "title": "Mouse", "price": 1}], "MOUSE"],
                "expected": [{"id": "1", "title": "Mouse", "price": 1}],
            },
            {
                "name": "пусто",
                "args": [[{"id": "1", "title": "A", "price": 1}], "zzz"],
                "expected": [],
            },
        ],
    },
    {
        "id": "sql-where",
        "type": "js-function",
        "title": "SQL-мышление: фильтр строк",
        "prompt": "Функция selectWhere(rows, column, value) имитирует SELECT * FROM t WHERE column = value. Верни массив подходящих объектов.",
        "difficulty": "medium",
        "timeLimitSec": 400,
        "starter": "function selectWhere(rows, column, value) {\n  // напиши решение\n}\n",
        "functionName": "selectWhere",
        "tests": [
            {
                "name": "status",
                "args": [
                    [{"id": 1, "status": "open"}, {"id": 2, "status": "done"}, {"id": 3, "status": "open"}],
                    "status",
                    "open",
                ],
                "expected": [{"id": 1, "status": "open"}, {"id": 3, "status": "open"}],
            },
            {
                "name": "пусто",
                "args": [[{"id": 1, "status": "a"}], "status", "b"],
                "expected": [],
            },
        ],
    },
    {
        "id": "api-status",
        "type": "js-function",
        "title": "API: код ответа",
        "prompt": "Функция httpStatus({authorized, found, method}) возвращает число: 401 если !authorized; 404 если authorized и !found; 200 если GET и found; 201 если POST и found-создание (found=true означает успех создания); иначе 405.",
        "difficulty": "medium",
        "timeLimitSec": 540,
        "starter": "function httpStatus({ authorized, found, method }) {\n  // напиши решение\n}\n",
        "functionName": "httpStatus",
        "tests": [
            {"name": "unauthorized", "args": [{"authorized": False, "found": True, "method": "GET"}], "expected": 401},
            {"name": "not found", "args": [{"authorized": True, "found": False, "method": "GET"}], "expected": 404},
            {"name": "get ok", "args": [{"authorized": True, "found": True, "method": "GET"}], "expected": 200},
            {"name": "post create", "args": [{"authorized": True, "found": True, "method": "POST"}], "expected": 201},
            {"name": "method", "args": [{"authorized": True, "found": True, "method": "PUT"}], "expected": 405},
        ],
    },
    {
        "id": "js-debounce-count",
        "type": "js-function",
        "title": "Группировка по ключу",
        "prompt": "Функция groupBy(arr, key) группирует объекты: возвращает объект { [value]: items[] }.",
        "difficulty": "medium",
        "timeLimitSec": 480,
        "starter": "function groupBy(arr, key) {\n  // напиши решение\n}\n",
        "functionName": "groupBy",
        "tests": [
            {
                "name": "роли",
                "args": [
                    [{"name": "a", "role": "admin"}, {"name": "b", "role": "user"}, {"name": "c", "role": "admin"}],
                    "role",
                ],
                "expected": {
                    "admin": [{"name": "a", "role": "admin"}, {"name": "c", "role": "admin"}],
                    "user": [{"name": "b", "role": "user"}],
                },
            },
            {"name": "пусто", "args": [[], "role"], "expected": {}},
        ],
    },
]


def expand_duels() -> int:
    data = load(DUELS)
    existing = {item["id"] for item in data}
    added = 0
    for challenge in NEW_DUELS:
        if challenge["id"] not in existing:
            data.append(challenge)
            added += 1
    save(DUELS, data)
    return added


def update_module_labels() -> None:
    """Ensure react-next and db-cache labels exist in lesson types if needed — no-op for JSON."""
    return


def main() -> None:
    print("typos:", fix_typos())
    print("enrich:", enrich_theory())
    print("quizzes:", inject_quizzes())
    print("new lessons:", add_new_lessons())
    print("starters:", build_starters())
    print("duels:", expand_duels())
    update_module_labels()
    print("done")


if __name__ == "__main__":
    main()
