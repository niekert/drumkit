import { useSyncExternalStore } from "react"
import { Player, Player as PlayerBuffer, Sampler, Transport } from "tone"

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

export class SequencePlayer {
  private tracks: Record<string, PlayerBuffer> = {}
  private currentStep: number = 0
  private gridInterval = 16 // harcoded for now
  private repeatIntervalId: number | null = null

  constructor(private samples: Sample[], private session: SessionSequence) {}

  public update(session: SessionSequence) {
    this.session = session
  }

  private async loadSamples() {
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

    this.repeatIntervalId = Transport.scheduleRepeat((time) => {
      for (let sample of this.samples) {
        const track = this.tracks[sample.name]

        if (!track) continue

        const sequence = this.session[sample.name]

        if (sequence[this.currentStep] === 1) {
          const player = new Player(track.buffer, () => {
            player.dispose()
          }).toDestination()

          player.start()
        }
      }

      this.currentStep = (this.currentStep + 1) % this.gridInterval
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
    if (this.repeatIntervalId) {
      Transport.clear(this.repeatIntervalId)
    }

    Transport.stop()
  }
}

function getSnapshot() {
  return Transport.state
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
  return useSyncExternalStore(subscribe, getSnapshot)
}
