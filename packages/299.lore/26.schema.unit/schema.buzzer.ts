/**
 * packages/299.lore/26.schema.unit/schema.buzzer.ts
 *
 * Facade export switchboard for 26.schema.unit buzzers.
 */

export {
    initSchema,
    updateSchema,
    validateEntity,
    SCHEMA_ROUTER,
} from './buz/validate.buzz'
export { deepFreeze, type DeepReadonly } from './buz/freeze.buzz'
export {
    solveSomaticSAT,
    LOCOMOTION_TIER_BANNED_VERBS,
    type SomaticSATPayload,
} from './buz/somatic-sat.buzz'
