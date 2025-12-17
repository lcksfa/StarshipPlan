import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AppError } from '../types';
import { errorResponse, serverErrorResponse } from '../utils/response';

/**
 * 全局错误处理中间件
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId || 'unknown';

  // 记录错误日志
  logger.error('Error occurred', {
    requestId,
    method: req.method,
    url: req.url,
    error: error.message,
    stack: error.stack,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // 处理自定义应用错误
  if (error instanceof AppError) {
    errorResponse(res, error.message, error.statusCode, error.code);
    return;
  }

  // 处理 Prisma 错误
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    switch (prismaError.code) {
      case 'P2002':
        // 唯一约束冲突
        errorResponse(res, '数据已存在，请检查唯一性约束', 409, 'P2002');
        return;
      case 'P2025':
        // 记录未找到
        errorResponse(res, '记录未找到', 404, 'P2025');
        return;
      case 'P2003':
        // 外键约束冲突
        errorResponse(res, '关联数据不存在', 400, 'P2003');
        return;
      default:
        errorResponse(res, '数据库操作失败', 500, prismaError.code);
        return;
    }
  }

  // 处理验证错误
  if (error.name === 'ValidationError') {
    errorResponse(res, error.message, 422, 'VALIDATION_ERROR');
    return;
  }

  // 处理 JWT 错误
  if (error.name === 'JsonWebTokenError') {
    errorResponse(res, '无效的令牌', 401, 'JWT_ERROR');
    return;
  }

  if (error.name === 'TokenExpiredError') {
    errorResponse(res, '令牌已过期', 401, 'TOKEN_EXPIRED');
    return;
  }

  // 处理语法错误
  if (error instanceof SyntaxError && 'body' in error) {
    errorResponse(res, '请求数据格式错误', 400, 'SYNTAX_ERROR');
    return;
  }

  // 处理未知错误
  serverErrorResponse(res, process.env.NODE_ENV === 'development' ? error.stack : undefined);
}

/**
 * 404 错误处理中间件
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId || 'unknown';

  logger.warn('Route not found', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  errorResponse(res, `路由 ${req.method} ${req.url} 不存在`, 404, 'NOT_FOUND');
}

/**
 * 异步错误处理包装器
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 进程异常处理
 */
export function setupProcessHandlers(): void {
  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });

    // 优雅关闭
    process.exit(1);
  });

  // 处理未处理的 Promise 拒绝
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
    });

    // 优雅关闭
    process.exit(1);
  });

  // 处理 SIGTERM 信号
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  // 处理 SIGINT 信号
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}