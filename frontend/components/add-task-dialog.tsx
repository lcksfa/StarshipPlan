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
  const [starCoins, setStarCoins] = useState("10")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        starCoins: parseInt(starCoins, 10),
        expReward: expReward, // 每日任务10exp，每周任务50exp
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
        setStarCoins("10")
        setTaskType("daily")

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

          <div className="space-y-2">
            <Label htmlFor="starCoins">星币奖励</Label>
            <Input
              id="starCoins"
              type="number"
              min="1"
              value={starCoins}
              onChange={(e) => setStarCoins(e.target.value)}
              className="bg-muted/30 border-border"
              required
            />
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
