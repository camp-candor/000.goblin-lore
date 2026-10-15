import { buildByteZeroDossier } from '../scaffolder/entityBuilder.js';
import { PossessionSchema, Possession } from '../schemas/entities.js';

export interface UnratifiedCandidate {
  harvest_id: string;
  suggested_slug: string;
  name: string;
  recurrence_count: number;
  drama_weight: number; // 0.0 to 1.0
  description: string;
  assigned_owner?: string;
  occupies_hands?: number;
  mass_grams?: number;
}

export interface RatificationReceipt {
  entity_id: string;
  dossier_content: string;
  salience_score: number;
  approved_by: string;
}

/**
 * Evaluates candidate salience: S = (0.4 * Recurrence) + (0.6 * Drama)
 */
export function calculateSalience(recurrenceCount: number, drama_weight: number): number {
  const normRecurrence = Math.min(1.0, recurrenceCount / 5.0);
  const score = (0.4 * normRecurrence) + (0.6 * Math.max(0, Math.min(1.0, drama_weight)));
  return Math.round(score * 100) / 100;
}

/**
 * Converts a vetted runtime discovery into a Byte-0 canonical Markdown dossier.
 */
export function stampRatifiedPossession(
  candidate: UnratifiedCandidate,
  approvedBy: string,
  canonicalCycle: number
): RatificationReceipt {
  const salience = calculateSalience(candidate.recurrence_count, candidate.drama_weight);
  if (salience < 0.70) {
    throw new Error(
      `SALIENCE_THRESHOLD_ERROR: Candidate '${candidate.harvest_id}' has salience ${salience} < 0.70 required for canon promotion.`
    );
  }

  const entityId = candidate.suggested_slug.startsWith('item_')
    ? candidate.suggested_slug
    : `item_${candidate.suggested_slug}`;

  const frontmatter: Possession = {
    id: entityId,
    name: candidate.name,
    type: 'possession',
    status: 'active',
    historical_reference: false,
    owner: candidate.assigned_owner,
    contested_by: [],
    logistical: {
      is_contested: false,
      weight_class: 'light',
      occupies_hands: candidate.occupies_hands ?? 1,
      mass_grams: candidate.mass_grams ?? 150
    }
  };

  // Validate strict schema compliance
  PossessionSchema.parse(frontmatter);

  const voiceStubs = {
    wantsSurface: `Salvaged during field operations.`,
    wantsActual: `Carried as a tactile mnemonic marker.`,
    blindSpot: `Its structural brittleness is ignored by its bearer.`,
    voiceNotes: `${candidate.description.trim()} Origin: Harvest ${candidate.harvest_id}.`
  };

  const dossierContent = buildByteZeroDossier(frontmatter, voiceStubs);

  console.log(`>> [RATIFY:PROMOTION] Vetted '${entityId}' (Salience ${salience}) approved by ${approvedBy} [OK]`);

  return {
    entity_id: entityId,
    dossier_content: dossierContent,
    salience_score: salience,
    approved_by: approvedBy
  };
}
