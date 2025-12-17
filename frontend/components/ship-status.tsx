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
  const shipName = "苍穹之翼" // 固定星舰名称
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
            <svg viewBox="0 0 120 100" className="w-full h-full">
              <defs>
                <linearGradient id="shipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.65 0.22 265)" />
                  <stop offset="50%" stopColor="oklch(0.72 0.18 45)" />
                  <stop offset="100%" stopColor="oklch(0.55 0.18 180)" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* 苍穹之翼 - 主舰体 */}
              <path
                d="M60 5 L75 35 L95 45 L75 55 L60 95 L40 55 L25 45 L40 35 Z"
                fill="url(#shipGradient)"
                className="drop-shadow-lg filter-glow"
                filter="url(#glow)"
              />
              {/* 左翼 */}
              <path
                d="M40 35 L15 25 L10 35 L30 45 Z"
                fill="oklch(0.65 0.22 265)"
                opacity="0.8"
                className="drop-shadow-md"
              />
              {/* 右翼 */}
              <path
                d="M80 35 L105 25 L110 35 L90 45 Z"
                fill="oklch(0.65 0.22 265)"
                opacity="0.8"
                className="drop-shadow-md"
              />
              {/* 核心 */}
              <circle cx="60" cy="50" r="6" fill="oklch(0.98 0.01 265)" className="animate-pulse" />
              {/* 引擎光效 */}
              <circle cx="35" cy="70" r="3" fill="oklch(0.72 0.18 45)" className="animate-pulse" opacity="0.7" />
              <circle cx="85" cy="70" r="3" fill="oklch(0.72 0.18 45)" className="animate-pulse" opacity="0.7" />
            </svg>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg sm:text-xl font-bold text-accent">{shipName}</p>
          <p className="text-xs text-muted-foreground">等级 {level} 星舰</p>
          <p className="text-xs text-primary font-medium">{rankTitle}</p>
        </div>



        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">苍穹之翼状态良好</p>
          <p className="text-xs text-muted-foreground mt-1">翱翔于星际之间</p>
        </div>
      </CardContent>
    </Card>
  )
}
