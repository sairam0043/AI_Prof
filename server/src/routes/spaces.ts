import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from '../db/database.js';

export const spacesRouter = Router();

// GET all spaces for current user
spacesRouter.get('/', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr_sarah';
  
  const spaces = AppDatabase.query<{
    id: string;
    user_id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    created_at: string;
    project_count: number;
  }>(
    `SELECT s.*, COUNT(p.id) as project_count
     FROM spaces s
     LEFT JOIN projects p ON p.space_id = s.id
     WHERE s.user_id = ?
     GROUP BY s.id
     ORDER BY s.created_at ASC`,
    [userId]
  );

  res.json({ spaces });
});

// POST create space
spacesRouter.post('/', (req: Request, res: Response) => {
  const { name, description, icon = 'BookOpen', color = '#6366f1', userId = 'usr_sarah' } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Space name is required' });
  }

  const spaceId = uuidv4();
  AppDatabase.run(
    `INSERT INTO spaces (id, user_id, name, description, icon, color, created_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [spaceId, userId, name, description || '', icon, color]
  );

  const created = AppDatabase.get('SELECT * FROM spaces WHERE id = ?', [spaceId]);
  res.status(201).json({ space: created });
});

// DELETE space
spacesRouter.delete('/:id', (req: Request, res: Response) => {
  const spaceId = req.params.id;
  AppDatabase.run('DELETE FROM spaces WHERE id = ?', [spaceId]);
  res.json({ success: true, message: 'Space deleted' });
});
