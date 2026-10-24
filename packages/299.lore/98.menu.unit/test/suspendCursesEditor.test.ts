import { describe, it, expect, vi, beforeEach } from 'vitest'
import { suspendCursesAndSpawnEditor } from '../buz/suspendCursesEditor.buzz.js'

describe('Phase 7 Curses Suspension Handshake', () => {
    beforeEach(() => {
        ;(globalThis as any).LIBRARY = {
            hunt: vi.fn().mockResolvedValue({}),
        }
    })

    it('bypasses interactive editor spawn in headless environment (CI / non-TTY)', async () => {
        const prevTTY = process.stdin.isTTY
        ;(process.stdin as any).isTTY = false

        const res = await suspendCursesAndSpawnEditor('/tmp/test.md')
        expect(res.success).toBe(true)
        expect(res.headlessBypass).toBe(true)

        ;(process.stdin as any).isTTY = prevTTY
    })
})
