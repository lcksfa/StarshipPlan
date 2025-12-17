[根目录](../../CLAUDE.md) > [backend](../) > **backend**

# 🛸 Backend 模块

> Node.js + Express + TypeScript 构建的 RESTful API 服务

## 模块职责

负责提供稳定高效的后端服务，包括：
- 🔐 用户认证和权限管理
- 📝 任务管理和进度跟踪
- 💰 星币积分系统逻辑
- 📊 数据统计和报告生成
- ⚡ Socket.io 实时通信服务
- 🗄️ SQLite 数据持久化存储

## 入口与启动

### 主要入口文件
- **服务入口**: `src/server.ts` - Express 服务器配置和启动
- **简化版本**: `src/server-simple.ts` - 基础服务器配置
- **编译输出**: `dist/server.js` - TypeScript 编译后的生产文件

### 启动命令
```bash
npm run dev        # 开发模式 (ts-node 热重载)
npm run build      # TypeScript 编译
npm start          # 生产模式启动 (端口 8000)
```

### 环境配置
```bash
# .env (待创建)
PORT=8000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
JWT_SECRET=your-secret-key
DATABASE_URL="file:./dev.db"
```

## 对外接口

### RESTful API 路由结构
```typescript
// 任务管理 ✅
GET    /api/tasks                # 获取任务列表
POST   /api/tasks                # 创建新任务
PUT    /api/tasks/:id            # 更新任务
DELETE /api/tasks/:id            # 删除任务
POST   /api/tasks/:id/complete   # 完成任务

// 积分系统 ✅
GET    /api/points               # 获取积分信息
GET    /api/points/transactions  # 获取交易记录
GET    /api/points/levels        # 获取等级历史
GET    /api/points/leaderboard   # 获取排行榜
POST   /api/points/transaction   # 创建积分交易

// 惩罚系统 ✅
GET    /api/punishments          # 获取惩罚记录
POST   /api/punishments          # 创建惩罚记录
PUT    /api/punishments/:id/status # 更新惩罚状态
GET    /api/punishments/rules    # 获取惩罚规则
POST   /api/punishments/rules    # 创建惩罚规则
PUT    /api/punishments/rules/:id # 更新惩罚规则
DELETE /api/punishments/rules/:id # 删除惩罚规则
GET    /api/punishments/stats    # 获取惩罚统计

// 同步系统 ✅
GET    /api/sync/stats           # 获取同步统计
POST   /api/sync/trigger         # 手动触发同步
GET    /api/sync/logs            # 获取同步日志
DELETE /api/sync/logs/cleanup    # 清理同步日志
POST   /api/sync/resolve-conflict # 解决冲突
GET    /api/sync/devices         # 获取设备列表
POST   /api/sync/devices/disconnect # 断开设备

// 系统相关
GET    /health                   # 健康检查
GET    /api                      # API 信息
```

### Socket.io 实时事件 ✅
```typescript
// 连接和认证
connection           # 客户端连接
disconnect          # 客户端断开
connected          # 认证成功
authentication_error # 认证失败

// 同步事件
sync:pull            # 拉取数据请求
sync:pull-response   # 拉取数据响应
sync:push            # 推送数据变更
sync:push-ack        # 推送确认
sync:update          # 实时数据更新
sync:offline-complete # 离线数据同步完成
sync:conflict-resolved # 冲突解决完成
sync:error           # 同步错误

// 房间管理
join-room          # 加入房间
leave-room         # 离开房间

// 数据变更事件
task-created       # 任务创建
task-updated       # 任务更新
task-completed     # 任务完成
points-updated     # 积分更新
level-up           # 等级提升
punishment-created  # 惩罚创建
```

## 关键依赖与配置

