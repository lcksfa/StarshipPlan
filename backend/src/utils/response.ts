import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

/**
 * 发送成功响应
 */
export function successResponse<T>(
  res: Response,
  data?: T,
  message: string = '操作成功',
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

/**
 * 发送错误响应
 */
export function errorResponse(
  res: Response,
  message: string = '操作失败',
  statusCode: number = 400,
  error?: string
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };
  return res.status(statusCode).json(response);
}

/**
 * 发送分页响应
 */
export function paginatedResponse<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number,
  message: string = '获取数据成功'
): Response {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const paginatedData: PaginatedResponse<T> = {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
  };

  return successResponse(res, paginatedData, message);
}

/**
 * 发送创建成功响应
 */
export function createdResponse<T>(
  res: Response,
  data?: T,
  message: string = '创建成功'
): Response {
  return successResponse(res, data, message, 201);
}

/**
 * 发送无内容响应
 */
export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}

/**
 * 发送未找到响应
 */
export function notFoundResponse(
  res: Response,
  message: string = '资源未找到'
): Response {
  return errorResponse(res, message, 404);
}

/**
 * 发送未授权响应
 */
export function unauthorizedResponse(
  res: Response,
  message: string = '未授权访问'
): Response {
  return errorResponse(res, message, 401);
}

/**
 * 发送禁止访问响应
 */
export function forbiddenResponse(
  res: Response,
  message: string = '禁止访问'
): Response {
  return errorResponse(res, message, 403);
}

/**
 * 发送验证错误响应
 */
export function validationErrorResponse(
  res: Response,
  errors: string | string[],
  message: string = '数据验证失败'
): Response {
  const errorMessage = Array.isArray(errors) ? errors.join(', ') : errors;
  return errorResponse(res, message, 422, errorMessage);
}

/**
 * 发送冲突响应
 */
export function conflictResponse(
  res: Response,
  message: string = '数据冲突'
): Response {
  return errorResponse(res, message, 409);
}

/**
 * 发送服务器错误响应
 */
export function serverErrorResponse(
  res: Response,
  error?: string,
  message: string = '服务器内部错误'
): Response {
  return errorResponse(res, message, 500, error);
}

/**
 * 发送限流响应
 */
export function rateLimitResponse(
  res: Response,
  message: string = '请求过于频繁，请稍后再试'
): Response {
  return errorResponse(res, message, 429);
}