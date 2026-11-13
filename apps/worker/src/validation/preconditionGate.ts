import {
    evaluateSceneSomaticStaleness,
    type ScenePreconditionPayload,
} from '../../../../packages/299.lore/22.payload.unit/buz/scenePrecondition.buzz.js'

function jsonResponse(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json; charset=utf-8' },
    })
}

export async function handleVerifyScenePrecondition(
    request: Request,
): Promise<Response> {
    let payload: ScenePreconditionPayload
    try {
        payload = (await request.json()) as ScenePreconditionPayload
    } catch {
        return jsonResponse(
            {
                error: 'DIRTY_SCENE_REJECTED',
                http_status: 412,
                message: 'Malformed JSON scene precondition payload',
            },
            412,
        )
    }

    const verdict = evaluateSceneSomaticStaleness(payload)
    if (!verdict.admitted) {
        return jsonResponse((verdict as { receipt: unknown }).receipt, 412)
    }

    return jsonResponse(verdict, 200)
}
