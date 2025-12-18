# StarshipPlan 局域网部署指南

## 概述

本指南帮助您将 StarshipPlan 服务部署到局域网，使其他设备（如手机、平板、其他电脑）可以访问您的服务。

## 快速开始

### 1. 自动IP检测部署

```bash
# 部署到局域网（自动检测IP）
./scripts/docker-deploy.sh basic
```

### 2. 检查部署状态

```bash
# 查看服务状态和访问地址
./scripts/docker-deploy.sh status

# 测试局域网访问
./scripts/test-lan-deployment.sh
```

### 3. 安全配置

```bash
# 运行安全检查和配置
./scripts/setup-lan-security.sh
```

## 手动配置

### 1. 配置环境变量

复制环境配置文件：
```bash
cp .env.lan .env
```

编辑 `.env` 文件，修改以下配置：
```bash
# 局域网IP地址（自动检测，可手动修改）
LAN_IP=192.168.1.29

# CORS配置（允许局域网访问）
CORS_ORIGIN=http://192.168.1.29:3000,http://localhost:3000

# JWT密钥（建议修改为更安全的密钥）
JWT_SECRET=your-secure-jwt-secret

# Grafana密码
GRAFANA_PASSWORD=your-secure-password
```

### 2. 部署服务

```bash
# 基础部署（仅后端API）
./scripts/docker-deploy.sh basic

# 完整部署（包含Nginx和监控）
./scripts/docker-deploy.sh full
```

## 访问地址

部署完成后，服务可通过以下地址访问：

### 本机访问
- 后端API: http://localhost:8000
- 健康检查: http://localhost:8000/health
- Nginx代理: http://localhost (如果启用)
- Grafana: http://localhost:3001 (如果启用监控)

### 局域网访问
- 后端API: http://192.168.1.29:8000
- 健康检查: http://192.168.1.29:8000/health
- Nginx代理: http://192.168.1.29 (如果启用)
- Grafana: http://192.168.1.29:3001 (如果启用监控)

### 移动设备访问
1. 确保手机/平板连接到同一WiFi网络
2. 在浏览器中访问: http://192.168.1.29:8000
3. 前端应用需要单独部署到支持移动设备的服务器

## 安全配置

### 1. 防火墙设置

#### macOS
```bash
# 启用系统防火墙
# 系统偏好设置 > 安全性与隐私 > 防火墙

# 或使用 pfctl 配置端口过滤
echo "block in proto tcp from any to any port 8000" | sudo pfctl -ef -
echo "pass in proto tcp from 192.168.0.0/16 to any port 8000" | sudo pfctl -ef -
```

#### Linux
```bash
# 使用 ufw 配置防火墙
sudo ufw allow from 192.168.0.0/16 to any port 8000
sudo ufw allow from 10.0.0.0/8 to any port 8000
sudo ufw allow from 172.16.0.0/12 to any port 8000
sudo ufw deny 8000
sudo ufw enable
```

### 2. 网络安全建议

1. **更改默认密码**
   - 修改 JWT_SECRET 为复杂字符串
   - 修改 Grafana 管理密码

2. **限制访问范围**
   - 配置防火墙仅允许局域网IP访问
   - 避免在公网暴露服务

3. **定期更新**
   - 保持 Docker 镜像更新
   - 监控安全漏洞

## 故障排除

### 1. 无法从其他设备访问

检查项：
```bash
# 检查服务状态
./scripts/docker-deploy.sh status

# 检查端口占用
lsof -i :8000

# 测试局域网连通性
./scripts/test-lan-deployment.sh
```

可能原因：
- 防火墙阻止了端口访问
- 设备不在同一网络段
- Docker服务未正确启动

### 2. IP地址检测错误

手动设置IP：
```bash
# 编辑环境文件
echo "LAN_IP=192.168.1.29" >> .env

# 重新部署
./scripts/docker-deploy.sh restart
```

### 3. CORS跨域错误

检查CORS配置：
```bash
# 查看当前CORS设置
grep CORS_ORIGIN .env

# 测试API访问
curl -H "Origin: http://192.168.1.29:3000" http://192.168.1.29:8000/health
```

## 高级配置

### 1. 自定义端口

修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8080:8000"  # 将外部8080端口映射到容器8000端口
```

### 2. 域名访问

配置本地DNS：
```bash
# 编辑 /etc/hosts (需要管理员权限)
echo "192.168.1.29 starship.local" >> /etc/hosts
```

### 3. SSL证书

生成自签名证书：
```bash
# 创建SSL目录
mkdir -p docker/ssl

# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/ssl/server.key \
  -out docker/ssl/server.crt
```

### 4. 监控配置

启用完整的监控栈：
```bash
# 部署包含监控的完整服务
./scripts/docker-deploy.sh full monitoring

# 访问监控面板
# Prometheus: http://192.168.1.29:9090
# Grafana: http://192.168.1.29:3001
```

## 维护和运维

### 日常维护
```bash
# 查看服务状态
./scripts/docker-deploy.sh status

# 查看日志
./scripts/docker-deploy.sh logs

# 备份数据
./scripts/docker-deploy.sh backup

# 更新服务
./scripts/docker-deploy.sh update
```

### 性能监控
- 使用 Grafana 监控系统性能
- 使用 Prometheus 收集指标数据
- 配置告警规则

---

**注意事项：**
- 局域网部署仅适用于受信任的网络环境
- 请确保修改默认密码和安全配置
- 定期检查和更新系统安全补丁