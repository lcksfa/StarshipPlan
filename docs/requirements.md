# 📋 技术需求文档

> [根目录](../CLAUDE.md) > **技术需求**

## 项目概述

StarshipPlan 是一个专为家庭内部使用的小学生习惯管理系统，采用太空冒险主题的游戏化设计，让9岁男孩"葫芦"在完成日常任务的过程中获得成就感。

## 当前实现状态

### ✅ 已完成功能

#### 前端界面 (100% 完成)
- **太空主题背景**: Canvas 动态星空效果
- **星舰状态展示**: 等级、名称、动画效果
- **任务管理系统**: 每日/每周任务分类，支持完成状态切换
- **成就进度系统**: 等级经验值、统计数据展示
- **响应式设计**: 适配桌面和移动设备

#### 技术架构 (100% 完成)
- **前端框架**: Next.js 16 + React 19 + TypeScript
- **UI 组件库**: Radix UI + shadcn/ui + Tailwind CSS 4
- **动画系统**: CSS 动画 + Canvas API
- **开发环境**: 热重载开发服务器，端口 3000

### 🔄 进行中功能

#### 后端开发 (0% 完成)
- **API 设计**: RESTful 接口规范待定义
- **数据库设计**: 用户、任务、成就数据模型待设计
- **身份认证**: 用户登录注册系统待实现
- **实时同步**: Socket.io 实时通信待集成

#### 移动端支持 (0% 完成)
- **PWA 配置**: 渐进式 Web 应用配置
- **移动端优化**: 触摸交互和移动端适配
- **Capacitor 集成**: 原生应用打包

### 📅 待开发功能

#### 高优先级
1. **后端 API 集成**
   - 用户数据持久化
   - 任务数据管理
   - 进度数据同步

2. **用户认证系统**
   - 家长账户管理
   - 儿童模式切换
   - 安全登录机制

3. **数据持久化**
   - 本地存储备份
   - 云端数据同步
   - 离线功能支持

#### 中优先级
4. **高级游戏功能**
   - 星际探索地图
   - 怪物战斗系统
   - 装备收集系统
   - 成就徽章系统

5. **家长管理功能**
   - 任务自定义
   - 奖励规则设置
   - 进度报告查看
   - 时间限制控制

#### 低优先级
6. **社交功能**
   - 家庭成员互动
   - 好友系统
   - 排行榜功能

7. **个性化定制**
   - 主题皮肤切换
   - 星舰自定义
   - 音效系统

## 技术规范

### 代码质量要求
- **TypeScript 覆盖率**: 100%
- **ESLint 规则**: 严格模式，0 warnings
- **测试覆盖率**: 核心功能 80%+
- **性能指标**: 首屏加载 < 2s，交互响应 < 100ms

### 兼容性要求
- **浏览器支持**: Chrome 90+, Safari 14+, Firefox 88+
- **设备支持**: iOS 14+, Android 8+
- **屏幕适配**: 320px - 1920px 宽度
- **网络环境**: 支持 2G 网络，离线可用

### 安全性要求
- **数据加密**: HTTPS 传输，本地数据加密
- **隐私保护**: 符合儿童隐私保护法规
- **访问控制**: 家庭账户权限管理
- **内容安全**: 无广告，无外链，适龄内容

## 部署架构

### 开发环境
```bash
# 前端开发
cd frontend && npm run dev  # http://localhost:3000

# 后端开发 (待实现)
cd backend && npm run dev   # http://localhost:8000
```

### 生产环境
- **部署方式**: Docker 容器化部署
- **服务器要求**: 家庭 NAS 或云服务器
- **数据库**: SQLite (单机) 或 PostgreSQL (多用户)
- **反向代理**: Nginx + SSL 证书
- **监控告警**: 系统状态监控和日志收集

## 数据模型设计

### 用户数据模型
```typescript
interface User {
  id: string
  username: string
  avatar?: string
  level: number
  experience: number
  starCoins: number
  parentId: string
  createdAt: Date
  updatedAt: Date
}
```

### 任务数据模型
```typescript
interface Task {
  id: string
  userId: string
  title: string
  description?: string
  type: 'daily' | 'weekly' | 'custom'
  starCoins: number
  isActive: boolean
  createdBy: 'parent' | 'system'
  createdAt: Date
  updatedAt: Date
}
```

### 任务记录模型
```typescript
interface TaskRecord {
  id: string
  userId: string
  taskId: string
  completedAt: Date
  starCoinsEarned: number
  streak?: number
}
```

### 成就数据模型
```typescript
interface Achievement {
  id: string
  userId: string
  type: 'level' | 'streak' | 'total' | 'special'
  title: string
  description: string
  icon: string
  unlockedAt: Date
}
```

## API 接口规范

### 用户认证
```
POST /api/auth/login     # 用户登录
POST /api/auth/logout    # 用户登出
GET  /api/auth/profile   # 获取用户信息
PUT  /api/auth/profile   # 更新用户信息
```

### 任务管理
```
GET    /api/tasks        # 获取任务列表
POST   /api/tasks        # 创建新任务
PUT    /api/tasks/:id    # 更新任务
DELETE /api/tasks/:id    # 删除任务
POST   /api/tasks/:id/complete  # 完成任务
```

### 数据统计
```
GET /api/stats/overview  # 总体统计
GET /api/stats/progress  # 进度数据
GET /api/stats/history   # 历史记录
```

## 性能优化策略

### 前端优化
- **代码分割**: 路由级别懒加载
- **图片优化**: WebP 格式，响应式图片
- **缓存策略**: Service Worker 离线缓存
- **Bundle 优化**: Tree shaking，压缩优化

### 后端优化
- **数据库索引**: 关键字段索引优化
- **查询优化**: 避免 N+1 查询问题
- **缓存机制**: Redis 热数据缓存
- **连接池**: 数据库连接池管理

### 移动端优化
- **触摸优化**: 避免误触，响应迅速
- **电池优化**: 降低 CPU 和 GPU 使用
- **网络优化**: 数据压缩，离线支持
- **存储优化**: 本地缓存管理

## 测试策略

### 测试类型
1. **单元测试**: 业务逻辑函数测试
2. **集成测试**: API 接口测试
3. **组件测试**: React 组件交互测试
4. **E2E 测试**: 关键用户流程测试

### 测试工具
- **前端**: Vitest + React Testing Library
- **后端**: Jest + Supertest
- **E2E**: Playwright
- **性能**: Lighthouse CI

### 测试覆盖率目标
- **核心业务逻辑**: 90%+
- **UI 组件**: 80%+
- **API 接口**: 100%
- **E2E 流程**: 主要流程 100%

## 项目里程碑

### 第一阶段 - MVP (当前)
- ✅ 基础 UI 界面
- ✅ 前端架构搭建
- 🔄 后端 API 开发
- 🔄 基础数据持久化

### 第二阶段 - 核心功能
- 📋 用户认证系统
- 📋 任务管理功能
- 📋 进度统计功能
- 📋 移动端适配

### 第三阶段 - 增强功能
- 📋 高级游戏功能
- 📋 家长管理系统
- 📋 数据分析报告
- 📋 性能优化

### 第四阶段 - 完善功能
- 📋 社交互动功能
- 📋 个性化定制
- 📋 多语言支持
- 📋 高级数据分析

---

*文档最后更新：2025-12-16*