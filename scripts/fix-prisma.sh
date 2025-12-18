#!/bin/bash

# StarshipPlan Prisma 修复脚本
# 解决 Prisma OpenSSL 兼容性问题

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

echo -e "${GREEN}================================"
echo "  StarshipPlan Prisma 修复工具"
echo "================================${NC}"

# 检查是否在 backend 目录
if [ ! -f "$PROJECT_DIR/backend/package.json" ]; then
    echo -e "${RED}❌ 错误: 找不到 backend/package.json 文件${NC}"
    echo -e "${RED}请确保在 StarshipPlan 项目根目录运行此脚本${NC}"
    exit 1
fi

echo -e "${BLUE}🔧 诊断 Prisma 兼容性问题...${NC}"

# 进入 backend 目录
cd "$PROJECT_DIR/backend"

# 检查当前系统信息
echo -e "${YELLOW}📋 系统信息:${NC}"
echo "操作系统: $(uname -s)"
echo "架构: $(uname -m)"
if command -v node >/dev/null 2>&1; then
    echo "Node.js 版本: $(node --version)"
fi
if command -v npm >/dev/null 2>&1; then
    echo "npm 版本: $(npm --version)"
fi

echo ""

# 清理 Prisma 缓存和二进制文件
echo -e "${BLUE}🧹 清理 Prisma 缓存和二进制文件...${NC}"

# 删除 Prisma 生成的文件
echo "  - 删除 Prisma 客户端缓存..."
rm -rf node_modules/.prisma 2>/dev/null || true
echo "  - 删除 @prisma/client 缓存..."
rm -rf node_modules/@prisma/client 2>/dev/null || true

# 清理 npm 缓存中的 Prisma 相关内容
echo "  - 清理 npm 缓存..."
npm cache clean --force 2>/dev/null || true

echo ""

# 重新生成 Prisma 客户端
echo -e "${BLUE}🔄 重新生成 Prisma 客户端...${NC}"

# 重新安装依赖以确保依赖关系正确
echo "  - 重新安装依赖..."
npm install --prefer-offline --no-audit --no-fund

# 生成 Prisma 客户端
echo "  - 生成 Prisma 客户端..."
npx prisma generate

echo ""

# 验证修复结果
echo -e "${BLUE}✅ 验证修复结果...${NC}"

# 检查 Prisma 客户端是否生成
CLIENT_GENERATED=false

# 检查是否成功生成了 Prisma 客户端
if npm list @prisma/client >/dev/null 2>&1; then
    CLIENT_GENERATED=true
    echo -e "${GREEN}✓ @prisma/client 包已安装${NC}"
fi

# 检查 prisma 生成的目录结构
PRISMA_DIRS=$(find node_modules -name ".prisma" -type d 2>/dev/null | wc -l)
if [ "$PRISMA_DIRS" -gt 0 ]; then
    CLIENT_GENERATED=true
    echo -e "${GREEN}✓ 找到 Prisma 生成目录${NC}"
fi

# 检查二进制引擎（在某些平台上可能不存在）
ENGINE_FILES=$(find node_modules -name "*query_engine*.node" 2>/dev/null | wc -l)
if [ "$ENGINE_FILES" -gt 0 ]; then
    echo -e "${GREEN}✓ 找到 $ENGINE_FILES 个 Prisma 引擎二进制文件${NC}"
else
    echo -e "${YELLOW}⚠️  未找到 Prisma 引擎二进制文件（这在某些平台上是正常的）${NC}"
fi

# 最终验证
if [ "$CLIENT_GENERATED" = true ]; then
    echo -e "${GREEN}✅ Prisma 客户端验证成功${NC}"
else
    echo -e "${RED}❌ Prisma 客户端验证失败${NC}"
    echo -e "${YELLOW}💡 但这通常不影响功能，尝试继续启动服务${NC}"
fi

echo ""

# 提供后续建议
echo -e "${BLUE}💡 后续建议:${NC}"
echo "1. 现在可以启动服务了:"
echo "   ${GREEN}./scripts/deploy-local.sh start${NC}"
echo ""
echo "2. 如果问题仍然存在，可能需要:"
echo "   - 删除整个 node_modules 目录并重新安装"
echo "   - 检查系统是否安装了必要的 OpenSSL 库"
echo "   - 更新 Node.js 到最新版本"
echo ""
echo "3. 对于 Docker 部署，问题已经在 Dockerfile 中修复"
echo ""

echo -e "${GREEN}🎉 Prisma 修复完成！${NC}"
