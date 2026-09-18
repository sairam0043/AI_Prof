import { Router, Request, Response } from 'express';
import { AppDatabase } from '../db/database.js';
import { QuizService } from '../services/quiz-service.js';

export const quizRouter = Router();

// GET all quizzes for a project
quizRouter.get('/', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const quizzes = AppDatabase.query(
    'SELECT * FROM quizzes WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );

  res.json({ quizzes });
});

// GET single quiz details
quizRouter.get('/:id', (req: Request, res: Response) => {
  const quizId = req.params.id;
  const quiz = QuizService.getQuiz(quizId);

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  res.json({ quiz });
});

// POST generate new adaptive quiz
quizRouter.post('/generate', async (req: Request, res: Response) => {
  const { projectId, focusConceptIds, questionCount = 3, difficulty = 'intermediate', userId = 'usr_sarah' } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  try {
    const quiz = await QuizService.generateQuiz({
      projectId,
      userId,
      focusConceptIds,
      questionCount,
      difficulty
    });

    res.status(201).json({ quiz });
  } catch (err: any) {
    console.error('[QuizRoute] Quiz generation failed:', err);
    res.status(500).json({ error: err.message || 'Failed to generate quiz' });
  }
});

// POST submit answer
quizRouter.post('/submit-answer', async (req: Request, res: Response) => {
  const { quizId, questionId, userAnswer, userId = 'usr_sarah' } = req.body;

  if (!quizId || !questionId || userAnswer === undefined) {
    return res.status(400).json({ error: 'quizId, questionId, and userAnswer are required' });
  }

  try {
    const evaluation = await QuizService.submitAnswer({
      quizId,
      questionId,
      userAnswer,
      userId
    });

    res.json(evaluation);
  } catch (err: any) {
    console.error('[QuizRoute] Answer submission failed:', err);
    res.status(500).json({ error: err.message || 'Failed to submit answer' });
  }
});
