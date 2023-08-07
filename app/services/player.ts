import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import {
  PlaybackState,
  Player,
  Player as PlayerBuffer,
  Sampler,
  Transport,
} from "tone"
import { EventEmitter } from "events"

export interface Sample {
  url: string
  name: string
}

// 0 = off, 1 = on
// Based on 16th notes for now
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

export function usePlayerstate() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export class SequencePlayer {
  private tracks: Record<string, PlayerBuffer> = {}
  private currentStep: number = 0
  private repeatIntervalId: number | null = null
  private emitter: EventEmitter = new EventEmitter()
  private _session: SessionSequence

  public static fromSamples(samples: Sample[]) {
    return samples.reduce<SessionSequence>((acc, sample) => {
      // TODO: back to 16?
      acc[sample.name] = newSequence(16)

      return acc
    }, {})
  }

  constructor(private samples: Sample[]) {
    this._session = SequencePlayer.fromSamples(samples)
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

    this._session = nextSession

    this.emitter.emit("tick")
  }

  public extend = () => {
    const nextSession = Object.fromEntries(
      Object.entries(this.session).map(([sample, sequence]) => [
        sample,
        [...sequence, ...newSequence(16)],
      ])
    ) satisfies SessionSequence

    this._session = nextSession

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
    return this._session
  }
}

function newSequence(length: number): Sequence {
  return Array.from({ length }, () => 0)
}

export interface PlayerState {
  status: PlaybackState
  currentStep: number
}

export function usePlayer(bpm: number, samples: Sample[]) {
  const status = usePlayerstate()

  const player = useMemo<SequencePlayer>(
    () => new SequencePlayer(samples),
    [samples]
  )

  const currentStep = useSyncExternalStore(
    useCallback((subscribe) => player.tick(subscribe), [player]),
    useCallback(() => player.step, [player]),
    () => 0
  )

  const session = useSyncExternalStore(
    useCallback((subscribe) => player.tick(subscribe), [player]),
    useCallback(() => player.session, [player]),
    useCallback(() => player.session, [player])
  )

  useEffect(() => {
    player.setBpm(bpm)
  }, [bpm, player])

  const state: PlayerState = {
    currentStep,
    status,
  }

  return {
    player,
    sequence: session,
    state,
  }
}
