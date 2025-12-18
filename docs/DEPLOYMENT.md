# StarshipPlan 部署指南

本文档提供 StarshipPlan 的完整部署指南，包括本地开发环境、Docker 容器化部署和生产环境部署。

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [本地部署](#本地部署)
- [Docker 部署](#docker-部署)
- [生产环境](#生产环境)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 🔧 系统要求

### 最低要求
- **操作系统**: Linux (Ubuntu 18.04+), macOS (10.15+), Windows 10+
- **内存**: 2GB RAM (推荐 4GB+)
- **存储**: 10GB 可用空间
- **网络**: 稳定的互联网连接

### 软件要求
- **Node.js**: 18.0 或更高版本
- **npm**: 9.0 或更高版本
- **Git**: 最新版本
- **Docker**: 20.10+ (可选，用于容器化部署)
- **Docker Compose**: 2.0+ (可选)

## 🚀 快速开始

### 一键部署（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd StarshipPlan

# 运行一键部署脚本
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 启动应用
./start.sh
```

访问 http://localhost:3000 开始使用 StarshipPlan！

## 💻 本地部署

### 方法一：使用部署脚本

```bash
# 1. 检查系统要求
./scripts/deploy.sh check

# 2. 完整部署
./scripts/deploy.sh full

# 3. 启动服务
./start.sh
```

### 方法二：手动部署

```bash
# 1. 安装依赖
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 2. 初始化数据库
cd backend
npx prisma generate
npx prisma db push
cd ..

# 3. 构建项目
cd frontend && npm run build && cd ..
cd backend && npm run build && cd ..

# 4. 启动服务
./start.sh
```

## 🐳 Docker 部署

### 基础部署

```bash
# 1. 使用 Docker 部署脚本
chmod +x scripts/docker-deploy.sh
./scripts/docker-deploy.sh start

# 2. 检查服务状态
./scripts/docker-deploy.sh status
```

### 完整部署（含 Nginx 和监控）

```bash
# 启动所有服务
./scripts/docker-deploy.sh full

# 服务地址：
# - 主应用: http://localhost:8000
# - Nginx: http://localhost (HTTP) / https://localhost (HTTPS)
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001 (admin/admin)
# - Adminer: http://localhost:8080
```

### Docker Compose 命令

```bash
# 启动服务
docker-compose up -d

# 启动特定配置
docker-compose --profile nginx up -d
docker-compose --profile monitoring up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新服务
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🏭 生产环境部署

### 系统准备

```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 创建应用用户
sudo useradd -m -s /bin/bash starship
sudo usermod -aG docker starship
```

### 部署步骤

```bash
# 1. 切换到应用用户
sudo su - starship

# 2. 部署应用
cd /opt
git clone <repository-url> StarshipPlan
cd StarshipPlan

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置生产环境变量

# 4. 创建服务目录
sudo mkdir -p /var/log/starshipplan
sudo mkdir -p /var/backups/starshipplan

# 5. 设置权限
sudo chown -R starship:starship /opt/StarshipPlan
sudo chown -R starship:starship /var/log/starshipplan
sudo chown -R starship:starship /var/backups/starshipplan

# 6. 创建系统服务
sudo tee /etc/systemd/system/starship-plan.service > /dev/null <<EOF
[Unit]
Description=StarshipPlan Service
After=network.target

[Service]
Type=simple
User=starship
WorkingDirectory=/opt/StarshipPlan
Environment=NODE_ENV=production
Environment=PORT=8000
ExecStart=/opt/StarshipPlan/scripts/docker-deploy.sh start
ExecReload=/bin/kill -USR $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 7. 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable starship-plan
sudo systemctl start starship-plan
sudo systemctl status starship-plan

# 8. 配置 Nginx (可选)
sudo apt install -y nginx
sudo cp docker/nginx.conf /etc/nginx/sites-available/starship-plan
sudo ln -s /etc/nginx/sites-available/starship-plan /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### SSL 证书配置

```bash
# 使用 Let's Encrypt (推荐)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# 或使用自签名证书
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/starship-plan.key \
    -out /etc/nginx/ssl/starship-plan.crt \
    -subj "/C=CN/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

## 📊 监控和维护

### 健康检查

```bash
# 使用内置健康检查
curl http://localhost:8000/health

# 使用部署脚本检查
./scripts/health-check.sh
```

### 日志管理

```bash
# 查看应用日志
./scripts/cleanup-logs.sh

# 配置日志轮转
sudo tee /etc/logrotate.d/starship-plan > /dev/null <<EOF
/var/log/starshipplan/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 starshipplan starshipplan
    postrotate
        systemctl reload starship-plan
    endscript
}
EOF
```

### 备份策略

```bash
# 自动备份 (已配置在 crontab 中)
./scripts/backup.sh

# 手动备份
./scripts/backup.sh

# 恢复备份
./scripts/restore.sh backups/starship-plan-backup-20240101_120000.tar.gz
```

### 监控配置

#### Prometheus 指标

访问 http://localhost:9090 查看以下指标：

- 应用响应时间
- 内存和 CPU 使用率
- API 请求数量和错误率
- 数据库连接状态

#### Grafana 仪表板

访问 http://localhost:3001 查看预设仪表板：

- 应用性能监控
- 系统资源监控
- 错误追踪和告警

## 🔧 故障排除

### 常见问题

#### 1. 端口冲突

**问题**: 端口 3000 或 8000 被占用

**解决方法**:
```bash
# 查看端口占用
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8000

# 终止占用进程
sudo kill -9 <PID>

# 或修改端口配置
export PORT=3001
```

#### 2. 数据库错误

**问题**: 数据库连接失败

**解决方法**:
```bash
# 检查数据库文件权限
ls -la backend/starship-plan.db

# 重新生成 Prisma 客户端
cd backend
npx prisma generate
npx prisma db push

# 检查数据库内容
npx prisma studio
```

#### 3. 内存不足

**问题**: 应用内存溢出

**解决方法**:
```bash
# 检查内存使用
free -h
docker stats

# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 重启服务
./restart.sh
```

#### 4. Docker 权限错误

**问题**: Docker 权限被拒绝

**解决方法**:
```bash
# 检查 Docker 用户组
groups $USER

# 添加用户到 docker 组
sudo usermod -aG docker $USER

# 重新登录或重启
newgrp docker
```

### 日志分析

#### 应用启动失败

```bash
# 查看详细错误日志
./scripts/docker-deploy.sh logs

# 检查 Docker 日志
docker-compose logs starship-plan

# 检查系统日志
journalctl -u starship-plan -f
```

#### 性能问题

```bash
# 监控系统资源
top
htop

# 分析 Docker 容器
docker stats

# 检查网络连接
netstat -tulpn
```

## 📞 支持和维护

### 获取帮助

- **GitHub Issues**: 提交 Bug 报告和功能请求
- **文档**: 查看 [docs/](./) 目录中的详细文档
- **社区**: 参与用户讨论和经验分享

### 版本更新

```bash
# 检查更新
git fetch origin
git log HEAD..origin/main --oneline

# 更新应用
./scripts/update.sh

# 备份后更新
./scripts/backup.sh
git pull origin main
./scripts/docker-deploy.sh update
```

### 安全建议

1. **定期更新依赖包**
   ```bash
   npm audit
   npm audit fix
   ```

2. **使用强密码和 HTTPS**
   ```bash
   # 配置强 JWT 密钥
   openssl rand -base64 32
   
   # 启用 HTTPS
   ./scripts/docker-deploy.sh full
   ```

3. **定期备份数据**
   ```bash
   # 设置定时备份
   crontab -e
   0 2 * * * /path/to/StarshipPlan/scripts/backup.sh
   ```

4. **监控系统状态**
   ```bash
   # 定期健康检查
   crontab -e
   */5 * * * * /path/to/StarshipPlan/scripts/health-check.sh
   ```

---

**🎉 恭喜！** 您已经成功部署了 StarshipPlan！

如有任何问题，请参考本文档或联系技术支持。