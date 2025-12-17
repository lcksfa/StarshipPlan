import prisma from '../lib/database';
import { AppError } from '../types';

export class TaskService {
  /**
   * 创建任务
   */
  async createTask(taskData: {
    title: string;
    description?: string;
    type: 'DAILY' | 'WEEKLY' | 'CUSTOM';
    starCoins: number;
    expReward: number;
    frequency: 'DAILY' | 'WEEKLY' | 'WEEKDAYS' | 'WEEKENDS' | 'CUSTOM';
    weekdays?: string;
    timeLimit?: string;
    category?: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    createdBy: string;
  }) {
    const task = await prisma.task.create({
      data: {
        ...taskData,
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    return task;
  }

  /**
   * 获取任务列表
   */
  async getTasks(filters: {
    userId?: string;
    type?: string;
    category?: string;
    difficulty?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      type,
      category,
      difficulty,
      isActive = true,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = { isActive };

    // 如果指定了用户ID，只返回该用户创建的任务或分配给其子任务
    if (userId) {
      // 先获取子女ID
      const children = await prisma.user.findMany({
        where: { parentId: userId },
        select: { id: true },
      });

      const childrenIds = children.map(child => child.id);
      const allUserIds = [userId, ...childrenIds];

      where.createdBy = { in: allUserIds };
    }

    if (type) where.type = type;
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          completions: {
            where: {
              completedAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
            select: {
              id: true,
              userId: true,
              completedAt: true,
              starCoins: true,
              expGained: true,
            },
          },
          _count: {
            select: {
              completions: true,
            },
          },
        },
        orderBy: [
          { type: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
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
   * 获取单个任务详情
   */
  async getTaskById(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            role: true,
          },
        },
        completions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
          orderBy: { completedAt: 'desc' },
        },
        _count: {
          select: {
            completions: true,
          },
        },
      },
    });

    if (!task) {
      throw new AppError('任务不存在', 404, 'NOT_FOUND' as any);
    }

    return task;
  }

  /**
   * 更新任务
   */
  async updateTask(taskId: string, updateData: {
    title?: string;
    description?: string;
    starCoins?: number;
    expReward?: number;
    isActive?: boolean;
    frequency?: string;
    weekdays?: string;
    timeLimit?: string;
    category?: string;
    difficulty?: string;
  }) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('任务不存在', 404, 'NOT_FOUND' as any);
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    return updatedTask;
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('任务不存在', 404, 'NOT_FOUND' as any);
    }

    // 检查是否有完成记录
    const completionCount = await prisma.taskCompletion.count({
      where: { taskId },
    });

