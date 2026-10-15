import * as fs from 'node:fs'
import * as path from 'node:path'
import {
    ErrataRecord,
    ErrataRecordSchema,
    ErrataLedger,
} from '../../schemas/errata.js'

export class ErrataManager {
    private ledgerPath: string

    constructor(customPath?: string) {
        this.ledgerPath =
            customPath || path.resolve(process.cwd(), 'lore/errata.json')
    }

    public loadLedger(): ErrataLedger {
        if (!fs.existsSync(this.ledgerPath)) {
            return { schema_version: '1.0.0', records: [] }
        }
        const raw = fs.readFileSync(this.ledgerPath, 'utf8')
        return JSON.parse(raw)
    }

    /**
     * Appends an ErrataRecord to the ledger without overwriting history.
     */
    public appendErrata(record: ErrataRecord): void {
        ErrataRecordSchema.parse(record)
        const ledger = this.loadLedger()

        if (ledger.records.some((r) => r.errata_id === record.errata_id)) {
            throw new Error(
                `ERRATA_DUPLICATE_ERROR: Record with ID '${record.errata_id}' already exists.`,
            )
        }

        ledger.records.push(record)

        const dir = path.dirname(this.ledgerPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        // Atomic sibling POSIX swap
        const tmpPath = path.join(dir, `.tmp_errata_${Date.now()}.json`)
        fs.writeFileSync(tmpPath, JSON.stringify(ledger, null, 2), 'utf8')
        fs.renameSync(tmpPath, this.ledgerPath)

        console.log(
            `>> [ERRATA:APPEND] Appended record '${record.errata_id}' (${record.reanchoring_strategy}) [OK]`,
        )
    }
}
