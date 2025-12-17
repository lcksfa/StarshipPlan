import { Response } from 'express';
import { AuthRequest } from '../types';
import { PunishmentService } from '../services/punishmentService';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import prisma from '../lib/database';

export class PunishmentController {
  private punishmentService: PunishmentService;

  constructor() {
    this.punishmentService = new PunishmentService();
  }

  /**
   * 获取用户惩罚记录
   */
  async getPunishments(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      const { status, severity, type, page = 1, limit = 20 } = req.query;

      const filters = {
        status: status as string,
        severity: severity as string,
        type: type as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await this.punishmentService.getPunishments(userId, filters);
      return paginatedResponse(
        res,
        result.punishments,
        result.pagination.total,
        result.pagination.page,
        result.pagination.limit,
        '获取惩罚记录成功'
      );
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取惩罚规则（家长权限）
   */
  async getPunishmentRules(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { isActive, type, severity } = req.query;

      const filters = {
        isActive: isActive === 'false' ? false : true,
        type: type as string,
        severity: severity as string,
      };

      const rules = await this.punishmentService.getPunishmentRules(userId, filters);
      return successResponse(res, rules, '获取惩罚规则成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 创建惩罚记录（家长权限）
   */
  async createPunishment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { targetUserId, taskId, ruleId, type, reason, severity, value } = req.body;

      if (!targetUserId || !type || !reason || !severity || value === undefined) {
        return errorResponse(res, '缺少必要参数', 400);
      }

      const punishmentData = {
        targetUserId,
        taskId,
        ruleId,
        type,
        reason,
        severity,
        value: parseInt(value),
      };

      const punishment = await this.punishmentService.createPunishment(userId, punishmentData);
      return successResponse(res, punishment, '创建惩罚记录成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 更新惩罚记录状态（家长权限）
   */
  async updatePunishmentStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!id || !status) {
        return errorResponse(res, '缺少必要参数', 400);
      }

      if (!['ACTIVE', 'COMPLETED', 'WAIVED'].includes(status)) {
        return errorResponse(res, '无效的状态', 400);
      }

      const updatedPunishment = await this.punishmentService.updatePunishmentStatus(
        userId,
        id,
        status as 'ACTIVE' | 'COMPLETED' | 'WAIVED'
      );

      return successResponse(res, updatedPunishment, '更新惩罚状态成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 创建惩罚规则（家长权限）
   */
  async createPunishmentRule(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { name, description, type, severity, value } = req.body;

      if (!name || !description || !type || !severity || value === undefined) {
        return errorResponse(res, '缺少必要参数', 400);
      }

      const ruleData = {
        name,
        description,
        type,
        severity,
        value: parseInt(value),
      };

      const rule = await this.punishmentService.createPunishmentRule(userId, ruleData);
      return successResponse(res, rule, '创建惩罚规则成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 更新惩罚规则（家长权限）
   */
  async updatePunishmentRule(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return errorResponse(res, '缺少规则ID', 400);
      }

      const updatedRule = await this.punishmentService.updatePunishmentRule(userId, id, updateData);
      return successResponse(res, updatedRule, '更新惩罚规则成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 删除惩罚规则（家长权限）
   */
  async deletePunishmentRule(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { id } = req.params;

      if (!id) {
        return errorResponse(res, '缺少规则ID', 400);
      }

      const result = await this.punishmentService.deletePunishmentRule(userId, id);
      return successResponse(res, result, '删除惩罚规则成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 自动检测违规并生成惩罚建议（家长权限）
   */
  async detectViolations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { childUserId } = req.query;

      if (!childUserId) {
        return errorResponse(res, '缺少子女用户ID', 400);
      }

      // 检查目标用户是否为当前用户的子女
      const children = await prisma.user.findMany({
        where: { parentId: userId },
        select: { id: true },
      });

      const childrenIds = children.map(child => child.id);
      if (!childrenIds.includes(childUserId as string)) {
        return errorResponse(res, '目标用户不是您的子女', 403);
      }

      const violations = await this.punishmentService.detectViolations(
        userId,
        childUserId as string
      );

      return successResponse(res, violations, '违规检测完成');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取惩罚统计信息（家长权限）
   */
  async getPunishmentStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { period = 'today' } = req.query;

      if (!['today', 'week', 'month'].includes(period as string)) {
        return errorResponse(res, '无效的时间周期', 400);
      }

      const stats = await this.punishmentService.getPunishmentStats(
        userId,
        period as 'today' | 'week' | 'month'
      );

      return successResponse(res, stats, '获取惩罚统计成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 错误处理
   */
  private handleError(res: Response, error: any) {
    console.error('Punishment controller error:', error);

    if (error instanceof Error) {
      return errorResponse(res, error.message, 500);
    }

    return errorResponse(res, '内部服务器错误', 500);
  }
}