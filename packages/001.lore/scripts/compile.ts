import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import * as yaml from 'js-yaml'
import {
    CharacterMachineRailSchema,
    PossessionMachineRailSchema,
    CharacterMachineRail,
    PossessionMachineRail,
} from '../src/schemas/entities.js'
import {
    GrievanceMachineRailSchema,
    GrievanceMachineRail,
} from '../src/schemas/grievance.js'
import { evaluateSomaticSAT } from '../src/scaffolder/satSolver.js'
import { verifyGrievanceDag } from '../src/health/dagAcyclicity.js'
import { auditFarceRatio } from '../src/health/farceGate.js'
import {
    canonicalizeJson,
    computeMerkleRoot,
} from '../src/core/canon/merkleVerifier.js'

export interface BibleMeta {
    seriesSlug: string
    version: number
    state_hash: string
    compiled_at_epoch: number
    entity_count: number
}

export interface BibleState {
    _meta: BibleMeta
    characters: Record<string, CharacterMachineRail>
    possessions: Record<string, PossessionMachineRail>
    grievances: Record<string, GrievanceMachineRail>
    locations: Record<string, Record<string, unknown>>
}

export class ThreePassCompiler {
    private baseDir: string
    private seriesSlug: string

    constructor(baseDir: string, seriesSlug: string = 'genesis_core') {
        this.baseDir = baseDir
        this.seriesSlug = seriesSlug
    }

    private extractByteZeroFrontmatter(
        filePath: string,
    ): Record<string, unknown> {
        const buffer = fs.readFileSync(filePath)
        if (
            buffer.length < 4 ||
            buffer[0] !== 0x2d ||
            buffer[1] !== 0x2d ||
            buffer[2] !== 0x2d ||
            buffer[3] !== 0x0a
        ) {
            throw new Error(
                `BYTE_ZERO_BREACH: File '${filePath}' must begin strictly with '---\\n' at byte offset 0.`,
            )
        }

        const content = buffer.toString('utf8')
        const closingIdx = content.indexOf('\n---\n', 4)
        if (closingIdx === -1) {
            throw new Error(
                `YAML_PARSE_ERROR: Unclosed frontmatter block in '${filePath}'.`,
            )
        }

        const yamlStr = content.substring(4, closingIdx)
        return yaml.load(yamlStr) as Record<string, unknown>
    }

    public executePass1(dossiers: {
        characters: string[]
        possessions: string[]
        grievances: string[]
        locations?: string[]
    }): {
        characters: Record<string, CharacterMachineRail>
        possessions: Record<string, PossessionMachineRail>
        grievances: Record<string, GrievanceMachineRail>
        locations: Record<string, Record<string, unknown>>
    } {
        const characters: Record<string, CharacterMachineRail> = {}
        const possessions: Record<string, PossessionMachineRail> = {}
        const grievances: Record<string, GrievanceMachineRail> = {}
        const locations: Record<string, Record<string, unknown>> = {}

        for (const f of dossiers.possessions) {
            const raw = this.extractByteZeroFrontmatter(
                path.resolve(this.baseDir, f),
            )
            const parsed = PossessionMachineRailSchema.parse(raw)
            possessions[parsed.id] = parsed
        }

        for (const f of dossiers.characters) {
            const raw = this.extractByteZeroFrontmatter(
                path.resolve(this.baseDir, f),
            )
            const parsed = CharacterMachineRailSchema.parse(raw)

            // Pre-flight Somatic SAT check
            const heldItems = parsed.logistical.slots.held
                .map((itemId) => possessions[itemId])
                .filter(
                    (item): item is PossessionMachineRail => item !== undefined,
                )

            const sat = evaluateSomaticSAT(parsed, heldItems)
            if (!sat.satisfiable) {
                throw new Error(
                    `PASS_1_SOMATIC_SAT_BREACH: Character '${parsed.id}' failed SAT check: ${sat.reason}`,
                )
            }

            characters[parsed.id] = parsed
        }

        for (const f of dossiers.grievances) {
            const raw = this.extractByteZeroFrontmatter(
                path.resolve(this.baseDir, f),
            )
            const parsed = GrievanceMachineRailSchema.parse(raw)
            grievances[parsed.id] = parsed
        }

        for (const f of dossiers.locations ?? []) {
            const raw = this.extractByteZeroFrontmatter(
                path.resolve(this.baseDir, f),
            )
            const id = raw.id
            if (typeof id !== 'string' || id.length === 0) {
                throw new Error(
                    `YAML_PARSE_ERROR: Location dossier '${f}' is missing a string 'id'.`,
                )
            }
            locations[id] = raw
        }

        return { characters, possessions, grievances, locations }
    }

