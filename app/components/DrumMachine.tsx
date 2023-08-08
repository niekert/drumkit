"use client"
import { useState, type ReactNode, useEffect, Fragment } from "react"
import cx from "classnames"
import { motion } from "framer-motion"

import { IconAudio, IconPlus } from "./Icons"
import {
  Sequence,
  SessionSequence,
  usePlayer,
  PlayerState,
  SequencePlayer,
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
  initialMachine: string
  drumMachines: string[]
}

function newSequence(length: number): Sequence {
  return Array.from({ length }, () => 0)
}

export default function DrumMachine({
  samples,
  initialMachine,
  drumMachines,
}: DrumMachineProps): ReactNode {
  const [bpmString, setBpm] = useState("120")
  const [selectedMachine, setSelectedMachine] = useState(initialMachine)

  const loadedSamples = samples[selectedMachine]

  const { sequence, player, state } = usePlayer(
    bpmString.length > 0 ? Number.parseInt(bpmString) : 1,
    loadedSamples
  )

  const isPlaying = state.status === "started"

  return (
    <div className="bg-gray-900 rounded-md p-8 gap-8 flex flex-col w-[1200px] max-w-full">
      <div className="flex justify-between items-center">
        <div className="text-5xl ">DrumKit</div>
        <div className="gap-2 grid grid-rows-2  grid-cols-2">
          <label htmlFor="machine" className="text-right">
            Machine
          </label>
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="w-56 text-black"
          >
            {drumMachines.map((machine) => (
              <option key={machine} value={machine}>
                {machine}
              </option>
            ))}
          </select>

          <label htmlFor="bpm" className="text-right">
            bpm
          </label>
          <input
            type="number"
            className="ml-2 w-12 h-8 text-black"
            placeholder="BPM"
            value={bpmString}
            min={1}
            max={1000}
            onChange={(e) => setBpm(e.target.value)}
          />
        </div>
      </div>

      <div>
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
        player={player}
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
  player: SequencePlayer
  state: PlayerState
}

function DrumSession({ sequence, samples, player, state }: DrumSequenceProps) {
  const [dragMode, setDragMode] = useState<"add" | "delete" | null>(null)

  useEffect(() => {
    return () => player.stop()
  }, [player])

  useEffect(() => {
    const onMouseUp = () => setDragMode(null)
    document.addEventListener("mouseup", onMouseUp)
    return () => document.removeEventListener("mouseup", onMouseUp)
  })

  return (
    <div className="overflow-auto pb-3 flex items-center">
      <div
        className="grid gap-1 overflow-x-auto max-w-full py-4 relative"
        style={{
          gridTemplateRows: `repeat(${samples.length}, 1fr)`,
          gridTemplateColumns: `200px repeat(${
            sequence[Object.keys(sequence)[0]].length
          }, 50px) auto`,
        }}
      >
        {samples.map((sample) => (
          <Fragment key={sample.name}>
            <div
              className="grid-col flex items-center border-gray-700 py-1 px-1 border first:rounded-t-md last:rounded-b-md justify-between sticky left-0 bg-gray-900 z-20"
              key={sample.url}
              style={{
                gridColumn: 1,
              }}
            >
              <span>{sample.name}</span>
              <button onClick={() => player.playSample(sample.name)}>
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

                    player.setNote(sample.name, idx, isSelected ? 0 : 1)
                  }}
                  onMouseOver={() => {
                    if (dragMode != null) {
                      player.setNote(
                        sample.name,
                        idx,
                        dragMode === "delete" ? 0 : 1
                      )
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
        <motion.button
          className="text-gray-400"
          whileHover={{ scale: 1.05, color: "#FFF" }}
          onClick={player.extend}
          style={{
            gridColumn: "end", // Place it in the last column
            gridRow: "1 / -1", // Span it across all rows
          }}
        >
          <IconPlus className="w-10 h-10" />
        </motion.button>
      </div>
    </div>
  )
}
