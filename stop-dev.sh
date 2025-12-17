#!/bin/bash

# StarshipPlan 开发环境停止脚本
# 用于停止前后端服务

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="StarshipPlan"
LOG_DIR=".logs"
BACKEND_PID_FILE="$LOG_DIR/backend.pid"
FRONTEND_PID_FILE="$LOG_DIR/frontend.pid"

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 停止服务
stop_service() {
    local pid_file=$1
    local service_name=$2
    local port=$3

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            print_info "停止 $service_name (PID: $pid)..."
            kill "$pid"
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "$service_name 未响应，强制终止..."
                kill -9 "$pid"
            fi
            print_success "$service_name 已停止"
        else
            print_warning "$service_name 进程不存在 (PID: $pid)"
        fi
        rm -f "$pid_file"
    fi

    # 检查端口
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_info "端口 $port 仍有进程，尝试终止..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
}

# 主函数
main() {
    echo -e "${BLUE}🛑 停止 $PROJECT_NAME 开发环境${NC}"
    echo "═══════════════════════════════════════════════════════════════"

    # 停止所有相关进程
    print_info "查找并停止所有相关进程..."

    # 停止 Next.js 开发服务器
    if pgrep -f "next.*dev" > /dev/null; then
        print_info "停止 Next.js 开发服务器..."
        pkill -f "next.*dev"
        print_success "Next.js 开发服务器已停止"
    fi

    # 停止后端开发服务器
    if pgrep -f "ts-node.*server" > /dev/null; then
        print_info "停止后端开发服务器..."
        pkill -f "ts-node.*server"
        print_success "后端开发服务器已停止"
    fi

    # 通过 PID 文件停止服务
    stop_service "$BACKEND_PID_FILE" "后端服务" "8000"
    stop_service "$FRONTEND_PID_FILE" "前端服务" "3000"

    # 检查是否还有相关进程
    local remaining_processes=false
    if pgrep -f "next.*dev" > /dev/null || pgrep -f "ts-node.*server" > /dev/null; then
        remaining_processes=true
        print_warning "仍有相关进程在运行"
        print_info "使用以下命令查看："
        echo "  ps aux | grep 'next.*dev'"
        echo "  ps aux | grep 'ts-node.*server'"
    fi

    # 清理临时文件
    if [ -d "$LOG_DIR" ]; then
        print_info "清理临时文件..."
        rm -f "$LOG_DIR"/*.pid
    fi

    if [ "$remaining_processes" = false ]; then
        print_success "🎉 所有服务已成功停止！"
    else
        print_warning "⚠️  部分服务可能仍在运行，请手动检查"
    fi

    echo ""
    print_info "重新启动开发环境请运行: ./start-dev.sh"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi