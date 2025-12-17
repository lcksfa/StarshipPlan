import { Request } from 'express';
import { User } from '@prisma/client';

// 扩展 Express Request 类型，添加用户信息
export interface AuthRequest extends Request {
  user?: User;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// JWT 载荷类型
export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// 任务筛选参数
export interface TaskFilters {
  type?: string;
  category?: string;
  difficulty?: string;
  isActive?: boolean;
  completed?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

// 用户统计信息
export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  streak: number;
  totalStarCoins: number;
  currentLevel: number;
  currentExp: number;
  nextLevelExp: number;
}

// 排序参数
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

// 查询参数
export interface QueryParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 错误类型
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
}

// 自定义错误类
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: ErrorCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 环境变量类型
export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  ALLOWED_ORIGINS: string[];
  MAX_FILE_SIZE: number;
  UPLOAD_DIR: string;
  LOG_LEVEL: string;
}

// 任务统计
export interface TaskStats {
  daily: {
    total: number;
    completed: number;
    percentage: number;
  };
  weekly: {
    total: number;
    completed: number;
    percentage: number;
  };
  monthly: {
    total: number;
    completed: number;
    percentage: number;
  };
}

// 成就系统
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'task' | 'streak' | 'level' | 'special';
  condition: string;
  value: number;
  unlockedAt?: Date;
}

// 同步数据
export interface SyncData {
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: Date;
  deviceId: string;
}