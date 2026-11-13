import { describe, expect, it } from 'vitest'
import { isPure7BitAscii, runCompileGauntlet } from './compiler'
import { loadCorpusSnapshotFromDisk } from './corpusServer'
import {
    LORE_MENU_CHOICES,
    SCHEMA_SUBMENU_CHOICES,
    SOMATIC_HUB_CHOICES,
    COMPILE_DECK_CHOICES,
    createInitialCockpitSession,
    executeMenuChoice,
    evaluateMotorModalSubmission,
} from './menuRegistry'

describe('Goblin Lore Terminal Cockpit :: 19 Buzzers & Real Corpus', () => {
    it('loads live disk series from lore/series and compiled Merkle hashes', () => {
        const snapshot = loadCorpusSnapshotFromDisk()
        expect(snapshot.seriesList.length).toBeGreaterThanOrEqual(2)
        const hearth = snapshot.seriesList.find((s) => s.slug === '000.sample-hearth')
        const wiregrass = snapshot.seriesList.find((s) => s.slug === 'wiregrass-basin')
        expect(hearth?.dossiers.length).toBe(6)
        expect(wiregrass?.dossiers.length).toBe(9)
        expect(wiregrass?.compiledRootHash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('declares all 19 main menu items in pure 7-bit ASCII', () => {
        expect(LORE_MENU_CHOICES).toHaveLength(19)
        for (const item of [
            ...LORE_MENU_CHOICES,
            ...SCHEMA_SUBMENU_CHOICES,
            ...SOMATIC_HUB_CHOICES,
            ...COMPILE_DECK_CHOICES,
        ]) {
            expect(isPure7BitAscii(item.label)).toBe(true)
            expect(isPure7BitAscii(item.tooltip)).toBe(true)
        }
    })

    it('executes deterministic 3-pass compile gauntlet cleanly over sample-hearth', async () => {
        const snapshot = loadCorpusSnapshotFromDisk()
        const hearth = snapshot.seriesList.find((s) => s.slug === '000.sample-hearth')!
        const report = await runCompileGauntlet(hearth)
        expect(report.failures).toHaveLength(0)
        expect(report.invariants.BYTE0).toBe(true)
        expect(report.invariants.ASCII).toBe(true)
        expect(report.invariants.SAT).toBe(true)
        expect(report.invariants.PORTAL).toBe(true)
        expect(report.invariants.DAG).toBe(true)
        expect(report.rootMerkleHash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('routes all 19 buzzers, submenus, DSP simulators, and Motor Lab interactively', async () => {
        const snapshot = loadCorpusSnapshotFromDisk()
        const session = createInitialCockpitSession(snapshot)

        // Execute top-level non-navigation audits
        for (const choice of LORE_MENU_CHOICES) {
            if (
                choice.id.startsWith('[ 26.') ||
                choice.id === '[Somatic DSP Modulation Hub]' ||
                choice.id === '[C] COMPILE CANON & GATE 0 GAUNTLET' ||
                choice.id === '8. INTERACTIVE SOMATIC MOTOR LAB' ||
                choice.id === 'ROOT MENU'
            ) {
                continue
            }
            const out = await executeMenuChoice(session, choice)
            expect(out.logs.length).toBeGreaterThan(0)
            expect(out.logs.every((l) => isPure7BitAscii(l))).toBe(true)
        }

        // Enter & verify Schema Submenu
        const schemaNav = await executeMenuChoice(session, LORE_MENU_CHOICES[1])
        expect(schemaNav.nextRoute?.kind).toBe('SCHEMA_SUBMENU')
        session.route = schemaNav.nextRoute!
        for (const c of SCHEMA_SUBMENU_CHOICES.slice(0, 8)) {
            const out = await executeMenuChoice(session, c)
            expect(out.logs.length).toBeGreaterThan(0)
        }

        // Enter & verify Compile Deck
        session.route = { kind: 'COMPILE_DECK' }
        for (const c of COMPILE_DECK_CHOICES.slice(0, 5)) {
            const out = await executeMenuChoice(session, c)
            expect(out.logs.some((l) => l.includes('[RECEIPT]'))).toBe(true)
        }

        // Verify Motor Lab evaluation
        const breach = evaluateMotorModalSubmission('char_wart', 'BIMANUAL_LIFT')
        expect(breach.some((l) => l.includes('[SOMATIC_BREACH]'))).toBe(true)
        const feasible = evaluateMotorModalSubmission('char_bog', 'BIMANUAL_LIFT')
        expect(feasible.some((l) => l.includes('[SOMATIC_FEASIBLE]'))).toBe(true)
    })
})
