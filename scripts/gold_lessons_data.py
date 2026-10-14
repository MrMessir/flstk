# GOLD STANDARD rewrites for fullstack, testing, devops, capstone, career


def p(text: str) -> dict:
    return {"type": "paragraph", "content": text}


def h(text: str) -> dict:
    return {"type": "heading", "content": text}


def lst(items: list[str], ordered: bool = False) -> dict:
    block: dict = {"type": "list", "items": items}
    if ordered:
        block["ordered"] = True
    return block


UPDATES: dict = {}

# --- FULLSTACK ---

UPDATES["fullstack-01"] = {
    "theory": [
        p(
            "Full-stack — это один продукт, где React рисует экран, а Node отдаёт данные и правила. "
            "Когда фронт и бэк живут в одном git-репозитории, ты меняешь тип ответа API и сразу видишь ошибку в клиенте."
        ),
        h("Папки apps и packages"),
        p(
            "Удобная схема: apps/web — Vite или Next, apps/api — Express, packages/shared — типы и zod-схемы. "
            "Workspaces в корневом package.json связывают пакеты: npm install подтягивает shared в оба приложения без publish в npm."
        ),
        h("Общий контракт типов"),
        p(
            "В shared лежит, например, PostDto: id, title, body. Сервер возвращает этот объект, клиент импортирует тот же тип. "
            "OpenAPI или zod можно держать рядом, но главное — одна правда о полях, а не два расходящихся interface."
        ),
        lst(
            [
                "Корень: package.json с workspaces: [\"apps/*\", \"packages/*\"]",
                "packages/shared экспортирует типы через index.ts",
                "Клиент и API импортируют из @repo/shared или относительного пути",
            ]
        ),
    ],
    "codeExample": (
        "// packages/shared/src/post.ts\n"
        "export type PostDto = { id: string; title: string; body: string };\n\n"
        "// apps/api — res.json(post satisfies PostDto)\n"
        "// apps/web — const data: PostDto = await api('/posts/1')"
    ),
    "practice": [
        {
            "title": "Набросай дерево монорепо",
            "description": "На листе или в README нарисуй apps/web, apps/api, packages/shared и стрелки, кто кого импортирует. "
            "Подпиши, какой файл в shared будет первым общим типом для твоего проекта.",
        },
        {
            "title": "Подключи workspaces",
            "description": "В учебном репо добавь workspaces и пакет shared с одним типом User. "
            "Импортируй User в клиенте и в одном route API — убедись, что tsc проходит.",
        },
        {
            "title": "Сломай тип намеренно",
            "description": "Переименуй поле в PostDto только на сервере, запусти сборку клиента. "
            "Запиши текст ошибки TypeScript и верни имя поля обратно.",
        },
    ],
    "checklist": [
        "Объясняю, зачем держать web и api в одном репо",
        "Настраиваю workspaces без дублирования node_modules в shared",
        "Выношу DTO в packages/shared и импортирую с обеих сторон",
        "Вижу рассинхрон контракта по ошибкам компиляции, а не в проде",
    ],
    "links": [
        {
            "title": "npm workspaces",
            "url": "https://docs.npmjs.com/cli/v10/using-npm/workspaces",
        }
    ],
    "glossary": [
        {"term": "монорепозиторий", "meaning": "Несколько приложений и библиотек в одном git-репо.", "example": "apps/web + apps/api"},
        {"term": "workspace", "meaning": "Связь локальных пакетов через корневой package.json.", "example": "packages/shared"},
        {"term": "DTO", "meaning": "Форма данных, которую API отдаёт клиенту.", "example": "PostDto"},
        {"term": "контракт API", "meaning": "Согласованные поля запроса и ответа.", "example": "общий PostDto"},
    ],
}

UPDATES["fullstack-02"] = {
    "theory": [
        p(
            "Сырой fetch в каждом компоненте быстро превращается в копипасту: базовый URL, JSON, обработка ошибок. "
            "Одна функция api() централизует это и даёт типизированный ответ."
        ),
        h("Базовый URL из env"),
        p(
            "В Vite переменные для браузера начинаются с VITE_: VITE_API_URL=http://localhost:3000. "
            "В Next для клиента — NEXT_PUBLIC_API_URL. Значение подставляется при сборке, в git кладёшь только .env.example без секретов."
        ),
        h("Интерцептор и 401"),
        p(
            "Перед каждым запросом можно дописать Authorization: Bearer <access>. "
            "Если сервер вернул 401, один раз пробуешь refresh, обновляешь токен в памяти или cookie и повторяешь исходный запрос — пользователь не видит внезапный logout."
        ),
    ],
    "codeExample": (
        "const base = import.meta.env.VITE_API_URL;\n\n"
        "export async function api<T>(path: string, init?: RequestInit): Promise<T> {\n"
        "  const res = await fetch(`${base}${path}`, {\n"
        "    ...init,\n"
        "    headers: {\n"
        '      "Content-Type": "application/json",\n'
        "      ...(init?.headers ?? {}),\n"
        "    },\n"
        "    credentials: \"include\",\n"
        "  });\n"
        "  if (!res.ok) throw new Error(await res.text());\n"
        "  return res.json() as Promise<T>;\n"
        "}"
    ),
    "practice": [
        {
            "title": "Вынеси api() в lib/api.ts",
            "description": "Создай модуль с функцией api<T>. Замени один прямой fetch в компоненте на api<PostDto>('/posts'). "
            "Проверь в Network, что URL собирается из VITE_API_URL.",
        },
        {
            "title": "Добавь .env.example",
            "description": "Запиши VITE_API_URL=http://localhost:3000 в .env.example. "
            "Убедись, что .env в .gitignore, а локальный .env у тебя на машине.",
        },
        {
            "title": "Симулируй ошибку сервера",
            "description": "Временно укажи неверный порт в .env, вызови api('/health'). "
            "Покажи пользователю понятное сообщение из catch, а не пустой экран.",
        },
    ],
    "checklist": [
        "Читаю базовый URL API из env, а не хардкожу localhost",
        "Оборачиваю fetch в одну типизированную функцию",
        "Пробрасываю credentials или Bearer там, где нужна сессия",
        "Обрабатываю !res.ok до парсинга JSON",
    ],
    "links": [
        {
            "title": "MDN: Fetch API",
            "url": "https://developer.mozilla.org/ru/docs/Web/API/Fetch_API",
        }
    ],
    "glossary": [
        {"term": "интерцептор", "meaning": "Код до/после запроса: заголовки, refresh.", "example": "добавить Authorization"},
        {"term": "VITE_API_URL", "meaning": "Публичная база API для клиента Vite.", "example": "http://localhost:3000"},
        {"term": "credentials", "meaning": "Отправка cookie с cross-origin запросом.", "example": "credentials: 'include'"},
    ],
}

UPDATES["fullstack-03"] = {
    "theory": [
        p(
            "Login на клиенте — это форма, запрос на /auth/login и сохранение признака «я вошёл». "
            "Надёжнее не держать access token в localStorage: httpOnly cookie или короткий access + refresh по httpOnly."
        ),
        h("Protected routes"),
        p(
            "Маршрут /dashboard не должен монтироваться для гостя. "
            "Обёртка ProtectedRoute читает состояние auth (контекст или loader), показывает спиннер, редиректит на /login с returnUrl."
        ),
        h("Logout и refresh"),
        p(
            "Logout вызывает POST /auth/logout, чистит клиентское состояние и уводит на главную. "
            "Refresh делаешь редко: при 401 или по таймеру чуть раньше expiry access — иначе пользователь вылетит посреди действия."
        ),
    ],
    "codeExample": (
        "export function ProtectedRoute({ children }: { children: React.ReactNode }) {\n"
        "  const { user, loading } = useAuth();\n"
        "  if (loading) return <p>Загрузка…</p>;\n"
        "  if (!user) return <Navigate to=\"/login\" replace />;\n"
        "  return <>{children}</>;\n"
        "}"
    ),
    "practice": [
        {
            "title": "Сделай страницу login",
            "description": "Форма email/password отправляет POST на API. При успехе сохрани user в контексте и перейди на /app. "
            "При ошибке покажи текст с сервера, не alert('ошибка').",
        },
        {
            "title": "Закрой маршрут",
            "description": "Оберни личный кабинет в ProtectedRoute. Открой /app в инкогнito — должен быть редирект на login.",
        },
        {
            "title": "Кнопка выхода",
            "description": "Logout сбрасывает user в null и зовёт API logout. Обнови страницу — ты всё ещё гость.",
        },
    ],
    "checklist": [
        "Разделяю публичные и приватные маршруты на уровне роутера",
        "Не считаю «залогинен» только потому, что token лежит в localStorage",
        "Обрабатываю loading, пока проверяю сессию при первом заходе",
        "Делаю logout, который чистит и клиент, и cookie на сервере",
    ],
    "links": [
        {
            "title": "OWASP: Session Management",
            "url": "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html",
        }
    ],
    "glossary": [
        {"term": "access token", "meaning": "Короткий ключ для API-запросов.", "example": "JWT 15 минут"},
        {"term": "refresh token", "meaning": "Долгий ключ только для обновления access.", "example": "POST /auth/refresh"},
        {"term": "ProtectedRoute", "meaning": "Компонент, пускающий только авторизованных.", "example": "<ProtectedRoute>…</ProtectedRoute>"},
        {"term": "httpOnly cookie", "meaning": "Cookie, недоступная из JavaScript.", "example": "Set-Cookie httpOnly"},
    ],
}

UPDATES["fullstack-04"] = {
    "theory": [
        p(
            "Пользователь не видит «pending» в React — он видит пустой экран или старые данные. "
            "Явные состояния loading, empty и error снижают поддержку и выглядят профессионально."
        ),
        h("Loading и скелетоны"),
        p(
            "Пока fetch не завершился, показывай скелетон той же формы, что и контент: серые полоски вместо карточек. "
            "Так layout не прыгает, когда данные приехали."
        ),
        h("Empty и error"),
        p(
            "Пустой список — не ошибка: текст «Пока нет постов» и кнопка «Создать первый». "
            "Ошибка сети — отдельный блок с кнопкой «Повторить» и коротким сообщением без stack trace."
        ),
        h("Toast для действий"),
        p(
            "Успешное сохранение или фоновая ошибка удобно показывать toast в углу на 3–5 секунд. "
            "Не дублируй toast и inline-error для одной и той же проблемы формы."
        ),
    ],
    "codeExample": (
        "if (status === 'loading') return <PostListSkeleton />;\n"
        "if (status === 'error') return <ErrorPanel onRetry={refetch} message={error} />;\n"
        "if (posts.length === 0) return <EmptyState onCreate={openCreate} />;\n"
        "return <PostList items={posts} />;"
    ),
    "practice": [
        {
            "title": "Три ветки одного списка",
            "description": "Для списка с API добавь явные UI для loading, error и empty. "
            "Искусственно задержи ответ на 2 с (dev middleware) и проверь скелетон.",
        },
        {
            "title": "Toast на сохранение",
            "description": "После успешного POST покажи toast «Сохранено». При 500 покажи toast с ошибкой и оставь форму открытой.",
        },
        {
            "title": "Кнопка «Повторить»",
            "description": "В error-состоянии refetch должен снова ставить loading и при успехе показывать данные без перезагрузки страницы.",
        },
    ],
    "checklist": [
        "Показываю скелетон, а не пустой div, пока жду данные",
        "Отличаю пустой результат от ошибки сервера",
        "Даю пользователю retry при сбое сети",
        "Использую toast для фоновых итогов, не для каждой валидации поля",
    ],
    "links": [
        {
            "title": "React: conditional rendering",
            "url": "https://react.dev/learn/conditional-rendering",
        }
    ],
    "glossary": [
        {"term": "скелетон", "meaning": "Заглушка формы контента на время загрузки.", "example": "серые полоски карточки"},
        {"term": "empty state", "meaning": "Экран, когда данных ноль, но всё ок.", "example": "«Нет задач»"},
        {"term": "toast", "meaning": "Краткое всплывающее уведомление.", "example": "«Сохранено»"},
    ],
}

UPDATES["fullstack-05"] = {
    "theory": [
        p(
            "Если схема формы на клиенте и проверка на сервере расходятся, пользователь получит 400 после submit — обидно. "
            "Zod описывает форму один раз, а parse безопасно гоняешь и в браузере, и в Express."
        ),
        h("Одна схема в shared"),
        p(
            "createPostSchema лежит в packages/shared. React Hook Form + zodResolver показывает ошибки до отправки. "
            "На API middleware вызывает createPostSchema.parse(req.body) и отдаёт 400 с понятным списком полей."
        ),
        h("Разделение client/server полей"),
        p(
            "Иногда клиент шлёт captchaToken, а сервер добавляет authorId из сессии — используй .omit() или две схемы, наследуемые от базы. "
            "Не дублируй правила min/max в двух файлах вручную."
        ),
    ],
    "codeExample": (
        "import { z } from \"zod\";\n\n"
        "export const createPostSchema = z.object({\n"
        "  title: z.string().min(3).max(120),\n"
        "  body: z.string().min(1),\n"
        "});\n\n"
        "export type CreatePostInput = z.infer<typeof createPostSchema>;"
    ),
    "practice": [
        {
            "title": "Вынеси схему в shared",
            "description": "Опиши createPostSchema в shared. Подключи zodResolver на форме и parse в POST /posts.",
        },
        {
            "title": "Согласуй сообщения",
            "description": "Отправь title из одного символа: клиент должен подсветить поле, а прямой curl без клиента — получить 400 с тем же смыслом.",
        },
        {
            "title": "Добавь omit для сервера",
            "description": "Сделай serverCreatePostSchema = createPostSchema.extend({ authorId: z.string().uuid() }) и используй только на API.",
        },
    ],
    "checklist": [
        "Держу zod-схему в одном пакете для клиента и API",
        "Показываю ошибки формы до сетевого запроса",
        "На сервере снова parse — не доверяю только фронту",
        "Разделяю поля «только сервер» через extend/omit",
    ],
    "links": [
        {
            "title": "Zod documentation",
            "url": "https://zod.dev/",
        }
    ],
    "glossary": [
        {"term": "zod", "meaning": "Библиотека схем и runtime-валидации.", "example": "z.string().email()"},
        {"term": "zodResolver", "meaning": "Мост zod → React Hook Form.", "example": "useForm({ resolver })"},
        {"term": "parse", "meaning": "Проверка и преобразование данных по схеме.", "example": "schema.parse(body)"},
    ],
}

