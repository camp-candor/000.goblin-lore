import { z } from 'zod';
export const BannedCadenceEnum = z.enum(['RAPID_STACCATO', 'SLOW_DRAWL', 'MONOTONE', 'WHISPER', 'SHOUT']);
