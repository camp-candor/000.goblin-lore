import { describe, it, expect, afterEach } from 'vitest'
import {
    DOMAIN_ENTITY_CHOICES,
    DOMAIN_ENTITY_REGISTRY,
    resolveDomainEntityDescriptor,
} from '../fce/domainSelector.bit.js'
import { promptDomainEntityTypeSelector } from '../buz/domainEntitySelector.buzz.js'
import { DOMAIN_SELECTOR_LABEL, updateMenu } from '../buz/00.menu.buzz.js'

describe('299.lore - [Feature 1.2] Domain Entity Type Selector', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('maps all five canonical entity domains to exact prefixes', () => {
        expect(resolveDomainEntityDescriptor(DOMAIN_ENTITY_CHOICES[0])).toEqual(
            DOMAIN_ENTITY_REGISTRY.character,
        )
        expect(resolveDomainEntityDescriptor('location')?.idPrefix).toBe('loc_')
        expect(resolveDomainEntityDescriptor('possession')?.idPrefix).toBe(
            'item_',
        )
        expect(resolveDomainEntityDescriptor('grievance')?.idPrefix).toBe(
            'grv_',
        )
        expect(resolveDomainEntityDescriptor('world')?.idPrefix).toBe('law_')
        expect(resolveDomainEntityDescriptor('unknown_domain')).toBeNull()
    })

    it('binds selected entity domain via Blessed OPEN_CHOICE modal', async () => {
        const telemetry: string[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Console action] Update Console') {
                    telemetry.push(payload.src)
                    return {}
                }
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: {
                            dat: {
                                left: '0%',
                                top: '33%',
                                width: '33%',
                                height: '66%',
                            },
                        },
                    }
                }
                if (action === '[Open action] Open Choice') {
                    return {
                        chcBit: {
                            src: DOMAIN_ENTITY_REGISTRY.grievance.label,
                            val: 3,
                        },
                    }
                }
                return {}
            },
        }

        const model: any = {}
        let receipt: any = null

        await promptDomainEntityTypeSelector(model, {
            idx: 'test-domain-select',
            slv: (res: any) => {
                receipt = res
            },
        })

        expect(model.activeEntityDomain).toBe('grievance')
        expect(model.activeEntityPrefix).toBe('grv_')
        expect(model.activeEntityDirectory).toBe('grievances')
        expect(receipt?.mnuBit?.val).toBe(1)
        expect(
            telemetry.some((line) =>
                line.includes("[OK] Bound domain 'grievance'"),
            ),
        ).toBe(true)
    })

    it('aborts cleanly without mutating model when operator cancels selection', async () => {
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string) => {
                if (action === '[Grid action] Update Grid') {
                    return { grdBit: { dat: {} } }
                }
                if (action === '[Open action] Open Choice') {
                    return {
                        chcBit: { src: '[<] CANCEL DOMAIN SELECTION', val: -1 },
                    }
                }
                return {}
            },
        }

        const model: any = { activeEntityDomain: undefined }
        let receipt: any = null

        await promptDomainEntityTypeSelector(model, {
            idx: 'test-domain-cancel',
            slv: (res: any) => {
                receipt = res
            },
        })

        expect(model.activeEntityDomain).toBeUndefined()
        expect(receipt?.mnuBit?.val).toBe(0)
    })

    it('freezes DOMAIN_ENTITY_REGISTRY and DOMAIN_ENTITY_CHOICES', () => {
        expect(Object.isFrozen(DOMAIN_ENTITY_REGISTRY)).toBe(true)
        expect(Object.isFrozen(DOMAIN_ENTITY_CHOICES)).toBe(true)
        for (const desc of Object.values(DOMAIN_ENTITY_REGISTRY)) {
            expect(Object.isFrozen(desc)).toBe(true)
        }
    })

    it('rejects unregistered and empty domain strings without mutating model', async () => {
        expect(resolveDomainEntityDescriptor('unknown_domain')).toBeNull()
        expect(resolveDomainEntityDescriptor('mystery_unregistered')).toBeNull()
        expect(resolveDomainEntityDescriptor('')).toBeNull()

        const logs: string[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Console action] Update Console') {
                    logs.push(payload.src)
                }
                return {}
            },
        }

        for (const bad of ['invalid_domain', 'mystery_unregistered', '']) {
            const model: any = { activeEntityDomain: 'character' }
            let receipt: any = null
            await promptDomainEntityTypeSelector(model, {
                idx: 'trap-invalid',
                src: bad,
                slv: (res: any) => {
                    receipt = res
                },
            })
            expect(model.activeEntityDomain).toBe('character')
            expect(receipt?.mnuBit?.idx).toBe('domain-selector-invalid')
            expect(receipt?.mnuBit?.val).toBe(-1)
        }
        expect(
            logs.some((l) => l.includes(':: [DOMAIN:SELECTOR] [FAIL]')),
        ).toBe(true)
    })

    it('resolves deterministically to character (char_) in headless mode without global.LIBRARY', async () => {
        const model: any = {}
        let receipt: any = null
        await promptDomainEntityTypeSelector(model, {
            idx: 'trap-headless',
            slv: (res: any) => {
                receipt = res
            },
        })
        expect(model.activeEntityDomain).toBe('character')
        expect(model.activeEntityPrefix).toBe('char_')
        expect(model.activeEntityDirectory).toBe('characters')
        expect(receipt?.mnuBit?.idx).toBe('domain-selector-success')
        expect(receipt?.mnuBit?.val).toBe(1)
    })

    it('exposes DOMAIN_SELECTOR_LABEL in updateMenu OPEN_CHOICE list', async () => {
        const capturedChoices: string[][] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (event: string, payload: any) => {
                if (event === '[Open action] Open Choice') {
                    capturedChoices.push(payload?.lst ?? [])
                    return { chcBit: { src: '[<] QUIT' } }
                }
                if (event === '[Grid action] Update Grid') {
                    return { grdBit: { dat: { x: 0, y: 0 } } }
                }
                return {}
            },
        }

        await updateMenu({} as any, { idx: 'test_domain_menu_exposure' }, {
            hunt: (globalThis as any).LIBRARY.hunt,
        } as any)

        expect(capturedChoices.length).toBeGreaterThan(0)
        expect(capturedChoices[0]).toContain(DOMAIN_SELECTOR_LABEL)
        expect(DOMAIN_SELECTOR_LABEL).toBe('[D] SELECT ENTITY DOMAIN TYPE')
    })
})
