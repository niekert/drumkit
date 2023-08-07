import DrumMachine from "./components/DrumMachine"
import fs from "fs"
import { cache } from "react"

export interface Sample {
  name: string
  url: string
}

export const getSamples = cache(async () => {
  const machines = fs.readdirSync("public/samples")

  const samples: Record<string, Sample[]> = {}
  for (let machine of machines) {
    const files = fs.readdirSync(`public/samples/${machine}`)

    samples[machine] = files.map((file) => ({
      name: file.split(".")[0],
      url: `/samples/${machine}/${file}`,
    }))
  }

  return {
    machines,
    samples,
  }
})

export async function Drumkit() {
  const { machines, samples } = await getSamples()

  return (
    <DrumMachine
      drumMachines={machines}
      samples={samples}
      initialMachine={machines[0]}
    />
  )
}

export function SkeletonDrumkit() {
  return <div>Loading...</div>
}
