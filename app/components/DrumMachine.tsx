"use client"
import { useState, type ReactNode, useEffect, Fragment } from "react"
import cx from "classnames"

import { IconAudio } from "./Icons"
import {
  SequencePlayer,
  Sequence,
  SessionSequence,
  usePlayerstate,
} from "../services/player"

export interface Sample {
  url: string
  name: string
}

interface DrumSession {
  gridSize: number
  sequence: {
    [sample: string]: Sequence
  }
}

export interface DrumMachineProps {
  samples: Record<string, Sample[]>
  selectedMachine: string
  drumMachines: string[]
}

function newSequence(length: number): Sequence {
  return Array.from({ length }, () => 0)
}

function usePlayer(bpm: number, samples: Sample[]) {
  const [isPlaying, setIsPlaying] = useState(false)

  const [session, setSession] = useState<SessionSequence>(() => {
    return samples.reduce<SessionSequence>((acc, sample) => {
      acc[sample.name] = newSequence(16)

      return acc
    }, {})
  })
  const [player] = useState<SequencePlayer>(
    () => new SequencePlayer(samples, session)
  )

  useEffect(() => {
    player.setBpm(bpm)
  }, [bpm, player])

  const toggleNote = (sample: string, step: number) => {
    const nextSession = {
      ...session,
      [sample]: session[sample].map((value, idx) => {
        if (idx === step) {
          return value === 0 ? 1 : 0
        }

        return value
      }),
    }

    // Todo: maintain inside player?
    setSession(nextSession)
    player.update(nextSession)
  }

  return {
    player,
    isPlaying,
    sequence: session,
    toggleNote,
  }
}

export default function DrumMachine({
  samples,
  selectedMachine,
  drumMachines,
}: DrumMachineProps): ReactNode {
  const [bpm, setBpm] = useState(120)

  const loadedSamples = samples[selectedMachine]

  const {
    sequence,
    toggleNote: handleNoteClick,
    player,
  } = usePlayer(bpm, loadedSamples)

  const playerState = usePlayerstate()
  const isPlaying = playerState === "started"

  return (
    <div className="bg-gray-900 rounded-md p-8 gap-8 flex flex-col w-[1200px] max-w-full">
      <div className="flex justify-between">
        <div className="text-5xl ">DrumKit</div>
        <div className="">
          <label htmlFor="bpm" className="">
            bpm
          </label>
          <input
            type="number"
            className="ml-2 w-12 h-8 text-black"
            placeholder="BPM"
            value={bpm}
            onChange={(e) => setBpm(Number.parseInt(e.target.value))}
          />
        </div>
      </div>

      <div>
        {/* Actions */}
        <button
          onClick={isPlaying ? player.stop : player.start}
          className="border-blue-600 border-4 p-4 rounded-md"
        >
          {isPlaying ? "Stop" : "Play"}
        </button>
      </div>

      <DrumSession
        samples={loadedSamples}
        sequence={sequence}
        onNoteClick={handleNoteClick}
        onPlaySample={player.playSample}
      />
    </div>
  )
}

function isOddGroup(step: number) {
  // based on 16th beat
  const group = Math.floor(step / 4)

  return group % 2 === 0
}

interface DrumSequenceProps {
  samples: Sample[]
  sequence: SessionSequence
  onNoteClick: (sample: string, stepIndex: number) => void
  onPlaySample: (sample: string) => void
}

function DrumSession({
  sequence,
  samples,
  onNoteClick,
  onPlaySample,
}: DrumSequenceProps) {
  return (
    <div className="grid gap-1 grid-cols-16th grid-rows-">
      {samples.map((sample) => (
        <Fragment key={sample.name}>
          <div
            className="grid-col flex items-center border-gray-700 py-1 px-1 border first:rounded-t-md last:rounded-b-md justify-between"
            key={sample.url}
          >
            <span>{sample.name}</span>
            <button onClick={() => onPlaySample(sample.name)}>
              <IconAudio />
            </button>
          </div>
          {sequence[sample.name].map((step, idx) => (
            <button
              onClick={() => onNoteClick(sample.name, idx)}
              key={idx}
              className={cx({
                "bg-gray-700": !isOddGroup(idx),
                "bg-gray-800": isOddGroup(idx),
                "bg-blue-500": step == 1,
              })}
            ></button>
          ))}
        </Fragment>
      ))}
    </div>
  )
}
