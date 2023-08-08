"use client"
import { useState, type ReactNode, useEffect, Fragment } from "react"
import cx from "classnames"
import { motion } from "framer-motion"

import { IconAudio, IconDuplicate, IconPlus } from "./Icons"
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
    <div className="bg-black rounded-lg flex flex-col w-[1200px] max-w-full relative p-0.5 group">
      {/* GLOEIENDE GLOEIENDE */}
      <div className="hidden lg:block absolute z-0 -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-60 group-hover:opacity-75 transition duration-1000 group-hover:duration-500 animate-tilt"></div>
      <div className="z-10 bg-black p-8 rounded-lg space-y-6">
        <div className="flex flex-col sm:flex-row justify-between md:items-center items-start gap-8">
          <div className="text-5xl font-product">
            <span>DRUM</span>
            <span className="opacity-70">KIT</span>
          </div>
          <div className="gap-2 grid grid-rows-2 grid-cols-2 font-product">
            <label htmlFor="machine" className="text-right">
              Drum Machine
            </label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="w-[130px] text-gray-900 rounded-md"
            >
              {drumMachines.map((machine) => (
                <option key={machine} value={machine}>
                  {machine}
                </option>
              ))}
            </select>

            <label htmlFor="bpm" className="text-right">
              BPM
            </label>
            <input
              type="number"
              className="px-2 h-8 text-gray-900 rounded-md"
              placeholder="BPM"
              value={bpmString}
              min={1}
              max={1000}
              onChange={(e) => setBpm(e.target.value)}
            />
          </div>
        </div>

        <div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            onClick={isPlaying ? player.stop : player.start}
            className="p-4 rounded-md font-product -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 opacity-90"
          >
            {isPlaying ? "Stop" : "Play"}
          </motion.button>
        </div>
        <DrumSession
          samples={loadedSamples}
          sequence={sequence}
          player={player}
          state={state}
        />
      </div>
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
          gridTemplateColumns: `auto repeat(${
            sequence[Object.keys(sequence)[0]].length
          }, 50px) auto`,
        }}
      >
        {samples.map((sample) => (
          <Fragment key={sample.name}>
            <div
              className="grid-col flex items-center rounded-sm border-gray-700 py-1 px-1 border last-of-type:rounded-b-md justify-between sticky left-0 bg-gray-900 z-20 font-product whitespace-nowrap"
              key={sample.url}
              style={{
                gridColumn: 1,
              }}
            >
              <span>{sample.name}</span>
              <button
                onClick={() => player.playSample(sample.name)}
                className="text-gray-300 hover:text-gray-100 ml-2 lg:ml-20"
              >
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
                      borderRadius: "8px",
                    },
                    norma: {
                      scale: 1,
                      borderRadius: "2px",
                    },
                  }}
                  animate={isActive && isSelected ? "active" : "normal"}
                  key={idx}
                  className={cx("rounded-sm", {
                    "bg-gray-700": !isActive && !isSelected && !isOddGroup(idx),
                    "bg-gray-800": !isActive && !isSelected && isOddGroup(idx),
                    "bg-blue-400": !isActive && isSelected,
                    "bg-white": isActive && isSelected,
                    "bg-gray-600": isActive && !isSelected,
                  })}
                ></motion.button>
              )
            })}
          </Fragment>
        ))}

        <EndOfSequenceActions player={player} />
      </div>
    </div>
  )
}

export function EndOfSequenceActions({ player }: { player: SequencePlayer }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6"
      style={{
        gridColumn: "end", // Place it in the last column
        gridRow: "1 / -1", // Span it across all rows
      }}
    >
      <motion.button
        className="text-gray-400"
        whileHover={{ scale: 1.05, color: "#FFF" }}
        onClick={() => player.extend("copy")}
      >
        <IconDuplicate className="w-6 h-6" />
      </motion.button>
      <motion.button
        className="text-gray-400"
        whileHover={{ scale: 1.05, color: "#FFF" }}
        onClick={() => player.extend("empty")}
        style={{
          gridColumn: "end", // Place it in the last column
          gridRow: "1 / -1", // Span it across all rows
        }}
      >
        <IconPlus className="w-6 h-6" />
      </motion.button>
    </div>
  )
}
