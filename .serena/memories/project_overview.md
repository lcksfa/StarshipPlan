# StarshipPlan 项目概览

## 项目目的
StarshipPlan 是一个专为家庭内部使用的小学生习惯管理系统，采用太空冒险主题的游戏化设计。通过星币积分系统和等级晋升机制，让9岁男孩"葫芦"在完成日常任务的过程中获得成就感，将习惯养成变成一场有趣的星际冒险。

## 技术栈

### 前端技术
- **框架**: Next.js 16 + React 19 + TypeScript
- **样式**: Tailwind CSS 4 + PostCSS 8
- **组件库**: Radix UI + shadcn/ui
- **图标**: Lucide React
- **动画**: Canvas API + CSS动画
- **状态管理**: Zustand
- **数据存储**: IndexedDB + 服务端同步
- **实时通信**: Socket.io Client

### 后端技术
- **运行环境**: Node.js + Express + TypeScript
- **数据库**: Prisma ORM + SQLite
- **实时通信**: Socket.io
- **身份验证**: JWT
- **日志管理**: Winston
- **API**: RESTful API

### 开发工具
- **包管理**: npm + workspaces
- **代码质量**: TypeScript (严格模式)
- **测试框架**: Jest (后端), 集成测试
- **移动端**: Capacitor 跨平台框架

## 项目架构

### 根目录结构
```
StarshipPlan/
├── frontend/          # Next.js 前端应用 (端口 3000)
├── backend/           # Express 后端 API (端口 8000)
├── mobile/            # Capacitor 移动端应用
├── docs/              # 项目文档
├── scripts/           # 自动化脚本
└── .husky/           # Git hooks
```

### 前端模块结构
```
frontend/
├── app/              # Next.js App Router页面
├── components/       # React组件 (ui/, 业务组件)
├── hooks/           # 自定义React Hooks
├── lib/             # 核心库文件 (api, services, storage)
├── store/           # Zustand状态管理
├── types/           # TypeScript类型定义
└── public/          # 静态资源
```

### 后端模块结构
```
backend/
├── src/             # TypeScript源码
├── routes/          # API路由
├── services/        # 业务逻辑层
├── middleware/      # Express中间件
├── prisma/          # 数据库模式和迁移
├── tests/           # 测试文件
└── logs/            # 日志文件
```

## 核心功能
1. **任务管理**: 日常任务创建、完成、统计
2. **积分系统**: 星币获取、等级晋升、成就系统
3. **惩罚机制**: 违规行为记录和相应后果
4. **家庭管理**: 多用户支持、家长权限控制
5. **实时同步**: WebSocket数据推送、多设备同步
6. **离线支持**: IndexedDB本地存储、自动同步

## 设计理念
- **儿童体验优先**: 界面友好，操作简单
- **家长管理便捷**: 配置简单，数据清晰
- **系统稳定可靠**: 本地部署，数据安全
- **性能响应快速**: 移动端体验流畅

## 部署环境
- 家庭本地网络部署
- 支持PWA渐进式Web应用
- Android移动端原生应用