export type DomainEntityType =
    'character' | 'location' | 'possession' | 'grievance' | 'world'

export interface DomainEntityDescriptor {
    readonly domain: DomainEntityType
    readonly label: string
    readonly idPrefix: 'char_' | 'loc_' | 'item_' | 'grv_' | 'law_'
    readonly directoryName:
        'characters' | 'locations' | 'possessions' | 'grievances' | 'world'
}

export const DOMAIN_ENTITY_REGISTRY: Readonly<
    Record<DomainEntityType, DomainEntityDescriptor>
> = Object.freeze({
    character: Object.freeze({
        domain: 'character',
        label: '[1] CHARACTER DOSSIER (char_)',
        idPrefix: 'char_',
        directoryName: 'characters',
    }),
    location: Object.freeze({
        domain: 'location',
        label: '[2] LOCATION TOPOLOGY (loc_)',
        idPrefix: 'loc_',
        directoryName: 'locations',
    }),
    possession: Object.freeze({
        domain: 'possession',
        label: '[3] POSSESSION ARTIFACT (item_)',
        idPrefix: 'item_',
        directoryName: 'possessions',
    }),
    grievance: Object.freeze({
        domain: 'grievance',
        label: '[4] GRIEVANCE VECTOR (grv_)',
        idPrefix: 'grv_',
        directoryName: 'grievances',
    }),
    world: Object.freeze({
        domain: 'world',
        label: '[5] WORLD AXIOM LAW (law_)',
        idPrefix: 'law_',
        directoryName: 'world',
    }),
})

export const DOMAIN_ENTITY_CHOICES: readonly string[] = Object.freeze([
    DOMAIN_ENTITY_REGISTRY.character.label,
    DOMAIN_ENTITY_REGISTRY.location.label,
    DOMAIN_ENTITY_REGISTRY.possession.label,
    DOMAIN_ENTITY_REGISTRY.grievance.label,
    DOMAIN_ENTITY_REGISTRY.world.label,
])

export function resolveDomainEntityDescriptor(
    selection: string,
): DomainEntityDescriptor | null {
    const normalized = String(selection || '').trim()
    for (const descriptor of Object.values(DOMAIN_ENTITY_REGISTRY)) {
        if (
            normalized === descriptor.label ||
            normalized.toLowerCase() === descriptor.domain
        ) {
            return descriptor
        }
    }
    return null
}

export default interface DomainSelectorBit {
    readonly idx: string
    readonly src?: string
    readonly val?: number
    readonly dat?: {
        readonly defaultDomain?: DomainEntityType
        readonly descriptor?: DomainEntityDescriptor
    }
    readonly slv?: Function
}
