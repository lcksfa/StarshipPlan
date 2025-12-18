#!/bin/bash

# StarshipPlan 系统服务安装脚本
# 将 StarshipPlan 安装为系统服务，实现开机自启

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 检查系统类型
detect_system() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v systemctl &> /dev/null; then
            SYSTEM="systemd"
        elif command -v service &> /dev/null; then
            SYSTEM="init.d"
        else
            log_error "不支持的系统，无法安装为系统服务"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        SYSTEM="launchd"
    else
        log_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi

    log_info "检测到系统类型: $SYSTEM"
}

# 创建 systemd 服务
create_systemd_service() {
    log_info "创建 systemd 服务..."

    # 确保服务目录存在
    sudo mkdir -p /etc/systemd/system

    # 创建服务文件
    cat | sudo tee /etc/systemd/system/starship-plan.service > /dev/null << EOF
[Unit]
Description=StarshipPlan - 小学生习惯管理系统
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PWD
Environment=NODE_ENV=production
Environment=PORT=8000
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=starship-plan

# 资源限制
LimitNOFILE=65536
LimitNPROC=4096

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PWD/backend

[Install]
WantedBy=multi-user.target
EOF

    # 重新加载 systemd
    sudo systemctl daemon-reload

    # 启用服务
    sudo systemctl enable starship-plan

    log_success "systemd 服务创建完成"
    log_info "管理命令:"
    echo "  sudo systemctl start starship-plan     - 启动服务"
    echo "  sudo systemctl stop starship-plan      - 停止服务"
    echo "  sudo systemctl restart starship-plan   - 重启服务"
    echo "  sudo systemctl status starship-plan    - 查看状态"
    echo "  journalctl -u starship-plan -f         - 查看日志"
}

