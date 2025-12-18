#!/bin/bash

# 局域网部署安全检查脚本

echo "🔒 StarshipPlan 局域网部署安全检查"
echo "==================================="

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

echo "检测到的局域网IP: $LAN_IP"
echo ""

echo "🛡️  安全提醒："
echo "1. 确保只在受信任的局域网环境中部署"
echo "2. 更改默认的JWT密钥和Grafana密码"
echo "3. 考虑配置防火墙规则限制访问"
echo ""

echo "📋 防火墙配置建议："
echo ""

# macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "macOS 防火墙："
    echo "  系统偏好设置 > 安全性与隐私 > 防火墙"
    echo "  启用防火墙并配置允许的应用"
    echo ""
    echo "或使用 pfctl 配置端口过滤："
    echo "  # 仅允许内网访问8000端口"
    echo "  echo \"block in proto tcp from any to any port 8000\" | sudo pfctl -ef -"
    echo "  echo \"pass in proto tcp from 192.168.0.0/16 to any port 8000\" | sudo pfctl -ef -"
    echo ""
fi

# Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Linux 防火墙 (ufw)："
    echo "  # 允许局域网访问8000端口"
    echo "  sudo ufw allow from 192.168.0.0/16 to any port 8000"
    echo "  sudo ufw allow from 10.0.0.0/8 to any port 8000"
    echo "  sudo ufw allow from 172.16.0.0/12 to any port 8000"
    echo ""
    echo "  # 拒绝其他IP访问8000端口"
    echo "  sudo ufw deny 8000"
    echo ""
fi

echo "🌐 访问地址："
echo "  本机访问: http://localhost:8000"
echo "  局域网访问: http://$LAN_IP:8000"
echo ""
echo "📱 移动设备访问："
echo "  确保移动设备连接到同一WiFi网络"
echo "  在浏览器中访问: http://$LAN_IP:8000"
echo ""

echo "✅ 完成以上配置后，其他设备即可访问您的StarshipPlan服务"
