import { Router } from 'express';
import { z } from 'zod';
import * as postsService from '../services/postsService.js';

export const postsRouter = Router();
const createSchema = z.object({ title: z.string().min(1), body: z.string().min(1) });

postsRouter.get('/', (_req, res) => {
  res.json(postsService.list());
});

postsRouter.post('/', (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const post = postsService.create(parsed.data);
  res.status(201).json(post);
});
