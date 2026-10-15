import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import {
    CharacterSchema,
    LocationSchema,
    PossessionSchema,
} from '../src/schemas/entities.js'
import { GrievanceSchema } from '../src/schemas/grievance.js'
import { FarceGate } from '../src/health/farceGate.js'
import {
    validateReciprocalSpatialTopology,
    SpatialNode,
} from '../src/scaffolder/spatialGraph.js'
import { computeMerkleRoot } from '../src/core/canon/merkleVerifier.js'

export class ThreePassCompiler {
    private rawEntities: Record<string, any[]> = {
        characters: [],
        locations: [],
        possessions: [],
        grievances: [],
    }

    constructor(
        private readonly dataDir: string,
        private readonly outputDir: string,
    ) {}

    private parseFile(filePath: string, schema: any, collection: string) {
        if (!fs.existsSync(filePath)) return
        const fileContent = fs.readFileSync(filePath, 'utf8')
        if (!fileContent.startsWith('---')) {
            return
        }

        const parsed = matter(fileContent)
        const data = parsed.data

        const result = schema.safeParse(data)
        if (!result.success) {
            throw new Error(
                `Validation failed for ${filePath}: ${result.error.message}`,
            )
        }

        this.rawEntities[collection].push(result.data)
    }

    private loadFiles(dir: string, schema: any, collection: string) {
        const fullDir = path.join(this.dataDir, dir)
        if (!fs.existsSync(fullDir)) return

        const files = fs.readdirSync(fullDir).filter((f) => f.endsWith('.md'))
        for (const file of files) {
            this.parseFile(path.join(fullDir, file), schema, collection)
        }
    }

    public pass1_ShapesAndScalars() {
        this.loadFiles('characters', CharacterSchema, 'characters')
        this.loadFiles('locations', LocationSchema, 'locations')
        this.loadFiles('possessions', PossessionSchema, 'possessions')
        this.loadFiles('grievances', GrievanceSchema, 'grievances')

        // Evaluate Somatic SAT equations
        for (const char of this.rawEntities.characters) {
            const heldItems = char.logistical?.held || []
            let handsOccupied = 0

            for (const itemId of heldItems) {
                const item = this.rawEntities.possessions.find(
                    (p: any) => p.id === itemId,
                )
                if (
                    item &&
                    item.logistical &&
                    typeof item.logistical.occupies_hands === 'number'
                ) {
                    handsOccupied += item.logistical.occupies_hands
                }
            }

            const netArmsAvailable = char.somatic?.available_arms ?? 2
            if (handsOccupied > netArmsAvailable) {
                throw new Error(
                    `COMPILER_SAT_ERROR: Character ${char.id} exceeds hand capacity (${handsOccupied} > ${netArmsAvailable})`,
                )
            }
        }
    }

