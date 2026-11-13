import yaml from 'js-yaml'
import type {
    EntityDomainType,
    DualRailVoiceSections,
    ByteZeroAuditReceipt,
    default as EntityAssembleBit,
} from '../fce/entityAssemble.bit.js'
import type { EntityModel } from '../entity.model.js'
import type State from '../../99.core/state.js'

export function sanitizeProseStub(
    rawText: string | undefined,
    fallback: string,
): string {
    if (!rawText || rawText.trim().length === 0) {
        return fallback
    }

    return rawText
        .replace(/\[cite:\s*[\d,\s]+\]/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .normalize('NFC')
        .trim()
}

export function verifyByteZeroBuffer(
    content: Buffer | string,
): ByteZeroAuditReceipt {
    const buf = Buffer.isBuffer(content)
        ? content
        : Buffer.from(content, 'utf8')
    const firstFourBytesHex = buf.subarray(0, 4).toString('hex')

    if (
        buf.length >= 3 &&
        buf[0] === 0xef &&
        buf[1] === 0xbb &&
        buf[2] === 0xbf
    ) {
        return {
            valid: false,
            byteLength: buf.length,
            firstFourBytesHex,
            error: '[BYTE_0_VIOLATION] UTF-8 BOM detected at physical offset 0',
        }
    }

    for (let i = 0; i < buf.length; i++) {
        if (buf[i] === 0x0d) {
            return {
                valid: false,
                byteLength: buf.length,
                firstFourBytesHex,
                error: `[BYTE_0_VIOLATION] Prohibited carriage return (0x0D) found at byte offset ${i}`,
            }
        }
    }

    if (
        buf.length < 4 ||
        buf[0] !== 0x2d ||
        buf[1] !== 0x2d ||
        buf[2] !== 0x2d ||
        buf[3] !== 0x0a
    ) {
        return {
            valid: false,
            byteLength: buf.length,
            firstFourBytesHex,
            error: `[BYTE_0_VIOLATION] Expected opening "---\\n" (2d2d2d0a) at offset 0, found ${firstFourBytesHex}`,
        }
    }

    return {
        valid: true,
        byteLength: buf.length,
        firstFourBytesHex,
    }
}

export function formatVoiceRailSections(
    domain: EntityDomainType,
    voice: DualRailVoiceSections,
): string {
    if (domain === 'character') {
        const sections: string[] = [
            '## Wants (surface)',
            sanitizeProseStub(
                voice.wantsSurface,
                'Keep the boiler pressure steady and stay out of sight.',
            ),
            '',
            '## Wants (actual)',
            sanitizeProseStub(
                voice.wantsActual,
                'Protect the subterranean ledger from guild inspectors.',
            ),
            '',
            '## Blind spot',
            sanitizeProseStub(
                voice.blindSpot,
                'Underestimates how far grease stains travel up the stairwell.',
            ),
            '',
            '## Voice notes',
            sanitizeProseStub(
                voice.voiceNotes,
                'Clipped, practical phrasing; avoids abstract metaphors.',
            ),
        ]

        if (voice.fewShotLines && voice.fewShotLines.length > 0) {
            sections.push('', '## Few-shot lines')
            for (const line of voice.fewShotLines) {
                sections.push(`* "${sanitizeProseStub(line, '')}"`)
            }
        }

        if (voice.refusalVectors && voice.refusalVectors.length > 0) {
            sections.push('', '## Refusal Vectors')
            for (const rv of voice.refusalVectors) {
                sections.push(
                    `* **Trigger:** ${sanitizeProseStub(rv.trigger_condition, 'Unspecified trigger')}`,
                    `  * **Mandatory Refusal:** ${sanitizeProseStub(rv.mandatory_refusal, 'Refuses task')}`,
                    `  * **Unavoidable Cost:** ${sanitizeProseStub(rv.unavoidable_cost, 'Immediate mechanical strain')}`,
                )
            }
        }

        return sections.join('\n').trim()
    }

    if (domain === 'location') {
        return [
            '## Tactical Geometry',
            sanitizeProseStub(
                voice.tacticalGeometry,
                'Narrow brick culvert with single eight-inch iron intake.',
            ),
            '',
            '## Sensory Atmosphere',
            sanitizeProseStub(
                voice.sensoryAtmosphere,
                'Damp mortar, rhythmic pipe knock, faint tallow smoke.',
            ),
            '',
            '## Structural Hazards',
            sanitizeProseStub(
                voice.structuralHazards,
                'Slick footing along the drainage channel during high runoff.',
            ),
        ]
            .join('\n')
            .trim()
    }

    return [
        '## Provenance Notes',
        sanitizeProseStub(
            voice.provenanceNotes,
            'Forged in the lower foundry prior to the winter ration.',
        ),
        '',
        '## Dramatic Function',
        sanitizeProseStub(
            voice.dramaticFunction,
            'Anchors physical proof of prior subterranean occupancy.',
        ),
    ]
        .join('\n')
        .trim()
}

export function assembleDualRailDossier(
    domain: EntityDomainType,
    frontmatter: Record<string, unknown>,
    voiceSections: DualRailVoiceSections,
): { dossierText: string; receipt: ByteZeroAuditReceipt } {
    const dumpedYaml = yaml
        .dump(frontmatter, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: true,
        })
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim()

    const voiceBody = formatVoiceRailSections(domain, voiceSections)
    const dossierText = `---\n${dumpedYaml}\n---\n\n${voiceBody}\n`

    const receipt = verifyByteZeroBuffer(dossierText)
    if (!receipt.valid) {
        throw new Error(
            receipt.error ||
                '[BYTE_0_VIOLATION] Assembled dossier failed Byte-0 audit',
        )
    }

    return { dossierText, receipt }
}

export const assembleDualRailDossierAction = (
    cpy: EntityModel,
    bal: EntityAssembleBit,
    ste?: State,
): EntityModel => {
    const dat = bal?.dat
    if (!dat) {
        if (bal?.slv) {
            bal.slv({
                entBit: {
                    idx: 'assemble-dual-rail-err',
                    val: -1,
                    dat: {
                        dossierText: '',
                        receipt: {
                            valid: false,
                            byteLength: 0,
                            firstFourBytesHex: '',
                            error: '[MISSING_PAYLOAD] dat is required',
                        },
                    },
                },
            })
        }
        return cpy
    }

    try {
        const assembled = assembleDualRailDossier(
            dat.domain,
            dat.frontmatter,
            dat.voiceSections,
        )
        if (bal?.slv) {
            bal.slv({
                entBit: {
                    idx: 'assemble-dual-rail',
                    val: 0,
                    dat: assembled,
                },
            })
        }
    } catch (err: any) {
        if (bal?.slv) {
            bal.slv({
                entBit: {
                    idx: 'assemble-dual-rail-fail',
                    val: -1,
                    dat: {
                        dossierText: '',
                        receipt: {
                            valid: false,
                            byteLength: 0,
                            firstFourBytesHex: '',
                            error: err.message,
                        },
                    },
                },
            })
        }
    }

    return cpy
}
