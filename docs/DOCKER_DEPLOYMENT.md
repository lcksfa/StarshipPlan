# 🐳 StarshipPlan Docker 完整部署指南

> 📋 **部署架构**: 前后端分离 + Nginx反向代理 + 可选监控服务

## 🚀 快速开始

### 1. 环境准备

**系统要求:**
- Linux/macOS/Windows (支持Docker)
- Docker 20.0+ 
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 4GB 可用磁盘空间

**安装Docker:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# macOS (使用 Homebrew)
brew install --cask docker

# Windows
# 下载并安装 Docker Desktop
```

### 2. 一键部署

```bash
# 克隆项目
git clone <your-repo-url>
cd StarshipPlan

# 部署核心服务（推荐）
./scripts/docker-full-deploy.sh core

# 或者部署带Nginx反向代理的完整服务
./scripts/docker-full-deploy.sh nginx
```

### 3. 访问服务

部署完成后，访问以下地址：

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:8000  
- **Nginx代理**: http://localhost (如果启用)

局域网内其他设备可通过你的局域网IP访问，例如：http://192.168.1.29:3000

## 📋 部署模式说明

### 模式1: 核心服务 (core)

**包含服务:**
- ✅ StarshipPlan 后端 (端口 8000)
- ✅ StarshipPlan 前端 (端口 3000)

**适用场景:**
- 开发测试环境
- 简单部署需求
- 资源有限的环境

```bash
./scripts/docker-full-deploy.sh core
```

### 模式2: Nginx反向代理 (nginx)

**包含服务:**
- ✅ 核心服务
- ✅ Nginx反向代理 (端口 80)

**优势:**
- 统一入口点
- 更好的安全性
- 支持SSL/HTTPS
- 负载均衡能力

```bash
./scripts/docker-full-deploy.sh nginx
```

### 模式3: 完整服务 (full)

**包含服务:**
- ✅ 核心服务
- ✅ Nginx反向代理
- ✅ 监控服务 (Prometheus + Grafana)
- ✅ 数据库管理工具 (Adminer)
- ✅ 日志收集 (Elasticsearch + Kibana)

**适用场景:**
- 生产环境
- 需要监控和运维管理

```bash
./scripts/docker-full-deploy.sh full
```

## ⚙️ 配置说明

### 环境变量配置

Docker部署会自动生成 `.env.docker` 文件，包含以下配置：

```bash
# 网络配置
LAN_IP=192.168.1.29  # 自动检测的局域网IP

# 端口配置
BACKEND_PORT=8000     # 后端API端口
FRONTEND_PORT=3000   # 前端应用端口  
HTTP_PORT=80         # Nginx HTTP端口
HTTPS_PORT=443       # Nginx HTTPS端口

# 应用配置
NODE_ENV=production
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://192.168.1.29:3000,http://localhost:3000

# 前端配置
NEXT_PUBLIC_API_URL=http://192.168.1.29:8000
NEXT_PUBLIC_WS_URL=ws://192.168.1.29:8000
```

### 自定义配置

你可以编辑 `.env.docker` 文件来自定义配置：

```bash
# 修改端口
FRONTEND_PORT=3001
BACKEND_PORT=8001

# 修改JWT密钥
JWT_SECRET=your-very-secure-secret-key

# 添加监控密码
GRAFANA_PASSWORD=your-grafana-password
```

## 🔧 常用命令

### 服务管理

```bash
# 查看服务状态
./scripts/docker-full-deploy.sh status

# 查看服务日志
./scripts/docker-full-deploy.sh logs

# 停止所有服务
./scripts/docker-full-deploy.sh stop

# 重启服务
./scripts/docker-full-deploy.sh restart core

# 重新构建镜像
./scripts/docker-full-deploy.sh build
```

### Docker Compose 直接操作

```bash
# 查看运行的容器
docker-compose -f docker/docker-compose.full.yml ps

