"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Calendar, Repeat, Sparkles, Plus, Zap, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AddTaskDialog } from "./add-task-dialog"
import { useTodayTasks, useWeeklyTasks, useTaskStore } from "@/store/taskStore"
import { useCurrentUser } from "@/store/userStore"
import { usePointsStore } from "@/store/pointsStore"
import { Task } from "@/types/api"

export function TaskList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [defaultTaskType, setDefaultTaskType] = useState<"daily" | "weekly">("daily")

  // 使用真实的 store 数据
  const dailyTasks = useTodayTasks()
  const weeklyTasks = useWeeklyTasks()
  const { fetchTodayTasks, fetchWeeklyTasks, completeTask, uncompleteTask, fetchTasks, deleteTask, isLoading, error } = useTaskStore()
  const currentUser = useCurrentUser()
  const { fetchUserPoints } = usePointsStore()

  // 组件加载时获取任务数据
  useEffect(() => {
    fetchTodayTasks()
    fetchWeeklyTasks()
  }, [fetchTodayTasks, fetchWeeklyTasks])

  const deleteTaskHandler = async (taskId: string) => {
    try {
      const task = [...dailyTasks, ...weeklyTasks].find(t => t.id === taskId)
      if (!task) {
        toast.error("任务不存在")
        return
      }

      const success = await deleteTask(taskId)
      if (success) {
        // 刷新任务列表
        await Promise.all([
          fetchTodayTasks(),
          fetchWeeklyTasks()
        ])
        toast.success(`任务"${task.title}"已删除`)
      } else {
        toast.error("删除任务失败，请重试")
      }
    } catch (error: any) {
      console.error("删除任务失败:", error)
      toast.error("删除失败，请重试")
    }
  }

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
        // 如果任务已完成，则取消完成
        const result = await uncompleteTask(taskId)
        if (result) {
          // 刷新任务列表、积分和等级数据
          console.log('任务完成后刷新数据，当前用户:', currentUser);
          const refreshTasks = [
            fetchTodayTasks(),
            fetchWeeklyTasks(),
            fetchTasks(true), // 刷新主任务列表
          ];

          if (currentUser?.id) {
            console.log('调用fetchUserPoints，用户ID:', currentUser.id);
            refreshTasks.push(fetchUserPoints(currentUser.id));
          } else {
            console.error('当前用户ID为空，无法刷新积分数据');
          }

          await Promise.all(refreshTasks);

          toast.success(`任务"${task.title}"已取消完成，扣除相应星币和经验`)
        } else {
          toast.error("取消完成任务失败，请重试")
        }
      } else {
        // 如果任务未完成，则完成任务
        const completion = await completeTask(taskId)
        if (completion) {
          // 刷新任务列表、积分和等级数据
          console.log('任务完成时刷新数据，当前用户:', currentUser);
          const refreshTasks = [
            fetchTodayTasks(),
            fetchWeeklyTasks(),
            fetchTasks(true), // 刷新主任务列表
          ];

          if (currentUser?.id) {
            console.log('调用fetchUserPoints，用户ID:', currentUser.id);
            refreshTasks.push(fetchUserPoints(currentUser.id));
          } else {
            console.error('当前用户ID为空，无法刷新积分数据');
          }

          await Promise.all(refreshTasks);

          // 显示完整的奖励信息
          const expGained = completion.expGained || (task.type === 'DAILY' ? 10 : 50)
          const bonusMultiplier = completion.bonusMultiplier || 1.0
          const bonusText = bonusMultiplier > 1 ? ` (含${Math.round((bonusMultiplier - 1) * 100)}%连击奖励!)` : ''

          toast.success(`任务"${task.title}"完成！获得 ${task.starCoins} 星币 + ${expGained} 经验${bonusText}`)
        }
      }
    } catch (error: any) {
      console.error("任务状态切换失败:", error)

      // 显示具体的错误信息给用户
      let errorMessage = "操作失败，请重试"
      let isInfoMessage = false

      if (error.message) {
        // 处理各种特定的错误情况
        if (error.message.includes("今天已经完成过这个任务了") || error.message.includes("今天已经完成过这个周任务了")) {
          errorMessage = "该任务今天已经完成了！"
          isInfoMessage = true
        } else if (error.message.includes("今天没有完成过这个任务")) {
          errorMessage = "该任务今天还没有完成过！"
          isInfoMessage = true
        } else if (error.message.includes("本周已完成该任务") || error.message.includes("无需继续完成")) {
          errorMessage = error.message
          isInfoMessage = true
        } else if (error.message.includes("任务不存在或已停用")) {
          errorMessage = "任务不存在或已被禁用"
        } else if (error.message.includes("需要在")) {
          errorMessage = error.message // 时间限制错误
        } else {
          errorMessage = error.message // 显示原始错误信息
        }
      }

      // 根据错误类型显示不同的提示
      if (isInfoMessage) {
        toast.info(errorMessage)
      } else {
        toast.error(errorMessage)
      }

      // 刷新任务列表以同步状态
      await Promise.all([
        fetchTodayTasks(),
        fetchWeeklyTasks(),
        ...(currentUser?.id ? [fetchUserPoints(currentUser.id)] : [])
      ])
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 并排的任务卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* 每日任务卡片 */}
        <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-primary text-base sm:text-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              每日任务
            </CardTitle>
            <Button
              onClick={() => {
                setDefaultTaskType("daily")
                setIsDialogOpen(true)
              }}
              size="sm"
              variant="outline"
              className="h-8 px-3 border-primary/50 hover:bg-primary/10 hover:border-primary"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">添加</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5 sm:space-y-2">
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
                  className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <Checkbox
                    checked={task.completed || task.isCompletedToday}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium text-sm sm:text-base ${(task.completed || task.isCompletedToday) ? "line-through text-muted-foreground" : "text-foreground"}`}
                    >
                      {task.title}
                    </p>
                    {/* 周任务进度显示 */}
                    {task.type === 'WEEKLY' && task.targetCount && (
                      <p className="text-xs text-muted-foreground mt-1">
                        进度: {task.weeklyCompletedCount || 0} / {task.targetCount} 次
                      </p>
                    )}
                    {task.streak && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-accent" />
                        连续 {task.streak} 天
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant="secondary"
                      className="bg-accent/20 text-accent hover:bg-accent/30 flex items-center gap-1 flex-shrink-0 text-xs sm:text-sm"
                    >
                      <Sparkles className="w-3 h-3" />+{task.starCoins}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 flex items-center gap-1 flex-shrink-0 text-xs"
                    >
                      <Zap className="w-3 h-3" />+{task.type === 'DAILY' ? 10 : 50} EXP
                    </Badge>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>删除任务</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除任务 "{task.title}" 吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTaskHandler(task.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 每周任务卡片 */}
        <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-primary text-base sm:text-lg">
              <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
              每周任务
            </CardTitle>
            <Button
              onClick={() => {
                setDefaultTaskType("weekly")
                setIsDialogOpen(true)
              }}
              size="sm"
              variant="outline"
              className="h-8 px-3 border-primary/50 hover:bg-primary/10 hover:border-primary"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">添加</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5 sm:space-y-2">
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
                  className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  {/* 周任务进度可视化 */}
                  {task.type === 'WEEKLY' && task.targetCount ? (
                    <div
                      className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors"
                      onClick={() => toggleTask(task.id)}
                      title="点击完成一次任务"
                    >
                      <div>
                        <p
                          className={`font-medium text-sm sm:text-base ${(task.completed || task.isCompletedThisWeek) ? "line-through text-muted-foreground" : "text-foreground"}`}
                        >
                          {task.title}
                        </p>
                        <div className="mt-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min((task.weeklyCompletedCount || 0) / task.targetCount * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground min-w-[40px]">
                              {task.weeklyCompletedCount || 0}/{task.targetCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Checkbox
                      checked={task.completed || task.isCompletedThisWeek}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 flex-shrink-0"
                    />
                  )}
                  {task.type !== 'WEEKLY' && (
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-sm sm:text-base ${(task.completed || task.isCompletedThisWeek) ? "line-through text-muted-foreground" : "text-foreground"}`}
                      >
                        {task.title}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant="secondary"
                      className="bg-accent/20 text-accent hover:bg-accent/30 flex items-center gap-1 flex-shrink-0 text-xs sm:text-sm"
                    >
                      <Sparkles className="w-3 h-3" />+{task.starCoins}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 flex items-center gap-1 flex-shrink-0 text-xs"
                    >
                      <Zap className="w-3 h-3" />+{task.type === 'DAILY' ? 10 : 50} EXP
                    </Badge>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>删除任务</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除任务 "{task.title}" 吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTaskHandler(task.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <AddTaskDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} defaultTaskType={defaultTaskType} />
    </div>
  )
}
