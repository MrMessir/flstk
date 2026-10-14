import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
const tasks = [];
app.get('/tasks', (_req, res) => res.json(tasks));
app.post('/tasks', (req, res) => {
  const task = { id: crypto.randomUUID(), title: String(req.body?.title || '').trim() };
  if (!task.title) return res.status(400).json({ error: 'title required' });
  tasks.push(task);
  res.status(201).json(task);
});
app.listen(4000, () => console.log('API :4000'));
