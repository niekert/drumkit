import { z } from "zod"
import { SessionSequence, sequenceSchema } from "./domain"
import { useState } from "react"

// AI POWERED BEAT GENERATION. WOW
// use proper mutations, how to read from data from server actions?
export function useGenerateNextBeatMutation() {
  const [isLoading, setIsLoading] = useState(false)

  const mutate = ({
    sequence,
    bpm,
    machine,
  }: {
    sequence: SessionSequence
    bpm: number
    machine: string
  }) => {
    setIsLoading(true)
    return fetch(`/api/generate-sequence`, {
      method: "POST",
      body: JSON.stringify({
        sequence,
        bpm,
        machine,
      }),
    })
      .then(async (resp) => sequenceSchema.parse(await resp.json()))
      .finally(() => {
        setIsLoading(false)
      })
  }

  return { mutate, isLoading }
}
