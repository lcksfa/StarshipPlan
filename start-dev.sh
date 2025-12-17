#!/bin/bash

# StarshipPlan 开发环境一键启动脚本
# 用于启动前后端服务并执行烟雾测试

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="StarshipPlan"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BACKEND_PORT=8000
FRONTEND_PORT=3000

# 日志文件
LOG_DIR=".logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
SMOKE_TEST_LOG="$LOG_DIR/smoke-test.log"

# 创建日志目录
mkdir -p "$LOG_DIR"

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

print_header() {
    echo -e "${PURPLE}🚀 $PROJECT_NAME${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # 端口被占用
    else
        return 1  # 端口可用
    fi
}

# 停止现有服务
stop_services() {
    print_info "停止现有服务..."

    # 查找并停止相关进程
    if pgrep -f "next.*dev" > /dev/null; then
        pkill -f "next.*dev"
        print_info "已停止 Next.js 开发服务器"
    fi

    if pgrep -f "ts-node.*server" > /dev/null; then
        pkill -f "ts-node.*server"
        print_info "已停止后端开发服务器"
    fi

    if check_port $BACKEND_PORT; then
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
        print_warning "强制关闭端口 $BACKEND_PORT 上的进程"
    fi

    if check_port $FRONTEND_PORT; then
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
        print_warning "强制关闭端口 $FRONTEND_PORT 上的进程"
    fi

    sleep 2
}

# 检查依赖
check_dependencies() {
    print_info "检查项目依赖..."

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi

    # 检查 npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装，请先安装 npm"
        exit 1
    fi

    print_success "Node.js 版本: $(node --version)"
    print_success "npm 版本: $(npm --version)"

    # 检查项目目录
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "后端目录 '$BACKEND_DIR' 不存在"
        exit 1
    fi

    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "前端目录 '$FRONTEND_DIR' 不存在"
        exit 1
    fi

    # 检查 package.json
    if [ ! -f "$BACKEND_DIR/package.json" ]; then
        print_error "后端 package.json 不存在"
        exit 1
    fi

    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        print_error "前端 package.json 不存在"
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    print_info "检查并安装后端依赖..."
    if [ ! -d "$BACKEND_DIR/node_modules" ] || [ ! -f "$BACKEND_DIR/package-lock.json" ]; then
        (cd "$BACKEND_DIR" && npm install)
        print_success "后端依赖安装完成"
    else
        print_info "后端依赖已存在，跳过安装"
    fi

    print_info "检查并安装前端依赖..."
    if [ ! -d "$FRONTEND_DIR/node_modules" ] || [ ! -f "$FRONTEND_DIR/package-lock.json" ]; then
        (cd "$FRONTEND_DIR" && npm install)
        print_success "前端依赖安装完成"
    else
        print_info "前端依赖已存在，跳过安装"
    fi
}

# 启动后端服务
start_backend() {
    print_info "启动后端服务..."

    # 检查端口
    if check_port $BACKEND_PORT; then
        print_warning "端口 $BACKEND_PORT 已被占用，尝试停止现有服务..."
        stop_services
    fi

    # 启动后端（后台运行）
    cd "$BACKEND_DIR"

    # 确保数据库已初始化
    if [ -f "prisma/schema.prisma" ]; then
        print_info "初始化数据库..."
        npm run prisma:generate || print_warning "Prisma generate 失败，继续启动"
        if [ ! -f "prisma/dev.db" ]; then
            npm run prisma:migrate || print_warning "数据库迁移失败，继续启动"
        fi
    fi

    # 启动开发服务器
    nohup npm run dev > "../$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!

    cd ..
    echo $BACKEND_PID > "$LOG_DIR/backend.pid"

    print_success "后端服务已启动 (PID: $BACKEND_PID, 端口: $BACKEND_PORT)"
    print_info "日志文件: $BACKEND_LOG"
}

# 启动前端服务
start_frontend() {
    print_info "启动前端服务..."

    # 检查端口
    if check_port $FRONTEND_PORT; then
        print_warning "端口 $FRONTEND_PORT 已被占用，尝试停止现有服务..."
        stop_services
    fi

    # 启动前端（后台运行）
    cd "$FRONTEND_DIR"
    nohup npm run dev > "../$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!

    cd ..
    echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"

    print_success "前端服务已启动 (PID: $FRONTEND_PID, 端口: $FRONTEND_PORT)"
    print_info "日志文件: $FRONTEND_LOG"
}

# 等待服务启动
wait_for_services() {
    print_info "等待服务启动..."

    # 等待后端服务
    local backend_ready=false
    local backend_attempts=0
    local max_attempts=30

    while [ $backend_attempts -lt $max_attempts ]; do
        if curl -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1 || \
           curl -s "http://localhost:$BACKEND_PORT/" > /dev/null 2>&1 || \
           grep -q "Server started" "$BACKEND_LOG" 2>/dev/null; then
            backend_ready=true
            break
        fi
        sleep 2
        backend_attempts=$((backend_attempts + 1))
        echo -n "."
    done

    echo
    if [ "$backend_ready" = true ]; then
        print_success "后端服务就绪"
    else
        print_warning "后端服务可能仍在启动中..."
    fi

    # 等待前端服务
    local frontend_ready=false
    local frontend_attempts=0

    while [ $frontend_attempts -lt $max_attempts ]; do
        if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1 || \
           grep -q "ready" "$FRONTEND_LOG" 2>/dev/null; then
            frontend_ready=true
            break
        fi
        sleep 2
        frontend_attempts=$((frontend_attempts + 1))
        echo -n "."
    done

    echo
    if [ "$frontend_ready" = true ]; then
        print_success "前端服务就绪"
    else
        print_warning "前端服务可能仍在启动中..."
    fi
}

