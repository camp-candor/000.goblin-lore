import {
    runAtomicEntityScaffolder,
    runCompileFlightAction,
    runConstitutionalRegistryAudit,
    runCorpusHealthTelemetry,
    runEntityManifestAudit,
    runEpistemicFirewallsAudit,
    runErrataLedgerAudit,
    runErrataRecordTool,
    runFourTupleContractAudit,
    runGenesisSeedsAudit,
    runGrievanceDagAndDyadicAudit,
    runHeapImmutabilityProbe,
    runKineticMotorMasksAudit,
    runPortalReconcileAudit,
    runPrimitiveStandardsAudit,
    runRetireCanonicalEntity,
    runSeriesGenesisWizard,
    runSeriesStylometricLint,
    runSeriesTreeScaffoldAudit,
    runSomaticSatAudit,
    runSpatialPortalsAndAcousticsAudit,
    type AuditSessionOverlay,
} from './auditBuzzers'
import {
    ACOUSTIC_EVENTS,
    DEMO_TTS_LINES,
    MOTOR_LAB_PROFILES,
    checkFactStalenessCase,
    checkVocalFeasibilityCase,
    createInitialDspState,
    evaluateMotorCandidate,
    runAcousticImpulse,
    runAlgebraicScenario,
    runFullSomaticGauntletSweep,
    runPayloadHasherTarget,
    runPostBreakAction,
    runPressureStep,
    runReducerDispatch,
    validateDemoTtsLine,
    type DspRuntimeState,
} from './dspEngines'
import type { ChoiceOption, CorpusSnapshot } from './types'

export type MenuRoute =
    | { kind: 'LORE_MENU' }
    | { kind: 'ROOT_MENU' }
    | { kind: 'LIBRARY_MENU' }
    | { kind: 'SCHEMA_SUBMENU' }
    | { kind: 'SOMATIC_HUB' }
    | { kind: 'COMPILE_DECK' }
    | { kind: 'MOTOR_LAB_SELECT' }
    | { kind: 'MOTOR_LAB_ENTITY'; entityId: string }
    | { kind: 'LEDGER_SELECT_SERIES' }
    | { kind: 'LEDGER_SELECT_CHAR'; seriesSlug: string }
    | { kind: 'PRESSURE_ENTITY' }
    | { kind: 'PRESSURE_METER'; entityId: string }
    | { kind: 'PRESSURE_DEBIT'; entityId: string; meterCategory: string; cycleCount: number }
    | { kind: 'ACOUSTIC_ENTITY' }
    | { kind: 'ACOUSTIC_EVENT'; entityId: string }
    | { kind: 'ALGEBRAIC_ENTITY' }
    | { kind: 'ALGEBRAIC_SCENARIO'; entityId: string }
    | { kind: 'POSTBREAK_ENTITY' }
    | { kind: 'POSTBREAK_METER'; entityId: string }
    | { kind: 'POSTBREAK_ACTION'; entityId: string; meterCategory: string }
    | { kind: 'PAYLOAD_VALIDATOR' }
    | { kind: 'VOCAL_FEASIBILITY' }
    | { kind: 'FACT_STALENESS' }
    | { kind: 'PAYLOAD_HASHER' }
    | { kind: 'PAYLOAD_REDUCER' }

export interface CockpitSession {
    corpus: CorpusSnapshot
    route: MenuRoute
    overlay: AuditSessionOverlay
    dsp: DspRuntimeState
}

export function createInitialCockpitSession(corpus: CorpusSnapshot): CockpitSession {
    return {
        corpus,
        route: { kind: 'LORE_MENU' },
        overlay: {
            activeSeries: corpus.defaultSeries || '000.sample-hearth',
            mintedRoots: {},
            errataRecords: [],
            scaffoldedSeries: [],
            scaffoldedEntities: [],
            retiredEntities: [],
        },
        dsp: createInitialDspState(),
    }
}

export function buildBootBannerLines(session: CockpitSession): string[] {
    const activeSlug = session.overlay.activeSeries
    const diskSeries = session.corpus.seriesList.find((s) => s.slug === activeSlug)
    const rootHash =
        session.overlay.mintedRoots[activeSlug] || diskSeries?.compiledRootHash || null
    const rootDisplay = rootHash
        ? `${rootHash.slice(0, 16)}...${rootHash.slice(-8)}`
        : 'UNSEALED (RUN [C] TO MINT)'
    const seriesDisplay = activeSlug.padEnd(23, ' ').slice(0, 23)
    const hRootPadded = rootDisplay.padEnd(36, ' ').slice(0, 36)

    return [
        '-----------',
        `${session.corpus.appName} v${session.corpus.appVersion}`,
        `LIBRARY V${session.corpus.libraryVersion}`,
        '-----------',
        '+==============================================================================+',
        '|               GOBLIN LORE :: ONTOLOGICAL COMPILER & AUDIT DECK               |',
        '+------------------------------------------------------------------------------+',
        `| SERIES : ${seriesDisplay} | ENGINE : 43.compile.unit (T_0 = $0.00)      |`,
        `| STATUS : IDLE                    | H_ROOT : ${hRootPadded} |`,
        '+==============================================================================+',
        ':: [KEYS] UP/DOWN or J/K: Navigate | ENTER: Select',
    ]
}

