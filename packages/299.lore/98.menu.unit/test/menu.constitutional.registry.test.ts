/**
 * packages/299.lore/98.menu.unit/test/menu.constitutional.registry.test.ts
 *
 * Vitest verification suite for the Phase 2 Constitutional Rule Registry
 * menu wiring: schema-backed rule loading, pardon ledger discovery,
 * fails-closed foreign-key gauntlet, and cns00 telemetry formatting.
 */

import { describe, it, expect } from 'vitest'
import { MenuModel } from '../menu.model'
import { updateMenu, openSchemaInvariantsMenu } from '../buz/00.menu.buzz'
import {
    REGISTRY_MENU_LABEL,
    REGISTRY_AUDIT_HEADER,
    REGISTRY_SEALED_FOOTER,
    REGISTRY_BREACHED_FOOTER,
    runConstitutionalRegistryAudit,
    discoverPardonLedgers,
    auditPardonLedger,
} from '../buz/15.constitutional.registry.buzz'
import { SCHEMA_SOLVER_MENU_LABEL } from '../buz/05.schema.solver.audit.buzz'
import type { PardonRecord } from '../../03.laws.unit/fce/pardon.schema.js'

describe('299.lore - Constitutional Rule Registry Menu Wiring Suite', () => {
    it('updateMenu -- exposes the [ 26. SCHEMA & INVARIANTS ] route from the lore menu', async () => {
        let resolved: any = null
        const bal = {
            idx: 'test-menu',
            slv: (res: any) => {
                resolved = res
            },
        }

        const model = new MenuModel()
        await updateMenu(model, bal as any, undefined as any)

        expect(resolved).toBeTruthy()
        expect(resolved.mnuBit.lst).toContain(SCHEMA_SOLVER_MENU_LABEL)
        expect(resolved.mnuBit.lst).toContain('[ 26. SCHEMA & INVARIANTS ]')
    })

    it('openSchemaInvariantsMenu -- exposes manifest, solver, registry, and back options headless', async () => {
        let resolved: any = null
        const bal = {
            idx: 'test-schema-menu',
            dat: { activeSeries: '001.goblin-lore' },
            slv: (res: any) => {
                resolved = res
            },
        }

        const model = new MenuModel()
        await openSchemaInvariantsMenu(model, bal as any, undefined as any)

        expect(resolved).toBeTruthy()
        expect(resolved.mnuBit.lst).toContain(
            '[ 1. VALIDATE ENTITY MANIFESTS ]',
        )
        expect(resolved.mnuBit.lst).toContain('[ 2. RUN SOMATIC SAT SOLVER ]')
        expect(resolved.mnuBit.lst).toContain(REGISTRY_MENU_LABEL)
        expect(resolved.mnuBit.lst).toContain('[ BACK ]')
    })

    it('runConstitutionalRegistryAudit -- loads all canonical rules with deny-by-default flags', async () => {
        const lines = await runConstitutionalRegistryAudit()

        expect(lines[0]).toBe(REGISTRY_AUDIT_HEADER)
        expect(
            lines.some(
                (l) =>
                    l.includes('[RULE:LOADED]') &&
                    l.includes('rule_somatic_limb_capacity') &&
                    l.includes('(SOMATIC)') &&
                    l.includes('pardonable: false'),
            ),
        ).toBe(true)
        expect(
            lines.some(
                (l) =>
                    l.includes('[RULE:LOADED]') &&
                    l.includes('rule_bimanual_lift') &&
                    l.includes('(PHYSICAL)') &&
                    l.includes('pardonable: false'),
            ),
        ).toBe(true)
        expect(
            lines.some(
                (l) =>
                    l.includes('[RULE:LOADED]') &&
                    l.includes('rule_carrying_capacity') &&
                    l.includes('(LOGISTICAL)') &&
                    l.includes('pardonable: true'),
            ),
        ).toBe(true)
        expect(lines.some((l) => l.includes('[AUTHORIZER:LOADED]'))).toBe(true)
        expect(
            lines.some((l) =>
                l.includes('[PARDON:AUDITED] Active waivers evaluated'),
            ),
        ).toBe(true)
    })

    it('runConstitutionalRegistryAudit -- seals invariants when no fatal breaches exist on disk', async () => {
        const lines = await runConstitutionalRegistryAudit()
        const containsFatal = lines.some((l) => l.includes('[PARDON:FATAL]'))

        if (containsFatal) {
            expect(lines[lines.length - 1]).toBe(REGISTRY_BREACHED_FOOTER)
        } else {
            expect(lines[lines.length - 1]).toBe(REGISTRY_SEALED_FOOTER)
        }
    })

    it('discoverPardonLedgers -- derives rules from canonical registry and collects authorizers', async () => {
        const ledger = discoverPardonLedgers()

        expect(ledger.rules.has('rule_somatic_limb_capacity')).toBe(true)
        expect(ledger.rules.has('rule_bimanual_lift')).toBe(true)
        expect(ledger.rules.has('rule_carrying_capacity')).toBe(true)
        expect(ledger.authorizers.has('auth_showrunner_main')).toBe(true)
        expect(ledger.rules.get('rule_somatic_limb_capacity')?.pardonable).toBe(
            false,
        )
    })
})

describe('299.lore - Constitutional Rule Registry Negative Controls', () => {
    it('auditPardonLedger -- traps Tier 1 physical waivers with FATAL errors', async () => {
        const ledger = discoverPardonLedgers()
        const illegalPardon = {
            pardon_id: 'pardon_illegal_lift',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep001',
                scene_id: 'sc02',
                shot_id: 'sh03',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_bimanual_lift',
            authorizer_id: 'auth_showrunner_main',
            justification: 'Attempting to lift a pressure casing with one arm',
            granted_against_canon_hash: 'f'.repeat(64),
            status: 'ACTIVE',
        } as PardonRecord

        const mixedLedger = {
            ...ledger,
            pardons: new Map<string, PardonRecord>([
                [illegalPardon.pardon_id, illegalPardon],
            ]),
        }
        const audit = auditPardonLedger(mixedLedger)

        expect(audit.errors.length).toBeGreaterThanOrEqual(2)
        expect(
            audit.errors.some((e) => e.includes('[PASS 2 PARDON FATAL]')),
        ).toBe(true)
        expect(audit.errors.some((e) => e.includes('rule_bimanual_lift'))).toBe(
            true,
        )
    })

    it('auditPardonLedger -- admits authorized audited-ontology waivers cleanly', async () => {
        const ledger = discoverPardonLedgers()
        const legalPardon = {
            pardon_id: 'pardon_legal_capacity',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep001',
                scene_id: 'sc01',
                shot_id: 'sh01',
                entity_id: 'char_bog',
            },
            rule_id: 'rule_carrying_capacity',
            authorizer_id: 'auth_showrunner_main',
            justification: 'Carrying tallow across siphon per episode 101 beat',
            granted_against_canon_hash: 'a'.repeat(64),
            status: 'ACTIVE',
        } as PardonRecord

        const mixedLedger = {
            ...ledger,
            pardons: new Map<string, PardonRecord>([
                [legalPardon.pardon_id, legalPardon],
            ]),
        }
        const audit = auditPardonLedger(mixedLedger)

        expect(audit.errors).toEqual([])
        expect(audit.auditedActive).toBe(1)
    })
})