UPDATES["fullstack-06"] = {
    "theory": [
        p(
            "Загрузка файла — цепочка: input type=file на клиенте, multipart POST на API, сохранение в диск или S3 и URL в БД. "
            "Пользователь ждёт превью и прогресс, а не зависшую форму."
        ),
        h("FormData и прогресс"),
        p(
            "Собери FormData, append('file', blob). fetch с method POST без Content-Type — браузер сам поставит boundary. "
            " XMLHttpRequest или axios onUploadProgress рисует полоску процента."
        ),
        h("Превью до отправки"),
        p(
            "URL.createObjectURL(file) даёт картинку в <img> до upload. После успеха сервер возвращает постоянный url — подмени src и revokeObjectURL, чтобы не течь память."
        ),
    ],
    "codeExample": (
        "const fd = new FormData();\n"
        "fd.append('avatar', file);\n"
        "await fetch(`${API}/users/me/avatar`, { method: 'POST', body: fd, credentials: 'include' });"
    ),
    "practice": [
        {"title": "Превью аватара", "description": "При выборе файла покажи круглое превью. Ограничь тип image/* и размер 2 МБ на клиенте."},
        {"title": "POST multipart", "description": "На API прими multer или busboy, сохрани файл в uploads/ и верни { url }. Запиши url в профиль пользователя."},
        {"title": "Полоска прогресса", "description": "Покажи progress bar во время upload. При ошибке 413 выведи «Файл слишком большой»."},
    ],
    "checklist": [
        "Отправляю файл через FormData, не JSON",
        "Показываю превью и прогресс до ответа сервера",
        "Валидирую тип и размер на клиенте и на API",
        "Храню в БД URL, а не сам бинарник",
    ],
    "links": [{"title": "MDN: FormData", "url": "https://developer.mozilla.org/ru/docs/Web/API/FormData"}],
    "glossary": [
        {"term": "multipart", "meaning": "Формат тела запроса с файлами.", "example": "FormData"},
        {"term": "object URL", "meaning": "Временная ссылка на файл в памяти браузера.", "example": "createObjectURL"},
        {"term": "multer", "meaning": "Middleware Express для upload.", "example": "single('avatar')"},
    ],
}

UPDATES["fullstack-07"] = {
    "theory": [
        p(
            "Список из тысячи строк тормозит и DOM, и API. Сервер отдаёт страницами: ?page=2&limit=20 или cursor после последнего id."
        ),
        h("Offset и cursor"),
        p(
            "page/limit просты, но при частых вставках элементы «прыгают». Cursor стабильнее для ленты: GET /posts?cursor=abc&limit=20 возвращает items и nextCursor."
        ),
        h("Бесконечный скрoll"),
        p(
            "IntersectionObserver на «сторожке» внизу списка вызывает fetch следующей страницы и append в state. "
            "Пока идёт догрузка, блокируй повторный вызов флагом loadingMore."
        ),
    ],
    "codeExample": (
        "const params = new URLSearchParams({ limit: '20', cursor: next ?? '' });\n"
        "const res = await api<{ items: Post[]; nextCursor: string | null }>(`/posts?${params}`);"
    ),
    "practice": [
        {"title": "API с limit", "description": "Добавь query page и limit на GET /posts. Ответ { items, total, page }."},
        {"title": "Кнопка «Ещё»", "description": "Реализуй пагинацию кнопкой: page в state, append items в массив."},
        {"title": "Infinite scroll", "description": "Замени кнопку на observer: при достижении низа подгружай следующую страницу, пока hasMore."},
    ],
    "checklist": [
        "Передаю параметры пагинации в query, а не в body GET",
        "Не дублирую элементы при повторном fetch",
        "Блокирую параллельные запросы «ещё» флагом loading",
        "Показываю empty отдельно от конца списка",
    ],
    "links": [{"title": "MDN: URLSearchParams", "url": "https://developer.mozilla.org/ru/docs/Web/API/URLSearchParams"}],
    "glossary": [
        {"term": "cursor", "meaning": "Маркер следующей порции данных.", "example": "nextCursor"},
        {"term": "limit", "meaning": "Сколько записей за один запрос.", "example": "limit=20"},
        {"term": "IntersectionObserver", "meaning": "API видимости элемента на экране.", "example": "sentinel внизу списка"},
    ],
}

UPDATES["fullstack-08"] = {
    "theory": [
        p(
            "Оптимистичное обновление рисует результат сразу: лайк загорелся до ответа сервера. "
            "Если POST упал — откатываешь state и показываешь ошибку."
        ),
        h("Snapshot и rollback"),
        p(
            "Перед изменением сохрани prev = [...items]. Примени новый state локально. "
            "В catch восстанови prev и toast «Не удалось сохранить»."
        ),
        h("Idempotency"),
        p(
            "Для повторной отправки полезен client-generated id или версия строки, чтобы сервер не создал дубликат при retry."
        ),
    ],
    "codeExample": (
        "setItems((xs) => xs.map((x) => (x.id === id ? { ...x, liked: true } : x)));\n"
        "try {\n"
        "  await api(`/posts/${id}/like`, { method: 'POST' });\n"
        "} catch {\n"
        "  setItems(prev);\n"
        "}"
    ),
    "practice": [
        {"title": "Лайк с откатом", "description": "Переключай liked мгновенно. Отключи API и убедись, что UI вернулся назад."},
        {"title": "Disable на время запроса", "description": "Блокируй повторный клик, пока pending, но UI уже оптимистичен."},
        {"title": "Список задач", "description": "При toggle done обновляй чекбокс сразу; при 500 верни старое значение и сообщение."},
    ],
    "checklist": [
        "Сохраняю копию state перед оптимистичным патчем",
        "Откатываю UI при ошибке сети или 4xx/5xx",
        "Не оставляю «вечный» лайк без подтверждения сервера",
        "Комбинирую оптимизм с disable для двойных кликов",
    ],
    "links": [{"title": "React: queueing updates", "url": "https://react.dev/learn/queueing-a-series-of-state-updates"}],
    "glossary": [
        {"term": "optimistic UI", "meaning": "Обновление экрана до ответа сервера.", "example": "лайк сразу"},
        {"term": "rollback", "meaning": "Возврат прежнего state после ошибки.", "example": "setItems(prev)"},
        {"term": "idempotency", "meaning": "Повтор запроса не ломает данные.", "example": "PUT с версией"},
    ],
}

UPDATES["fullstack-09"] = {
    "theory": [
        p(
            "HTTP хорош для запрос-ответ, но чат и уведомления нуждаются в push. WebSocket держит канал открытым; Socket.IO добавляет комнаты и fallback на long polling."
        ),
        h("События и комнаты"),
        p(
            "Клиент socket.emit('join', { room: postId }). Сервер socket.join(room) и рассылает io.to(room).emit('comment', payload). "
            "Не шли личные данные в broadcast без проверки прав."
        ),
        h("Reconnect"),
        p(
            "При обрыве socket.io переподключается сам. После reconnect снова join комнаты и догрузи пропущенное через REST."
        ),
    ],
    "codeExample": (
        "import { io } from 'socket.io-client';\n"
        "const socket = io(import.meta.env.VITE_WS_URL, { withCredentials: true });\n"
        "socket.on('comment', (c) => setComments((xs) => [...xs, c]));"
    ),
    "practice": [
        {"title": "Echo-сервер", "description": "Подними socket.io на API. Клиент шлёт ping, получает pong в консоль."},
        {"title": "Комната поста", "description": "При открытии поста join room postId. Новый комментарий появляется у второго вкладочного клиента."},
        {"title": "Auth на handshake", "description": "Передай cookie или token в auth handshake и отклоняй анонимный join приватной комнаты."},
    ],
    "checklist": [
        "Подключаю socket.io-client к тому же origin или CORS с credentials",
        "Join комнаты при mount, leave при unmount",
        "Не дублирую сообщения при reconnect без dedupe id",
        "Проверяю права на сервере, а не только на клиенте",
    ],
    "links": [{"title": "Socket.IO docs", "url": "https://socket.io/docs/v4/"}],
    "glossary": [
        {"term": "WebSocket", "meaning": "Дупlex-канал поверх TCP.", "example": "ws://"},
        {"term": "room", "meaning": "Группа сокетов для таргетированной рассылки.", "example": "post:42"},
        {"term": "handshake", "meaning": "Первое соединение с auth.", "example": "auth: { token }"},
    ],
}

UPDATES["fullstack-10"] = {
    "theory": [
        p(
            "Stripe Checkout перенаправляет пользователя на hosted-страницу оплаты — PCI проще, чем хранить карту у себя. "
            "Ты создаёшь Checkout Session на сервере и обрабатываешь webhook checkout.session.completed."
        ),
        h("Test mode"),
        p(
            "Ключи sk_test_ и pk_test_ не списывают реальные деньги. Карта 4242 4242 4242 4242 проходит успех. "
            "Webhook локально гоняй через stripe listen --forward-to localhost:3000/webhooks/stripe."
        ),
        h("Идempotency webhook"),
        p(
            "Stripe может прислать событие дважды. Храни processed event id и выходи 200, если уже обработал."
        ),
    ],
    "codeExample": (
        "const session = await stripe.checkout.sessions.create({\n"
        "  mode: 'payment',\n"
        "  line_items: [{ price: priceId, quantity: 1 }],\n"
        "  success_url: `${APP_URL}/billing/success`,\n"
        "  cancel_url: `${APP_URL}/billing/cancel`,\n"
        "});"
    ),
    "practice": [
        {"title": "Session endpoint", "description": "POST /billing/checkout создаёт session и возвращает url. Кнопка «Оплатить» делает window.location = url."},
        {"title": "Webhook", "description": "Обработай checkout.session.completed: пометь заказ paid в БД. Проверь подпись stripe-signature."},
        {"title": "Test оплата", "description": "Пройди checkout test-картой. Убедись, что статус заказа обновился только после webhook, не после redirect."},
    ],
    "checklist": [
        "Создаю Checkout Session только на сервере с secret key",
        "Проверяю подпись webhook raw body",
        "Делаю обработку webhook идемпотентной",
        "Не путаю success redirect с фактом оплаты",
    ],
    "links": [{"title": "Stripe Checkout", "url": "https://docs.stripe.com/payments/checkout"}],
    "glossary": [
        {"term": "Checkout Session", "meaning": "Объект hosted-оплаты Stripe.", "example": "mode: payment"},
        {"term": "webhook", "meaning": "HTTP callback от Stripe о событии.", "example": "checkout.session.completed"},
        {"term": "test mode", "meaning": "Режим без реальных списаний.", "example": "sk_test_…"},
    ],
}

UPDATES["fullstack-11"] = {
    "theory": [
        p(
            "Письмо «заказ принят» или «сброс пароля» уходит асинхронно: пользователь не должен ждать SMTP в HTTP-запросе. "
            "Очередь (BullMQ, in-memory для учебы) или fire-and-forget с логированием ошибок."
        ),
        h("Шаблоны"),
        p(
            "Тема и HTML-тело с подстановкой {{name}}. Храни шаблон в файле или react-email. "
            "Текстовая версия plain text повышает доставляемость."
        ),
        h("Retry и лимиты"),
        p(
            "При временной ошибке SMTP повтори job 3 раза с backoff. Rate limit на «сброс пароля», чтобы не спамили."
        ),
    ],
    "codeExample": (
        "await mailQueue.add('order-confirmation', {\n"
        "  to: user.email,\n"
        "  subject: 'Заказ #123 принят',\n"
        "  template: 'order',\n"
        "  data: { orderId: '123' },\n"
        "});"
    ),
    "practice": [
        {"title": "Отправка через Resend/SMTP", "description": "Настрой провайдера в env. POST /orders после создания ставит job отправки письма."},
        {"title": "Шаблон reset password", "description": "Ссылка с одноразовым token, срок 15 минут. Письмо без пароля в открытом виде."},
        {"title": "Лог failed job", "description": "Симулируй неверный SMTP pass и убедись, что job попал в failed с текстом ошибки."},
    ],
    "checklist": [
        "Не блокирую HTTP-ответ ожиданием SMTP",
        "Храню секреты SMTP только в env",
        "Ограничиваю частоту писем сброса пароля",
        "Логирую failed доставку для поддержки",
    ],
    "links": [{"title": "Resend docs", "url": "https://resend.com/docs/introduction"}],
    "glossary": [
        {"term": "transactional email", "meaning": "Сервисное письмо по событию.", "example": "сброс пароля"},
        {"term": "очередь", "meaning": "Фоновые задачи вне HTTP.", "example": "BullMQ"},
        {"term": "backoff", "meaning": "Пауза между повторами job.", "example": "2s, 4s, 8s"},
    ],
}

UPDATES["fullstack-12"] = {
    "theory": [
        p(
            "Админка — те же CRUD, но маршруты только для role admin. Таблица пользователей с сортировкой, поиском и действиями ban/edit."
        ),
        h("Права на сервере"),
        p(
            "Скрытие пункта меню не защита. Каждый DELETE /users/:id проверяет req.user.role === 'admin' middleware."
        ),
        h("UX таблицы"),
        p(
            "Пагинация, фильтр по email, модалка подтверждения удаления. Bulk actions только с явным confirm."
        ),
    ],
    "codeExample": (
        "function requireAdmin(req, res, next) {\n"
        "  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });\n"
        "  next();\n"
        "}"
    ),
    "practice": [
        {"title": "Маршрут /admin", "description": "ProtectedRoute + проверка role admin. Гость и user получают 403 или редирект."},
        {"title": "Таблица пользователей", "description": "GET /admin/users с пагинацией. Кнопки «Заблокировать» вызывают PATCH с confirm."},
        {"title": "Audit log одной строкой", "description": "После ban пиши в console или таблицу admin_actions: кто, когда, что."},
    ],
    "checklist": [
        "Проверяю admin role на API для каждого опасного action",
        "Делаю confirm перед удалением и ban",
        "Пагинирую большие списки в админке",
        "Не показываю секреты пользователя в таблице",
    ],
    "links": [{"title": "OWASP: Access Control", "url": "https://owasp.org/www-project-proactive-controls/v3/en/c7-enforce-access-controls"}],
    "glossary": [
        {"term": "RBAC", "meaning": "Доступ по ролям.", "example": "admin / user"},
        {"term": "403 Forbidden", "meaning": "Аутентифицирован, но нет прав.", "example": "не admin"},
        {"term": "CRUD", "meaning": "Create read update delete.", "example": "таблица users"},
    ],
}

