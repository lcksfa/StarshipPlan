# 🚀 StarshipPlan 开发环境使用指南

## 概述

`scripts/dev-start.sh` 是专为 StarshipPlan 项目设计的本地开发调试启动脚本，提供热重载、调试功能和开发工具集成。

## 🌟 主要特性

### 🔄 热重载支持
- **后端**: 使用 `ts-node` 实时编译 TypeScript，代码修改自动重启
- **前端**: Next.js Turbopack 提供极速热重载，修改组件立即生效
- **数据库**: SQLite 自动检测，支持实时数据变更

### 🔍 调试模式
- **详细日志**: Winston 日志系统记录所有 API 请求和错误
- **开发环境变量**: 启用调试模式和详细错误信息
- **健康检查**: 实时监控服务状态

### 🌐 局域网访问
- **自动IP检测**: 智能获取局域网IP地址
- **跨设备测试**: 支持手机、平板等设备访问调试
- **CORS配置**: 自动配置允许的跨域访问源

### 📊 状态监控
- **进程管理**: PID 文件跟踪服务器进程
- **端口检测**: 自动检测端口占用冲突
- **服务状态**: 实时显示前后端服务运行状态

## 📋 使用方法

### 基本命令

```bash
# 启动完整开发环境（前端+后端）
./scripts/dev-start.sh start

# 启动后端开发服务器
./scripts/dev-start.sh backend

# 启动前端开发服务器  
./scripts/dev-start.sh frontend

# 重启开发环境
./scripts/dev-start.sh restart

# 停止开发环境
./scripts/dev-start.sh stop

# 查看服务状态
./scripts/dev-start.sh status

# 查看实时日志
./scripts/dev-start.sh logs

# 清理日志文件
./scripts/dev-start.sh clean

# 安装/更新依赖
./scripts/dev-start.sh install

# 显示帮助信息
./scripts/dev-start.sh help
```

### 开发环境访问地址

启动成功后，你可以通过以下地址访问：

- **前端应用**: http://localhost:3000
- **前端局域网**: http://192.168.x.x:3000 (你的局域网IP)
- **后端API**: http://localhost:8000
- **后端局域网**: http://192.168.x.x:8000
- **健康检查**: http://localhost:8000/health
- **API文档**: http://localhost:8000/api

## 🛠️ 开发工具集成

### 日志查看
```bash
# 查看后端实时日志
tail -f scripts/backend-dev.log

# 查看前端实时日志
tail -f scripts/frontend-dev.log

# 使用脚本内置日志查看器
./scripts/dev-start.sh logs
```

### 数据库管理
```bash
# 打开 SQLite 数据库
sqlite3 backend/data/starship-plan-dev.db

# 运行数据库迁移
cd backend && DATABASE_URL="file:./data/starship-plan-dev.db" npx prisma migrate dev

# 查看数据库内容
cd backend && npx prisma studio
```

### API测试
```bash
# 健康检查
curl http://localhost:8000/health

# 获取任务列表（需要认证）
curl -H "Authorization: Bearer mock-token-parent" http://localhost:8000/api/tasks
```

## ⚙️ 配置说明

### 环境变量
开发脚本会自动设置以下环境变量：

**后端环境变量**:
- `NODE_ENV=development`
- `PORT=8000`
- `DATABASE_URL=file:$PROJECT_DIR/backend/data/starship-plan-dev.db`
- `JWT_SECRET=starship-plan-dev-secret`
- `ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://你的局域网IP:3000`

**前端环境变量**:
- `NODE_ENV=development`
- `NEXT_PUBLIC_API_URL=http://你的局域网IP:8000`
- `NEXT_PUBLIC_WS_URL=ws://你的局域网IP:8000`
- `NEXT_PUBLIC_APP_NAME=StarshipPlan`
- `NEXT_PUBLIC_APP_VERSION=1.0.0-dev`

### 文件结构
```
scripts/
├── dev-start.sh           # 主开发脚本
├── backend-dev.log        # 后端开发日志
├── frontend-dev.log       # 前端开发日志
├── .dev-backend.pid       # 后端进程ID文件
└── .dev-frontend.pid      # 前端进程ID文件
```

## 🚨 常见问题

### 端口冲突
如果遇到端口占用错误：
```bash
# 查看端口占用
lsof -i :8000  # 后端端口
lsof -i :3000  # 前端端口

# 停止开发环境会自动清理
./scripts/dev-start.sh stop
```

### 依赖问题
如果遇到模块找不到错误：
```bash
# 重新安装依赖
./scripts/dev-start.sh install

# 或者手动安装
cd backend && npm install
cd frontend && npm install
```

### 数据库问题
如果数据库连接失败：
```bash
# 检查数据库文件
ls -la backend/data/starship-plan-dev.db

# 重新运行迁移
cd backend && npx prisma migrate dev --name init
```

### 热重载不工作
1. 检查文件保存格式是否为 UTF-8
2. 确认 TypeScript 编译无错误
3. 查看日志中的错误信息
4. 重启开发环境

## 🎯 开发最佳实践

### 1. 工作流程
```bash
# 1. 启动开发环境
./scripts/dev-start.sh start

# 2. 查看状态确认服务正常
./scripts/dev-start.sh status

# 3. 开始开发，享受热重载

# 4. 完成后停止服务
./scripts/dev-start.sh stop
```

### 2. 调试技巧
- 使用浏览器开发者工具查看前端热重载状态
- 后端修改后查看终端日志确认重启成功
- API 调试可以使用 Postman 或 curl 命令
- 数据库操作建议使用 Prisma Studio 可视化工具

### 3. 性能优化
- 避免在代码中添加大量 console.log（生产环境会自动去除）
- 大文件修改时热重载可能有延迟，这是正常现象
- 定期清理日志文件：`./scripts/dev-start.sh clean`

## 📞 技术支持

如果遇到问题，请：
1. 查看本文档的常见问题部分
2. 检查 `scripts/backend-dev.log` 和 `scripts/frontend-dev.log` 日志文件
3. 确认 Node.js 版本 >= 18.0.0
4. 确认 npm 版本 >= 9.0.0

---

**祝您开发愉快！🚀✨**

让习惯养成变成一场有趣的太空冒险！