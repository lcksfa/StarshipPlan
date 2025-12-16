import React, { useState, useEffect, useRef } from 'react'

// 简化的UI组件，兼容Vite环境
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-lg border bg-white/10 backdrop-blur-sm p-6 ${className}`}>
    {children}
  </div>
)

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
)

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-xl font-bold text-blue-400 ${className}`}>
    {children}
  </h2>
)

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
)

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg'
}> = ({ children, onClick, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  return (
    <button
      onClick={onClick}
      className={`bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

const Checkbox: React.FC<{ checked: boolean; onCheckedChange: () => void; className?: string }> = ({ checked, onCheckedChange, className = '' }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onCheckedChange}
    className={`w-4 h-4 text-blue-600 rounded ${className}`}
  />
)

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 ${className}`}>
    {children}
  </span>
)

// 简化的SpaceBackground组件
const SpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = []

    // Create stars
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5,
        opacity: Math.random(),
      })
    }

    let animationFrameId: number

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 15, 30, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star) => {
        star.y += star.speed
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }

        star.opacity += (Math.random() - 0.5) * 0.1
        star.opacity = Math.max(0.3, Math.min(1, star.opacity))

        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ background: 'radial-gradient(ellipse at center, #1a1a3e 0%, #0f0f1e 100%)' }}
    />
  )
}

// ShipStatus组件
const ShipStatus: React.FC = () => {
  const level = 3
  const shipName = "探索者号"

  return (
    <Card className="bg-blue-900/40 backdrop-blur-sm border-blue-500/30 shadow-lg shadow-blue-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-400">
          🚀 我的星舰
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32" style={{ animation: 'float 3s ease-in-out infinite' }}>
            <div
              className="w-full h-full bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg shadow-lg shadow-cyan-500/50"
              style={{
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
              }}
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-2xl font-bold text-cyan-400">{shipName}</p>
          <p className="text-sm text-gray-400">等级 {level} 星舰</p>
        </div>
      </CardContent>
    </Card>
  )
}

// TaskList组件
const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState([
    { id: "1", title: "完成数学作业", type: "daily", starCoins: 10, completed: false, streak: 5 },
    { id: "2", title: "阅读30分钟", type: "daily", starCoins: 15, completed: true, streak: 12 },
    { id: "3", title: "练习钢琴", type: "daily", starCoins: 20, completed: false, streak: 3 },
    { id: "4", title: "整理房间", type: "weekly", starCoins: 50, completed: false },
    { id: "5", title: "户外运动1小时", type: "daily", starCoins: 25, completed: false, streak: 8 },
  ])

  const toggleTask = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const dailyTasks = tasks.filter((t) => t.type === "daily")
  const weeklyTasks = tasks.filter((t) => t.type === "weekly")

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/40 backdrop-blur-sm border-gray-700 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-400">
            📅 每日任务
          </CardTitle>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            ➕ 添加任务
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {dailyTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors group"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                className="bg-blue-600 border-blue-600"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-white"}`}
                >
                  {task.title}
                </p>
                {task.streak && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    ✨ 连续 {task.streak} 天
                  </p>
                )}
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 flex items-center gap-1">
                ✨+{task.starCoins}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-gray-900/40 backdrop-blur-sm border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-400">
            🔄 每周任务
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {weeklyTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors group"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                className="bg-blue-600 border-blue-600"
              />
              <div className="flex-1">
                <p
                  className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-white"}`}
                >
                  {task.title}
                </p>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 flex items-center gap-1">
                ✨+{task.starCoins}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// AchievementBar组件
const AchievementBar: React.FC = () => {
  const stats = {
    totalStars: 1250,
    level: 3,
    currentLevelExp: 150,
    nextLevelExp: 200,
    weeklyProgress: 4,
    weeklyTotal: 7,
    achievements: 12
  }

  const progressPercentage = (stats.currentLevelExp / stats.nextLevelExp) * 100

  return (
    <Card className="bg-purple-900/40 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-400">
          🏆 成就进度
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300">等级进度</span>
            <span className="text-purple-400">Lv.{stats.level}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.currentLevelExp}/{stats.nextLevelExp} 经验值
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-yellow-500/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-400">{stats.totalStars}</div>
            <div className="text-xs text-gray-400">总星币</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">{stats.weeklyProgress}/{stats.weeklyTotal}</div>
            <div className="text-xs text-gray-400">本周任务</div>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">{stats.achievements}</div>
            <div className="text-xs text-gray-400">成就数量</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 添加样式
const style = document.createElement('style')
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
`
document.head.appendChild(style)

// 主页面组件
export default function UserMainPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <SpaceBackground />

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 text-balance">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              StarshipPlan
            </span>
          </h1>
          <p className="text-center text-gray-400 text-lg">星舰计划 - 开启你的太空探险</p>
        </header>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <ShipStatus />
          <div className="md:col-span-2">
            <AchievementBar />
          </div>
        </div>

        <TaskList />
      </div>
    </main>
  )
}