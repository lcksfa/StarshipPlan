import { Response } from 'express';
import { AuthRequest } from '../types';
import { PointsService } from '../services/pointsService';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export class PointsController {
  private pointsService: PointsService;

  constructor() {
    this.pointsService = new PointsService();
  }

  /**
   * 获取用户积分和等级信息
   */
  async getUserPoints(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      const pointsInfo = await this.pointsService.getUserPoints(userId);
      return successResponse(res, pointsInfo, '获取积分信息成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取用户积分交易历史
   */
  async getPointTransactions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      const { type, page = 1, limit = 20 } = req.query;

      const filters = {
        type: type as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await this.pointsService.getPointTransactions(userId, filters);
      return paginatedResponse(
        res,
        result.transactions,
        result.pagination.total,
        result.pagination.page,
        result.pagination.limit,
        '获取交易历史成功'
      );
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取用户等级历史
   */
  async getLevelHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      const { page = 1, limit = 20 } = req.query;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await this.pointsService.getLevelHistory(userId, filters);
      return paginatedResponse(
        res,
        result.levelRecords,
        result.pagination.total,
        result.pagination.page,
        result.pagination.limit,
        '获取等级历史成功'
      );
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 手动增加星币（仅家长）
   */
  async addStarCoins(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { userId, amount, description } = req.body;

      if (!userId || !amount || !description) {
        return errorResponse(res, '缺少必要参数', 400);
      }

      const result = await this.pointsService.addStarCoins(
        userId,
        parseInt(amount),
        description
      );

      return successResponse(res, result, '星币增加成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 手动扣除星币（仅家长）
   */
  async deductStarCoins(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { userId, amount, description } = req.body;

      if (!userId || !amount || !description) {
        return errorResponse(res, '缺少必要参数', 400);
      }

      const result = await this.pointsService.deductStarCoins(
        userId,
        parseInt(amount),
        description
      );

      return successResponse(res, result, '星币扣除成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 手动增加经验值（仅家长）
   */
  async addExperience(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { userId, expAmount, description } = req.body;

      if (!userId || !expAmount || !description) {
        return errorResponse(res, '缺少必要参数', 400);
      }

      const result = await this.pointsService.addExperience(
        userId,
        parseInt(expAmount),
        description
      );

      return successResponse(res, result, '经验值增加成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 更新飞船名称
   */
  async updateShipName(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      const { shipName } = req.body;

      if (!shipName) {
        return errorResponse(res, '飞船名称不能为空', 400);
      }

      const result = await this.pointsService.updateShipName(userId, shipName);
      return successResponse(res, result, '飞船名称更新成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取积分统计信息
   */
  async getPointsStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      const { period = 'today' } = req.query;

      if (!['today', 'week', 'month'].includes(period as string)) {
        return errorResponse(res, '无效的时间周期', 400);
      }

      const stats = await this.pointsService.getPointsStats(
        userId,
        period as 'today' | 'week' | 'month'
      );

      return successResponse(res, stats, '获取统计信息成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取排行榜
   */
  async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      const { type = 'level', limit = 10 } = req.query;

      if (!['level', 'coins'].includes(type as string)) {
        return errorResponse(res, '无效的排行榜类型', 400);
      }

      const limitNum = Math.min(parseInt(limit as string) || 10, 100);

      const leaderboard = await this.pointsService.getLeaderboard(
        type as 'level' | 'coins',
        limitNum
      );

      return successResponse(res, leaderboard, '获取排行榜成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 错误处理
   */
  private handleError(res: Response, error: any) {
    console.error('Points controller error:', error);

    if (error instanceof Error) {
      return errorResponse(res, error.message, 500);
    }

    return errorResponse(res, '内部服务器错误', 500);
  }
}