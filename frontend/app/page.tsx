import { SpaceBackground } from "@/components/space-background"
import { ShipStatus } from "@/components/ship-status"
import { TaskList } from "@/components/task-list"
import { AchievementBar } from "@/components/achievement-bar"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <SpaceBackground />

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 text-balance">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              StarshipPlan
            </span>
          </h1>
          <p className="text-center text-muted-foreground text-lg">星舰计划 - 开启你的太空探险</p>
        </header>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <ShipStatus />
          <div className="md:col-span-2">
            <AchievementBar />
          </div>
        </div>

        <TaskList />
      </div>
    </main>
  )
}