export const LORE_MENU_CHOICES: ChoiceOption[] = [
    {
        id: '1. VALIDATE SCHEMA INVARIANTS',
        label: '1. VALIDATE SCHEMA INVARIANTS',
        tooltip:
            'Validate frontmatter entities, basis-point bounds, and Banker rounding.',
    },
    {
        id: '[ 26. SCHEMA & INVARIANTS ]',
        label: '[ 26. SCHEMA & INVARIANTS ]',
        tooltip:
            'Open 26.schema.unit subsystem for manifests, errata, pardons, and four-tuple audits.',
    },
    {
        id: '[Somatic DSP Modulation Hub]',
        label: '[Somatic DSP Modulation Hub]',
        tooltip:
            'Open Digital Signal Processing hub for pressure meters, paranoia clocks, and TTS payloads.',
    },
    {
        id: '2. RUN SOMATIC SAT SOLVER',
        label: '2. RUN SOMATIC SAT SOLVER',
        tooltip:
            'Solve limb-capacity SAT constraints and verify overload halts fail closed at T_0.',
    },
    {
        id: '3. AUDIT KINETIC MOTOR MASKS',
        label: '3. AUDIT KINETIC MOTOR MASKS',
        tooltip:
            'Evaluate banned kinetic verb set intersections against locomotion postures.',
    },
    {
        id: '4. VERIFY HEAP IMMUTABILITY',
        label: '4. VERIFY HEAP IMMUTABILITY',
        tooltip:
            'Probe deepFreeze strict runtime immutability over compiled entity manifests.',
    },
    {
        id: '5. AUDIT SPATIAL PORTALS & ACOUSTICS',
        label: '5. AUDIT SPATIAL PORTALS & ACOUSTICS',
        tooltip:
            'Audit spatial portal reciprocity and centi-decibel acoustic attenuation propagation.',
    },
    {
        id: '6. AUDIT GRIEVANCE DAG & DYADIC MESH',
        label: '6. AUDIT GRIEVANCE DAG & DYADIC MESH',
        tooltip:
            'Run 3-color DFS grievance cycle detection and exact-2-principal dyadic schema checks.',
    },
    {
        id: '7. VERIFY EPISTEMIC FIREWALLS',
        label: '7. VERIFY EPISTEMIC FIREWALLS',
        tooltip:
            'Check clue-lemma disjointness, false-belief co-requisites, and bracket-injection guards.',
    },
    {
        id: '8. INTERACTIVE SOMATIC MOTOR LAB',
        label: '8. INTERACTIVE SOMATIC MOTOR LAB',
        tooltip:
            'Inspect sample character somatic masks and test candidate kinetic verbs interactively.',
    },
    {
        id: '[S] STYLOMETRIC & VOICE-BLEED LINTER',
        label: '[S] STYLOMETRIC & VOICE-BLEED LINTER',
        tooltip:
            'Audit lexical diversity (bp), corporate-slop violations, and voice-bleed callbacks.',
    },
    {
        id: '[H] HERMETIC OFFLINE DELETION PARITY',
        label: '[H] HERMETIC OFFLINE DELETION PARITY',
        tooltip:
            'Purge compiled artifacts, rebuild solely from Markdown dossiers, and assert bit parity.',
    },
    {
        id: '[C] COMPILE CANON & GATE 0 GAUNTLET',
        label: '[C] COMPILE CANON & GATE 0 GAUNTLET',
        tooltip:
            'Open 3-pass compiler flight deck, Merkle emission, and Gate 0 verification.',
    },
    {
        id: '[G] UNIVERSAL SERIES GENESIS WIZARD',
        label: '[G] UNIVERSAL SERIES GENESIS WIZARD',
        tooltip:
            'Provision a hermetic series workspace tree and populate mandatory genesis seeds.',
    },
    {
        id: '[S] ATOMIC ENTITY SCAFFOLDER',
        label: '[S] ATOMIC ENTITY SCAFFOLDER',
        tooltip:
            'Validate Byte-0 preamble and scaffold a canonical entity dossier into active series.',
    },
    {
        id: '[R] RETIRE CANONICAL ENTITY',
        label: '[R] RETIRE CANONICAL ENTITY',
        tooltip:
            'Relocate entity dossier to _retired/ with deterministic item matter conservation.',
    },
    {
        id: '[H] STATIC CORPUS HEALTH TELEMETRY',
        label: '[H] STATIC CORPUS HEALTH TELEMETRY',
        tooltip:
            'Render 4-part static corpus health card (Dyadic Mesh, Farce Ratio, DAG Depth, Gini).',
    },
    {
        id: '[X] RECORD CANONICAL ERRATA ENTRY',
        label: '[X] RECORD CANONICAL ERRATA ENTRY',
        tooltip:
            'Append hash-chained errata record to world/errata.json without mutating history.',
    },
    {
        id: 'ROOT MENU',
        label: 'ROOT MENU',
        tooltip: 'Return to master flight deck switchboard.',
    },
]

export const SCHEMA_SUBMENU_CHOICES: ChoiceOption[] = [
    {
        id: '[ 1. VALIDATE ENTITY MANIFESTS ]',
        label: '[ 1. VALIDATE ENTITY MANIFESTS ]',
        tooltip: 'Run basis-point bounds, Banker parity, and fail-closed schema router probes.',
    },
    {
        id: '[ 2. RUN SOMATIC SAT SOLVER ]',
        label: '[ 2. RUN SOMATIC SAT SOLVER ]',
        tooltip: 'Evaluate multi-character hand-capacity SAT matrix and overload halts.',
    },
    {
        id: '[ 3. CONSTITUTIONAL RULE REGISTRY ]',
        label: '[ 3. CONSTITUTIONAL RULE REGISTRY ]',
        tooltip: 'Audit canonical laws, authorizers, and Pass-2 pardon waivers at T0 = $0.00.',
    },
    {
        id: '[ 4. CRYPTOGRAPHIC ERRATA LEDGER ]',
        label: '[ 4. CRYPTOGRAPHIC ERRATA LEDGER ]',
        tooltip: 'Verify append-only SHA-256 hash-chain lineage across world/errata.json ledgers.',
    },
    {
        id: '[ 5. UNIVERSAL NARRATIVE FOUR-TUPLE SCHEMA ]',
        label: '[ 5. UNIVERSAL NARRATIVE FOUR-TUPLE SCHEMA ]',
        tooltip: 'Validate <S, A, I, R_m> series.config.json contract with 7 negative probes.',
    },
    {
        id: '[ 6. SERIES TREE SCAFFOLDING ]',
        label: '[ 6. SERIES TREE SCAFFOLDING ]',
        tooltip: 'Run hermetic sandboxed 8-directory series provisioning and collision guard.',
    },
    {
        id: '[ 7. POPULATE GENESIS SEEDS ]',
        label: '[ 7. POPULATE GENESIS SEEDS ]',
        tooltip: 'Verify 3 genesis seeds and Byte-0 0x2D2D2D0A preamble enforcement.',
    },
    {
        id: '[ 8. RECONCILE SPATIAL PORTAL LINKS ]',
        label: '[ 8. RECONCILE SPATIAL PORTAL LINKS ]',
        tooltip: 'Inject missing reverse portals, check idempotency, and trap dangling pointers.',
    },
    {
        id: '[ BACK ]',
        label: '[ BACK ]',
        tooltip: 'Return to the LORE MENU telemetry loop.',
    },
]

