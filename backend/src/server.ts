import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createRequestLogger } from './utils/logger';
import { errorHandler, notFoundHandler, setupProcessHandlers } from './middleware/errorHandler';
import { sanitizeRequest } from './middleware/validation';
import { testConnection, disconnectDatabase } from './lib/database';
import { createServer } from 'http';

// 导入路由
import taskRoutes from './routes/tasks';
import pointsRoutes from './routes/points';
import punishmentRoutes from './routes/punishments';
import initializeSyncRoutes from './routes/sync';

const app = express();
const PORT = process.env.PORT || 8000;

// 设置进程异常处理
setupProcessHandlers();

// 信任代理（用于部署在反向代理后）
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 配置
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

    // 允许没有 origin 的请求（如移动应用、Postman等）
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的 CORS 来源'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// 压缩响应
app.use(compression());

// 请求日志中间件
app.use(createRequestLogger);

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求清理中间件
app.use(sanitizeRequest);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API 路由
app.get('/api', (req, res) => {
  res.json({
    message: 'StarshipPlan API 服务器',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      tasks: '/api/tasks',
      points: '/api/points',
      punishments: '/api/punishments',
      sync: '/api/sync',
    },
  });
});

// 注册路由
app.use('/api/tasks', taskRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/punishments', punishmentRoutes);
// 同步路由将在服务器启动时初始化并注册

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('数据库连接失败');
    }

    // 创建 HTTP 服务器用于 WebSocket
    const httpServer = createServer(app);

    // 初始化同步路由并注册
    const syncRoutes = initializeSyncRoutes(httpServer);
    app.use('/api/sync', syncRoutes);

    // 启动 HTTP 服务器
    const server = httpServer.listen(PORT, () => {
      console.log(`🚀 StarshipPlan API 服务器已启动`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
      console.log(`📚 API 文档: http://localhost:${PORT}/api`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 WebSocket 支持: 已启用`);
    });

    // 优雅关闭处理
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n收到 ${signal} 信号，开始优雅关闭...`);

      // 停止接受新连接
      server.close(async () => {
        console.log('HTTP 服务器已关闭');

        try {
          // 关闭数据库连接
          await disconnectDatabase();
          console.log('数据库连接已关闭');
          process.exit(0);
        } catch (error) {
          console.error('关闭数据库连接时出错:', error);
          process.exit(1);
        }
      });

      // 强制退出超时
      setTimeout(() => {
        console.error('强制退出服务器');
        process.exit(1);
      }, 10000);
    };

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  startServer().catch((error) => {
    console.error('启动服务器时发生错误:', error);
    process.exit(1);
  });
}

export default app;