    if (completionCount > 0) {
      // 如果有完成记录，只是标记为不活跃而不是删除
      await prisma.task.update({
        where: { id: taskId },
        data: { isActive: false },
      });
    } else {
      // 如果没有完成记录，可以直接删除
      await prisma.task.delete({
        where: { id: taskId },
      });
    }
  }

  /**
   * 完成任务
   */
  async completeTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId, isActive: true },
    });

    if (!task) {
      throw new AppError('任务不存在或已停用', 404, 'NOT_FOUND' as any);
    }

    // 检查今天是否已经完成过这个任务
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const existingCompletion = await prisma.taskCompletion.findFirst({
      where: {
        taskId,
        userId,
        completedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingCompletion) {
      throw new AppError('今天已经完成过这个任务了', 409, 'CONFLICT' as any);
    }

    // 检查时间限制
    if (task.timeLimit) {
      const currentTime = new Date();
      const [hours, minutes] = task.timeLimit.split(':').map(Number);
      const timeLimit = new Date();
      timeLimit.setHours(hours, minutes, 0, 0);

      if (currentTime > timeLimit) {
        throw new AppError(`任务需要在${task.timeLimit}之前完成`, 400, 'VALIDATION_ERROR' as any);
      }
    }

    // 计算连击奖励
    let streak = 0;
    let bonusMultiplier = 1.0;

    // 获取昨天的完成记录
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

    const yesterdayCompletion = await prisma.taskCompletion.findFirst({
      where: {
        taskId,
        userId,
        completedAt: {
          gte: startOfYesterday,
          lte: endOfYesterday,
        },
      },
    });

    if (yesterdayCompletion) {
      // 查找连续完成天数
      streak = await this.calculateStreak(taskId, userId);
      bonusMultiplier = 1.0 + (streak * 0.1); // 每连击一天增加10%奖励
      bonusMultiplier = Math.min(bonusMultiplier, 2.0); // 最大2倍奖励
    }

    // 计算实际获得的星币和经验值
    const actualStarCoins = Math.round(task.starCoins * bonusMultiplier);
    const actualExpGained = Math.round(task.expReward * bonusMultiplier);

    // 开始事务处理
    const result = await prisma.$transaction(async (tx) => {
      // 创建完成记录
      const completion = await tx.taskCompletion.create({
        data: {
          taskId,
          userId,
          starCoins: actualStarCoins,
          expGained: actualExpGained,
          streak,
          bonusMultiplier,
        },
      });

      // 更新用户经验值和等级
      await this.updateUserLevel(tx, userId, actualExpGained);

      // 更新用户星币余额
      await this.updateUserPoints(tx, userId, actualStarCoins, 'EARN', `完成任务: ${task.title}`);

      return completion;
    });

    return {
      completion: result,
      starCoins: actualStarCoins,
      expGained: actualExpGained,
      streak,
      bonusMultiplier,
    };
  }

  /**
   * 计算连击天数
   */
  private async calculateStreak(taskId: string, userId: string): Promise<number> {
    let streak = 0;
    let currentDate = new Date();

    // 向前查找连续完成的天数
    while (true) {
      currentDate.setDate(currentDate.getDate() - 1);
      const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

      const completion = await prisma.taskCompletion.findFirst({
        where: {
          taskId,
          userId,
          completedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (completion) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 更新用户等级
   */
  private async updateUserLevel(
    tx: any,
    userId: string,
    expGained: number
  ) {
    // 获取当前等级记录
    const currentLevel = await tx.levelRecord.findFirst({
      where: { userId },
      orderBy: { promotedAt: 'desc' },
    });

    if (!currentLevel) {
      // 如果没有等级记录，创建一个
      await tx.levelRecord.create({
        data: {
          userId,
          level: 1,
          title: '见习宇航员',
          exp: expGained,
          totalExp: expGained,
          shipName: '探索者号',
        },
      });
      return;
    }

    const newExp = currentLevel.exp + expGained;
    const newTotalExp = currentLevel.totalExp + expGained;

    // 计算新等级（每100经验值升1级）
    const newLevel = Math.floor(newTotalExp / 100) + 1;

    if (newLevel > currentLevel.level) {
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
          exp: newExp % 100,
          totalExp: newTotalExp,
          shipName: currentLevel.shipName, // 保持船名不变
        },
      });
    } else {
      // 没有升级，只更新经验值
      await tx.levelRecord.update({
        where: { id: currentLevel.id },
        data: {
          exp: newExp,
          totalExp: newTotalExp,
        },
      });
    }
  }

  /**
   * 更新用户星币
   */
  private async updateUserPoints(
    tx: any,
    userId: string,
    amount: number,
    type: string,
    description: string
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
        type,
        amount,
        balance: newBalance,
        description,
      },
    });
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStats(userId: string, period: 'today' | 'week' | 'month' = 'today') {
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

    // 先获取用户的所有子女ID
    const children = await prisma.user.findMany({
      where: { parentId: userId },
      select: { id: true },
    });

    const childrenIds = children.map(child => child.id);
    const allUserIds = [userId, ...childrenIds];

    const [completedTasks, totalTasks, totalStarCoins] = await Promise.all([
      prisma.taskCompletion.count({
        where: {
          userId,
          completedAt: {
            gte: startDate,
          },
        },
      }),
      prisma.task.count({
        where: {
          createdBy: { in: allUserIds },
          isActive: true,
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.taskCompletion.aggregate({
        where: {
          userId,
          completedAt: {
            gte: startDate,
          },
        },
        _sum: {
          starCoins: true,
        },
      }),
    ]);

    return {
      period,
      completedTasks,
      totalTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      totalStarCoins: totalStarCoins._sum.starCoins || 0,
    };
  }

  /**
   * 获取用户的今日任务
   */
  async getTodayTasks(userId: string) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // 先获取用户的所有子女ID
    const children = await prisma.user.findMany({
      where: { parentId: userId },
      select: { id: true },
    });

    const childrenIds = children.map(child => child.id);
    const allUserIds = [userId, ...childrenIds];

    // 获取所有活跃任务
    const allTasks = await prisma.task.findMany({
      where: {
        isActive: true,
        createdBy: { in: allUserIds },
      },
      include: {
        completions: {
          where: {
            userId,
            completedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
    });

    // 根据任务频率过滤今日应该执行的任务
    const dayOfWeek = today.getDay(); // 0=周日, 1=周一...
    const todayTasks = allTasks.filter(task => {
      switch (task.frequency) {
        case 'DAILY':
          return true;
        case 'WEEKLY':
          // 每周任务在周一显示
          return dayOfWeek === 1;
        case 'WEEKDAYS':
          // 工作日（周一到周五）
          return dayOfWeek >= 1 && dayOfWeek <= 5;
        case 'WEEKENDS':
          // 周末（周六和周日）
          return dayOfWeek === 0 || dayOfWeek === 6;
        case 'CUSTOM':
          // 自定义，检查weekdays字段
          if (!task.weekdays) return false;
          const weekdays = JSON.parse(task.weekdays);
          return weekdays.includes(dayOfWeek);
        default:
          return false;
      }
    });

    // 标记今日是否已完成
    return todayTasks.map(task => ({
      ...task,
      isCompletedToday: task.completions.length > 0,
      todayCompletion: task.completions[0] || null,
    }));
  }

  /**
   * 获取本周任务
   */
  async getWeeklyTasks(userId: string) {
    // 获取当前周的开始（周一0点）和结束（周日23:59:59）
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=周日, 1=周一...
    const startOfWeek = new Date(today);
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // 调整到周一
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // 先获取用户的所有子女ID
    const children = await prisma.user.findMany({
      where: { parentId: userId },
      select: { id: true },
    });

    const childrenIds = children.map(child => child.id);
    const allUserIds = [userId, ...childrenIds];

    // 获取所有活跃的周任务
    const weeklyTasks = await prisma.task.findMany({
      where: {
        isActive: true,
        type: 'WEEKLY',
        createdBy: { in: allUserIds },
      },
      include: {
        completions: {
          where: {
            userId,
            completedAt: {
              gte: startOfWeek,
              lte: endOfWeek,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 标记本周是否已完成
    return weeklyTasks.map(task => ({
      ...task,
      isCompletedThisWeek: task.completions.length > 0,
      weekCompletion: task.completions[0] || null,
    }));
  }
}
