import { AppDatabase } from '../db/database.js';
import { EventDispatcher } from './event-dispatcher.js';

export class MasteryService {
  /**
   * Re-evaluates concept mastery and growth trends across a project.
   */
  public static async evaluateProjectGrowth(projectId: string, userId: string): Promise<void> {
    const concepts = AppDatabase.query<{
      id: string;
      name: string;
      estimated_mastery: number;
      trend: string;
    }>('SELECT id, name, estimated_mastery, trend FROM concepts WHERE project_id = ?', [projectId]);

    if (concepts.length === 0) return;

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    for (const concept of concepts) {
      // Fetch recent quiz question answers for this concept
      const recentAnswers = AppDatabase.query<{ score: number; is_correct: number; answered_at: string }>(
        `SELECT qa.score, qa.is_correct, qa.answered_at
         FROM quiz_answers qa
         JOIN quiz_questions qq ON qa.quiz_question_id = qq.id
         WHERE qq.concept_id = ?
         ORDER BY qa.answered_at DESC
         LIMIT 5`,
        [concept.id]
      );

      let updatedMastery = concept.estimated_mastery;
      let updatedTrend: 'improving' | 'stable' | 'requiring_attention' = 'stable';

      if (recentAnswers.length > 0) {
        const avgRecentScore = Math.round(
          recentAnswers.reduce((sum, a) => sum + a.score, 0) / recentAnswers.length
        );

        // Exponential smoothing update: 60% historical + 40% recent performance
        updatedMastery = Math.round((concept.estimated_mastery * 0.6) + (avgRecentScore * 0.4));
        updatedMastery = Math.max(10, Math.min(100, updatedMastery));

        if (updatedMastery >= 75 && avgRecentScore >= 70) {
          updatedTrend = 'improving';
        } else if (updatedMastery < 60 || avgRecentScore < 60) {
          updatedTrend = 'requiring_attention';
        } else {
          updatedTrend = 'stable';
        }
      }

      AppDatabase.run(
        `UPDATE concepts
         SET estimated_mastery = ?, trend = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [updatedMastery, updatedTrend, concept.id]
      );

      if (updatedMastery >= 75) {
        strengths.push(concept.name);
      } else if (updatedMastery < 60 || updatedTrend === 'requiring_attention') {
        weaknesses.push(concept.name);
      }
    }

    // Fetch recent mistakes for learner context
    const recentMistakeEvents = AppDatabase.query<{ payload_json: string }>(
      `SELECT payload_json FROM learning_events
       WHERE project_id = ? AND event_type = 'mistake_detected'
       ORDER BY created_at DESC
       LIMIT 5`,
      [projectId]
    );

    const repeatedMistakes: string[] = [];
    for (const row of recentMistakeEvents) {
      try {
        const payload = JSON.parse(row.payload_json);
        if (payload.concept_name && !repeatedMistakes.includes(payload.concept_name)) {
          repeatedMistakes.push(payload.concept_name);
        }
      } catch {}
    }

    const summary = `Learner has strong grasp of ${strengths.length > 0 ? strengths.join(', ') : 'foundational ideas'}, but needs additional practice on ${weaknesses.length > 0 ? weaknesses.join(', ') : 'advanced applications'}.`;

    // Upsert learner context
    const existingContext = AppDatabase.get<{ id: string }>(
      'SELECT id FROM learner_context WHERE project_id = ?',
      [projectId]
    );

    if (existingContext) {
      AppDatabase.run(
        `UPDATE learner_context
         SET strengths_json = ?, weaknesses_json = ?, repeated_mistakes_json = ?, summary = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          JSON.stringify(strengths),
          JSON.stringify(weaknesses),
          JSON.stringify(repeatedMistakes),
          summary,
          existingContext.id
        ]
      );
    } else {
      AppDatabase.run(
        `INSERT INTO learner_context (id, project_id, user_id, strengths_json, weaknesses_json, preferences_json, repeated_mistakes_json, summary, updated_at)
         VALUES (?, ?, ?, ?, ?, '{}', ?, ?, CURRENT_TIMESTAMP)`,
        [
          `lc_${projectId}`,
          projectId,
          userId,
          JSON.stringify(strengths),
          JSON.stringify(weaknesses),
          JSON.stringify(repeatedMistakes),
          summary
        ]
      );
    }

    EventDispatcher.dispatch({
      user_id: userId,
      project_id: projectId,
      event_type: 'mastery_updated',
      payload: {
        strengths_count: strengths.length,
        weaknesses_count: weaknesses.length,
        concepts_evaluated: concepts.length
      }
    });

    console.log(`[MasteryService] Evaluated growth for project ${projectId}: ${strengths.length} strengths, ${weaknesses.length} weaknesses.`);
  }
}
