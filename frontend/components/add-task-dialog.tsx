"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type AddTaskDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const [taskTitle, setTaskTitle] = useState("")
  const [taskType, setTaskType] = useState<"daily" | "weekly">("daily")
  const [starCoins, setStarCoins] = useState("10")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Add task logic here
    console.log("[v0] Adding task:", { taskTitle, taskType, starCoins })
    setTaskTitle("")
    setStarCoins("10")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-primary">创建新任务</DialogTitle>
          <DialogDescription>设置你的目标，赚取星币奖励</DialogDescription>
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
            <RadioGroup value={taskType} onValueChange={(v) => setTaskType(v as "daily" | "weekly")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="font-normal cursor-pointer">
                  每日任务
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="font-normal cursor-pointer">
                  每周任务
                </Label>
              </div>
            </RadioGroup>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              取消
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
              创建任务
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
