import express from 'express';
import { postsRouter } from './routes/posts.js';

const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/posts', postsRouter);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API http://localhost:${port}`));
