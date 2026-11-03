import { z } from 'zod'
export const BannedCadenceEnum = z.enum([
    'STUTTER',
    'MUMBLE',
    'WHISPER',
    'RAPID_STACCATO',
])
