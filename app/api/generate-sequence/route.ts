import { SessionSequence, sequenceSchema } from "@/app/domain"
import { Configuration, OpenAIApi } from "openai-edge"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export interface NextBeatPayload {
  sequence: SessionSequence
  bpm: number
}

export const runtime = "edge"

const nextBeatReq = z.object({
  bpm: z.number(),
  sequence: sequenceSchema,
  machine: z.string(),
})

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(config)

const SYSTEM_MESSAGE = `
As  music production assistant your task is helping a producer in sequencing new beats.
The producer will provide you with a sequence of samples for a drum beat and a bpm (tempo). Your task is to generate a new sequence of samples that builds (progresses) on the provided sequence. You should return exactly 1 bar.

Below is an example JSON object that you will receive as input

{
  "bpm": 120, // The target BPM / tempo
  "machine": "808", // The drum machine used, for example 808
  "sequence":  {
    Kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    Snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    Hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "Open hat": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    Cowbell: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    Maracas: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    Ride: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    Rim: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  }
}

It is your job to reply with a sequence of samples that builds on the provided sequence. Keep in mind the name of the various drum samples, the tempo, and the current arrangement of samples.

Below are the most important rules you should stick to:
  - ALWAYS respond with only JSON of the "sequence" property as received from the input. Do not include the "sequence" key yourself.
  - ALWAYS respond with exactly 16 steps of sequence for every key
  - ALWAYS take into account the sounds of the given samples (instruments) and how they interact with each other
  - ALWAYS keep the model of the drum machine in mind and decide on beats that fits the machine
  - ALWAYS provide exciting new drum loops. Include variations of different samples and instrument in the drum loop
  - Try to respond with variation in the instruments and loops used. Try to build up
  - ALWAYS respond with a sequence that builds on the provided sequence (progresses)
  - ALWAYS respond with a sequence that is in time with the provided bpm (tempo)
  - ALWAYS assume the provided JSON input is valid and contains all you need. The user will only provide JSON and you will only reply in JSON
`

export async function POST(req: NextRequest) {
  const requestBody = await req.json()

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    stream: false,
    messages: [
      {
        role: "system",
        content: SYSTEM_MESSAGE,
      },
      {
        role: "user",
        content: JSON.stringify({
          bpm: requestBody.bpm,
          machine: requestBody.machine,
          sequence: requestBody.sequence,
        }),
      },
    ],
  })

  const resp = await response.json()

  if ("error" in resp) {
    return NextResponse.json(
      {
        message: "Something went wrong",
        err: resp,
      },
      { status: 500 }
    )
  }

  try {
    console.log("content", resp.choices[0].message.content)

    const sequence = JSON.parse(resp.choices[0].message.content)

    return NextResponse.json(sequence)
  } catch (err) {
    return NextResponse.json(
      {
        message: "Failed to parse openAI response",
      },
      { status: 500 }
    )
  }
}
