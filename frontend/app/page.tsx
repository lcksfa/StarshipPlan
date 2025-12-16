"use client"

import { useState, useEffect } from "react"
import { SpaceBackground } from "@/components/space-background"
import { LoginScreen } from "@/components/login-screen"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")

  useEffect(() => {
    const savedUser = localStorage.getItem("starship_user")
    if (savedUser) {
      setUsername(savedUser)
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogin = (name: string) => {
    setUsername(name)
    setIsLoggedIn(true)
    localStorage.setItem("starship_user", name)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUsername("")
    localStorage.removeItem("starship_user")
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <SpaceBackground />

      {!isLoggedIn ? <LoginScreen onLogin={handleLogin} /> : <Dashboard username={username} onLogout={handleLogout} />}
    </main>
  )
}
