import { v4 as uuidv4 } from 'uuid';
import { AppDatabase } from '../db/database.js';
import { AIGateway } from './ai-gateway.js';
import { Recommendation } from '../types/index.js';

export class RecommendationService {
  /**
   * Generates actionable next-step recommendations tailored to the student's current mastery and weaknesses.
   */
  public static async generateRecommendations(projectId: string, userId: string, triggerReason?: string): Promise<Recommendation[]> {
    const project = AppDatabase.get<{ id: string; name: string; learning_goal: string }>(
      'SELECT id, name, learning_goal FROM projects WHERE id = ?',
      [projectId]
    );

    const concepts = AppDatabase.query<{
      id: string;
      name: string;
      description: string;
      estimated_mastery: number;
      trend: string;
    }>('SELECT * FROM concepts WHERE project_id = ? ORDER BY estimated_mastery ASC', [projectId]);

    const learnerContext = AppDatabase.get<{
      strengths_json: string;
      weaknesses_json: string;
      repeated_mistakes_json: string;
    }>('SELECT * FROM learner_context WHERE project_id = ?', [projectId]);

    const weaknesses = learnerContext ? JSON.parse(learnerContext.weaknesses_json || '[]') : [];
    const mistakes = learnerContext ? JSON.parse(learnerContext.repeated_mistakes_json || '[]') : [];

    const prompt = `You are a learning science advisor. Generate 2 to 3 targeted, actionable recommendations ("What should I do next?") for a student working on:
Project: "${project?.name || 'Learning Project'}"
Learning Goal: "${project?.learning_goal || 'Mastery'}"
Trigger Event: "${triggerReason || 'Routine growth review'}"

STUDENT CURRENT CONCEPTS & MASTERY:
${concepts.map((c) => `- ${c.name}: ${c.estimated_mastery}% (${c.trend})`).join('\n') || 'None'}

IDENTIFIED WEAKNESSES: ${weaknesses.join(', ') || 'None'}
RECENT MISTAKES: ${mistakes.join(', ') || 'None'}

Return a JSON array of objects with:
- "title": Concise, action-oriented title
- "description": 1-2 sentence explanation of what to do
- "reason": Clear pedagogical rationale connecting to their recent mistakes or low mastery
- "action_type": One of ["review_material", "take_quiz", "tutor_practice", "deep_dive"]
- "concept_name": The exact concept name from the list above`;

    const aiResult = await AIGateway.complete({
      feature: 'recommendation',
      userId,
      projectId,
      userPrompt: prompt,
      jsonMode: true,
      temperature: 0.3
    });

    let recItems: any[] = [];
    try {
      recItems = JSON.parse(aiResult.text);
      if (!Array.isArray(recItems) && typeof recItems === 'object' && (recItems as any).recommendations) {
        recItems = (recItems as any).recommendations;
      }
    } catch {
      recItems = [
        {
          title: `Reinforce ${concepts[0]?.name || 'Core Concept'}`,
          description: `Your mastery in ${concepts[0]?.name || 'this area'} is currently ${concepts[0]?.estimated_mastery || 45}%. A brief 3-question adaptive quiz will cement your understanding.`,
          reason: 'Identified as having the largest growth opportunity in this project.',
          action_type: 'take_quiz',
          concept_name: concepts[0]?.name
        }
      ];
    }

    // Dismiss old active recommendations to keep dashboard focused and fresh
    AppDatabase.run(
      `UPDATE recommendations SET status = 'dismissed' WHERE project_id = ? AND status = 'active'`,
      [projectId]
    );

    const createdRecs: Recommendation[] = [];
    for (const item of recItems) {
      const recId = uuidv4();
      const matchedConcept = concepts.find(
        (c) => c.name.toLowerCase() === (item.concept_name || '').toLowerCase()
      ) || concepts[0];

      AppDatabase.run(
        `INSERT INTO recommendations (id, project_id, user_id, title, description, reason, action_type, target_concept_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`,
        [
          recId,
          projectId,
          userId,
          item.title,
          item.description,
          item.reason,
          item.action_type || 'take_quiz',
          matchedConcept ? matchedConcept.id : null
        ]
      );

      createdRecs.push({
        id: recId,
        project_id: projectId,
        user_id: userId,
        title: item.title,
        description: item.description,
        reason: item.reason,
        action_type: item.action_type || 'take_quiz',
        target_concept_id: matchedConcept?.id,
        target_concept_name: matchedConcept?.name,
        status: 'active',
        created_at: new Date().toISOString()
      });
    }

    console.log(`[RecommendationService] Generated ${createdRecs.length} recommendations for project ${projectId}`);
    return createdRecs;
  }
}
