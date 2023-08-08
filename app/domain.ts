import { z } from "zod"
// 0 = off, 1 = on
// TODO: support velocity? <
export type Sequence = number[]

export const sequenceSchema = z.record(z.string(), z.array(z.number()))
export type SessionSequence = z.infer<typeof sequenceSchema>

export type GeneratedSequenceResponse = SessionSequence
