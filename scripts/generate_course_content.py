#!/usr/bin/env python3
"""Generate Fullstacker course JSON lessons from the docx curriculum plan."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "content" / "lessons"


def L(
    part: str,
    slug: str,
    module: str,
    order: int,
    title: str,
    goal: str,
    sections: list[tuple[str, list[str]]],
    terms: list[tuple[str, str, str]],
    practices: list[tuple[str, str]] | None = None,
    checklist: list[str] | None = None,
    code: str = "",
    links: list[tuple[str, str]] | None = None,
) -> dict:
    theory: list[dict] = []
    for heading, paras in sections:
        if heading:
            theory.append({"type": "heading", "content": heading})
        for p in paras:
            theory.append({"type": "paragraph", "content": p})

    if practices is None:
        practices = [
            (
                "Повтори теорию своими словами",
                f"Закрой урок и сформулируй в 3–5 предложениях: {goal}",
            ),
            (
                "Сделай мини-упражнение",
                f"По теме «{title}» выполни маленькое задание в редакторе или терминале и сохрани результат.",
            ),
            (
                "Найди ответ в документации",
                "Открой ссылку из урока, найди один новый факт и запиши его в README или заметку.",
            ),
        ]

    if checklist is None:
        checklist = [
            f"Понимаю цель: {goal}",
            f"Могу объяснить ключевые термины урока «{title}»",
            "Сделал практику без подсказки «скопировать готовое»",
            "Знаю, куда смотреть в документации, если застрял",
        ]

    if links is None:
        links = [
            (
                "MDN Web Docs",
                "https://developer.mozilla.org/ru/",
            )
        ]

    return {
        "id": slug,
        "part": part,
        "module": module,
        "order": order,
        "title": title,
        "goal": goal,
        "theory": theory,
        "codeExample": code,
        "practice": [
            {"title": t, "description": d} for t, d in practices
        ],
        "checklist": checklist,
        "links": [{"title": t, "url": u} for t, u in links],
        "glossary": [
            {"term": t, "meaning": m, "example": e} for t, m, e in terms
        ],
    }


def write_lesson(data: dict) -> None:
    part_dir = ROOT / data["part"]
    part_dir.mkdir(parents=True, exist_ok=True)
    path = part_dir / f"{data['id']}.json"
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {path.relative_to(ROOT.parent.parent)}")


def bump_order(part: str, lesson_id: str, new_order: int) -> None:
    path = ROOT / part / f"{lesson_id}.json"
    if not path.exists():
        return
    data = json.loads(path.read_text(encoding="utf-8"))
    data["order"] = new_order
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"bumped {lesson_id} -> order {new_order}")


# ---------------------------------------------------------------------------
# Module 1: tools
# ---------------------------------------------------------------------------

TOOLS = [
    L(
        "tools", "tools-01", "web", 1,
        "Что такое веб-разработка",
        "Поймёшь разницу между frontend, backend и full-stack и чем занимается junior.",
        [
            ("Три роли", [
                "Frontend отвечает за то, что видит и нажимает пользователь: страницы, кнопки, формы.",
                "Backend — серверная логика: сохранение данных, проверка прав, расчёты, письма.",
                "Full-stack умеет связать обе стороны: интерфейс, API и базу данных в один продукт.",
            ]),
            ("Зачем это знать сразу", [
                "На курсе ты сначала сверстаешь страницу, потом оживишь её скриптами, затем напишешь сервер и выложишь сайт в интернет.",
                "Junior full-stack не знает «всё», но может самостоятельно довести простой продукт от идеи до ссылки.",
            ]),
        ],
        [
            ("frontend", "Часть продукта в браузере: вёрстка и интерфейс.", "React-приложение каталога"),
            ("backend", "Серверная часть: API, БД, бизнес-логика.", "Express REST API"),
            ("full-stack", "Разработка и фронта, и бэка одного продукта.", "Блог с React + Node + PostgreSQL"),
        ],
        links=[("MDN: начало веб-разработки", "https://developer.mozilla.org/ru/docs/Learn_web_development")],
    ),
    L(
        "tools", "tools-02", "web", 2,
        "Как устроен интернет",
        "Объяснишь путь от адреса в строке браузера до ответа сервера.",
        [
            ("Клиент и сервер", [
                "Браузер — клиент: он запрашивает страницу. Компьютер с программой-сервером отвечает HTML, CSS, картинками или JSON.",
                "IP-адрес — «номер дома» сервера. DNS переводит понятное имя вроде example.com в IP.",
            ]),
            ("HTTP и HTTPS", [
                "HTTP — протокол запросов и ответов. HTTPS — тот же HTTP, но с шифрованием через TLS.",
                "Когда ты вводишь адрес, браузер спрашивает DNS, устанавливает соединение и отправляет HTTP-запрос.",
            ]),
        ],
        [
            ("DNS", "Система, которая превращает доменное имя в IP-адрес.", "fullstacker.dev → 203.0.113.10"),
            ("HTTP", "Протокол обмена запросами и ответами между клиентом и сервером.", "GET /index.html"),
            ("HTTPS", "HTTP поверх шифрованного соединения.", "замочек в адресной строке"),
        ],
        links=[("MDN: как работает веб", "https://developer.mozilla.org/ru/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works")],
    ),
    L(
        "tools", "tools-03", "web", 3,
        "Запросы и ответы HTTP",
        "Различишь GET и POST, прочитаешь статус и заголовки ответа.",
        [
            ("Методы", [
                "GET — «дай ресурс», обычно без тела. POST — «прими данные», например форму регистрации.",
                "Есть ещё PUT, PATCH, DELETE — ими пользуются API, когда меняют или удаляют данные.",
            ]),
            ("Коды ответов", [
                "200 — ок. 301/302 — редирект. 404 — не найдено. 500 — ошибка на сервере.",
                "Заголовки несут метаданные: тип содержимого, кэш, cookies. Тело — сам HTML или JSON.",
            ]),
        ],
        [
            ("GET", "Метод запроса на получение ресурса.", "открытие страницы"),
            ("POST", "Метод отправки данных на сервер.", "отправка формы"),
            ("статус 404", "Ресурс не найден.", "опечатка в URL"),
        ],
        practices=[
            ("Открой Network", "В DevTools открой вкладку Network, обнови страницу любого сайта."),
            ("Найди документ", "Кликни по главному документу и посмотри статус, метод и заголовки."),
            ("Сравни GET и POST", "Найди хотя бы один POST (логин/поиск) или объясни, почему его нет."),
        ],
        links=[("MDN: HTTP", "https://developer.mozilla.org/ru/docs/Web/HTTP")],
    ),
    L(
        "tools", "tools-04", "web", 4,
        "Браузер и DevTools",
        "Научишься смотреть Elements, Network и Console у любой страницы.",
        [
            ("Четыре вкладки", [
                "Elements — дерево HTML и стили. Console — сообщения и ошибки JS. Network — запросы. Sources — файлы скриптов.",
                "Правый клик → «Просмотреть код» открывает Elements. F12 или Ctrl+Shift+I открывает панель инструментов.",
            ]),
            ("Зачем это junior", [
                "Большую часть багов ты увидишь в Console и Network раньше, чем в коде редактора.",
                "Привыкай читать ошибки целиком: файл, строка, текст — это и есть карта к исправлению.",
            ]),
        ],
        [
            ("DevTools", "Встроенные инструменты разработчика в браузере.", "F12 в Chrome"),
            ("Console", "Вкладка для логов и ошибок JavaScript.", "Uncaught TypeError"),
            ("Network", "Список сетевых запросов страницы.", "фильтр XHR / Fetch"),
        ],
    ),
    L(
        "tools", "tools-05", "setup", 5,
        "Установка окружения",
        "Поставишь VS Code, Node.js и нужные расширения для курса.",
        [
            ("Что поставить", [
                "VS Code — редактор. Node.js LTS — чтобы запускать JS вне браузера и пользоваться npm.",
                "Полезные расширения: русский язык интерфейса (по желанию), ESLint, Prettier, полезный набор иконок.",
            ]),
            ("Проверка", [
                "В терминале команды node -v и npm -v должны показать версии. code . открывает текущую папку в VS Code.",
            ]),
        ],
        [
            ("VS Code", "Редактор кода от Microsoft.", "code ."),
            ("Node.js", "Среда выполнения JavaScript вне браузера.", "node -v"),
            ("npm", "Менеджер пакетов Node.js.", "npm install"),
        ],
        practices=[
            ("Поставь Node LTS", "Установи Node.js LTS с официального сайта и проверь node -v."),
            ("Поставь VS Code", "Установи VS Code и открой пустую папку проекта."),
            ("Два расширения", "Поставь Prettier и ESLint (или аналог для твоего стека курса)."),
        ],
        links=[("Node.js", "https://nodejs.org/"), ("VS Code", "https://code.visualstudio.com/")],
    ),
    L(
        "tools", "tools-06", "setup", 6,
        "Терминал: базовые команды",
        "Свободно перейдёшь по папкам и создашь файлы из терминала.",
        [
            ("Навигация", [
                "pwd — где ты сейчас. ls — список файлов. cd имя — войти в папку. cd .. — на уровень выше.",
                "mkdir папка создаёт каталог. touch файл.txt создаёт пустой файл (на Linux/macOS).",
            ]),
            ("Осторожность", [
                "rm удаляет. rm -r удаляет папку. Не запускай удаление «вслепую» в домашней директории.",
                "cat файл показывает содержимое. clear очищает экран терминала.",
            ]),
        ],
        [
            ("cd", "Сменить текущую папку.", "cd projects"),
            ("ls", "Показать содержимое папки.", "ls -la"),
            ("mkdir", "Создать папку.", "mkdir demo"),
        ],
        code="pwd\nls\nmkdir demo && cd demo\ntouch hello.txt\ncat hello.txt",
        practices=[
            ("Создай структуру", "В домашней папке создай fullstacker-lab/week1 и зайди в неё."),
            ("Файл-заметка", "Создай notes.txt и запиши туда одну строку через редактор или echo."),
            ("Проверь путь", "Выполни pwd и ls — убедись, что файл на месте."),
        ],
    ),
    L(
        "tools", "tools-07", "git", 7,
        "Git, часть 1: коммиты",
        "Создашь репозиторий и сделаешь осмысленные коммиты.",
        [
            ("Зачем Git", [
                "Git хранит историю изменений. Можно откатиться, сравнить версии и работать ветками.",
                "Репозиторий — папка с историей. commit — снимок изменений с сообщением.",
            ]),
            ("Базовый цикл", [
                "git init → правки → git status → git add → git commit. git log показывает историю.",
                "Файл .gitignore говорит Git, что не коммитить: node_modules, .env, сборки.",
            ]),
        ],
        [
            ("репозиторий", "Проект под управлением Git.", "git init"),
            ("commit", "Сохранённый снимок изменений.", "git commit -m \"add readme\""),
            (".gitignore", "Список файлов, которые Git игнорирует.", "node_modules/"),
        ],
        code="git init\ngit status\ngit add README.md\ngit commit -m \"docs: add readme\"",
        links=[("Pro Git (книга)", "https://git-scm.com/book/ru/v2")],
    ),
    L(
        "tools", "tools-08", "git", 8,
        "Git, часть 2: ветки и merge",
        "Создашь ветку, вольёшь изменения и разберёшься с простым конфликтом.",
        [
            ("Ветки", [
                "Ветка — линия истории. main (или master) — основная. feature/* — для задачи.",
                "git branch, git switch -c имя, git merge имя — базовый набор.",
            ]),
            ("Конфликты", [
                "Конфликт возникает, если две ветки меняли одни и те же строки. Git пометит файл маркерами <<<<<< ====== >>>>>>.",
                "Ты выбираешь итоговый текст, сохраняешь, add и commit завершения merge.",
            ]),
        ],
        [
            ("ветка", "Отдельная линия разработки в Git.", "git switch -c feature/readme"),
            ("merge", "Слияние изменений одной ветки в другую.", "git merge feature/readme"),
            ("конфликт", "Ситуация, когда Git не может сам объединить правки.", "<<<<<<< HEAD"),
        ],
    ),
    L(
        "tools", "tools-09", "git", 9,
        "GitHub: remote, push, pull request",
        "Зальёшь репозиторий на GitHub и откроешь pull request.",
        [
            ("Remote", [
                "GitHub хранит удалённую копию репозитория. git remote add origin URL связывает локальный Git с GitHub.",
                "git push отправляет коммиты. git pull забирает чужие/удалённые изменения.",
            ]),
            ("Pull request", [
                "PR — предложение влить ветку в main. Там смотрят diff, обсуждают и принимают изменения.",
                "README на главной репозитория — первое, что увидит работодатель или однокурсник.",
            ]),
        ],
        [
            ("remote", "Ссылка на удалённый репозиторий.", "origin"),
            ("push", "Отправка коммитов на remote.", "git push -u origin main"),
            ("pull request", "Запрос на слияние ветки через GitHub.", "Compare & pull request"),
        ],
        links=[("GitHub Docs", "https://docs.github.com/ru")],
    ),
    L(
        "tools", "tools-10", "learning", 10,
        "Как учиться программированию",
        "Выстроишь привычку: сначала попробовать самому, потом читать docs и искать ошибку.",
        [
            ("Порядок действий", [
                "1) Сформулируй, что должно произойти. 2) Воспроизведи ошибку. 3) Прочитай сообщение целиком. 4) Уменьши пример. 5) Ищи в MDN/доках, не только в чате.",
                "Копировать готовое решение без понимания — долг, который вернётся на собеседовании и в проекте.",
            ]),
            ("Ритм курса", [
                "10–15 часов в неделю. После каждого урока — практика. В конце модуля — мини-проект в портфолио.",
                "Застревание на 25–40 минут нормально. Дальше — вопрос в чат с тем, что уже пробовал.",
            ]),
        ],
        [
            ("MDN", "Справочник по веб-технологиям от Mozilla.", "developer.mozilla.org"),
            ("минимальный пример", "Самый короткий код, где ещё видна ошибка.", "один файл index.html"),
            ("портфолио", "Набор проектов, которые показывают навыки.", "GitHub + README"),
        ],
    ),
    L(
        "tools", "tools-project", "project", 11,
        "Итог: репозиторий-визитка на GitHub",
        "Опубликуешь репозиторий с README о себе и историей из осмысленных коммитов.",
        [
            ("Что сдать", [
                "Публичный репозиторий about-me (или похожее имя) с README: кто ты, зачем учишься, стек курса, ссылка на GitHub.",
                "Не меньше 5 коммитов с понятными сообщениями. Есть .gitignore. Есть хотя бы одна ветка и merged PR (можно в свой же репозиторий).",
            ]),
        ],
        [
            ("README", "Файл с описанием проекта на GitHub.", "# About me"),
            ("GitHub Pages", "Хостинг статики от GitHub (понадобится позже).", "username.github.io"),
            ("conventional commit", "Стиль сообщений: docs:, feat:, fix:.", "docs: describe learning goals"),
        ],
        practices=[
            ("README", "Опиши себя, цель курса и план на первый месяц."),
            ("История", "Сделай 5 коммитов: init, readme, goals, stack, ignore."),
            ("PR", "Создай ветку, измени README, открой и волей PR в main."),
        ],
        checklist=[
            "Репозиторий публичный и открывается по ссылке",
            "README понятен человеку с улицы",
            "Есть .gitignore",
            "Есть merge через pull request",
            "Умею объяснить путь запроса браузер → сервер",
        ],
    ),
]


# ---------------------------------------------------------------------------
# HTML gaps (a11y, SEO) + bump project
# ---------------------------------------------------------------------------

HTML_EXTRA = [
    L(
        "html", "html-11", "quality", 11,
        "Доступность: ARIA, фокус, клавиатура",
        "Сделаешь страницу удобнее для клавиатуры и скринридеров.",
        [
            ("Зачем a11y", [
                "Доступность — не «бонус», а часть качества. Кто-то пользуется только клавиатурой, кто-то — скринридером.",
                "Семантические теги уже помогают. ARIA дополняет, когда семантики не хватает: role, aria-label, aria-expanded.",
            ]),
            ("Практика", [
                "Проверь Tab-порядок: фокус не должен прыгать хаотично. Контраст текста и фона должен быть достаточным.",
                "Lighthouse → Accessibility покажет базовые проблемы. Цель модуля — не ниже 90.",
            ]),
        ],
        [
            ("a11y", "Accessibility: доступность интерфейса.", "навигация с клавиатуры"),
            ("ARIA", "Атрибуты для описания роли и состояния элемента.", "aria-label=\"Закрыть\""),
            ("фокус", "Какой элемент сейчас принимает ввод с клавиатуры.", ":focus-visible"),
        ],
        links=[("MDN: Accessibility", "https://developer.mozilla.org/ru/docs/Web/Accessibility")],
    ),
    L(
        "html", "html-12", "quality", 12,
        "SEO-база и валидность HTML",
        "Настроишь title, description, Open Graph и проверишь разметку валидатором.",
        [
            ("Мета для поиска и соцсетей", [
                "title и meta description влияют на сниппет в поиске. Иерархия h1–h3 помогает понять структуру.",
                "Open Graph (og:title, og:image) задаёт превью при шаринге. robots.txt и sitemap — подсказки для роботов (обзор).",
            ]),
            ("Чистота кода", [
                "W3C Validator ловит незакрытые теги и ошибочную вложенность. Соглашения об именах классов пригодятся в CSS.",
            ]),
        ],
        [
            ("SEO", "Оптимизация страницы для поиска.", "<title>Резюме — Анна</title>"),
            ("Open Graph", "Мета-теги для превью в соцсетях.", "og:image"),
            ("валидатор", "Проверка HTML на ошибки по спецификации.", "validator.w3.org"),
        ],
        links=[
            ("W3C Validator", "https://validator.w3.org/"),
            ("MDN: meta", "https://developer.mozilla.org/ru/docs/Web/HTML/Element/meta"),
        ],
    ),
]


# ---------------------------------------------------------------------------
# CSS gaps
# ---------------------------------------------------------------------------

CSS_EXTRA = [
    L(
        "css", "css-15", "css-modern", 15,
        "CSS-переменные, БЭМ и структура файлов",
        "Организуешь стили через custom properties и понятные имена классов.",
        [
            ("Переменные", [
                "--color-accent: #0f766e; потом color: var(--color-accent). Так проще тема и единый стиль.",
                "Переменные часто кладут в :root. Для тёмной темы переопределяют значения в [data-theme=\"dark\"].",
            ]),
            ("БЭМ и файлы", [
                "БЭМ: блок__элемент--модификатор, например card__title--large. Имена стабильнее случайных .blue-text.",
                "Дели стили: tokens.css, layout.css, components.css — или по компонентам.",
            ]),
        ],
        [
            ("custom property", "CSS-переменная.", "--gap: 1rem"),
            ("БЭМ", "Методология именования классов.", "menu__link--active"),
            (":root", "Корень документа для глобальных переменных.", ":root { --bg: #fff }"),
        ],
        code=":root {\n  --accent: #0f766e;\n  --radius: 8px;\n}\n.button {\n  background: var(--accent);\n  border-radius: var(--radius);\n}",
    ),
    L(
        "css", "css-16", "css-modern", 16,
        "Современный CSS, Tailwind и Figma",
        "Узнаешь container queries, :has(), nesting и как снять размеры из макета.",
        [
            ("Новые возможности", [
                "container queries реагируют на ширину контейнера, не только окна. :has() стилизует родителя по потомку. nesting пишет стили вложенно, как в SCSS.",
                "SCSS — препроцессор с переменными и вложенностью. Tailwind — утилитарные классы в HTML. На курсе достаточно понимать идею обоих.",
            ]),
            ("Figma", [
                "В инспекторе Figma смотри шрифт, отступы, цвета. Экспортируй SVG/PNG. Записывай токены: цвет, радиус, шаг сетки.",
            ]),
        ],
        [
            ("container query", "Медиазапрос от размера контейнера.", "@container (min-width: 400px)"),
            ("Tailwind", "Утилитарный CSS-фреймворк.", "class=\"flex gap-4\""),
            ("дизайн-токен", "Именованное значение дизайна: цвет, отступ.", "--space-4: 16px"),
        ],
        links=[("MDN: CSS", "https://developer.mozilla.org/ru/docs/Web/CSS")],
    ),
]


# ---------------------------------------------------------------------------
# JavaScript extras
# ---------------------------------------------------------------------------

JS_EXTRA = [
    L(
        "javascript", "js-21", "js-advanced", 21,
        "Замыкания и hoisting на практике",
        "Объяснишь замыкание и почему let/const безопаснее var при подъёме.",
        [
            ("Замыкание", [
                "Функция помнит переменные внешней области, даже когда внешняя уже завершилась. Так делают счётчики и приватные данные.",
                "Hoisting: объявления var и function «поднимаются». let/const попадают во временную мёртвую зону до строки объявления.",
            ]),
        ],
        [
            ("замыкание", "Функция + запомненная внешняя область видимости.", "counter()"),
            ("hoisting", "Поведение движка с объявлениями до их строки в коде.", "console.log(a); var a = 1"),
            ("TDZ", "Зона, где let/const ещё нельзя читать.", "ReferenceError"),
        ],
        code="function makeCounter() {\n  let n = 0;\n  return () => ++n;\n}\nconst c = makeCounter();\nconsole.log(c(), c());",
    ),
    L(
        "javascript", "js-22", "js-advanced", 22,
        "Классы и прототипы",
        "Опишешь объект через class и поймёшь связь с прототипами.",
        [
            ("class", [
                "class User { constructor(name) { this.name = name } greet() { return this.name } } — сахар над прототипами.",
                "extends даёт наследование. #field — приватное поле. На практике в фронте чаще объекты и функции, но классы встречаются в SDK и ООП-коде.",
            ]),
        ],
        [
            ("class", "Синтаксис объявления конструктора и методов.", "class User {}"),
            ("прототип", "Объект, из которого свойство ищут по цепочке.", "User.prototype"),
            ("extends", "Наследование классов.", "class Admin extends User"),
        ],
        code="class User {\n  constructor(name) { this.name = name; }\n  greet() { return `Hi, ${this.name}`; }\n}\nconsole.log(new User(\"Ada\").greet());",
    ),
    L(
        "javascript", "js-23", "js-advanced", 23,
        "Ошибки: try/catch и свои классы",
        "Научишься бросать и ловить ошибки без падения всего скрипта.",
        [
            ("try/catch", [
                "Оберни опасный код в try. В catch получи ошибку. finally выполнится всегда — удобно для очистки.",
                "throw new Error(\"…\") прерывает текущий поток с понятным текстом. Свои классы ошибок помогают различать типы сбоев.",
            ]),
        ],
        [
            ("throw", "Явно выбросить ошибку.", "throw new Error(\"bad input\")"),
            ("try/catch", "Перехват исключения.", "try { ... } catch (e) { ... }"),
            ("Error", "Стандартный класс ошибки JS.", "new TypeError(\"...\")"),
        ],
        code="function parseAge(raw) {\n  const n = Number(raw);\n  if (Number.isNaN(n)) throw new Error(\"Не число\");\n  return n;\n}\ntry {\n  console.log(parseAge(\"x\"));\n} catch (e) {\n  console.log(\"Ошибка:\", e.message);\n}",
    ),
    L(
        "javascript", "js-24", "js-advanced", 24,
        "Map, Set и обзор генераторов",
        "Выберешь Map/Set вместо массива, когда это уместно.",
        [
            ("Map и Set", [
                "Set хранит уникальные значения. Map — пары ключ→значение, ключом может быть не только строка.",
                "Генераторы (function*) и итераторы — обзор: позволяют выдавать значения лениво. На junior-уровне достаточно знать, что они существуют.",
            ]),
        ],
        [
            ("Set", "Коллекция уникальных значений.", "new Set([1,1,2])"),
            ("Map", "Коллекция пар ключ-значение.", "map.set(user, true)"),
            ("итератор", "Объект с методом next() для обхода.", "for (const x of set)"),
        ],
        code="const tags = new Set([\"js\", \"js\", \"css\"]);\nconsole.log([...tags]);\nconst votes = new Map();\nvotes.set(\"anna\", 1);\nconsole.log(votes.get(\"anna\"));",
    ),
    L(
        "javascript", "js-25", "js-dom", 25,
        "Делегирование событий и preventDefault",
        "Повесишь один обработчик на родителя вместо сотни на детей.",
        [
            ("Делегирование", [
                "Клики всплывают. Слушатель на ul ловит клик по любому li — удобно для списков, которые меняются.",
                "event.target — элемент клика. event.currentTarget — элемент со слушателем. preventDefault() отменяет действие по умолчанию (отправка формы, переход по ссылке).",
            ]),
        ],
        [
            ("всплытие", "Событие идёт от цели к предкам.", "click на button → div → body"),
            ("делегирование", "Один слушатель на родителе для многих детей.", "ul.addEventListener(\"click\", ...)"),
            ("preventDefault", "Отмена действия браузера по умолчанию.", "event.preventDefault()"),
        ],
    ),
    L(
        "javascript", "js-26", "js-dom", 26,
        "requestAnimationFrame и IntersectionObserver",
        "Запустишь плавную анимацию и отследишь появление блока на экране.",
        [
            ("rAF", [
                "requestAnimationFrame(fn) вызывает fn перед следующим кадром отрисовки — лучше, чем setInterval для анимаций.",
            ]),
            ("IntersectionObserver", [
                "Сообщает, когда элемент вошёл в зону видимости. Так делают ленивую подгрузку картинок и анимации при скролле.",
            ]),
        ],
        [
            ("requestAnimationFrame", "Планирование работы на следующий кадр отрисовки.", "requestAnimationFrame(draw)"),
            ("IntersectionObserver", "API наблюдения видимости элемента.", "new IntersectionObserver(cb)"),
            ("lazy load", "Загрузка ресурса, когда он почти на экране.", "loading=\"lazy\""),
        ],
    ),
    L(
        "javascript", "js-27", "js-tooling", 27,
        "npm, Vite, ESLint и Prettier",
        "Создашь проект через Vite и настроишь базовый линт/формат.",
        [
            ("Инструменты", [
                "npm ставит пакеты и запускает скрипты из package.json. Vite — быстрый dev-сервер и сборщик для фронта.",
                "ESLint ловит ошибки стиля и баги. Prettier форматирует код одинаково у всей команды.",
            ]),
        ],
        [
            ("Vite", "Инструмент разработки и сборки фронтенда.", "npm create vite@latest"),
            ("ESLint", "Линтер JavaScript/TypeScript.", "npx eslint ."),
            ("Prettier", "Форматтер кода.", "npx prettier --write ."),
        ],
        links=[("Vite", "https://vitejs.dev/"), ("npm docs", "https://docs.npmjs.com/")],
        practices=[
            ("Скелет Vite", "Создай vanilla JS проект через Vite и запусти npm run dev."),
            ("Скрипт", "Добавь в package.json скрипт \"lint\": \"eslint .\" (можно без жёстких правил)."),
            ("README", "Запиши команды установки и запуска."),
        ],
    ),
    L(
        "javascript", "js-28", "js-practice", 28,
        "Тренажёр: массивы и строки",
        "Решишь набор задач уровня easy на массивы и строки без подсказок.",
        [
            ("Формат", [
                "Реши 10 задач: переворот строки, уникальные значения, сумма/фильтр, поиск палиндрома, частота символов и т.п.",
                "Можно на Codewars/LeetCode Easy или в отдельном файле exercises.js с assert-проверками.",
            ]),
        ],
        [
            ("алгоритм", "Последовательность шагов решения задачи.", "два указателя"),
            ("сложность", "Оценка роста времени/памяти от размера входа.", "O(n)"),
            ("assert", "Проверка, что результат равен ожидаемому.", "assert.equal(fn(2), 4)"),
        ],
        practices=[
            ("10 задач", "Реши не меньше 10 задач easy на массивы/строки."),
            ("Без копипаста", "Каждое решение напиши сам; можно подсмотреть идею после 20 минут."),
            ("Репозиторий", "Сложи решения в папку drills/ с коротким README."),
        ],
        checklist=[
            "Решено ≥10 задач",
            "Понимаю свои решения вслух",
            "Есть файл или ссылка с решениями",
            "Умею объяснить map/filter/reduce на примере",
        ],
    ),
    L(
        "javascript", "js-project-weather", "project", 29,
        "Мини-проект: приложение с погодой",
        "Сделаешь поиск города, запрос к API и обработку загрузки/ошибок.",
        [
            ("Требования", [
                "Поле города, кнопка, состояния: загрузка / успех / ошибка. Данные — из публичного API погоды (например Open-Meteo).",
                "Покажи температуру и краткое описание. Обработай пустой ввод и сетевую ошибку.",
            ]),
        ],
        [
            ("API", "Программный интерфейс сервиса по HTTP.", "fetch(url)"),
            ("JSON", "Текстовый формат данных.", "{\"temp\": 12}"),
            ("состояние загрузки", "UI-статус ожидания ответа.", "«Загрузка…»"),
        ],
        practices=[
            ("Запрос", "Получи погоду по координатам или имени города."),
            ("UX состояний", "Покажи загрузку и дружелюбную ошибку."),
            ("README", "Опиши API и как запустить."),
        ],
        checklist=[
            "Работает поиск или выбор города",
            "Обработаны loading и error",
            "Нет падения на плохом ответе",
            "Репозиторий с README",
        ],
    ),
    L(
        "javascript", "js-project-game", "project", 30,
        "Мини-проект: простая игра",
        "Закрепишь логику и DOM на крестиках-ноликах или memory.",
        [
            ("Варианты", [
                "Крестики-нолики: поле 3×3, ход X/O, проверка победы, кнопка «заново».",
                "Memory: пары карточек, счётчик ходов, блокировка кликов на время анимации.",
            ]),
        ],
        [
            ("состояние игры", "Данные, из которых рисуется UI.", "массив клеток"),
            ("игровой цикл", "Ввод → обновление состояния → отрисовка.", "click → reduce → render"),
            ("победная комбинация", "Набор клеток для победы.", "[[0,1,2],[3,4,5],...]"),
        ],
        practices=[
            ("Логика", "Вынеси проверку победы в чистую функцию."),
            ("UI", "Собери интерфейс на DOM без фреймворков."),
            ("Полировка", "Добавь счёт или сообщение о ничьей."),
        ],
        checklist=[
            "Игра полностью проходима",
            "Есть рестарт",
            "Логика отделена от отрисовки хотя бы частично",
            "Код в репозитории",
        ],
    ),
]


def module_from_titles(
    part: str,
    rows: list[tuple[int, str, str, str, str, list[str], list[tuple[str, str, str]], str]],
) -> list[dict]:
    """order, id_suffix, module, title, goal, key_points, terms, code"""
    lessons = []
    for order, suffix, module, title, goal, points, terms, code in rows:
        lid = f"{part}-project" if suffix == "project" else f"{part}-{suffix}"
        mid = "project" if suffix == "project" else module
        paras = points
        lessons.append(
            L(
                part,
                lid,
                mid,
                order,
                title,
                goal,
                [("Главное", paras[:2]), ("На практике", paras[2:] or paras[:1])],
                terms,
                code=code,
            )
        )
    return lessons


TYPESCRIPT = module_from_titles(
    "typescript",
    [
        (1, "01", "ts-basics", "Зачем TypeScript", "Поймёшь выгоду типов и поднимешь проект с tsconfig.",
         ["TypeScript добавляет типы к JavaScript и ловит ошибки до запуска.",
          "tsc компилирует в JS. В Vite/tsx можно запускать TS почти прозрачно.",
          "Включи strict в tsconfig — это стандарт для курса и работы."],
         [("TypeScript", "JS с системой типов.", "let n: number = 1"),
          ("tsconfig", "Файл настроек компилятора TS.", "\"strict\": true"),
          ("компиляция", "Превращение TS в JS.", "tsc")],
         "const message: string = \"hello\";\nconsole.log(message);"),
        (2, "02", "ts-basics", "Базовые типы", "Типизируешь примитивы, массивы, кортежи и unknown.",
         ["string, number, boolean, null, undefined. Массивы: number[] или Array<number>.",
          "tuple — массив фиксированной формы. enum — набор именованных констант (используй умеренно).",
          "any отключает проверку — избегай. unknown безопаснее: сначала сузь тип."],
         [("unknown", "Безопасный «неизвестный» тип.", "let x: unknown"),
          ("tuple", "Кортеж фиксированной длины.", "[string, number]"),
          ("never", "Тип, который не возвращает значение.", "function fail(): never")],
         "const tags: string[] = [\"ts\", \"js\"];\nconst point: [number, number] = [10, 20];"),
        (3, "03", "ts-basics", "Типизация функций", "Опишешь параметры и возвращаемые значения функций.",
         ["function add(a: number, b: number): number { return a + b }",
          "Опциональные параметры: name?: string. rest: (...args: number[]).",
          "Стрелочные функции типизируются так же: const f = (x: number): number => x * 2"],
         [("сигнатура", "Типы входа и выхода функции.", "(n: number) => string"),
          ("опциональный параметр", "Параметр, который можно не передать.", "title?: string"),
          ("void", "Функция ничего осмысленного не возвращает.", "(): void")],
         "function greet(name: string, shout?: boolean): string {\n  return shout ? name.toUpperCase() : name;\n}"),
        (4, "04", "ts-types", "type и interface", "Опишешь объекты через type и interface и выберешь уместное.",
         ["interface User { id: number; name: string } и type User = { ... } часто взаимозаменяемы.",
          "interface удобно объединять (declaration merging). type мощнее для union/mapped.",
          "readonly и опциональные поля (?). "],
         [("interface", "Объявление формы объекта.", "interface User { id: number }"),
          ("type", "Алиас любого типа.", "type Id = string | number"),
          ("readonly", "Поле только для чтения.", "readonly id: number")],
         "interface User { readonly id: number; name: string; email?: string }\nconst u: User = { id: 1, name: \"Ada\" };"),
        (5, "05", "ts-types", "Union, intersection и type guards", "Сузишь union через проверки и защитники типов.",
         ["string | number — union. A & B — intersection.",
          "typeof, in, Array.isArray и предикативы помогают сузить тип внутри if.",
          "Литеральные типы: type Status = \"idle\" | \"loading\" | \"error\"."],
         [("union", "Один из нескольких типов.", "string | null"),
          ("type guard", "Проверка, сужающая тип.", "if (typeof x === \"string\")"),
          ("литеральный тип", "Конкретное значение как тип.", "\"admin\"")],
         "type Status = \"idle\" | \"loading\";\nfunction print(s: Status) {\n  if (s === \"loading\") console.log(\"…\");\n}"),
        (6, "06", "ts-types", "Generics", "Напишешь переиспользуемые функции с параметрами типов.",
         ["function first<T>(arr: T[]): T | undefined — T подставляется при вызове.",
          "Ограничения: <T extends { id: string }>. Так generics не «расплываются».",
          "Generics есть у интерфейсов, типов и классов."],
         [("generic", "Параметр типа.", "<T>"),
          ("extends в generic", "Ограничение параметра типа.", "T extends string"),
          ("Inference", "TS сам выводит T из аргументов.", "first([1,2]) → number")],
         "function first<T>(items: T[]): T | undefined {\n  return items[0];\n}\nconsole.log(first([\"a\", \"b\"]));"),
        (7, "07", "ts-types", "Утилитные типы", "Применишь Partial, Pick, Omit, Record, ReturnType.",
         ["Partial<T> делает поля опциональными. Pick/Omit выбирают набор полей.",
          "Record<K,V> — словарь. ReturnType<typeof fn> берёт тип возврата функции.",
          "Утилиты экономят копипасту при описании DTO и состояния форм."],
         [("Partial", "Все поля опциональны.", "Partial<User>"),
          ("Omit", "Тип без указанных полей.", "Omit<User, \"id\">"),
          ("Record", "Карта ключ→значение.", "Record<string, number>")],
         "type User = { id: number; name: string };\ntype UserUpdate = Partial<User>;"),
        (8, "08", "ts-app", "Классы в TypeScript", "Используешь модификаторы доступа и понимаешь абстрактные классы.",
         ["public/private/protected. private field через # тоже валиден в TS/JS.",
          "abstract class задаёт каркас без создания экземпляра напрямую.",
          "На фронте классы реже, на бэке и в SDK — чаще."],
         [("private", "Доступно только внутри класса.", "private password: string"),
          ("abstract", "Класс/метод без полной реализации.", "abstract render(): void"),
          ("implements", "Класс обещает соответствовать интерфейсу.", "class A implements B")],
         ""),
        (9, "09", "ts-app", "Типизация API и zod", "Опишешь ответ API и проверишь данные на границе через zod.",
         ["Тип ответа — interface. Но сеть врёт: поле может пропасть. На границе валидируй.",
          "zod: const User = z.object({ id: z.number(), name: z.string() }); User.parse(data)",
          "Так TypeScript-тип и рантайм-проверка живут рядом."],
         [("zod", "Библиотека схем и валидации.", "z.object({ ... })"),
          ("граница доверия", "Место, где внешние данные входят в приложение.", "fetch → parse"),
          ("DTO", "Объект передачи данных.", "UserDto")],
         "import { z } from \"zod\";\nconst User = z.object({ id: z.number(), name: z.string() });\ntype User = z.infer<typeof User>;"),
        (10, "10", "ts-app", "Сторонние библиотеки и @types", "Подключишь типы для JS-библиотек и разберёшь типовые ошибки.",
         ["Многие пакеты уже с типами. Если нет — @types/имя из DefinitelyTyped.",
          "Читай текст ошибки TS: он длинный, но в конце обычно суть.",
          "Строгий режим запрещает неявный any и пустые catch."],
         [("@types", "Пакеты деклараций для JS-библиотек.", "@types/node"),
          ("декларация", "Файл .d.ts с описанием типов.", "declare module \"x\""),
          ("strict", "Набор строгих проверок TS.", "\"strict\": true")],
         ""),
        (11, "11", "ts-app", "Строгий режим и типичные ошибки", "Исправишь частые ошибки TS без отключения strict.",
         ["Object is possibly undefined — проверь optional chaining и гарды.",
          "Type X is not assignable to Y — сравни структуры, не «добавляй as any».",
          "as Type — последний инструмент, не первый."],
         [("optional chaining", "Безопасный доступ к вложенным полям.", "user?.address?.city"),
          ("type assertion", "Утверждение типа через as.", "as HTMLInputElement"),
          ("nullish coalescing", "Подстановка для null/undefined.", "value ?? \"default\"")],
         "const el = document.querySelector(\"#app\");\nif (el) el.textContent = \"ok\";"),
        (12, "project", "project", "Итог TS: todo или погода на TypeScript", "Перепишешь проект из JS-модуля на TS в strict без any.",
         ["Возьми todo или weather из модуля JavaScript и перенеси на Vite + TypeScript.",
          "Опиши типы состояния, ответы API, обработчики событий.",
          "Сборка без ошибок tsc/vite. any — только с комментарием почему."],
         [("strict mode", "Жёсткие проверки TypeScript.", "strict: true"),
          ("миграция", "Перенос JS-кода на TS.", "renaming .js → .ts"),
          ("тип состояния", "Описание данных UI.", "type Todo = { id: string; done: boolean }")],
         ""),
    ],
)

REACT = module_from_titles(
    "react",
    [
        (1, "01", "react-basics", "Зачем React и создание проекта", "Создашь Vite React+TS приложение и поймёшь идею виртуального DOM.",
         ["React собирает UI из компонентов и эффективно обновляет DOM.",
          "npm create vite@latest → React + TypeScript. npm run dev запускает сервер.",
          "Компонент — функция, которая возвращает разметку (JSX)."],
         [("React", "Библиотека UI на компонентах.", "export function App() { ... }"),
          ("Vite", "Сборщик и dev-server.", "npm run dev"),
          ("Virtual DOM", "Промежуточное описание UI для эффективного обновления.", "reconcile")],
         ""),
        (2, "02", "react-basics", "JSX: условия и списки", "Отрендеришь список с key и условный UI.",
         ["В JSX выражения в {}. Условия — через && или тернарный оператор.",
          "Списки: array.map(item => <li key={item.id}>...). key стабилен и уникален.",
          "Не используй index как key, если список меняет порядок."],
         [("JSX", "Синтаксис разметки в JS/TS для React.", "<Button />"),
          ("key", "Стабильный идентификатор элемента списка.", "key={user.id}"),
          ("условный рендер", "Показ UI по условию.", "{ok && <Badge />}")],
         ""),
        (3, "03", "react-basics", "Компоненты и props", "Разобьёшь UI на компоненты и передашь данные через props.",
         ["Props — входные данные компонента. Деструктурируй сразу в параметрах.",
          "children — содержимое между тегами. Композиция лучше гигантских «простыней».",
          "Умные компоненты держат данные, простые — только рисуют."],
         [("props", "Входные параметры компонента.", "<UserCard name=\"Ada\" />"),
          ("children", "Вложенное содержимое компонента.", "<Card>текст</Card>"),
          ("композиция", "Сборка UI из маленьких частей.", "Header + Main + Footer")],
         ""),
        (4, "04", "react-hooks", "useState и подъём состояния", "Будешь хранить состояние и поднимать его к общему родителю.",
         ["const [value, setValue] = useState(0). Не мутируй объекты — создавай новые.",
          "Если двум детям нужны одни данные — state живёт в родителе (lifting state up).",
          "Обновление от предыдущего: setN(n => n + 1)."],
         [("useState", "Хук локального состояния.", "const [n, setN] = useState(0)"),
          ("иммутабельность", "Обновление через новые объекты/массивы.", "setItems([...items, x])"),
          ("lifting state up", "Перенос state к общему предку.", "в FormParent")],
         ""),
        (5, "05", "react-hooks", "Формы и события в React", "Сделаешь управляемые поля и простую валидацию.",
         ["Управляемый input: value + onChange. preventDefault на submit.",
          "Для сложных форм позже пригодится react-hook-form.",
          "Типизируй события: React.ChangeEvent<HTMLInputElement>."],
         [("controlled input", "Поле, чьё значение живёт в state React.", "value={name}"),
          ("onSubmit", "Обработчик отправки формы.", "onSubmit={handleSubmit}"),
          ("react-hook-form", "Библиотека удобных форм.", "useForm()")],
         ""),
        (6, "06", "react-hooks", "useEffect: эффекты и очистка", "Загрузишь данные и корректно отпишешься от эффектов.",
         ["useEffect(fn, [deps]) запускает побочный эффект после рендера.",
          "Пустой массив зависимостей — «на маунте». Возврат функции — cleanup.",
          "Не игнорируй предупреждения зависимостей вслепую — пойми их."],
         [("useEffect", "Хук побочных эффектов.", "useEffect(() => { ... }, [])"),
          ("cleanup", "Функция очистки эффекта.", "return () => sub.unsubscribe()"),
          ("зависимости", "Массив значений, от которых зависит эффект.", "[userId]")],
         ""),
        (7, "07", "react-hooks", "useRef, useReducer и мемоизация", "Выберешь подходящий хук для задачи и избежишь лишних оптимизаций.",
         ["useRef держит мутабельное значение без рендера. useReducer — сложное состояние.",
          "useMemo/useCallback — не по умолчанию; нужны при измеримых проблемах.",
          "С React Compiler в новых проектах ручная мемоизация ещё реже нужна."],
         [("useRef", "Ссылка на значение/DOM без ре-рендера.", "const ref = useRef(null)"),
          ("useReducer", "Состояние через reducer(action).", "dispatch({ type: \"add\" })"),
          ("useMemo", "Кэш вычисления между рендерами.", "useMemo(() => calc(x), [x])")],
         ""),
        (8, "08", "react-hooks", "Кастомные хуки", "Вынесешь повторяющуюся логику в useFetch/useDebounce/useLocalStorage.",
         ["Хук — функция с именем use*. Можно вызывать другие хуки внутри.",
          "useDebounce(value, 300) снижает частоту запросов поиска.",
          "Не дублируй fetch-логику в каждом компоненте — вынеси."],
         [("custom hook", "Своя функция-хук с логикой.", "function useToggle()"),
          ("debounce", "Отложенный вызов до паузы ввода.", "300ms"),
          ("useLocalStorage", "Синхронизация state с localStorage.", "useLocalStorage(\"theme\")")],
         ""),
        (9, "09", "react-data", "React Router", "Настроишь маршруты, параметры и защищённый маршрут.",
         ["Маршруты описывают URL → экран. Nested routes — общая оболочка.",
          "useParams читает :id. Navigate/redirect для гостя на /login.",
          "Layout-маршрут держит шапку и outlet для вложенных страниц."],
         [("React Router", "Библиотека маршрутизации.", "<Route path=\"/\" />"),
          ("useParams", "Хук параметров URL.", "const { id } = useParams()"),
          ("protected route", "Маршрут только для авторизованных.", "if (!user) redirect")],
         ""),
        (10, "10", "react-data", "React Query: серверное состояние", "Загрузишь данные с кэшем, мутациями и статусами ошибок.",
         ["React Query (TanStack Query) кэширует серверные данные и обновляет их.",
          "useQuery для чтения, useMutation для записи, invalidateQueries после успеха.",
          "UI строится на isLoading/isError/data — без самодельного хаоса."],
         [("useQuery", "Хук загрузки и кэша данных.", "useQuery({ queryKey, queryFn })"),
          ("мутация", "Операция изменения данных на сервере.", "useMutation"),
          ("invalidate", "Пометить кэш устаревшим.", "queryClient.invalidateQueries")],
         ""),
        (11, "11", "react-data", "Глобальное состояние: Context и Zustand", "Выберешь Context или Zustand и не положишь в них серверные данные зря.",
         ["Context удобен для темы/авторизованного пользователя.",
          "Zustand — простой глобальный store без шаблонного шума Redux.",
          "Серверные списки — в React Query, не копируй их в Redux «на всякий»."],
         [("Context", "Способ передать данные дереву без props drilling.", "createContext"),
          ("Zustand", "Лёгкая библиотека глобального store.", "create((set) => ...)"),
          ("props drilling", "Протаскивание props через много слоёв.", "App→Page→List→Item")],
         ""),
        (12, "12", "react-ui", "Стилизация: Tailwind и компоненты", "Стилизуешь UI через Tailwind или CSS Modules и соберёшь базовый UI-кит.",
         ["Tailwind ускоряет вёрстку утилитами. CSS Modules локализуют классы.",
          "shadcn/ui — копируемые доступные компоненты на Tailwind.",
          "Собери button, modal, tabs — пригодятся в каталоге."],
         [("Tailwind CSS", "Utility-first CSS фреймворк.", "className=\"flex gap-2\""),
          ("CSS Modules", "CSS с локальными именами классов.", "styles.button"),
          ("shadcn/ui", "Набор копируемых React-компонентов.", "npx shadcn@latest add button")],
         ""),
        (13, "13", "react-ui", "Производительность React", "Применишь lazy, code splitting и поймёшь, когда нужен memo.",
         ["React.lazy + Suspense грузят страницу по требованию.",
          "Профилировщик React DevTools показывает лишние рендеры.",
          "memo помогает точечно; сначала правильная структура state."],
         [("lazy loading", "Отложенная загрузка кода экрана.", "React.lazy(() => import(...))"),
          ("code splitting", "Разделение бандла на куски.", "dynamic import()"),
          ("memo", "Пропуск рендера при тех же props.", "memo(Component)")],
         ""),
        (14, "14", "react-ui", "React + TypeScript на практике", "Типизируешь props, хуки и обработчики без any.",
         ["type Props = { title: string; onSave: () => void }",
          "useState<User | null>(null). События — из пространства React.",
          "Для детей с children используй PropsWithChildren."],
         [("PropsWithChildren", "Props плюс children.", "PropsWithChildren<Props>"),
          ("FC", "Тип functional component (не обязателен).", "const A: FC = ..."),
          ("Discriminated union", "Union с полем-маркером для UI-состояний.", "status: \"ok\" | \"err\"")],
         ""),
        (15, "15", "react-ui", "Обзор Next.js", "Поймёшь SSR/SSG и файловую маршрутизацию на уровне знакомства.",
         ["Next.js — React-фреймворк с роутингом, SSR/SSG и API routes.",
          "На курсе основной учебный фронт — Vite SPA; Next — обзор для кругозора и карьеры.",
          "SSR отдаёт HTML с сервера; SSG — заранее. CSR — классика SPA."],
         [("SSR", "Рендер HTML на сервере при запросе.", "getServerSideProps / server components"),
          ("SSG", "Статическая генерация страниц заранее.", "generateStaticParams"),
          ("App Router", "Файловая маршрутизация Next.js.", "app/page.tsx")],
         ""),
        (16, "16", "react-basics", "Практика: UI-кит", "Соберёшь кнопку, модалку, табы, аккордеон и select.",
         ["Каждый компонент — отдельный файл с props и состоянием.",
          "Модалка: фокус-трап минимум на уровне «закрыть по Escape».",
          "Сложи story-примеры на отдельной странице /ui."],
         [("модальное окно", "Диалог поверх страницы.", "<Modal open onClose={...} />"),
          ("аккордеон", "Секции, которые раскрываются по клику.", "aria-expanded"),
          ("UI-кит", "Набор переиспользуемых компонентов.", "Button, Tabs, Modal")],
         ""),
        (17, "17", "react-data", "Практика: поиск с debounce", "Сделаешь поиск по публичному API с задержкой ввода.",
         ["Поле ввода → debounce 300ms → запрос → список результатов.",
          "Отменяй устаревшие ответы (ignore flag или AbortController).",
          "Покажи пустой результат отдельно от ошибки сети."],
         [("AbortController", "Отмена fetch-запроса.", "controller.abort()"),
          ("публичный API", "Открытый HTTP API без своего бэка.", "REST Countries"),
          ("пустой список", "Отдельное UI-состояние «ничего не найдено».", "EmptyState")],
         ""),
        (18, "project", "project", "Итог React: SPA-каталог товаров", "Сделаешь каталог с фильтрами, карточкой, корзиной и избранным.",
         ["Список карточек, поиск, фильтры, сортировка, страница товара.",
          "Корзина с суммой, избранное, адаптив, loading/error.",
          "Данные — mock API или публичный API. React + TypeScript обязательно."],
         [("SPA", "Одностраничное приложение без полной перезагрузки.", "React Router"),
          ("корзина", "Клиентское состояние выбранных товаров.", "items: CartItem[]"),
          ("mock API", "Фейковый сервер для разработки.", "json-server")],
         ""),
    ],
)

NODE = module_from_titles(
    "nodejs",
    [
        (1, "01", "node-basics", "Что такое Node.js", "Отличишь Node от браузера и выберешь ESM.",
         ["Node.js запускает JS на сервере. Нет DOM, зато есть fs, process, сеть.",
          "ESM: import/export. CommonJS: require/module.exports. На курсе предпочитаем ESM.",
          "Один поток + event loop обрабатывает много I/O-задач."],
         [("Node.js", "Среда JS на сервере.", "node app.js"),
          ("ESM", "Современные модули JS.", "import express from \"express\""),
          ("CommonJS", "Старый формат модулей Node.", "require(\"fs\")")],
         ""),
        (2, "02", "node-basics", "Встроенные модули и потоки", "Прочитаешь файл через fs/promises и поймёшь зачем streams.",
         ["fs/promises, path, os, events — базовый набор.",
          "Потоки (streams) читают большие файлы кусками — обзор.",
          "path.join безопаснее склейки строк руками."],
         [("fs", "Работа с файловой системой.", "await fs.readFile(path)"),
          ("path", "Утилиты путей ОС.", "path.join(__dirname, \"data\")"),
          ("stream", "Поток данных по частям.", "fs.createReadStream")],
         ""),
        (3, "03", "node-basics", "npm и package.json", "Опишешь зависимости, скрипты и semver.",
         ["dependencies vs devDependencies. lock-файл фиксирует версии.",
          "Скрипты: start, dev, test. npx запускает локальные бинарники.",
          "semver: major.minor.patch — ломающие / фичи / патчи."],
         [("package.json", "Манифест Node-проекта.", "\"scripts\": { \"dev\": \"...\" }"),
          ("semver", "Семантическое версионирование.", "1.4.2"),
          ("lock-файл", "Точные версии дерева зависимостей.", "package-lock.json")],
         ""),
        (4, "04", "node-basics", "Event loop в Node", "Объяснишь, почему тяжёлый CPU блокирует сервер.",
         ["Event loop берёт колбэки из очередей после I/O.",
          "Долгий синхронный цикл блокирует все запросы — выноси тяжёлое.",
          "setImmediate/process.nextTick — тонкости; достаточно модели «не блокируй»."],
         [("event loop", "Цикл обработки событий и колбэков.", "libuv"),
          ("блокировка", "Долгий синхронный код останавливает ответы.", "while(true)"),
          ("I/O", "Ввод-вывод: диск, сеть.", "чтение файла")],
         ""),
        (5, "05", "node-express", "HTTP-сервер и Express", "Поднимешь сервер на http и перенесёшь на Express.",
         ["http.createServer хватает для понимания. Express упрощает маршруты и middleware.",
          "app.listen(PORT). Ответ: res.status(200).json(...).",
          "Разделяй env PORT и дефолт 3000."],
         [("Express", "Минималистичный веб-фреймворк для Node.", "const app = express()"),
          ("middleware", "Функция в цепочке обработки запроса.", "app.use(express.json())"),
          ("listen", "Запуск HTTP-слушателя.", "app.listen(3000)")],
         "import express from \"express\";\nconst app = express();\napp.get(\"/health\", (_req, res) => res.json({ ok: true }));\napp.listen(3000);"),
        (6, "06", "node-express", "Маршрутизация и структура", "Разобьёшь роуты по файлам и прочитаешь params/query/body.",
         ["req.params, req.query, req.body (нужен json middleware).",
          "Router() группирует пути. Папки routes/controllers — читаемый скелет.",
          "Не клади всю логику в один index.js на 1000 строк."],
         [("params", "Параметры пути.", "/users/:id"),
          ("query", "Параметры строки запроса.", "?page=2"),
          ("Router", "Мини-приложение маршрутов Express.", "express.Router()")],
         ""),
        (7, "07", "node-express", "Middleware и логирование", "Напишешь свой middleware и подключешь логер.",
         ["Порядок middleware важен. next() передаёт управление дальше.",
          "morgan/pino пишут логи запросов. Ошибки — в error middleware с 4 аргументами.",
          "Не логируй пароли и токены."],
         [("next", "Передача управления следующему middleware.", "next()"),
          ("morgan", "HTTP-логер для Express.", "app.use(morgan(\"dev\"))"),
          ("pino", "Быстрый JSON-логер.", "logger.info({ msg })")],
         ""),
        (8, "08", "node-express", "REST и OpenAPI", "Спроектируешь ресурсы REST и набросок Swagger.",
         ["Ресурс = существительное во мн. числе: /posts, /posts/:id.",
          "Методы: GET список/один, POST создать, PATCH обновить, DELETE удалить.",
          "OpenAPI/Swagger документирует контракт для фронта и тестов."],
         [("REST", "Стиль API вокруг ресурсов и HTTP-методов.", "GET /posts"),
          ("OpenAPI", "Спецификация описания HTTP API.", "openapi.yaml"),
          ("идемпотентность", "Повтор запроса не меняет эффект неожиданно.", "PUT/DELETE")],
         ""),
        (9, "09", "node-express", "Валидация через zod", "Отклонишь невалидный body до бизнес-логики.",
         ["Схема zod на входе. При ошибке — 400 с понятным сообщением.",
          "Не доверяй клиенту: типы TS на сервере не проверяют тело запроса в рантайме.",
          "Вынеси validate(schema) middleware."],
         [("валидация", "Проверка входных данных.", "schema.parse(req.body)"),
          ("DTO", "Форма данных на входе/выходе API.", "CreatePostDto"),
          ("400 Bad Request", "Клиент прислал некорректные данные.", "res.status(400)")],
         ""),
        (10, "10", "node-arch", "Ошибки и конфигурация", "Сделаешь центральный error handler и конфиг через env.",
         ["Свои классы AppError(status, message). В конце цепочки — handler.",
          "dotenv для .env. Не коммить секреты. Различаю development/production.",
          "Конфиг читай в одном модуле env.ts."],
         [("dotenv", "Загрузка переменных из .env.", "process.env.DATABASE_URL"),
          ("централизованные ошибки", "Один handler вместо try/catch в каждом роуте.", "errorMiddleware"),
          ("конфиг", "Настройки приложения из окружения.", "PORT, NODE_ENV")],
         ""),
        (11, "11", "node-arch", "Слои: routes, services, repositories", "Разделишь код на слои без толстых контроллеров.",
         ["Route объявляет URL. Controller тонкий. Service — бизнес-правила. Repository — данные.",
          "Так проще тестировать и менять БД позже.",
          "Не тащи SQL/файл в route handler напрямую в учебном «большом» проекте."],
         [("service", "Слой бизнес-логики.", "PostService.create"),
          ("repository", "Слой доступа к данным.", "PostRepository.findMany"),
          ("тонкий контроллер", "Контроллер без бизнес-веток.", "validate → service → response")],
         ""),
        (12, "12", "node-arch", "Файлы и email (обзор)", "Подключишь загрузку файлов и поймёшь схему отправки писем.",
         ["multer принимает multipart. Ограничивай размер и MIME.",
          "Локально — папка uploads/. В проде — S3-совместимое хранилище.",
          "Nodemailer шлёт письма; шаблоны — HTML с плейсхолдерами."],
         [("multer", "Middleware загрузки файлов для Express.", "upload.single(\"avatar\")"),
          ("Nodemailer", "Библиотека отправки email.", "transporter.sendMail"),
          ("MIME-тип", "Тип содержимого файла.", "image/png")],
         ""),
        (13, "13", "node-arch", "TypeScript на бэкенде", "Типизируешь req/res и вынесешь типы DTO.",
         ["ts-node-dev/tsx для dev. Типы для Request после middleware усложняются — используй generics.",
          "Единый ApiError и типовой ответ { data } | { error }.",
          "Валидация zod + z.infer даёт один источник правды."],
         [("tsx", "Запуск TypeScript без отдельной сборки в dev.", "tsx watch src/index.ts"),
          ("RequestHandler", "Тип обработчика Express.", "RequestHandler"),
          ("infer", "Вывод TS-типа из zod-схемы.", "z.infer<typeof schema>")],
         ""),
        (14, "14", "node-express", "Практика: эндпоинты в Postman", "Проверишь 5–6 эндпоинтов коллекции запросов.",
         ["Собери коллекцию: health, create, list, get, update, delete.",
          "Проверь коды: 201 на создание, 404 на отсутствующий id, 400 на плохой body.",
          "Сохрани example responses в README."],
         [("Postman", "Клиент для ручного тестирования API.", "Send"),
          ("Insomnia", "Альтернатива Postman.", "HTTP collection"),
          ("коллекция", "Набор сохранённых HTTP-запросов.", "Blog API.json")],
         ""),
        (15, "15", "node-arch", "Практика: логи и ошибки", "Добавишь pino/morgan и единый error handler в учебный сервер.",
         ["Любая ошибка сервиса должна стать корректным JSON-ответом.",
          "Не отдавай stack trace клиенту в production.",
          "Лог ошибки пиши с request id, если есть."],
         [("stack trace", "Цепочка вызовов в ошибке.", "at Service.create (...") ,
          ("request id", "Идентификатор запроса для логов.", "X-Request-Id"),
          ("production", "Боевое окружение без отладочных утечек.", "NODE_ENV=production")],
         ""),
        (16, "project", "project", "Итог Node: REST API блога", "Сделаешь CRUD постов/комментариев/категорий с валидацией и Swagger.",
         ["Пока данные в памяти или JSON-файле. Пагинация и поиск обязательны.",
          "Слои routes/services. README с запуском и таблицей эндпоинтов.",
          "Документация OpenAPI хотя бы на основные пути."],
         [("CRUD", "Create Read Update Delete.", "POST/GET/PATCH/DELETE"),
          ("пагинация", "Выдача данных страницами.", "?page=1&limit=20"),
          ("Swagger", "UI/спека для OpenAPI.", "/docs")],
         ""),
    ],
)

DATABASE = module_from_titles(
    "database",
    [
        (1, "01", "db-sql", "Зачем базы данных и ACID", "Выберешь реляционную БД для учебного продукта и объяснишь ACID.",
         ["БД хранит данные надёжно и даёт запросы. Реляционные — таблицы и связи. Документные — JSON-документы.",
          "ACID: атомарность, согласованность, изоляция, прочность транзакций.",
          "PostgreSQL — выбор курса: мощный SQL и бесплатность."],
         [("ACID", "Свойства надёжных транзакций.", "Atomicity Consistency Isolation Durability"),
          ("реляционная БД", "Данные в таблицах со связями.", "PostgreSQL"),
          ("NoSQL", "Неструктурированные/гибкие модели данных.", "MongoDB, Redis")],
         ""),
        (2, "02", "db-sql", "PostgreSQL в Docker и клиенты", "Поднимешь Postgres в Docker и подключишься из DBeaver/psql.",
         ["docker run postgres с паролем и портом 5432. Данные — в volume.",
          "psql — CLI. DBeaver/pgAdmin — GUI.",
          "Строка подключения: postgresql://user:pass@localhost:5432/db"],
         [("Docker volume", "Постоянное хранилище контейнера.", "-v pgdata:/var/lib/postgresql/data"),
          ("psql", "Терминальный клиент PostgreSQL.", "psql -U postgres"),
          ("connection string", "URL подключения к БД.", "DATABASE_URL")],
         ""),
        (3, "03", "db-sql", "Таблицы и ограничения", "Создашь таблицу с PK, UNIQUE, NOT NULL, CHECK.",
         ["CREATE TABLE. Типы: text, int, boolean, timestamptz, uuid.",
          "PRIMARY KEY уникально идентифицирует строку. FOREIGN KEY связывает таблицы.",
          "CHECK и NOT NULL ловят мусор на уровне БД."],
         [("PRIMARY KEY", "Главный ключ строки.", "id uuid PRIMARY KEY"),
          ("UNIQUE", "Значение не повторяется.", "UNIQUE(email)"),
          ("CHECK", "Условие на значение столбца.", "price > 0")],
         ""),
        (4, "04", "db-sql", "CRUD в SQL", "Напишешь SELECT/INSERT/UPDATE/DELETE с WHERE и LIMIT.",
         ["SELECT столбцы FROM таблица WHERE … ORDER BY … LIMIT.",
          "INSERT добавляет. UPDATE меняет. DELETE удаляет — всегда с WHERE.",
          "Тренируйся на SQLZoo или локальной БД."],
         [("SELECT", "Чтение строк.", "SELECT * FROM posts"),
          ("INSERT", "Вставка строк.", "INSERT INTO posts(title) VALUES (...)"),
          ("WHERE", "Фильтр строк.", "WHERE published = true")],
         ""),
        (5, "05", "db-sql", "Агрегация и GROUP BY", "Посчитаешь COUNT/SUM/AVG с группировкой.",
         ["Агрегаты сжимают набор строк в числа.",
          "GROUP BY группирует. HAVING фильтрует группы (после агрегации).",
          "Частая ошибка — фильтровать агрегаты в WHERE."],
         [("COUNT", "Количество строк.", "COUNT(*)"),
          ("GROUP BY", "Группировка для агрегатов.", "GROUP BY author_id"),
          ("HAVING", "Фильтр групп.", "HAVING COUNT(*) > 5")],
         ""),
        (6, "06", "db-design", "Связи и внешние ключи", "Спроектируешь 1:1, 1:N, M:N на примере блога.",
         ["1:N — у автора много постов (author_id в posts).",
          "M:N — посты и теги через таблицу post_tags.",
          "Внешний ключ защищает от «осиротевших» ссылок."],
         [("внешний ключ", "Ссылка на PK другой таблицы.", "REFERENCES users(id)"),
          ("1:N", "Один ко многим.", "user → posts"),
          ("M:N", "Многие ко многим через join-таблицу.", "posts ↔ tags")],
         ""),
        (7, "07", "db-design", "JOIN и CTE", "Соберёшь данные из нескольких таблиц одним запросом.",
         ["INNER JOIN — только совпадения. LEFT JOIN — все слева + совпадения справа.",
          "Подзапросы и CTE (WITH ...) читаемее вложенности.",
          "Не тащи SELECT * в проде без нужды."],
         [("INNER JOIN", "Пересечение строк по условию.", "JOIN authors ON ..."),
          ("LEFT JOIN", "Все строки левой таблицы.", "LEFT JOIN comments"),
          ("CTE", "Временное именованное подвыражение.", "WITH active AS (...)")],
         ""),
        (8, "08", "db-design", "Нормализация и ER", "Нарисуешь ER-диаграмму магазина и нормализуешь схему.",
         ["Нормализация убирает дубли и аномалии обновления.",
          "ER: сущности и связи. Инструмент — Excalidraw/dbdiagram.io.",
          "Практика: users, products, orders, order_items."],
         [("ER-диаграмма", "Схема сущностей и связей.", "users 1—N orders"),
          ("нормализация", "Разделение данных по таблицам без избыточности.", "3NF"),
          ("аномалия", "Проблема из-за плохой схемы.", "цена товара скопирована в 10 местах")],
         ""),
        (9, "09", "db-ops", "Индексы и EXPLAIN", "Добавишь индекс и прочитаешь базовый план запроса.",
         ["Индекс ускоряет поиск ценой записи и места.",
          "Индексируй внешние ключи и частые фильтры. Не индексируй всё подряд.",
          "EXPLAIN ANALYZE показывает, как Postgres выполняет запрос."],
         [("индекс", "Структура для ускорения поиска.", "CREATE INDEX ..."),
          ("EXPLAIN", "План выполнения запроса.", "EXPLAIN ANALYZE SELECT ..."),
          ("Seq Scan", "Полный перебор таблицы.", "часто без индекса")],
         ""),
        (10, "10", "db-ops", "Транзакции", "Обернёшь связанные изменения в BEGIN/COMMIT.",
         ["Транзакция — всё или ничего. Ошибка → ROLLBACK.",
          "Уровни изоляции и блокировки — обзор: начни с READ COMMITTED по умолчанию.",
          "Перевод денег / создание заказа с позициями — классика транзакций."],
         [("транзакция", "Набор операций как единое целое.", "BEGIN; ... COMMIT;"),
          ("ROLLBACK", "Отмена транзакции.", "ROLLBACK;"),
          ("изоляция", "Как транзакции видят данные друг друга.", "READ COMMITTED")],
         ""),
        (11, "11", "db-ops", "Миграции", "Введёшь историю схемы через миграции Prisma/SQL.",
         ["Миграция — версия схемы в git. На чистой машине поднимается одной командой.",
          "Не «чини прод руками» без записи в миграциях.",
          "Seed наполняет справочники и демо-данные."],
         [("миграция", "Версионированное изменение схемы БД.", "prisma migrate dev"),
          ("seed", "Скрипт начальных данных.", "prisma db seed"),
          ("схема", "Описание таблиц и связей.", "schema.prisma")],
         ""),
        (12, "12", "db-ops", "Prisma ORM", "Опишешь модели Prisma и выполнишь CRUD без сырого SQL.",
         ["schema.prisma → prisma migrate → Prisma Client.",
          "include/select управляют связями. Осторожно с N+1.",
          "Drizzle — альтернатива ближе к SQL; на курсе фокус Prisma."],
         [("ORM", "Слой объект↔таблицы.", "prisma.user.findMany()"),
          ("Prisma Client", "Типизированный клиент запросов.", "new PrismaClient()"),
          ("N+1", "Антипаттерн множества запросов в цикле.", "find + find in loop")],
         ""),
        (13, "13", "db-ops", "Пагинация, поиск и NoSQL-обзор", "Сделаешь offset/cursor пагинацию и кратко сравнишь Redis/Mongo.",
         ["OFFSET удобен, но на больших данных медленнее cursor.",
          "Полнотекстовый поиск в Postgres — через tsvector (обзор).",
          "Redis — кэш/сессии. Mongo — документы. Не заменяй Postgres ими «просто так»."],
         [("cursor pagination", "Страницы от курсора/id.", "WHERE id > $cursor"),
          ("Redis", "In-memory store для кэша и очередей.", "SET session:1 ..."),
          ("MongoDB", "Документная БД.", "{ title: \"Post\" }")],
         ""),
        (14, "14", "db-ops", "Бэкапы и безопасная работа с данными", "Настроишь дамп и не положишь прод-данные в git.",
         ["pg_dump / рестор — базовый навык. Проверяй рестор на копии.",
          "Персональные данные не в логи и не в скриншоты без нужды.",
          "Права пользователя БД — минимально необходимые."],
         [("pg_dump", "Утилита резервной копии Postgres.", "pg_dump db > dump.sql"),
          ("PII", "Персональные данные.", "email, телефон"),
          ("least privilege", "Минимум прав у роли БД.", "GRANT SELECT ...")],
         ""),
        (15, "project", "project", "Итог БД: блог API на PostgreSQL + Prisma", "Подключишь Postgres к API блога: users, posts, comments, tags.",
         ["Миграции воспроизводимы с нуля. Есть seed.",
          "Фильтры и пагинация на уровне БД. Без N+1 на списке постов.",
          "ER и README со схемой обязательны."],
         [("Prisma migrate", "Команда применения миграций.", "npx prisma migrate dev"),
          ("seed", "Наполнение демо-данными.", "npx prisma db seed"),
          ("include", "Подгрузка связей в Prisma.", "include: { author: true }")],
         ""),
    ],
)



from course_rest_modules import build_rest


def main() -> None:
    lessons: list[dict] = []
    lessons.extend(TOOLS)
    lessons.extend(HTML_EXTRA)
    lessons.extend(CSS_EXTRA)
    lessons.extend(JS_EXTRA)
    lessons.extend(TYPESCRIPT)
    lessons.extend(REACT)
    lessons.extend(NODE)
    lessons.extend(DATABASE)
    lessons.extend(build_rest(L))

    for lesson in lessons:
        write_lesson(lesson)

    bump_order("html", "html-project", 13)
    bump_order("css", "css-project", 17)
    # Keep classic todo project as order 31 after new JS lessons/projects
    bump_order("javascript", "js-project", 31)

    print(f"done: {len(lessons)} lessons written/updated")


if __name__ == "__main__":
    main()
