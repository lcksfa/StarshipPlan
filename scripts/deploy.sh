#!/bin/bash

# StarshipPlan 一键部署脚本
# 适用于家庭环境的自动化部署工具

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."

    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
    else
        log_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请访问 https://nodejs.org 下载安装"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2)
    if [[ ${NODE_VERSION%%.*} -lt 18 ]]; then
        log_error "Node.js 版本过低，需要 18.0 或更高版本"
        exit 1
    fi

    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi

    # 检查 Git
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装，请访问 https://git-scm.com 下载安装"
        exit 1
    fi

    log_success "系统要求检查通过 ($OS, Node.js $NODE_VERSION)"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."

    # 安装根目录依赖
    if [ -f "package.json" ]; then
        log_info "安装根目录依赖..."
        npm install
    fi

    # 安装前端依赖
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        log_info "安装前端依赖..."
        cd frontend
        npm install
        cd ..
    fi

    # 安装后端依赖
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        log_info "安装后端依赖..."
        cd backend
        npm install
        cd ..
    fi

    log_success "依赖安装完成"
}

# 初始化数据库
setup_database() {
    log_info "初始化数据库..."

    cd backend

    # 检查是否已存在数据库文件
    if [ -f "starship-plan.db" ]; then
        log_warning "数据库文件已存在，跳过初始化"
    else
        # 生成 Prisma 客户端
        npx prisma generate

        # 运行数据库迁移
        npx prisma db push

        log_success "数据库初始化完成"
    fi

    cd ..
}

# 构建项目
build_project() {
    log_info "构建项目..."

    # 构建前端
    log_info "构建前端应用..."
    cd frontend
    npm run build
    cd ..

    # 构建后端
    log_info "构建后端应用..."
    cd backend
    npm run build
    cd ..

    log_success "项目构建完成"
}

# 创建启动脚本
create_startup_scripts() {
    log_info "创建启动脚本..."

    # 创建启动脚本
    cat > start.sh << 'EOF'
#!/bin/bash

# StarshipPlan 启动脚本

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "安装前端依赖..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "安装后端依赖..."
    cd backend && npm install && cd ..
fi

# 启动服务
echo "启动 StarshipPlan 服务..."

# 启动后端服务（后台运行）
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端服务
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "StarshipPlan 已启动！"
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap 'echo "正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT

wait
EOF

    chmod +x start.sh
    log_success "启动脚本创建完成 (./start.sh)"

    # 创建停止脚本
    cat > stop.sh << 'EOF'
#!/bin/bash

# StarshipPlan 停止脚本

echo "停止 StarshipPlan 服务..."

# 查找并停止相关进程
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "ts-node server.ts" 2>/dev/null || true

echo "StarshipPlan 服务已停止"
EOF

    chmod +x stop.sh
    log_success "停止脚本创建完成 (./stop.sh)"
}

