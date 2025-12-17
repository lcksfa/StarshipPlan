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
  const levelStats = useLevelStats()
  const { fetchUserPoints, fetchLevelStats } = usePointsStore()

  // 组件加载时获取用户积分和等级数据
  useEffect(() => {
    if (currentUser?.id) {
      fetchUserPoints(currentUser.id)
      fetchLevelStats(currentUser.id)
    }
  }, [currentUser?.id, fetchUserPoints, fetchLevelStats])

  // 从真实数据获取信息，如果没有数据则显示默认值
  const starCoins = totalStarCoins || 0

  // 使用 levelStats 或 currentLevel 来获取经验值
  let currentExp = 0
  let nextLevelExp = 1000
  let progress = 0

  if (levelStats) {
    currentExp = levelStats.currentExp
    nextLevelExp = levelStats.expToNext
    progress = levelStats.progressPercentage
  } else if (currentLevel) {
    currentExp = currentLevel.exp
    nextLevelExp = currentLevel.expToNext || 1000
    progress = nextLevelExp > 0 ? (currentExp / nextLevelExp) * 100 : 0
  } else {
    // 默认值
    currentExp = 0
    nextLevelExp = 1000
    progress = 0
  }

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
            <p className="text-sm text-muted-foreground">距离下一级</p>
            <p className="text-lg font-semibold text-foreground">{nextLevelExp - currentExp} EXP</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">经验值进度</span>
            <span className="font-medium text-foreground">
              {currentExp}/{nextLevelExp}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      </CardContent>
    </Card>
  )
}