# 创建 init.d 脚本 (适用于 SysVinit)
create_initd_script() {
    log_info "创建 init.d 启动脚本..."

    cat | sudo tee /etc/init.d/starship-plan > /dev/null << 'EOF'
#!/bin/bash
# StarshipPlan init.d 服务脚本

# 描述
### BEGIN INIT INFO
# Provides:          starship-plan
# Required-Start:    $network
# Required-Stop:     $network
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: StarshipPlan 小学生习惯管理系统
# Description:       StarshipPlan 是一个专为家庭内部使用的小学生习惯管理系统，采用太空冒险主题的游戏化设计。
### END INIT INFO

# 脚本变量
NAME="starship-plan"
DAEMON_USER="$USER"
DAEMON_DIR="$PWD"
DAEMON_ARGS="dev"
NODE_BIN="/usr/bin/node"
NPM_BIN="/usr/bin/npm"
PIDFILE="$DAEMON_DIR/.starship-plan.pid"
LOGFILE="$DAEMON_DIR/starship-plan.log"

# 检查可执行文件
if [ ! -x "$NPM_BIN" ]; then
    echo "$NPM_BIN not found"
    exit 1
fi

# 检查用户
if [ -n "$DAEMON_USER" ] && [ "$(id -u)" -ne "$(id -u $DAEMON_USER)" ]; then
    echo "Must run as $DAEMON_USER or root"
    exit 1
fi

# 函数定义
start_service() {
    if [ -f "$PIDFILE" ]; then
        echo "$NAME is already running (pid: $(cat $PIDFILE))"
        exit 0
    fi

    echo "Starting $NAME..."
    cd "$DAEMON_DIR"
    nohup $NPM_BIN run $DAEMON_ARGS > "$LOGFILE" 2>&1 &
    echo $! > "$PIDFILE"
    echo "$NAME started with pid $(cat $PIDFILE)"
}

stop_service() {
    if [ ! -f "$PIDFILE" ]; then
        echo "$NAME is not running"
        return 0
    fi

    PID=$(cat "$PIDFILE)
    echo "Stopping $NAME (pid: $PID)..."
    kill "$PID"

    # 等待进程停止
    for i in 1 2 3 4 5; do
        if kill -0 "$PID" 2>/dev/null; then
            sleep 1
        else
            break
        fi
    done

    # 强制停止
    if kill -0 "$PID" 2>/dev/null; then
        echo "Force stopping $NAME..."
        kill -9 "$PID"
    fi

    rm -f "$PIDFILE"
    echo "$NAME stopped"
}

status_service() {
    if [ ! -f "$PIDFILE" ]; then
        echo "$NAME is not running"
        return 1
    fi

    PID=$(cat "$PIDFILE)
    if kill -0 "$PID" 2>/dev/null; then
        echo "$NAME is running (pid: $PID)"
        return 0
    else
        echo "$NAME is not running (stale pid file)"
        rm -f "$PIDFILE"
        return 1
    fi
}

case "$1" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        stop_service
        sleep 2
        start_service
        ;;
    status)
        status_service
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac

exit 0
EOF

    # 添加执行权限
    sudo chmod +x /etc/init.d/starship-plan

    # 启用服务
    sudo update-rc.d starship-plan defaults

    log_success "init.d 启动脚本创建完成"
    log_info "管理命令:"
    echo "  sudo service starship-plan start   - 启动服务"
    echo "  sudo service starship-plan stop    - 停止服务"
    echo "  sudo service starship-plan restart  - 重启服务"
    echo "  sudo service starship-plan status  - 查看状态"
}

# 创建 launchd 配置 (macOS)
create_launchd_service() {
    log_info "创建 launchd 服务..."

    # 创建 LaunchAgent 配置目录
    mkdir -p "$HOME/Library/LaunchAgents"

    # 创建 LaunchAgent 配置文件
    cat > "$HOME/Library/LaunchAgents/com.starship-plan.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.starship-plan</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/npm</string>
        <string>run</string>
        <string>dev</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PWD</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>8000</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$PWD/starship-plan.log</string>
    <key>StandardErrorPath</key>
    <string>$PWD/starship-plan.err</string>
    <key>HardResourceLimits</key>
    <dict>
        <key>NumberOfFiles</key>
        <integer>65536</integer>
        <key>NumberOfProcesses</key>
        <integer>4096</integer>
    </dict>
</dict>
</plist>
EOF

    # 加载服务
    launchctl load -w "$HOME/Library/LaunchAgents/com.starship-plan.plist"

    log_success "launchd 服务创建完成"
    log_info "管理命令:"
    echo "  launchctl start com.starship-plan      - 启动服务"
    echo "  launchctl stop com.starship-plan       - 停止服务"
    echo "  launchctl restart com.starship-plan    - 重启服务"
    echo "  launchctl list | grep starship-plan   - 查看状态"
}

# 创建卸载脚本
create_uninstall_script() {
    log_info "创建卸载脚本..."

    cat > uninstall.sh << 'EOF'
#!/bin/bash

# StarshipPlan 卸载脚本

echo "卸载 StarshipPlan 系统服务..."

if command -v systemctl &> /dev/null; then
    echo "移除 systemd 服务..."
    sudo systemctl stop starship-plan 2>/dev/null || true
    sudo systemctl disable starship-plan 2>/dev/null || true
    sudo rm -f /etc/systemd/system/starship-plan.service
    sudo systemctl daemon-reload
fi

if command -v service &> /dev/null; then
    echo "移除 init.d 服务..."
    sudo service starship-plan stop 2>/dev/null || true
    sudo update-rc.d -f starship-plan remove 2>/dev/null || true
    sudo rm -f /etc/init.d/starship-plan
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "移除 launchd 服务..."
    launchctl unload -w "$HOME/Library/LaunchAgents/com.starship-plan.plist" 2>/dev/null || true
    rm -f "$HOME/Library/LaunchAgents/com.starship-plan.plist"
fi

echo "系统服务卸载完成"
echo "请手动删除项目文件和数据"
EOF

    chmod +x uninstall.sh
    log_success "卸载脚本创建完成 (./uninstall.sh)"
}

# 主函数
main() {
    echo "🚀 StarshipPlan 系统服务安装工具"
    echo "=============================="

    # 检测系统类型
    detect_system

    # 根据系统类型创建服务
    case "$SYSTEM" in
        "systemd")
            create_systemd_service
            ;;
        "init.d")
            create_initd_script
            ;;
        "launchd")
            create_launchd_service
            ;;
        *)
            log_error "不支持的系统类型"
            exit 1
            ;;
    esac

    # 创建卸载脚本
    create_uninstall_script

    log_success "🎉 系统服务安装完成！"
    echo ""
    echo "下一步:"
    echo "1. 启动服务: sudo systemctl start starship-plan"
    echo "2. 检查状态: sudo systemctl status starship-plan"
    echo "3. 查看日志: journalctl -u starship-plan -f"
    echo ""
    echo "如需卸载，请运行: ./uninstall.sh"
}

# 检查是否以 root 身份运行
if [ "$(id -u)" -eq 0 ]; then
    log_error "请不要以 root 身份运行此脚本"
    log_info "请使用普通用户运行，脚本会在需要时请求权限"
    exit 1
fi

# 执行主函数
main "$@"
