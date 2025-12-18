#!/bin/bash

# StarshipPlan 完整服务状态检查脚本

echo "🚀 StarshipPlan 服务状态检查"
echo "========================="

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

echo "📡 网络信息："
echo "  局域网IP: $LAN_IP"
echo ""

# 检查后端服务
echo "🔧 后端服务状态："
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "  ✅ 本地后端服务: http://localhost:8000"
else
    echo "  ❌ 本地后端服务: 无法访问"
fi

if curl -s http://$LAN_IP:8000/health > /dev/null 2>&1; then
    echo "  ✅ 局域网后端服务: http://$LAN_IP:8000"
else
    echo "  ❌ 局域网后端服务: 无法访问"
fi

# 检查前端服务
echo ""
echo "🎨 前端服务状态："
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ 本地前端服务: http://localhost:3000"
else
    echo "  ❌ 本地前端服务: 无法访问"
fi

if curl -s http://$LAN_IP:3000 > /dev/null 2>&1; then
    echo "  ✅ 局域网前端服务: http://$LAN_IP:3000"
else
    echo "  ❌ 局域网前端服务: 无法访问"
fi

# 检查服务进程
echo ""
echo "🔄 服务进程状态："

# 检查后端进程
BACKEND_PID=$(ps aux | grep "node.*server.js" | grep -v grep | awk '{print $2}' | head -1)
if [ -n "$BACKEND_PID" ]; then
    echo "  ✅ 后端进程: PID $BACKEND_PID"
else
    echo "  ❌ 后端进程: 未运行"
fi

# 检查前端进程
FRONTEND_PID=$(ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | head -1)
if [ -n "$FRONTEND_PID" ]; then
    echo "  ✅ 前端进程: PID $FRONTEND_PID"
else
    echo "  ❌ 前端进程: 未运行"
fi

echo ""
echo "🌐 完整访问地址："
echo "  本机访问："
echo "    前端: http://localhost:3000"
echo "    后端API: http://localhost:8000"
echo "    API文档: http://localhost:8000/api"
echo ""
echo "  局域网访问："
echo "    前端: http://$LAN_IP:3000"
echo "    后端API: http://$LAN_IP:8000"
echo "    API文档: http://$LAN_IP:8000/api"
echo ""

echo "📱 移动设备访问："
echo "  1. 确保设备连接到同一WiFi网络"
echo "  2. 在浏览器中访问: http://$LAN_IP:3000"
echo "  3. 应该能看到StarshipPlan的太空主题界面"
echo ""

echo "🔍 快速测试命令："
echo "  # 后端健康检查"
echo "  curl http://$LAN_IP:8000/health"
echo ""
echo "  # 前端页面测试"
echo "  curl -s http://$LAN_IP:3000 | head -1"
echo ""

# 提供重启服务的快捷方式
echo "🛠️  服务管理："
echo "  查看后端日志: tail -f logs/backend.log"
echo "  查看前端日志: tail -f logs/frontend.log"
echo "  重启后端: ./scripts/start-backend-locally.sh"
echo "  重启前端: cd frontend && npm run dev"