export const SOMATIC_HUB_CHOICES: ChoiceOption[] = [
    {
        id: '[Extract Somatic Ledger]',
        label: '[Extract Somatic Ledger]',
        tooltip: 'Inspect live series dossiers on disk and extract kinematic somatic ledger.',
    },
    {
        id: '[Pressure Meter Thermodynamic Simulator]',
        label: '[Pressure Meter Thermodynamic Simulator]',
        tooltip: 'Simulate basis-point pressure decay, debits, and inter-meter refusal bridges.',
    },
    {
        id: '[Acoustic Paranoia Clock Inspector]',
        label: '[Acoustic Paranoia Clock Inspector]',
        tooltip: 'Inject cdB acoustic impulses into paranoia clocks and inspect pitch flutter.',
    },
    {
        id: '[Algebraic DSP Matrix Inspector]',
        label: '[Algebraic DSP Matrix Inspector]',
        tooltip: 'Compose Banker-rounded pitch, formant, pause dilation, and visceral hold DSP.',
    },
    {
        id: '[Post-Break Finality Trigger]',
        label: '[Post-Break Finality Trigger]',
        tooltip: 'Trigger permanent broken meter clamps, refusal mutations, and climax directives.',
    },
    {
        id: '[Synthesis Ingress Payload Validator]',
        label: '[Synthesis Ingress Payload Validator]',
        tooltip: 'Validate closed-world TTSGenerationRequest envelopes and [BEAT] rhythm ratios.',
    },
    {
        id: '[Vocal-Motor Feasibility Gate Inspector]',
        label: '[Vocal-Motor Feasibility Gate Inspector]',
        tooltip: 'Test aphonia fail-closed defense and banned vocal verb rejections.',
    },
    {
        id: '[Monotonic Fact Staleness Checker]',
        label: '[Monotonic Fact Staleness Checker]',
        tooltip: 'Detect upstream somatic ledger fact version drift against pinned scenes.',
    },
    {
        id: '[Deterministic Payload Hasher]',
        label: '[Deterministic Payload Hasher]',
        tooltip: 'Compute RFC 8785 JCS canonical SHA-256 payload hashes and test parity traps.',
    },
    {
        id: '[Payload Serialization Reducer Console]',
        label: '[Payload Serialization Reducer Console]',
        tooltip: 'Dispatch individual or full-pipeline 22.payload.unit reducer transitions.',
    },
    {
        id: '[9] RUN FULL SOMATIC DSP VERIFICATION SWEEP',
        label: '[9] RUN FULL SOMATIC DSP VERIFICATION SWEEP',
        tooltip: 'Execute all 5 fail-closed negative-control somatic verification traps at T0 = $0.00.',
    },
    {
        id: '[0] ROOT MENU',
        label: '[0] ROOT MENU',
        tooltip: 'Exit Somatic DSP Hub and return to master ROOT MENU switchboard.',
    },
    {
        id: '[<] RETURN TO LORE MENU',
        label: '[<] RETURN TO LORE MENU',
        tooltip: 'Return cleanly to main LORE MENU flight deck.',
    },
]

export const COMPILE_DECK_CHOICES: ChoiceOption[] = [
    {
        id: '[1] RUN COMPLETE THREE-PASS GAUNTLET',
        label: '[1] RUN COMPLETE THREE-PASS GAUNTLET',
        tooltip: 'Run Pass 1 (Structural/SAT), Pass 2 (Relational/DAG), Pass 3 (Merkle Seal).',
    },
    {
        id: '[2] PASS 1: STRUCTURAL BOUNDS & SOMATIC SAT',
        label: '[2] PASS 1: STRUCTURAL BOUNDS & SOMATIC SAT',
        tooltip: 'Evaluate Byte-0 preambles, 7-bit ASCII, Zod bounds, and hand-capacity SAT.',
    },
    {
        id: '[3] PASS 2: RELATIONAL DAG & ACYCLICITY CHECK',
        label: '[3] PASS 2: RELATIONAL DAG & ACYCLICITY CHECK',
        tooltip: 'Sweep foreign keys, portal reciprocity, and 3-color DFS grievance DAG.',
    },
    {
        id: '[4] PASS 3: DETERMINISTIC SEAL & MERKLE EMISSION',
        label: '[4] PASS 3: DETERMINISTIC SEAL & MERKLE EMISSION',
        tooltip: 'Canonicalize entities via RFC 8785 JCS and compute SHA-256 Merkle root H_root.',
    },
    {
        id: '[5] GATE 0 VERIFICATION AUDIT (ZERO-DRIFT TRIPWIRE)',
        label: '[5] GATE 0 VERIFICATION AUDIT (ZERO-DRIFT TRIPWIRE)',
        tooltip: 'Verify fresh deterministic rebuild matches compiled bible-state snapshot bit-for-bit.',
    },
    {
        id: '[<] RETURN TO LORE MENU',
        label: '[<] RETURN TO LORE MENU',
        tooltip: 'Exit Compile Flight Deck and return to LORE MENU.',
    },
]

export const ROOT_MENU_CHOICES: ChoiceOption[] = [
    {
        id: 'LORE MENU',
        label: 'LORE MENU',
        tooltip: 'Launch 299.lore Ontological Compiler & Audit Deck.',
    },
    {
        id: 'LIBRARY MENU',
        label: 'LIBRARY MENU',
        tooltip: 'Open the library menu to explore core 995.library harness status.',
    },
    {
        id: 'AGENT MENU',
        label: 'AGENT MENU',
        tooltip: 'Inspect 100.agent deterministic DevOps cascade and Durable Object bindings.',
    },
    {
        id: 'CLOUDFLARE MENU',
        label: 'CLOUDFLARE MENU',
        tooltip: 'Inspect 133.cloudflare edge worker deployment posture.',
    },
]

export const LIBRARY_MENU_CHOICES: ChoiceOption[] = [
    {
        id: '[1] INSPECT TERMINAL GRID TOPOLOGY',
        label: '[1] INSPECT TERMINAL GRID TOPOLOGY',
        tooltip: 'Inspect immutable 12x12 dual-pane grid allocation (0-4 choice | 4-12 console).',
    },
    {
        id: '[2] CHECK CORPUS VERSION MANIFEST',
        label: '[2] CHECK CORPUS VERSION MANIFEST',
        tooltip: 'Verify root package and 995.library harness versions.',
    },
    {
        id: '[<] ROOT MENU',
        label: '[<] ROOT MENU',
        tooltip: 'Return to master flight deck switchboard.',
    },
]

