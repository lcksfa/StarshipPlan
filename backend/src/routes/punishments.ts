import { Router } from 'express';
import { body, query } from 'express-validator';
import { PunishmentController } from '../controllers/punishmentController';
import { validateRequest, validatePagination } from '../middleware/validation';
import { authenticate, authorize, requireParent } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const punishmentController = new PunishmentController();

/**
 * @route   GET /api/punishments
 * @desc    获取用户惩罚记录
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validatePagination,
  validateRequest([
    query('status')
      .optional()
      .isIn(['ACTIVE', 'COMPLETED', 'WAIVED'])
      .withMessage('状态无效'),
    query('severity')
      .optional()
      .isIn(['MINOR', 'MEDIUM', 'SEVERE'])
      .withMessage('严重程度无效'),
    query('type')
      .optional()
      .isIn(['DEDUCT_COINS', 'EXTRA_TASK', 'RESTRICT_PRIVILEGE'])
      .withMessage('惩罚类型无效'),
  ]),
  asyncHandler(punishmentController.getPunishments.bind(punishmentController))
);

/**
 * @route   GET /api/punishments/rules
 * @desc    获取惩罚规则
 * @access  Private (PARENT only)
 */
router.get(
  '/rules',
  authenticate,
  requireParent,
  validateRequest([
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('激活状态必须是布尔值'),
    query('type')
      .optional()
      .isIn(['DEDUCT_COINS', 'EXTRA_TASK', 'RESTRICT_PRIVILEGE'])
      .withMessage('惩罚类型无效'),
    query('severity')
      .optional()
      .isIn(['MINOR', 'MEDIUM', 'SEVERE'])
      .withMessage('严重程度无效'),
  ]),
  asyncHandler(punishmentController.getPunishmentRules.bind(punishmentController))
);

/**
 * @route   POST /api/punishments
 * @desc    创建惩罚记录
 * @access  Private (PARENT only)
 */
router.post(
  '/',
  authenticate,
  requireParent,
  validateRequest([
    body('targetUserId')
      .notEmpty()
      .withMessage('目标用户ID不能为空'),
    body('taskId')
      .optional()
      .isString()
      .withMessage('任务ID必须是字符串'),
    body('ruleId')
      .optional()
      .isString()
      .withMessage('规则ID必须是字符串'),
    body('type')
      .isIn(['DEDUCT_COINS', 'EXTRA_TASK', 'RESTRICT_PRIVILEGE'])
      .withMessage('惩罚类型无效'),
    body('reason')
      .notEmpty()
      .withMessage('惩罚原因不能为空')
      .isLength({ max: 500 })
      .withMessage('惩罚原因不能超过500个字符'),
    body('severity')
      .isIn(['MINOR', 'MEDIUM', 'SEVERE'])
      .withMessage('严重程度无效'),
    body('value')
      .isInt({ min: 1, max: 1000 })
      .withMessage('惩罚力度必须是1-1000之间的整数'),
  ]),
  asyncHandler(punishmentController.createPunishment.bind(punishmentController))
);

/**
 * @route   PUT /api/punishments/:id/status
 * @desc    更新惩罚记录状态
 * @access  Private (PARENT only)
 */
router.put(
  '/:id/status',
  authenticate,
  requireParent,
  validateRequest([
    body('status')
      .isIn(['ACTIVE', 'COMPLETED', 'WAIVED'])
      .withMessage('状态无效'),
  ]),
  asyncHandler(punishmentController.updatePunishmentStatus.bind(punishmentController))
);

/**
 * @route   POST /api/punishments/rules
 * @desc    创建惩罚规则
 * @access  Private (PARENT only)
 */
router.post(
  '/rules',
  authenticate,
  requireParent,
  validateRequest([
    body('name')
      .notEmpty()
      .withMessage('规则名称不能为空')
      .isLength({ max: 100 })
      .withMessage('规则名称不能超过100个字符'),
    body('description')
      .notEmpty()
      .withMessage('规则描述不能为空')
      .isLength({ max: 500 })
      .withMessage('规则描述不能超过500个字符'),
    body('type')
      .isIn(['DEDUCT_COINS', 'EXTRA_TASK', 'RESTRICT_PRIVILEGE'])
      .withMessage('惩罚类型无效'),
    body('severity')
      .isIn(['MINOR', 'MEDIUM', 'SEVERE'])
      .withMessage('严重程度无效'),
    body('value')
      .isInt({ min: 1, max: 1000 })
      .withMessage('惩罚力度必须是1-1000之间的整数'),
  ]),
  asyncHandler(punishmentController.createPunishmentRule.bind(punishmentController))
);

/**
 * @route   PUT /api/punishments/rules/:id
 * @desc    更新惩罚规则
 * @access  Private (PARENT only)
 */
router.put(
  '/rules/:id',
  authenticate,
  requireParent,
  validateRequest([
    body('name')
      .optional()
      .notEmpty()
      .withMessage('规则名称不能为空')
      .isLength({ max: 100 })
      .withMessage('规则名称不能超过100个字符'),
    body('description')
      .optional()
      .notEmpty()
      .withMessage('规则描述不能为空')
      .isLength({ max: 500 })
      .withMessage('规则描述不能超过500个字符'),
    body('type')
      .optional()
      .isIn(['DEDUCT_COINS', 'EXTRA_TASK', 'RESTRICT_PRIVILEGE'])
      .withMessage('惩罚类型无效'),
    body('severity')
      .optional()
      .isIn(['MINOR', 'MEDIUM', 'SEVERE'])
      .withMessage('严重程度无效'),
    body('value')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('惩罚力度必须是1-1000之间的整数'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('激活状态必须是布尔值'),
  ]),
  asyncHandler(punishmentController.updatePunishmentRule.bind(punishmentController))
);

/**
 * @route   DELETE /api/punishments/rules/:id
 * @desc    删除惩罚规则
 * @access  Private (PARENT only)
 */
router.delete(
  '/rules/:id',
  authenticate,
  requireParent,
  asyncHandler(punishmentController.deletePunishmentRule.bind(punishmentController))
);

/**
 * @route   GET /api/punishments/detect-violations
 * @desc    自动检测违规并生成惩罚建议
 * @access  Private (PARENT only)
 */
router.get(
  '/detect-violations',
  authenticate,
  requireParent,
  validateRequest([
    query('childUserId')
      .notEmpty()
      .withMessage('子女用户ID不能为空'),
  ]),
  asyncHandler(punishmentController.detectViolations.bind(punishmentController))
);

/**
 * @route   GET /api/punishments/stats
 * @desc    获取惩罚统计信息
 * @access  Private (PARENT only)
 */
router.get(
  '/stats',
  authenticate,
  requireParent,
  validateRequest([
    query('period')
      .optional()
      .isIn(['today', 'week', 'month'])
      .withMessage('时间周期必须是 today、week 或 month'),
  ]),
  asyncHandler(punishmentController.getPunishmentStats.bind(punishmentController))
);

export default router;