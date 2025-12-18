"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar, Repeat, Plus } from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { toast } from "sonner"
import { initializeApp } from "@/lib/init"

type AddTaskDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTaskType?: "daily" | "weekly"
}

export function AddTaskDialog({ open, onOpenChange, defaultTaskType = "daily" }: AddTaskDialogProps) {
  const [taskTitle, setTaskTitle] = useState("")
  const [taskType, setTaskType] = useState<"daily" | "weekly">(defaultTaskType)
  const [weeklyTargetCount, setWeeklyTargetCount] = useState(3) // 周任务目标完成次数，默认3次
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 根据任务类型获取固定的星币值
  const getFixedStarCoins = (type: "daily" | "weekly") => {
    return type === 'daily' ? 1 : 5
  }

  // 当弹窗打开或默认任务类型改变时，更新任务类型
  useEffect(() => {
    if (open) {
      setTaskType(defaultTaskType)
      initializeApp().catch(console.error)
    }
  }, [open, defaultTaskType])

  const { createTask, fetchTodayTasks, fetchWeeklyTasks } = useTaskStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskTitle.trim()) {
      toast.error("请输入任务名称")
      return
    }

    setIsSubmitting(true)

    try {
      // 根据任务类型自动设置经验值
      const expReward = taskType === 'daily' ? 10 : 50;

      const taskData = {
        title: taskTitle.trim(),
        type: taskType.toUpperCase() as 'DAILY' | 'WEEKLY',
        starCoins: getFixedStarCoins(taskType), // 使用固定的星币值：每日1星币，每周5星币
        expReward: expReward, // 每日任务10exp，每周任务50exp
        targetCount: taskType === 'weekly' ? weeklyTargetCount : 1, // 周任务设置完成次数，每日任务固定为1
        description: "",
        frequency: taskType === 'daily' ? 'DAILY' : 'WEEKLY',
        difficulty: 'MEDIUM' as const,
        category: '其他'
      }

      const newTask = await createTask(taskData)

      if (newTask) {
        // 刷新对应的任务列表
        if (taskType === 'daily') {
          await fetchTodayTasks()
        } else {
          await fetchWeeklyTasks()
        }

        toast.success(`任务"${taskTitle}"创建成功！`)

        // 重置表单
        setTaskTitle("")
        setTaskType("daily")
        setWeeklyTargetCount(3)

        // 关闭对话框
        onOpenChange(false)
      } else {
        toast.error("创建任务失败，请重试")
      }
    } catch (error) {
      console.error("创建任务失败:", error)
      toast.error("创建任务失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-primary">
            创建{taskType === 'daily' ? '每日' : '每周'}任务
          </DialogTitle>
          <DialogDescription>
            {taskType === 'daily'
              ? '设置今天要完成的目标，获得即时奖励'
              : '设置本周要达成的目标，获得丰厚奖励'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskTitle">任务名称</Label>
            <Input
              id="taskTitle"
              placeholder="例如：完成数学作业"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="bg-muted/30 border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>任务类型</Label>
            <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg border">
              {taskType === 'daily' ? (
                <>
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-blue-600">每日任务</span>
                  <span className="text-sm text-muted-foreground">今天完成，获得即时奖励</span>
                </>
              ) : (
                <>
                  <Repeat className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-purple-600">每周任务</span>
                  <span className="text-sm text-muted-foreground">本周完成，获得丰厚奖励</span>
                </>
              )}
            </div>
          </div>

          {/* 周任务特有：完成次数设置 */}
          {taskType === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="weeklyTargetCount">每周完成次数</Label>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWeeklyTargetCount(Math.max(1, weeklyTargetCount - 1))}
                    className="h-8 w-8 p-0"
                    disabled={weeklyTargetCount <= 1}
                  >
                    -
                  </Button>
                  <div className="flex flex-col items-center min-w-[60px]">
                    <span className="text-2xl font-bold text-primary">{weeklyTargetCount}</span>
                    <span className="text-xs text-muted-foreground">次/周</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWeeklyTargetCount(Math.min(7, weeklyTargetCount + 1))}
                    className="h-8 w-8 p-0"
                    disabled={weeklyTargetCount >= 7}
                  >
                    +
                  </Button>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {weeklyTargetCount === 1 && '本周只需完成1次'}
                    {weeklyTargetCount === 2 && '本周需要完成2次'}
                    {weeklyTargetCount >= 3 && weeklyTargetCount <= 4 && `本周需要完成${weeklyTargetCount}次，培养稳定习惯`}
                    {weeklyTargetCount >= 5 && `本周需要完成${weeklyTargetCount}次，挑战自我`}
                  </p>
                </div>
              </div>
              {/* 快速选择按钮 */}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeeklyTargetCount(1)}
                  className={`h-6 px-2 text-xs ${weeklyTargetCount === 1 ? 'bg-primary/10 border-primary/50' : ''}`}
                >
                  1次
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeeklyTargetCount(3)}
                  className={`h-6 px-2 text-xs ${weeklyTargetCount === 3 ? 'bg-primary/10 border-primary/50' : ''}`}
                >
                  3次
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeeklyTargetCount(5)}
                  className={`h-6 px-2 text-xs ${weeklyTargetCount === 5 ? 'bg-primary/10 border-primary/50' : ''}`}
                >
                  5次
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeeklyTargetCount(7)}
                  className={`h-6 px-2 text-xs ${weeklyTargetCount === 7 ? 'bg-primary/10 border-primary/50' : ''}`}
                >
                  7次
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>星币奖励</Label>
            <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg border">
              <span className="text-2xl">⭐</span>
              <div className="flex-1">
                <p className="font-medium text-lg">
                  {getFixedStarCoins(taskType)} 星币
                </p>
                <p className="text-sm text-muted-foreground">
                  {taskType === 'daily' ? '每日任务固定奖励' : `每周任务固定奖励（完成${weeklyTargetCount}次后获得）`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "创建中..." : "创建任务"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
