import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
import {
    CharacterSchema,
    LocationSchema,
    PossessionSchema,
    Character,
    Location,
    Possession,
} from '../src/schemas/entities.js'
import { GrievanceSchema, Grievance } from '../src/schemas/grievance.js'
import { evaluateSomaticSAT } from '../src/scaffolder/satSolver.js'
import { validateReciprocalSpatialTopology } from '../src/scaffolder/spatialGraph.js'
import { FarceGate } from '../src/health/farceGate.js'
import {
    computeMerkleRoot,
    canonicalizeJson,
} from '../src/core/canon/merkleVerifier.js'

export interface BibleState {
    characters: Record<string, Character>
    locations: Record<string, Location>
    possessions: Record<string, Possession>
    grievances: Record<string, Grievance>
    _meta: {
        version: string
        state_hash?: string
    }
}

export class ThreePassCompiler {
    public characters: Map<string, Character> = new Map()
    public locations: Map<string, Location> = new Map()
    public possessions: Map<string, Possession> = new Map()
    public grievances: Map<string, Grievance> = new Map()

    constructor(private readonly dataDir: string = '') {}

    public executePass1(): void {
        this.pass1_parseAndValidate()
    }

    public pass1_parseAndValidate(): void {
        this.parseDirectory(
            'characters',
            CharacterSchema,
            this.characters,
            (parsed) => {
                const char = parsed as Character
                for (const prop of Object.values(
                    char.epistemic.leverage_strings,
                )) {
                    if (prop < 0 || prop > 10000) {
                        throw new Error(
                            `Basis points must be between 0 and 10000. Found: ${prop}`,
                        )
                    }
                }
            },
        )
        this.parseDirectory(
            'locations',
            LocationSchema,
            this.locations,
            (parsed) => {
                const loc = parsed as Location
                if (
                    loc.acoustic_damping_bp < 0 ||
                    loc.acoustic_damping_bp > 10000
                ) {
                    throw new Error(
                        `Basis points must be between 0 and 10000. Found: ${loc.acoustic_damping_bp}`,
                    )
                }
            },
        )
        this.parseDirectory('possessions', PossessionSchema, this.possessions)
        this.parseDirectory('grievances', GrievanceSchema, this.grievances)

        // Evaluate pre-flight Somatic SAT hand capacity equations
        for (const character of this.characters.values()) {
            const satResult = evaluateSomaticSAT(character, this.possessions)
            if (!satResult.passed) {
                throw new Error(
                    `COMPILER_SAT_ERROR: ${satResult.code} - ${satResult.message}`,
                )
            }
        }
    }

    private parseDirectory<T>(
        dirName: string,
        schema: any,
        storage: Map<string, T>,
        additionalValidation?: (parsed: T) => void,
    ) {
        if (!this.dataDir) return
        const fullDir = path.join(this.dataDir, dirName)
        if (!fs.existsSync(fullDir)) return

        const files = fs.readdirSync(fullDir).filter((f) => f.endsWith('.md'))
        for (const file of files) {
            const filePath = path.join(fullDir, file)
            const content = fs.readFileSync(filePath, 'utf8')
            const parsed = matter(content)

            const data = schema.parse(parsed.data)
            if (additionalValidation) {
                additionalValidation(data)
            }
            storage.set(data.id, data)
        }
    }

    public executePass2(): void {
        this.pass2_relationalIntegrity()
    }

    public pass2_relationalIntegrity(): void {
        // FK sweep: Characters
        for (const [id, char] of this.characters) {
            if (char.location && !this.locations.has(char.location)) {
                throw new Error(
                    `COMPILER_FK_ERROR: Character '${id}' references unknown location '${char.location}'.`,
                )
            }
            for (const item of char.logistical.worn) {
                if (!this.possessions.has(item))
                    throw new Error(
                        `COMPILER_FK_ERROR: Character '${id}' worn item '${item}' missing.`,
                    )
            }
            for (const item of char.logistical.held) {
                if (!this.possessions.has(item))
                    throw new Error(
                        `COMPILER_FK_ERROR: Character '${id}' held item '${item}' missing.`,
                    )
            }
            for (const grv of char.linked_grievances) {
                if (!this.grievances.has(grv))
                    throw new Error(
                        `COMPILER_FK_ERROR: Character '${id}' linked grievance '${grv}' missing.`,
                    )
            }
        }

        // FK sweep: Locations
        for (const [id, loc] of this.locations) {
            for (const target of loc.connected_locations) {
                if (!this.locations.has(target))
                    throw new Error(
                        `COMPILER_FK_ERROR: Location '${id}' connected to unknown location '${target}'.`,
                    )
            }
        }

        // Validate reciprocal spatial topology
        const spatialRes = validateReciprocalSpatialTopology(this.locations)
        if (!spatialRes.valid) {
            throw new Error(
                `COMPILER_SPATIAL_ERROR: ${spatialRes.errors[0].message}`,
            )
        }

        // 3-Color DFS for DAG acyclicity
        this.verifyGrievanceDAG()

        // Audits farce invariants
        const farceGate = new FarceGate()
        const farceRes = farceGate.auditFarceInvariants(
            Array.from(this.grievances.values()),
        )
        if (!farceRes.passed) {
            throw new Error(
                `COMPILER_FARCE_ERROR: ${farceRes.violations[0].code} - ${farceRes.violations[0].message}`,
            )
        }
    }

