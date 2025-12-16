/**
 * 认证相关的Mock数据
 */

export interface User {
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

export interface AuthResponse {
  success: boolean
  user: User | null
  token: string | null
  message: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
  role: 'child' | 'parent'
  childProfile?: {
    displayName: string
    age: number
    grade: string
    favoriteColor: string
  }
}

// Mock用户数据库
export const mockUsers: User[] = [
  {
    id: 'user_001',
    username: 'spacekid',
    email: 'kid@space.com',
    role: 'child',
    profile: {
      displayName: '星际小勇士',
      avatar: '👨‍🚀',
      age: 9,
      grade: '三年级',
      astronautRank: '实习宇航员',
      experience: 150,
      level: 3,
    },
    settings: {
      soundEnabled: true,
      notificationsEnabled: true,
      theme: 'dark',
    },
    createdAt: '2024-01-15T10:00:00Z',
    lastLoginAt: '2024-12-16T09:30:00Z',
  },
  {
    id: 'user_002',
    username: 'parent01',
    email: 'parent@space.com',
    role: 'parent',
    profile: {
      displayName: '指挥中心',
      avatar: '👩‍🚀',
      age: 35,
      astronautRank: '任务指挥官',
      experience: 500,
      level: 8,
    },
    settings: {
      soundEnabled: true,
      notificationsEnabled: true,
      theme: 'light',
    },
    createdAt: '2024-01-10T08:00:00Z',
    lastLoginAt: '2024-12-16T08:15:00Z',
  },
  {
    id: 'user_003',
    username: 'rocketboy',
    email: 'rocket@space.com',
    role: 'child',
    profile: {
      displayName: '火箭小子',
      avatar: '🚀',
      age: 8,
      grade: '二年级',
      astronautRank: '见习宇航员',
      experience: 80,
      level: 2,
    },
    settings: {
      soundEnabled: false,
      notificationsEnabled: true,
      theme: 'dark',
    },
    createdAt: '2024-02-20T14:30:00Z',
    lastLoginAt: '2024-12-15T19:45:00Z',
  },
]

// 宇航员等级系统
export const astronautRanks = [
  { name: '见习宇航员', minLevel: 1, icon: '🛸', color: '#4CAF50' },
  { name: '实习宇航员', minLevel: 2, icon: '🌟', color: '#8BC34A' },
  { name: '初级宇航员', minLevel: 3, icon: '⭐', color: '#FFC107' },
  { name: '中级宇航员', minLevel: 5, icon: '🌠', color: '#FF9800' },
  { name: '高级宇航员', minLevel: 8, icon: '💫', color: '#2196F3' },
  { name: '资深宇航员', minLevel: 12, icon: '🌌', color: '#9C27B0' },
  { name: '任务指挥官', minLevel: 15, icon: '🌟', color: '#F44336' },
  { name: '星际舰长', minLevel: 20, icon: '🚀', color: '#795548' },
]

// 头像选项
export const avatarOptions = [
  '👨‍🚀', '👩‍🚀', '🧑‍🚀', '👶', '👧', '👦', '🚀', '🛸', '🌟', '⭐',
  '🌠', '💫', '🌌', '🪐', '🌍', '🌎', '🌏', '🛰️', '🌑', '🌒',
  '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '☄️', '🔥', '⚡',
]

// 认证相关的模拟API
export const mockAuthAPI = {
  // 登录
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500))

    const user = mockUsers.find(u => u.email === credentials.email)

    if (!user) {
      return {
        success: false,
        user: null,
        token: null,
        message: '🔍 未找到该邮箱地址，请检查输入或注册新账户'
      }
    }

    // 在实际应用中这里会验证密码哈希
    // 模拟密码验证
    const validPasswords = ['password123', 'space123', '123456']
    if (!validPasswords.includes(credentials.password)) {
      return {
        success: false,
        user: null,
        token: null,
        message: '🔐 密码错误，请重新输入'
      }
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date().toISOString()

    return {
      success: true,
      user,
      token: `mock_token_${user.id}_${Date.now()}`,
      message: '🚀 登录成功！准备进入太空站'
    }
  },

  // 注册
  async register(data: RegisterData): Promise<AuthResponse> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 检查邮箱是否已存在
    if (mockUsers.some(u => u.email === data.email)) {
      return {
        success: false,
        user: null,
        token: null,
        message: '⚠️ 该邮箱已被注册，请使用其他邮箱或直接登录'
      }
    }

    // 检查用户名是否已存在
    if (mockUsers.some(u => u.username === data.username)) {
      return {
        success: false,
        user: null,
        token: null,
        message: '🎯 该用户名已被使用，请选择其他用户名'
      }
    }

    // 创建新用户
    const newUser: User = {
      id: `user_${String(mockUsers.length + 1).padStart(3, '0')}`,
      username: data.username,
      email: data.email,
      role: data.role,
      profile: {
        displayName: data.role === 'child'
          ? data.childProfile!.displayName
          : data.username,
        avatar: data.role === 'child' ? '👨‍🚀' : '👩‍🚀',
        age: data.role === 'child' ? data.childProfile!.age : 30,
        grade: data.role === 'child' ? data.childProfile!.grade : undefined,
        astronautRank: '见习宇航员',
        experience: 0,
        level: 1,
      },
      settings: {
        soundEnabled: true,
        notificationsEnabled: true,
        theme: 'dark',
      },
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    }

    mockUsers.push(newUser)

    return {
      success: true,
      user: newUser,
      token: `mock_token_${newUser.id}_${Date.now()}`,
      message: data.role === 'child'
        ? '🎉 欢迎加入太空计划，小宇航员！'
        : '👋 家长账户创建成功！'
    }
  },

  // 验证Token
  async verifyToken(token: string): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!token || !token.startsWith('mock_token_')) {
      return {
        success: false,
        user: null,
        token: null,
        message: '🔒 无效的访问令牌'
      }
    }

    const userId = token.split('_')[2]
    const user = mockUsers.find(u => u.id === userId)

    if (!user) {
      return {
        success: false,
        user: null,
        token: null,
        message: '🔍 用户不存在'
      }
    }

    return {
      success: true,
      user,
      token,
      message: '✅ 令牌验证成功'
    }
  },

  // 登出
  async logout(): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      success: true,
      message: '👋 安全登出，期待下次太空之旅！'
    }
  },
}