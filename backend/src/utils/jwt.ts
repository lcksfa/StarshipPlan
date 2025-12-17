import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

// JWT 配置
const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成 JWT 令牌
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * 验证 JWT 令牌
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('令牌已过期');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('无效的令牌');
    } else {
      throw new Error('令牌验证失败');
    }
  }
}

/**
 * 解码 JWT 令牌（不验证有效性）
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 生成刷新令牌
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * 验证刷新令牌
 */
export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'refresh') {
      throw new Error('无效的刷新令牌');
    }
    return { userId: decoded.userId };
  } catch (error) {
    throw new Error('刷新令牌验证失败');
  }
}