export interface EntityDictionary {
    characters: Map<string, string[]> // slug -> aliases / lemmas
    locations: Map<string, string[]> // slug -> aliases / lemmas
    possessions: Map<string, string[]> // slug -> aliases / lemmas
}

export interface SoftLinkResult {
    candidateCharacters: string[]
    candidateLocations: string[]
    candidatePossessions: string[]
    annotatedTags: string[]
}

/**
 * Scans raw Markdown text drops without mutating authorial prose ("The Body is King").
 * Identifies entity mentions and matches lemma co-occurrences.
 */
export class IngestionSoftLinker {
    private dict: EntityDictionary

    constructor(dict: EntityDictionary) {
        this.dict = dict
    }

    public scanProse(rawMarkdown: string): SoftLinkResult {
        const normalized = rawMarkdown.toLowerCase()
        const candidateCharacters = new Set<string>()
        const candidateLocations = new Set<string>()
        const candidatePossessions = new Set<string>()

        const scanCategory = (
            catalog: Map<string, string[]>,
            targetSet: Set<string>,
        ) => {
            for (const [slug, aliases] of catalog.entries()) {
                for (const alias of aliases) {
                    const pattern = new RegExp(
                        `\\b${alias.toLowerCase()}\\b`,
                        'i',
                    )
                    if (pattern.test(normalized)) {
                        targetSet.add(slug)
                        break
                    }
                }
            }
        }

        scanCategory(this.dict.characters, candidateCharacters)
        scanCategory(this.dict.locations, candidateLocations)
        scanCategory(this.dict.possessions, candidatePossessions)

        const chars = Array.from(candidateCharacters)
        const locs = Array.from(candidateLocations)
        const items = Array.from(candidatePossessions)

        return {
            candidateCharacters: chars,
            candidateLocations: locs,
            candidatePossessions: items,
            annotatedTags: [...chars, ...locs, ...items],
        }
    }
}