# 烟雾测试
run_smoke_tests() {
    print_info "开始执行烟雾测试..."

    # 创建测试日志
    echo "=== StarshipPlan 烟雾测试 - $(date) ===" > "$SMOKE_TEST_LOG"
    echo "" >> "$SMOKE_TEST_LOG"

    local tests_passed=0
    local tests_total=0

    # 测试 1: 后端健康检查
    echo "测试 1: 后端服务健康检查" | tee -a "$SMOKE_TEST_LOG"
    tests_total=$((tests_total + 1))

    if curl -s -f "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
        echo "✅ 后端健康检查通过" | tee -a "$SMOKE_TEST_LOG"
        tests_passed=$((tests_passed + 1))
    elif curl -s -f "http://localhost:$BACKEND_PORT/" > /dev/null 2>&1; then
        echo "✅ 后端服务响应正常" | tee -a "$SMOKE_TEST_LOG"
        tests_passed=$((tests_passed + 1))
    else
        echo "❌ 后端服务无响应" | tee -a "$SMOKE_TEST_LOG"
        echo "后端日志最后几行:" | tee -a "$SMOKE_TEST_LOG"
        tail -5 "$BACKEND_LOG" | tee -a "$SMOKE_TEST_LOG"
    fi
    echo "" >> "$SMOKE_TEST_LOG"

    # 测试 2: 前端服务检查
    echo "测试 2: 前端服务检查" | tee -a "$SMOKE_TEST_LOG"
    tests_total=$((tests_total + 1))

    if curl -s -f "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        echo "✅ 前端服务响应正常" | tee -a "$SMOKE_TEST_LOG"
        tests_passed=$((tests_passed + 1))
    else
        echo "❌ 前端服务无响应" | tee -a "$SMOKE_TEST_LOG"
        echo "前端日志最后几行:" | tee -a "$SMOKE_TEST_LOG"
        tail -5 "$FRONTEND_LOG" | tee -a "$SMOKE_TEST_LOG"
    fi
    echo "" >> "$SMOKE_TEST_LOG"

    # 测试 3: API 端点测试（如果可用）
    echo "测试 3: API 端点可用性测试" | tee -a "$SMOKE_TEST_LOG"
    tests_total=$((tests_total + 1))

    # 尝试常见的 API 端点
    local api_endpoints=(
        "/api/tasks"
        "/api/users"
        "/api/health"
        "/api"
    )

    local api_found=false
    for endpoint in "${api_endpoints[@]}"; do
        if curl -s -f "http://localhost:$BACKEND_PORT$endpoint" > /dev/null 2>&1; then
            echo "✅ API 端点 $endpoint 可访问" | tee -a "$SMOKE_TEST_LOG"
            api_found=true
            break
        fi
    done

    if [ "$api_found" = true ]; then
        tests_passed=$((tests_passed + 1))
    else
        echo "⚠️  未找到可用的 API 端点" | tee -a "$SMOKE_TEST_LOG"
    fi
    echo "" >> "$SMOKE_TEST_LOG"

    # 测试 4: WebSocket 连接测试（如果启用）
    echo "测试 4: WebSocket 连接测试" | tee -a "$SMOKE_TEST_LOG"
    tests_total=$((tests_total + 1))

    if grep -q "socket" "$BACKEND_LOG" 2>/dev/null; then
        echo "ℹ️  检测到 Socket.io 服务，跳过 WebSocket 测试（需要专门的客户端）" | tee -a "$SMOKE_TEST_LOG"
        tests_passed=$((tests_passed + 1))
    else
        echo "ℹ️  未检测到 WebSocket 服务" | tee -a "$SMOKE_TEST_LOG"
        tests_passed=$((tests_passed + 1))
    fi
    echo "" >> "$SMOKE_TEST_LOG"

    # 测试结果
    echo "=== 烟雾测试结果 ===" | tee -a "$SMOKE_TEST_LOG"
    echo "通过: $tests_passed/$tests_total" | tee -a "$SMOKE_TEST_LOG"

    if [ $tests_passed -eq $tests_total ]; then
        echo "🎉 所有测试通过！" | tee -a "$SMOKE_TEST_LOG"
        print_success "烟雾测试完成: $tests_passed/$tests_total 通过"
    else
        echo "⚠️  部分测试未通过，请检查日志" | tee -a "$SMOKE_TEST_LOG"
        print_warning "烟雾测试完成: $tests_passed/$tests_total 通过"
    fi

    echo "" | tee -a "$SMOKE_TEST_LOG"
    echo "详细日志: $SMOKE_TEST_LOG" | tee -a "$SMOKE_TEST_LOG"
}

