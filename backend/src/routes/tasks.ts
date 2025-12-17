import { Router } from 'express';
import { body } from 'express-validator';
import { TaskController } from '../controllers/taskController';
import { validateRequest, validatePagination } from '../middleware/validation';
import { authenticate, authorize, requireParent } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const taskController = new TaskController();

/**
 * @route   POST /api/tasks
 * @desc    创建任务
 * @access  Private (PARENT only)
 */
router.post(
  '/',
  authenticate,
  requireParent,
  validateRequest([
    body('title')
      .notEmpty()
      .withMessage('任务标题不能为空')
      .isLength({ max: 100 })
      .withMessage('任务标题不能超过100个字符'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('任务描述不能超过500个字符'),
    body('type')
      .isIn(['DAILY', 'WEEKLY', 'CUSTOM'])
      .withMessage('任务类型必须是 DAILY、WEEKLY 或 CUSTOM'),
    body('starCoins')
      .isInt({ min: 1, max: 1000 })
      .withMessage('星币数量必须是1-1000之间的整数'),
    body('expReward')
      .isInt({ min: 1, max: 100 })
      .withMessage('经验值奖励必须是1-100之间的整数'),
    body('frequency')
      .isIn(['DAILY', 'WEEKLY', 'WEEKDAYS', 'WEEKENDS', 'CUSTOM'])
      .withMessage('任务频率无效'),
    body('weekdays')
      .optional()
      .custom((value) => {
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed) || parsed.some((d: number) => d < 0 || d > 6)) {
              throw new Error('周几设置无效');
            }
            return true;
          } catch {
            throw new Error('周几设置格式错误');
          }
        }
        return true;
      }),
    body('timeLimit')
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('时间限制格式错误，应为 HH:MM'),
    body('category')
      .optional()
      .isLength({ max: 50 })
      .withMessage('任务分类不能超过50个字符'),
    body('difficulty')
      .isIn(['EASY', 'MEDIUM', 'HARD'])
      .withMessage('任务难度必须是 EASY、MEDIUM 或 HARD'),
  ]),
  asyncHandler(taskController.createTask.bind(taskController))
);

/**
 * @route   GET /api/tasks
 * @desc    获取任务列表
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validatePagination,
  asyncHandler(taskController.getTasks.bind(taskController))
);

/**
 * @route   GET /api/tasks/today
 * @desc    获取今日任务
 * @access  Private
 */
router.get(
  '/today',
  authenticate,
  asyncHandler(taskController.getTodayTasks.bind(taskController))
);

/**
 * @route   GET /api/tasks/templates
 * @desc    获取任务模板
 * @access  Private (PARENT only)
 */
router.get(
  '/templates',
  authenticate,
  requireParent,
  asyncHandler(taskController.getTaskTemplates.bind(taskController))
);

/**
 * @route   GET /api/tasks/stats
 * @desc    获取任务统计信息
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  asyncHandler(taskController.getTaskStats.bind(taskController))
);

/**
 * @route   GET /api/tasks/:id
 * @desc    获取任务详情
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(taskController.getTaskById.bind(taskController))
);

/**
 * @route   PUT /api/tasks/:id
 * @desc    更新任务
 * @access  Private (PARENT only or task creator)
 */
router.put(
  '/:id',
  authenticate,
  validateRequest([
    body('title')
      .optional()
      .notEmpty()
      .withMessage('任务标题不能为空')
      .isLength({ max: 100 })
      .withMessage('任务标题不能超过100个字符'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('任务描述不能超过500个字符'),
    body('starCoins')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('星币数量必须是1-1000之间的整数'),
    body('expReward')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('经验值奖励必须是1-100之间的整数'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('激活状态必须是布尔值'),
    body('frequency')
      .optional()
      .isIn(['DAILY', 'WEEKLY', 'WEEKDAYS', 'WEEKENDS', 'CUSTOM'])
      .withMessage('任务频率无效'),
    body('timeLimit')
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('时间限制格式错误，应为 HH:MM'),
    body('category')
      .optional()
      .isLength({ max: 50 })
      .withMessage('任务分类不能超过50个字符'),
    body('difficulty')
      .optional()
      .isIn(['EASY', 'MEDIUM', 'HARD'])
      .withMessage('任务难度必须是 EASY、MEDIUM 或 HARD'),
  ]),
  asyncHandler(taskController.updateTask.bind(taskController))
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    删除任务
 * @access  Private (PARENT only or task creator)
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(taskController.deleteTask.bind(taskController))
);

/**
 * @route   POST /api/tasks/:id/complete
 * @desc    完成任务
 * @access  Private (CHILD only)
 */
router.post(
  '/:id/complete',
  authenticate,
  authorize(['CHILD']),
  asyncHandler(taskController.completeTask.bind(taskController))
);

/**
 * @route   POST /api/tasks/batch-complete
 * @desc    批量完成任务
 * @access  Private (CHILD only)
 */
router.post(
  '/batch-complete',
  authenticate,
  authorize(['CHILD']),
  validateRequest([
    body('taskIds')
      .isArray()
      .withMessage('任务ID列表必须是数组')
      .custom((value) => {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('任务ID列表不能为空');
        }
        if (value.length > 50) {
          throw new Error('一次最多只能完成50个任务');
        }
        return true;
      }),
  ]),
  asyncHandler(taskController.batchCompleteTasks.bind(taskController))
);

export default router;