### 核心依赖包
```json
{
  "dependencies": {
    "@prisma/client": "^5.7.1",    // Prisma ORM 客户端
    "express": "^4.18.2",          // Web 框架
    "cors": "^2.8.5",              // 跨域处理
    "helmet": "^7.1.0",            // 安全中间件
    "compression": "^1.7.4",       // 压缩中间件
    "bcryptjs": "^2.4.3",          // 密码加密
    "jsonwebtoken": "^9.0.2",      // JWT 认证
    "socket.io": "^4.7.4",         // 实时通信
    "winston": "^3.11.0",          // 日志管理
    "express-validator": "^7.0.1", // 请求验证
    "multer": "^1.4.5-lts.1",     // 文件上传
    "dotenv": "^16.3.1"            // 环境变量
  }
}
```

### 开发依赖包
```json
{
  "devDependencies": {
    "@types/express": "^4.17.21",   // Express 类型
    "@types/node": "^20.10.5",     // Node.js 类型
    "ts-node": "^10.9.2",          // TypeScript 运行时
    "typescript": "^5.3.3",        // TypeScript 编译器
    "prisma": "^5.7.1"             // Prisma CLI
  }
}
```

### 中间件配置
```typescript
// 安全中间件
helmet()                    // 安全头部
compression()               // 响应压缩
cors({                     // 跨域配置
  origin: ['http://localhost:3000'],
  credentials: true
})

// 请求解析
express.json({ limit: '10mb' })
express.urlencoded({ extended: true })

// 日志记录
winston.createLogger()     // 结构化日志
```

## 数据模型

### Prisma Schema ✅
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(cuid())
  username    String   @unique
  email       String   @unique
  password    String
  role        Role     @default(CHILD)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 游戏化字段
  coins       Int      @default(0)
  level       Level    @default(CIVILIAN)
  avatar      String?

  // 关联关系
  tasks       Task[]
  coinHistory CoinHistory[]
  rewards     Reward[]

  @@map("users")
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  coins       Int
  type        TaskType
  isRecurring Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关联关系
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  completions Completion[]

  @@map("tasks")
}

model Completion {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  completedAt DateTime @default(now())

  @@unique([taskId, completedAt])
  @@map("completions")
}

enum Role {
  PARENT
  CHILD
}

enum Level {
  CIVILIAN    // 平民
  BRONZE      // 青铜
  SILVER      // 白银
  GOLD        // 黄金
  DIAMOND     // 钻石
  KING        // 王者
}

enum TaskType {
  DAILY       // 每日任务
  WEEKLY      // 每周任务
  CHALLENGE   // 挑战任务
}
```

### 数据库操作
```typescript
// Prisma Client 配置
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
})

// 常用查询示例
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    tasks: true,
    coinHistory: true
  }
})
```

## 测试与质量

### 测试框架配置 (待实现)
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts']
}
```

### 测试覆盖计划
- **单元测试**: 业务逻辑函数、工具类
- **集成测试**: API 接口、数据库操作
- **Socket 测试**: 实时通信功能
- **中间件测试**: 认证、验证、错误处理

### 质量工具配置
- **TypeScript**: 严格模式和类型检查
- **ESLint**: Node.js 最佳实践 (待配置)
- **Prisma**: 数据库迁移和验证
- **Winston**: 结构化日志记录

## 关键文件清单

### 核心业务文件 ✅
```
src/
├── server.ts                 # 服务器入口
├── server-simple.ts          # 简化服务器
├── routes/                   # API 路由 ✅
│   ├── tasks.ts             # 任务路由
│   ├── points.ts            # 积分路由
│   ├── punishments.ts       # 惩罚路由
│   └── sync.ts              # 同步路由
├── middleware/               # 中间件 ✅
│   ├── auth.ts              # 认证中间件
│   ├── validation.ts        # 验证中间件
│   └── errorHandler.ts      # 错误处理
├── controllers/              # 控制器 ✅
│   ├── taskController.ts    # 任务控制器
│   ├── pointsController.ts  # 积分控制器
│   ├── punishmentController.ts # 惩罚控制器
│   └── syncController.ts    # 同步控制器
├── services/                 # 业务逻辑 ✅
│   ├── taskService.ts       # 任务服务
│   ├── pointsService.ts     # 积分服务
│   ├── punishmentService.ts # 惩罚服务
│   └── syncService.ts       # 同步服务
├── lib/                      # 工具库 ✅
│   ├── database.ts          # 数据库连接
│   ├── utils/               # 工具函数
│   │   ├── logger.ts         # 日志工具
│   │   ├── password.ts       # 密码工具
│   │   ├── response.ts       # 响应工具
│   │   └── jwt.ts            # JWT工具
├── types/                    # TypeScript 类型 ✅
├── tests/                    # 测试文件 ✅
│   ├── integration/         # 集成测试
│   └── setup.ts             # 测试配置
└── prisma/                   # 数据库配置 ✅
    ├── schema.prisma         # 数据模型定义
    ├── migrations/          # 数据库迁移
    └── seed.ts              # 种子数据
```

