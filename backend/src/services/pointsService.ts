import prisma from '../lib/database';
import { AppError } from '../types';

export class PointsService {
  /**
   * 获取用户当前积分和等级信息
   */
  async getUserPoints(userId: string) {
    // 获取当前等级记录
    const currentLevel = await prisma.levelRecord.findFirst({
      where: { userId },
      orderBy: { promotedAt: 'desc' },
    });

    // 获取当前星币余额
    const latestTransaction = await prisma.pointTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const currentBalance = latestTransaction?.balance || 0;

    // 获取积分统计
    const pointStats = await prisma.pointTransaction.aggregate({
      where: { userId },
      _sum: {
        amount: true,
      },
    });

    // 获取等级进度
    const totalExp = currentLevel?.totalExp || 0;
    const currentExp = currentLevel?.exp || 0;
    const currentLevelNum = currentLevel?.level || 1;
    const nextLevelExp = currentLevelNum * 100; // 每级100经验
    const progressPercentage = (currentExp / nextLevelExp) * 100;

    return {
      level: currentLevelNum,
      title: currentLevel?.title || '见习宇航员',
      totalExp,
      currentExp,
      nextLevelExp,
      progressPercentage: Math.min(progressPercentage, 100),
      starCoins: currentBalance,
      totalEarned: pointStats._sum.amount || 0,
      shipName: currentLevel?.shipName || '探索者号',
    };
  }

