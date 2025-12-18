#!/bin/bash

# StarshipPlan 本地开发调试启动脚本
# 专为开发环境设计，支持热重载和调试功能

set -e

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_PID_FILE="$PROJECT_DIR/.dev-backend.pid"
FRONTEND_PID_FILE="$PROJECT_DIR/.dev-frontend.pid"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_dev() {
    echo -e "${PURPLE}🛠  开发模式: $1${NC}"
}

# 获取局域网IP
get_lan_ip() {
    local lan_ip
    if command -v ip >/dev/null 2>&1; then
        lan_ip=$(ip route get 1 | awk '{print $7}' | head -1)
    elif command -v ifconfig >/dev/null 2>&1; then
        lan_ip=$(ifconfig | grep -E "inet.*broadcast" | awk '{print $2}' | head -1 | cut -d: -f2)
    else
        lan_ip="localhost"
    fi
    echo "$lan_ip"
}

# 检查端口是否被占用
check_port() {
    local port=$1
    # 使用netstat检查是否有进程在监听端口
    netstat -an 2>/dev/null | grep -E "^tcp.*:${port}.*LISTEN" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        return 0  # 端口被占用
    fi

    # 备用方法：使用lsof检查
    lsof -ti ":$port" >/dev/null 2>&1
    return $?  # 如果有进程占用端口，返回0，否则返回1
}

# 停止开发服务器
stop_dev_servers() {
    log_dev "停止现有开发服务器..."

    # 停止后端
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if ps -p $backend_pid > /dev/null 2>&1; then
            log_info "停止后端开发服务器 (PID: $backend_pid)"
            kill $backend_pid
            sleep 1
        fi
        rm -f "$BACKEND_PID_FILE"
    fi

    # 停止前端
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if ps -p $frontend_pid > /dev/null 2>&1; then
            log_info "停止前端开发服务器 (PID: $frontend_pid)"
            kill $frontend_pid
            sleep 1
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi

    log_success "开发服务器已停止"
}

# 启动后端开发服务器
start_backend_dev() {
    log_dev "启动后端开发服务器..."

    cd "$PROJECT_DIR/backend"

    # 检查端口
    if check_port 8000; then
        log_error "端口 8000 已被占用，请先停止相关服务"
        return 1
    fi

    # 设置开发环境变量
    export NODE_ENV=development
    export PORT=8000
    export DATABASE_URL="file:$PROJECT_DIR/backend/data/starship-plan.db"
    export JWT_SECRET="starship-plan-dev-secret"
    export ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://$(get_lan_ip):3000"

    # 创建必要目录
    mkdir -p data logs

    # 启动开发服务器（带文件监听和热重载）
    log_info "启动后端开发模式..."
    nohup npm run dev > "$SCRIPT_DIR/backend-dev.log" 2>&1 &
    local backend_pid=$!
    echo $backend_pid > "$BACKEND_PID_FILE"

    # 等待服务启动
    log_info "等待后端服务启动..."
    for i in {1..30}; do
        if curl -f http://localhost:8000/health >/dev/null 2>&1; then
            break
        fi
        sleep 1
        echo -n "."
    done
    echo

    if ps -p $backend_pid > /dev/null 2>&1; then
        log_success "后端开发服务器启动成功"
        log_info "📍 后端地址: http://localhost:8000"
        log_info "🌐 局域网地址: http://$(get_lan_ip):8000"
        log_info "🔍 后端日志: tail -f $SCRIPT_DIR/backend-dev.log"
    else
        log_error "后端开发服务器启动失败"
        return 1
    fi
}

# 启动前端开发服务器
start_frontend_dev() {
    log_dev "启动前端开发服务器..."

    cd "$PROJECT_DIR/frontend"

    # 检查端口
    if check_port 3000; then
        log_error "端口 3000 已被占用，请先停止相关服务"
        return 1
    fi

    # 设置开发环境变量
    export NODE_ENV=development
    export NEXT_PUBLIC_API_URL="http://$(get_lan_ip):8000"
    export NEXT_PUBLIC_WS_URL="ws://$(get_lan_ip):8000"
    export NEXT_PUBLIC_APP_NAME="StarshipPlan"
    export NEXT_PUBLIC_APP_VERSION="1.0.0-dev"

    # 启动开发服务器（明确指定端口3000）
    log_info "启动前端开发模式（带热重载）..."
    nohup npm run dev -- --port 3000 > "$SCRIPT_DIR/frontend-dev.log" 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > "$FRONTEND_PID_FILE"

    # 等待服务启动
    log_info "等待前端服务启动..."
    for i in {1..60}; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            break
        fi
        sleep 1
        echo -n "."
    done
    echo

    if ps -p $frontend_pid > /dev/null 2>&1; then
        log_success "前端开发服务器启动成功"
        log_info "🌐 前端地址: http://$(get_lan_ip):3000"
        log_info "🔍 前端日志: tail -f $SCRIPT_DIR/frontend-dev.log"
    else
        log_error "前端开发服务器启动失败"
        return 1
    fi
}

