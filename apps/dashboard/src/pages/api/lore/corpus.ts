import type { APIRoute } from 'astro'
import { loadCorpusSnapshotFromDisk } from '../../../lib/lore/corpusServer'

export const GET: APIRoute = async () => {
    const snapshot = loadCorpusSnapshotFromDisk()
    return new Response(JSON.stringify(snapshot), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
        },
    })
}
