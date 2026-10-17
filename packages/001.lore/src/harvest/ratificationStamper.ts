import Database from 'better-sqlite3'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { buildByteZeroDossier } from '../scaffolder/entityBuilder.js'
import { PossessionMachineRailSchema } from '../schemas/entities.js'

export interface HarvestCandidate {
    id: string
    name: string
    recurrence_count: number
    dramatic_salience: number
    suggested_weight_bps: number
    occupies_hands: number
    first_observed_scene: string
}

/**
 * Calculates composite dramatic salience:
 * S = (0.4 * normalized_recurrence) + (0.6 * dramatic_salience)
 * normalized_recurrence = min(1.0, recurrenceCount / 5.0)
 */
export function calculateSalience(
    recurrenceCount: number,
    dramaticSalience: number,
): number {
    const normRecurrence = Math.min(1.0, recurrenceCount / 5.0)
    const s = 0.4 * normRecurrence + 0.6 * dramaticSalience
    return Math.round(s * 100) / 100
}

export class RatificationStamper {
    constructor(
        private db: Database.Database,
        private baseDir: string,
    ) {
        this.initLocalQuarantineTable()
    }

    private initLocalQuarantineTable(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS unratified_details (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                salience_score REAL NOT NULL,
                data_json TEXT NOT NULL,
                status TEXT CHECK(status IN ('QUARANTINED', 'RATIFIED', 'DISCARDED')) NOT NULL DEFAULT 'QUARANTINED',
                discovered_at_ms INTEGER NOT NULL
            );
        `)
    }

    public quarantineCandidate(candidate: HarvestCandidate): boolean {
        const salience = calculateSalience(
            candidate.recurrence_count,
            candidate.dramatic_salience,
        )
        if (salience < 0.7) {
            return false
        }

        const stmt = this.db.prepare(`
            INSERT INTO unratified_details (id, name, salience_score, data_json, status, discovered_at_ms)
            VALUES (?, ?, ?, ?, 'QUARANTINED', ?)
            ON CONFLICT(id) DO UPDATE SET
                salience_score = excluded.salience_score,
                data_json = excluded.data_json
        `)
        stmt.run(
            candidate.id,
            candidate.name,
            salience,
            JSON.stringify(candidate),
            Date.now(),
        )
        return true
    }

    /**
     * Promotes quarantined detail to Tier 1 Canonical Markdown dossier upon human sign-off.
     * Quarantined details never alter bible-state.json before this explicit call.
     */
    public stampRatifiedPossession(
        detailId: string,
        approvedBy: string,
        fixedEpoch: number = 0,
    ): string {
        const row = this.db
            .prepare(
                'SELECT data_json, status FROM unratified_details WHERE id = ?',
            )
            .get(detailId) as { data_json: string; status: string } | undefined

        if (!row) {
            throw new Error(
                `DETAIL_NOT_FOUND: Detail '${detailId}' is not in the quarantine table.`,
            )
        }

        const candidate = JSON.parse(row.data_json) as HarvestCandidate

        const machineRail = {
            id: candidate.id,
            name: candidate.name,
            entity_type: 'possession' as const,
            version: 1,
            depends_on: [] as string[],
            logistical: {
                occupies_hands: candidate.occupies_hands,
                weight_class_bps: candidate.suggested_weight_bps,
                is_two_handed: candidate.occupies_hands === 2,
            },
            created_at_epoch: fixedEpoch,
            updated_at_epoch: fixedEpoch,
        }

        PossessionMachineRailSchema.parse(machineRail)

        const voiceProse = `Ratified from runtime harvest (${candidate.id}) approved by ${approvedBy}. First observed in scene ${candidate.first_observed_scene}.`
        const content = buildByteZeroDossier(machineRail, voiceProse)

        const targetDir = path.join(this.baseDir, 'possessions')
        fs.mkdirSync(targetDir, { recursive: true })
        const targetPath = path.join(targetDir, `${candidate.id}.md`)

        fs.writeFileSync(targetPath, content, 'utf8')

        this.db
            .prepare(
                "UPDATE unratified_details SET status = 'RATIFIED' WHERE id = ?",
            )
            .run(detailId)

        return targetPath
    }
}
