import * as fs from 'node:fs'
import * as path from 'node:path'
import {
    ErrataLedgerSchema,
    ErrataRecordSchema,
    classifyMediaProvenance,
    type ErrataLedger,
    type ErrataRecord,
    type MediaProvenanceKind,
} from '../../schemas/errata.js'

export class ErrataManager {
    private ledgerPath: string

    constructor(baseDir: string) {
        this.ledgerPath = path.join(baseDir, 'lore', 'errata.json')
    }

    public readLedger(): ErrataLedger {
        if (!fs.existsSync(this.ledgerPath)) {
            return { version: 1, records: [] }
        }
        const raw = fs.readFileSync(this.ledgerPath, 'utf8')
        return ErrataLedgerSchema.parse(JSON.parse(raw))
    }

    /**
     * Appends an immutable ErrataRecord to lore/errata.json.
     * Prohibits modification of historical entries.
     */
    public appendErrata(record: ErrataRecord): void {
        const validated = ErrataRecordSchema.parse(record)
        const ledger = this.readLedger()

        if (ledger.records.some((r) => r.id === validated.id)) {
            throw new Error(
                `DUPLICATE_ERRATA_ID: Errata '${validated.id}' already exists.`,
            )
        }

        ledger.records.push(validated)

        const dir = path.dirname(this.ledgerPath)
        fs.mkdirSync(dir, { recursive: true })

        const formatted = JSON.stringify(ledger, null, 2) + '\n'
        fs.writeFileSync(this.ledgerPath, formatted, 'utf8')
    }

    /**
     * Audits historical media provenance as Replay vs Remaster
     * without rewriting historical manifests.
     */
    public classifyProvenance(record: ErrataRecord): MediaProvenanceKind {
        return classifyMediaProvenance(
            record.superseded_canon_sha,
            record.active_canon_sha,
        )
    }
}
