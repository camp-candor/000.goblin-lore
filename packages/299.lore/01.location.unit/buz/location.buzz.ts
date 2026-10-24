import * as fs from 'node:fs'
import matter from 'gray-matter'
import { TargetModel } from '../../34.target.unit/target.model.js'
import { LocationModel } from '../location.model.js'
import type LocationBit from '../fce/location.bit.js'
import type State from '../../99.core/state.js'

export const initLocation = (
    cpy: LocationModel,
    bal: LocationBit,
    ste: State,
) => {
    return cpy
}

export const updateLocation = (
    cpy: LocationModel,
    bal: LocationBit,
    ste: State,
) => {
    return cpy
}

export interface ReciprocalLinkResult {
    readonly success: boolean
    readonly targetLocationId: string
    readonly targetFilePath: string
    readonly alreadyLinked: boolean
    readonly message: string
}

/**
 * Reconciles bidirectional location links while strictly preserving Byte-0 frontmatter alignment.
 * Byte-0 frontmatter delimiter invariant:
 * ---
 */
export function reconcileReciprocalLinksBuzz(
    sourceLocationId: string,
    targetLocationId: string,
): ReciprocalLinkResult {
    const model = TargetModel.getInstance()
    const targetNode = model.getNode(targetLocationId)

    if (!targetNode) {
        return {
            success: false,
            targetLocationId,
            targetFilePath: '',
            alreadyLinked: false,
            message: `[FAIL] :: Target location not registered in multigraph: ${targetLocationId}`,
        }
    }

    const filePath = targetNode.filePath
    if (!fs.existsSync(filePath)) {
        return {
            success: false,
            targetLocationId,
            targetFilePath: filePath,
            alreadyLinked: false,
            message: `[FAIL] :: File does not exist: ${filePath}`,
        }
    }

    const rawContent = fs.readFileSync(filePath, 'utf8')
    const parsed = matter(rawContent)

    const connected: string[] = Array.isArray(parsed.data.connected_locations)
        ? [...parsed.data.connected_locations]
        : []

    if (connected.includes(sourceLocationId)) {
        return {
            success: true,
            targetLocationId,
            targetFilePath: filePath,
            alreadyLinked: true,
            message: `[OK] :: Reciprocal link already exists in ${targetLocationId}`,
        }
    }

    connected.push(sourceLocationId)
    connected.sort()
    parsed.data.connected_locations = connected

    const updatedYaml = matter.stringify(parsed.content, parsed.data)

    if (!updatedYaml.startsWith('---\n')) {
        return {
            success: false,
            targetLocationId,
            targetFilePath: filePath,
            alreadyLinked: false,
            message: `[FAIL] :: Serialization failed Byte-0 alignment invariant`,
        }
    }

    const tmpPath = `${filePath}.tmp_${Date.now()}`
    fs.writeFileSync(tmpPath, updatedYaml, 'utf8')
    fs.renameSync(tmpPath, filePath)

    return {
        success: true,
        targetLocationId,
        targetFilePath: filePath,
        alreadyLinked: false,
        message: `[OK] :: Appended ${sourceLocationId} to ${targetLocationId} connected_locations`,
    }
}