# 创建备份脚本
create_backup_scripts() {
    log_info "创建备份脚本..."

    # 创建备份目录
    mkdir -p backups

    # 创建备份脚本
    cat > backup.sh << 'EOF'
#!/bin/bash

# StarshipPlan 数据备份脚本

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/starship-plan-backup-$TIMESTAMP.tar.gz"

echo "开始备份 StarshipPlan 数据..."

# 创建备份
tar -czf "$BACKUP_FILE" \
    backend/starship-plan.db \
    docs/ \
    scripts/ \
    docker/ \
    2>/dev/null

if [ $? -eq 0 ]; then
    echo "备份完成: $BACKUP_FILE"
    echo "备份大小: $(du -h "$BACKUP_FILE" | cut -f1)"

    # 清理旧备份（保留最近10个）
    ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +11 | xargs rm -f 2>/dev/null || true
else
    echo "备份失败！"
    exit 1
fi
EOF

    chmod +x backup.sh
    log_success "备份脚本创建完成 (./backup.sh)"

    # 创建恢复脚本
    cat > restore.sh << 'EOF'
#!/bin/bash

# StarshipPlan 数据恢复脚本

if [ $# -eq 0 ]; then
    echo "用法: $0 <backup_file.tar.gz>"
    echo "可用的备份文件:"
    ls -la backups/*.tar.gz 2>/dev/null || echo "没有找到备份文件"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "错误: 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "开始恢复 StarshipPlan 数据..."
echo "恢复文件: $BACKUP_FILE"

# 停止服务
./stop.sh 2>/dev/null || true
sleep 2

# 恢复数据
tar -xzf "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "数据恢复完成"
    echo "重启服务..."
    ./start.sh
else
    echo "恢复失败！"
    exit 1
fi
EOF

    chmod +x restore.sh
    log_success "恢复脚本创建完成 (./restore.sh)"
}

# 创建监控脚本
create_monitoring_scripts() {
    log_info "创建监控脚本..."

    # 创建健康检查脚本
    cat > health-check.sh << 'EOF'
#!/bin/bash

# StarshipPlan 健康检查脚本

echo "StarshipPlan 健康检查"
echo "===================="

# 检查前端服务
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ 前端服务: 正常运行"
else
    echo "❌ 前端服务: 异常 (HTTP $FRONTEND_STATUS)"
fi

# 检查后端服务
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ 后端服务: 正常运行"
else
    echo "❌ 后端服务: 异常 (HTTP $BACKEND_STATUS)"
fi

# 检查数据库
if [ -f "backend/starship-plan.db" ]; then
    DB_SIZE=$(du -h backend/starship-plan.db | cut -f1)
    echo "✅ 数据库: 正常 (大小: $DB_SIZE)"
else
    echo "❌ 数据库: 文件不存在"
fi

# 检查日志
if [ -f "backend/logs/app.log" ]; then
    LOG_SIZE=$(du -h backend/logs/app.log | cut -f1)
    echo "✅ 日志文件: 正常 (大小: $LOG_SIZE)"
else
    echo "⚠️  日志文件: 不存在"
fi

echo "===================="
echo "检查完成"
EOF

    chmod +x health-check.sh
    log_success "健康检查脚本创建完成 (./health-check.sh)"

    # 创建日志清理脚本
    cat > cleanup-logs.sh << 'EOF'
#!/bin/bash

# StarshipPlan 日志清理脚本

LOG_DIR="backend/logs"
RETENTION_DAYS=7

echo "清理 $RETENTION_DAYS 天前的日志文件..."

if [ -d "$LOG_DIR" ]; then
    # 查找并删除旧日志
    DELETED_COUNT=$(find "$LOG_DIR" -name "*.log" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
    echo "已删除 $DELETED_COUNT 个旧日志文件"

    # 显示当前日志大小
    if [ -f "$LOG_DIR/app.log" ]; then
        SIZE=$(du -sh "$LOG_DIR" | cut -f1)
        echo "当前日志目录大小: $SIZE"
    fi
else
    echo "日志目录不存在: $LOG_DIR"
fi

echo "日志清理完成"
EOF

    chmod +x cleanup-logs.sh
    log_success "日志清理脚本创建完成 (./cleanup-logs.sh)"
}

# 创建更新脚本
create_update_scripts() {
    log_info "创建更新脚本..."

    # 创建更新脚本
    cat > update.sh << 'EOF'
#!/bin/bash

# StarshipPlan 更新脚本

echo "开始更新 StarshipPlan..."

# 备份当前数据
echo "创建更新前备份..."
./backup.sh

# 拉取最新代码
echo "拉取最新代码..."
git pull origin main

# 更新依赖
echo "更新项目依赖..."
npm install

if [ -d "frontend" ]; then
    cd frontend
    npm install
    cd ..
fi

if [ -d "backend" ]; then
    cd backend
    npm install

    # 数据库迁移
    echo "执行数据库迁移..."
    npx prisma db push
    cd ..
fi

# 重新构建
echo "重新构建项目..."
./build.sh

echo "更新完成！"
echo "如遇到问题，可以使用以下命令恢复:"
echo "./restore.sh backups/starship-plan-backup-<latest>.tar.gz"
EOF

    chmod +x update.sh
    log_success "更新脚本创建完成 (./update.sh)"
}

# 主函数
main() {
    echo "🚀 StarshipPlan 一键部署工具"
    echo "============================="

    # 检查当前目录
    if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        log_error "请在 StarshipPlan 项目根目录运行此脚本"
        exit 1
    fi

    # 解析命令行参数
    case "${1:-full}" in
        "check")
            check_requirements
            ;;
        "install")
            install_dependencies
            ;;
        "db")
            setup_database
            ;;
        "build")
            build_project
            ;;
        "scripts")
            create_startup_scripts
            create_backup_scripts
            create_monitoring_scripts
            create_update_scripts
            ;;
        "full")
            log_info "开始完整部署流程..."
            check_requirements
            install_dependencies
            setup_database
            build_project
            create_startup_scripts
            create_backup_scripts
            create_monitoring_scripts
            create_update_scripts
            log_success "🎉 StarshipPlan 部署完成！"
            echo ""
            echo "快速启动命令:"
            echo "  ./start.sh     - 启动所有服务"
            echo "  ./stop.sh      - 停止所有服务"
            echo "  ./health-check.sh - 健康检查"
            echo "  ./backup.sh    - 备份数据"
            echo "  ./update.sh    - 更新系统"
            ;;
        "help"|"-h"|"--help")
            echo "StarshipPlan 部署工具"
            echo ""
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  full         - 完整部署 (默认)"
            echo "  check        - 检查系统要求"
            echo "  install      - 安装依赖"
            echo "  db           - 初始化数据库"
            echo "  build        - 构建项目"
            echo "  scripts      - 创建管理脚本"
            echo "  help         - 显示帮助信息"
            ;;
        *)
            log_error "未知选项: $1"
            echo "使用 '$0 help' 查看可用选项"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
