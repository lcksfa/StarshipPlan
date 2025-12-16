"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Repeat, Sparkles } from "lucide-react"
import { AddTaskDialog } from "@/components/add-task-dialog"

type Task = {
  id: string
  title: string
  type: "daily" | "weekly"
  starCoins: number
  completed: boolean
  streak?: number
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "完成数学作业", type: "daily", starCoins: 10, completed: false, streak: 5 },
    { id: "2", title: "阅读30分钟", type: "daily", starCoins: 15, completed: true, streak: 12 },
    { id: "3", title: "练习钢琴", type: "daily", starCoins: 20, completed: false, streak: 3 },
    { id: "4", title: "整理房间", type: "weekly", starCoins: 50, completed: false },
    { id: "5", title: "户外运动1小时", type: "daily", starCoins: 25, completed: false, streak: 8 },
  ])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const toggleTask = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const dailyTasks = tasks.filter((t) => t.type === "daily")
  const weeklyTasks = tasks.filter((t) => t.type === "weekly")

  return (
    <div className="space-y-6">
      <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calendar className="w-5 h-5" />
            每日任务
          </CardTitle>
          <Button onClick={() => setIsDialogOpen(true)} size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            添加任务
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {dailyTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {task.title}
                </p>
                {task.streak && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-accent" />
                    连续 {task.streak} 天
                  </p>
                )}
              </div>
              <Badge
                variant="secondary"
                className="bg-accent/20 text-accent hover:bg-accent/30 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />+{task.starCoins}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Repeat className="w-5 h-5" />
            每周任务
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {weeklyTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div className="flex-1">
                <p
                  className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {task.title}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-accent/20 text-accent hover:bg-accent/30 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />+{task.starCoins}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <AddTaskDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  )
}
