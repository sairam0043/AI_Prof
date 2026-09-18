import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from '../db/database.js';
import { TutorService } from '../services/tutor-service.js';

export const tutorRouter = Router();

// GET conversations for project
tutorRouter.get('/conversations', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  const userId = (req.query.userId as string) || 'usr_sarah';

  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const conversations = AppDatabase.query(
    `SELECT c.*, COUNT(m.id) as message_count, MAX(m.created_at) as last_message_at
     FROM conversations c
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE c.project_id = ? AND c.user_id = ?
     GROUP BY c.id
     ORDER BY c.updated_at DESC`,
    [projectId, userId]
  );

  res.json({ conversations });
});

// GET messages for a conversation
tutorRouter.get('/conversations/:id/messages', (req: Request, res: Response) => {
  const conversationId = req.params.id;

  const messages = AppDatabase.query(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversationId]
  );

  const parsedMessages = messages.map((m: any) => ({
    ...m,
    citations: m.citations_json ? JSON.parse(m.citations_json) : []
  }));

  res.json({ messages: parsedMessages });
});

// POST create new conversation
tutorRouter.post('/conversations', (req: Request, res: Response) => {
  const { projectId, userId = 'usr_sarah', title = 'New Learning Session' } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const convId = uuidv4();
  AppDatabase.run(
    `INSERT INTO conversations (id, project_id, user_id, title, created_at, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [convId, projectId, userId, title]
  );

  const created = AppDatabase.get('SELECT * FROM conversations WHERE id = ?', [convId]);
  res.status(201).json({ conversation: created });
});

// POST send message (standard response)
tutorRouter.post('/chat', async (req: Request, res: Response) => {
  const { conversationId, projectId, message, userId = 'usr_sarah' } = req.body;

  if (!conversationId || !projectId || !message) {
    return res.status(400).json({ error: 'conversationId, projectId, and message are required' });
  }

  try {
    const tutorResponse = await TutorService.chat({
      conversationId,
      projectId,
      userId,
      userMessage: message
    });

    res.json({ response: tutorResponse });
  } catch (err: any) {
    console.error('[TutorRoute] Chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate tutor response' });
  }
});

// POST SSE Streaming endpoint
tutorRouter.post('/stream', async (req: Request, res: Response) => {
  const { conversationId, projectId, message, userId = 'usr_sarah' } = req.body;

  if (!conversationId || !projectId || !message) {
    return res.status(400).json({ error: 'conversationId, projectId, and message are required' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const tutorResponse = await TutorService.chat({
      conversationId,
      projectId,
      userId,
      userMessage: message,
      onChunk: (chunk: string) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
      }
    });

    // Send final message payload with citations
    res.write(`data: ${JSON.stringify({ type: 'done', message: tutorResponse })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('[TutorRoute] Stream error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Streaming failed' })}\n\n`);
    res.end();
  }
});
