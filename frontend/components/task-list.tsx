"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Repeat, Sparkles } from "lucide-react"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { useTodayTasks, useWeeklyTasks, useTaskStore } from "@/store/taskStore"
import { Task } from "@/types/api"
import { toast } from "sonner"

export function TaskList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 使用真实的 store 数据
  const dailyTasks = useTodayTasks()
  const weeklyTasks = useWeeklyTasks()
  const { fetchTodayTasks, fetchWeeklyTasks, completeTask, fetchTasks, isLoading, error } = useTaskStore()

  // 组件加载时获取任务数据
  useEffect(() => {
    fetchTodayTasks()
    fetchWeeklyTasks()
  }, [fetchTodayTasks, fetchWeeklyTasks])

  const toggleTask = async (taskId: string) => {
    try {
      const task = [...dailyTasks, ...weeklyTasks].find(t => t.id === taskId)
      if (!task) {
        toast.error("任务不存在")
        return
      }

      // 检查任务是否已完成
      const isCompleted = task.completed || task.isCompletedToday || task.isCompletedThisWeek
      if (isCompleted) {
        toast.info("该任务今天已经完成了！")
        return
      }

      const completion = await completeTask(taskId)
      if (completion) {
        // 刷新任务列表和积分数据
        await Promise.all([
          fetchTodayTasks(),
          fetchWeeklyTasks(),
          fetchTasks(true) // 刷新主任务列表
        ])

        toast.success(`任务"${task.title}"完成！获得 ${task.starCoins} 星币`)
      } else {
        toast.error("完成任务失败，请重试")
      }
    } catch (error: any) {
      console.error("完成任务失败:", error)

      // 处理特定错误消息
      if (error.message === "今天已经完成过这个任务了") {
        toast.info("该任务今天已经完成了！")
        // 刷新任务列表以同步状态
        await Promise.all([
          fetchTodayTasks(),
          fetchWeeklyTasks()
        ])
      } else {
        toast.error("完成任务失败，请重试")
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle className="flex items-center gap-2 text-primary text-base sm:text-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            每日任务
          </CardTitle>
          <Button
            onClick={() => setIsDialogOpen(true)}
            size="sm"
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加任务
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : dailyTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">暂无每日任务</p>
              <p className="text-sm">点击上方"添加任务"按钮创建新任务</p>
            </div>
          ) : (
            dailyTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <Checkbox
                  checked={task.completed || task.isCompletedToday}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-sm sm:text-base ${(task.completed || task.isCompletedToday) ? "line-through text-muted-foreground" : "text-foreground"}`}
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
                  className="bg-accent/20 text-accent hover:bg-accent/30 flex items-center gap-1 flex-shrink-0 text-xs sm:text-sm"
                >
                  <Sparkles className="w-3 h-3" />+{task.starCoins}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary text-base sm:text-lg">
            <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
            每周任务
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : weeklyTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">暂无每周任务</p>
              <p className="text-sm">每周任务可以帮助培养长期习惯</p>
            </div>
          ) : (
            weeklyTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <Checkbox
                  checked={task.completed || task.isCompletedThisWeek}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-sm sm:text-base ${(task.completed || task.isCompletedThisWeek) ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {task.title}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-accent/20 text-accent hover:bg-accent/30 flex items-center gap-1 flex-shrink-0 text-xs sm:text-sm"
                >
                  <Sparkles className="w-3 h-3" />+{task.starCoins}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AddTaskDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  )
}