UPDATES["fullstack-13"] = {
    "theory": [
        p(
            "SPA отдаёт пустой index.html — поисковик видит мало текста. Для маркeting-страниц нужен SSR/SSG (Next) или prerender. "
            "i18n — ключи строк и переключатель locale, даты через Intl."
        ),
        h("meta и title"),
        p(
            "react-helmet-async или роутер задаёт <title> и description per page. Open Graph картинка для шаринга."
        ),
        h("react-i18next базово"),
        p(
            "t('posts.title') в JSON ru/en. Язык в localStorage или Accept-Language. Не хардкодь строки в JSX."
        ),
    ],
    "codeExample": (
        "import { useTranslation } from 'react-i18next';\n\n"
        "export function PostsPage() {\n"
        "  const { t } = useTranslation();\n"
        "  return <h1>{t('posts.title')}</h1>;\n"
        "}"
    ),
    "practice": [
        {"title": "Два языка", "description": "Добавь ru/en JSON с 10 строками. Переключатель меняет язык без перезагрузки."},
        {"title": "title per route", "description": "На /posts title «Посты — Мой блог». Проверь вкладку браузера."},
        {"title": "Запиши SEO-риск SPA", "description": "В README одним абзацем опиши, какие страницы нужно prerender/SSR и почему."},
    ],
    "checklist": [
        "Понимаю, почему чистая SPA слаба для SEO контента",
        "Выношу UI-строки в файлы перевода",
        "Задаю title/description для публичных страниц",
        "Форматирую даты через Intl, а не ручную строку",
    ],
    "links": [{"title": "react-i18next", "url": "https://react.i18next.com/"}],
    "glossary": [
        {"term": "SSR", "meaning": "HTML генерируется на сервере.", "example": "Next.js"},
        {"term": "locale", "meaning": "Код языка и региональных правил.", "example": "ru-RU"},
        {"term": "Open Graph", "meaning": "Meta для превью в соцсетях.", "example": "og:image"},
    ],
}