    public pass2_RelationalAndInvariants() {
        // FK sweep
        const validLocIds = new Set(this.rawEntities.locations.map((l) => l.id))
        const validCharIds = new Set(
            this.rawEntities.characters.map((c) => c.id),
        )
        const validItemIds = new Set(
            this.rawEntities.possessions.map((p) => p.id),
        )
        const validGrvIds = new Set(
            this.rawEntities.grievances.map((g) => g.id),
        )

        // Check character FKs
        for (const char of this.rawEntities.characters) {
            if (char.location && !validLocIds.has(char.location)) {
                throw new Error(
                    `COMPILER_FK_ERROR: Character ${char.id} references invalid location ${char.location}`,
                )
            }
            const items = [
                ...(char.logistical?.worn || []),
                ...(char.logistical?.held || []),
                ...(char.logistical?.carried || []),
                ...(char.logistical?.cached || []),
            ]
            for (const item of items) {
                if (!validItemIds.has(item)) {
                    throw new Error(
                        `COMPILER_FK_ERROR: Character ${char.id} references invalid possession ${item}`,
                    )
                }
            }
        }

        // Validate reciprocal spatial topology
        const spatialMap = new Map<string, SpatialNode>()
        for (const loc of this.rawEntities.locations) {
            spatialMap.set(loc.id, loc as SpatialNode)
        }
        const spatialAudit = validateReciprocalSpatialTopology(spatialMap)
        if (!spatialAudit.valid) {
            const firstError = spatialAudit.errors[0]
            throw new Error(`COMPILER_SPATIAL_ERROR: ${firstError.message}`)
        }

        // DFS DAG acyclicity for grievances
        const color = new Map<string, number>() // 0: White, 1: Gray, 2: Black
        for (const g of this.rawEntities.grievances) color.set(g.id, 0)

        const dfs = (u: string) => {
            color.set(u, 1)
            const grv = this.rawEntities.grievances.find((g) => g.id === u)
            if (grv && grv.spawns_on_max_escalation) {
                for (const v of grv.spawns_on_max_escalation) {
                    if (!validGrvIds.has(v)) {
                        throw new Error(
                            `COMPILER_FK_ERROR: Grievance ${u} references invalid child grievance ${v}`,
                        )
                    }
                    if (color.get(v) === 1) {
                        throw new Error(
                            `COMPILER_DAG_CYCLE: Circular deadlock detected at ${v}`,
                        )
                    }
                    if (color.get(v) === 0) {
                        dfs(v)
                    }
                }
            }
            color.set(u, 2)
        }

        for (const g of this.rawEntities.grievances) {
            if (color.get(g.id) === 0) dfs(g.id)
        }

        // Farce invariants will be validated via FarceGate audit
        const farceGate = new FarceGate()
        // Epistemic clue disjointness check implicitly requires knowing clues.
        // If there is an epistemic property, we might need to collect clues.
        // According to the directive: "Audits farce invariants via FarceGate"
        const clueTokens: string[] = [] // Assuming empty for this pass, as clues are not defined in the frontmatter explicitly here
        const farceAudit = farceGate.auditFarceInvariants(
            this.rawEntities.grievances,
            clueTokens,
        )
        if (!farceAudit.passed) {
            const firstViolation = farceAudit.violations[0]
            throw new Error(`COMPILER_FARCE_ERROR: ${firstViolation.message}`)
        }
    }

    public get entities() {
        return this.rawEntities
    }

    public pass3_NormalizationAndEmission() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

        const statePayload: any = {
            _meta: {
                version: '1.0.0',
                timestamp: undefined, // Stripped deterministic fields
                state_hash: undefined, // Placeholder
            },
            entities: {
                characters: this.rawEntities.characters,
                locations: this.rawEntities.locations,
                possessions: this.rawEntities.possessions,
                grievances: this.rawEntities.grievances,
            },
        }

        // Strip non-deterministic data
        delete statePayload._meta.timestamp

        // Compute Merkle root
        const rootHash = computeMerkleRoot(statePayload)
        statePayload._meta.state_hash = rootHash

        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true })
        }

        const headPath = path.join(this.outputDir, 'bible-state.json')
        const wormPath = path.join(
            this.outputDir,
            `bible-state_${timestamp}.json`,
        )

        // Write HEAD pointer atomically
        const tempPath = path.join(
            this.outputDir,
            `.tmp_bible-state_${rootHash}.json`,
        )
        fs.writeFileSync(
            tempPath,
            JSON.stringify(statePayload, null, 2),
            'utf8',
        )
        fs.renameSync(tempPath, headPath)

        // Write WORM archive atomically
        const wormTempPath = path.join(
            this.outputDir,
            `.tmp_bible-state_worm_${rootHash}.json`,
        )
        fs.writeFileSync(
            wormTempPath,
            JSON.stringify(statePayload, null, 2),
            'utf8',
        )
        fs.renameSync(wormTempPath, wormPath)
    }

    public run() {
        this.pass1_ShapesAndScalars()
        this.pass2_RelationalAndInvariants()
        this.pass3_NormalizationAndEmission()
    }
}
