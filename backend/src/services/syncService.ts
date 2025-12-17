import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import prisma from '../lib/database';
import { AppError } from '../types';

export interface SyncData {
  entityType: 'task' | 'punishment' | 'point_transaction' | 'level_record';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: Date;
  userId: string;
  deviceId?: string;
}

export interface ConflictResolution {
  strategy: 'LAST_WRITE_WINS' | 'MANUAL' | 'MERGE';
  resolution?: any;
  conflicts?: Array<{
    field: string;
    localValue: any;
    remoteValue: any;
    timestamp: Date;
  }>;
}

export class SyncService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private userSockets: Map<string, string> = new Map(); // socketId -> userId

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('缺少认证令牌'));
        }

        const payload = verifyToken(token);

        // 验证用户是否存在
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            username: true,
            role: true,
            parentId: true,
          },
        });

        if (!user) {
          return next(new Error('用户不存在'));
        }

        // 将用户信息附加到socket
        (socket as any).user = user;
        next();
      } catch (error) {
        next(new Error('认证失败'));
      }
    });
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = (socket as any).user;
      const userId = user.id;
      const socketId = socket.id;

      console.log(`用户连接: ${user.username} (${userId})`);

      // 记录连接
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socketId);
      this.userSockets.set(socketId, userId);

      // 加入用户房间（用于个人数据同步）
      socket.join(`user:${userId}`);

      // 如果是家长，加入家庭房间
      if (user.role === 'PARENT') {
        socket.join(`family:${userId}`);
      }

      // 如果是儿童，加入家长的家庭房间
      if (user.role === 'CHILD' && user.parentId) {
        socket.join(`family:${user.parentId}`);
      }

      // 发送连接成功消息
      socket.emit('connected', {
        message: '连接成功',
        userId,
        socketId,
        timestamp: new Date(),
      });

      // 处理同步请求
      socket.on('sync:pull', async (data) => {
        await this.handleSyncPull(socket, data);
      });

      // 处理数据变更推送
      socket.on('sync:push', async (data) => {
        await this.handleSyncPush(socket, data);
      });

      // 处理冲突解决
      socket.on('sync:resolve-conflict', async (data) => {
        await this.handleConflictResolution(socket, data);
      });

      // 处理离线数据同步
      socket.on('sync:offline-data', async (data) => {
        await this.handleOfflineDataSync(socket, data);
      });

      // 处理断开连接
      socket.on('disconnect', () => {
        this.handleDisconnection(socketId);
      });

      // 错误处理
      socket.on('error', (error) => {
        console.error(`Socket错误 (${socketId}):`, error);
      });
    });
  }

  /**
   * 处理同步拉取请求
   */
  private async handleSyncPull(socket: any, data: {
    lastSyncTime?: string;
    entityTypes?: string[];
  }) {
    try {
      const user = (socket as any).user;
      const { lastSyncTime, entityTypes = ['task', 'punishment', 'point_transaction', 'level_record'] } = data;

      const since = lastSyncTime ? new Date(lastSyncTime) : new Date(0);

      const results: any = {};

      // 同步任务
      if (entityTypes.includes('task')) {
        results.tasks = await this.getTasksForUser(user.id, since);
      }

      // 同步惩罚记录
      if (entityTypes.includes('punishment')) {
        results.punishments = await this.getPunishmentsForUser(user.id, since);
      }

      // 同步积分交易
      if (entityTypes.includes('point_transaction')) {
        results.pointTransactions = await this.getPointTransactionsForUser(user.id, since);
      }

      // 同步等级记录
      if (entityTypes.includes('level_record')) {
        results.levelRecords = await this.getLevelRecordsForUser(user.id, since);
      }

      socket.emit('sync:pull-response', {
        data: results,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('同步拉取错误:', error);
      socket.emit('sync:error', {
        message: '同步失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  /**
   * 处理数据推送
   */
  private async handleSyncPush(socket: any, data: SyncData) {
    try {
      const user = (socket as any).user;

      // 记录同步日志
      await prisma.syncLog.create({
        data: {
          userId: user.id,
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          data: JSON.stringify(data.data),
          deviceId: data.deviceId || socket.id,
          syncStatus: 'PENDING',
        },
      });

      // 广播给相关用户
      this.broadcastToFamily(user, data);

      socket.emit('sync:push-ack', {
        success: true,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('数据推送错误:', error);
      socket.emit('sync:error', {
        message: '推送失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  /**
   * 处理冲突解决
   */
  private async handleConflictResolution(socket: any, data: {
    entityType: string;
    entityId: string;
    resolution: ConflictResolution;
  }) {
    try {
      const user = (socket as any).user;

      // 这里可以实现具体的冲突解决逻辑
      // 例如：合并数据、选择最新数据等

      console.log(`冲突解决: ${data.entityType}/${data.entityId} by ${user.username}`);

      socket.emit('sync:conflict-resolved', {
        entityType: data.entityType,
        entityId: data.entityId,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('冲突解决错误:', error);
      socket.emit('sync:error', {
        message: '冲突解决失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  /**
   * 处理离线数据同步
   */
  private async handleOfflineDataSync(socket: any, data: {
    offlineData: SyncData[];
    deviceId: string;
  }) {
    try {
      const user = (socket as any).user;
      const { offlineData, deviceId } = data;

      console.log(`处理离线数据同步: ${offlineData.length} 条记录, 设备: ${deviceId}`);

      const results = [];
      const conflicts = [];

      for (const syncData of offlineData) {
        try {
          // 检查是否存在冲突
          const hasConflict = await this.checkConflict(user.id, syncData);

          if (hasConflict) {
            conflicts.push({
              syncData,
              conflict: hasConflict,
            });
          } else {
            // 应用离线数据
            await this.applyOfflineData(user.id, syncData);
            results.push({
              entityId: syncData.entityId,
              success: true,
            });
          }
        } catch (error) {
          results.push({
            entityId: syncData.entityId,
            success: false,
            error: error instanceof Error ? error.message : '同步失败',
          });
        }
      }

      socket.emit('sync:offline-complete', {
        results,
        conflicts,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('离线数据同步错误:', error);
      socket.emit('sync:error', {
        message: '离线同步失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  /**
   * 获取用户任务
   */
  private async getTasksForUser(userId: string, since: Date) {
    // 获取用户及其子女的任务
    const children = await prisma.user.findMany({
      where: { parentId: userId },
      select: { id: true },
    });

    const allUserIds = [userId, ...children.map(child => child.id)];

    return await prisma.task.findMany({
      where: {
        createdBy: { in: allUserIds },
        updatedAt: { gte: since },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * 获取用户惩罚记录
   */
  private async getPunishmentsForUser(userId: string, since: Date) {
    const children = await prisma.user.findMany({
      where: { parentId: userId },
      select: { id: true },
    });

    const allUserIds = [userId, ...children.map(child => child.id)];

    return await prisma.punishmentRecord.findMany({
      where: {
        userId: { in: allUserIds },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  /**
   * 获取用户积分交易
   */
  private async getPointTransactionsForUser(userId: string, since: Date) {
    return await prisma.pointTransaction.findMany({
      where: {
        userId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取用户等级记录
   */
  private async getLevelRecordsForUser(userId: string, since: Date) {
    return await prisma.levelRecord.findMany({
      where: {
        userId,
        promotedAt: { gte: since },
      },
      orderBy: { promotedAt: 'desc' },
    });
  }

  /**
   * 检查数据冲突
   */
  private async checkConflict(userId: string, syncData: SyncData): Promise<boolean> {
    try {
      switch (syncData.entityType) {
        case 'task':
          const task = await prisma.task.findUnique({
            where: { id: syncData.entityId },
          });
          return !!(task && task.updatedAt && task.updatedAt > new Date(syncData.timestamp));

        case 'punishment':
          const punishment = await prisma.punishmentRecord.findUnique({
            where: { id: syncData.entityId },
          });
          return !!(punishment && punishment.createdAt && punishment.createdAt > new Date(syncData.timestamp));

        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * 应用离线数据
   */
  private async applyOfflineData(userId: string, syncData: SyncData): Promise<void> {
    try {
      switch (syncData.entityType) {
        case 'task':
          if (syncData.action === 'CREATE') {
            await prisma.task.create({
              data: {
                ...syncData.data,
                createdBy: userId,
              },
            });
          } else if (syncData.action === 'UPDATE') {
            await prisma.task.update({
              where: { id: syncData.entityId },
              data: syncData.data,
            });
          }
          break;

        // 其他实体类型的处理...
      }
    } catch (error) {
      throw new Error(`应用离线数据失败: ${error}`);
    }
  }

  /**
   * 向家庭广播数据
   */
  private broadcastToFamily(user: any, data: SyncData) {
    if (user.role === 'PARENT') {
      // 家长广播给所有家庭成员
      this.io.to(`family:${user.id}`).emit('sync:update', data);
    } else if (user.role === 'CHILD' && user.parentId) {
      // 儿童广播给家长
      this.io.to(`family:${user.parentId}`).emit('sync:update', data);
    }
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(socketId: string) {
    const userId = this.userSockets.get(socketId);
    if (!userId) return;

    console.log(`用户断开连接: ${userId}`);

    // 移除连接记录
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }

    this.userSockets.delete(socketId);
  }

  /**
   * 广播任务完成事件
   */
  broadcastTaskCompletion(userId: string, taskData: any) {
    const syncData: SyncData = {
      entityType: 'task',
      entityId: taskData.taskId,
      action: 'UPDATE',
      data: taskData,
      timestamp: new Date(),
      userId,
    };

    // 获取用户信息以确定家庭
    const user = this.getUserInfo(userId);
    if (user) {
      this.broadcastToFamily(user, syncData);
    }
  }

  /**
   * 广播积分变更事件
   */
  broadcastPointsChange(userId: string, pointsData: any) {
    const syncData: SyncData = {
      entityType: 'point_transaction',
      entityId: pointsData.transactionId,
      action: 'CREATE',
      data: pointsData,
      timestamp: new Date(),
      userId,
    };

    const user = this.getUserInfo(userId);
    if (user) {
      this.broadcastToFamily(user, syncData);
    }
  }

  /**
   * 获取用户信息（简化版）
   */
  private getUserInfo(userId: string): any {
    // 这里可以实现从缓存或数据库获取用户信息
    // 为了简化，返回基本信息
    return {
      id: userId,
      role: 'USER',
    };
  }

  /**
   * 获取连接统计
   */
  getConnectionStats() {
    return {
      totalConnections: this.userSockets.size,
      connectedUsers: this.connectedUsers.size,
      userConnections: Array.from(this.connectedUsers.entries()).map(([userId, sockets]) => ({
        userId,
        socketCount: sockets.size,
      })),
    };
  }
}