### 配置文件
```
├── tsconfig.json             # TypeScript 配置
├── package.json              # 项目依赖
├── package-lock.json         # 依赖锁定文件
└── prisma/                   # Prisma 配置 (待创建)
    └── schema.prisma         # 数据模型定义
```

## 常见问题 (FAQ)

### Q: 为什么选择 SQLite 而不是其他数据库？
A: SQLite 轻量级、无需安装、适合家庭本地部署，完全满足小型项目需求。

### Q: Socket.io 如何与 Express 集成？
A: 通过 createServer 创建 HTTP 服务器，将 Express 实例和 Socket.io 都绑定到同一个服务器。

### Q: 如何处理文件上传（如头像）？
A: 使用 multer 中间件处理 multipart/form-data，配合本地文件存储。

### Q: JWT 认证如何实现？
A: 登录时生成 JWT token，客户端在请求头中携带，服务端通过中间件验证。

## 测试与质量

### 测试框架配置 ✅
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
}
```

### 测试覆盖计划 ✅
- **单元测试**: 业务逻辑函数、工具类
- **集成测试**: API 接口、数据库操作
- **Socket 测试**: 实时通信功能
- **中间件测试**: 认证、验证、错误处理

### 质量工具配置 ✅
- **TypeScript**: 严格模式和类型检查
- **Prisma**: 数据库迁移和验证
- **Winston**: 结构化日志记录
- **ESLint**: Node.js 最佳实践

## 已完成功能特性

### ✅ 完整的后端API系统
- **任务管理**: 完整的CRUD操作和统计功能
- **积分系统**: 积分管理、等级系统、排行榜
- **惩罚系统**: 规则管理、记录处理、统计分析
- **同步系统**: 实时数据同步、冲突解决、设备管理

### ✅ WebSocket实时通信
- **认证系统**: JWT认证和权限控制
- **实时同步**: 多设备数据实时同步
- **家庭共享**: 家长和孩子数据权限管理
- **离线支持**: 离线数据同步和冲突处理

### ✅ 数据库完整实现
- **Prisma ORM**: 完整的数据模型和关系
- **SQLite数据库**: 轻量级本地数据库
- **数据迁移**: 自动化数据库版本管理
- **种子数据**: 初始化数据填充

## 下一步开发重点

1. **性能优化**: API响应优化和数据库查询优化
2. **监控和日志**: 完善的日志系统和性能监控
3. **安全加固**: API安全策略和数据保护
4. **文档完善**: API文档和开发者指南

## 变更记录 (Changelog)

**2025-12-17** - 完成后端核心功能实现
- 实现完整的RESTful API系统（任务、积分、惩罚）
- 集成WebSocket实时同步功能
- 完成Prisma数据库设计和实现
- 建立完整的测试体系
- 实现JWT认证和权限管理
- 当前状态：后端核心功能完成，可投入生产使用

**2025-12-16 19:12:06** - 初始化后端模块文档
- 分析当前 Express + TypeScript 服务器架构
- 识别 Prisma ORM、Socket.io、Winston 等关键技术
- 设计 RESTful API 和实时通信接口
- 规划数据库模型和业务逻辑结构
- 初始状态：基础服务器已搭建，待业务功能实现

---

*为星舰计划提供稳定可靠的技术后盾！🛸*