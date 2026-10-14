import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/posts', async (_req, res) => {
  res.json(await prisma.post.findMany({ orderBy: { createdAt: 'desc' } }));
});
app.post('/posts', async (req, res) => {
  const { title, body } = req.body ?? {};
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  const post = await prisma.post.create({ data: { title, body } });
  res.status(201).json(post);
});

app.listen(4000, () => console.log('API http://localhost:4000'));
