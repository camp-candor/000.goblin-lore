import Database from 'better-sqlite3'
import {
    calculateAuditPriorityScore,
    type StandingState,
} from '../../schemas/standing.js'

export interface ReconsiderationPriorityRecord {
    fact_id: string
    claim_text: string
    standing: StandingState
    version: number
    days_since_reconsideration: number
    in_degree: number
    audit_priority_score: number
}

export class StandingEngine {
    constructor(private db: Database.Database) {}

    /**
     * Sets fact standing in local SQLite.
     * If FLAGGED_FOR_REVIEW: metadata updates; ZERO dirty cascades fire.
     * If DEPRECATED_ARCHIVED: trigger automatically cascades is_dirty = 1 to scenes.
     */
    public transitionStanding(
        factId: string,
        nextStanding: StandingState,
        _actor: string,
        _notes?: string,
    ): void {
        const now = Date.now()
        const stmt = this.db.prepare(`
            UPDATE facts
            SET standing = ?, last_edited_at_ms = ?
            WHERE id = ?
        `)
        stmt.run(nextStanding, now, factId)
    }

    /**
     * The 5-Second "Still Good" Protocol:
     * Reaffirms that a fact remains canonical truth without bumping its version integer.
     * Resets last_edited_at_ms to current epoch; zero downstream scene caches are invalidated.
     */
    public endorseStillGood(
        factId: string,
        _author: string,
    ): { success: boolean; factId: string; version: number } {
        const current = this.db
            .prepare('SELECT version FROM facts WHERE id = ?')
            .get(factId) as { version: number } | undefined
        if (!current) {
            throw new Error(
                `FACT_NOT_FOUND: Cannot endorse non-existent fact '${factId}'.`,
            )
        }

        const now = Date.now()
        const stmt = this.db.prepare(`
            UPDATE facts
            SET standing = 'ACTIVE_ENDORSED', last_edited_at_ms = ?
            WHERE id = ?
        `)
        stmt.run(now, factId)

        return {
            success: true,
            factId,
            version: current.version,
        }
    }

    /**
     * Queries facts sorted by Audit Priority Score descending
     */
    public queryReconsiderationQueue(
        currentEpochMs: number = Date.now(),
    ): ReconsiderationPriorityRecord[] {
        const rows = this.db
            .prepare(
                `
            SELECT
                f.id AS fact_id,
                f.claim_text,
                f.standing,
                f.version,
                f.last_edited_at_ms,
                COUNT(d.scene_id) AS in_degree
            FROM facts f
            LEFT JOIN scene_fact_dependencies d ON f.id = d.fact_id
            GROUP BY f.id
        `,
            )
            .all() as Array<{
            fact_id: string
            claim_text: string
            standing: StandingState
            version: number
            last_edited_at_ms: number
            in_degree: number
        }>

        const msPerDay = 86_400_000
        return rows
            .map((r) => {
                const elapsedMs = Math.max(
                    0,
                    currentEpochMs - r.last_edited_at_ms,
                )
                const days = Math.floor(elapsedMs / msPerDay)
                const score = calculateAuditPriorityScore(days, r.in_degree)
                return {
                    fact_id: r.fact_id,
                    claim_text: r.claim_text,
                    standing: r.standing,
                    version: r.version,
                    days_since_reconsideration: days,
                    in_degree: r.in_degree,
                    audit_priority_score: score,
                }
            })
            .sort((a, b) => b.audit_priority_score - a.audit_priority_score)
    }
}
