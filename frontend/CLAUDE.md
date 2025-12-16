[根目录](../../CLAUDE.md) > [frontend](../) > **frontend**

# 🎮 Frontend 模块

> React + TypeScript + Vite 构建的游戏化前端界面

## 模块职责

负责提供太空冒险主题的用户界面，包括：
- 🚀 游戏化任务界面和宇航员角色系统
- 💫 星币积分展示和等级晋升动画
- 🎯 孩子端和家長端的双重视角
- 📱 响应式设计，支持移动端和桌面端
- ⚡ 流畅的动画效果和实时数据更新

## 入口与启动

### 主要入口文件
- **应用入口**: `src/main.tsx` - React 应用根节点渲染
- **根组件**: `src/App.tsx` - 目前为 Vite 默认模板，待开发
- **HTML 模板**: `index.html` - SPA 容器页面

### 启动命令
```bash
npm run dev      # 开发服务器 (端口 5173)
npm run build    # 生产构建
npm run preview  # 预览构建结果
```

### 关键配置
- **Vite 配置**: `vite.config.ts` - React 插件配置
- **TypeScript**: `tsconfig.json` - 严格模式和路径配置
- **Tailwind CSS**: `tailwind.config.js` - 样式框架配置
- **ESLint**: `eslint.config.js` - 代码规范检查

## 对外接口

### React Router 路由规划
```typescript
// 待实现的路由结构
/                    # 首页/登录
/dashboard           # 用户仪表盘
/tasks              # 任务管理页面
/rewards            # 奖励兑换页面
/profile            # 个人档案页面
/parent             # 家长管理页面
/settings           # 系统设置页面
```

### API 接口对接
- **基础 URL**: `http://localhost:8000/api`
- **认证接口**: `/auth/*` - 用户登录注册
- **任务接口**: `/tasks/*` - 任务管理 CRUD
- **积分接口**: `/coins/*` - 星币积分操作
- **用户接口**: `/users/*` - 用户信息管理

### Socket.io 实时通信
- **连接地址**: `ws://localhost:8000`
- **事件监听**: 任务完成通知、积分更新、等级晋升
- **房间管理**: 用户房间、家庭房间

## 关键依赖与配置

### 核心依赖包
```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",    // 表单验证
    "framer-motion": "^12.23.26",       // 动画库
    "react": "^19.2.0",                 // UI 框架
    "react-dom": "^19.2.0",             // DOM 渲染
    "react-hook-form": "^7.68.0",       // 表单管理
    "react-router-dom": "^7.10.1",      // 路由管理
    "zustand": "^5.0.9"                 // 状态管理
  }
}
```

### 开发依赖包
```json
{
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",   // Vite React 插件
    "autoprefixer": "^10.4.23",        // CSS 前缀
    "eslint": "^9.39.1",               // 代码检查
    "tailwindcss": "^4.1.18",          // CSS 框架
    "typescript": "~5.9.3"             // TypeScript
  }
}
```

### 环境变量配置
```env
# .env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
VITE_APP_NAME=StarshipPlan
VITE_APP_VERSION=1.0.0
```

## 数据模型

### 用户状态管理 (Zustand)
```typescript
interface UserStore {
  user: User | null
  isAuthenticated: boolean
  coins: number
  level: UserLevel
  tasks: Task[]
  login: (credentials: LoginData) => Promise<void>
  logout: () => void
  updateProfile: (data: UserProfile) => Promise<void>
}
```

### 任务状态管理
```typescript
interface TaskStore {
  dailyTasks: Task[]
  weeklyTasks: Task[]
  completedTasks: CompletedTask[]
  completeTask: (taskId: string) => Promise<void>
  getTaskHistory: (period: TimePeriod) => TaskHistory[]
}
```

### 游戏化状态管理
```typescript
interface GameStore {
  astronaut: AstronautProfile
  achievements: Achievement[]
  notifications: Notification[]
  levelProgress: LevelProgress
  unlockReward: (rewardId: string) => Promise<void>
}
```

## 测试与质量

### 测试框架配置
```typescript
// vitest.config.ts (待创建)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
})
```

### 测试覆盖计划
- **组件测试**: React 组件渲染和交互
- **Hook 测试**: Zustand store 和自定义 hooks
- **路由测试**: React Router 导航逻辑
- **API 测试**: 接口调用和错误处理
- **动画测试**: Framer Motion 动画效果

### 质量工具配置
- **ESLint 规则**: React + TypeScript 最佳实践
- **TypeScript**: 严格模式和类型检查
- **Prettier**: 代码格式化 (待配置)
- **Husky**: Git hooks (待配置)

## 关键文件清单

### 核心业务文件
```
src/
├── App.tsx                    # 应用根组件 (待重构)
├── main.tsx                   # 应用入口
├── components/                # 可复用组件 (待创建)
├── pages/                     # 页面组件 (待创建)
├── hooks/                     # 自定义 hooks (待创建)
├── stores/                    # Zustand 状态管理 (待创建)
├── types/                     # TypeScript 类型定义 (待创建)
├── utils/                     # 工具函数 (待创建)
├── assets/                    # 静态资源
├── styles/                    # 全局样式 (待创建)
└── test/                      # 测试文件 (待创建)
```

### 配置文件
```
├── vite.config.ts            # Vite 构建配置
├── tsconfig.json             # TypeScript 配置
├── tsconfig.app.json         # 应用 TS 配置
├── tsconfig.node.json        # Node.js TS 配置
├── tailwind.config.js        # Tailwind CSS 配置
├── postcss.config.js         # PostCSS 配置
├── eslint.config.js          # ESLint 配置
├── package.json              # 项目依赖
├── index.html                # HTML 模板
└── package-lock.json         # 依赖锁定文件
```

## 常见问题 (FAQ)

### Q: 如何添加新的游戏化动画？
A: 使用 Framer Motion 组件，在 `components/animations/` 目录下创建可复用动画组件。

### Q: 状态管理为什么选择 Zustand？
A: Zustand 轻量简单，适合中小型项目，API 简洁，学习成本低。

### Q: 如何处理实时数据更新？
A: 通过 Socket.io 客户端连接后端，在 Zustand store 中集成 Socket 事件监听。

### Q: 移动端适配如何实现？
A: 使用 Tailwind CSS 响应式设计，针对移动端优化交互体验。

## 下一步开发重点

1. **重构 App.tsx**: 替换默认模板，实现真实的应用路由
2. **创建组件库**: 开发太空主题的 UI 组件
3. **实现状态管理**: 设置用户、任务、游戏化状态
4. **集成 API**: 实现与后端的数据交互
5. **添加动画**: 使用 Framer Motion 实现游戏化效果
6. **移动端优化**: 适配触摸交互和移动端界面

## 变更记录 (Changelog)

**2025-12-16 19:12:06** - 初始化前端模块文档
- 分析当前 Vite + React + TypeScript 架构
- 识别 Tailwind CSS、Framer Motion、Zustand 等关键依赖
- 规划组件结构和状态管理方案
- 制定开发重点和测试策略
- 当前状态：基础架构已就绪，待业务功能开发

---

*为孩子创造一个充满乐趣的太空冒险世界！🚀*