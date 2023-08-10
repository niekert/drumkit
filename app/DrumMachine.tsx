"use client"
import {
  useState,
  type ReactNode,
  useEffect,
  Fragment,
  SVGProps,
  ReactEventHandler,
  MouseEventHandler,
} from "react"
import cx from "classnames"
import { motion } from "framer-motion"

import {
  IconAudio,
  IconDelete,
  IconDuplicate,
  IconMagic,
  IconPlus,
} from "./Icons"
import { useSequencer, SequencerState, Sequencer } from "./services/player"
import { Sequence } from "./domain"
import { useGenerateNextBeatMutation } from "./adapter"

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

export default function DrumMachine({
  samples,
  initialMachine,
  drumMachines,
}: DrumMachineProps): ReactNode {
  const [selectedMachine, setSelectedMachine] = useState(initialMachine)

  const loadedSamples = samples[selectedMachine]

  const { sequencer: sequencer, state } = useSequencer(loadedSamples)

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length > 0) {
      sequencer.setBpm(Number.parseInt(e.target.value, 10))
    }
  }

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
              min={1}
              max={1000}
              defaultValue={Sequencer.INITIAL_BPM}
              onChange={handleBpmChange}
            />
          </div>
        </div>

        <div className="flex items-center gap-8">
          <motion.button
            whileHover={{ scale: 1.04 }}
            onClick={isPlaying ? sequencer.stop : sequencer.start}
            className={cx(
              "p-4 rounded-md font-product -inset-0.5 bg-gradient-to-r transition",
              {
                " from-blue-500 to-purple-500 opacity-90": !isPlaying,
                " from-purple-950 to-blue-950": isPlaying,
              }
            )}
          >
            {isPlaying ? "Stop" : "Play"}
          </motion.button>
        </div>
        <DrumSession
          samples={loadedSamples}
          player={sequencer}
          state={state}
          selectedMachine={selectedMachine}
        />
        <button className="font-product" onClick={sequencer.clear}>
          Clear
        </button>
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
  player: Sequencer
  state: SequencerState
  selectedMachine: string
}