  /**
   * 获取用户积分交易历史
   */
  async getPointTransactions(userId: string, filters: {
    type?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pointTransaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 获取用户等级历史
   */
  async getLevelHistory(userId: string, filters: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const [levelRecords, total] = await Promise.all([
      prisma.levelRecord.findMany({
        where: { userId },
        orderBy: { promotedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.levelRecord.count({ where: { userId } }),
    ]);

    return {
      levelRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 增加用户星币
   */
  async addStarCoins(userId: string, amount: number, description: string, relatedId?: string) {
    if (amount <= 0) {
      throw new AppError('星币数量必须大于0', 400, 'VALIDATION_ERROR' as any);
    }

    return await prisma.$transaction(async (tx) => {
      // 获取当前余额
      const latestTransaction = await tx.pointTransaction.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const currentBalance = latestTransaction?.balance || 0;
      const newBalance = currentBalance + amount;

      // 创建交易记录
      const transaction = await tx.pointTransaction.create({
        data: {
          userId,
          type: 'EARN',
          amount,
          balance: newBalance,
          description,
          relatedId,
        },
      });

      return transaction;
    });
  }

  /**
   * 扣除用户星币
   */
  async deductStarCoins(userId: string, amount: number, description: string, relatedId?: string) {
    if (amount <= 0) {
      throw new AppError('星币数量必须大于0', 400, 'VALIDATION_ERROR' as any);
    }

    return await prisma.$transaction(async (tx) => {
      // 获取当前余额
      const latestTransaction = await tx.pointTransaction.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const currentBalance = latestTransaction?.balance || 0;

      if (currentBalance < amount) {
        throw new AppError('星币余额不足', 400, 'INSUFFICIENT_BALANCE' as any);
      }

      const newBalance = currentBalance - amount;

      // 创建交易记录
      const transaction = await tx.pointTransaction.create({
        data: {
          userId,
          type: 'SPEND',
          amount: -amount,
          balance: newBalance,
          description,
          relatedId,
        },
      });

      return transaction;
    });
  }

  /**
   * 增加用户经验值并检查升级
   */
  async addExperience(userId: string, expAmount: number, description: string, relatedId?: string) {
    if (expAmount <= 0) {
      throw new AppError('经验值必须大于0', 400, 'VALIDATION_ERROR' as any);
    }

    return await prisma.$transaction(async (tx) => {
      // 获取当前等级记录
      const currentLevel = await tx.levelRecord.findFirst({
        where: { userId },
        orderBy: { promotedAt: 'desc' },
      });

      if (!currentLevel) {
        // 如果没有等级记录，创建初始等级
        await tx.levelRecord.create({
          data: {
            userId,
            level: 1,
            title: '见习宇航员',
            exp: expAmount,
            totalExp: expAmount,
            shipName: '探索者号',
          },
        });
        return { levelUp: false, newLevel: 1 };
      }

      const newExp = currentLevel.exp + expAmount;
      const newTotalExp = currentLevel.totalExp + expAmount;

      // 计算新等级（每100经验值升1级）
      const newLevel = Math.floor(newTotalExp / 100) + 1;
      const oldLevel = currentLevel.level;

      if (newLevel > oldLevel) {
        // 升级了！
        const levelTitles = [
          '见习宇航员',
          '初级飞行员',
          '中级探索者',
          '高级指挥官',
          '星际舰长',
          '银河英雄',
          '宇宙传奇',
          '太空大师',
        ];

        await tx.levelRecord.create({
          data: {
            userId,
            level: newLevel,
            title: levelTitles[Math.min(newLevel - 1, levelTitles.length - 1)],
            exp: newTotalExp % 100,
            totalExp: newTotalExp,
            shipName: currentLevel.shipName, // 保持船名不变
          },
        });

        // 升级奖励星币
        const bonusCoins = newLevel * 10; // 每级奖励10星币
        await this.addStarCoinsInTransaction(tx, userId, bonusCoins, `升级奖励: 达到${newLevel}级`);

        return {
          levelUp: true,
          oldLevel,
          newLevel,
          newTitle: levelTitles[Math.min(newLevel - 1, levelTitles.length - 1)],
          bonusCoins
        };
      } else {
        // 没有升级，只更新经验值
        await tx.levelRecord.update({
          where: { id: currentLevel.id },
          data: {
            exp: newExp,
            totalExp: newTotalExp,
          },
        });

        return { levelUp: false, newLevel: oldLevel };
      }
    });
  }

  /**
   * 在事务中添加星币（内部方法）
   */
  private async addStarCoinsInTransaction(
    tx: any,
    userId: string,
    amount: number,
    description: string,
    relatedId?: string
  ) {
    // 获取当前余额
    const latestTransaction = await tx.pointTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const currentBalance = latestTransaction?.balance || 0;
    const newBalance = currentBalance + amount;

    // 创建交易记录
    await tx.pointTransaction.create({
      data: {
        userId,
        type: 'BONUS',
        amount,
        balance: newBalance,
        description,
        relatedId,
      },
    });
  }

  /**
   * 更新用户飞船名称
   */
  async updateShipName(userId: string, shipName: string) {
    if (!shipName || shipName.trim().length === 0) {
      throw new AppError('飞船名称不能为空', 400, 'VALIDATION_ERROR' as any);
    }

    if (shipName.length > 50) {
      throw new AppError('飞船名称不能超过50个字符', 400, 'VALIDATION_ERROR' as any);
    }

    const currentLevel = await prisma.levelRecord.findFirst({
      where: { userId },
      orderBy: { promotedAt: 'desc' },
    });

    if (!currentLevel) {
      throw new AppError('用户等级记录不存在', 404, 'NOT_FOUND' as any);
    }

    const updatedLevel = await prisma.levelRecord.update({
      where: { id: currentLevel.id },
      data: { shipName: shipName.trim() },
    });

    return updatedLevel;
  }

  /**
   * 获取积分统计信息
   */
  async getPointsStats(userId: string, period: 'today' | 'week' | 'month' = 'today') {
    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    const [earnedStats, spentStats, transactionCount, levelProgress] = await Promise.all([
      // 获得的星币统计
      prisma.pointTransaction.aggregate({
        where: {
          userId,
          type: { in: ['EARN', 'BONUS'] },
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // 消费的星币统计
      prisma.pointTransaction.aggregate({
        where: {
          userId,
          type: 'SPEND',
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // 交易次数
      prisma.pointTransaction.count({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
      }),
      // 等级进度
      this.getUserPoints(userId),
    ]);

    const totalEarned = earnedStats._sum.amount || 0;
    const totalSpent = Math.abs(spentStats._sum.amount || 0);
    const netGain = totalEarned - totalSpent;

    return {
      period,
      totalEarned,
      totalSpent,
      netGain,
      transactionCount,
      earningTransactions: earnedStats._count || 0,
      spendingTransactions: spentStats._count || 0,
      currentLevel: levelProgress.level,
      currentTitle: levelProgress.title,
      progressPercentage: levelProgress.progressPercentage,
    };
  }

  /**
   * 获取排行榜
   */
  async getLeaderboard(type: 'level' | 'coins' = 'level', limit: number = 10) {
    if (limit > 100) {
      limit = 100; // 最大100条
    }

    if (type === 'level') {
      // 按等级排序 - 获取最新等级记录
      const allLevelRecords = await prisma.levelRecord.findMany({
        orderBy: [
          { level: 'desc' },
          { totalExp: 'desc' },
          { promotedAt: 'asc' },
        ],
        take: limit * 2, // 获取更多记录，因为可能有重复用户
      });

      // 获取每个用户的最新等级记录
      const userLatestLevels = new Map();
      for (const record of allLevelRecords) {
        if (!userLatestLevels.has(record.userId) ||
            record.promotedAt > userLatestLevels.get(record.userId).promotedAt) {
          userLatestLevels.set(record.userId, record);
        }
      }

      // 获取用户信息
      const userIds = Array.from(userLatestLevels.keys());
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      });

      const userMap = new Map(users.map(user => [user.id, user]));

      // 组装结果
      const leaders = Array.from(userLatestLevels.values())
        .sort((a, b) => {
          if (a.level !== b.level) return b.level - a.level;
          if (a.totalExp !== b.totalExp) return b.totalExp - a.totalExp;
          return a.promotedAt.getTime() - b.promotedAt.getTime();
        })
        .slice(0, limit);

      return leaders.map((leader, index) => ({
        rank: index + 1,
        user: userMap.get(leader.userId),
        level: leader.level,
        title: leader.title,
        totalExp: leader.totalExp,
        shipName: leader.shipName,
      }));
    } else {
      // 按星币排序 - 获取最新交易记录来获取余额
      const allTransactions = await prisma.pointTransaction.findMany({
        orderBy: { balance: 'desc' },
        take: limit * 2, // 获取更多记录，因为可能有重复用户
      });

      // 获取每个用户的最新余额
      const userLatestBalances = new Map();
      for (const transaction of allTransactions) {
        if (!userLatestBalances.has(transaction.userId)) {
          userLatestBalances.set(transaction.userId, transaction.balance);
        }
      }

      // 获取用户信息
      const userIds = Array.from(userLatestBalances.keys());
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      });

      const userMap = new Map(users.map(user => [user.id, user]));

      // 组装结果
      const leaders = Array.from(userLatestBalances.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit);

      return leaders.map(([userId, balance], index) => ({
        rank: index + 1,
        user: userMap.get(userId),
        balance,
      }));
    }
  }
}