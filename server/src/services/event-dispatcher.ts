import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from '../db/database.js';
import { BackgroundQueue } from './background-queue.js';

export interface LearningEventData {
  user_id: string;
  project_id?: string;
  event_type: 'project_created' | 'material_uploaded' | 'material_processed' | 'tutor_asked' | 'quiz_completed' | 'mastery_updated' | 'mistake_detected';
  payload: Record<string, any>;
}

export class EventDispatcher {
  public static dispatch(event: LearningEventData): void {
    const eventId = uuidv4();
    try {
      AppDatabase.run(
        `INSERT INTO learning_events (id, user_id, project_id, event_type, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          eventId,
          event.user_id,
          event.project_id || null,
          event.event_type,
          JSON.stringify(event.payload)
        ]
      );
    } catch (err) {
      console.error('[EventDispatcher] Failed to log learning event:', err);
    }

    // Trigger downstream async workflows based on event type
    if (event.project_id) {
      if (event.event_type === 'quiz_completed') {
        BackgroundQueue.enqueue('evaluate_quiz_growth', {
          projectId: event.project_id,
          userId: event.user_id,
          quizId: event.payload.quiz_id
        });
      } else if (event.event_type === 'material_processed') {
        BackgroundQueue.enqueue('generate_recommendations', {
          projectId: event.project_id,
          userId: event.user_id,
          reason: 'New study material processed and concepts indexed'
        });
      } else if (event.event_type === 'mistake_detected') {
        BackgroundQueue.enqueue('generate_recommendations', {
          projectId: event.project_id,
          userId: event.user_id,
          reason: `Repeated difficulty detected in concept: ${event.payload.concept_name || 'practice concept'}`
        });
      }
    }
  }
}
