#!/bin/bash

# StarshipPlan 后端本地启动脚本
# 绕过Docker网络问题，直接本地运行

echo "🚀 StarshipPlan 后端本地启动"
echo "========================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 进入后端目录
cd backend

# 检查是否已构建
if [ ! -d "dist" ]; then
    echo "📦 构建后端应用..."
    npm run build
fi

# 设置环境变量
export NODE_ENV=production
export PORT=8000
export DATABASE_URL="file:./dev.db"
export JWT_SECRET="${JWT_SECRET:-starship-plan-default-secret}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://192.168.1.29:3000,http://localhost:3000}"

# 创建数据目录
mkdir -p data logs

# 获取局域网IP
get_lan_ip() {
    local ip=$(ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    if [ -z "$ip" ]; then
        ip=$(ifconfig en0 2>/dev/null | grep "inet " | awk '{print $2}' | head -1)
    fi
    if [ -z "$ip" ]; then
        ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    echo "$ip"
}

LAN_IP=$(get_lan_ip)

echo "📋 配置信息："
echo "  端口: $PORT"
echo "  局域网IP: $LAN_IP"
echo "  数据库: $DATABASE_URL"
echo ""

echo "🌐 访问地址："
echo "  本机: http://localhost:$PORT"
echo "  局域网: http://$LAN_IP:$PORT"
echo "  健康检查: http://localhost:$PORT/health"
echo ""

echo "🔧 启动后端服务..."
echo "按 Ctrl+C 停止服务"
echo ""

# 启动服务
node dist/server.js