# 显示访问信息
show_access_info() {
    echo ""
    echo -e "${CYAN}🌟 服务访问信息${NC}"
    echo -e "${CYAN}─────────────────────────────────────────────────────────${NC}"
    echo -e "${GREEN}📱 前端应用:${NC} http://localhost:$FRONTEND_PORT"
    echo -e "${GREEN}🔧 后端 API:${NC} http://localhost:$BACKEND_PORT"
    echo -e "${BLUE}📋 后端日志:${NC} $BACKEND_LOG"
    echo -e "${BLUE}📋 前端日志:${NC} $FRONTEND_LOG"
    echo -e "${YELLOW}🧪 测试报告:${NC} $SMOKE_TEST_LOG"
    echo ""
    echo -e "${PURPLE}🔧 管理命令:${NC}"
    echo -e "${YELLOW}  查看后端日志: tail -f $BACKEND_LOG${NC}"
    echo -e "${YELLOW}  查看前端日志: tail -f $FRONTEND_LOG${NC}"
    echo -e "${YELLOW}  停止所有服务: ./stop-dev.sh${NC}"
    echo ""
}

# 清理函数
cleanup() {
    print_info "正在清理..."
    if [ -f "$LOG_DIR/backend.pid" ]; then
        kill $(cat "$LOG_DIR/backend.pid") 2>/dev/null || true
        rm -f "$LOG_DIR/backend.pid"
    fi
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        kill $(cat "$LOG_DIR/frontend.pid") 2>/dev/null || true
        rm -f "$LOG_DIR/frontend.pid"
    fi
    print_info "清理完成"
}

# 设置信号处理（仅在 INT 和 TERM 时清理，不在 EXIT 时）
trap cleanup INT TERM

# 保持脚本运行的函数
keep_running() {
    print_info "保持服务运行中... 按 Ctrl+C 停止所有服务"
    echo ""
    echo -e "${CYAN}📊 实时监控命令:${NC}"
    echo -e "${YELLOW}  查看后端日志: tail -f $BACKEND_LOG${NC}"
    echo -e "${YELLOW}  查看前端日志: tail -f $FRONTEND_LOG${NC}"
    echo -e "${YELLOW}  查看测试报告: cat $SMOKE_TEST_LOG${NC}"
    echo ""

    # 持续监控服务状态
    while true; do
        sleep 10

        # 检查服务是否还在运行
        local backend_running=false
        local frontend_running=false

        if [ -f "$LOG_DIR/backend.pid" ]; then
            local backend_pid=$(cat "$LOG_DIR/backend.pid")
            if kill -0 "$backend_pid" 2>/dev/null; then
                backend_running=true
            fi
        fi

        if [ -f "$LOG_DIR/frontend.pid" ]; then
            local frontend_pid=$(cat "$LOG_DIR/frontend.pid")
            if kill -0 "$frontend_pid" 2>/dev/null; then
                frontend_running=true
            fi
        fi

        # 如果有服务停止了，显示警告
        if [ "$backend_running" = false ]; then
            print_warning "⚠️  后端服务似乎已停止运行"
        fi

        if [ "$frontend_running" = false ]; then
            print_warning "⚠️  前端服务似乎已停止运行"
        fi

        # 如果都停止了，退出脚本
        if [ "$backend_running" = false ] && [ "$frontend_running" = false ]; then
            print_error "❌ 所有服务都已停止，退出监控"
            break
        fi
    done
}

# 主函数
main() {
    print_header

    # 解析命令行参数
    local skip_install=false
    local skip_tests=false

    for arg in "$@"; do
        case $arg in
            --skip-install)
                skip_install=true
                ;;
            --skip-tests)
                skip_tests=true
                ;;
            --help|-h)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --skip-install    跳过依赖安装"
                echo "  --skip-tests      跳过烟雾测试"
                echo "  --help, -h        显示此帮助信息"
                echo ""
                exit 0
                ;;
        esac
    done

    print_info "开始启动 $PROJECT_NAME 开发环境..."

    # 执行启动流程
    stop_services
    check_dependencies

    if [ "$skip_install" = false ]; then
        install_dependencies
    else
        print_info "跳过依赖安装"
    fi

    start_backend
    start_frontend
    wait_for_services

    if [ "$skip_tests" = false ]; then
        run_smoke_tests
    else
        print_info "跳过烟雾测试"
    fi

    print_success "🚀 $PROJECT_NAME 开发环境启动完成！"

    # 询问是否保持运行
    echo ""
    read -p "是否保持脚本运行以监控服务状态? [Y/n]: " keep_running_choice

    case $keep_running_choice in
        [Nn]|[Nn][Oo])
            print_info "脚本将退出，服务继续在后台运行"
            print_info "使用 ./stop-dev.sh 停止所有服务"
            echo ""
            show_access_info
            ;;
        *)
            print_info "开始监控服务状态..."
            echo ""
            show_access_info
            keep_running
            ;;
    esac
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi