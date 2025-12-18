# 🚀 StarshipPlan 部署指南

本指南详细介绍 StarshipPlan 的各种部署方式，包括本地开发和生产环境部署。

## 📋 目录

- [环境准备](#环境准备)
- [本地开发部署](#本地开发部署)
- [生产环境部署](#生产环境部署)
- [Docker 容器部署](#docker-容器部署)
- [服务管理](#服务管理)
- [故障排除](#故障排除)

## 🔧 环境准备

### 系统要求

**操作系统支持：**
- macOS 10.15+ (推荐)
- Ubuntu 18.04+ / Debian 9+
- Windows 10+ (WSL2)

**必需软件：**
- Node.js 18.0+ 
- npm 9.0+
- Git

**网络要求：**
- 家庭WiFi网络（用于局域网访问）
- 互联网连接（首次安装依赖）

### 安装 Node.js

**macOS (使用 Homebrew):**
```bash
brew install node@20
node --version  # 确认版本 >= 18.0
npm --version   # 确认版本 >= 9.0
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
从 [Node.js 官网](https://nodejs.org/) 下载并安装 LTS 版本

## 💻 本地开发部署

### 快速启动

使用自动化脚本一键启动（推荐）：

```bash
# 启动所有服务（前端 + 后端）
./scripts/deploy-local.sh start

# 查看服务状态
./scripts/deploy-local.sh status

# 停止所有服务
./scripts/deploy-local.sh stop
```

### 手动启动

如果需要手动控制，可以分别启动前后端：

**启动后端服务：**
```bash
cd backend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 启动开发服务器
npm run dev
```

**启动前端服务：**
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 访问地址

启动成功后，可通过以下地址访问：

- **前端应用：** http://localhost:3000
- **后端API：** http://localhost:8000
- **API文档：** http://localhost:8000/api-docs
- **健康检查：** http://localhost:8000/health

### 局域网访问

为了在家庭网络内其他设备访问，脚本会自动检测局域网IP地址：

```bash
# 查看当前IP地址
./scripts/deploy-local.sh status
```

常见访问地址：
- **前端：** http://192.168.1.29:3000
- **后端：** http://192.168.1.29:8000

## 🐳 Docker 容器部署

### 当前状态

⚠️ **重要提示：** Docker 部署目前存在 Prisma + Alpine Linux 兼容性问题，建议使用本地部署方案。

我们正在修复以下问题：
- Prisma 二进制引擎与 Alpine Linux OpenSSL 兼容性
- 容器构建时的依赖版本冲突

### 未来 Docker 支持

问题解决后，Docker 部署命令：

```bash
# 一键 Docker 部署
./scripts/deploy-docker.sh deploy

# 完整部署（包含监控工具）
./scripts/deploy-docker.sh deploy --full

# 查看 Docker 服务状态
./scripts/deploy-docker.sh status

# 停止 Docker 服务
./scripts/deploy-docker.sh stop
```

## 🛠️ 服务管理

### 启动服务

```bash
# 启动所有服务
./scripts/deploy-local.sh start

# 仅启动后端
./scripts/deploy-local.sh backend

# 仅启动前端
./scripts/deploy-local.sh frontend
```

### 停止服务

```bash
# 停止所有服务
./scripts/deploy-local.sh stop

# 重启所有服务
./scripts/deploy-local.sh restart
```

### 查看状态

```bash
# 查看服务运行状态
./scripts/deploy-local.sh status

# 查看实时日志
tail -f scripts/backend.log    # 后端日志
tail -f scripts/frontend.log   # 前端日志
```

### 进程管理

**手动进程控制：**
```bash
# 查看端口占用
lsof -i :3000  # 前端端口
lsof -i :8000  # 后端端口

# 强制杀死进程
kill -9 <PID>

# 批量杀死相关进程
pkill -f "node.*next"      # 前端进程
pkill -f "node.*server"    # 后端进程
```

## 🔧 环境配置

### 后端环境变量

编辑 `backend/.env` 文件：

```bash
# 基础配置
NODE_ENV=production
PORT=8000

# 数据库
DATABASE_URL="file:./data/starship-plan.db"

# 安全配置
JWT_SECRET=your-secret-key-here

# CORS 配置（允许局域网访问）
CORS_ORIGIN="http://192.168.1.29:3000,http://localhost:3000"

# 局域网 IP
LAN_IP=192.168.1.29
```

### 前端环境变量

编辑 `frontend/.env.local` 文件：

```bash
# API 配置
NEXT_PUBLIC_API_URL=http://192.168.1.29:8000
NEXT_PUBLIC_WS_URL=ws://192.168.1.29:8000

# 应用配置
NEXT_PUBLIC_APP_NAME=StarshipPlan
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 自动 IP 检测

部署脚本会自动检测局域网 IP 地址：

```bash
# 查看检测到的 IP
get_lan_ip() {
    if command -v ip >/dev/null 2>&1; then
        lan_ip=$(ip route get 1 | awk '{print $7}' | head -1)
    elif command -v ifconfig >/dev/null 2>&1; then
        lan_ip=$(ifconfig | grep -E "inet.*broadcast" | awk '{print $2}' | head -1)
    else
        lan_ip="192.168.1.29"  # 默认值
    fi
    echo "$lan_ip"
}
```

## 📊 监控和日志

### 日志位置

**本地部署日志：**
- 后端日志：`scripts/backend.log`
- 前端日志：`scripts/frontend.log`
- PID 文件：`scripts/backend.pid`、`scripts/frontend.pid`

**实时监控：**
```bash
# 查看后端实时日志
tail -f scripts/backend.log

# 查看前端实时日志  
tail -f scripts/frontend.log

# 监控系统资源
htop  # CPU 和内存使用情况
```

### 健康检查

**API 健康检查：**
```bash
# 检查后端服务
curl http://localhost:8000/health

# 检查前端服务
curl http://localhost:3000

# 检查局域网访问
curl http://192.168.1.29:8000/health
```

**系统状态检查：**
```bash
# 查看服务状态
./scripts/deploy-local.sh status

# 检查端口占用
netstat -tulpn | grep -E ':(3000|8000)'

# 检查进程状态
ps aux | grep -E "(next|server)" | grep -v grep
```

## 🚨 故障排除

### 常见问题

**1. Prisma OpenSSL 兼容性错误**
```bash
# 错误信息：Error loading shared library libssl.so.1.1
# 解决方案：
./scripts/fix-prisma.sh

# 手动修复：
cd backend
rm -rf node_modules/.prisma node_modules/@prisma/client
npx prisma generate
```

**2. 端口被占用**
```bash
# 错误信息：Error: listen EADDRINUSE :::3000
# 解决方案：
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9
```

**3. 数据库连接失败**
```bash
# 确保数据库目录存在
mkdir -p backend/data

# 检查数据库权限
ls -la backend/data/
```

**3. 前端构建失败**
```bash
# 清理构建缓存
cd frontend
rm -rf .next
npm run build
```

**4. 依赖安装问题**
```bash
# 清理 npm 缓存
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

**5. 局域网无法访问**
```bash
# 检查防火墙设置
sudo ufw status

# 允许端口访问
sudo ufw allow 3000
sudo ufw allow 8000

# 检查 IP 地址
ip addr show
```

### 性能优化

**1. 内存使用优化**
```bash
# 增加交换空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

**2. 启动时间优化**
```bash
# 前端构建优化
cd frontend
npm run build

# 使用 PM2 进程管理
npm install -g pm2
pm2 start backend/dist/server.js --name "starship-backend"
```

## 📱 移动端部署

### PWA 安装

在移动设备浏览器中：
1. 访问 http://192.168.1.29:3000
2. 点击浏览器菜单中的"添加到主屏幕"
3. 确认安装 PWA 应用

### Capacitor 构建

```bash
# 添加 Android 平台
cd frontend
npx cap add android

# 构建 Web 应用
npm run build

# 同步到 Android 项目
npx cap sync android

# 打开 Android Studio
npx cap open android
```

## 🔒 安全配置

### 基础安全

1. **修改默认密钥：**
```bash
# 编辑 backend/.env
JWT_SECRET=your-unique-secret-key-here
```

2. **限制网络访问：**
```bash
# 仅允许局域网访问
sudo ufw allow from 192.168.1.0/24 to any port 3000
sudo ufw allow from 192.168.1.0/24 to any port 8000
```

3. **定期更新：**
```bash
# 更新系统包
sudo apt update && sudo apt upgrade

# 更新 Node.js 依赖
npm update
```

## 📞 技术支持

如遇到部署问题：

1. **查看日志：** 检查 `scripts/backend.log` 和 `scripts/frontend.log`
2. **检查状态：** 运行 `./scripts/deploy-local.sh status`
3. **重启服务：** 尝试 `./scripts/deploy-local.sh restart`
4. **GitHub Issues：** 提交详细错误信息和系统环境

---

## 📚 相关文档

- [开发指南](./docs/DEVELOPMENT.md)
- [API 文档](./docs/API.md)
- [用户手册](./docs/USER_GUIDE.md)
- [项目架构](./docs/ARCHITECTURE.md)

---

*让习惯养成变成一场有趣的太空冒险！🚀✨*