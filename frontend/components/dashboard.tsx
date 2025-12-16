"use client"

import { ShipStatus } from "@/components/ship-status"
import { TaskList } from "@/components/task-list"
import { AchievementBar } from "@/components/achievement-bar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, ListChecks, Rocket, Trophy } from "lucide-react"

interface DashboardProps {
  username: string
  onLogout: () => void
}

export function Dashboard({ username, onLogout }: DashboardProps) {
  return (
    <div className="relative z-10 container mx-auto px-4 py-4 sm:py-6 max-w-6xl">
      <header className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2 text-balance">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                StarshipPlan
              </span>
            </h1>
            <p className="text-xs sm:text-base text-muted-foreground">
              欢迎回来，<span className="text-primary font-semibold">{username}</span> 宇航员
            </p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className="self-center sm:self-auto border-border hover:bg-muted bg-transparent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出
          </Button>
        </div>
      </header>

      <div className="hidden md:block">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3 mb-4 sm:mb-6">
          <ShipStatus />
          <div className="md:col-span-2">
            <AchievementBar />
          </div>
        </div>
        <TaskList />
      </div>

      <div className="md:hidden">
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-sm border border-accent/30">
            <TabsTrigger
              value="tasks"
              className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">任务</span>
            </TabsTrigger>
            <TabsTrigger
              value="ship"
              className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Rocket className="w-4 h-4" />
              <span className="hidden sm:inline">飞船</span>
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">成就</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <TaskList />
          </TabsContent>

          <TabsContent value="ship" className="mt-4">
            <ShipStatus />
          </TabsContent>

          <TabsContent value="achievements" className="mt-4">
            <AchievementBar />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
