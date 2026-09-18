import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from '../db/database.js';

export type JobHandler = (payload: any) => Promise<void>;

export class BackgroundQueue {
  private static handlers: Map<string, JobHandler> = new Map();
  private static isRunning = false;
  private static pollIntervalMs = 800;

  public static registerHandler(jobType: string, handler: JobHandler) {
    this.handlers.set(jobType, handler);
  }

  public static enqueue(jobType: string, payload: Record<string, any>): string {
    const jobId = uuidv4();
    AppDatabase.run(
      `INSERT INTO background_jobs (id, type, status, payload_json, retries, max_retries, created_at, updated_at)
       VALUES (?, ?, 'queued', ?, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [jobId, jobType, JSON.stringify(payload)]
    );

    // Trigger immediate loop iteration
    this.processNext();
    return jobId;
  }

  public static startWorker() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[BackgroundQueue] Worker started');

    setInterval(() => {
      this.processNext();
    }, this.pollIntervalMs);
  }

  private static async processNext() {
    const job = AppDatabase.get<{
      id: string;
      type: string;
      status: string;
      payload_json: string;
      retries: number;
      max_retries: number;
    }>(
      `SELECT id, type, status, payload_json, retries, max_retries
       FROM background_jobs
       WHERE status = 'queued'
       ORDER BY created_at ASC
       LIMIT 1`
    );

    if (!job) return;

    // Mark running
    AppDatabase.run(
      `UPDATE background_jobs SET status = 'running', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [job.id]
    );

    const handler = this.handlers.get(job.type);
    if (!handler) {
      console.error(`[BackgroundQueue] No handler registered for job type: ${job.type}`);
      AppDatabase.run(
        `UPDATE background_jobs SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [`No handler registered for ${job.type}`, job.id]
      );
      return;
    }

    try {
      const payload = JSON.parse(job.payload_json);
      await handler(payload);

      AppDatabase.run(
        `UPDATE background_jobs SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [job.id]
      );
      console.log(`[BackgroundQueue] Completed job ${job.id} (${job.type})`);
    } catch (error: any) {
      console.error(`[BackgroundQueue] Job ${job.id} (${job.type}) failed:`, error);
      const nextRetries = job.retries + 1;
      const willRetry = nextRetries < job.max_retries;

      AppDatabase.run(
        `UPDATE background_jobs
         SET status = ?, retries = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [willRetry ? 'queued' : 'failed', nextRetries, error.message || 'Job execution error', job.id]
      );
    }
  }

  public static getJobStatus(jobId: string) {
    return AppDatabase.get(`SELECT * FROM background_jobs WHERE id = ?`, [jobId]);
  }
}
