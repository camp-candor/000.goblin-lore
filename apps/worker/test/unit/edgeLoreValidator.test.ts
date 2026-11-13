import { describe, it, expect } from 'vitest'
import { exportPinnedEdgeSchemaBundle } from '../../../../packages/299.lore/26.schema.unit/buz/schemaBundleExporter.buzz.js'
import {
    verifyPinnedSchemaBundle,
    validateEdgeDraftPayload,
} from '../../src/validation/edgeLoreValidator.js'

describe('apps/worker :: Worker Custom Lore Validation Tools', () => {
    const pinnedBundle = exportPinnedEdgeSchemaBundle('9c3e401', '1.0.0')

    it('verifies SHA-256 integrity of exported schemas.json bundle', async () => {
        const valid = await verifyPinnedSchemaBundle(pinnedBundle)
        expect(valid).toBe(true)
        expect(pinnedBundle.schema_bundle_hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('validates conformant character frontmatter and Byte-0 markdown against pinned bundle', () => {
        const receipt = validateEdgeDraftPayload(
            {
                entity_id: 'char_wart',
                domain: 'character',
                schema_bundle_hash: pinnedBundle.schema_bundle_hash,
                frontmatter: {
                    id: 'char_wart',
                    name: 'Wart',
                    status: 'active',
                    available_arms_bps: 10000,
                },
                raw_markdown:
                    '---\nid: char_wart\nname: Wart\nstatus: active\n---\n\n## Wants\nSurvive.\n',
            },
            pinnedBundle,
        )

        expect(receipt.valid).toBe(true)
        expect(receipt.errors).toHaveLength(0)
    })

    it('rejects schema bundle hash mismatch with SCHEMA_BUNDLE_SKEW_BREACH', () => {
        const receipt = validateEdgeDraftPayload(
            {
                entity_id: 'char_wart',
                domain: 'character',
                schema_bundle_hash: '0'.repeat(64),
                frontmatter: {
                    id: 'char_wart',
                    name: 'Wart',
                    status: 'active',
                },
                raw_markdown: '---\nid: char_wart\n---\nBody.\n',
            },
            pinnedBundle,
        )

        expect(receipt.valid).toBe(false)
        expect(receipt.errorCode).toBe('SCHEMA_BUNDLE_SKEW_BREACH')
    })

    it('rejects un-schemaed keys with UNSCHEMAED_KEY_REJECTED', () => {
        const receipt = validateEdgeDraftPayload(
            {
                entity_id: 'char_wart',
                domain: 'character',
                schema_bundle_hash: pinnedBundle.schema_bundle_hash,
                frontmatter: {
                    id: 'char_wart',
                    name: 'Wart',
                    status: 'active',
                    hallucinated_magic_level: 99,
                },
                raw_markdown: '---\nid: char_wart\n---\nBody.\n',
            },
            pinnedBundle,
        )

        expect(receipt.valid).toBe(false)
        expect(receipt.errorCode).toBe('UNSCHEMAED_KEY_REJECTED')
    })

    it('rejects floating-point basis points with FLOAT_PROHIBITED', () => {
        const receipt = validateEdgeDraftPayload(
            {
                entity_id: 'char_wart',
                domain: 'character',
                schema_bundle_hash: pinnedBundle.schema_bundle_hash,
                frontmatter: {
                    id: 'char_wart',
                    name: 'Wart',
                    status: 'active',
                    available_arms_bps: 10000.5,
                },
                raw_markdown: '---\nid: char_wart\n---\nBody.\n',
            },
            pinnedBundle,
        )

        expect(receipt.valid).toBe(false)
        expect(receipt.errorCode).toBe('FLOAT_PROHIBITED')
    })

    it('rejects CRLF or missing Byte-0 header with BYTE_ZERO_BREACH', () => {
        const receipt = validateEdgeDraftPayload(
            {
                entity_id: 'char_wart',
                domain: 'character',
                schema_bundle_hash: pinnedBundle.schema_bundle_hash,
                frontmatter: {
                    id: 'char_wart',
                    name: 'Wart',
                    status: 'active',
                },
                raw_markdown: '---\r\nid: char_wart\r\n---\r\nBody.\r\n',
            },
            pinnedBundle,
        )

        expect(receipt.valid).toBe(false)
        expect(receipt.errorCode).toBe('BYTE_ZERO_BREACH')
    })
})
