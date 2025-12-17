# StarshipPlan 开发命令指南

## 项目启动命令

### 开发环境启动
```bash
# 启动后端开发服务器 (端口 8000)
npm run dev:backend
# 或
cd backend && npm run dev

# 启动前端开发服务器 (端口 3000)
npm run dev:frontend
# 或
cd frontend && npm run dev

# 同时启动前后端 (使用项目根目录脚本)
./start-dev.sh
```

### 生产环境
```bash
# 构建前端
npm run build
# 或
cd frontend && npm run build

# 构建后端
npm run build:backend
# 或
cd backend && npm run build

# 启动生产服务器
npm start
```

## 开发工具命令

### 代码质量检查
```bash
# 前端代码检查
npm run lint
# 或
cd frontend && npm run lint

# 前端类型检查
npm run type-check
# 或
cd frontend && npm run type-check
```

### 后端开发命令
```bash
# 数据库相关
cd backend

# 生成 Prisma 客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 查看数据库 (Prisma Studio)
npm run prisma:studio

# 填充测试数据
npm run prisma:seed

# 重置数据库
npm run prisma:reset

# 测试命令
npm run test              # 运行所有测试
npm run test:watch        # 监视模式运行测试
npm run test:coverage     # 生成测试覆盖率报告
npm run test:integration  # 运行集成测试
npm run test:unit         # 运行单元测试
```

## 移动端开发命令

### Capacitor 相关
```bash
# 构建前端并同步到移动端
cd frontend && npm run build
npx cap sync android

# 打开 Android Studio
npx cap open android

# 在设备上运行
npx cap run android
```

## Git 命令

### 基本操作
```bash
# 查看状态
git status

# 添加所有更改
git add .

# 提交更改 (遵循提交信息规范)
git commit -m "feat: 添加新功能"

# 推送到远程
git push

# 拉取最新更改
git pull
```

### 分支管理
```bash
# 创建新分支
git checkout -b feature/功能名称

# 切换分支
git checkout main

# 合并分支
git merge feature/功能名称

# 删除分支
git branch -d feature/功能名称
```

## 系统工具命令 (macOS)

### 文件操作
```bash
# 查看目录内容
ls -la

# 查找文件
find . -name "*.tsx" -type f

# 搜索文件内容
grep -r "function" . --include="*.ts" --include="*.tsx"

# 实时查看文件
tail -f backend/logs/app.log
```

### 进程管理
```bash
# 查看端口占用
lsof -i :3000
lsof -i :8000

# 终止进程
kill -9 <PID>

# 查看进程
ps aux | grep node
```

## 项目管理脚本

### 开发辅助脚本
```bash
# 启动开发环境 (后台运行)
./start-dev-background.sh

# 停止所有开发服务
./stop-dev.sh

# 查看开发服务状态
ps aux | grep -E "(node|npm)" | grep -v grep
```

## 测试相关命令

### 前端测试 (如果配置)
```bash
cd frontend

# 运行单元测试
npm run test

# 运行端到端测试
npm run test:e2e

# 生成测试覆盖率
npm run test:coverage
```

### 后端测试
```bash
cd backend

# 运行所有测试
npm test

# 运行特定测试文件
npm test -- tasks.test.ts

# 监视模式
npm run test:watch
```

## 调试和故障排除

### 日志查看
```bash
# 后端日志
tail -f backend/logs/app.log
tail -f backend/logs/error.log

# 前端开发服务器日志
cd frontend && npm run dev 2>&1 | tee dev.log
```

### 数据库调试
```bash
cd backend

# 查看数据库状态
npm run prisma:studio

# 查看数据库迁移状态
npx prisma migrate status

# 重置数据库
npm run prisma:reset
```

### 网络调试
```bash
# 测试API端点
curl http://localhost:8000/api/health

# 测试前端页面
curl http://localhost:3000

# 查看WebSocket连接
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:8000/socket.io/
```

## 常见问题解决

### 清理缓存
```bash
# 清理 npm 缓存
npm cache clean --force

# 清理 node_modules
rm -rf node_modules package-lock.json
npm install

# 清理前端构建缓存
cd frontend && rm -rf .next

# 清理后端构建缓存
cd backend && rm -rf dist
```

### 权限问题
```bash
# 修复脚本权限
chmod +x start-dev.sh stop-dev.sh start-dev-background.sh

# 修复 node_modules 权限
chmod -R 755 node_modules
```

### 端口冲突
```bash
# 查看占用端口的进程
lsof -i :3000
lsof -i :8000

# 终止占用进程的PID
kill -9 <PID>
```