import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Секрет подписи токенов обязателен: без него сервер не стартует.
// Сгенерируй: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32 || secret.includes('REPLACE_ME')) {
  console.error('Задай JWT_SECRET (минимум 32 символа) в файле .env');
  process.exit(1);
}

const app = express();
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Не больше 20 попыток входа/регистрации с одного IP за 15 минут.
app.use(
  '/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }),
);

const users = new Map();
// Хеш-пустышка: время ответа не выдаёт, существует ли email.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post('/auth/register', async (req, res) => {
  const parsed = credSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Некорректные данные' });
  // Ответ одинаковый, существует email или нет, чтобы не раскрывать аккаунты.
  if (!users.has(parsed.data.email)) {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = { id: randomUUID(), email: parsed.data.email, passwordHash, role: 'user' };
    users.set(user.email, user);
  }
  res.status(201).json({ message: 'Регистрация принята' });
});

app.post('/auth/login', async (req, res) => {
  const parsed = credSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Некорректные данные' });
  const user = users.get(parsed.data.email);
  const valid = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return res.status(401).json({ error: 'Неверный email или пароль' });
  const access = jwt.sign({ sub: user.id, role: user.role }, secret, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
  res.json({ access });
});

app.listen(4000, () => console.log('Auth API http://localhost:4000'));
