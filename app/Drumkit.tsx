import DrumMachine from "./components/DrumMachine"
import fs from "fs"
import path from "path"
import { cache } from "react"

export interface Sample {
  name: string
  url: string
}

const samplePath = "public/samples"

export const getSamples = cache(async () => {
  const machines = fs.readdirSync(samplePath).filter((m) => {
    const fullPath = path.join(samplePath, m)

    return fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()
  })

  const samples: Record<string, Sample[]> = {}
  for (let machine of machines) {
    const files = fs.readdirSync(`public/samples/${machine}`)

    samples[machine] = files.map((file) => ({
      name: file.split("-")[1].split(".")[0],
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