    private verifyGrievanceDAG(): void {
        const WHITE = 0,
            GRAY = 1,
            BLACK = 2
        const state = new Map<string, number>()

        for (const key of this.grievances.keys()) {
            state.set(key, WHITE)
        }

        const dfs = (nodeId: string) => {
            state.set(nodeId, GRAY)
            const node = this.grievances.get(nodeId)
            if (node) {
                for (const childId of node.spawns_on_max_escalation) {
                    if (!this.grievances.has(childId)) {
                        throw new Error(
                            `COMPILER_FK_ERROR: Grievance '${nodeId}' spawns unknown grievance '${childId}'.`,
                        )
                    }
                    const childState = state.get(childId)
                    if (childState === GRAY) {
                        throw new Error(
                            `COMPILER_DAG_CYCLE: Circular grievance escalation detected at grievance '${childId}'.`,
                        )
                    }
                    if (childState === WHITE) {
                        dfs(childId)
                    }
                }
            }
            state.set(nodeId, BLACK)
        }

        for (const key of this.grievances.keys()) {
            if (state.get(key) === WHITE) {
                dfs(key)
            }
        }
    }

    public executePass3(outputDir?: string, seriesSlug?: string): void {
        const rootLoreDir = path.resolve(__dirname, '..')
        const targetOutput = outputDir || path.resolve(rootLoreDir, 'compiled')
        const targetSlug = seriesSlug || 'canon'
        this.pass3_normalizeAndSeal(targetOutput, targetSlug)
    }

    public pass3_normalizeAndSeal(outputDir: string, seriesSlug: string): void {
        const payload: any = {
            characters: Object.fromEntries(this.characters),
            locations: Object.fromEntries(this.locations),
            possessions: Object.fromEntries(this.possessions),
            grievances: Object.fromEntries(this.grievances),
            _meta: {
                version: '1.0.0',
            },
        }

        // Ensure canonical form is used to calculate hash
        const canonical = canonicalizeJson(payload)
        const hash = computeMerkleRoot(canonical)

        payload._meta.state_hash = hash

        const finalJson = JSON.stringify(payload, null, 4) + '\n'

        const targetDir = path.join(outputDir, seriesSlug)
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
        }

        const headPath = path.join(targetDir, 'bible-state.json')

        // Generate NTFS-safe timestamp YYYY-MM-DDTHH-mm-ssZ
        const now = new Date()
        const timestamp = now.toISOString().replace(/:/g, '-')
        const wormPath = path.join(targetDir, `bible-state_${timestamp}.json`)

        const tmpPath = path.join(targetDir, `.tmp_bible-state_${hash}.json`)

        // Atomic write
        fs.writeFileSync(tmpPath, finalJson, 'utf8')
        fs.renameSync(tmpPath, headPath)

        // Write WORM archive
        fs.writeFileSync(wormPath, finalJson, 'utf8')
    }
}

// CLI Execution Support
if (
    process.argv[1] &&
    (process.argv[1].endsWith('compile.ts') ||
        process.argv[1].endsWith('compile.js'))
) {
    const rootLoreDir = path.resolve(__dirname, '..')
    const dataPath = path.resolve(rootLoreDir, 'data')
    const compiler = new ThreePassCompiler(
        fs.existsSync(dataPath) ? dataPath : '',
    )
    compiler.executePass1()
    compiler.executePass2()
    const outDir = path.resolve(rootLoreDir, 'compiled')
    compiler.executePass3(outDir, 'canon')
    console.log(
        '[COMPILER] [OK] Canon compilation and Merkle sealing complete.',
    )
}
