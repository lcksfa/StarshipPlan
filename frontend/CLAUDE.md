# 🚀 StarshipPlan Frontend

> [根目录](../CLAUDE.md) > **Frontend Module**

## 模块概述

StarshipPlan前端采用Next.js 16 + React 19 + TypeScript架构，提供现代化的太空主题用户界面和完整的实时数据同步功能。

## 技术架构

### 核心技术栈
- **框架**: Next.js 16 + React 19 + TypeScript
- **样式**: Tailwind CSS 4 + PostCSS 8
- **组件库**: Radix UI + shadcn/ui
- **图标**: Lucide React
- **动画**: Canvas API + CSS动画 + Framer Motion
- **状态管理**: Zustand
- **数据存储**: IndexedDB + 服务端同步
- **实时通信**: Socket.io Client

### 项目结构
```
frontend/
├── app/                    # Next.js App Router页面
├── components/              # React组件
│   ├── ui/                 # shadcn/ui基础组件
│   ├── app-provider.tsx   # 应用初始化组件
│   └── sync-status.tsx     # 同步状态组件
├── hooks/                  # 自定义React Hooks
│   ├── useApi.ts          # API调用hooks
│   └── useSync.ts         # 数据同步hooks
├── lib/                    # 核心库文件
│   ├── api.ts             # API客户端
│   ├── services/          # 服务层
│   └── storage/           # 本地存储系统
├── store/                  # Zustand状态管理
├── types/                  # TypeScript类型定义
└── public/                 # 静态资源
```

## 核心功能模块

### 1. API客户端系统 (`lib/api.ts`)
统一的HTTP客户端，支持：
- 自动错误处理和重试机制
- JWT认证管理
- 请求/响应拦截器
- 超时控制

### 2. 服务层架构 (`lib/services/`)
- **任务服务**: CRUD操作、统计分析
- **积分服务**: 积分管理、等级系统、排行榜
- **惩罚服务**: 规则管理、记录处理
- **同步服务**: 实时数据同步、冲突解决

### 3. 状态管理系统 (`store/`)
基于Zustand的状态管理：
- **userStore**: 用户状态和家庭关系
- **taskStore**: 任务数据和操作
- **pointsStore**: 积分和等级状态
- **syncStore**: 同步状态和冲突管理

### 4. 数据存储系统 (`lib/storage/`)
- **IndexedDB**: 本地数据持久化
- **SyncManager**: 实时同步逻辑
- **OfflineManager**: 离线操作管理

### 5. React Hooks (`hooks/`)
- **useApi**: 统一的API调用接口
- **useSync**: 数据同步和状态管理

## 用户界面设计

### 太空主题设计
- Canvas动态背景
- 星舰和星球元素
- 流畅的动画效果
- 响应式设计

### 核心组件
- **AppProvider**: 应用初始化和全局状态
- **SyncStatus**: 实时同步状态显示
- **shadcn/ui组件**: 现代化UI组件库

## 实时功能

### WebSocket集成
- 实时数据推送
- 多用户同步
- 家庭数据共享
- 冲突检测和解决

### 离线支持
- IndexedDB本地缓存
- 离线操作队列
- 自动数据同步
- 断网重连机制

## 开发指南

### 启动开发服务器
```bash
cd frontend
npm install
npm run dev
```

### 构建生产版本
```bash
npm run build
npm start
```

### 代码规范
- 使用TypeScript严格模式
- 遵循React最佳实践
- 组件采用函数式写法
- 自定义Hooks复用逻辑

### 样式规范
- Tailwind CSS utility类
- shadcn/ui组件变体
- 响应式设计
- 暗色主题支持

## 测试策略

### 集成测试计划
详细的测试文档位于 `frontend/INTEGRATION_TEST_PLAN.md`

### 测试覆盖
- API集成测试
- WebSocket实时同步测试
- 离线功能测试
- 组件单元测试

## 性能优化

### 代码分割
- Next.js自动代码分割
- 按需加载组件
- 动态导入优化

### 数据优化
- 智能缓存策略
- 数据懒加载
- 批量操作优化

### 渲染优化
- React.memo优化
- useMemo/useCallback合理使用
- 虚拟化长列表

## 部署说明

### 环境变量
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

### 构建配置
- Next.js配置优化
- TypeScript严格模式
- PWA支持配置

## 维护指南

### 依赖管理
- 定期更新依赖包
- 安全漏洞检查
- 性能影响评估

### 监控和日志
- 错误边界处理
- 性能监控集成
- 用户行为分析

---

**当前状态**: ✅ 核心功能完成，集成测试通过

**下一步**: 移动端适配和生产部署优化