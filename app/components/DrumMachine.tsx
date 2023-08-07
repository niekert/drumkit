"use client"
import { useState, type ReactNode, useEffect, Fragment } from "react"
import cx from "classnames"
import { motion } from "framer-motion"

import { IconAudio } from "./Icons"
import {
  Sequence,
  SessionSequence,
  usePlayer,
  PlayerState,
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

export default function DrumMachine({
  samples,
  selectedMachine,
  drumMachines,
}: DrumMachineProps): ReactNode {
  const [bpm, setBpm] = useState(120)

  const loadedSamples = samples[selectedMachine]

  const { sequence, setNote, player, state } = usePlayer(bpm, loadedSamples)

  const isPlaying = state.status === "started"

  return (
    <div className="bg-gray-900 rounded-md p-8 gap-8 flex flex-col w-[1200px] max-w-full">
      <div className="flex justify-between items-center">
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
        setNote={setNote}
        onPlaySample={player.playSample}
        state={state}
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
  setNote: (sample: string, stepIndex: number, value: number) => void
  onPlaySample: (sample: string) => void
  state: PlayerState
}

function DrumSession({
  sequence,
  samples,
  setNote,
  onPlaySample,
  state,
}: DrumSequenceProps) {
  const [dragMode, setDragMode] = useState<"add" | "delete" | null>(null)

  useEffect(() => {
    const onMouseUp = () => setDragMode(null)
    document.addEventListener("mouseup", onMouseUp)
    return () => document.removeEventListener("mouseup", onMouseUp)
  })

  console.log("state", state)

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
          {sequence[sample.name].map((step, idx) => {
            const isActive =
              state.currentStep === idx && state.status === "started"
            const isSelected = step > 0

            return (
              <motion.button
                onMouseDown={() => {
                  setDragMode(isSelected ? "delete" : "add")

                  setNote(sample.name, idx, isSelected ? 0 : 1)
                }}
                onMouseOver={() => {
                  if (dragMode != null) {
                    setNote(sample.name, idx, dragMode === "delete" ? 0 : 1)
                  }
                }}
                variants={{
                  active: {
                    scale: 1.3,
                    borderRadius: "20%",
                  },
                  norma: {
                    scale: 1,
                    borderRadius: 0,
                  },
                }}
                animate={isActive && isSelected ? "active" : "normal"}
                key={idx}
                className={cx({
                  "bg-gray-700": !isActive && !isSelected && !isOddGroup(idx),
                  "bg-gray-800": !isActive && !isSelected && isOddGroup(idx),
                  "bg-blue-500": !isActive && isSelected,
                  "bg-white": isActive && isSelected,
                  "bg-gray-600": isActive && !isSelected,
                })}
              ></motion.button>
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}
