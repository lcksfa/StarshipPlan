#!/bin/bash

# StarshipPlan 本地部署脚本
# 解决 Docker Prisma 兼容性问题的替代方案

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# PID 文件
BACKEND_PID_FILE="$SCRIPT_DIR/backend.pid"
FRONTEND_PID_FILE="$SCRIPT_DIR/frontend.pid"

# 获取局域网 IP
get_lan_ip() {
    local lan_ip
    if command -v ip >/dev/null 2>&1; then
        lan_ip=$(ip route get 1 | awk '{print $7}' | head -1)
    elif command -v ifconfig >/dev/null 2>&1; then
        lan_ip=$(ifconfig | grep -E "inet.*broadcast" | awk '{print $2}' | head -1 | cut -d: -f2)
    else
        lan_ip="192.168.1.29"
    fi

    # 验证 IP 格式
    if [[ $lan_ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "$lan_ip"
    else
        echo "192.168.1.29"
    fi
}

# 检查端口占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# 停止服务
stop_services() {
    echo -e "${YELLOW}🛑 停止现有服务...${NC}"

    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if ps -p $backend_pid > /dev/null 2>&1; then
            kill $backend_pid 2>/dev/null || true
            echo -e "${GREEN}✅ 后端服务已停止${NC}"
        fi
        rm -f "$BACKEND_PID_FILE"
    fi

    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if ps -p $frontend_pid > /dev/null 2>&1; then
            kill $frontend_pid 2>/dev/null || true
            echo -e "${GREEN}✅ 前端服务已停止${NC}"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi

    # 强制杀死可能残留的进程
    pkill -f "node.*dist/server.js" 2>/dev/null || true
    pkill -f "next.*start" 2>/dev/null || true

    echo -e "${GREEN}✅ 所有服务已停止${NC}"
}

# 启动后端服务
start_backend() {
    echo -e "${BLUE}🚀 启动后端服务...${NC}"

    cd "$PROJECT_DIR/backend"

    # 检查端口
    if ! check_port 8000; then
        echo -e "${RED}❌ 端口 8000 已被占用${NC}"
        return 1
    fi

    # 设置环境变量
    export NODE_ENV=production
    export PORT=8000
    export DATABASE_URL="file:$PROJECT_DIR/backend/data/starship-plan.db"
    export JWT_SECRET="starship-plan-local-secret"
    export LAN_IP=$(get_lan_ip)
    export ALLOWED_ORIGINS="http://$LAN_IP:3000,http://localhost:3000,http://127.0.0.1:3000"

    # 创建必要目录
    mkdir -p data logs backups

    # 启动后端服务
    nohup npm start > "$SCRIPT_DIR/backend.log" 2>&1 &
    local backend_pid=$!
    echo $backend_pid > "$BACKEND_PID_FILE"

    # 等待服务启动
    sleep 3

    if ps -p $backend_pid > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务启动成功${NC}"
        echo -e "${GREEN}📍 后端地址: http://$LAN_IP:8000${NC}"
    else
        echo -e "${RED}❌ 后端服务启动失败${NC}"
        echo -e "${RED}错误日志:${NC}"
        cat "$SCRIPT_DIR/backend.log" | tail -10
        return 1
    fi
}

# 启动前端服务
start_frontend() {
    echo -e "${BLUE}🚀 启动前端服务...${NC}"

    cd "$PROJECT_DIR/frontend"

    # 检查端口
    if ! check_port 3000; then
        echo -e "${RED}❌ 端口 3000 已被占用${NC}"
        return 1
    fi

    # 设置环境变量
    export NODE_ENV=production
    export NEXT_PUBLIC_API_URL="http://$(get_lan_ip):8000"
    export NEXT_PUBLIC_WS_URL="ws://$(get_lan_ip):8000"
    export NEXT_PUBLIC_APP_NAME="StarshipPlan"
    export NEXT_PUBLIC_APP_VERSION="1.0.0"

    # 构建前端（如果需要）
    if [ ! -d ".next" ]; then
        echo -e "${BLUE}构建前端应用...${NC}"
        npm run build
    fi

    # 启动前端服务
    nohup npm start -- --port 3000 > "$SCRIPT_DIR/frontend.log" 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > "$FRONTEND_PID_FILE"

    # 等待服务启动
    sleep 5

    if ps -p $frontend_pid > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端服务启动成功${NC}"
        echo -e "${GREEN}🌐 前端地址: http://$(get_lan_ip):3000${NC}"
    else
        echo -e "${RED}❌ 前端服务启动失败${NC}"
        echo -e "${RED}错误日志:${NC}"
        cat "$SCRIPT_DIR/frontend.log" | tail -10
        return 1
    fi
}

# 显示服务状态
show_status() {
    echo -e "${BLUE}📊 服务状态${NC}"
    echo "================================"

    local lan_ip=$(get_lan_ip)

    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if ps -p $backend_pid > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 后端服务运行中 (PID: $backend_pid)${NC}"
            echo -e "${GREEN}📍 后端地址: http://$lan_ip:8000${NC}"
        else
            echo -e "${RED}❌ 后端服务未运行${NC}"
        fi
    else
        echo -e "${RED}❌ 后端服务未运行${NC}"
    fi

    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if ps -p $frontend_pid > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 前端服务运行中 (PID: $frontend_pid)${NC}"
            echo -e "${GREEN}🌐 前端地址: http://$lan_ip:3000${NC}"
        else
            echo -e "${RED}❌ 前端服务未运行${NC}"
        fi
    else
        echo -e "${RED}❌ 前端服务未运行${NC}"
    fi

    echo ""
    echo -e "${YELLOW}💡 使用以下命令查看日志:${NC}"
    echo "  后端日志: tail -f $SCRIPT_DIR/backend.log"
    echo "  前端日志: tail -f $SCRIPT_DIR/frontend.log"
}

# 显示帮助信息
show_help() {
    echo "StarshipPlan 本地部署脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start     启动所有服务"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  status    显示服务状态"
    echo "  backend   仅启动后端服务"
    echo "  frontend  仅启动前端服务"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start      # 启动前后端服务"
    echo "  $0 status     # 查看服务状态"
    echo "  $0 stop       # 停止所有服务"
}

# 主函数
main() {
    local command=${1:-"help"}

    echo -e "${GREEN}"
    echo "================================"
    echo "  StarshipPlan 本地部署"
    echo "================================"
    echo -e "${NC}"

    case "$command" in
        "start")
            stop_services
            start_backend
            start_frontend
            show_status
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            start_backend
            start_frontend
            show_status
            ;;
        "status")
            show_status
            ;;
        "backend")
            stop_services
            start_backend
            ;;
        "frontend")
            stop_services
            start_frontend
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo -e "${RED}❌ 未知命令: $command${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
