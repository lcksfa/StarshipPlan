# StarshipPlan 编码规范

## 命名约定

### 文件命名
- **组件文件**: kebab-case (如 `ship-status.tsx`, `achievement-bar.tsx`)
- **工具文件**: kebab-case (如 `api-client.ts`, `storage-manager.ts`)
- **类型文件**: kebab-case (如 `user-types.ts`, `task-types.ts`)
- **页面文件**: kebab-case (如 `page.tsx`, `layout.tsx`)

### 代码命名
- **组件名称**: PascalCase (如 `ShipStatus`, `AchievementBar`)
- **变量命名**: camelCase (如 `userName`, `currentLevel`)
- **常量命名**: UPPER_SNAKE_CASE (如 `API_BASE_URL`, `DEFAULT_TIMEOUT`)
- **函数命名**: camelCase (如 `fetchUserData`, `calculatePoints`)
- **接口/类型**: PascalCase (如 `User`, `TaskData`)

## 代码组织

### 组件结构
```typescript
"use client"  // 如需客户端渲染

import { useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Rocket } from "lucide-react"

export function ComponentName() {
  // 1. Hooks (useState, useEffect, custom hooks)
  // 2. 计算值
  // 3. 事件处理函数
  // 4. 渲染逻辑

  return (
    <Card className="...">
      {/* JSX内容 */}
    </Card>
  )
}
```

### 服务层结构
```typescript
// 导入依赖
import { prisma } from '../lib/database'
import { logger } from '../utils/logger'

// 服务函数
export async function functionName() {
  try {
    // 业务逻辑
  } catch (error) {
    logger.error('操作失败:', error)
    throw error
  }
}
```

## TypeScript 规范

### 类型定义
- 优先使用 `interface` 而非 `type` (除非需要联合类型)
- 使用严格的类型检查，避免 `any`
- 为所有函数参数和返回值添加类型注解

### 示例
```typescript
interface User {
  id: string
  username: string
  displayName: string
  createdAt: Date
}

interface TaskService {
  createTask: (data: CreateTaskData) => Promise<Task>
  updateTask: (id: string, data: UpdateTaskData) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
}
```

## 样式规范

### Tailwind CSS 类名
- 使用响应式断点: `sm:`, `md:`, `lg:`, `xl:`
- 状态变体: `hover:`, `focus:`, `disabled:`
- 主题颜色: `primary`, `secondary`, `accent`

### 组件样式模式
```typescript
<Card className="bg-card/80 backdrop-blur-sm border-primary/30 shadow-lg shadow-primary/20">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-primary">
      <Icon className="w-4 h-4" />
      标题
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* 内容 */}
  </CardContent>
</Card>
```

## 导入规范

### 导入顺序
1. React 相关导入
2. 第三方库导入
3. 内部组件导入 (@/components)
4. 工具函数导入 (@/lib, @/utils)
5. 类型导入 (@/types)
6. 相对路径导入

### 示例
```typescript
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Rocket } from "lucide-react"
import { useUserStore } from "@/store/userStore"
import { UserTask } from "@/types/task-types"
import { apiClient } from "../lib/api"
```

## 错误处理

### 组件错误处理
```typescript
export function ComponentName() {
  const [error, setError] = useState<string | null>(null)

  const handleAction = async () => {
    try {
      // 执行操作
    } catch (error) {
      setError(error instanceof Error ? error.message : '操作失败')
    }
  }

  if (error) {
    return <div className="text-destructive">错误: {error}</div>
  }

  // 正常渲染
}
```

### 服务层错误处理
```typescript
export async function serviceFunction() {
  try {
    // 业务逻辑
    return result
  } catch (error) {
    logger.error('服务操作失败:', error)
    throw new Error(`服务操作失败: ${error.message}`)
  }
}
```

## 状态管理 (Zustand)

### Store 结构
```typescript
interface UserStore {
  // 状态
  currentUser: User | null
  isLoading: boolean
  
  // 计算属性
  isAdmin: boolean
  
  // 操作
  setCurrentUser: (user: User | null) => void
  fetchUser: (id: string) => Promise<void>
}

export const useUserStore = create<UserStore>((set, get) => ({
  // 状态初始化
  currentUser: null,
  isLoading: false,
  
  // 计算属性
  get isAdmin() {
    return get().currentUser?.role === 'admin'
  },
  
  // 操作实现
  setCurrentUser: (user) => set({ currentUser: user }),
  
  fetchUser: async (id) => {
    set({ isLoading: true })
    try {
      const user = await apiClient.get(`/users/${id}`)
      set({ currentUser: user })
    } finally {
      set({ isLoading: false })
    }
  }
}))
```

## API 客户端规范

### 统一API调用
```typescript
import { apiClient } from '@/lib/api'

export const userService = {
  getAll: () => apiClient.get<User[]>('/users'),
  getById: (id: string) => apiClient.get<User>(`/users/${id}`),
  create: (data: CreateUser) => apiClient.post<User>('/users', data),
  update: (id: string, data: UpdateUser) => apiClient.put<User>(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`)
}
```

## 注释规范

### JSDoc 注释
```typescript
/**
 * 计算用户等级和积分
 * @param points 用户当前积分
 * @param userId 用户ID
 * @returns 包含等级和头衔的对象
 * @throws {Error} 当用户不存在时抛出错误
 */
export async function calculateUserLevel(points: number, userId: string): Promise<UserLevel> {
  // 实现
}
```

### 组件注释
```typescript
/**
 * 星舰状态组件
 * 显示当前用户的星舰信息，包括等级、积分和头衔
 */
export function ShipStatus() {
  // 实现
}
```