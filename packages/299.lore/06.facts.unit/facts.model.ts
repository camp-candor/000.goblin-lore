import { z } from 'zod'
import {
    FactIdSchema,
    AuthorHandleSchema,
    Sha256HashSchema,
} from './val/identifier.val.js'
import { ClaimTextAsciiSchema } from './val/ascii.val.js'
import { EpochIntegerSchema } from './val/epoch.val.js'
import { FactScopeEnum } from '../38.types.unit/val/scope.val.js'
import { AuthorityLevelEnum } from '../38.types.unit/val/authority.val.js'
import { TriStateStandingEnum } from '../38.types.unit/val/standing.val.js'
import type { FactNodeBit } from './fce/factNode.bit.js'
import Facts from './fce/facts.interface.js'

export class FactsModel implements Facts {
    //idx:string;
    //factsBitList: FactsBit[] = [];
    //factsBits: any = {};
}

/**
 * Permitted 11 canonical property names of FactNode.
 */
export const FACT_NODE_PERMITTED_KEYS: readonly string[] = [
    'id',
    'claim_text',
    'scope',
    'authority_level',
    'standing',
    'version',
    'content_hash',
    'author',
    'created_at_epoch',
    'last_mutated_epoch',
    'last_reconsidered_epoch',
] as const

export const FACT_NODE_KEY_SET = new Set<string>(FACT_NODE_PERMITTED_KEYS)

/**
 * Authoritative FactNodeSchema:
 * - Exactly 11 strongly-typed properties.
 * - Terminated with .strict() to trap any extraneous, hallucinated, or injected keys.
 * - Enforces causal temporal progression: created_at_epoch <= last_mutated_epoch.
 */
export const FactNodeSchema = z
    .object({
        id: FactIdSchema,
        claim_text: ClaimTextAsciiSchema,
        scope: FactScopeEnum,
        authority_level: AuthorityLevelEnum.default('CANON'),
        standing: TriStateStandingEnum.default('ACTIVE_ENDORSED'),
        version: z
            .number()
            .int()
            .min(1, 'Version must be a positive integer (>= 1)')
            .default(1),
        content_hash: Sha256HashSchema,
        author: AuthorHandleSchema,
        created_at_epoch: EpochIntegerSchema.default(0),
        last_mutated_epoch: EpochIntegerSchema.default(0),
        last_reconsidered_epoch: EpochIntegerSchema.default(0),
    })
    .strict()
    .refine((data) => data.created_at_epoch <= data.last_mutated_epoch, {
        message:
            'Temporal sequence invariant breach: created_at_epoch must be <= last_mutated_epoch',
        path: ['last_mutated_epoch'],
    })

export type FactNode = z.infer<typeof FactNodeSchema>

/**
 * Asserts structural typing alignment between inferred FactNode and FactNodeBit.
 */
const _typeAssertion: (node: FactNode) => FactNodeBit = (node: FactNode) =>
    node as FactNodeBit
void _typeAssertion