# 查看特定服务日志
docker-compose -f docker/docker-compose.full.yml logs -f backend

# 进入容器调试
docker-compose -f docker/docker-compose.full.yml exec backend sh

# 更新服务
docker-compose -f docker/docker-compose.full.yml pull
docker-compose -f docker/docker-compose.full.yml up -d
```

### 数据管理

```bash
# 备份数据
./scripts/backup.sh docker

# 查看数据卷
docker volume ls | grep starship

# 清理数据（谨慎使用）
docker-compose -f docker/docker-compose.full.yml down -v
```

## 📊 监控服务

如果部署了完整服务，可以使用以下监控工具：

### Grafana

- **访问地址**: http://localhost:3001
- **默认用户名**: admin
- **默认密码**: admin (可在 .env.docker 中修改)

功能:
- 系统性能监控
- 应用指标可视化
- 自定义仪表板

### Prometheus

- **访问地址**: http://localhost:9090
- **功能**: 指标收集和存储

### Adminer

- **访问地址**: http://localhost:8080
- **功能**: 数据库管理界面

## 🔒 安全配置

### SSL/HTTPS 配置

1. **准备SSL证书:**
```bash
mkdir -p docker/ssl
# 将你的证书文件放入 docker/ssl/ 目录
# cert.pem - SSL证书
# key.pem - 私钥文件
```

2. **更新Nginx配置:**
编辑 `docker/nginx/nginx.conf`，添加HTTPS配置

3. **重启服务:**
```bash
./scripts/docker-full-deploy.sh restart nginx
```

### 防火墙设置

```bash
# Ubuntu/Debian
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 8000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## 🐛 故障排除

### 常见问题

**1. 容器启动失败**
```bash
# 查看详细错误日志
docker-compose -f docker/docker-compose.full.yml logs

# 检查端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000
```

**2. 网络连接问题**
```bash
# 检查Docker网络
docker network ls
docker network inspect starship-network

# 重启Docker服务
sudo systemctl restart docker
```

**3. 磁盘空间不足**
```bash
# 清理Docker缓存
docker system prune -a

# 清理未使用的卷
docker volume prune
```

**4. 前端无法访问后端**
- 检查 `NEXT_PUBLIC_API_URL` 环境变量配置
- 确认后端服务健康状态: `curl http://localhost:8000/health`
- 检查CORS配置

**5. 局域网无法访问**
- 确认防火墙设置
- 检查LAN_IP配置是否正确
- 验证端口绑定配置

### 性能优化

**1. 资源限制:**
在 `docker-compose.full.yml` 中添加资源限制:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

**2. 数据库优化:**
- 定期清理过期数据
- 配置适当的缓存策略
- 监控数据库性能

## 📝 日志管理

### 日志位置

- **应用日志**: `docker/logs/`
- **Nginx日志**: `docker/nginx/logs/`
- **系统日志**: Docker容器日志

### 日志轮转

创建日志轮转配置 `/etc/logrotate.d/starship-docker`:

```
/path/to/starship-plan/docker/logs/*/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /path/to/starship-plan/docker/docker-compose.full.yml restart nginx
    endscript
}
```

## 🚀 生产部署建议

### 1. 环境隔离
- 使用单独的生产环境服务器
- 配置不同的环境变量
- 使用外部数据库

### 2. 备份策略
- 自动化数据备份
- 定期恢复测试
- 异地备份存储

### 3. 监控告警
- 配置Grafana告警
- 设置邮件/短信通知
- 监控关键指标

### 4. 更新部署
- 使用蓝绿部署
- 准备回滚方案
- 充分的测试验证

## 📞 技术支持

如果遇到问题，请：

1. 查看日志文件获取详细错误信息
2. 检查本文档的故障排除部分
3. 提交Issue到项目仓库
4. 联系技术支持团队

---

*让习惯养成变成一场有趣的太空冒险！🚀✨*