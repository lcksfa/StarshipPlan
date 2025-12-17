#!/bin/bash

# StarshipPlan 后台启动脚本
# 在后台启动前后端服务，不保持终端占用

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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
    echo -e "${PURPLE}🚀 StarshipPlan 后台启动${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
}

# 主函数
main() {
    print_header

    print_info "在后台启动前后端服务..."

    # 调用主启动脚本的后台模式
    # 使用 nohup 确保脚本在后台持续运行
    nohup ./start-dev.sh --skip-install > /dev/null 2>&1 &
    BG_PID=$!

    # 等待服务启动
    print_info "等待服务启动..."
    sleep 15

    # 检查服务是否启动成功
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "✅ 前端服务启动成功"
    else
        print_warning "⚠️  前端服务可能还在启动中"
    fi

    if curl -s http://localhost:8000 > /dev/null 2>&1; then
        print_success "✅ 后端服务启动成功"
    else
        print_warning "⚠️  后端服务可能还在启动中"
    fi

    echo ""
    echo -e "${CYAN}🌟 服务访问信息${NC}"
    echo -e "${CYAN}─────────────────────────────────────────────────────────${NC}"
    echo -e "${GREEN}📱 前端应用:${NC} http://localhost:3000"
    echo -e "${GREEN}🔧 后端 API:${NC} http://localhost:8000"
    echo ""
    echo -e "${BLUE}📋 查看日志:${NC}"
    echo -e "${YELLOW}  tail -f .logs/backend.log${NC}"
    echo -e "${YELLOW}  tail -f .logs/frontend.log${NC}"
    echo ""
    echo -e "${PURPLE}🔧 停止服务:${NC}"
    echo -e "${YELLOW}  ./stop-dev.sh${NC}"
    echo ""

    print_success "🎉 服务已在后台启动！"
    print_info "使用 ./stop-dev.sh 停止所有服务"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # 检查主启动脚本是否存在
    if [ ! -f "./start-dev.sh" ]; then
        print_error "❌ 找不到 start-dev.sh 脚本"
        exit 1
    fi

    # 确保主启动脚本有执行权限
    chmod +x ./start-dev.sh

    main "$@"
fi