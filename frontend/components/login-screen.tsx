"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Rocket, Sparkles } from "lucide-react"

interface LoginScreenProps {
  onLogin: (username: string) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      onLogin(username.trim())
    }
  }

  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-md border-primary/30 shadow-2xl shadow-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-24 h-24 animate-float">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="loginShipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="oklch(0.65 0.22 265)" />
                    <stop offset="100%" stopColor="oklch(0.72 0.18 45)" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 10 L60 40 L80 50 L60 60 L50 90 L40 60 L20 50 L40 40 Z"
                  fill="url(#loginShipGradient)"
                  className="drop-shadow-lg"
                />
                <circle cx="50" cy="50" r="8" fill="oklch(0.98 0.01 265)" className="animate-pulse" />
              </svg>
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                StarshipPlan
              </span>
            </CardTitle>
            <CardDescription className="text-base md:text-lg text-muted-foreground">
              星舰计划 - 开启你的太空探险
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                输入你的宇航员名字
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="例如：小明、葫芦、探险家"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 text-base bg-background/50 border-border focus:border-primary"
                required
              />
              <p className="text-xs text-muted-foreground">
                💡 输入"parent"登录家长账号，其他名字登录儿童账号
              </p>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base bg-primary hover:bg-primary/90 font-semibold"
              disabled={!username.trim()}
            >
              <Rocket className="w-5 h-5 mr-2" />
              开始探险
            </Button>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>完成任务，赚取星币，升级你的星舰</span>
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