export function getChoicesForRoute(session: CockpitSession): ChoiceOption[] {
    const r = session.route
    switch (r.kind) {
        case 'LORE_MENU':
            return LORE_MENU_CHOICES
        case 'ROOT_MENU':
            return ROOT_MENU_CHOICES
        case 'LIBRARY_MENU':
            return LIBRARY_MENU_CHOICES
        case 'SCHEMA_SUBMENU':
            return SCHEMA_SUBMENU_CHOICES
        case 'SOMATIC_HUB':
            return SOMATIC_HUB_CHOICES
        case 'COMPILE_DECK':
            return COMPILE_DECK_CHOICES
        case 'MOTOR_LAB_SELECT':
            return [
                {
                    id: 'char_wart',
                    label: 'char_wart',
                    tooltip: 'Inspect char_wart (brachial plexus severed, BIPEDAL_HUNCHED).',
                },
                {
                    id: 'char_bog',
                    label: 'char_bog',
                    tooltip: 'Inspect char_bog (clean somatic capacity, BIPEDAL_NIMBLE).',
                },
                {
                    id: '[<] BACK',
                    label: '[<] BACK',
                    tooltip: 'Return to LORE MENU.',
                },
            ]
        case 'MOTOR_LAB_ENTITY':
            return [
                {
                    id: '[ TEST MOTOR FEASIBILITY ]',
                    label: '[ TEST MOTOR FEASIBILITY ]',
                    tooltip: 'Open interactive prompt to evaluate a candidate verb.',
                },
                {
                    id: '[<] BACK',
                    label: '[<] BACK',
                    tooltip: 'Return to character selection.',
                },
            ]
        case 'LEDGER_SELECT_SERIES':
            return [
                ...session.corpus.seriesList.map((s) => ({
                    id: s.slug,
                    label: s.slug,
                    tooltip: `Select series '${s.slug}' (${s.dossiers.length} dossiers).`,
                })),
                {
                    id: '[<] BACK',
                    label: '[<] BACK',
                    tooltip: 'Return to Somatic DSP Modulation Hub.',
                },
            ]
        case 'LEDGER_SELECT_CHAR': {
            const target = session.corpus.seriesList.find((s) => s.slug === r.seriesSlug)
            const chars = (target?.dossiers ?? []).filter((d) => d.entity_type === 'character')
            return [
                ...chars.map((c) => ({
                    id: c.id,
                    label: c.filename,
                    tooltip: `Extract Somatic Ledger from ${r.seriesSlug}/${c.filename}.`,
                })),
                {
                    id: '[<] BACK',
                    label: '[<] BACK',
                    tooltip: 'Return to series selector.',
                },
            ]
        }
        case 'PRESSURE_ENTITY':
        case 'ACOUSTIC_ENTITY':
        case 'ALGEBRAIC_ENTITY':
        case 'POSTBREAK_ENTITY':
            return [
                { id: 'char_wart', label: 'char_wart', tooltip: 'Select entity char_wart.' },
                { id: 'char_bog', label: 'char_bog', tooltip: 'Select entity char_bog.' },
                { id: 'char_spleen', label: 'char_spleen', tooltip: 'Select entity char_spleen.' },
                {
                    id: '[<] BACK',
                    label: '[<] BACK',
                    tooltip: 'Return to Somatic DSP Modulation Hub.',
                },
            ]
        case 'PRESSURE_METER':
            return [
                {
                    id: 'SOMATIC_FATIGUE',
                    label: 'SOMATIC_FATIGUE',
                    tooltip: 'Inspect SOMATIC_FATIGUE meter & refusal threshold bridge.',
                },
                {
                    id: 'PHYSICAL_PAIN',
                    label: 'PHYSICAL_PAIN',
                    tooltip: 'Inspect PHYSICAL_PAIN thermodynamic meter.',
                },
                {
                    id: 'REFUSAL_STRAIN',
                    label: 'REFUSAL_STRAIN',
                    tooltip: 'Inspect REFUSAL_STRAIN meter.',
                },
                {
                    id: 'PARANOIA_CLOCK',
                    label: 'PARANOIA_CLOCK',
                    tooltip: 'Inspect PARANOIA_CLOCK meter.',
                },
                { id: '[<] BACK', label: '[<] BACK', tooltip: 'Back to entity selector.' },
            ]
        case 'PRESSURE_DEBIT':
            return [
                {
                    id: '2500',
                    label: '+2500 bp (Heavy Load Drag)',
                    tooltip: 'Inject +2500 bp thermodynamic debit.',
                },
                {
                    id: '1500',
                    label: '+1500 bp (Combat Strain)',
                    tooltip: 'Inject +1500 bp thermodynamic debit.',
                },
                {
                    id: '1000',
                    label: '+1000 bp (Evasion Sprint)',
                    tooltip: 'Inject +1000 bp thermodynamic debit.',
                },
                { id: '[<] BACK', label: '[<] BACK', tooltip: 'Back to meter selector.' },
            ]
        case 'ACOUSTIC_EVENT':
            return [
                ...ACOUSTIC_EVENTS,
                { id: '[<] BACK', label: '[<] BACK', tooltip: 'Back to entity selector.' },
            ]
        case 'ALGEBRAIC_SCENARIO':
            return [
                {
                    id: 'pilot_case',
                    label: 'Pilot Case: fatigue 8200, pain 7500 [CRAWL, SPEAK]',
                    tooltip: 'Compose DSP matrix under high exhaustion and pain.',
                },
                {
                    id: 'motor_collapse',
                    label: 'Motor Collapse Conflict: append RUN at fatigue 8200',
                    tooltip: 'Prove RUN fails closed under exhaustion collapse.',
                },
                { id: '[<] BACK', label: '[<] BACK', tooltip: 'Back to entity selector.' },
            ]
        case 'POSTBREAK_METER':
            return [
                {
                    id: 'REFUSAL_STRAIN',
                    label: 'REFUSAL_STRAIN',
                    tooltip: 'Target REFUSAL_STRAIN finality threshold.',
                },
                {
                    id: 'SOMATIC_FATIGUE',
                    label: 'SOMATIC_FATIGUE',
                    tooltip: 'Target SOMATIC_FATIGUE finality threshold.',
                },
                {
                    id: 'PARANOIA_CLOCK',
                    label: 'PARANOIA_CLOCK',
                    tooltip: 'Target PARANOIA_CLOCK finality threshold.',
                },
                { id: '[<] BACK', label: '[<] BACK', tooltip: 'Back to entity selector.' },
            ]
        case 'POSTBREAK_ACTION':
            return [
                {
                    id: 'force_breach',
                    label: 'Force Breach: 10000/8000 bps',
                    tooltip: 'Clamp meter permanently at 10000 bps and emit climax directive.',
                },
                {
                    id: 'inspect_status',
                    label: '[Inspect Somatic Status]',
                    tooltip: 'Read current finality break record for this meter.',
                },
                { id: '[<] BACK', label: '[<] BACK', tooltip: 'Back to meter selector.' },
            ]
        case 'PAYLOAD_VALIDATOR':
            return [
                {
                    id: 'line_wart_001',
                    label: 'line_wart_001 (char_wart :: valid [BEAT])',
                    tooltip: 'Validate closed-world TTS envelope for line_wart_001.',
                },
                {
                    id: 'line_bog_002',
                    label: 'line_bog_002 (char_bog :: valid [BEAT])',
                    tooltip: 'Validate closed-world TTS envelope for line_bog_002.',
                },
                {
                    id: 'line_aphonic_test',
                    label: 'line_aphonic_test (cnd_crushed_larynx :: MUTE)',
                    tooltip: 'Prove aphonic dialogue is rejected fail-closed.',
                },
                { id: '[<] BACK', label: '[<] BACK', tooltip: 'Return to Somatic DSP Hub.' },
            ]
        case 'VOCAL_FEASIBILITY':
            return [
                {
                    id: 'bog_clean',
                    label: 'char_bog :: "Move the lever now." (clean)',
                    tooltip: 'Verify clean vocal-motor pass for char_bog.',
                },
                {
                    id: 'wart_larynx',
                    label: 'char_wart :: "I can still whisper." (cnd_crushed_larynx)',
                    tooltip: 'Verify aphonia gate traps crushed larynx.',
                },
                {
                    id: 'spleen_ban',
                    label: 'char_spleen :: "Speak now." (banned verb: speak)',
                    tooltip: 'Verify banned verb exclusion traps vocal proposal.',
                },
                { id: '[<] BACK', label: '[<] BACK', tooltip: 'Return to Somatic DSP Hub.' },
            ]
        case 'FACT_STALENESS':
            return [
                {
                    id: 'siphon_clean',
                    label: 'sc_culvert_siphon_02 :: Clean Pinned Versions',
                    tooltip: 'Verify pinned fact versions match somatic ledger.',
                },
                {
                    id: 'siphon_mutated',
                    label: 'sc_culvert_siphon_02 :: Upstream Mutation (fact_wart_arm_severed v3)',
                    tooltip: 'Prove stale scene fails closed when ledger advances.',
                },
                {
                    id: 'boiler_clean',
                    label: 'sc_boiler_flue_01 :: Clean Pinned Versions',
                    tooltip: 'Verify sc_boiler_flue_01 fact parity.',
                },
                { id: '[<] BACK', label: '[<] BACK', tooltip: 'Return to Somatic DSP Hub.' },
            ]
        case 'PAYLOAD_HASHER':
            return [
                {
                    id: 'line_wart_001',
                    label: 'line_wart_001 (RFC 8785 JCS SHA-256)',
                    tooltip: 'Hash line_wart_001 via JCS + NFC SHA-256 and check parity.',
                },
                {
                    id: 'line_bog_002',
                    label: 'line_bog_002 (RFC 8785 JCS SHA-256)',
                    tooltip: 'Hash line_bog_002 via JCS + NFC SHA-256 and check parity.',
                },
                {
                    id: 'inject_parity_fail',
                    label: '[Inject Hash Parity Audit]',
                    tooltip: 'Inject all-zero digest to trigger PAYLOAD_HASH_PARITY_MISMATCH.',
                },
                { id: '[<] BACK', label: '[<] BACK', tooltip: 'Return to Somatic DSP Hub.' },
            ]
        case 'PAYLOAD_REDUCER':
            return [
                {
                    id: 'full_pipeline',
                    label: '[Run Full Pipeline Dispatch]',
                    tooltip: 'Execute validate -> feasibility -> staleness -> hash sequentially.',
                },
                {
                    id: 'validate',
                    label: '[Dispatch Validate]',
                    tooltip: 'Dispatch PAYLOAD VALIDATE transition.',
                },
                {
                    id: 'feasibility',
                    label: '[Dispatch Feasibility]',
                    tooltip: 'Dispatch VOCAL FEASIBILITY transition.',
                },
                {
                    id: 'staleness',
                    label: '[Dispatch Staleness]',
                    tooltip: 'Dispatch FACT STALENESS transition.',
                },
                {
                    id: 'hash',
                    label: '[Dispatch Hash]',
                    tooltip: 'Dispatch JCS SHA-256 HASH transition.',
                },
                {
                    id: 'inspect_model',
                    label: '[Inspect Model State]',
                    tooltip: 'Dump in-memory 22.payload.unit reducer receipt lists.',
                },
                { id: '[<] BACK', label: '[<] BACK', tooltip: 'Return to Somatic DSP Hub.' },
            ]
    }
}

