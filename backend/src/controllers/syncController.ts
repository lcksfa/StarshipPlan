import { Response } from 'express';
import { AuthRequest } from '../types';
import { SyncService } from '../services/syncService';
import { successResponse, errorResponse } from '../utils/response';
import { Server as HTTPServer } from 'http';
import prisma from '../lib/database';

export class SyncController {
  private syncService: SyncService;

  constructor(httpServer: HTTPServer) {
    this.syncService = new SyncService(httpServer);
  }

  /**
   * 获取连接统计信息
   */
  async getConnectionStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      const stats = this.syncService.getConnectionStats();
      return successResponse(res, stats, '获取连接统计成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 手动触发同步
   */
  async triggerSync(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      const { entityTypes, targetUserId } = req.body;

      // 这里可以实现手动同步逻辑
      // 例如：强制拉取最新数据、推送变更等

      return successResponse(res, {
        message: '同步已触发',
        userId: targetUserId || userId,
        entityTypes: entityTypes || ['task', 'punishment', 'point_transaction'],
        timestamp: new Date(),
      }, '同步触发成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取同步日志
   */
  async getSyncLogs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      const { page = 1, limit = 50, entityId, entityType, syncStatus } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};

      // 如果是家长，可以查看所有家庭成员的日志
      if (req.user?.role === 'PARENT') {
        const children = await prisma.user.findMany({
          where: { parentId: userId },
          select: { id: true },
        });

        const allUserIds = [userId, ...children.map(child => child.id)];
        where.userId = { in: allUserIds };
      } else {
        where.userId = userId;
      }

      if (entityId) where.entityId = entityId as string;
      if (entityType) where.entityType = entityType as string;
      if (syncStatus) where.syncStatus = syncStatus as string;

      const [logs, total] = await Promise.all([
        prisma.syncLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip,
          take: parseInt(limit as string),
        }),
        prisma.syncLog.count({ where }),
      ]);

      return successResponse(res, {
        logs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
          hasNext: parseInt(page as string) * parseInt(limit as string) < total,
          hasPrev: parseInt(page as string) > 1,
        },
      }, '获取同步日志成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 清理同步日志
   */
  async cleanupSyncLogs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { daysToKeep = 30 } = req.body;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.syncLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      return successResponse(res, {
        deletedCount: result.count,
        cutoffDate,
      }, '清理同步日志成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 手动解决冲突
   */
  async resolveConflict(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      const { logId, resolution } = req.body;

      if (!logId || !resolution) {
        return errorResponse(res, '缺少必要参数', 400);
      }

      // 更新同步日志状态
      const updatedLog = await prisma.syncLog.update({
        where: { id: logId },
        data: {
          syncStatus: 'SYNCED',
          data: JSON.stringify({
            ...JSON.parse((await prisma.syncLog.findUnique({
              where: { id: logId },
            }))?.data || '{}'),
            resolution,
            resolvedBy: userId,
            resolvedAt: new Date(),
          }),
        },
      });

      return successResponse(res, updatedLog, '冲突解决成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取设备列表
   */
  async getDevices(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      // 获取用户的所有设备信息
      const devices = await prisma.syncLog.groupBy({
        by: ['deviceId'],
        where: { userId },
        _max: {
          timestamp: true,
        },
        _count: true,
      });

      const deviceList = devices.map(device => ({
        deviceId: device.deviceId || 'unknown',
        lastSync: device._max.timestamp,
        syncCount: device._count,
        isActive: device._count > 0,
      }));

      return successResponse(res, deviceList, '获取设备列表成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 强制断开指定设备
   */
  async forceDisconnectDevice(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, '用户未认证', 401);
      }

      if (req.user?.role !== 'PARENT') {
        return errorResponse(res, '需要家长权限', 403);
      }

      const { deviceId } = req.body;

      if (!deviceId) {
        return errorResponse(res, '缺少设备ID', 400);
      }

      // 这里可以实现强制断开设备的逻辑
      // 通过Socket.IO向特定设备发送断开消息

      const stats = this.syncService.getConnectionStats();

      return successResponse(res, {
        message: '设备断开请求已发送',
        deviceId,
        currentConnections: stats,
        timestamp: new Date(),
      }, '设备断开请求成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 错误处理
   */
  private handleError(res: Response, error: any) {
    console.error('Sync controller error:', error);

    if (error instanceof Error) {
      return errorResponse(res, error.message, 500);
    }

    return errorResponse(res, '内部服务器错误', 500);
  }
}