# 📱 前端实现文档

> [根目录](../CLAUDE.md) > **前端模块**

## 当前实现概览

StarshipPlan 前端已完成基础架构实现，采用现代化的 Next.js 16 + React 19 技术栈，创建了完整的太空主题习惯管理界面。

## 技术架构

### 核心技术栈
- **框架**: Next.js 16 (App Router)
- **UI 库**: React 19.2.0
- **类型安全**: TypeScript 5.x
- **样式方案**: Tailwind CSS 4 + PostCSS 8
- **组件库**: Radix UI + shadcn/ui
- **图标系统**: Lucide React
- **表单处理**: React Hook Form + Zod 验证
- **动画引擎**: CSS 动画 + Canvas API

### 项目结构
```
frontend/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx           # 主页面
│   ├── layout.tsx         # 根布局
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 基础组件
│   ├── space-background.tsx
│   ├── ship-status.tsx
│   ├── task-list.tsx
│   └── achievement-bar.tsx
├── lib/                  # 工具库
├── hooks/               # 自定义 Hooks
└── package.json
```

## 核心功能实现

### 1. 太空主题背景 (`space-background.tsx`)
- **技术实现**: Canvas API + RequestAnimationFrame
- **功能特性**:
  - 200个动态星星，随机运动轨迹
  - 渐变星空背景，营造深邃太空感
  - 响应式画布，自适应窗口大小
  - 性能优化，包含清理机制

```typescript
// 核心动画逻辑
const animate = () => {
  ctx.fillStyle = "rgba(15, 15, 30, 0.1)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  stars.forEach((star) => {
    star.y += star.speed
    if (star.y > canvas.height) {
      star.y = 0
      star.x = Math.random() * canvas.width
    }
    // 星星闪烁和绘制逻辑...
  })
}
```

### 2. 星舰状态显示 (`ship-status.tsx`)
- **设计理念**: 玻璃拟态 (Glassmorphism) 风格
- **视觉特效**:
  - SVG 星舰图标，渐变配色
  - 浮动动画效果 (`animate-float`)
  - 脉冲能量核心显示
- **信息展示**: 用户等级、星舰名称、状态信息

```typescript
// 星舰浮动动画
<div className="relative w-32 h-32 animate-float">
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="shipGradient">
        <stop offset="0%" stopColor="oklch(0.65 0.22 265)" />
        <stop offset="100%" stopColor="oklch(0.72 0.18 45)" />
      </linearGradient>
    </defs>
    // SVG 路径绘制星舰...
  </svg>
</div>
```

### 3. 任务管理系统 (`task-list.tsx`)
- **数据结构**: 支持每日/每周任务分类
- **交互功能**:
  - 任务完成状态切换
  - 连续打卡天数统计
  - 星币奖励显示
- **UI 组件**: Radix UI Checkbox + 自定义 Badge

```typescript
type Task = {
  id: string
  title: string
  type: "daily" | "weekly"
  starCoins: number
  completed: boolean
  streak?: number  // 连续完成天数
}
```

### 4. 成就进度系统 (`achievement-bar.tsx`)
- **进度追踪**: 等级经验值、任务完成度
- **数据展示**:
  - 总星币数量
  - 本周任务进度
  - 已获得成就数量
- **视觉效果**: 渐变进度条 + 统计卡片

## 设计系统

### 色彩方案
- **主色调**: 蓝色系 (`blue-600`, `cyan-400`)
- **背景色**: 深空主题 (`#0a0a0f`, `#1a1a3e`)
- **强调色**: 紫色 (`purple-500`) 用于成就系统
- **奖励色**: 金黄色 (`yellow-400`, `amber-500`) 用于星币和奖励

### 动画规范
- **时长标准**: 快速 200ms，标准 300ms，慢速 500ms
- **缓动函数**: `ease-in-out` 为主，`ease-out` 用于退出动画
- **动画类型**:
  - `float`: 3秒循环的上下浮动
  - `pulse`: 2秒循环的脉冲效果
  - `transition-colors`: 颜色过渡

### 响应式设计
- **断点设置**:
  - `sm`: 640px (小平板)
  - `md`: 768px (平板)
  - `lg`: 1024px (桌面)
  - `xl`: 1280px (大屏)
- **布局策略**: 移动优先，弹性网格布局

## 开发规范

### 组件设计原则
1. **单一职责**: 每个组件专注一个功能
2. **可复用性**: 通过 props 配置不同状态
3. **类型安全**: 完整的 TypeScript 类型定义
4. **无障碍**: 支持键盘导航和屏幕阅读器

### 状态管理策略
- **本地状态**: 使用 `useState` 管理组件内部状态
- **表单状态**: React Hook Form 处理复杂表单
- **全局状态**: 暂未引入，待后续功能复杂化后考虑 Zustand
- **服务端状态**: 后端集成后考虑 React Query

### 性能优化
- **代码分割**: Next.js 自动路由级别分割
- **图片优化**: Next.js Image 组件
- **Canvas 优化**: 使用 `requestAnimationFrame` 和清理机制
- **CSS 优化**: Tailwind CSS 的 tree-shaking

## 已知限制和后续优化

### 当前限制
1. **静态数据**: 所有数据为硬编码，无后端集成
2. **状态持久化**: 刷新页面后状态重置
3. **用户认证**: 未实现登录系统
4. **数据同步**: 多设备间数据不同步

### 优化计划
1. **短期优化**:
   - 集成后端 API
   - 实现本地存储持久化
   - 添加加载状态和错误处理

2. **中期优化**:
   - 用户认证系统
   - 实时数据同步
   - 移动端 PWA 支持

3. **长期优化**:
   - 性能监控和分析
   - A/B 测试框架
   - 多语言支持

## 测试策略

### 测试覆盖
- [ ] 单元测试: 核心业务逻辑组件
- [ ] 组件测试: UI 交互和状态变化
- [ ] 集成测试: API 调用和数据流
- [ ] E2E 测试: 关键用户流程

### 测试工具
- **框架**: Vitest + React Testing Library
- **Mock**: MSW for API mocking
- **E2E**: Playwright
- **覆盖率**: c8

---

*前端基础架构已完成，下一步将重点进行后端集成和功能扩展。🚀*