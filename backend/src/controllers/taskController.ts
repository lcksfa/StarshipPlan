import { Response } from 'express';
import { AuthRequest } from '../types';
import { TaskService } from '../services/taskService';
import {
  successResponse,
  createdResponse,
  notFoundResponse,
  errorResponse,
  paginatedResponse
} from '../utils/response';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * 创建任务
   */
  async createTask(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, '用户未认证', 401);
      }

      const taskData = {
        ...req.body,
        createdBy: req.user.id,
      };

      const task = await this.taskService.createTask(taskData);
      return createdResponse(res, task, '任务创建成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取任务列表
   */
  async getTasks(req: AuthRequest, res: Response) {
    try {
      const {
        type,
        category,
        difficulty,
        isActive,
        page = 1,
        limit = 10,
      } = req.query;

      const filters = {
        type: type as string,
        category: category as string,
        difficulty: difficulty as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      // 如果是儿童用户，只能看到家长创建的任务
      if (req.user?.role === 'CHILD' && req.user.parentId) {
        (filters as any).userId = req.user.parentId;
      }
      // 如果是家长用户，可以看到自己创建的和子账户相关的任务
      else if (req.user?.role === 'PARENT') {
        (filters as any).userId = req.user.id;
      }

      const result = await this.taskService.getTasks(filters);
      return paginatedResponse(
        res,
        result.tasks,
        result.pagination.total,
        result.pagination.page,
        result.pagination.limit,
        '获取任务列表成功'
      );
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取单个任务详情
   */
  async getTaskById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const task = await this.taskService.getTaskById(id);

      // 权限检查 - 修复 createdBy -> creator
      const creatorId = (task as any).creator?.id || (task as any).createdBy;

      if (req.user?.role === 'CHILD') {
        // 儿童用户只能访问家长创建的任务
        if (creatorId !== req.user.parentId) {
          return errorResponse(res, '无权访问此任务', 403);
        }
      } else if (req.user?.role === 'PARENT') {
        // 家长用户只能访问自己创建的任务
        if (creatorId !== req.user.id) {
          return errorResponse(res, '无权访问此任务', 403);
        }
      }

      return successResponse(res, task, '获取任务详情成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 更新任务
   */
  async updateTask(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 先获取任务进行权限检查
      const existingTask = await this.taskService.getTaskById(id);

      // 权限检查 - 修复 createdBy -> creator
      const creatorId = (existingTask as any).creator?.id || (existingTask as any).createdBy;

      if (req.user?.role === 'CHILD') {
        // 儿童用户只能修改家长创建的任务
        if (creatorId !== req.user.parentId) {
          return errorResponse(res, '无权修改此任务', 403);
        }
      } else if (req.user?.role === 'PARENT') {
        // 家长用户只能修改自己创建的任务
        if (creatorId !== req.user.id) {
          return errorResponse(res, '无权修改此任务', 403);
        }
      }

      const task = await this.taskService.updateTask(id, updateData);
      return successResponse(res, task, '任务更新成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // 先获取任务进行权限检查
      const existingTask = await this.taskService.getTaskById(id);

      // 权限检查 - 修复 createdBy -> creator
      const creatorId = (existingTask as any).creator?.id || (existingTask as any).createdBy;

      if (req.user?.role === 'CHILD') {
        // 儿童用户只能删除家长创建的任务
        if (creatorId !== req.user.parentId) {
          return errorResponse(res, '无权删除此任务', 403);
        }
      } else if (req.user?.role === 'PARENT') {
        // 家长用户只能删除自己创建的任务
        if (creatorId !== req.user.id) {
          return errorResponse(res, '无权删除此任务', 403);
        }
      }

      await this.taskService.deleteTask(id);
      return successResponse(res, null, '任务删除成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 完成任务
   */
  async completeTask(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, '用户未认证', 401);
      }

      const { id } = req.params;
      const result = await this.taskService.completeTask(id, req.user.id);

      return successResponse(res, result, '任务完成成功！获得奖励');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 取消完成任务
   */
  async uncompleteTask(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, '用户未认证', 401);
      }

      const { id } = req.params;
      const result = await this.taskService.uncompleteTask(id, req.user.id);

      return successResponse(res, result, '任务状态已取消完成，扣除相应奖励');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, '用户未认证', 401);
      }

      const { period = 'today' } = req.query;
      const stats = await this.taskService.getTaskStats(
        req.user.id,
        period as 'today' | 'week' | 'month'
      );

      return successResponse(res, stats, '获取任务统计成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取今日任务
   */
  async getTodayTasks(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, '用户未认证', 401);
      }

      const tasks = await this.taskService.getTodayTasks(req.user.id);
      return successResponse(res, tasks, '获取今日任务成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取周任务
   */
  async getWeeklyTasks(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, '用户未认证', 401);
      }

      const tasks = await this.taskService.getWeeklyTasks(req.user.id);
      return successResponse(res, tasks, '获取周任务成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 批量完成任务
   */
  async batchCompleteTasks(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, '用户未认证', 401);
      }

      const { taskIds } = req.body;

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return errorResponse(res, '任务ID列表不能为空', 400);
      }

      const results = [];
      const errors = [];

      for (const taskId of taskIds) {
        try {
          const result = await this.taskService.completeTask(taskId, req.user.id);
          results.push({ taskId, success: true, ...result });
        } catch (error) {
          errors.push({ taskId, success: false, error: (error as Error).message });
        }
      }

      return successResponse(res, {
        results,
        errors,
        totalCompleted: results.length,
        totalErrors: errors.length,
      }, `批量完成任务完成，成功${results.length}个，失败${errors.length}个`);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 获取任务模板
   */
  async getTaskTemplates(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, '用户未认证', 401);
      }

      // 预定义的任务模板
      const templates = [
        {
          title: '完成数学作业',
          description: '认真完成今天的数学作业',
          type: 'DAILY',
          starCoins: 10,
          expReward: 5,
          frequency: 'WEEKDAYS',
          timeLimit: '19:00',
          category: '学习',
          difficulty: 'MEDIUM',
        },
        {
          title: '阅读30分钟',
          description: '阅读自己喜欢的书籍',
          type: 'DAILY',
          starCoins: 15,
          expReward: 8,
          frequency: 'DAILY',
          category: '学习',
          difficulty: 'EASY',
        },
        {
          title: '练习乐器',
          description: '练习乐器30分钟',
          type: 'DAILY',
          starCoins: 20,
          expReward: 10,
          frequency: 'DAILY',
          category: '艺术',
          difficulty: 'MEDIUM',
        },
        {
          title: '户外运动1小时',
          description: '进行户外体育活动',
          type: 'DAILY',
          starCoins: 25,
          expReward: 12,
          frequency: 'WEEKENDS',
          category: '运动',
          difficulty: 'HARD',
        },
        {
          title: '整理房间',
          description: '保持自己的房间整洁干净',
          type: 'WEEKLY',
          starCoins: 50,
          expReward: 25,
          frequency: 'WEEKLY',
          category: '家务',
          difficulty: 'MEDIUM',
        },
        {
          title: '帮做家务',
          description: '主动帮助家人做家务',
          type: 'DAILY',
          starCoins: 15,
          expReward: 8,
          frequency: 'DAILY',
          category: '家务',
          difficulty: 'EASY',
        },
        {
          title: '刷牙洗脸',
          description: '早晚刷牙洗脸，保持个人卫生',
          type: 'DAILY',
          starCoins: 5,
          expReward: 3,
          frequency: 'DAILY',
          category: '生活习惯',
          difficulty: 'EASY',
        },
        {
          title: '按时睡觉',
          description: '在规定时间上床睡觉',
          type: 'DAILY',
          starCoins: 10,
          expReward: 5,
          frequency: 'DAILY',
          timeLimit: '21:00',
          category: '生活习惯',
          difficulty: 'MEDIUM',
        },
      ];

      return successResponse(res, templates, '获取任务模板成功');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * 错误处理
   */
  private handleError(res: Response, error: any) {
    console.error('Task Controller Error:', error);

    if (error.code === 'P2002') {
      return errorResponse(res, '数据已存在', 409);
    }

    if (error.code === 'P2025') {
      return notFoundResponse(res, '记录未找到');
    }

    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }

    return errorResponse(res, '操作失败', 500);
  }
}
