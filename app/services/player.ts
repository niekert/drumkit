import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import { PlaybackState, Player, Player as PlayerBuffer, Transport } from "tone"
import { EventEmitter } from "events"

export interface Sample {
  url: string
  name: string
}

// 0 = off, 1 = on
// TODO: support velocity? <3
export type Sequence = number[]
export type SessionSequence = {
  [sample: string]: Sequence
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
  }

  public setNote = (sample: string, step: number, nextValue?: number) => {
    const nextSession = {
      ...this.session,
      [sample]: this.session[sample].map((value, idx) => {
        if (idx === step) {
          return nextValue ?? value === 0 ? 1 : 0
        }

        return value
      }),
    }

    this._sequence = nextSession

    this.emitter.emit("tick")
  }

  public extend = (mode: "copy" | "empty") => {
    const nextSession = Object.fromEntries(
      Object.entries(this.session).map(([sample, sequence]) => {
        const nextSequence =
          mode === "empty" ? Sequencer.newSequence(16) : sequence.slice(-16)

        return [sample, [...sequence, ...nextSequence]]
      })
    ) satisfies SessionSequence

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

  public start = async () => {
    await this.loadSamples()

    this.currentStep = 0

    const buffers = Object.values(this.tracks)

    // We need to call Tone.start() from a user event for the browser permissions.
    // so we fake a track with 0 audio
    const fakePlayer = new Player(buffers[0].buffer).toDestination()
    fakePlayer.volume.value = -10000

    fakePlayer.start()
    this.repeatIntervalId = Transport.scheduleRepeat((time) => {
      for (let sample of this.samples) {
        const track = this.tracks[sample.name]

        if (!track) continue

        const sequence = this.session[sample.name]

        if (sequence[this.currentStep] === 1) {
          track.start(time)
        }
      }

      const totalSteps = Object.values(this.session)[0].length

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

  public get session() {
    return this._sequence
  }
}

export interface PlayerState {
  status: PlaybackState
  sequence: SessionSequence
  currentStep: number
}

export function useSequencer(bpm: number, samples: Sample[]) {
  const transportStatus = useTransportState()

  // Use state instead of useMemo for safety?
  const sequencer = useMemo<Sequencer>(() => new Sequencer(samples), [samples])

  const currentStep = useSyncExternalStore(
    useCallback((subscribe) => sequencer.tick(subscribe), [sequencer]),
    useCallback(() => sequencer.step, [sequencer]),
    () => 0
  )

  const sequence = useSyncExternalStore(
    useCallback((subscribe) => sequencer.tick(subscribe), [sequencer]),
    useCallback(() => sequencer.session, [sequencer]),
    useCallback(() => sequencer.session, [sequencer])
  )

  useEffect(() => {
    sequencer.setBpm(bpm)
  }, [bpm, sequencer])

  const state: PlayerState = {
    currentStep,
    sequence,
    status: transportStatus,
  }

  return {
    sequencer: sequencer,
    state,
  }
}
