import { SessionSequence, sequenceSchema } from "@/app/domain"
import { Configuration, OpenAIApi } from "openai-edge"
import { NextRequest, NextResponse } from "next/server"

export interface NextBeatPayload {
  sequence: SessionSequence
  bpm: number
}

const OPENAI_CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo"

export const runtime = "edge"

const config = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(config)

const SYSTEM_MESSAGE = `
As  music production assistant your task is helping a producer in sequencing new beats.
The producer will provide you with a sequence of samples for a drum beat and a bpm (tempo). Your task is to generate a new sequence of samples that builds (progresses) on the provided sequence. You should return exactly 1 bar in 4/4 tempo with 16 notes.

Below is an example JSON object that you will receive as input

{
  "bpm": 120, // The target BPM / tempo
  "machine": "808", // The drum machine used, for example 808
  "genre": "techno", // The genre of the beat
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

It is your job to respond with a sequence that progresses the beat to a new one. By adding additional elements or changing the beat. 
Keep in mind the names of the instrument, the tempo, and the current arrangement of when an instrument plays.

Below are the most important rules you should stick to:
  - ALWAYS respond with only JSON of the "sequence" property as received from the input. Do not include the "sequence" key yourself.
  - ALWAYS respond with exactly 16 steps of sequence for every instrument
  - ALWAYS keep the model of the drum machine in mind and decide on beats that fits the machine
  - ALWAYS keep in mind the provided genre and the arrangement of drum beats
  - ALWAYS vary the drum loop in a way that it is not too repetitive. add 1 to 2 variations
  - NEVER randomly enable or disable samples (instruments) in the sequence, it has to be a consistent beat at all times
  - ALWAYS respond with a sequence that builds on the provided sequence (progresses)
  - ALWAYS respond with a sequence that is in time with the provided bpm (tempo)
  - ALWAYS assume the provided JSON input is valid and contains all you need. The user will only provide JSON and you will only reply in JSON
`

export async function POST(req: NextRequest) {
  const requestBody = await req.json()

  const response = await openai.createChatCompletion({
    model: OPENAI_CHAT_MODEL,
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
