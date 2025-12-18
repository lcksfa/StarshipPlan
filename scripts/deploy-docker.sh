#!/bin/bash

# StarshipPlan Docker 部署脚本
# 统一的Docker部署方案

set -e

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
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
}

# 获取局域网IP
get_lan_ip() {
    local lan_ip

    # 尝试多种方法获取局域网IP
    if command -v ip >/dev/null 2>&1; then
        lan_ip=$(ip route get 1 | awk '{print $7}' | head -1)
    fi

    if [[ -z "$lan_ip" || "$lan_ip" == "127.0.0.1" ]]; then
        lan_ip=$(ifconfig | grep -E "inet.*192\.168\|inet.*10\.|inet.*172\." | awk '{print $2}' | head -1 | cut -d: -f2)
    fi

    if [[ -z "$lan_ip" || "$lan_ip" == "127.0.0.1" ]]; then
        lan_ip=$(hostname -I | awk '{print $1}')
    fi

    # 默认值
    if [[ -z "$lan_ip" || "$lan_ip" == "127.0.0.1" ]]; then
        lan_ip="192.168.1.29"
    fi

    echo "$lan_ip"
}

# 检查Docker环境
check_docker() {
    log_step "检查Docker环境..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker 服务未运行，请启动 Docker 服务"
        exit 1
    fi

    log_success "Docker环境检查通过"
}

# 创建环境配置
setup_environment() {
    log_step "设置环境配置..."

    # 创建环境变量文件
    if [[ ! -f .env ]]; then
        log_info "创建环境配置文件..."
        cat > .env << EOF
# StarshipPlan 环境配置
# 自动生成于 $(date)

# 网络配置
LAN_IP=$(get_lan_ip)

# 端口配置
BACKEND_PORT=8000
FRONTEND_PORT=3000
HTTP_PORT=80
HTTPS_PORT=443
ADMINER_PORT=8080
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# 应用配置
NODE_ENV=production
JWT_SECRET=starship-plan-default-secret-$(date +%s)
CORS_ORIGIN=http://\${LAN_IP}:3000,http://localhost:3000

# 前端配置
NEXT_PUBLIC_API_URL=http://\${LAN_IP}:8000
NEXT_PUBLIC_WS_URL=ws://\${LAN_IP}:8000
NEXT_PUBLIC_APP_NAME=StarshipPlan
NEXT_PUBLIC_APP_VERSION=1.0.0

# 监控配置
GRAFANA_PASSWORD=admin
EOF
        log_success "环境配置文件已创建"
    fi

    # 创建必要目录
    mkdir -p docker/{grafana/dashboards,grafana/datasources}
    mkdir -p logs backups
}

# 停止服务
stop_services() {
    log_step "停止现有服务..."

    cd "$(dirname "$0")/.."

    if docker compose -f docker/docker-compose.yml ps -q &>/dev/null; then
        docker compose -f docker/docker-compose.yml down --remove-orphans || true
        log_info "Docker服务已停止"
    fi

    # 停止单独运行的容器
    docker stop starship-backend starship-frontend starship-nginx 2>/dev/null || true
    docker rm starship-backend starship-frontend starship-nginx 2>/dev/null || true

    log_success "所有服务已停止"
}

# 部署服务
deploy_services() {
    local mode=${1:-basic}

    log_step "部署服务模式: $mode"

    cd "$(dirname "$0")/.."

    case $mode in
        "basic")
            log_info "部署基础服务（前端 + 后端）..."
            docker compose -f docker/docker-compose.yml up -d backend frontend
            ;;
        "nginx")
            log_info "部署带Nginx反向代理的服务..."
            docker compose -f docker/docker-compose.yml --profile nginx up -d
            ;;
        "full")
            log_info "部署完整服务（包含监控）..."
            docker compose -f docker/docker-compose.yml --profile nginx --profile monitoring --profile admin up -d
            ;;
        *)
            log_error "未知部署模式: $mode"
            log_info "可用模式: basic, nginx, full"
            exit 1
            ;;
    esac

    if [[ $? -eq 0 ]]; then
        log_success "服务部署成功"
    else
        log_error "服务部署失败"
        exit 1
    fi
}

# 检查服务状态
check_services() {
    log_step "检查服务状态..."

    cd "$(dirname "$0")/.."

    # 获取局域网IP
    LAN_IP=$(get_lan_ip)

    echo ""
    log_header "服务访问地址"

    # 检查后端服务
    if curl -s "http://localhost:8000/health" >/dev/null 2>&1; then
        log_success "后端服务: http://localhost:8000"
        log_success "后端服务(LAN): http://$LAN_IP:8000"
    else
        log_warning "后端服务: 启动中..."
    fi

    # 检查前端服务
    if curl -s "http://localhost:3000" >/dev/null 2>&1; then
        log_success "前端服务: http://localhost:3000"
        log_success "前端服务(LAN): http://$LAN_IP:3000"
    else
        log_warning "前端服务: 启动中..."
    fi

    echo ""
    log_header "容器运行状态"
    docker compose -f docker/docker-compose.yml ps

    echo ""
    log_header "常用命令"
    log_info "查看日志: docker compose -f docker/docker-compose.yml logs -f"
    log_info "重启服务: docker compose -f docker/docker-compose.yml restart"
    log_info "停止服务: $0 stop"
    log_info "重新部署: $0 deploy"
}

# 显示帮助信息
show_help() {
    echo "StarshipPlan Docker 部署脚本"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  deploy [mode]    部署服务"
    echo "    basic          部署基础服务（默认）"
    echo "    nginx          部署带Nginx反向代理"
    echo "    full           部署完整服务"
    echo "  stop             停止所有服务"
    echo "  restart          重启服务"
    echo "  logs             查看服务日志"
    echo "  status           检查服务状态"
    echo "  setup            仅设置环境"
    echo "  help             显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 deploy        # 部署基础服务"
    echo "  $0 deploy nginx   # 部署带Nginx的服务"
    echo "  $0 logs           # 查看日志"
    echo "  $0 stop           # 停止服务"
}

# 主函数
main() {
    local command=${1:-help}
    local option=${2:-basic}

    case $command in
        "setup")
            log_header "StarshipPlan Docker 环境设置"
            check_docker
            setup_environment
            log_success "环境设置完成"
            ;;
        "deploy")
            log_header "StarshipPlan Docker 部署"
            check_docker
            setup_environment
            stop_services
            deploy_services "$option"
            sleep 10
            check_services
            ;;
        "stop")
            log_header "停止 StarshipPlan 服务"
            stop_services
            ;;
        "restart")
            log_header "重启 StarshipPlan 服务"
            stop_services
            sleep 3
            deploy_services "$option"
            sleep 10
            check_services
            ;;
        "logs")
            cd "$(dirname "$0")/.."
            docker compose -f docker/docker-compose.yml logs -f
            ;;
        "status")
            log_header "StarshipPlan 服务状态"
            check_services
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 脚本入口
main "$@"
