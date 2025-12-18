# StarshipPlan 生产环境 Dockerfile
# 专门用于后端API服务

# 构建阶段
FROM node:20 AS builder

WORKDIR /app

# 复制后端依赖文件
COPY backend/package*.json ./
# 安装所有依赖（包括devDependencies，因为构建需要）
RUN npm install

# 复制后端源码
COPY backend/ ./

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建后端应用
RUN npm run build

# 生产阶段
FROM node:20 AS production

# 安装必要系统工具
RUN apt-get update && apt-get install -y \
    sqlite3 \
    curl \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# 创建应用用户
RUN groupadd -r -g 1001 nodejs && \
    useradd -r -m -u 1001 -g nodejs starshipplan

WORKDIR /app

# 复制后端应用
COPY --from=builder --chown=starshipplan:nodejs /app .
RUN chown -R starshipplan:nodejs /app

# 创建数据目录
RUN mkdir -p /app/data /app/logs && \
    chown -R starshipplan:nodejs /app/data /app/logs

# 切换到应用用户
USER starshipplan

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8000
ENV DATABASE_URL="file:/app/data/starship-plan.db"

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令
CMD ["dumb-init", "node", "dist/server.js"]
