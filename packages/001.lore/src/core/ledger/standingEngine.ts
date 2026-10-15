import {
  EpistemologicalStanding,
  StandingTransitionRecord,
  StandingTransitionRecordSchema,
  calculateAuditPriorityScore
} from '../../schemas/standing.js';

export interface SceneDependencyRecord {
  scene_id: string;
  depends_on_entity_id: string;
  is_dirty: boolean;
}

export class StandingEngine {
  /**
   * Evaluates standing transitions and calculates invalidation blast radius.
   * INVARIANT: FLAGGED_FOR_REVIEW must cause 0 downstream cascades.
   * INVARIANT: DEPRECATED_ARCHIVED marks all dependent scenes as is_dirty = 1.
   */
  public static executeTransition(
    entityId: string,
    currentStanding: EpistemologicalStanding,
    targetStanding: EpistemologicalStanding,
    reconsideredBy: string,
    reason: string,
    dependencies: SceneDependencyRecord[],
    daysSinceReview = 0
  ): {
    transition: StandingTransitionRecord;
    dirtyScenes: string[];
    cascadeFired: boolean;
  } {
    const dependentScenes = dependencies.filter(d => d.depends_on_entity_id === entityId);
    const score = calculateAuditPriorityScore(daysSinceReview, dependentScenes.length);

    const transition: StandingTransitionRecord = {
      entity_id: entityId,
      previous_standing: currentStanding,
      new_standing: targetStanding,
      reconsidered_by: reconsideredBy,
      timestamp_epoch: Math.floor(Date.now() / 1000),
      reason,
      audit_priority_score: score
    };

    StandingTransitionRecordSchema.parse(transition);

    let dirtyScenes: string[] = [];
    let cascadeFired = false;

    if (targetStanding === 'FLAGGED_FOR_REVIEW') {
      // Liminal State: Zero cascade propagation
      dirtyScenes = [];
      cascadeFired = false;
      console.log(`>> [STANDING:FLAG] Entity '${entityId}' FLAGGED_FOR_REVIEW. Cascade suppressed (0 scenes dirty) [OK]`);
    } else if (targetStanding === 'DEPRECATED_ARCHIVED') {
      // Atomic Invalidation Cascade
      dirtyScenes = dependentScenes.map(d => d.scene_id);
      cascadeFired = true;
      console.log(`>> [STANDING:DEPRECATE] Entity '${entityId}' DEPRECATED. Cascade fired (${dirtyScenes.length} scenes flagged dirty) [OK]`);
    } else if (targetStanding === 'ACTIVE_ENDORSED') {
      dirtyScenes = [];
      cascadeFired = false;
      console.log(`>> [STANDING:RELOAD] Entity '${entityId}' reaffirmed ACTIVE_ENDORSED [OK]`);
    }

    return { transition, dirtyScenes, cascadeFired };
  }

  /**
   * 5-Second "Still Good" Protocol: Resets review age without bumping version or modifying H_root.
   */
  public static executeStillGoodAffirmation(
    entityId: string,
    reconsideredBy: string
  ): { entityId: string; last_reconsidered_at: number; versionBumped: boolean; hashMutated: boolean } {
    const currentEpoch = Math.floor(Date.now() / 1000);
    console.log(`>> [STILL_GOOD:RESET] Entity '${entityId}' affirmed by ${reconsideredBy}. Age reset to 0 [OK]`);
    return {
      entityId,
      last_reconsidered_at: currentEpoch,
      versionBumped: false,
      hashMutated: false
    };
  }
}
