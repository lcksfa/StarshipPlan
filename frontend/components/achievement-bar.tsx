"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function AchievementBar() {
  const starCoins = 128
  const currentExp = 750
  const nextLevelExp = 1000
  const progress = (currentExp / nextLevelExp) * 100

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