function DrumSession({
  samples,
  player,
  state,
  selectedMachine,
}: DrumSequenceProps) {
  const [dragMode, setDragMode] = useState<"add" | "delete" | null>(null)
  const nextBeatMutation = useGenerateNextBeatMutation()

  useEffect(() => {
    return () => player.stop()
  }, [player])

  useEffect(() => {
    const onMouseUp = () => setDragMode(null)
    document.addEventListener("mouseup", onMouseUp)
    return () => document.removeEventListener("mouseup", onMouseUp)
  })

  const handleGenerateNextSequence = async () => {
    // Only take the last items it works better in GPT and is faster
    const lastSequence = Object.fromEntries(
      Object.entries(state.sequence).map(([key, value]) => [
        key,
        value.slice(-16),
      ])
    )

    try {
      const nextSequence = await nextBeatMutation.mutate({
        sequence: lastSequence,
        bpm: state.bpm,
        machine: selectedMachine,
      })

      player.extend({ mode: "set", setSequence: nextSequence })
    } catch (err) {
      console.error("Something went wrong with generation", err)
    }
  }

  const sequenceLength = state.sequence[Object.keys(state.sequence)[0]].length

  // One bar equals 16 steps
  const barLength = sequenceLength / 16

  return (
    <div className="overflow-auto pb-3 flex items-center">
      <div
        className="grid gap-1 overflow-x-auto max-w-full py-4 relative"
        style={{
          gridTemplateRows: `repeat(${samples.length}, 34px) auto`,
          gridTemplateColumns: `auto repeat(${sequenceLength}, 50px) auto`,
        }}
      >
        {samples.map((sample) => (
          <Fragment key={sample.name}>
            <div
              className="grid-col flex items-center rounded-sm border-gray-700 py-1 px-1 border last-of-type:rounded-b-md justify-between sticky left-0 bg-gray-900 z-20 font-product whitespace-nowrap lg:w-[200px]"
              key={sample.url}
              style={{
                gridColumn: 1,
              }}
            >
              <span>{sample.name}</span>
              <button
                onClick={() => player.playSample(sample.name)}
                className="text-gray-300 hover:text-gray-100 ml-2"
              >
                <IconAudio />
              </button>
            </div>

            {state.sequence[sample.name].map((step, idx) => {
              const isActive =
                state.currentStep === idx && state.status === "started"
              const isSelected = step > 0

              return (
                <Note
                  onMouseDown={() => {
                    setDragMode(isSelected ? "delete" : "add")

                    player.setNote(sample.name, idx, isSelected ? 0 : 1)
                  }}
                  isActive={isActive}
                  isSelected={isSelected}
                  onMouseOver={() => {
                    if (dragMode != null) {
                      player.setNote(
                        sample.name,
                        idx,
                        dragMode === "delete" ? 0 : 1
                      )
                    }
                  }}
                  colIndex={idx}
                  key={idx}
                />
              )
            })}

            {Array.from({ length: barLength }).map((_, barIndex) => {
              return (
                <div
                  style={{
                    gridRow: "end",
                    gridColumn: `${2 + barIndex * 16} / span 16`,
                  }}
                  className="border-l border-b border-r border-gray-400 border-opacity-5 rounded-sm h-9 px-2"
                  key={`bar-${barIndex}`}
                >
                  {barLength > 1 && (
                    <button
                      className="flex items-center justify-center text-gray-400"
                      onClick={() => player.deleteBar(barIndex)}
                    >
                      <IconDelete />
                    </button>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}

        <div
          className="flex flex-col items-center justify-center"
          style={{
            gridColumn: sequenceLength + 2,
            gridRow: "1 / -1", // Span it across all rows
          }}
        >
          {nextBeatMutation.isLoading ? (
            <SkeletonNextSequence length={samples.length} />
          ) : (
            <div className="ml-2 flex flex-col items-center gap-6">
              <EndOfSequenceAction
                icon={IconDuplicate}
                onClick={() => player.extend({ mode: "copy" })}
              />
              <EndOfSequenceAction
                icon={IconPlus}
                onClick={() => player.extend({ mode: "empty" })}
              />
              <EndOfSequenceAction
                icon={IconMagic}
                isLoading={nextBeatMutation.isLoading}
                onClick={handleGenerateNextSequence}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SkeletonNextSequence({ length }: { length: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-1 w-[50px] opacity-20 animate-pulse"
      style={{
        gridTemplateColumns: `repeat(${2}, 50px)`,
        gridTemplateRows: `repeat(${length}, 34px) auto`,
      }}
    >
      {Array.from({ length: length * 2 }).map((sample, idx) => (
        <Note key={idx} isActive={false} isSelected={false} colIndex={0} />
      ))}
      <div />
    </div>
  )
}

interface NoteProps {
  isActive: boolean
  isSelected: boolean
  colIndex: number
  onMouseDown?: MouseEventHandler<HTMLButtonElement>
  onMouseOver?: MouseEventHandler<HTMLButtonElement>
}

function Note({
  isActive,
  isSelected,
  onMouseDown,
  onMouseOver,
  colIndex,
}: NoteProps) {
  return (
    <motion.button
      onMouseDown={onMouseDown}
      onMouseOver={onMouseOver}
      variants={{
        active: {
          scale: 1.3,
          borderRadius: "8px",
        },
        normal: {
          scale: 1,
          borderRadius: "2px",
        },
      }}
      animate={isActive && isSelected ? "active" : "normal"}
      className={cx("rounded-sm", {
        "bg-gray-700": !isActive && !isSelected && !isOddGroup(colIndex),
        "bg-gray-800": !isActive && !isSelected && isOddGroup(colIndex),
        "bg-blue-400": !isActive && isSelected,
        "bg-white": isActive && isSelected,
        "bg-gray-600": isActive && !isSelected,
      })}
    ></motion.button>
  )
}

export function EndOfSequenceAction({
  onClick,
  icon: Icon,
  isLoading,
}: {
  onClick: VoidFunction
  isLoading?: boolean
  icon: React.ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <motion.button
      disabled={isLoading}
      className="text-gray-400"
      whileHover={{ scale: 1.05, color: "#FFF" }}
      onClick={onClick}
      style={{
        gridColumn: "end", // Place it in the last column
        gridRow: "1 / -1", // Span it across all rows
      }}
    >
      <Icon className="w-6 h-6" />
    </motion.button>
  )
}