# 显示开发环境状态
show_dev_status() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}    StarshipPlan 开发环境状态${NC}"
    echo -e "${CYAN}================================${NC}"

    # 后端状态
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if ps -p $backend_pid > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 后端开发服务器运行中 (PID: $backend_pid)${NC}"
            echo -e "${GREEN}   📍 后端地址: http://localhost:8000${NC}"
            echo -e "${GREEN}   🌐 局域网地址: http://$(get_lan_ip):8000${NC}"
        else
            echo -e "${RED}❌ 后端开发服务器未运行${NC}"
            rm -f "$BACKEND_PID_FILE"
        fi
    else
        echo -e "${RED}❌ 后端开发服务器未运行${NC}"
    fi

    echo

    # 前端状态
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if ps -p $frontend_pid > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 前端开发服务器运行中 (PID: $frontend_pid)${NC}"
            echo -e "${GREEN}   🌐 前端地址: http://$(get_lan_ip):3000${NC}"
        else
            echo -e "${RED}❌ 前端开发服务器未运行${NC}"
            rm -f "$FRONTEND_PID_FILE"
        fi
    else
        echo -e "${RED}❌ 前端开发服务器未运行${NC}"
    fi

    echo

    # 开发工具提示
    echo -e "${CYAN}🛠️  开发工具:${NC}"
    echo -e "${CYAN}   后端日志: tail -f $SCRIPT_DIR/backend-dev.log${NC}"
    echo -e "${CYAN}   前端日志: tail -f $SCRIPT_DIR/frontend-dev.log${NC}"
    echo -e "${CYAN}   数据库查看: sqlite3 $PROJECT_DIR/backend/data/starship-plan.db${NC}"
    echo -e "${CYAN}   API测试: curl -H 'Authorization: Bearer mock-token-parent' http://localhost:8000/api/tasks${NC}"
}

# 清理开发日志
clean_logs() {
    log_info "清理开发日志..."
    rm -f "$SCRIPT_DIR/backend-dev.log" "$SCRIPT_DIR/frontend-dev.log"
    log_success "开发日志已清理"
}

# 安装依赖
install_deps() {
    log_info "检查并安装依赖..."

    # 后端依赖
    log_info "安装后端依赖..."
    cd "$PROJECT_DIR/backend"
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    # 前端依赖
    log_info "安装前端依赖..."
    cd "$PROJECT_DIR/frontend"
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    # 运行数据库迁移（如果需要）
    log_info "检查数据库状态..."
    cd "$PROJECT_DIR/backend"
    if [ ! -f "data/starship-plan.db" ] || [ ! -s "data/starship-plan.db" ]; then
        npx prisma migrate dev --name init
    fi

    log_success "依赖安装完成"
}

# 显示帮助信息
show_help() {
    cat << EOF

StarshipPlan 开发环境启动脚本

用法: $0 [命令] [选项]

命令:
  start           启动前后端开发服务器
  stop            停止开发服务器
  restart          重启开发服务器
  status          显示开发环境状态
  backend         仅启动后端开发服务器
  frontend        仅启动前端开发服务器
  logs            显示开发日志
  clean           清理开发日志
  install         安装依赖
  help            显示此帮助信息

开发特性:
  🔄 热重载支持        代码修改自动重启服务
  🔍 调试模式        启用详细日志和调试工具
  🌐 局域网访问      自动检测并配置局域网IP
  📊 状态监控        实时显示服务状态
  🛠️ 开发工具       集成常用开发工具

示例:
  $0 start            启动完整开发环境
  $0 restart          重启开发环境
  $0 status           查看服务状态
  $0 logs             查看实时日志
  $0 backend         仅启动后端
  $0 clean           清理日志文件

EOF
}

# 主函数
main() {
    local command="${1:-start}"

    # 检查项目目录
    if [ ! -f "$PROJECT_DIR/package.json" ]; then
        log_error "请从项目根目录运行此脚本"
        exit 1
    fi

    echo -e "${CYAN}"
    echo "================================"
    echo "    StarshipPlan 开发环境"
    echo "================================"
    echo -e "${NC}"

    case "$command" in
        "start")
            stop_dev_servers
            install_deps
            start_backend_dev
            start_frontend_dev
            show_dev_status
            ;;
        "stop")
            stop_dev_servers
            ;;
        "restart")
            stop_dev_servers
            sleep 2
            start_backend_dev
            start_frontend_dev
            show_dev_status
            ;;
        "status")
            show_dev_status
            ;;
        "backend")
            stop_dev_servers
            start_backend_dev
            ;;
        "frontend")
            stop_dev_servers
            start_frontend_dev
            ;;
        "logs")
            echo -e "${CYAN}📊 实时开发日志${NC}"
            echo -e "${CYAN}============================${NC}"

            if [ -f "$SCRIPT_DIR/backend-dev.log" ]; then
                echo -e "${BLUE}🔧 后端日志:${NC}"
                tail -f "$SCRIPT_DIR/backend-dev.log"
            else
                log_warning "后端日志文件不存在"
            fi
            ;;
        "clean")
            clean_logs
            ;;
        "install")
            install_deps
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            echo
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
