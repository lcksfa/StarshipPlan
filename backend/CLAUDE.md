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
// 认证相关 (待实现)
POST   /api/auth/register        # 用户注册
POST   /api/auth/login           # 用户登录
POST   /api/auth/logout          # 用户登出
GET    /api/auth/profile         # 获取用户信息
PUT    /api/auth/profile         # 更新用户信息

// 任务管理 (待实现)
GET    /api/tasks                # 获取任务列表
POST   /api/tasks                # 创建新任务
PUT    /api/tasks/:id            # 更新任务
DELETE /api/tasks/:id            # 删除任务
POST   /api/tasks/:id/complete   # 完成任务

// 积分系统 (待实现)
GET    /api/coins/balance        # 获取积分余额
GET    /api/coins/history        # 获取积分历史
POST   /api/coins/earn           # 获得积分
POST   /api/coins/spend          # 消费积分

// 用户管理 (待实现)
GET    /api/users                # 获取用户列表
GET    /api/users/:id            # 获取用户详情
PUT    /api/users/:id            # 更新用户信息
GET    /api/users/:id/stats      # 获取用户统计

// 系统相关
GET    /health                   # 健康检查
GET    /                         # API 信息
```

### Socket.io 实时事件
```typescript
// 连接事件
connection           # 客户端连接
disconnect          # 客户端断开
join-room          # 加入房间
leave-room         # 离开房间

// 任务事件
task-created       # 任务创建
task-updated       # 任务更新
task-completed     # 任务完成

// 积分事件
coins-earned       # 获得积分
coins-spent        # 消费积分
level-upgraded     # 等级提升
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

### Prisma Schema (待实现)
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

### 核心业务文件 (待创建)
```
src/
├── server.ts                 # 服务器入口 (已存在)
├── server-simple.ts          # 简化服务器 (已存在)
├── routes/                   # API 路由
│   ├── auth.ts              # 认证路由
│   ├── tasks.ts             # 任务路由
│   ├── users.ts             # 用户路由
│   └── coins.ts             # 积分路由
├── middleware/               # 中间件
│   ├── auth.ts              # 认证中间件
│   ├── validation.ts        # 验证中间件
│   └── errorHandler.ts      # 错误处理
├── services/                 # 业务逻辑
│   ├── userService.ts       # 用户服务
│   ├── taskService.ts       # 任务服务
│   └── coinService.ts       # 积分服务
├── models/                   # 数据模型
├── utils/                    # 工具函数
├── types/                    # TypeScript 类型
└── test/                     # 测试文件
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

## 下一步开发重点

1. **配置 Prisma**: 设计数据库模型，创建迁移文件
2. **实现认证系统**: JWT 认证、用户注册登录
3. **开发 API 路由**: 任务管理、积分系统
4. **集成 Socket.io**: 实时任务更新和通知
5. **添加数据验证**: express-validator 请求验证
6. **编写测试**: 单元测试和集成测试
7. **错误处理**: 统一错误处理和日志记录

## 变更记录 (Changelog)

**2025-12-16 19:12:06** - 初始化后端模块文档
- 分析当前 Express + TypeScript 服务器架构
- 识别 Prisma ORM、Socket.io、Winston 等关键技术
- 设计 RESTful API 和实时通信接口
- 规划数据库模型和业务逻辑结构
- 当前状态：基础服务器已搭建，待业务功能实现

---

*为星舰计划提供稳定可靠的技术后盾！🛸*