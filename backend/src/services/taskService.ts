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

    // 周任务使用增量完成逻辑
    if (task.type === 'WEEKLY') {
      return this.incrementalCompleteTask(taskId, userId);
    }

    // 每日任务使用原有的完成逻辑
    return this.singleCompleteTask(taskId, userId, task);
  }

  /**
   * 增量完成任务（周任务）
   */
  async incrementalCompleteTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId, isActive: true },
      include: {
        completions: {
          where: {
            userId,
            completionType: 'INCREMENT',
          },
        },
      },
    });

    if (!task) {
      throw new AppError('任务不存在或已停用', 404, 'NOT_FOUND' as any);
    }

    // 获取当前周的开始和结束时间
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // 获取本周内该任务的完成记录
    const weeklyCompletions = await prisma.taskCompletion.count({
      where: {
        taskId,
        userId,
        completionType: 'INCREMENT',
        completedAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    const targetCount = task.targetCount || 1;

    // 检查是否已经达到目标次数
    if (weeklyCompletions >= targetCount) {
      throw new AppError(`本周已完成该任务 ${weeklyCompletions}/${targetCount} 次，无需继续完成`, 409, 'CONFLICT' as any);
    }

    // 检查是否今天已经完成过（防止同一天重复完成）
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayCompletion = await prisma.taskCompletion.findFirst({
      where: {
        taskId,
        userId,
        completionType: 'INCREMENT',
        completedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    if (todayCompletion) {
      throw new AppError('今天已经完成过这个周任务了，请明天再来', 409, 'CONFLICT' as any);
    }

    // 计算当前完成后的进度
    const currentCount = weeklyCompletions + 1;
    const isFinalCompletion = currentCount === targetCount;

    // 只有在最后一次完成时才给予奖励
    let starCoinsAwarded = 0;
    let expGained = 0;
    let shouldAwardRewards = false;

    if (isFinalCompletion) {
      shouldAwardRewards = true;
      starCoinsAwarded = task.starCoins;
      expGained = task.expReward || 50; // 周任务默认50经验

      // 计算连击奖励（基于上周完成情况）
      let streak = 0;
      let bonusMultiplier = 1.0;

      // 检查上周是否完成了这个任务
      const lastWeekStart = new Date(startOfWeek);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(endOfWeek);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

      const lastWeekCompletions = await prisma.taskCompletion.count({
        where: {
          taskId,
          userId,
          completionType: 'INCREMENT',
          completedAt: {
            gte: lastWeekStart,
            lte: lastWeekEnd,
          },
        },
      });

      const lastWeekTargetCount = task.targetCount || 1;
      if (lastWeekCompletions >= lastWeekTargetCount) {
        // 上周完成了，计算连续周数
        streak = await this.calculateWeeklyStreak(taskId, userId);
        bonusMultiplier = 1.0 + (streak * 0.1); // 每连续一周增加10%奖励
        bonusMultiplier = Math.min(bonusMultiplier, 2.0); // 最大2倍奖励
      }

      // 应用连击奖励
      starCoinsAwarded = Math.round(starCoinsAwarded * bonusMultiplier);
      expGained = Math.round(expGained * bonusMultiplier);

      // 开始事务处理（只在奖励时）
      const result = await prisma.$transaction(async (tx) => {
        // 创建完成记录
        const completion = await tx.taskCompletion.create({
          data: {
            taskId,
            userId,
            starCoins: starCoinsAwarded,
            expGained: expGained,
            completionType: 'INCREMENT',
            streak,
            bonusMultiplier,
          },
        });

        // 更新用户经验值和等级
        await this.updateUserLevel(tx, userId, expGained);

        // 更新用户星币余额
        await this.updateUserPoints(tx, userId, starCoinsAwarded, 'EARN', `完成周任务: ${task.title} (${currentCount}/${targetCount})`);

        return completion;
      });

      return {
        completion: result,
        starCoins: starCoinsAwarded,
        expGained: expGained,
        streak,
        bonusMultiplier,
        progress: {
          current: currentCount,
          target: targetCount,
          isCompleted: true,
        },
        message: `恭喜！已完成周任务"${task.title}"，获得 ${starCoinsAwarded} 星币和 ${expGained} 经验${streak > 0 ? ` (${streak}周连击奖励!)` : ''}`,
      };
    } else {
      // 未达到目标，只记录完成，不给予奖励
      const completion = await prisma.taskCompletion.create({
        data: {
          taskId,
          userId,
          starCoins: 0,
          expGained: 0,
          completionType: 'INCREMENT',
          streak: 0,
          bonusMultiplier: 1.0,
        },
      });

      return {
        completion,
        starCoins: 0,
        expGained: 0,
        streak: 0,
        bonusMultiplier: 1.0,
        progress: {
          current: currentCount,
          target: targetCount,
          isCompleted: false,
        },
        message: `已完成周任务"${task.title}" ${currentCount}/${targetCount} 次，还需完成 ${targetCount - currentCount} 次获得奖励`,
      };
    }
  }

  /**
   * 单次完成任务（每日任务）
   */
  async singleCompleteTask(taskId: string, userId: string, passedTask?: any) {
    const task = passedTask || await prisma.task.findUnique({
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

    // 根据任务类型自动设置经验值
    let baseExpGained = task.expReward;
    if (task.type === 'DAILY') {
      baseExpGained = 10; // 每日任务10点经验
    } else if (task.type === 'WEEKLY') {
      baseExpGained = 50; // 每周任务50点经验
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
    const actualExpGained = Math.round(baseExpGained * bonusMultiplier);

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
   * 取消完成任务
   */
  async uncompleteTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId, isActive: true },
    });

    if (!task) {
      throw new AppError('任务不存在或已停用', 404, 'NOT_FOUND' as any);
    }

    // 周任务使用增量取消逻辑
    if (task.type === 'WEEKLY') {
      return this.incrementalUncompleteTask(taskId, userId);
    }

    // 每日任务使用原有的取消完成逻辑
    return this.singleUncompleteTask(taskId, userId, task);
  }

  /**
   * 增量取消完成任务（周任务）
   */
  async incrementalUncompleteTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId, isActive: true },
    });

    if (!task) {
      throw new AppError('任务不存在或已停用', 404, 'NOT_FOUND' as any);
    }

    // 获取当前周的开始和结束时间
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // 查找最近的一次完成记录（今天的，如果没有则查找本周最近的）
    let existingCompletion = await prisma.taskCompletion.findFirst({
      where: {
        taskId,
        userId,
        completionType: 'INCREMENT',
        completedAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lte: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // 如果今天没有完成，查找本周最近的一次完成
    if (!existingCompletion) {
      existingCompletion = await prisma.taskCompletion.findFirst({
        where: {
          taskId,
          userId,
          completionType: 'INCREMENT',
          completedAt: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
        },
        orderBy: { completedAt: 'desc' },
      });
    }

    if (!existingCompletion) {
      throw new AppError('本周没有完成过这个任务', 404, 'NOT_FOUND' as any);
    }

    // 计算取消完成后的进度
    const weeklyCompletionsBefore = await prisma.taskCompletion.count({
      where: {
        taskId,
        userId,
        completionType: 'INCREMENT',
        completedAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    const targetCount = task.targetCount || 1;
    const wasCompleted = weeklyCompletionsBefore >= targetCount;
    const weeklyCompletionsAfter = weeklyCompletionsBefore - 1;
    const isStillCompleted = weeklyCompletionsAfter >= targetCount;

    // 使用事务处理
    const result = await prisma.$transaction(async (tx) => {
      // 删除完成记录
      const deletedCompletion = await tx.taskCompletion.delete({
        where: { id: existingCompletion.id },
      });

      // 只有在原本已获得奖励的情况下才扣除奖励
      if (existingCompletion.starCoins > 0 || existingCompletion.expGained > 0) {
        // 扣除用户经验值和等级（确保不会低于0）
        await this.updateUserLevel(tx, userId, -existingCompletion.expGained);

        // 扣除用户星币余额（确保不会低于0）
        await this.updateUserPoints(tx, userId, -existingCompletion.starCoins, 'DEDUCT', `取消完成周任务: ${task.title}`);
      }

      return deletedCompletion;
    });

    return {
      completion: result,
      starCoinsDeducted: existingCompletion.starCoins,
      expDeducted: existingCompletion.expGained,
      progress: {
        current: weeklyCompletionsAfter,
        target: targetCount,
        wasCompleted: wasCompleted,
        isStillCompleted: isStillCompleted,
      },
      message: wasCompleted
        ? `已取消周任务"${task.title}"的完成状态，扣除 ${existingCompletion.starCoins} 星币和 ${existingCompletion.expGained} 经验。当前进度：${weeklyCompletionsAfter}/${targetCount}`
        : `已取消周任务"${task.title}"的一次完成记录。当前进度：${weeklyCompletionsAfter}/${targetCount}`,
    };
  }

  /**
   * 单次取消完成任务（每日任务）
   */
  async singleUncompleteTask(taskId: string, userId: string, passedTask?: any) {
    const task = passedTask || await prisma.task.findUnique({
      where: { id: taskId, isActive: true },
    });

    if (!task) {
      throw new AppError('任务不存在或已停用', 404, 'NOT_FOUND' as any);
    }

    // 查找今天的完成记录
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

    if (!existingCompletion) {
      throw new AppError('今天没有完成过这个任务', 404, 'NOT_FOUND' as any);
    }

    // 使用事务处理
    const result = await prisma.$transaction(async (tx) => {
      // 删除完成记录
      const deletedCompletion = await tx.taskCompletion.delete({
        where: { id: existingCompletion.id },
      });

      // 扣除用户经验值和等级（确保不会低于0）
      await this.updateUserLevel(tx, userId, -existingCompletion.expGained);

      // 扣除用户星币余额（确保不会低于0）
      await this.updateUserPoints(tx, userId, -existingCompletion.starCoins, 'DEDUCT', `取消完成任务: ${task.title}`);

      return deletedCompletion;
    });

    return {
      completion: result,
      starCoinsDeducted: existingCompletion.starCoins,
      expDeducted: existingCompletion.expGained,
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
   * 计算周任务连击周数
   */
  private async calculateWeeklyStreak(taskId: string, userId: string): Promise<number> {
    let streak = 0;
    let currentWeek = new Date();

    // 设置到本周开始
    const dayOfWeek = currentWeek.getDay();
    const diff = currentWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentWeek.setDate(diff);
    currentWeek.setHours(0, 0, 0, 0);

    // 向前查找连续完成的周数
    while (true) {
      // 移动到上一周
      currentWeek.setDate(currentWeek.getDate() - 7);
      const weekStart = new Date(currentWeek);
      const weekEnd = new Date(currentWeek);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // 获取任务的目标次数
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { targetCount: true },
      });

      const targetCount = task?.targetCount || 1;

      // 检查该周是否完成了目标次数
      const weeklyCompletions = await prisma.taskCompletion.count({
        where: {
          taskId,
          userId,
          completionType: 'INCREMENT',
          completedAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      });

      if (weeklyCompletions >= targetCount) {
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
      completed: task.completions.length > 0, // 添加completed属性供前端使用
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

    console.log('Debug - getWeeklyTasks:', {
      userId,
      startOfWeek: startOfWeek.toISOString(),
      endOfWeek: endOfWeek.toISOString(),
      startOfWeekLocal: startOfWeek.toLocaleString('zh-CN'),
      endOfWeekLocal: endOfWeek.toLocaleString('zh-CN'),
      allUserIds
    });

    // 获取所有活跃的周任务
    const weeklyTasks = await prisma.task.findMany({
      where: {
        isActive: true,
        type: 'WEEKLY',
        createdBy: { in: allUserIds },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 为每个任务手动查询本周完成次数
    const tasksWithCompletions = await Promise.all(
      weeklyTasks.map(async (task) => {
        // 使用原始SQL查询来避免时区问题
        const completions = await prisma.$queryRaw<Array<{count: number}>>`
          SELECT COUNT(*) as count
          FROM task_completions
          WHERE taskId = ${task.id}
            AND userId = ${userId}
            AND completionType = 'INCREMENT'
            AND completedAt >= ${startOfWeek}
            AND completedAt <= ${endOfWeek}
        `;

        const weeklyCompletedCount = Number(completions[0]?.count || 0);
        const isCompletedThisWeek = weeklyCompletedCount >= (task.targetCount || 1);

        return {
          ...task,
          completed: isCompletedThisWeek,
          isCompletedThisWeek,
          weeklyCompletedCount,
          completions: [], // 保持接口一致性
          weekCompletion: null,
        };
      })
    );

    return tasksWithCompletions;
  }
}
