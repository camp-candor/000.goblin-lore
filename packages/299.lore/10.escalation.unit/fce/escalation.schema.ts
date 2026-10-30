import { z } from 'zod'
import { GrievanceIdSchema } from '../../38.types.unit/fce/ident.schema'

export const NodeColorEnum = z.enum(['WHITE', 'GRAY', 'BLACK'])
export type NodeColor = z.infer<typeof NodeColorEnum>

export interface EscalationGraphNode {
    id: string
    children: string[]
}

export type EscalationGraphAdjacency = Record<string, string[]>

export const EscalationCycleReportSchema = z
    .object({
        hasCycle: z.boolean(),
        cyclePath: z.array(GrievanceIdSchema).optional(),
        error: z.string().optional(),
    })
    .strict()

export type EscalationCycleReport = z.infer<typeof EscalationCycleReportSchema>
