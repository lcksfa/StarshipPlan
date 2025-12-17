import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { mockAuthenticate } from '../utils/mockAuth';
import { AuthRequest, AppError } from '../types';
import { unauthorizedResponse, forbiddenResponse } from '../utils/response';
import prisma from '../lib/database';

/**
 * 身份验证中间件 - 简化版（家庭项目）
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  // 简化的家庭身份验证 - 只要有Bearer token就通过
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    unauthorizedResponse(res, '缺少授权令牌');
    return;
  }

  const token = authHeader.substring(7);

  if (!token) {
    unauthorizedResponse(res, '无效的授权令牌格式');
    return;
  }

  // 家庭项目简化身份验证：任何有效的token都自动设置默认用户
  if (token.startsWith('mock-parent-token') || token.startsWith('mock-token-')) {
    // 设置默认家长用户
    req.user = {
      id: 'parent-1',
      username: 'parent',
      displayName: '家长',
      avatar: null,
      role: 'PARENT',
      parentId: null,
      password: 'password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    next();
    return;
  }

  if (token.startsWith('mock-child-token')) {
    // 设置默认儿童用户
    req.user = {
      id: 'child-1',
      username: 'child',
      displayName: '葫芦',
      avatar: null,
      role: 'CHILD',
      parentId: 'parent-1',
      password: 'password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    next();
    return;
  }

  // 对于其他token，尝试JWT验证
  try {
    const payload = verifyToken(token);

    // 从数据库获取用户信息
    prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        role: true,
        parentId: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    })
      .then((user) => {
        if (!user) {
          unauthorizedResponse(res, '用户不存在');
          return;
        }

        req.user = user;
        next();
      })
      .catch((error) => {
        console.error('Database error during authentication:', error);
        unauthorizedResponse(res, '用户验证失败');
      });
  } catch (error) {
    unauthorizedResponse(res, '无效的令牌');
  }
}

/**
 * 角色授权中间件
 */
export function authorize(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorizedResponse(res, '请先进行身份验证');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      forbiddenResponse(res, '权限不足');
      return;
    }

    next();
  };
}

/**
 * 家长权限检查中间件
 */
export function requireParent(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    unauthorizedResponse(res, '请先进行身份验证');
    return;
  }

  if (req.user.role !== 'PARENT') {
    forbiddenResponse(res, '需要家长权限');
    return;
  }

  next();
}

/**
 * 资源所有者或家长权限检查中间件
 */
export function requireOwnerOrParent(paramName: string = 'userId') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorizedResponse(res, '请先进行身份验证');
      return;
    }

    const targetUserId = req.params[paramName];

    // 检查是否是资源所有者或家长
    const isOwner = req.user.id === targetUserId;
    const isParent = req.user.role === 'PARENT' && req.user.id === req.user?.parentId;

    if (!isOwner && !isParent) {
      forbiddenResponse(res, '只能访问自己的资源或需要家长权限');
      return;
    }

    next();
  };
}

/**
 * 可选身份验证中间件（不强制要求登录）
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);

    prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        role: true,
        parentId: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    })
      .then((user) => {
        if (user) {
          req.user = user;
        }
        next();
      })
      .catch(() => {
        // 静默处理错误，继续执行
        next();
      });
  } catch {
    // 静默处理错误，继续执行
    next();
  }
}