    public executePass2(state: {
        characters: Record<string, CharacterMachineRail>
        possessions: Record<string, PossessionMachineRail>
        grievances: Record<string, GrievanceMachineRail>
        locations?: Record<string, Record<string, unknown>>
    }): void {
        // 1. Foreign-Key Sweep
        for (const char of Object.values(state.characters)) {
            for (const slotKey of [
                'worn',
                'held',
                'carried',
                'cached',
            ] as const) {
                for (const itemId of char.logistical.slots[slotKey]) {
                    if (!state.possessions[itemId]) {
                        throw new Error(
                            `COMPILER_FK_ERROR: Character '${char.id}' references non-existent possession '${itemId}'.`,
                        )
                    }
                }
            }
        }

        for (const grv of Object.values(state.grievances)) {
            for (const participantId of grv.participants_primary) {
                if (!state.characters[participantId]) {
                    throw new Error(
                        `COMPILER_FK_ERROR: Grievance '${grv.id}' references unknown character '${participantId}'.`,
                    )
                }
            }
            for (const propId of grv.bound_props) {
                if (!state.possessions[propId]) {
                    throw new Error(
                        `COMPILER_FK_ERROR: Grievance '${grv.id}' references unknown bound prop '${propId}'.`,
                    )
                }
            }
            for (const spawnId of grv.spawns_on_max_escalation) {
                if (!state.grievances[spawnId]) {
                    throw new Error(
                        `COMPILER_FK_ERROR: Grievance '${grv.id}' spawns unknown grievance '${spawnId}'.`,
                    )
                }
            }
        }

        // 2. Three-Color DFS Grievance DAG Acyclicity
        const dagResult = verifyGrievanceDag(Object.values(state.grievances))
        if (!dagResult.isAcyclic) {
            throw new Error(`COMPILER_DAG_CYCLE: ${dagResult.reason}`)
        }

        // 3. Farce Ratio Cap Linter
        const farceResult = auditFarceRatio(Object.values(state.grievances))
        if (!farceResult.valid) {
            throw new Error(`COMPILER_FARCE_BREACH: ${farceResult.reason}`)
        }
    }

    public executePass3(
        data: {
            characters: Record<string, CharacterMachineRail>
            possessions: Record<string, PossessionMachineRail>
            grievances: Record<string, GrievanceMachineRail>
            locations?: Record<string, Record<string, unknown>>
        },
        outputDir: string,
        fixedEpoch: number = 0,
    ): { headPath: string; wormPath: string; stateHash: string } {
        const rawPayload: Omit<BibleState, '_meta'> & {
            _meta: Partial<BibleMeta>
        } = {
            _meta: {
                seriesSlug: this.seriesSlug,
                version: 1,
                compiled_at_epoch: fixedEpoch,
                entity_count:
                    Object.keys(data.characters).length +
                    Object.keys(data.possessions).length +
                    Object.keys(data.grievances).length +
                    Object.keys(data.locations ?? {}).length,
            },
            characters: data.characters,
            possessions: data.possessions,
            grievances: data.grievances,
            locations: data.locations ?? {},
        }

        // Calculate Merkle root hash
        const stateHash = computeMerkleRoot(rawPayload)
        rawPayload._meta.state_hash = stateHash

        const finalizedState = rawPayload as BibleState
        const canonicalString = canonicalizeJson(finalizedState)

        // Format Windows NTFS-safe WORM timestamp (YYYY-MM-DDTHH-mm-ssZ)
        const wormTimestamp = new Date(fixedEpoch)
            .toISOString()
            .replace(/:/g, '-')
            .replace(/\..+/, 'Z')

        const seriesCompiledDir = path.join(outputDir, this.seriesSlug)
        fs.mkdirSync(seriesCompiledDir, { recursive: true })

        const headPath = path.join(seriesCompiledDir, 'bible-state.json')
        const wormPath = path.join(
            seriesCompiledDir,
            `bible-state_${wormTimestamp}.json`,
        )

        const tempPath = path.join(
            seriesCompiledDir,
            `.tmp_bible_${crypto.randomUUID()}`,
        )
        fs.writeFileSync(tempPath, canonicalString + '\n', 'utf8')

        fs.copyFileSync(tempPath, wormPath)
        fs.renameSync(tempPath, headPath)

        return { headPath, wormPath, stateHash }
    }
}
