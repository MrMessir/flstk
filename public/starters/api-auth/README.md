# API Auth

Каркас auth поверх blog API: регистрация, вход, JWT, защита от перебора.

```bash
cp .env.example .env     # и впиши свой JWT_SECRET (минимум 32 символа)
npm install
npm run dev
```

Сгенерировать секрет: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Файл `.env` не коммить. Что уже сделано в каркасе: `helmet`, лимит попыток на `/auth/*`,
одинаковый ответ регистрации для существующего email, хеш-пустышка при входе.

Что добавить сам (см. модуль security): refresh-токены, роли и проверку прав на маршрутах,
сброс пароля, httpOnly cookie вместо токена в теле ответа.
