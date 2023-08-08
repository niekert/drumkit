import { z } from "zod"
import { SessionSequence, sequenceSchema } from "./domain"
import { useState } from "react"

const responseSchema = z.object({
  sequence: sequenceSchema,
})

// AI POWERED BEAT GENERATION. WOW
// use proper mutations, how to read from data from server actions?
export function useGenerateNextBeatMutation() {
  const [isLoading, setIsLoading] = useState(false)

  const mutate = ({
    sequence,
    bpm,
  }: {
    sequence: SessionSequence
    bpm: number
  }) => {
    try {
      setIsLoading(true)
      return fetch(`/api/generate-sequence`, {
        method: "POST",
        body: JSON.stringify({
          sequence,
          bpm,
        }),
      }).then(async (resp) => responseSchema.parse(await resp.json()))
    } finally {
      setIsLoading(false)
    }
  }

  return { mutate, isLoading }
}
