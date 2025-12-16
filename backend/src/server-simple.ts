import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import winston from 'winston';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// 基础中间件
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 日志配置
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'starship-plan-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Starship Plan Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Starship Plan Backend API',
    version: '1.0.0',
  });
});

// 启动服务器
const server = createServer(app);

server.listen(PORT, () => {
  logger.info(`Starship Plan Backend Server running on port ${PORT}`);
});

export { app };
