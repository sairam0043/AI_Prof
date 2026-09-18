import express from 'express';
import cors from 'cors';
import path from 'node:path';
import dotenv from 'dotenv';
import { AppDatabase } from './db/database.js';
import { BackgroundQueue } from './services/background-queue.js';
import { DocumentProcessor } from './services/document-processor.js';
import { MasteryService } from './services/mastery-service.js';
import { RecommendationService } from './services/recommendation-service.js';

import { spacesRouter } from './routes/spaces.js';
import { projectsRouter } from './routes/projects.js';
import { materialsRouter } from './routes/materials.js';
import { tutorRouter } from './routes/tutor.js';
import { quizRouter } from './routes/quiz.js';
import { conceptsRouter } from './routes/concepts.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { analyticsRouter } from './routes/analytics.js';
import { adminRouter } from './routes/admin.js';
import { evalRouter } from './routes/eval.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Initialize DB
AppDatabase.getDB();

// Register Background Handlers
BackgroundQueue.registerHandler('process_document', async (payload) => {
  await DocumentProcessor.processMaterial(payload.materialId);
});

BackgroundQueue.registerHandler('evaluate_quiz_growth', async (payload) => {
  await MasteryService.evaluateProjectGrowth(payload.projectId, payload.userId);
  await RecommendationService.generateRecommendations(payload.projectId, payload.userId, 'Quiz Completed');
});

BackgroundQueue.registerHandler('generate_recommendations', async (payload) => {
  await RecommendationService.generateRecommendations(payload.projectId, payload.userId, payload.reason);
});

// Start Background Worker
BackgroundQueue.startWorker();

// Mount Routes
app.use('/api/spaces', spacesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/tutor', tutorRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/concepts', conceptsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/eval', evalRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    features: ['grounded_tutor', 'adaptive_quiz', 'concept_mastery', 'growth_analytics', 'observability']
  });
});

app.listen(PORT, () => {
  console.log(`[AI Study Companion Server] Running on http://localhost:${PORT}`);
});
