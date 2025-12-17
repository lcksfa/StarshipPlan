import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { validationErrorResponse } from '../utils/response';

/**
 * 验证请求体中间件
 */
export function validateRequest(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 执行所有验证
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => {
        if (error.type === 'field') {
          return `${error.msg}: ${error.path}`;
        }
        return error.msg;
      });

      validationErrorResponse(res, errorMessages);
      return;
    }

    next();
  };
}

/**
 * 验证分页参数中间件
 */
export function validatePagination(req: Request, res: Response, next: NextFunction): void {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (page < 1) {
    validationErrorResponse(res, '页码必须大于0');
    return;
  }

  if (limit < 1 || limit > 100) {
    validationErrorResponse(res, '每页数量必须在1-100之间');
    return;
  }

  // 将验证后的参数附加到请求对象
  (req as any).pagination = { page, limit };
  next();
}

/**
 * 验证排序参数中间件
 */
export function validateSorting(req: Request, res: Response, next: NextFunction): void {
  const sortBy = req.query.sortBy as string;
  const sortOrder = req.query.sortOrder as string;

  if (sortBy && typeof sortBy !== 'string') {
    validationErrorResponse(res, '排序字段必须是字符串');
    return;
  }

  if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
    validationErrorResponse(res, '排序方向必须是 asc 或 desc');
    return;
  }

  // 将验证后的参数附加到请求对象
  (req as any).sorting = { sortBy, sortOrder: sortOrder as 'asc' | 'desc' || 'asc' };
  next();
}

/**
 * 验证日期范围参数中间件
 */
export function validateDateRange(req: Request, res: Response, next: NextFunction): void {
  const { dateFrom, dateTo } = req.query;

  if (dateFrom) {
    const fromDate = new Date(dateFrom as string);
    if (isNaN(fromDate.getTime())) {
      validationErrorResponse(res, '开始日期格式无效');
      return;
    }
    (req as any).dateRange = { ...((req as any).dateRange || {}), dateFrom: fromDate };
  }

  if (dateTo) {
    const toDate = new Date(dateTo as string);
    if (isNaN(toDate.getTime())) {
      validationErrorResponse(res, '结束日期格式无效');
      return;
    }
    (req as any).dateRange = { ...((req as any).dateRange || {}), dateTo: toDate };
  }

  // 检查日期范围是否合理
  if ((req as any).dateRange?.dateFrom && (req as any).dateRange?.dateTo) {
    if ((req as any).dateRange.dateFrom > (req as any).dateRange.dateTo) {
      validationErrorResponse(res, '开始日期不能晚于结束日期');
      return;
    }
  }

  next();
}

/**
 * 验证文件上传中间件
 */
export function validateFileUpload(allowedTypes: string[] = [], maxSize: number = 5 * 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;

    if (!file) {
      validationErrorResponse(res, '请选择要上传的文件');
      return;
    }

    // 检查文件类型
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      validationErrorResponse(res, `文件类型不支持，允许的类型：${allowedTypes.join(', ')}`);
      return;
    }

    // 检查文件大小
    if (file.size > maxSize) {
      validationErrorResponse(res, `文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    next();
  };
}

/**
 * 通用请求参数清理中间件
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction): void {
  // 移除请求对象中的潜在危险属性
  const dangerousProps = ['__proto__', 'constructor', 'prototype'];

  const sanitize = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (!dangerousProps.includes(key)) {
          sanitized[key] = sanitize(value);
        }
      }
      return sanitized;
    }

    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
}