import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import { PlaybackState, Player, Player as PlayerBuffer, Transport } from "tone"
import { EventEmitter } from "events"
import { Sequence, SessionSequence } from "../domain"

export interface Sample {
  url: string
  name: string
}

function getSnapshot() {
  return Transport.state
}

function getServerSnapshot() {
  return "stopped" as const
}

function subscribe(subscribe: VoidFunction) {
  Transport.on("start", subscribe)
  Transport.on("stop", subscribe)
  Transport.on("pause", subscribe)

  return () => {
    Transport.off("start", subscribe)
    Transport.off("stop", subscribe)
    Transport.off("pause", subscribe)
  }
}

export function useTransportState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export class Sequencer {
  private tracks: Record<string, PlayerBuffer> = {}
  private currentStep: number = 0
  private emitter: EventEmitter = new EventEmitter()
  private _sequence: SessionSequence
  private repeatIntervalId: number | null = null

  public static readonly INITIAL_BPM = 120

  public static newSequence(length: number): Sequence {
    return Array.from({ length }, () => 0)
  }

  public static fromSamples(samples: Sample[]) {
    return samples.reduce<SessionSequence>((acc, sample) => {
      acc[sample.name] = Sequencer.newSequence(16)

      return acc
    }, {})
  }

  constructor(private samples: Sample[]) {
    this._sequence = Sequencer.fromSamples(samples)

    if (globalThis.window) {
      // Ignore on server hacky way
      Transport.bpm.value = Sequencer.INITIAL_BPM
    }
  }

  public setNote = (sample: string, step: number, nextValue?: number) => {
    const nextSession = {
      ...this.sequence,
      [sample]: this.sequence[sample].map((value, idx) => {
        if (idx === step) {
          return nextValue ?? value === 0 ? 1 : 0
        }

        return value
      }),
    }

    this._sequence = nextSession

    this.emitter.emit("tick")
  }

  public extend = <
    TMode extends "copy" | "empty" | "set",
    TArgs extends TMode extends "set"
      ? { mode: TMode; setSequence: SessionSequence }
      : { mode: TMode }
  >(
    args: TArgs
  ) => {
    const nextSession = Object.fromEntries(
      Object.entries(this.sequence).map(([sample, sequence]) => {
        const nextSequence =
          args.mode === "set"
            ? args.setSequence[sample]
            : args.mode === "empty"
            ? Sequencer.newSequence(16)
            : sequence.slice(-16)

        return [sample, [...sequence, ...nextSequence]]
      })
    ) satisfies SessionSequence

    this._sequence = nextSession

    this.emitter.emit("tick")
  }

  public clear = () => {
    const nextSession = Sequencer.fromSamples(this.samples)

    this._sequence = nextSession

    this.emitter.emit("tick")
  }

  public tick(cb: VoidFunction) {
    this.emitter.addListener("tick", cb)
    return () => {
      this.emitter.removeListener("tick", cb)
    }
  }

  private async loadSamples() {
    if (Object.values(this.tracks).length > 0) return

    const players = await Promise.all(
      this.samples.map((sample) =>
        new PlayerBuffer(sample.url).toDestination().load(sample.url)
      )
    )

    this.tracks = Object.fromEntries(
      this.samples.map((sample, i) => [sample.name, players[i]] as const)
    )
  }

  public setBpm(bpm: number) {
    Transport.bpm.value = bpm
  }

  public deleteBar = (barIndex: number) => {
    const nextSession = Object.fromEntries(
      Object.entries(this.sequence).map(([sample, sequence]) => {
        return [
          sample,
          sequence.filter((_, idx) => {
            return idx < barIndex * 16 || idx >= (barIndex + 1) * 16
          }),
        ]
      })
    ) satisfies SessionSequence

    this._sequence = nextSession

    this.emitter.emit("tick")
  }

  public start = async () => {
    await this.loadSamples()

    this.currentStep = 0

    const buffers = Object.values(this.tracks)

    // We need to call Tone.start() from a user event for the browser permissions.
    // so we fake a track without any audio
    const fakePlayer = new Player(buffers[0].buffer).toDestination()
    fakePlayer.volume.value = -10000
    fakePlayer.start()

    // Repeat every 16th node
    Transport.swing = 0.5
    Transport.swingSubdivision = "16n"

    this.repeatIntervalId = Transport.scheduleRepeat((time) => {
      for (let sample of this.samples) {
        const track = this.tracks[sample.name]

        if (!track) continue

        const sequence = this.sequence[sample.name]

        if (sequence[this.currentStep] === 1) {
          track.start(time)
        }
      }

      const totalSteps = Object.values(this.sequence)[0].length

      // Kinda hacking here
      this.currentStep = (this.currentStep + 1) % totalSteps

      this.emitter.emit("tick", this.currentStep)
    }, "16n")

    Transport.start()
  }

  public playSample = async (sample: string) => {
    await this.loadSamples()

    const track = this.tracks[sample]

    if (!track) return

    track.start(0)
  }

  public stop = () => {
    if (this.repeatIntervalId != null) {
      Transport.clear(this.repeatIntervalId)
      this.repeatIntervalId = null
    }

    Transport.stop()
  }

  public get step() {
    return this.currentStep
  }

  public get sequence() {
    return this._sequence
  }

  public get bpm() {
    return Transport.bpm.value
  }
}

export interface SequencerState {
  status: PlaybackState
  sequence: SessionSequence
  currentStep: number
  bpm: number
}

export function useSequencer(samples: Sample[]) {
  const transportStatus = useTransportState()

  // Use state instead of useMemo for safety?
  const sequencer = useMemo<Sequencer>(() => new Sequencer(samples), [samples])

  const subscribe = useCallback(
    (subscribe: VoidFunction) => sequencer.tick(subscribe),
    [sequencer]
  )

  const currentStep = useSyncExternalStore(
    subscribe,
    useCallback(() => sequencer.step, [sequencer]),
    () => 0
  )

  const sequence = useSyncExternalStore(
    subscribe,
    useCallback(() => sequencer.sequence, [sequencer]),
    useCallback(() => sequencer.sequence, [sequencer])
  )

  const bpm = useSyncExternalStore(
    subscribe,
    useCallback(() => sequencer.bpm, [sequencer]),
    useCallback(() => 120, [])
  )

  const state: SequencerState = {
    currentStep,
    sequence,
    status: transportStatus,
    bpm,
  }

  return {
    sequencer: sequencer,
    state,
  }
}
