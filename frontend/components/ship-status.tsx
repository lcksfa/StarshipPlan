"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket } from "lucide-react"
import { useCurrentUser, useUserStore } from "@/store/userStore"
import { useCurrentLevel, usePointsStore } from "@/store/pointsStore"

export function ShipStatus() {
  const currentUser = useCurrentUser()
  const currentLevel = useCurrentLevel()
  const { fetchUserPoints } = usePointsStore()

  // 组件加载时获取用户等级数据
  useEffect(() => {
    if (currentUser?.id) {
      fetchUserPoints(currentUser.id)
    }
  }, [currentUser?.id, fetchUserPoints])

  // 从真实数据获取信息，如果没有数据则显示默认值
  const level = currentLevel?.level || 1
  const shipName = currentUser?.displayName || currentUser?.username || "探索者号"
  const rankTitle = currentLevel?.rankTitle || "见习宇航员"

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-primary/30 shadow-lg shadow-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary text-base sm:text-lg">
          <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
          我的星舰
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 animate-float">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="shipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.65 0.22 265)" />
                  <stop offset="100%" stopColor="oklch(0.72 0.18 45)" />
                </linearGradient>
              </defs>
              <path
                d="M50 10 L60 40 L80 50 L60 60 L50 90 L40 60 L20 50 L40 40 Z"
                fill="url(#shipGradient)"
                className="drop-shadow-lg"
              />
              <circle cx="50" cy="50" r="8" fill="oklch(0.98 0.01 265)" className="animate-pulse" />
            </svg>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg sm:text-xl font-bold text-accent">{shipName}</p>
          <p className="text-xs text-muted-foreground">等级 {level} 星舰</p>
          <p className="text-xs text-primary font-medium">{rankTitle}</p>
        </div>



        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">星舰运行正常</p>
          <p className="text-xs text-muted-foreground mt-1">准备执行今日任务</p>
        </div>
      </CardContent>
    </Card>
  )
}
