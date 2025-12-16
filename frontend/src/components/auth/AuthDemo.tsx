import React, { useState } from 'react'

// 临时内联类型定义，避免模块导入问题
interface User {
  id: string
  username: string
  email: string
  role: 'child' | 'parent'
  profile: {
    displayName: string
    avatar: string
    age: number
    grade?: string
    astronautRank: string
    experience: number
    level: number
  }
  settings: {
    soundEnabled: boolean
    notificationsEnabled: boolean
    theme: 'light' | 'dark'
  }
  createdAt: string
  lastLoginAt: string
}

export const AuthDemo: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('请输入邮箱和密码')
      return
    }

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟登录成功
    const mockUser: User = {
      id: 'demo_001',
      username: email.split('@')[0],
      email,
      role: email.includes('parent') ? 'parent' : 'child',
      profile: {
        displayName: email.includes('parent') ? '指挥官' : '小宇航员',
        avatar: email.includes('parent') ? '👩‍🚀' : '👨‍🚀',
        age: email.includes('parent') ? 35 : 9,
        grade: email.includes('parent') ? undefined : '三年级',
        astronautRank: '实习宇航员',
        experience: 150,
        level: 3,
      },
      settings: {
        soundEnabled: true,
        notificationsEnabled: true,
        theme: 'dark',
      },
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    }

    setUser(mockUser)
  }

  const handleLogout = () => {
    setUser(null)
    setEmail('')
    setPassword('')
    setIsRegistering(false)
  }

  if (user) {
    return (
      <div className='min-h-screen bg-gray-900 text-white p-4'>
        <div className='max-w-2xl mx-auto'>
          <div className='bg-gray-800 rounded-lg border border-gray-700 p-6'>
            <div className='flex items-center justify-between mb-8'>
              <h1 className='text-3xl font-bold text-cyan-400'>
                🚀 太空站主界面
              </h1>
              <button
                onClick={handleLogout}
                className='px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'>
                退出登录
              </button>
            </div>

            <div className='space-y-6'>
              <div className='flex items-center space-x-6 p-6 bg-gray-700 rounded-lg border border-gray-600'>
                <div className='text-6xl'>{user.profile.avatar}</div>
                <div>
                  <h2 className='text-2xl font-bold text-white'>
                    {user.profile.displayName}
                  </h2>
                  <p className='text-gray-300 text-lg mb-2'>
                    {user.profile.astronautRank} • 等级 {user.profile.level}
                  </p>
                  <p className='text-gray-400 text-sm'>
                    {user.email}
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='p-6 bg-gray-700 rounded-lg border border-gray-600 text-center'>
                  <div className='text-4xl mb-4'>⭐</div>
                  <div className='text-3xl font-bold text-cyan-400'>
                    {user.profile.experience}
                  </div>
                  <div className='text-gray-300 text-sm mt-2'>
                    经验值
                  </div>
                </div>
                <div className='p-6 bg-gray-700 rounded-lg border border-gray-600 text-center'>
                  <div className='text-4xl mb-4'>🎖️</div>
                  <div className='text-3xl font-bold text-orange-400'>
                    Lv.{user.profile.level}
                  </div>
                  <div className='text-gray-300 text-sm mt-2'>
                    当前等级
                  </div>
                </div>
                <div className='p-6 bg-gray-700 rounded-lg border border-gray-600 text-center'>
                  <div className='text-4xl mb-4'>👥</div>
                  <div className='text-3xl font-bold text-green-400'>
                    {user.role === 'parent' ? '指挥官' : '宇航员'}
                  </div>
                  <div className='text-gray-300 text-sm mt-2'>
                    用户角色
                  </div>
                </div>
              </div>

              <div className='p-6 bg-green-900/30 border border-green-600/50 rounded-lg'>
                <h3 className='text-green-400 text-lg font-bold mb-3'>
                  ✅ 认证功能演示成功！
                </h3>
                <p className='text-gray-300 text-sm mb-4'>
                  太空主题的认证系统已完成，包含以下核心功能：
                </p>
                <ul className='text-gray-400 text-sm space-y-2 list-disc list-inside'>
                  <li>🔐 用户登录与注册功能</li>
                  <li>👨‍🚀 儿童和家长角色区分</li>
                  <li>📊 用户档案和等级系统</li>
                  <li>🎨 太空主题UI设计</li>
                  <li>✨ 流畅的动画效果</li>
                </ul>
              </div>

              <div className='p-6 bg-blue-900/30 border border-blue-600/50 rounded-lg'>
                <h3 className='text-blue-400 text-lg font-bold mb-3'>
                  🎮 测试说明
                </h3>
                <p className='text-gray-300 text-sm mb-3'>
                  这个演示展示了完整的认证流程。在实际应用中，还将包括：
                </p>
                <div className='text-gray-400 text-sm space-y-2'>
                  <div>• 🚀 更丰富的太空主题界面</div>
                  <div>• 🪐 头像选择和个性化设置</div>
                  <div>• 🎯 分步注册流程</div>
                  <div>• 📱 响应式设计</div>
                  <div>• 🔒 真实的API集成</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-0'>
      <div className='w-full max-w-sm mx-auto'>
        <div className='bg-gray-800/95 rounded-xl border border-gray-700 p-6 m-4'>
          <div className='text-center mb-8'>
            <div className='text-6xl mb-4 animate-bounce'>🚀</div>
            <h1 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2'>
              星舰计划
            </h1>
            <p className='text-gray-400'>
              {isRegistering ? '创建太空身份' : '欢迎回到太空站'}
            </p>
          </div>

          <form onSubmit={handleAuth} className='space-y-6'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                📧 邮箱地址
              </label>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='输入邮箱地址'
                className='w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                🔐 密码
              </label>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='输入密码'
                className='w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all'
              />
            </div>

            {error && (
              <div className='p-4 bg-red-900/30 border border-red-600/50 rounded-lg'>
                <p className='text-red-400 text-sm'>{error}</p>
              </div>
            )}

            <button
              type='submit'
              className='w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg'>
              {isRegistering ? '✨ 创建账号' : '🚀 进入太空站'}
            </button>

            <div className='text-center'>
              <button
                type='button'
                onClick={() => setIsRegistering(!isRegistering)}
                className='text-purple-400 hover:text-purple-300 text-sm transition-colors'>
                {isRegistering ? '已有账号？点击登录' : '没有账号？点击注册'}
              </button>
            </div>
          </form>

          <div className='mt-8 p-4 bg-blue-900/30 border border-blue-600/50 rounded-lg'>
            <p className='text-blue-400 text-sm font-bold mb-2'>
              💡 快速测试
            </p>
            <p className='text-gray-400 text-xs'>
              使用任何邮箱和密码即可体验登录效果，邮箱包含 'parent' 字段将显示家长角色
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}