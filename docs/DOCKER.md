# 🐳 StarshipPlan Docker 部署指南

> 简洁统一的Docker容器化部署方案

## 🚀 快速开始

### 前置要求
- Docker 20.0+
- Docker Compose 2.0+

### 一键部署

```bash
# 部署基础服务（前端 + 后端）
./scripts/deploy-docker.sh deploy

# 部署带Nginx反向代理
./scripts/deploy-docker.sh deploy nginx

# 部署完整服务（包含监控）
./scripts/deploy-docker.sh deploy full
```

## 📋 命令参考

### 部署命令
```bash
./scripts/deploy-docker.sh deploy [模式]
```

**可用模式：**
- `basic` - 基础服务（默认）
- `nginx` - 包含Nginx反向代理
- `full` - 完整服务（监控 + 数据库管理）

### 管理命令
```bash
# 查看服务状态
./scripts/deploy-docker.sh status

# 查看实时日志
./scripts/deploy-docker.sh logs

# 停止所有服务
./scripts/deploy-docker.sh stop

# 重启服务
./scripts/deploy-docker.sh restart

# 初始化环境配置
./scripts/deploy-docker.sh setup

# 显示帮助信息
./scripts/deploy-docker.sh help
```

## 🔧 环境配置

部署脚本会自动创建 `.env` 文件，包含以下配置：

```bash
# 网络配置
LAN_IP=192.168.1.29

# 端口配置
BACKEND_PORT=8000
FRONTEND_PORT=3000
HTTP_PORT=80
HTTPS_PORT=443

# 应用配置
NODE_ENV=production
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://192.168.1.29:3000,http://localhost:3000

# 前端配置
NEXT_PUBLIC_API_URL=http://192.168.1.29:8000
NEXT_PUBLIC_WS_URL=ws://192.168.1.29:8000
```

## 🌐 访问地址

部署完成后，可通过以下地址访问：

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:8000
- **局域网访问**: http://你的IP:3000

**可选服务：**
- **Nginx代理**: http://localhost:80
- **数据库管理**: http://localhost:8080
- **Grafana监控**: http://localhost:3001

## 📁 文件结构

```
StarshipPlan/
├── docker/
│   ├── Dockerfile.backend          # 后端容器配置
│   ├── Dockerfile.frontend         # 前端容器配置
│   └── docker-compose.yml          # 容器编排配置
├── scripts/
│   └── deploy-docker.sh             # 统一部署脚本
└── .env                            # 环境配置（自动生成）
```

## 🛠 故障排除

### 常见问题

**1. Docker服务未启动**
```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker
sudo systemctl enable docker
```

**2. 端口被占用**
```bash
# 查看端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000

# 停止占用端口的服务
./scripts/deploy-docker.sh stop
```

**3. 网络连接问题**
```bash
# 检查Docker网络
docker network ls
docker network inspect starship-network

# 重启Docker服务
sudo systemctl restart docker
```

**4. 容器启动失败**
```bash
# 查看容器日志
docker logs starship-backend
docker logs starship-frontend

# 重新构建并启动
./scripts/deploy-docker.sh restart
```

### 清理命令

```bash
# 清理所有容器和镜像
docker system prune -a

# 清理数据卷（谨慎使用）
docker volume prune
```

## 🔒 安全配置

### 防火墙设置
```bash
# Ubuntu/Debian
sudo ufw allow 3000
sudo ufw allow 8000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

### SSL/HTTPS配置
1. 将SSL证书放入 `docker/ssl/` 目录
2. 配置Nginx SSL设置
3. 使用https端口访问

## 📊 监控和维护

### 健康检查
所有容器都包含健康检查，可自动重启故障容器。

### 日志管理
```bash
# 查看所有服务日志
./scripts/deploy-docker.sh logs

# 查看特定服务日志
docker logs starship-backend -f
docker logs starship-frontend -f
```

### 数据备份
```bash
# 备份数据（数据位于 ./backups 目录）
cp -r backups backups-$(date +%Y%m%d)
```

---

*让习惯养成变成一场有趣的太空冒险！🚀✨*