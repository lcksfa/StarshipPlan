import prisma from '../lib/database';
import { AppError } from '../types';

export class PunishmentService {
  /**
   * 获取用户惩罚记录
   */
  async getPunishments(userId: string, filters: {
    status?: string;
    severity?: string;
    type?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, severity, type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (type) where.type = type;

    const [punishments, total] = await Promise.all([
      prisma.punishmentRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          task: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          rule: {
            select: {
              id: true,
              name: true,
              description: true,
              value: true,
            },
          },
        },
      }),
      prisma.punishmentRecord.count({ where }),
    ]);

    return {
      punishments,
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
   * 获取所有惩罚规则（家长权限）
   */
  async getPunishmentRules(userId: string, filters: {
    isActive?: boolean;
    type?: string;
    severity?: string;
  } = {}) {
    const { isActive = true, type, severity } = filters;

    const where: any = { isActive };
    if (type) where.type = type;
    if (severity) where.severity = severity;

    const rules = await prisma.punishmentRule.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    return rules;
  }

  /**
   * 创建惩罚记录（家长权限）
   */
  async createPunishment(userId: string, punishmentData: {
    targetUserId: string;
    taskId?: string;
    ruleId?: string;
    type: 'DEDUCT_COINS' | 'EXTRA_TASK' | 'RESTRICT_PRIVILEGE';
    reason: string;
    severity: 'MINOR' | 'MEDIUM' | 'SEVERE';
    value: number;
  }) {
    // 检查目标用户是否为当前用户的子女
    const targetUser = await prisma.user.findUnique({
      where: { id: punishmentData.targetUserId },
    });

    if (!targetUser || targetUser.parentId !== userId) {
      throw new AppError('只能对子女执行惩罚', 403, 'FORBIDDEN' as any);
    }

    return await prisma.$transaction(async (tx) => {
      // 创建惩罚记录
      const punishment = await tx.punishmentRecord.create({
        data: {
          userId: punishmentData.targetUserId,
          taskId: punishmentData.taskId,
          ruleId: punishmentData.ruleId,
          type: punishmentData.type,
          reason: punishmentData.reason,
          severity: punishmentData.severity,
          value: punishmentData.value,
          status: 'ACTIVE',
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          rule: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      // 如果是扣除星币，立即执行
      if (punishmentData.type === 'DEDUCT_COINS') {
        // 获取当前余额
        const latestTransaction = await tx.pointTransaction.findFirst({
          where: { userId: punishmentData.targetUserId },
          orderBy: { createdAt: 'desc' },
        });

        const currentBalance = latestTransaction?.balance || 0;
        const newBalance = currentBalance - punishmentData.value;

        // 创建交易记录
        await tx.pointTransaction.create({
          data: {
            userId: punishmentData.targetUserId,
            type: 'PUNISHMENT',
            amount: -punishmentData.value,
            balance: newBalance,
            description: `惩罚扣除: ${punishmentData.reason}`,
            relatedId: punishment.id,
          },
        });
      }

      return punishment;
    });
  }

  /**
   * 更新惩罚记录状态（家长权限）
   */
  async updatePunishmentStatus(userId: string, punishmentId: string, status: 'ACTIVE' | 'COMPLETED' | 'WAIVED') {
    const punishment = await prisma.punishmentRecord.findUnique({
      where: { id: punishmentId },
      include: {
        user: {
          select: {
            id: true,
            parentId: true,
          },
        },
      },
    });

    if (!punishment) {
      throw new AppError('惩罚记录不存在', 404, 'NOT_FOUND' as any);
    }

    // 检查权限
    if (punishment.user.parentId !== userId) {
      throw new AppError('无权操作此惩罚记录', 403, 'FORBIDDEN' as any);
    }

    // 检查状态转换的合法性
    if (punishment.status === 'COMPLETED' && status !== 'ACTIVE') {
      throw new AppError('已完成的惩罚不能修改状态', 400, 'INVALID_STATUS' as any);
    }

    if (punishment.status === 'WAIVED' && status !== 'ACTIVE') {
      throw new AppError('已豁免的惩罚不能修改状态', 400, 'INVALID_STATUS' as any);
    }

    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = userId;
    } else if (status === 'WAIVED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = userId;
    }

    return await prisma.$transaction(async (tx) => {
      const updatedPunishment = await tx.punishmentRecord.update({
        where: { id: punishmentId },
        data: updateData,
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          rule: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      // 如果豁免了扣除星币的惩罚，需要返还星币
      if (punishment.type === 'DEDUCT_COINS' && status === 'WAIVED') {
        // 获取当前余额
        const latestTransaction = await tx.pointTransaction.findFirst({
          where: { userId: punishment.userId },
          orderBy: { createdAt: 'desc' },
        });

        const currentBalance = latestTransaction?.balance || 0;
        const newBalance = currentBalance + punishment.value;

        // 创建返还交易记录
        await tx.pointTransaction.create({
          data: {
            userId: punishment.userId,
            type: 'REFUND',
            amount: punishment.value,
            balance: newBalance,
            description: `惩罚豁免返还: ${punishment.reason}`,
            relatedId: punishment.id,
          },
        });
      }

      return updatedPunishment;
    });
  }

  /**
   * 创建惩罚规则（家长权限）
   */
  async createPunishmentRule(userId: string, ruleData: {
    name: string;
    description: string;
    type: 'DEDUCT_COINS' | 'EXTRA_TASK' | 'RESTRICT_PRIVILEGE';
    severity: 'MINOR' | 'MEDIUM' | 'SEVERE';
    value: number;
  }) {
    return await prisma.punishmentRule.create({
      data: {
        ...ruleData,
        createdBy: userId,
        isActive: true,
      },
    });
  }

  /**
   * 更新惩罚规则（家长权限）
   */
  async updatePunishmentRule(userId: string, ruleId: string, updateData: {
    name?: string;
    description?: string;
    type?: string;
    severity?: string;
    value?: number;
    isActive?: boolean;
  }) {
    const rule = await prisma.punishmentRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new AppError('惩罚规则不存在', 404, 'NOT_FOUND' as any);
    }

    if (rule.createdBy !== userId) {
      throw new AppError('无权修改此惩罚规则', 403, 'FORBIDDEN' as any);
    }

    return await prisma.punishmentRule.update({
      where: { id: ruleId },
      data: updateData,
    });
  }

  /**
   * 删除惩罚规则（家长权限）
   */
  async deletePunishmentRule(userId: string, ruleId: string) {
    const rule = await prisma.punishmentRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new AppError('惩罚规则不存在', 404, 'NOT_FOUND' as any);
    }

    if (rule.createdBy !== userId) {
      throw new AppError('无权删除此惩罚规则', 403, 'FORBIDDEN' as any);
    }

    // 检查是否有使用此规则的惩罚记录
    const applicationCount = await prisma.punishmentRecord.count({
      where: { ruleId },
    });

    if (applicationCount > 0) {
      // 如果有使用记录，只是标记为不活跃而不是删除
      return await prisma.punishmentRule.update({
        where: { id: ruleId },
        data: { isActive: false },
      });
    } else {
      // 如果没有使用记录，可以直接删除
      return await prisma.punishmentRule.delete({
        where: { id: ruleId },
      });
    }
  }

  /**
   * 自动检测违规并生成惩罚建议
   */
  async detectViolations(userId: string, childUserId: string) {
    const violations = [];

    // 检查今日任务完成情况
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // 获取今日任务
    const todayTasks = await prisma.task.findMany({
      where: {
        isActive: true,
        createdBy: userId,
      },
      include: {
        completions: {
          where: {
            userId: childUserId,
            completedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
    });

    // 检查是否有重要任务未完成
    const incompleteTasks = todayTasks.filter(task =>
      task.completions.length === 0 &&
      (task.type === 'DAILY' || task.timeLimit)
    );

    if (incompleteTasks.length > 0) {
      violations.push({
        type: 'TASK_INCOMPLETE',
        reason: `今日有${incompleteTasks.length}个重要任务未完成`,
        severity: incompleteTasks.length > 2 ? 'SEVERE' : 'MEDIUM',
        suggestedPunishment: {
          type: 'DEDUCT_COINS',
          value: incompleteTasks.length * 5, // 每个任务扣除5星币
        },
        relatedTasks: incompleteTasks.map(task => ({ id: task.id, title: task.title })),
      });
    }

    // 检查连续未完成任务天数
    const incompleteDays = await this.getConsecutiveIncompleteDays(childUserId);
    if (incompleteDays >= 3) {
      violations.push({
        type: 'CONSECUTIVE_FAILURE',
        reason: `连续${incompleteDays}天未完成主要任务`,
        severity: incompleteDays >= 7 ? 'SEVERE' : 'MEDIUM',
        suggestedPunishment: {
          type: 'EXTRA_TASK',
          value: incompleteDays, // 额外任务数量
        },
      });
    }

    return violations;
  }

  /**
   * 获取连续未完成任务天数
   */
  private async getConsecutiveIncompleteDays(userId: string): Promise<number> {
    const today = new Date();
    let consecutiveDays = 0;
    let currentDate = new Date(today);

    // 检查过去30天
    for (let i = 0; i < 30; i++) {
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);

      // 检查当天是否有任务完成记录
      const completions = await prisma.taskCompletion.count({
        where: {
          userId,
          completedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (completions === 0) {
        consecutiveDays++;
      } else {
        break;
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    return consecutiveDays;
  }

  /**
   * 获取惩罚统计信息
   */
  async getPunishmentStats(userId: string, period: 'today' | 'week' | 'month' = 'today') {
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

    // 获取子女列表
    const children = await prisma.user.findMany({
      where: { parentId: userId },
      select: { id: true },
    });

    const childrenIds = children.map(child => child.id);

    const [totalPunishments, severityStats, typeStats, resolvedStats] = await Promise.all([
      // 总惩罚数量
      prisma.punishmentRecord.count({
        where: {
          userId: { in: childrenIds },
          createdAt: { gte: startDate },
        },
      }),
      // 按严重程度统计
      prisma.punishmentRecord.groupBy({
        by: ['severity'],
        where: {
          userId: { in: childrenIds },
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
      // 按类型统计
      prisma.punishmentRecord.groupBy({
        by: ['type'],
        where: {
          userId: { in: childrenIds },
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
      // 解决状态统计
      prisma.punishmentRecord.groupBy({
        by: ['status'],
        where: {
          userId: { in: childrenIds },
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
    ]);

    return {
      period,
      totalPunishments,
      severityBreakdown: severityStats.reduce((acc, stat) => {
        acc[stat.severity] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      typeBreakdown: typeStats.reduce((acc, stat) => {
        acc[stat.type] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      statusBreakdown: resolvedStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}