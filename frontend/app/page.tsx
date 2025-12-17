"use client"

import { useState, useEffect } from "react"
import { SpaceBackground } from "@/components/space-background"
import { LoginScreen } from "@/components/login-screen"
import { Dashboard } from "@/components/dashboard"
import { authManager } from "@/lib/auth"
import { useUserStore } from "@/store/userStore"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { setUser, setLoading } = useUserStore()

  useEffect(() => {
    // 初始化认证状态
    const initAuth = async () => {
      setLoading(true)

      if (authManager.isAuthenticated()) {
        const currentUser = authManager.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          setIsLoggedIn(true)
        }
      }

      setLoading(false)
    }

    initAuth()
  }, [setUser, setLoading])

  const handleLogin = async (name: string) => {
    setLoading(true)

    // 简单登录逻辑：根据名字判断用户类型
    const success = await authManager.login(name, "password") // 密码在此简化处理

    if (success) {
      const currentUser = authManager.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        setIsLoggedIn(true)
      }
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    setLoading(true)

    authManager.logout()
    setUser(null)
    setIsLoggedIn(false)

    setLoading(false)
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <SpaceBackground />

      {!isLoggedIn ? <LoginScreen onLogin={handleLogin} /> : <Dashboard username={authManager.getCurrentUser()?.displayName || ""} onLogout={handleLogout} />}
    </main>
  )
}
