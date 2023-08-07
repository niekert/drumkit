import { Drumkit, SkeletonDrumkit } from "./Drumkit"
import { Suspense } from "react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between lg:py-24">
      <Suspense fallback={<SkeletonDrumkit />}>
        <Drumkit />
      </Suspense>
    </main>
  )
}