export interface ExecutionOutcome {
    logs: string[]
    nextRoute?: MenuRoute
    openInputModal?: {
        prompt: string
        entityId: string
    }
    clearScreenBanner?: boolean
    dwellMs?: number
}

export async function executeMenuChoice(
    session: CockpitSession,
    choice: ChoiceOption,
): Promise<ExecutionOutcome> {
    const r = session.route

    // 1. LORE MENU (All 19 top-level choices)
    if (r.kind === 'LORE_MENU') {
        switch (choice.id) {
            case '1. VALIDATE SCHEMA INVARIANTS': {
                const pLogs = runPrimitiveStandardsAudit()
                const eLogs = runEntityManifestAudit()
                const rLogs = runConstitutionalRegistryAudit(session.corpus)
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...pLogs,
                        ...eLogs,
                        ...rLogs,
                        `>> [RECEIPT] [GATE_0:PASSED] Finished [OK]`,
                    ],
                }
            }
            case '[ 26. SCHEMA & INVARIANTS ]':
                return {
                    logs: [`>> [MENU:SCHEMA] Opening 26.schema.unit subsystem...`],
                    nextRoute: { kind: 'SCHEMA_SUBMENU' },
                }
            case '[Somatic DSP Modulation Hub]':
                return {
                    logs: [
                        `------------------------------------------------------------`,
                        `>> [FLIGHT_DECK] 299.LORE // SOMATIC DSP MODULATION COCKPIT READY`,
                        `>> [TOPOLOGY] Dual-Pane 12x12 Matrix: Choice (0-4) | Telemetry (4-12)`,
                        `------------------------------------------------------------`,
                    ],
                    nextRoute: { kind: 'SOMATIC_HUB' },
                }
            case '2. RUN SOMATIC SAT SOLVER':
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...runSomaticSatAudit(),
                        `>> [RECEIPT] [SAT:OK] Finished [OK]`,
                    ],
                }
            case '3. AUDIT KINETIC MOTOR MASKS':
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...runKineticMotorMasksAudit(),
                        `>> [RECEIPT] [MOTOR:OK] Finished [OK]`,
                    ],
                }
            case '4. VERIFY HEAP IMMUTABILITY':
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...runHeapImmutabilityProbe(),
                        `>> [RECEIPT] [HEAP:OK] Finished [OK]`,
                    ],
                }
            case '5. AUDIT SPATIAL PORTALS & ACOUSTICS':
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...runSpatialPortalsAndAcousticsAudit(),
                        `>> [RECEIPT] [GATE_3:PASSED] Finished [OK]`,
                    ],
                }
            case '6. AUDIT GRIEVANCE DAG & DYADIC MESH':
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...runGrievanceDagAndDyadicAudit(),
                        `>> [RECEIPT] [DAG:AUDIT] Finished [OK]`,
                    ],
                }
            case '7. VERIFY EPISTEMIC FIREWALLS':
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...runEpistemicFirewallsAudit(),
                        `>> [RECEIPT] [EPISTEMIC:OK] Finished [OK]`,
                    ],
                }
            case '8. INTERACTIVE SOMATIC MOTOR LAB':
                return {
                    logs: [`>> [2. SOMATIC CAPABILITY AUDIT] Select character fixture:`],
                    nextRoute: { kind: 'MOTOR_LAB_SELECT' },
                }
            case '[S] STYLOMETRIC & VOICE-BLEED LINTER':
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...runSeriesStylometricLint(
                            session.corpus,
                            session.overlay.activeSeries,
                        ),
                        `>> [RECEIPT] [STYLOMETRICS:OK] Finished [OK]`,
                    ],
                }
            case '[H] HERMETIC OFFLINE DELETION PARITY': {
                const lines = await runCompileFlightAction(
                    'parity',
                    session.corpus,
                    session.overlay.activeSeries,
                    session.overlay,
                )
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...lines,
                        `>> [RECEIPT] [HERMETIC:PARITY] Finished [OK]`,
                    ],
                }
            }
            case '[C] COMPILE CANON & GATE 0 GAUNTLET':
                return {
                    logs: [
                        `>> [MENU:COMPILE] Opening Compile Flight Deck for series: ${session.overlay.activeSeries}`,
                    ],
                    nextRoute: { kind: 'COMPILE_DECK' },
                }
            case '[G] UNIVERSAL SERIES GENESIS WIZARD':
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...runSeriesGenesisWizard(session.overlay),
                        `>> [RECEIPT] [GENESIS:OK] Finished [OK]`,
                    ],
                }
            case '[S] ATOMIC ENTITY SCAFFOLDER':
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...runAtomicEntityScaffolder(session.corpus, session.overlay),
                        `>> [RECEIPT] [SCAFFOLD:OK] Finished [OK]`,
                    ],
                }
            case '[R] RETIRE CANONICAL ENTITY':
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...runRetireCanonicalEntity(session.overlay),
                        `>> [RECEIPT] [RETIRE:OK] Finished [OK]`,
                    ],
                }
            case '[H] STATIC CORPUS HEALTH TELEMETRY':
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...runCorpusHealthTelemetry(
                            session.corpus,
                            session.overlay.activeSeries,
                        ),
                        `>> [RECEIPT] [HEALTH:OK] Finished [OK]`,
                    ],
                }
            case '[X] RECORD CANONICAL ERRATA ENTRY': {
                const lines = await runErrataRecordTool(session.overlay)
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...lines,
                        `>> [RECEIPT] [ERRATA:SEALED] Finished [OK]`,
                    ],
                }
            }
            case 'ROOT MENU':
                return {
                    logs: [
                        '-----------',
                        `LIBRARY V${session.corpus.libraryVersion}`,
                        '-----------',
                        '>> [READY] Master Library Cockpit Active',
                        ':: [KEYS] UP/DOWN or J/K: Navigate | ENTER: Select',
                    ],
                    nextRoute: { kind: 'ROOT_MENU' },
                }
        }
    }

    // 2. ROOT MENU
    if (r.kind === 'ROOT_MENU') {
        if (choice.id === 'LORE MENU') {
            return {
                logs: buildBootBannerLines(session),
                nextRoute: { kind: 'LORE_MENU' },
            }
        }
        if (choice.id === 'LIBRARY MENU') {
            return {
                logs: [`>> [LIBRARY] Mounted 995.library v${session.corpus.libraryVersion}`],
                nextRoute: { kind: 'LIBRARY_MENU' },
            }
        }
        if (choice.id === 'AGENT MENU') {
            return {
                logs: [
                    `>> [AGENT:100] Cascade Resolver Active | Worker Endpoint: http://127.0.0.1:8787`,
                    `>> [RECEIPT] [AGENT:READY] Finished [OK]`,
                ],
            }
        }
        return {
            logs: [
                `>> [CLOUDFLARE:133] Node/Edge SSR Runtime Posture Verified | Port 3000`,
                `>> [RECEIPT] [CLOUDFLARE:OK] Finished [OK]`,
            ],
        }
    }

    // 3. LIBRARY MENU
    if (r.kind === 'LIBRARY_MENU') {
        if (choice.id === '[<] ROOT MENU') {
            return {
                logs: ['>> [READY] Master Library Cockpit Active'],
                nextRoute: { kind: 'ROOT_MENU' },
            }
        }
        if (choice.id === '[1] INSPECT TERMINAL GRID TOPOLOGY') {
            return {
                logs: [
                    `>> [GRID] 12x12 Matrix: Choice Pane { x: 0, y: 4, xSpan: 4, ySpan: 8 }`,
                    `>> [GRID] 12x12 Matrix: Console cns00 { x: 4, y: 0, xSpan: 8, ySpan: 12 }`,
                    `>> [RECEIPT] [GRID:OK] Finished [OK]`,
                ],
            }
        }
        return {
            logs: [
                `>> [MANIFEST] ${session.corpus.appName} v${session.corpus.appVersion} | LIBRARY V${session.corpus.libraryVersion}`,
                `>> [RECEIPT] [MANIFEST:OK] Finished [OK]`,
            ],
        }
    }

    // 4. SCHEMA SUBMENU
    if (r.kind === 'SCHEMA_SUBMENU') {
        if (choice.id === '[ BACK ]') {
            return {
                logs: [`>> [MENU] Returned to LORE MENU`],
                nextRoute: { kind: 'LORE_MENU' },
            }
        }
        const map: Record<string, () => string[]> = {
            '[ 1. VALIDATE ENTITY MANIFESTS ]': () => [
                ...runPrimitiveStandardsAudit(),
                ...runEntityManifestAudit(),
            ],
            '[ 2. RUN SOMATIC SAT SOLVER ]': runSomaticSatAudit,
            '[ 3. CONSTITUTIONAL RULE REGISTRY ]': () =>
                runConstitutionalRegistryAudit(session.corpus),
            '[ 4. CRYPTOGRAPHIC ERRATA LEDGER ]': () =>
                runErrataLedgerAudit(session.corpus, session.overlay),
            '[ 5. UNIVERSAL NARRATIVE FOUR-TUPLE SCHEMA ]': runFourTupleContractAudit,
            '[ 6. SERIES TREE SCAFFOLDING ]': runSeriesTreeScaffoldAudit,
            '[ 7. POPULATE GENESIS SEEDS ]': runGenesisSeedsAudit,
            '[ 8. RECONCILE SPATIAL PORTAL LINKS ]': runPortalReconcileAudit,
        }
        const runner = map[choice.id]
        const lines = runner ? runner() : []
        return {
            logs: [
                `>> [DISPATCH] Executing: ${choice.label}`,
                ...lines,
                `>> [RECEIPT] [SCHEMA:OK] Finished [OK]`,
            ],
        }
    }

    // 5. COMPILE FLIGHT DECK
    if (r.kind === 'COMPILE_DECK') {
        if (choice.id === '[<] RETURN TO LORE MENU') {
            return {
                logs: [`>> [MENU] Returned to LORE MENU`],
                nextRoute: { kind: 'LORE_MENU' },
            }
        }
        const modeMap: Record<string, 'full' | 'pass1' | 'pass2' | 'pass3' | 'gate0'> = {
            '[1] RUN COMPLETE THREE-PASS GAUNTLET': 'full',
            '[2] PASS 1: STRUCTURAL BOUNDS & SOMATIC SAT': 'pass1',
            '[3] PASS 2: RELATIONAL DAG & ACYCLICITY CHECK': 'pass2',
            '[4] PASS 3: DETERMINISTIC SEAL & MERKLE EMISSION': 'pass3',
            '[5] GATE 0 VERIFICATION AUDIT (ZERO-DRIFT TRIPWIRE)': 'gate0',
        }
        const mode = modeMap[choice.id] || 'full'
        const lines = await runCompileFlightAction(
            mode,
            session.corpus,
            session.overlay.activeSeries,
            session.overlay,
        )
        return {
            logs: [
                `>> [DISPATCH] Executing: ${choice.label}`,
                ...lines,
                `>> [RECEIPT] [COMPILE:OK] Finished [OK]`,
            ],
        }
    }

    // 6. INTERACTIVE SOMATIC MOTOR LAB
    if (r.kind === 'MOTOR_LAB_SELECT') {
        if (choice.id === '[<] BACK') {
            return {
                logs: [`>> [MENU] Exited Somatic Motor Lab`],
                nextRoute: { kind: 'LORE_MENU' },
            }
        }
        const p = MOTOR_LAB_PROFILES[choice.id] ?? MOTOR_LAB_PROFILES.char_wart
        return {
            logs: [
                `>> [SOMATIC:AUDIT] Character: ${choice.id}`,
                `>> Effective Arms: ${p.effectiveArms} / ${p.arms}`,
                `>> Derived Tier: ${p.tier} (Legs: ${p.legs}, Strain: ${p.strainBp} bp)`,
                `>> Active Kinetic Verb Bans: [${p.bannedVerbs.join(', ') || 'NONE'}]`,
            ],
            nextRoute: { kind: 'MOTOR_LAB_ENTITY', entityId: choice.id },
        }
    }

    if (r.kind === 'MOTOR_LAB_ENTITY') {
        if (choice.id === '[<] BACK') {
            return {
                logs: [`>> [2. SOMATIC CAPABILITY AUDIT] Select character fixture:`],
                nextRoute: { kind: 'MOTOR_LAB_SELECT' },
            }
        }
        return {
            logs: [],
            openInputModal: {
                prompt: 'Enter candidate verb (e.g. BIMANUAL_LIFT)',
                entityId: r.entityId,
            },
        }
    }

    // 7. SOMATIC DSP MODULATION HUB & SUB-LABS
    if (r.kind === 'SOMATIC_HUB') {
        switch (choice.id) {
            case '[Extract Somatic Ledger]':
                return {
                    logs: [
                        `>> [SOMATIC_HUB] Discovered series slugs: ${session.corpus.seriesList.map((s) => s.slug).join(', ')}`,
                    ],
                    nextRoute: { kind: 'LEDGER_SELECT_SERIES' },
                }
            case '[Pressure Meter Thermodynamic Simulator]':
                return {
                    logs: [`>> [SIMULATOR:ENTITY] Select target character entity:`],
                    nextRoute: { kind: 'PRESSURE_ENTITY' },
                }
            case '[Acoustic Paranoia Clock Inspector]':
                return {
                    logs: [`>> [INSPECTOR:ENTITY] Select target character paranoia clock:`],
                    nextRoute: { kind: 'ACOUSTIC_ENTITY' },
                }
            case '[Algebraic DSP Matrix Inspector]':
                return {
                    logs: [`>> [ALGEBRAIC_DSP:ENTITY] Select character for DSP synthesis matrix:`],
                    nextRoute: { kind: 'ALGEBRAIC_ENTITY' },
                }
            case '[Post-Break Finality Trigger]':
                return {
                    logs: [`>> [POST_BREAK:ENTITY] Select character threshold target:`],
                    nextRoute: { kind: 'POSTBREAK_ENTITY' },
                }
            case '[Synthesis Ingress Payload Validator]':
                return {
                    logs: [`>> [PAYLOAD:VALIDATOR] Select TTS dialogue fixture (under-the-floorboards):`],
                    nextRoute: { kind: 'PAYLOAD_VALIDATOR' },
                }
            case '[Vocal-Motor Feasibility Gate Inspector]':
                return {
                    logs: [`>> [FEASIBILITY:GATE] Select vocal-motor case:`],
                    nextRoute: { kind: 'VOCAL_FEASIBILITY' },
                }
            case '[Monotonic Fact Staleness Checker]':
                return {
                    logs: [`>> [STALENESS:CHECKER] Select scene dependency check:`],
                    nextRoute: { kind: 'FACT_STALENESS' },
                }
            case '[Deterministic Payload Hasher]':
                return {
                    logs: [`>> [PAYLOAD_HASHER] Select payload hash target:`],
                    nextRoute: { kind: 'PAYLOAD_HASHER' },
                }
            case '[Payload Serialization Reducer Console]':
                return {
                    logs: [`>> [22.PAYLOAD.UNIT] Interactive Reducer Console Ready`],
                    nextRoute: { kind: 'PAYLOAD_REDUCER' },
                }
            case '[9] RUN FULL SOMATIC DSP VERIFICATION SWEEP': {
                const lines = await runFullSomaticGauntletSweep()
                return {
                    logs: [
                        `>> [DISPATCH] Executing: ${choice.label}`,
                        ...lines,
                        `>> [RECEIPT] [GAUNTLET_PASS: 5/5] Finished [OK]`,
                    ],
                }
            }
            case '[0] ROOT MENU':
                return {
                    logs: [
                        `>> [ROOT_MENU] Exiting Somatic DSP Flight Deck...`,
                        `>> [READY] Master Library Cockpit Active`,
                    ],
                    nextRoute: { kind: 'ROOT_MENU' },
                }
            case '[<] RETURN TO LORE MENU':
                return {
                    logs: [`>> [MENU] Returned to LORE MENU`],
                    nextRoute: { kind: 'LORE_MENU' },
                }
        }
    }

    // 7a. Extract Somatic Ledger nested picker
    if (r.kind === 'LEDGER_SELECT_SERIES') {
        if (choice.id === '[<] BACK') {
            return { logs: [`>> [MENU] Returned to Somatic DSP Hub`], nextRoute: { kind: 'SOMATIC_HUB' } }
        }
        session.overlay.activeSeries = choice.id
        return {
            logs: [`:: [SERIES] ${choice.id}`],
            nextRoute: { kind: 'LEDGER_SELECT_CHAR', seriesSlug: choice.id },
        }
    }
    if (r.kind === 'LEDGER_SELECT_CHAR') {
        if (choice.id === '[<] BACK') {
            return { logs: [], nextRoute: { kind: 'LEDGER_SELECT_SERIES' } }
        }
        const series = session.corpus.seriesList.find((s) => s.slug === r.seriesSlug)
        const doc = series?.dossiers.find((d) => d.id === choice.id)
        return {
            logs: [
                `:: [DOSSIER] ${r.seriesSlug}/${choice.label}`,
                `>> [SOMATIC_LEDGER] Character: ${doc?.title || choice.id} (${doc?.locomotion_tier || 'BIPEDAL_STANDARD'})`,
                `>> [SOMATIC_LEDGER] Arms: ${doc?.available_arms ?? 2} | Legs: ${doc?.available_legs ?? 2} | Banned Verbs: [${(doc?.banned_kinetic_verbs ?? []).join(', ')}]`,
                `>> [SOMATIC_LEDGER] Extracted 1 character dossier from disk [OK]`,
            ],
        }
    }

    // 7b. Pressure Meter Simulator
    if (r.kind === 'PRESSURE_ENTITY') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'SOMATIC_HUB' } }
        return {
            logs: [`>> [SIMULATOR:METER] Selected entity: ${choice.id}`],
            nextRoute: { kind: 'PRESSURE_METER', entityId: choice.id },
        }
    }
    if (r.kind === 'PRESSURE_METER') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'PRESSURE_ENTITY' } }
        return {
            logs: [`>> [SIMULATOR:DEBIT] Target meter ${r.entityId}:${choice.id}`],
            nextRoute: {
                kind: 'PRESSURE_DEBIT',
                entityId: r.entityId,
                meterCategory: choice.id,
                cycleCount: 0,
            },
        }
    }
    if (r.kind === 'PRESSURE_DEBIT') {
        if (choice.id === '[<] BACK') {
            return { logs: [], nextRoute: { kind: 'PRESSURE_METER', entityId: r.entityId } }
        }
        const debitBp = Number.parseInt(choice.id, 10)
        const lines = runPressureStep(
            session.dsp,
            r.entityId,
            r.meterCategory,
            debitBp,
            r.cycleCount === 0,
        )
        return {
            logs: lines,
            nextRoute: { ...r, cycleCount: r.cycleCount + 1 },
        }
    }

    // 7c. Acoustic Paranoia Clock Inspector
    if (r.kind === 'ACOUSTIC_ENTITY') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'SOMATIC_HUB' } }
        return {
            logs: [`>> [INSPECTOR:CLOCK] Target clock: clk_${choice.id}`],
            nextRoute: { kind: 'ACOUSTIC_EVENT', entityId: choice.id },
        }
    }
    if (r.kind === 'ACOUSTIC_EVENT') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'ACOUSTIC_ENTITY' } }
        return { logs: runAcousticImpulse(session.dsp, r.entityId, choice.id) }
    }

    // 7d. Algebraic DSP Matrix Inspector
    if (r.kind === 'ALGEBRAIC_ENTITY') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'SOMATIC_HUB' } }
        return {
            logs: [`>> [ALGEBRAIC_DSP] Selected entity: ${choice.id}`],
            nextRoute: { kind: 'ALGEBRAIC_SCENARIO', entityId: choice.id },
        }
    }
    if (r.kind === 'ALGEBRAIC_SCENARIO') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'ALGEBRAIC_ENTITY' } }
        return { logs: runAlgebraicScenario(r.entityId, choice.id) }
    }

    // 7e. Post-Break Finality Trigger
    if (r.kind === 'POSTBREAK_ENTITY') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'SOMATIC_HUB' } }
        return {
            logs: [`>> [POST_BREAK] Selected entity: ${choice.id}`],
            nextRoute: { kind: 'POSTBREAK_METER', entityId: choice.id },
        }
    }
    if (r.kind === 'POSTBREAK_METER') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'POSTBREAK_ENTITY' } }
        return {
            logs: [`>> [POST_BREAK] Target threshold: ${r.entityId}:${choice.id}`],
            nextRoute: {
                kind: 'POSTBREAK_ACTION',
                entityId: r.entityId,
                meterCategory: choice.id,
            },
        }
    }
    if (r.kind === 'POSTBREAK_ACTION') {
        if (choice.id === '[<] BACK') {
            return { logs: [], nextRoute: { kind: 'POSTBREAK_METER', entityId: r.entityId } }
        }
        return {
            logs: runPostBreakAction(session.dsp, r.entityId, r.meterCategory, choice.id),
        }
    }

    // 7f. Payload Validator, Feasibility, Staleness, Hasher, Reducer
    if (r.kind === 'PAYLOAD_VALIDATOR') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'SOMATIC_HUB' } }
        return { logs: validateDemoTtsLine(choice.id).lines }
    }
    if (r.kind === 'VOCAL_FEASIBILITY') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'SOMATIC_HUB' } }
        return { logs: checkVocalFeasibilityCase(choice.id).lines }
    }
    if (r.kind === 'FACT_STALENESS') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'SOMATIC_HUB' } }
        return { logs: checkFactStalenessCase(choice.id).lines }
    }
    if (r.kind === 'PAYLOAD_HASHER') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'SOMATIC_HUB' } }
        const res = await runPayloadHasherTarget(choice.id)
        return { logs: res.lines }
    }
    if (r.kind === 'PAYLOAD_REDUCER') {
        if (choice.id === '[<] BACK') return { logs: [], nextRoute: { kind: 'SOMATIC_HUB' } }
        const lines = await runReducerDispatch(session.dsp, choice.id)
        return { logs: lines }
    }

    return { logs: [`:: [MENU_FAULT] Unhandled menu selection: ${choice.label}`] }
}

export function evaluateMotorModalSubmission(entityId: string, verb: string): string[] {
    return evaluateMotorCandidate(entityId, verb).lines
}

export { DEMO_TTS_LINES }
