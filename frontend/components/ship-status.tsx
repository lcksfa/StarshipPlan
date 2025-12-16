"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket } from "lucide-react"

export function ShipStatus() {
  const level = 3
  const shipName = "探索者号"

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-primary/30 shadow-lg shadow-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary text-base sm:text-lg">
          <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
          我的星舰
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 animate-float">
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
          <p className="text-xl sm:text-2xl font-bold text-accent">{shipName}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">等级 {level} 星舰</p>
        </div>
      </CardContent>
    </Card>
  )
}