UPDATES["fullstack-project"] = {
    "theory": [
        p(
            "Итог модуля — приложение, где виден весь путь: регистрация, контент, файлы, realtime или админ. "
            "Выбери блог или таск-менеджер и зафиксируй MVP: без этого фичи не добавляешь."
        ),
        h("Минимальный сквозной сценарий"),
        p(
            "Guest → signup → create entity → edit → logout → login снова. Параллельно admin меняет чужой контент или банит user."
        ),
        h("Definition of done"),
        p(
            "README, env.example, скрин или GIF, обработка loading/error, права на API. Деплой — в модуле DevOps, но URL можно подготовить заранее."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Сквозной сценарий на видео", "description": "Запиши 2–3 мин screen capture: signup, create, realtime/comment или upload. Положи ссылку в README."},
        {"title": "Чеклист MVP в README", "description": "Таблица: auth, CRUD, files или WS, admin — галочки что готово."},
        {"title": "Issue «v2»", "description": "Создай 5 issues с осознанно отложенными фичами (OAuth, push, analytics)."},
    ],
    "checklist": [
        "Прохожу signup → create → edit без ручных правок в БД",
        "Админ-действия защищены на сервере",
        "Есть README со стеком и командой запуска",
        "Отложенные фичи вынесены в issues, не в половину кода",
    ],
    "links": [{"title": "MDN: Fetch API", "url": "https://developer.mozilla.org/ru/docs/Web/API/Fetch_API"}],
    "glossary": [
        {"term": "MVP", "meaning": "Минимум функций с ценностью.", "example": "CRUD + auth"},
        {"term": "user journey", "meaning": "Путь пользователя end-to-end.", "example": "signup → post"},
        {"term": "Definition of Done", "meaning": "Критерии готовности фичи.", "example": "тест + README"},
    ],
}

# --- TESTING ---

UPDATES["testing-01"] = {
    "theory": [
        p(
            "Тест фиксирует ожидаемое поведение: зелёный — можно менять код, красный — регрессия. "
            "Без тестов рефакторинг превращается в ручной клик по всему приложению."
        ),
        h("Пирамида тестов"),
        p(
            "Внизу много быстрых unit-тестов на чистые функции. Выше — integration (API + БД). "
            "Вершина — несколько e2e через браузер: медленные, но ловят склейку UI и бэка."
        ),
        h("Что не тестировать"),
        p(
            "Не проверяй, что React.useState существует. Тестируй свою логику: скидка, права, парсинг, маппинг DTO."
        ),
    ],
    "codeExample": (
        "import { describe, it, expect } from \"vitest\";\n\n"
        "describe(\"discount\", () => {\n"
        "  it(\"gives 10% for VIP\", () => {\n"
        "    expect(priceAfterDiscount(100, \"vip\")).toBe(90);\n"
        "  });\n"
        "});"
    ),
    "practice": [
        {"title": "Классифицируй три сценария", "description": "Запиши: расчёт налога, POST /orders, login через UI — unit, integration или e2e и почему."},
        {"title": "Один unit-тест", "description": "Напиши тест на чистую функцию из своего проекта. Запусти vitest --run."},
        {"title": "Сломай и почини", "description": "Измени функцию так, чтобы тест упал. Верни правильное поведение до зелёного."},
    ],
    "checklist": [
        "Выбираю уровень теста по скорости и изоляции",
        "Пишу тест на своё поведение, не на фреймворк",
        "Запускаю unit-тесты локально перед push",
        "Понимаю разницу регрессии и «тест мешает»",
    ],
    "links": [{"title": "Vitest", "url": "https://vitest.dev/guide/"}],
    "glossary": [
        {"term": "unit-тест", "meaning": "Проверка маленького куска без I/O.", "example": "функция скидки"},
        {"term": "регрессия", "meaning": "Старое поведение сломалось.", "example": "красный CI"},
        {"term": "e2e", "meaning": "Тест через UI как пользователь.", "example": "Playwright login"},
        {"term": "coverage", "meaning": "Доля кода, которую задели тесты.", "example": "70% сервисов"},
    ],
}

UPDATES["testing-02"] = {
    "theory": [
        p(
            "Vitest совместим с Jest API, но быстрее на Vite. describe группирует, it — один случай, expect — утверждения."
        ),
        h("Arrange–Act–Assert"),
        p(
            "Подготовь данные, вызови функцию, проверь результат. Один it — одна причина падения, название читается как спецификация."
        ),
        h("Моки"),
        p(
            "vi.fn() и vi.spyOn изолируют зависимости: не ходи в реальную почту в unit. Мокай границы, не каждый внутренний вызов."
        ),
    ],
    "codeExample": (
        "import { describe, it, expect, vi } from \"vitest\";\n"
        "import { notify } from \"./notify\";\n\n"
        "it(\"sends email once\", () => {\n"
        "  const send = vi.fn();\n"
        "  notify({ send, to: \"a@b.c\" });\n"
        "  expect(send).toHaveBeenCalledTimes(1);\n"
        "});"
    ),
    "practice": [
        {"title": "Таблица кейсов", "description": "Для функции formatPrice напиши 3 it: 0, обычная цена, null → «—»."},
        {"title": "vi.spyOn Date", "description": "Зафиксируй now через vi.setSystemTime и проверь «сегодня» в форматтере даты."},
        {"title": "watch mode", "description": "Запусти vitest в watch, меняй код и смотри мгновенный перезапуск."},
    ],
    "checklist": [
        "Структурирую тесты через describe/it",
        "Даю it понятное имя на русском или английском",
        "Мокаю внешние сервисы, не тестируемую логику",
        "Использую toBe/toEqual осознанно",
    ],
    "links": [{"title": "Vitest expect", "url": "https://vitest.dev/api/expect.html"}],
    "glossary": [
        {"term": "describe", "meaning": "Группа связанных тестов.", "example": "describe('auth')"},
        {"term": "mock", "meaning": "Подмена зависимости в тесте.", "example": "vi.fn()"},
        {"term": "AAA", "meaning": "Arrange, Act, Assert.", "example": "данные → вызов → expect"},
    ],
}

UPDATES["testing-03"] = {
    "theory": [
        p(
            "Сервисный слой — бизнес-правила между controller и repository. Тестируешь его без HTTP: импорт класса/функции, мок репозитория."
        ),
        h("Границы слоёв"),
        p(
            "Controller тонкий: parse body, вызов service, status code. Тяжёлая логика в service — туда и unit-тесты с vi.mocked(repo)."
        ),
        h("Фикстуры данных"),
        p(
            "factory user({ role: 'admin' }) держит тесты короткими. Не копируй огромный объект в каждый it."
        ),
    ],
    "codeExample": (
        "const repo = { findById: vi.fn() };\n"
        "const svc = new PostsService(repo);\n"
        "repo.findById.mockResolvedValue({ id: '1', authorId: 'u1' });\n"
        "await expect(svc.delete('1', { id: 'u2' })).rejects.toThrow('Forbidden');"
    ),
    "practice": [
        {"title": "Тест запрета", "description": "Сервис deletePost бросает, если authorId !== user.id. Два it: свой пост и чужой."},
        {"title": "Мок repo", "description": "repo.create не вызывается, если zod parse упал — проверь через expect(repo.create).not.toHaveBeenCalled()."},
        {"title": "Покрыть happy path", "description": "Успешное create возвращает DTO с id. repo.save получил правильные поля."},
    ],
    "checklist": [
        "Тестирую service без supertest и listen",
        "Мокаю repository, а не реальную БД в unit",
        "Проверяю и success, и forbidden/validation",
        "Держу controller тонким — логика в service",
    ],
    "links": [{"title": "Testing Library (принципы)", "url": "https://testing-library.com/docs/guiding-principles/"}],
    "glossary": [
        {"term": "service layer", "meaning": "Бизнес-логика приложения.", "example": "PostsService"},
        {"term": "repository", "meaning": "Доступ к БД за интерфейсом.", "example": "findById"},
        {"term": "fixture", "meaning": "Готовые тестовые данные.", "example": "userFactory()"},
    ],
}

UPDATES["testing-04"] = {
    "theory": [
        p(
            "Integration-тест API поднимает Express app без server.listen и бьёт supertest: реальный роутинг, middleware, иногда PostgreSQL test."
        ),
        h("Test database"),
        p(
            "DATABASE_URL указывает на fullstacker_test. beforeAll — migrate, beforeEach — truncate или transaction rollback."
        ),
        h("Что assert"),
        p(
            "status, тело JSON, заголовок Set-Cookie. Не проверяй внутренние вызовы service — это уровень unit."
        ),
    ],
    "codeExample": (
        "import request from \"supertest\";\n"
        "import { app } from \"../app\";\n\n"
        "it(\"GET /health\", async () => {\n"
        "  const res = await request(app).get(\"/health\");\n"
        "  expect(res.status).toBe(200);\n"
        "  expect(res.body.ok).toBe(true);\n"
        "});"
    ),
    "practice": [
        {"title": "CRUD posts", "description": "POST создаёт, GET по id возвращает 200, DELETE даёт 204. Используй test DB."},
        {"title": "401 без cookie", "description": "GET /me без сессии → 401. С login helper → 200."},
        {"title": "Изоляция", "description": "Два теста создают post — id разные, данные не текут между it."},
    ],
    "checklist": [
        "Импортирую app, не поднимаю порт вручную",
        "Использую отдельную test database",
        "Чищу данные между тестами",
        "Проверяю status и shape JSON",
    ],
    "links": [{"title": "supertest", "url": "https://github.com/ladjs/supertest"}],
    "glossary": [
        {"term": "supertest", "meaning": "HTTP к Express без реального порта.", "example": "request(app).get"},
        {"term": "test database", "meaning": "Изолированная БД для CI.", "example": "postgres_test"},
        {"term": "truncate", "meaning": "Очистка таблиц между тестами.", "example": "TRUNCATE posts"},
    ],
}

UPDATES["testing-05"] = {
    "theory": [
        p(
            "React Testing Library ищет элементы так, как пользователь: по role, label, text. "
            "Не тестируй state напрямую — кликни кнопку и проверь текст на экране."
        ),
        h("render и userEvent"),
        p(
            "render(<Login />) и await user.click(screen.getByRole('button', { name: /войти/i })). "
            "userEvent ближе к реальным событиям, чем fireEvent."
        ),
        h("async UI"),
        p(
            "findBy* ждёт появления. waitFor оборачивает expect после fetch mock."
        ),
    ],
    "codeExample": (
        "import { render, screen } from \"@testing-library/react\";\n"
        "import userEvent from \"@testing-library/user-event\";\n\n"
        "await userEvent.type(screen.getByLabelText(/email/i), \"a@b.c\");\n"
        "await userEvent.click(screen.getByRole(\"button\", { name: /войти/i }));\n"
        "expect(await screen.findByText(/ошибка/i)).toBeInTheDocument();"
    ),
    "practice": [
        {"title": "Форма login", "description": "Пустой submit показывает validation. Заполни поля — mock fetch 200 — редирект или текст «Привет»."},
        {"title": "getByRole", "description": "Перепиши один getByTestId на getByRole('link', { name: ... })."},
        {"title": "accessibility smoke", "description": "У каждого input есть label или aria-label — проверь в тесте getByLabelText."},
    ],
    "checklist": [
        "Ищу элементы по role и accessible name",
        "Симулирую действия через userEvent",
        "Жду async через findBy/waitFor",
        "Не завишу от className и внутреннего state",
    ],
    "links": [{"title": "React Testing Library", "url": "https://testing-library.com/docs/react-testing-library/intro/"}],
    "glossary": [
        {"term": "getByRole", "meaning": "Поиск по ARIA-роли.", "example": "button"},
        {"term": "userEvent", "meaning": "Симуляция ввода пользователя.", "example": "click, type"},
        {"term": "findBy", "meaning": "Async query с ожиданием.", "example": "findByText"},
    ],
}

UPDATES["testing-06"] = {
    "theory": [
        p(
            "Компонент с useEffect fetch ломается, если в тесте реальный API. MSW перехватывает fetch в Node/jsdom и отдаёт фикстуры."
        ),
        h("setupServer"),
        p(
            "handlers = [http.get('/api/posts', () => HttpResponse.json([...]))]. beforeAll server.listen, afterEach resetHandlers."
        ),
        h("Тест custom hook"),
        p(
            "renderHook из @testing-library/react с wrapper Provider. act(() => ...) для state updates."
        ),
    ],
    "codeExample": (
        "import { http, HttpResponse } from \"msw\";\n"
        "import { setupServer } from \"msw/node\";\n\n"
        "const server = setupServer(\n"
        "  http.get(\"/api/posts\", () => HttpResponse.json([{ id: \"1\", title: \"Hi\" }])),\n"
        ");\n"
        "beforeAll(() => server.listen());"
    ),
    "practice": [
        {"title": "MSW success", "description": "Список постов рендерит «Hi» из handler без реального сервера."},
        {"title": "MSW 500", "description": "Handler возвращает 500 — на экране error state из урока fullstack-04."},
        {"title": "renderHook", "description": "Тест usePosts: loading → data через MSW."},
    ],
    "checklist": [
        "Поднимаю MSW server в setupFiles",
        "Сбрасываю handlers после каждого теста",
        "Не мокаю fetch вручную в каждом it",
        "Оборачиваю hook updates в act",
    ],
    "links": [{"title": "MSW", "url": "https://mswjs.io/docs/"}],
    "glossary": [
        {"term": "MSW", "meaning": "Mock Service Worker для HTTP.", "example": "setupServer"},
        {"term": "renderHook", "meaning": "Тест React hook в изоляции.", "example": "usePosts()"},
        {"term": "act", "meaning": "Flush React updates в тесте.", "example": "act(() => …)"},
    ],
}

UPDATES["testing-07"] = {
    "theory": [
        p(
            "E2E гоняет настоящий браузер: Playwright или Cypress кликает по деплою или localhost. "
            "Дорого по времени — оставь 3–5 сценариев, которые ломаются чаще всего."
        ),
        h("Стабильные селекторы"),
        p(
            "data-testid только если нет role. Лучше getByRole в Playwright: page.getByRole('button', { name: 'Войти' })."
        ),
        h("Изоляция данных"),
        p(
            "Seed user test+timestamp@example.com или API setup в beforeEach. Не завись от ручных данных в общей БД."
        ),
    ],
    "codeExample": (
        "import { test, expect } from \"@playwright/test\";\n\n"
        "test(\"login\", async ({ page }) => {\n"
        "  await page.goto(\"/login\");\n"
        "  await page.getByLabel(\"Email\").fill(\"user@test.local\");\n"
        "  await page.getByRole(\"button\", { name: \"Войти\" }).click();\n"
        "  await expect(page).toHaveURL(/\\/app/);\n"
        "});"
    ),
    "practice": [
        {"title": "Login e2e", "description": "Сценарий login → виден dashboard. Запусти npx playwright test."},
        {"title": "Create entity", "description": "Создай пост/задачу через UI, найди заголовок на странице списка."},
        {"title": "Скрин при падении", "description": "Убедись, что trace/screenshot включены в конфиге и открываются при fail."},
    ],
    "checklist": [
        "Пишу e2e только для критичных путей",
        "Использую role/label селекторы",
        "Создаю тестовые данные программно",
        "Не hardcode sleep — жду expect/toBeVisible",
    ],
    "links": [{"title": "Playwright", "url": "https://playwright.dev/docs/intro"}],
    "glossary": [
        {"term": "e2e", "meaning": "Тест в реальном браузере.", "example": "Playwright"},
        {"term": "trace", "meaning": "Запись шагов при падении.", "example": "playwright show-trace"},
        {"term": "fixture", "meaning": "Подготовка данных для e2e.", "example": "seed user"},
    ],
}

UPDATES["testing-08"] = {
    "theory": [
        p(
            "ESLint ловит ошибки до runtime, Prettier форматирует единообразно. husky + lint-staged гоняют их на staged файлах перед commit."
        ),
        h("lint-staged"),
        p(
            "\"*.{ts,tsx}\": [\"eslint --fix\", \"prettier --write\"] — быстро, не весь репо каждый раз."
        ),
        h("CI дублирует"),
        p(
            "Даже если локально пропустил — GitHub Actions упадёт на lint. Одни правила в eslint.config и prettier.config."
        ),
    ],
    "codeExample": (
        "// package.json\n"
        "\"lint-staged\": {\n"
        "  \"*.{ts,tsx,js,json,md}\": [\"prettier --write\"],\n"
        "  \"*.{ts,tsx}\": [\"eslint --fix\"]\n"
        "}"
    ),
    "practice": [
        {"title": "pre-commit hook", "description": "husky pre-commit запускает lint-staged. Сделай commit с кривым форматированием — prettier исправит."},
        {"title": "eslint rule", "description": "Включи no-unused-vars или @typescript-eslint/no-floating-promises, почини одно нарушение."},
        {"title": "npm run lint", "description": "Скрипт lint для CI. Запусти в чистом clone — должно быть 0 errors."},
    ],
    "checklist": [
        "Форматирую код Prettier перед review",
        "Не коммичу с eslint errors",
        "lint-staged трогает только staged файлы",
        "CI повторяет lint так же, как локально",
    ],
    "links": [{"title": "husky", "url": "https://typicode.github.io/husky/"}],
    "glossary": [
        {"term": "lint-staged", "meaning": "Lint только staged файлов.", "example": "pre-commit"},
        {"term": "husky", "meaning": "Git hooks в npm-проекте.", "example": "pre-commit"},
        {"term": "flat config", "meaning": "eslint.config.js формат ESLint 9.", "example": "export default []"},
    ],
}

UPDATES["testing-09"] = {
    "theory": [
        p(
            "GitHub Flow: main всегда deployable, feature/fix в ветке, PR с review, merge. "
            "Conventional Commits: feat:, fix:, chore: — changelog и семантика релизов."
        ),
        h("Имена веток"),
        p(
            "feat/post-pagination, fix/auth-cookie. Одна задача — одна ветка, не «ivan-fixes» на неделю."
        ),
        h("PR описание"),
        p(
            "Что сделано, как проверить, скрин для UI. Ссылка на issue. Draft PR — ранний фидбек."
        ),
    ],
    "codeExample": (
        "git checkout -b feat/login-form\n"
        "git commit -m \"feat(auth): add login form validation\"\n"
        "git push -u origin feat/login-form\n"
        "gh pr create --title \"feat(auth): login form\" --body \"## Test plan\\n- [ ] invalid email\""
    ),
    "practice": [
        {"title": "Три коммита conventional", "description": "feat, fix, test в одной ветке учебного репо с осмысленными сообщениями."},
        {"title": "PR template", "description": "Добавь .github/pull_request_template.md с Test plan чеклистом."},
        {"title": "Rebase или merge", "description": "Обнови ветку от main (merge или rebase). Запиши, что выбрал и почему для команды."},
    ],
    "checklist": [
        "Коммичу с типом feat/fix/docs/test",
        "Держу PR маленьким и с test plan",
        "Не пушу напрямую в main без согласования",
        "Привязываю ветку к одной задаче",
    ],
    "links": [{"title": "Conventional Commits", "url": "https://www.conventionalcommits.org/"}],
    "glossary": [
        {"term": "PR", "meaning": "Pull request на слияние ветки.", "example": "feat → main"},
        {"term": "feat", "meaning": "Commit type: новая функция.", "example": "feat(api): …"},
        {"term": "main", "meaning": "Главная ветка, всегда рабочая.", "example": "protected branch"},
    ],
}

UPDATES["testing-10"] = {
    "theory": [
        p(
            "Code review — не личная атака, а поиск рисков до prod. Автор объясняет контекст, реviewer задаёт вопросы и предлагает патчи."
        ),
        h("Как реviewить"),
        p(
            "Сначала «что делает PR», потом security, тесты, naming. Комментарий: «предложение» vs «blocker». Один nit — не десять сообщений подряд."
        ),
        h("Как принимать feedback"),
        p(
            "Отвечай по существу, не «ты не прав». Если не согласен — аргумент и компромисс. Thank you за catch бага."
        ),
    ],
    "codeExample": (
        "## Review checklist\n"
        "- [ ] Понятна цель PR\n"
        "- [ ] Есть тесты или обоснование\n"
        "- [ ] Нет секретов в diff\n"
        "- [ ] Error paths обработаны"
    ),
    "practice": [
        {"title": "Review чужого diff", "description": "Открой PR в open source или учебный diff. Оставь 2 конструктивных комментария (можно себе в заметках)."},
        {"title": "Self-review", "description": "Перед PR пройди свой diff в GitHub: убери console.log и TODO без issue."},
        {"title": "Blocker vs nit", "description": "В одном учебном PR пометь комментарии тегами [blocker] и [nit] — по одному примеру."},
    ],
    "checklist": [
        "Читаю описание PR до кода",
        "Отличаю blocker от stylistic nit",
        "Предлагаю fix, а не только «плохо»",
        "Отвечаю на review без оправданий вместо фактов",
    ],
    "links": [{"title": "Google eng practices: review", "url": "https://google.github.io/eng-practices/review/"}],
    "glossary": [
        {"term": "nit", "meaning": "Мелкое замечание, не blocker.", "example": "rename variable"},
        {"term": "blocker", "meaning": "Нельзя мержить без fix.", "example": "SQL injection"},
        {"term": "LGTM", "meaning": "Looks good to me — approve.", "example": "approve PR"},
    ],
}

UPDATES["testing-11"] = {
    "theory": [
        p(
            "Рефакторинг меняет структуру без смены поведения. Зелёные тесты — страховка. "
            "SOLID на junior — не абстракции ради абстракций, а один класс — одна причина меняться."
        ),
        h("Запахи"),
        p(
            "Длинная функция, дублирование, magic numbers. Extract function, constants, module."
        ),
        h("Strangler"),
        p(
            "Новый модуль рядом со старым, постепенная замена. Не big bang rewrite за выходные."
        ),
    ],
    "codeExample": (
        "// до\n"
        "function total(items) { let s=0; for… complex … }\n\n"
        "// после\n"
        "function lineTotal(i) { … }\n"
        "function total(items) { return items.reduce((s, i) => s + lineTotal(i), 0); }"
    ),
    "practice": [
        {"title": "Extract function", "description": "Вынеси 15 строк из route handler в service. Тесты остаются зелёными."},
        {"title": "Убери дубль", "description": "Два одинаковых блока validation → одна zod-схема."},
        {"title": "Rename для смысла", "description": "Переименуй data/tmp/x в осмысленные имена, grep по проекту, commit отдельно."},
    ],
    "checklist": [
        "Рефакторю только под зелёными тестами",
        "Делаю маленькие commits",
        "Выношу дубли в функции/модули",
        "Не добавляю абстракцию без второго use case",
    ],
    "links": [{"title": "refactoring.guru", "url": "https://refactoring.guru/refactoring/smells"}],
    "glossary": [
        {"term": "SRP", "meaning": "Single responsibility — одна задача модуля.", "example": "PostsService"},
        {"term": "code smell", "meaning": "Признак плохой структуры.", "example": "god function"},
        {"term": "extract function", "meaning": "Выделение куска в функцию.", "example": "lineTotal"},
    ],
}

UPDATES["testing-12"] = {
    "theory": [
        p(
            "Stack trace читается снизу вверх к месту throw или с top frame — где упало. "
            "Source maps в dev показывают ts/tsx, не только bundle.js:42."
        ),
        h("debugger и breakpoints"),
        p(
            "debugger в Chrome Sources или breakpoint в VS Code на launch.json. Смотри Variables и Call Stack."
        ),
        h("Паттерны JS"),
        p(
            "Module, Observer, Factory встречаются в коде библиотек. На собесе — пример из своего проекта, не определение из Википедии."
        ),
    ],
    "codeExample": (
        "try {\n"
        "  await risky();\n"
        "} catch (e) {\n"
        "  console.error(e);\n"
        "  if (e instanceof ZodError) …\n"
        "  throw e;\n"
        "}"
    ),
    "practice": [
        {"title": "Прочитай stack", "description": "Создай ReferenceError в dev, найди файл:строку в trace и исправь."},
        {"title": "Breakpoint", "description": "Остановись на breakpoint в async handler, шагни через await."},
        {"title": "Паттерн в коде", "description": "Найди в своём репо Observer или Factory (event emitter, createX). Опиши в 3 предложениях."},
    ],
    "checklist": [
        "Нахожу строку ошибки в stack trace",
        "Использую breakpoint вместо console.log spam",
        "Различаю TypeError и ошибку валидации",
        "Привожу пример паттерна из своего кода",
    ],
    "links": [{"title": "MDN: Errors", "url": "https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Error"}],
    "glossary": [
        {"term": "stack trace", "meaning": "Цепочка вызовов до ошибки.", "example": "at POST handler"},
        {"term": "breakpoint", "meaning": "Пауза выполнения в debugger.", "example": "F9 в VS Code"},
        {"term": "Observer", "meaning": "Подписчики на события.", "example": "socket.on"},
    ],
}

UPDATES["testing-project"] = {
    "theory": [
        p(
            "Финал модуля — проект с покрытием критичной логики unit/integration и тремя e2e на главные пути. "
            "70% — не цель ради галочки, а сервисы, auth, деньги."
        ),
        h("Приоритет покрытия"),
        p(
            "Сначала service + API auth/posts, потом UI smoke. Coverage report покажет дыры — не гонись за 100% на компонентах."
        ),
        h("CI gate"),
        p(
            "PR не мержится, если test или e2e красные. Playwright в CI headless с artifact trace."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Coverage report", "description": "vitest --coverage, скрин или текст: какие файлы ниже 50% и почему ok."},
        {"title": "3 e2e", "description": "login, create, delete/logout. Зелёные локально и в CI."},
        {"title": "Badge в README", "description": "Добавь shields.io CI status или текст «tests passing» со ссылкой на Actions."},
    ],
    "checklist": [
        "Покрыл сервисный слой и auth API тестами",
        "Три e2e проходят headless",
        "lint и test в CI на каждый PR",
        "Не коммичу .only в playwright/vitest",
    ],
    "links": [{"title": "Vitest coverage", "url": "https://vitest.dev/guide/coverage.html"}],
    "glossary": [
        {"term": "coverage", "meaning": "Процент строк, затронутых тестами.", "example": "v8 report"},
        {"term": "CI gate", "meaning": "Блок merge при красных checks.", "example": "required check"},
        {"term": "headless", "meaning": "Браузер без UI в CI.", "example": "playwright ci"},
    ],
}

# --- DEVOPS ---

UPDATES["devops-01"] = {
    "theory": [
        p(
            "Сервер в облаке или VPS — это Linux с SSH. Ты подключаешься ssh user@host, смотришь файлы ls, права chmod, процессы ps."
        ),
        h("Файловая система"),
        p(
            "/var/log — логи, /etc — конфиги, домашняя ~ — твой user. pwd показывает где ты, cd переходит. "
            "Не работай постоянно под root: отдельный deploy-user с sudo."
        ),
        h("SSH ключи"),
        p(
            "ssh-keygen - ed25519, публичный ключ в authorized_keys на сервере. Пароль отключай после проверки ключа."
        ),
    ],
    "codeExample": (
        "ssh deploy@203.0.113.10\n"
        "ls -la /var/www\n"
        "journalctl -u myapp -n 50 --no-pager"
    ),
    "practice": [
        {"title": "SSH вход", "description": "Подключись к учебному VPS или docker ssh контейнеру. Выполни whoami и pwd."},
        {"title": "Права файла", "description": "Создай script.sh, chmod +x, запусти ./script.sh. Объясни разницу без +x."},
        {"title": "tail лог", "description": "Найди лог приложения или /var/log и прочитай последние 20 строк через tail -n 20."},
    ],
    "checklist": [
        "Подключаюсь по SSH ключом, не только паролем",
        "Ориентируюсь в путях и правах rwx",
        "Не редактирую прод-конфиги без бэкапа",
        "Использую отдельного пользователя для деплоя",
    ],
    "links": [{"title": "OpenSSH", "url": "https://www.openssh.com/manual.html"}],
    "glossary": [
        {"term": "SSH", "meaning": "Зашифрованный удалённый shell.", "example": "ssh user@host"},
        {"term": "chmod", "meaning": "Права read/write/execute.", "example": "chmod 644"},
        {"term": "VPS", "meaning": "Виртуальный сервер с root доступом.", "example": "Hetzner VM"},
    ],
}

UPDATES["devops-02"] = {
    "theory": [
        p(
            "dev, staging, prod — разные DATABASE_URL и секреты. .env локально, на сервере — variables панели хостинга или secrets в CI."
        ),
        h("Никаких секретов в git"),
        p(
            ".env в .gitignore, в репо только .env.example с пустыми ключами. git-secrets или pre-commit ловят случайный commit токена."
        ),
        h("12-factor config"),
        p(
            "Конфиг в environment: один образ Docker, разные env на staging/prod. Не прошивай API key внутри image."
        ),
    ],
    "codeExample": (
        "# .env.example\n"
        "DATABASE_URL=postgres://localhost:5432/app\n"
        "JWT_SECRET=change-me\n"
        "STRIPE_SECRET_KEY=sk_test_…"
    ),
    "practice": [
        {"title": "env.example", "description": "Сверь все process.env проекта с .env.example. Добавь недостающие ключи без значений."},
        {"title": "staging profile", "description": "Опиши в README две строки: что меняется между dev и prod (URL, DEBUG)."},
        {"title": "Скан secrets", "description": "Запусти gitleaks или trufflehog на репо (или ручной grep sk_live). Исправь, если нашёл."},
    ],
    "checklist": [
        "Не коммичу .env и private keys",
        "Документирую переменные в .env.example",
        "Разделяю dev и prod database",
        "Ротирую секрет, если он утёк в git history",
    ],
    "links": [{"title": "12-Factor: Config", "url": "https://12factor.net/config"}],
    "glossary": [
        {"term": "environment", "meaning": "Пара key=value для конфигурации.", "example": "DATABASE_URL"},
        {"term": "secret", "meaning": "Приватный ключ, не для клиента.", "example": "JWT_SECRET"},
        {"term": "staging", "meaning": "Копия прода для проверки релиза.", "example": "staging.myapp.com"},
    ],
}

UPDATES["devops-03"] = {
    "theory": [
        p(
            "Dockerfile — рецепт образа: FROM база, COPY код, RUN сборка, CMD процесс. "
            "Образ неизменяем: новый деплой = новый tag, не ssh и правки на сервере."
        ),
        h("Слои и кэш"),
        p(
            "Сначала COPY package.json и npm ci, потом COPY . — так зависимости кэшируются, пока lock не менялся."
        ),
        h("dockerignore"),
        p(
            "Исключи node_modules, .git, dist — иначе контекст сборки гигантский и медленный."
        ),
    ],
    "codeExample": (
        "FROM node:22-alpine\n"
        "WORKDIR /app\n"
        "COPY package*.json ./\n"
        "RUN npm ci\n"
        "COPY . .\n"
        "RUN npm run build\n"
        "CMD [\"node\", \"dist/index.js\"]"
    ),
    "practice": [
        {"title": "Собери образ API", "description": "docker build -t myapi:local . из папки API. docker run -p 3000:3000 myapi:local."},
        {"title": "dockerignore", "description": "Добавь node_modules и .env в .dockerignore, пересобери — время build должно упасть."},
        {"title": "Проверь health", "description": "curl localhost:3000/health из хоста к контейнеру."},
    ],
    "checklist": [
        "Пишу Dockerfile с явным WORKDIR и CMD",
        "Кэширую npm ci отдельным слоем",
        "Использую .dockerignore",
        "Не кладу секреты через ENV в Dockerfile",
    ],
    "links": [{"title": "Docker: Dockerfile reference", "url": "https://docs.docker.com/reference/dockerfile/"}],
    "glossary": [
        {"term": "образ", "meaning": "Шаблон файловой системы приложения.", "example": "myapi:1.0"},
        {"term": "контейнер", "meaning": "Запущенный процесс из образа.", "example": "docker run"},
        {"term": "слой", "meaning": "Кэшируемый шаг Dockerfile.", "example": "RUN npm ci"},
    ],
}

UPDATES["devops-04"] = {
    "theory": [
        p(
            "Compose описывает несколько сервисов в docker-compose.yml: api, postgres, redis. "
            "docker compose up поднимает сеть между ними по имени сервиса."
        ),
        h("Volumes для данных"),
        p(
            "postgres data в named volume, иначе данные исчезнут при down. bind mount ./uploads для dev файлов."
        ),
        h("depends_on и healthcheck"),
        p(
            "API стартует после postgres с healthcheck pg_isready — иначе migration упадёт на connect."
        ),
    ],
    "codeExample": (
        "services:\n"
        "  db:\n"
        "    image: postgres:16\n"
        "    environment:\n"
        "      POSTGRES_PASSWORD: dev\n"
        "    volumes:\n"
        "      - pgdata:/var/lib/postgresql/data\n"
        "  api:\n"
        "    build: .\n"
        "    ports: [\"3000:3000\"]\n"
        "    depends_on:\n"
        "      db:\n"
        "        condition: service_healthy"
    ),
    "practice": [
        {"title": "up -d", "description": "docker compose up -d, docker compose ps — все healthy/running."},
        {"title": "Миграция в compose", "description": "Команда или entrypoint api ждёт БД и гоняет migrate перед start."},
        {"title": "down и volume", "description": "compose down без -v сохраняет данные. С -v — чистая БД. Проверь разницу."},
    ],
    "checklist": [
        "Связываю api с postgres по hostname сервиса",
        "Храню postgres data в volume",
        "Пробрасываю только нужные порты наружу",
        "Использую compose для локального full stack",
    ],
    "links": [{"title": "Docker Compose", "url": "https://docs.docker.com/compose/"}],
    "glossary": [
        {"term": "compose", "meaning": "Оркестрация нескольких контейнеров.", "example": "docker compose up"},
        {"term": "volume", "meaning": "П persistent storage Docker.", "example": "pgdata"},
        {"term": "service", "meaning": "Именованный контейнер в compose.", "example": "api:"},
    ],
}

UPDATES["devops-05"] = {
    "theory": [
        p(
            "Multistage Dockerfile: stage build с devDependencies, stage runtime только dist и prod deps. "
            "Образ с 800 MB → 120 MB — быстрее pull и меньше attack surface."
        ),
        h("AS build"),
        p(
            "FROM node:22-alpine AS build … npm run build. FROM node:22-alpine AS runtime COPY --from=build /app/dist dist."
        ),
        h("Non-root user"),
        p(
            "USER node в финальном stage — процесс не root внутри контейнера."
        ),
    ],
    "codeExample": (
        "FROM node:22-alpine AS build\n"
        "WORKDIR /app\n"
        "COPY package*.json ./\n"
        "RUN npm ci\n"
        "COPY . .\n"
        "RUN npm run build\n\n"
        "FROM node:22-alpine\n"
        "WORKDIR /app\n"
        "COPY --from=build /app/dist ./dist\n"
        "COPY package*.json ./\n"
        "RUN npm ci --omit=dev\n"
        "USER node\n"
        "CMD [\"node\", \"dist/index.js\"]"
    ),
    "practice": [
        {"title": "Сравни размер", "description": "docker images до и после multistage — запиши MB."},
        {"title": "Убери devDeps", "description": "Убедись, что typescript не в финальном слое (docker history или dive)."},
        {"title": "USER node", "description": "docker exec whoami внутри контейнера — node, не root."},
    ],
    "checklist": [
        "Разделяю build и runtime stages",
        "Копирую в финал только нужные артефакты",
        "Ставлю --omit=dev в runtime",
        "Запускаю процесс не от root",
    ],
    "links": [{"title": "Docker multistage builds", "url": "https://docs.docker.com/build/building/multi-stage/"}],
    "glossary": [
        {"term": "multistage", "meaning": "Несколько FROM в одном Dockerfile.", "example": "AS build"},
        {"term": "runtime", "meaning": "Фinal образ для запуска.", "example": "только dist"},
        {"term": "attack surface", "meaning": "Меньше пакетов — меньше дыр.", "example": "без gcc"},
    ],
}

UPDATES["devops-06"] = {
    "theory": [
        p(
            "GitHub Actions на push/PR: checkout, setup-node, npm ci, lint, test, build. "
            "Красный CI блокирует merge если включена branch protection."
        ),
        h("Кэш npm"),
        p(
            "actions/setup-node cache: npm ускоряет повторные прогоны. matrix node 20/22 — опционально."
        ),
        h("Secrets в CI"),
        p(
            "DATABASE_URL test в GitHub Secrets, не в yaml plaintext."
        ),
    ],
    "codeExample": (
        "name: CI\n"
        "on: [pull_request, push]\n"
        "jobs:\n"
        "  test:\n"
        "    runs-on: ubuntu-latest\n"
        "    steps:\n"
        "      - uses: actions/checkout@v4\n"
        "      - uses: actions/setup-node@v4\n"
        "        with: { node-version: 20, cache: npm }\n"
        "      - run: npm ci\n"
        "      - run: npm run lint\n"
        "      - run: npm test"
    ),
    "practice": [
        {"title": "Workflow файл", "description": ".github/workflows/ci.yml с lint+test. Открой PR — check зелёный."},
        {"title": "Сломай тест", "description": "Временно fail expect, убедись CI красный, откати."},
        {"title": "Artifact build", "description": "upload dist folder как artifact на main для ручной проверки."},
    ],
    "checklist": [
        "CI повторяет команды локального npm test/lint",
        "Использую npm ci, не install в CI",
        "Секреты только через GitHub Secrets",
        "Workflow триггерится на pull_request",
    ],
    "links": [{"title": "GitHub Actions", "url": "https://docs.github.com/en/actions"}],
    "glossary": [
        {"term": "workflow", "meaning": "YAML сценарий CI.", "example": "ci.yml"},
        {"term": "job", "meaning": "Набор steps на runner.", "example": "test:"},
        {"term": "branch protection", "meaning": "Правила merge в main.", "example": "required checks"},
    ],
}

UPDATES["devops-07"] = {
    "theory": [
        p(
            "Vercel/Netlify собирают static/SSR фронт из git. Preview URL на каждый PR — QA без локального запуска."
        ),
        h("Env на хостинге"),
        p(
            "VITE_ / NEXT_PUBLIC_ задаёшь в dashboard per environment. Production vs Preview keys разные."
        ),
        h("Routing SPA"),
        p(
            "vercel.json или _redirects /* → index.html для client-side routes."
        ),
    ],
    "codeExample": (
        "{\n"
        "  \"rewrites\": [{ \"source\": \"/(.*)\", \"destination\": \"/index.html\" }]\n"
        "}"
    ),
    "practice": [
        {"title": "Deploy main", "description": "Подключи репо к Vercel/Netlify, deploy production URL."},
        {"title": "Preview PR", "description": "PR получает preview link в комментарии bot — открой и проверь login."},
        {"title": "Env preview", "description": "VITE_API_URL на preview указывает на staging API, не localhost."},
    ],
    "checklist": [
        "Деплою фронт из git, не ручным ftp",
        "Настраиваю public env в панели хостинга",
        "Проверяю SPA fallback для deep links",
        "Использую preview deploy на PR",
    ],
    "links": [{"title": "Vercel docs", "url": "https://vercel.com/docs"}],
    "glossary": [
        {"term": "preview deploy", "meaning": "Временный URL ветки.", "example": "pr-12.vercel.app"},
        {"term": "rewrite", "meaning": "Правило маршрутизации на CDN.", "example": "SPA fallback"},
        {"term": "build command", "meaning": "npm run build на сервере CI.", "example": "vite build"},
    ],
}

UPDATES["devops-08"] = {
    "theory": [
        p(
            "Backend на Render/Railway/Fly: Dockerfile или nixpacks, PORT из env, health endpoint /health для probe."
        ),
        h("Managed Postgres"),
        p(
            "DATABASE_URL internal URL внутри платформы. SSL mode require. Backup включён на prod тарифе."
        ),
        h("Migrate on deploy"),
        p(
            "Release command prisma migrate deploy или отдельный job перед switch traffic."
        ),
    ],
    "codeExample": (
        "const port = Number(process.env.PORT) || 3000;\n"
        "app.get('/health', (_req, res) => res.json({ ok: true }));\n"
        "app.listen(port, () => console.log(`listening ${port}`));"
    ),
    "practice": [
        {"title": "Deploy API", "description": "Подними API на Render/Railway с env DATABASE_URL и JWT_SECRET."},
        {"title": "Health check", "description": "Настрой health path /health в панели — сервис не ready без 200."},
        {"title": "Связка с фронтом", "description": "Production VITE_API_URL указывает на новый API URL, CORS разрешает frontend origin."},
    ],
    "checklist": [
        "Слушаю process.env.PORT",
        "Отдаю /health для платформы",
        "Гоняю migrations при деплое",
        "Настраиваю CORS под prod frontend URL",
    ],
    "links": [{"title": "Render deploy", "url": "https://render.com/docs/deploy-node-express"}],
    "glossary": [
        {"term": "health check", "meaning": "Probe живости сервиса.", "example": "GET /health"},
        {"term": "managed DB", "meaning": "Postgres от платформы.", "example": "Render PostgreSQL"},
        {"term": "release command", "meaning": "Скript до старта app.", "example": "migrate deploy"},
    ],
}

UPDATES["devops-09"] = {
    "theory": [
        p(
            "nginx reverse proxy: 443 → localhost:3000 API, static фронт или отдельный upstream. "
            "Let's Encrypt certbot --nginx выдаёт бесплатный TLS."
        ),
        h("server blocks"),
        p(
            "server_name api.example.com; location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; }"
        ),
        h("HTTPS redirect"),
        p(
            "listen 80 return 301 https://$host$request_uri; HSTS только когда cert стабилен."
        ),
    ],
    "codeExample": (
        "server {\n"
        "  listen 443 ssl;\n"
        "  server_name api.example.com;\n"
        "  location / {\n"
        "    proxy_pass http://127.0.0.1:3000;\n"
        "    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
        "  }\n"
        "}"
    ),
    "practice": [
        {"title": "nginx config test", "description": "sudo nginx -t после правки. reload без downtime."},
        {"title": "certbot", "description": "Получи cert на тестовый домен, проверь https в браузере padlock."},
        {"title": "proxy headers", "description": "API видит X-Forwarded-Proto https для secure cookies."},
    ],
    "checklist": [
        "Проксирую API через nginx, не открываю 3000 наружу",
        "Проверяю nginx -t перед reload",
        "Настраиваю auto-renew certbot timer",
        "Передаю forwarded headers в upstream",
    ],
    "links": [{"title": "Let's Encrypt", "url": "https://letsencrypt.org/getting-started/"}],
    "glossary": [
        {"term": "reverse proxy", "meaning": "Передний сервер к backend.", "example": "nginx → Node"},
        {"term": "TLS", "meaning": "Шифрование HTTPS.", "example": "Let's Encrypt"},
        {"term": "upstream", "meaning": "Backend за proxy.", "example": "127.0.0.1:3000"},
    ],
}

UPDATES["devops-10"] = {
    "theory": [
        p(
            "Sentry ловит необработанные exceptions на клиенте и сервере с stack, release, user id. "
            "Uptime robot пингует /health каждые 5 мин."
        ),
        h("Structured logs"),
        p(
            "JSON log с level, requestId, msg — проще искать в Loki/CloudWatch, чем console.log mix."
        ),
        h("Alert fatigue"),
        p(
            "Алерт только на SLO: 5xx rate, downtime > 2 min. Не шли email на каждый 404."
        ),
    ],
    "codeExample": (
        "import * as Sentry from \"@sentry/node\";\n"
        "Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });\n"
        "app.use(Sentry.Handlers.requestHandler());"
    ),
    "practice": [
        {"title": "Sentry test event", "description": "Кнопка /debug-sentry или throw в dev — event в dashboard."},
        {"title": "Uptime monitor", "description": "UptimeRobot/Better Stack на production URL /health."},
        {"title": "requestId", "description": "Middleware добавляет x-request-id в log line на каждый request."},
    ],
    "checklist": [
        "Подключил Sentry DSN через env",
        "Мониторю uptime публичного /health",
        "Логирую ошибки с контекстом, не только message",
        "Не алерчу на шумные 404",
    ],
    "links": [{"title": "Sentry for Node", "url": "https://docs.sentry.io/platforms/javascript/guides/node/"}],
    "glossary": [
        {"term": "DSN", "meaning": "URL проекта Sentry.", "example": "SENTRY_DSN"},
        {"term": "uptime", "meaning": "Доступность сервиса снаружи.", "example": "99.9%"},
        {"term": "requestId", "meaning": "Корреляция логов одного запроса.", "example": "uuid v4"},
    ],
}

UPDATES["devops-11"] = {
    "theory": [
        p(
            "Релиз на prod: backup БД, migrate deploy, smoke test, мониторинг 30 мин. "
            "Откат — предыдущий image tag и reverse migration если безопасно."
        ),
        h("Backup"),
        p(
            "pg_dump cron в S3. Проверяй restore на staging раз в месяц — backup без restore — иллюзия."
        ),
        h("Zero-downtime осторожно"),
        p(
            "Expand-contract migrations: добавь column nullable, deploy code, backfill, потом NOT NULL."
        ),
    ],
    "codeExample": (
        "pg_dump \"$DATABASE_URL\" -Fc -f backup-$(date +%F).dump\n"
        "# restore test:\n"
        "pg_restore -d postgres_test backup.dump"
    ),
    "practice": [
        {"title": "Runbook", "description": "Markdown DEPLOY.md: шаги deploy + rollback + контакты."},
        {"title": "Backup manual", "description": "Сделай dump учебной БД, создай пустую БД, restore одну таблицу."},
        {"title": "Migration drill", "description": "Добавь nullable column, deploy, заполни, сделай NOT NULL во втором релизе — опиши в runbook."},
    ],
    "checklist": [
        "Делаю backup перед рискованной migration",
        "Знаю команду отката на предыдущий image",
        "Проверяю smoke после deploy",
        "Документирую runbook, не держу в голове",
    ],
    "links": [{"title": "PostgreSQL backup", "url": "https://www.postgresql.org/docs/current/backup.html"}],
    "glossary": [
        {"term": "runbook", "meaning": "Инструкция операций prod.", "example": "DEPLOY.md"},
        {"term": "rollback", "meaning": "Возврат предыдущей версии.", "example": "docker tag prev"},
        {"term": "pg_dump", "meaning": "Логический backup Postgres.", "example": "-Fc custom format"},
    ],
}

UPDATES["devops-12"] = {
    "theory": [
        p(
            "CDN кэширует static assets по edge — пользователь в EU получает js с ближнего PoP. "
            "Cache-Control: immutable для hashed файлов Vite."
        ),
        h("Стоимость free tier"),
        p(
            "Следи за egress DB, build minutes, serverless invocations. Alarm на 80% лимита."
        ),
        h("API cache осторожно"),
        p(
            "Не кэшируй персональные GET без Vary. stale-while-revalidate для public read."
        ),
    ],
    "codeExample": (
        "# nginx static\n"
        "location /assets/ {\n"
        "  add_header Cache-Control \"public, max-age=31536000, immutable\";\n"
        "}"
    ),
    "practice": [
        {"title": "Cache headers", "description": "Проверь в DevTools Network cache-control на index.js vs hashed asset."},
        {"title": "CDN enable", "description": "Cloudflare orange cloud на static subdomain — TTFB на asset из другого региона (online test)."},
        {"title": "Cost sheet", "description": "Таблица: хостинг, DB, email, Sentry — free tier лимиты и твой текущий usage."},
    ],
    "checklist": [
        "Отдаю hashed assets с long cache",
        "Не кэширую authenticated API ответы с CDN по умолчанию",
        "Знаю лимиты free tier своих сервисов",
        "Слежу за размером Docker image и egress",
    ],
    "links": [{"title": "MDN: Cache-Control", "url": "https://developer.mozilla.org/ru/docs/Web/HTTP/Headers/Cache-Control"}],
    "glossary": [
        {"term": "CDN", "meaning": "Сеть кэширующих edge серверов.", "example": "Cloudflare"},
        {"term": "egress", "meaning": "Исходящий трафик из облака.", "example": "DB export"},
        {"term": "immutable", "meaning": "Файл с hash не перезапрашивать.", "example": "app.a1b2.js"},
    ],
}

UPDATES["devops-project"] = {
    "theory": [
        p(
            "Итог DevOps — prod URL с HTTPS, CI на PR, Sentry, uptime. "
            "Фронт и API на согласованных env, compose или PaaS — как договорились в команде."
        ),
        h("Checklist prod"),
        p(
            "Domain, TLS, secrets не в git, migrate, health, monitoring, rollback plan в README."
        ),
        h("Demo для портфолио"),
        p(
            "Живая ссылка + badge CI в README capstone/fullstack проекта."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Production URL", "description": "Открой https://твой-домен в incognito — login работает."},
        {"title": "CI green", "description": "main branch показывает passing Actions."},
        {"title": "Incident table-top", "description": "Опиши на бумаге: «БД упала» — 5 шагов что делаешь по runbook."},
    ],
    "checklist": [
        "Prod работает по HTTPS с валидным cert",
        "CI гоняет lint и test на PR",
        "Sentry и uptime настроены",
        "Есть DEPLOY.md с rollback",
    ],
    "links": [{"title": "Docker docs", "url": "https://docs.docker.com/get-started/"}],
    "glossary": [
        {"term": "production", "meaning": "Боевая среда для пользователей.", "example": "myapp.com"},
        {"term": "CI/CD", "meaning": "Автотесты и доставка кода.", "example": "GitHub Actions"},
        {"term": "smoke test", "meaning": "Быстрая проверка после deploy.", "example": "login OK"},
    ],
}

# --- CAPSTONE ---

UPDATES["capstone-01"] = {
    "theory": [
        p(
            "Capstone начинается с проблемы реального человека: «фрилансер теряет задачи в чатах». "
            "Аудитория — кто страдает, MVP — минимум, за который готовы пользоваться месяц."
        ),
        h("User stories"),
        p(
            "Как <роль>, я хочу <действие>, чтобы <ценность>. INVEST: маленькие, независимые. "
            "Приоритет MoSCoW: Must для защиты, Should если успеешь, Won't в backlog."
        ),
        h("Scope guard"),
        p(
            "Одна платформа, один auth провайдер, один способ оплаты — не три фичи «на будущее» в MVP."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "One-pager продукта", "description": "Страница: проблема, аудитория, 3 user stories Must, метрика успеха (например, 10 регистраций)."},
        {"title": "MoSCoW список", "description": "15 фич разнеси по Must/Should/Won't. Must ≤ 8 пунктов."},
        {"title": "Interview 1 user", "description": "Спроси знакомого из аудитории: «как сейчас решаешь?» — 5 bullet notes."},
    ],
    "checklist": [
        "Формулирую проблему без «ещё один Uber»",
        "Пишу user stories от роли пользователя",
        "Обрезаю MVP до Must",
        "Знаю метрику, по которой пойму что MVP полезен",
    ],
    "links": [{"title": "GitHub Projects", "url": "https://docs.github.com/en/issues/planning-and-tracking-with-projects"}],
    "glossary": [
        {"term": "MVP", "meaning": "Минимум ценности для первых пользователей.", "example": "auth + CRUD"},
        {"term": "user story", "meaning": "Потребность в формате роль-действие-ценность.", "example": "Как автор…"},
        {"term": "MoSCoW", "meaning": "Must/Should/Could/Won't приоритет.", "example": "Must: login"},
    ],
}

UPDATES["capstone-02"] = {
    "theory": [
        p(
            "Figma фиксирует экраны до кода: меньше переделок. Wireframe — серые блоки без пиксель-перфекта, "
            "потом компоненты кнопок, input, card с отступами 8px grid."
        ),
        h("User flow"),
        p(
            "Flow login → dashboard → create → success на одной FigJam доски. "
            "Отметь empty и error состояния на wireframe, не только happy path."
        ),
        h("Design tokens"),
        p(
            "primary color, font-size heading/body, radius — variables в Figma = меньше споров с CSS."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "3 wireframes", "description": "Login, list, detail/create в Figma wireframe mode."},
        {"title": "Component set", "description": "Button primary/secondary disabled, Input error state."},
        {"title": "Mobile width", "description": "Frame 390px — проверь, что список читаем без горизонтального scroll."},
    ],
    "checklist": [
        "Рисую flow до pixel-perfect",
        "Показываю empty и error на макетах",
        "Использую 8px grid для отступов",
        "Экспортирую assets/icons осознанно, не скриншоты всего",
    ],
    "links": [{"title": "Figma Learn", "url": "https://help.figma.com/hc/en-us/categories/360002051613-Figma-Learn"}],
    "glossary": [
        {"term": "wireframe", "meaning": "Черно-белый каркас экрана.", "example": "блоки без цвета"},
        {"term": "design token", "meaning": "Именованные значения стиля.", "example": "color-primary"},
        {"term": "user flow", "meaning": "Последовательность экранов.", "example": "signup → app"},
    ],
}

UPDATES["capstone-03"] = {
    "theory": [
        p(
            "ER-диаграмма: сущности, связи 1-N, ключи. Потом OpenAPI paths и schemas синхронны с таблицами."
        ),
        h("Задачи в доске"),
        p(
            "Epic → issues по слоям: DB migration, API endpoint, UI screen. "
            "Definition of Ready: есть mock и acceptance criteria."
        ),
        h("Оценка"),
        p(
            "T-shirt S/M/L лучше false precision в часах. Buffer 20% на неизвестное."
        ),
    ],
    "codeExample": (
        "paths:\n"
        "  /posts:\n"
        "    get:\n"
        "      responses:\n"
        "        '200': { description: OK }\n"
        "    post:\n"
        "      requestBody: { required: true }"
    ),
    "practice": [
        {"title": "ER sketch", "description": "users, posts, comments (или домен проекта) с FK на диаграмме."},
        {"title": "OpenAPI draft", "description": "5 endpoints Must MVP в openapi.yaml."},
        {"title": "GitHub Project", "description": "Колонки Todo/In Progress/Done, 10 issues из Must list."},
    ],
    "checklist": [
        "Согласовал ER и API schemas",
        "Каждый Must имеет issue",
        "Acceptance criteria в issue текстом",
        "OpenAPI лежит в репо и версионируется",
    ],
    "links": [{"title": "OpenAPI", "url": "https://swagger.io/specification/"}],
    "glossary": [
        {"term": "ER", "meaning": "Entity-Relationship модель данных.", "example": "users 1—N posts"},
        {"term": "OpenAPI", "meaning": "YAML/JSON описание REST API.", "example": "paths /posts"},
        {"term": "acceptance criteria", "meaning": "Условия готовности задачи.", "example": "POST возвращает 201"},
    ],
}

UPDATES["capstone-04"] = {
    "theory": [
        p(
            "Backend capstone: migrations, auth, roles, CRUD, бизнес-правила (не только прокси к ORM). "
            "Layered: routes → services → repo."
        ),
        h("Auth и roles"),
        p(
            "JWT или session cookie, middleware requireAuth, requireRole('admin') на опасных routes."
        ),
        h("Validation everywhere"),
        p(
            "zod на body/query. 409 на conflict, 404 not found, не 500 на ожидаемые кейсы."
        ),
    ],
    "codeExample": (
        "router.post('/posts', requireAuth, async (req, res) => {\n"
        "  const input = createPostSchema.parse(req.body);\n"
        "  const post = await postsService.create(input, req.user.id);\n"
        "  res.status(201).json(post);\n"
        "});"
    ),
    "practice": [
        {"title": "Auth endpoints", "description": "register/login/me/logout с тестами supertest."},
        {"title": "CRUD Must entity", "description": "Posts/tasks: create list update delete с owner check."},
        {"title": "Admin route", "description": "GET /admin/users только admin — 403 для user."},
    ],
    "checklist": [
        "Миграции в git, не ручной SQL на prod",
        "Валидация на каждом mutating endpoint",
        "Права проверяю на сервере",
        "Логирую ошибки без stack клиенту",
    ],
    "links": [{"title": "Express routing", "url": "https://expressjs.com/en/guide/routing.html"}],
    "glossary": [
        {"term": "middleware", "meaning": "Цепочка обработки запроса.", "example": "requireAuth"},
        {"term": "migration", "meaning": "Версионированное изменение схемы БД.", "example": "prisma migrate"},
        {"term": "403", "meaning": "Нет прав при валидной auth.", "example": "не admin"},
    ],
}

UPDATES["capstone-05"] = {
    "theory": [
        p(
            "Frontend capstone: роутинг, формы, списки с loading/error/empty, админ-экран. "
            "Данные с твоего API, не mock json после первой недели."
        ),
        h("State data vs UI"),
        p(
            "Server state — react-query/SWR или fetch hooks. UI state — modal open локально."
        ),
        h("Accessibility basics"),
        p(
            "label на input, focus visible, keyboard submit формы."
        ),
    ],
    "codeExample": (
        "const { data, isLoading, error } = useQuery({ queryKey: ['posts'], queryFn: () => api('/posts') });\n"
        "if (isLoading) return <Skeleton />;\n"
        "if (error) return <ErrorPanel />;"
    ),
    "practice": [
        {"title": "Экраны Must", "description": "Все wireframes из capstone-02 реализованы и ходят в API."},
        {"title": "Form validation", "description": "zod + сообщения под полями, submit disabled while pending."},
        {"title": "Admin UI", "description": "Таблица users/posts с action ban/delete и confirm modal."},
    ],
    "checklist": [
        "Подключил API base URL из env",
        "Обработал loading/error/empty на списках",
        "Protected routes для личного кабинета",
        "Админ UI скрыт без role admin на API",
    ],
    "links": [{"title": "React Router", "url": "https://reactrouter.com/en/main"}],
    "glossary": [
        {"term": "server state", "meaning": "Данные с API, кэш запросов.", "example": "useQuery"},
        {"term": "controlled input", "meaning": "value+onChange из React state.", "example": "form email"},
        {"term": "modal", "meaning": "Диалог поверх страницы.", "example": "confirm delete"},
    ],
}

UPDATES["capstone-06"] = {
    "theory": [
        p(
            "Перед защитой: тесты на auth/CRUD, Lighthouse performance/accessibility ≥ согласованный порог, "
            "OWASP базово — rate limit login, helmet, CORS."
        ),
        h("Lighthouse"),
        p(
            "Прогон на production URL incognito. Картинки webp, lazy, bundle analyze vite."
        ),
        h("Security checklist"),
        p(
            "Secrets в env, bcrypt passwords, CSRF если cookie session, upload mime check."
        ),
    ],
    "codeExample": (
        "import helmet from \"helmet\";\n"
        "app.use(helmet());\n"
        "app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));"
    ),
    "practice": [
        {"title": "Lighthouse report", "description": "PDF или скрин Performance/Accessibility, 3 улучшения из suggestions."},
        {"title": "Security pass", "description": "Пройди OWASP чеклист проекта: отметь 10 пунктов done/not applicable."},
        {"title": "Test gate", "description": "CI: unit+integration+e2e green на main."},
    ],
    "checklist": [
        "Знаю свой Lighthouse score на prod",
        "Нет секретов и default passwords",
        "Rate limit на auth endpoints",
        "Критичные пути покрыты тестами",
    ],
    "links": [{"title": "OWASP Top 10", "url": "https://owasp.org/www-project-top-ten/"}],
    "glossary": [
        {"term": "Lighthouse", "meaning": "Аudit perf/a11y/SEO в Chrome.", "example": "score 90+"},
        {"term": "helmet", "meaning": "HTTP security headers middleware.", "example": "X-Frame-Options"},
        {"term": "rate limit", "meaning": "Лимит запросов с IP.", "example": "100/15min"},
    ],
}

UPDATES["capstone-07"] = {
    "theory": [
        p(
            "Деплой capstone = devops-project: HTTPS домен, CI, env, migrate, Sentry. "
            "Demo URL в README и резюме."
        ),
        h("Pre-flight"),
        p(
            "Smoke: register, create, logout/login, admin action. Rollback tag предыдущего образа записан."
        ),
        h("Monitoring week 1"),
        p(
            "Первые 7 дней смотри Sentry и uptime daily — hotfix быстрее, чем «узнал от пользователя»."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Public demo", "description": "HTTPS URL работает с мобильного LTE, не только Wi‑Fi дома."},
        {"title": "CI deploy", "description": "Push main → deploy автоматом или one-click workflow."},
        {"title": "Status page", "description": "README badge + ссылка /health JSON ok:true."},
    ],
    "checklist": [
        "Prod URL в README capstone",
        "CI/CD и secrets настроены",
        "Smoke checklist пройден на prod",
        "Есть plan B rollback",
    ],
    "links": [{"title": "GitHub Actions deploy", "url": "https://docs.github.com/en/actions/deployment"}],
    "glossary": [
        {"term": "demo URL", "meaning": "Публичная ссылка на продукт.", "example": "https://my.app"},
        {"term": "hotfix", "meaning": "Срочный патч на prod.", "example": "auth bug"},
        {"term": "pre-flight", "meaning": "Проверки перед go-live.", "example": "smoke tests"},
    ],
}

UPDATES["capstone-08"] = {
    "theory": [
        p(
            "Защита — 10–15 мин demo live + архитектура + trade-offs. "
            "Комиссия спрашивает «почему Postgres», «как auth», «что бы сделал с time»."
        ),
        h("Структура рассказа"),
        p(
            "Problem → MVP → demo → stack diagram → challenges → metrics → next steps. Не читай слайды монотонно."
        ),
        h("Q&A"),
        p(
            "Не знаешь — честно + как найдёшь ответ. Связывай ответ с кодом в репо."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Rehearsal 15 min", "description": "Запиши себя на видео, таймер. Уложись, вырежи 5 мин воды."},
        {"title": "10 вопросов", "description": "Список likely questions + ответы bullet (auth, scale, tests)."},
        {"title": "Backup plan", "description": "Если demo падает — скрин/GIF и postmortem одной фразой что сломалось."},
    ],
    "checklist": [
        "Demo сценарий отрепетирован без импровизации login",
        "Могу нарисовать архитектуру за 2 минуты",
        "Назвал 3 trade-off MVP consciously",
        "GitHub README открывается за 1 клик с judges",
    ],
    "links": [{"title": "Presentation Zen (структура)", "url": "https://www.presentationzen.com/"}],
    "glossary": [
        {"term": "trade-off", "meaning": "Осознанный компромисс в решении.", "example": "SPA vs SEO"},
        {"term": "live demo", "meaning": "Показ работающего prod.", "example": "create post"},
        {"term": "postmortem", "meaning": "Разбор инцидента без blame.", "example": "demo fail DNS"},
    ],
}

UPDATES["capstone-project"] = {
    "theory": [
        p(
            "Итог курса — полноценный сайт по чеклисту минимальных требований: auth, CRUD, admin или realtime, "
            "tests, deploy HTTPS, README, защита."
        ),
        h("Критерии сдачи"),
        p(
            "Сверь docx/pdf критерии курса построчно. Must галочки в таблице в README."
        ),
        h("Портфолио"),
        p(
            "Case study: проблема, роль, stack, скрин, ссылка, цифра (tests count, Lighthouse)."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Checklist docx", "description": "Таблица требований курса: done/partial/link."},
        {"title": "Case study", "description": "500 слов на сайте портфолио о capstone."},
        {"title": "Submit package", "description": "Repo link + demo + короткое видео защиты в форме сдачи."},
    ],
    "checklist": [
        "Все Must требования курса закрыты",
        "Demo и repo public или с access для проверяющего",
        "Case study опубликован",
        "Готов ответить на вопросы по своему коду",
    ],
    "links": [{"title": "GitHub README guide", "url": "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes"}],
    "glossary": [
        {"term": "case study", "meaning": "История проекта для employer.", "example": "problem→solution"},
        {"term": "acceptance", "meaning": "Формальная сдача по критериям.", "example": "checklist docx"},
        {"term": "deliverable", "meaning": "Артефакт сдачи.", "example": "video + URL"},
    ],
}

# --- CAREER ---

UPDATES["career-01"] = {
    "theory": [
        p(
            "Рынок junior переполнен шаблонными резюме. Intern — стажировка с ментором, Trainee — обучение на месте, "
            "Junior — самостоятельные задачи с review."
        ),
        h("Читать вакансию"),
        p(
            "Stack must vs nice-to-have. «2 года опыта» иногда гибко при сильном портфолио — откликайся, если Must совпадает на 60%+."
        ),
        h("География и формат"),
        p(
            "Remote/hybrid/office влияет на пробки и налоги. Уточни испытательный срок и формат review."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Разбор 5 вакансий", "description": "HH/LinkedIn: выпиши Must stack, red flags («бесплатно для опыта»)."},
        {"title": "Твой уровень", "description": "Честно: Intern/Junior/Strong junior — одно предложение доказательства из capstone."},
        {"title": "Карта компаний", "description": "10 компаний куда целишься: продукт/аутсорс/стартап — по 2 строки почему."},
    ],
    "checklist": [
        "Отличаю Intern Trainee Junior по описанию",
        "Выделяю must-have stack в вакансии",
        "Замечаю токсичные red flags",
        "Знаю свой целевой формат работы",
    ],
    "links": [{"title": "MDN Learn", "url": "https://developer.mozilla.org/ru/docs/Learn_web_development"}],
    "glossary": [
        {"term": "junior", "meaning": "Младший dev с менторством.", "example": "задачи с review"},
        {"term": "must-have", "meaning": "Обязательный стек в вакансии.", "example": "React+TS"},
        {"term": "испытательный срок", "meaning": "Период оценки нового сотрудника.", "example": "3 месяца"},
    ],
}

UPDATES["career-02"] = {
    "theory": [
        p(
            "GitHub — вторая визитка: pinned repos capstone и fullstack, README с demo gif, осмысленные commits."
        ),
        h("Сайт-портфолио"),
        p(
            "Один экран hero, 2–3 проекта, контакты, ссылка на PDF резюме. Dark mode опционально, mobile обязательно."
        ),
        h("README проекта"),
        p(
            "Problem, stack, setup, demo link, screenshots, test badge. «How I built auth» короткий paragraph."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Pin 3 repos", "description": "GitHub profile pinned: capstone, fullstack, лучший учебный модуль."},
        {"title": "README capstone", "description": "GIF login→create, badges CI, stack icons."},
        {"title": "Portfolio deploy", "description": "Личный сайт на Vercel с case study capstone."},
    ],
    "checklist": [
        "Pinned repos отражают лучшие работы",
        "У каждого repo есть README с demo",
        "Портфолио открывается с телефона",
        "Commit history не «initial commit» один",
    ],
    "links": [{"title": "GitHub profile README", "url": "https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme"}],
    "glossary": [
        {"term": "pinned repo", "meaning": "Закреплённые репозитории профиля.", "example": "до 6 штук"},
        {"term": "case study", "meaning": "Описание проекта для employer.", "example": "capstone story"},
        {"term": "demo GIF", "meaning": "Короткая запись экрана.", "example": "login flow"},
    ],
}

UPDATES["career-03"] = {
    "theory": [
        p(
            "Резюме junior — 1 страница: контакты, summary 2 строки, skills группами, projects с метриками, education."
        ),
        h("Без воды"),
        p(
            "Не «ответственный исполнитель». Вместо «знаю React» — «capstone: React+TS, 40 tests, Lighthouse 92»."
        ),
        h("ATS"),
        p(
            "PDF простой layout, ключевые слова из вакансии естественно в skills/projects. Не таблицы в Word кривые."
        ),
    ],
    "codeExample": (
        "Summary: Junior frontend (React, TypeScript). Capstone — SaaS с auth, 3 E2E, prod HTTPS.\n"
        "Project: TaskFlow — React, Node, Postgres — github.com/… — demo …"
    ),
    "practice": [
        {"title": "One page CV", "description": "Сожми до 1 стр, 12pt, проверь на телефоне PDF."},
        {"title": "3 bullet metrics", "description": "К каждому проекту: тесты, users, perf score или commits count."},
        {"title": "Peer review", "description": "Попроси одногруппника вычеркнуть 3 клише — перепиши."},
    ],
    "checklist": [
        "Резюме умещается на одну страницу",
        "Projects с ссылками и цифрами",
        "Нет фото и «хобби рыбалка» без запроса",
        "Skills совпадают с реальным кодом в GitHub",
    ],
    "links": [{"title": "Harvard CS resume tips", "url": "https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/"}],
    "glossary": [
        {"term": "ATS", "meaning": "Система парсинга резюме employer.", "example": "keyword match"},
        {"term": "summary", "meaning": "2 строки позиционирования.", "example": "Junior full-stack…"},
        {"term": "bullet", "meaning": "Пункт достижения с глаголом.", "example": "Built auth with JWT"},
    ],
}

UPDATES["career-04"] = {
    "theory": [
        p(
            "LinkedIn headline: «Junior Full-stack | React, Node | Open to work». "
            "About — capstone link и чем помогаешь бизнесу, не список курсов."
        ),
        h("Cold message"),
        p(
            "3 предложения: кто ты, что понравилось в компании/продукте, конкретный ask — 15 мин advice или referral."
        ),
        h("Сеть без спама"),
        p(
            "Комментируй посты инженеров по делу. Не «дай работу» в первом сообщении."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "LinkedIn refresh", "description": "Headline, About, Featured link demo, Open to work toggle."},
        {"title": "5 messages", "description": "Черновики 5 персонализированных cold messages — не отправляй шаблон один в один."},
        {"title": "Engage", "description": "3 содержательных комментария под постами dev за неделю."},
    ],
    "checklist": [
        "Headline отражает junior stack честно",
        "Featured ведёт на demo или GitHub",
        "Cold message персонализирован",
        "Не прошу работу без контекста ценности",
    ],
    "links": [{"title": "LinkedIn profile tips", "url": "https://www.linkedin.com/help/linkedin/answer/a1340406"}],
    "glossary": [
        {"term": "headline", "meaning": "Строка под именем в LinkedIn.", "example": "Junior React dev"},
        {"term": "cold outreach", "meaning": "Первый контакт без знакомства.", "example": "advice 15 min"},
        {"term": "referral", "meaning": "Рекомендация сотрудника в HR.", "example": "internal refer"},
    ],
}

UPDATES["career-05"] = {
    "theory": [
        p(
            "Easy алгоритмы на собесе: массивы, строки, hash map для подсчёта, two pointers, stack для скобок, BFS/DFS базово."
        ),
        h("O-нотация"),
        p(
            "O(n) loop, O(n²) nested loops. Hash map часто превращает O(n²) в O(n)."
        ),
        h("Как решать"),
        p(
            "Пример руками, brute force, оптимизация, код, тест edge empty/single. Говори вслух на mock."
        ),
    ],
    "codeExample": (
        "function twoSum(nums: number[], target: number) {\n"
        "  const seen = new Map<number, number>();\n"
        "  for (let i = 0; i < nums.length; i++) {\n"
        "    const need = target - nums[i];\n"
        "    if (seen.has(need)) return [seen.get(need)!, i];\n"
        "    seen.set(nums[i], i);\n"
        "  }\n"
        "  return [];\n"
        "}"
    ),
    "practice": [
        {"title": "5 LeetCode Easy", "description": "Two sum, valid parentheses, merge strings, max profit, contains duplicate — без подглядывания solution 30 мин каждая."},
        {"title": "Complexity aloud", "description": "Для каждой задачи произнеси time/space complexity."},
        {"title": "Anki O()", "description": "10 карточек: операция → сложность (sort, hash lookup)."},
    ],
    "checklist": [
        "Решаю easy за 25–35 мин с тестами",
        "Использую Map/Set где нужен counting",
        "Объясняю сложность вслух",
        "Проверяю edge cases перед submit",
    ],
    "links": [{"title": "LeetCode", "url": "https://leetcode.com/problemset/"}],
    "glossary": [
        {"term": "hash map", "meaning": "Структура key→value за O(1) access.", "example": "Map in JS"},
        {"term": "two pointers", "meaning": "Два индекса по массиву.", "example": "sorted pair sum"},
        {"term": "O(n)", "meaning": "Линейное время.", "example": "один проход"},
    ],
}

UPDATES["career-06"] = {
    "theory": [
        p(
            "Теория JS: event loop, microtasks, closure, prototype vs class. React: virtual DOM, hooks rules, keys. "
            "Node: single thread + libuv. SQL: JOIN, index когда."
        ),
        h("Формат ответа"),
        p(
            "Определение → пример из capstone → trade-off. 2 минуты, не лекция 10 мин."
        ),
        h("Что часто спрашивают"),
        p(
            "useEffect deps, REST vs GraphQL одной фразой, transaction ACID, JWT vs session cookie."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Flashcards 20", "description": "20 вопросов JS/React/Node/SQL с ответами bullet — Anki или paper."},
        {"title": "Mock 30 min", "description": "Друг задаёт 10 вопросов, ты отвечаешь без Google."},
        {"title": "Capstone tie-in", "description": "К 5 ответам добавь «у меня в проекте это…» с файлом/модулем."},
    ],
    "checklist": [
        "Объясняю event loop простыми словами",
        "Знаю правила hooks и зачем keys",
        "Описываю JOIN на примере своей БД",
        "Связываю теорию с capstone кодом",
    ],
    "links": [{"title": "MDN JavaScript", "url": "https://developer.mozilla.org/ru/docs/Web/JavaScript"}],
    "glossary": [
        {"term": "event loop", "meaning": "Цикл обработки задач JS.", "example": "microtask queue"},
        {"term": "closure", "meaning": "Функция помнит внешние переменные.", "example": "counter factory"},
        {"term": "JOIN", "meaning": "Соединение таблиц SQL.", "example": "users JOIN posts"},
    ],
}

UPDATES["career-07"] = {
    "theory": [
        p(
            "System design для junior — не Kafka, а твой capstone: browser → CDN → React → API → Postgres, где auth, где files."
        ),
        h("Диаграмма"),
        p(
            "Прямоугольники и стрелки: протокол HTTPS, JSON REST, optional Redis cache, S3 uploads."
        ),
        h("Scale one line"),
        p(
            "«При 10x users добавлю read replica и CDN static» — показывает мышление без overengineering."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Draw architecture", "description": "Excalidraw 5 компонентов capstone, подпиши протоколы."},
        {"title": "3 min pitch", "description": "Объясни архитектуру вслух за 3 мин без жаргона."},
        {"title": "Bottleneck", "description": "Один узкий место и как мониторишь (Sentry, slow query log)."},
    ],
    "checklist": [
        "Рисую capstone architecture за 5 минут",
        "Называю протоколы между блоками",
        "Указываю где stateful vs stateless",
        "Предлагаю один realistic scale step",
    ],
    "links": [{"title": "Excalidraw", "url": "https://excalidraw.com/"}],
    "glossary": [
        {"term": "stateless API", "meaning": "Сервер не хранит session в памяти процесса.", "example": "JWT"},
        {"term": "reverse proxy", "meaning": "nginx перед Node.", "example": "TLS termination"},
        {"term": "read replica", "meaning": "Копия БД для чтения.", "example": "reports"},
    ],
}

UPDATES["career-08"] = {
    "theory": [
        p(
            "Test assignment: прочитай ТЗ дважды, уточни 1–2 вопроса HR, оцени время ×1.5. "
            "Сдай README, tests, чистый git history."
        ),
        h("Transparency"),
        p(
            "Если использовал Copilot — опиши где. Не copy stackoverflow без понимания — live coding потом."
        ),
        h("Scope"),
        p(
            "Лучше меньше polished Must, чем половина ТЗ с багами. DEPLOY optional если не просили."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Parse TZ", "description": "Возьми публичное sample TZ, выпиши Must/Nice/Questions email draft."},
        {"title": "Timebox plan", "description": "8 часов: 1 design, 4 core, 2 tests, 1 README."},
        {"title": "Submit checklist", "description": "Repo public, npm i && npm test works, no .env committed."},
    ],
    "checklist": [
        "Читаю ТЗ и задаю уточняющие вопросы",
        "Сдаю с README и тестами",
        "Укладываюсь в дедлайн с buffer",
        "Коммиты осмысленные conventional",
    ],
    "links": [{"title": "GitHub README", "url": "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes"}],
    "glossary": [
        {"term": "test assignment", "meaning": "Домашнее ТЗ employer.", "example": "todo app 8h"},
        {"term": "timebox", "meaning": "Жёсткий лимит времени на scope.", "example": "4h MVP"},
        {"term": "Must scope", "meaning": "Обязательная часть ТЗ.", "example": "CRUD only"},
    ],
}

UPDATES["career-09"] = {
    "theory": [
        p(
            "Behavioral interview: STAR — Situation, Task, Action, Result. "
            "«Расскажи о конфликте», «ошибка в prod», «сложный дедлайн»."
        ),
        h("Истории заранее"),
        p(
            "5 stories: teamwork, bug, learn fast, disagreement, ownership. 2 мин каждая, метрика result."
        ),
        h("Culture fit"),
        p(
            "Вопросы employer: code review, onboarding, team size — показывают зрелость."
        ),
    ],
    "codeExample": (
        "STAR example skeleton:\n"
        "S: Дедлайн capstone через 3 дня упал deploy\n"
        "T: Восстановить prod\n"
        "A: Rollback, postmortem, fix migration\n"
        "R: Demo сдано вовремя, runbook добавлен"
    ),
    "practice": [
        {"title": "5 STAR stories", "description": "Напиши полные STAR по шаблону, прочитай вслух."},
        {"title": "Record yourself", "description": "Ответ «Tell me about yourself» 90 сек — без «эм» более 3 раз."},
        {"title": "Questions for them", "description": "5 вопросов employer про процесс и growth."},
    ],
    "checklist": [
        "Отвечаю STAR, не потоком сознания",
        "Имею историю про ошибку и урок",
        "Tell me about yourself уложился в 90 сек",
        "Задаю вопросы interviewer в конце",
    ],
    "links": [{"title": "STAR method", "url": "https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/"}],
    "glossary": [
        {"term": "STAR", "meaning": "Формат поведенческого ответа.", "example": "Action→Result"},
        {"term": "behavioral", "meaning": "Вопросы про опыт, не код.", "example": "conflict"},
        {"term": "Tell me about yourself", "meaning": "Открывающий pitch.", "example": "90 sec career arc"},
    ],
}

UPDATES["career-10"] = {
    "theory": [
        p(
            "Offer: gross/net, ИП vs ТК, дМС, удалёнка, stock options paper vs money. "
            "Сравни total comp, не только salary headline."
        ),
        h("Первые 90 дней"),
        p(
            "Неделя 1: setup, codebase tour, deploy doc. Месяц 1: первый merged PR. Месяц 3: feature owner маленькой задачи."
        ),
        h("Negotiate respectfully"),
        p(
            "Junior leverage limited — проси feedback timeline, mentor, learning budget иногда реальнее +20% salary."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Offer table", "description": "2 offers в таблице: salary, format, stack, growth — веса важности."},
        {"title": "90-day plan draft", "description": "Bullet plan первых 12 недель на новой работе (generic template)."},
        {"title": "Negotiation email", "description": "Черновик вежливого вопроса про review 6 months и обучение."},
    ],
    "checklist": [
        "Сравниваю offer holistically",
        "Понимаю испытательный и review cycle",
        "Планирую onboarding learning",
        "Прошу детали письменно, не только созвон",
    ],
    "links": [{"title": "MIT career negotiating", "url": "https://capd.mit.edu/resources/salary-negotiation/"}],
    "glossary": [
        {"term": "gross", "meaning": "Зарплата до налогов.", "example": "150k gross"},
        {"term": "onboarding", "meaning": "Вхождение в команду.", "example": "buddy week 1"},
        {"term": "total comp", "meaning": "Salary+bonus+benefits.", "example": "ДМС+stock"},
    ],
}

UPDATES["career-11"] = {
    "theory": [
        p(
            "После курса не учи всё сразу. Выбери один трек на 6 месяцев: Next.js SSR, NestJS structure, cloud cert, или design systems."
        ),
        h("T-shaped"),
        p(
            "Глубина в React/Node + одна смежная (SQL tuning или a11y). Employer видит focus."
        ),
        h("Learning loop"),
        p(
            "Pet project применяет новое за 2 недели theory — иначе забывается."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "Pick one track", "description": "Запиши выбор и 3 ресурса (official docs first)."},
        {"title": "Roadmap 6 months", "description": "Monthly milestones: project milestones, not course count."},
        {"title": "Drop list", "description": "5 технологий consciously not now — почему."},
    ],
    "checklist": [
        "Выбрал один главный фокус на полгода",
        "Привязал обучение к pet/capstone v2",
        "Не распыляюсь на 4 фреймворка параллельно",
        "Пересматриваю план каждые 6 недель",
    ],
    "links": [{"title": "Next.js docs", "url": "https://nextjs.org/docs"}],
    "glossary": [
        {"term": "T-shaped", "meaning": "Широкая база + одна глубина.", "example": "React deep"},
        {"term": "SSR", "meaning": "Server-side rendering.", "example": "Next.js"},
        {"term": "pet project", "meaning": "Собственный учебный продукт.", "example": "v2 capstone"},
    ],
}

UPDATES["career-project"] = {
    "theory": [
        p(
            "Финал career — портфолио live, резюме PDF, LinkedIn, 10 качественных откликов и одно mock interview с записью."
        ),
        h("Отклик"),
        p(
            "Cover letter 4 предложения: stack match, capstone link, why company, availability."
        ),
        h("Pipeline"),
        p(
            "Трекер: applied → HR → tech → offer. Follow-up через 5–7 дней вежливо."
        ),
    ],
    "codeExample": "",
    "practice": [
        {"title": "10 applications", "description": "10 откликов с персонализацией, таблица статусов."},
        {"title": "Mock interview", "description": "60 min video: tech 30 + behavioral 30, пересмотри запись."},
        {"title": "Portfolio polish", "description": "Все ссылки с portfolio работают, резюме PDF < 500 KB."},
    ],
    "checklist": [
        "Portfolio + GitHub + LinkedIn согласованы",
        "Отправил ≥10 targeted откликов",
        "Прошёл mock interview с feedback",
        "Веду tracker без ghosting себя",
    ],
    "links": [{"title": "MDN Learn", "url": "https://developer.mozilla.org/ru/docs/Learn_web_development"}],
    "glossary": [
        {"term": "mock interview", "meaning": "Пробное собеседование.", "example": "peer 60min"},
        {"term": "cover letter", "meaning": "Короткое сопроводительное.", "example": "4 sentences"},
        {"term": "pipeline", "meaning": "Воронка откликов.", "example": "applied→tech"},
    ],
}
