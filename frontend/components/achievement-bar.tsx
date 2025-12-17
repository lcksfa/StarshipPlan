"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useCurrentUser } from "@/store/userStore"
import { useTotalStarCoins, useCurrentLevel, useLevelStats, usePointsStore } from "@/store/pointsStore"

export function AchievementBar() {
  const currentUser = useCurrentUser()
  const totalStarCoins = useTotalStarCoins()
  const currentLevel = useCurrentLevel()
  const { fetchUserPoints } = usePointsStore()

  // 组件加载时获取用户积分和等级数据
  useEffect(() => {
    if (currentUser?.id) {
      fetchUserPoints(currentUser.id)
    }
  }, [currentUser?.id, fetchUserPoints])

  // 从真实数据获取信息，如果没有数据则显示默认值
  const starCoins = totalStarCoins || 0

  // 使用当前等级系统：每100点经验升一级
  let currentExp = 0
  let progress = 0

  if (currentLevel) {
    currentExp = currentLevel.exp || 0
    // 经验值进度条显示当前等级的进度（0-100）
    progress = (currentExp % 100)
  } else {
    // 默认值
    currentExp = 0
    progress = 0
  }

  // 计算距离下一级的经验值
  const expToNextLevel = 100 - (currentExp % 100)

  // 等级信息
  const userLevel = currentLevel?.level || 1
  const rankTitle = currentLevel?.rankTitle || "见习宇航员"

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-accent/30 shadow-lg shadow-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-accent">
          <TrendingUp className="w-5 h-5" />
          成就进度
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 p-3 rounded-full">
              <Coins className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">星币余额</p>
              <p className="text-2xl font-bold text-accent">{starCoins}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">等级 {userLevel} - {rankTitle}</p>
            <p className="text-lg font-semibold text-foreground">{expToNextLevel} EXP</p>
            <p className="text-xs text-muted-foreground">距离升级</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">经验值进度</span>
            <span className="font-medium text-foreground">
              {currentExp % 100}/100
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      </CardContent>
    </Card>
  )
}
