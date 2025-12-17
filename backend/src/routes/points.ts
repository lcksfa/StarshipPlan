import { Router } from 'express';
import { body, query } from 'express-validator';
import { PointsController } from '../controllers/pointsController';
import { validateRequest, validatePagination } from '../middleware/validation';
import { authenticate, authorize, requireParent } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const pointsController = new PointsController();

/**
 * @route   GET /api/points
 * @desc    获取用户积分和等级信息
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  asyncHandler(pointsController.getUserPoints.bind(pointsController))
);

/**
 * @route   GET /api/points/transactions
 * @desc    获取用户积分交易历史
 * @access  Private
 */
router.get(
  '/transactions',
  authenticate,
  validatePagination,
  validateRequest([
    query('type')
      .optional()
      .isIn(['EARN', 'SPEND', 'BONUS', 'PUNISHMENT', 'REFUND'])
      .withMessage('交易类型无效'),
  ]),
  asyncHandler(pointsController.getPointTransactions.bind(pointsController))
);

/**
 * @route   GET /api/points/levels
 * @desc    获取用户等级历史
 * @access  Private
 */
router.get(
  '/levels',
  authenticate,
  validatePagination,
  asyncHandler(pointsController.getLevelHistory.bind(pointsController))
);

/**
 * @route   POST /api/points/add
 * @desc    手动增加星币
 * @access  Private (PARENT only)
 */
router.post(
  '/add',
  authenticate,
  requireParent,
  validateRequest([
    body('userId')
      .notEmpty()
      .withMessage('用户ID不能为空'),
    body('amount')
      .isInt({ min: 1, max: 10000 })
      .withMessage('星币数量必须是1-10000之间的整数'),
    body('description')
      .notEmpty()
      .withMessage('描述不能为空')
      .isLength({ max: 200 })
      .withMessage('描述不能超过200个字符'),
  ]),
  asyncHandler(pointsController.addStarCoins.bind(pointsController))
);

/**
 * @route   POST /api/points/deduct
 * @desc    手动扣除星币
 * @access  Private (PARENT only)
 */
router.post(
  '/deduct',
  authenticate,
  requireParent,
  validateRequest([
    body('userId')
      .notEmpty()
      .withMessage('用户ID不能为空'),
    body('amount')
      .isInt({ min: 1, max: 10000 })
      .withMessage('星币数量必须是1-10000之间的整数'),
    body('description')
      .notEmpty()
      .withMessage('描述不能为空')
      .isLength({ max: 200 })
      .withMessage('描述不能超过200个字符'),
  ]),
  asyncHandler(pointsController.deductStarCoins.bind(pointsController))
);

/**
 * @route   POST /api/points/experience
 * @desc    手动增加经验值
 * @access  Private (PARENT only)
 */
router.post(
  '/experience',
  authenticate,
  requireParent,
  validateRequest([
    body('userId')
      .notEmpty()
      .withMessage('用户ID不能为空'),
    body('expAmount')
      .isInt({ min: 1, max: 1000 })
      .withMessage('经验值必须是1-1000之间的整数'),
    body('description')
      .notEmpty()
      .withMessage('描述不能为空')
      .isLength({ max: 200 })
      .withMessage('描述不能超过200个字符'),
  ]),
  asyncHandler(pointsController.addExperience.bind(pointsController))
);

/**
 * @route   PUT /api/points/ship-name
 * @desc    更新飞船名称
 * @access  Private
 */
router.put(
  '/ship-name',
  authenticate,
  validateRequest([
    body('shipName')
      .notEmpty()
      .withMessage('飞船名称不能为空')
      .isLength({ max: 50 })
      .withMessage('飞船名称不能超过50个字符')
      .matches(/^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/)
      .withMessage('飞船名称只能包含中文、英文、数字和空格'),
  ]),
  asyncHandler(pointsController.updateShipName.bind(pointsController))
);

/**
 * @route   GET /api/points/stats
 * @desc    获取积分统计信息
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  validateRequest([
    query('period')
      .optional()
      .isIn(['today', 'week', 'month'])
      .withMessage('时间周期必须是 today、week 或 month'),
  ]),
  asyncHandler(pointsController.getPointsStats.bind(pointsController))
);

/**
 * @route   GET /api/points/leaderboard
 * @desc    获取排行榜
 * @access  Private
 */
router.get(
  '/leaderboard',
  authenticate,
  validateRequest([
    query('type')
      .optional()
      .isIn(['level', 'coins'])
      .withMessage('排行榜类型必须是 level 或 coins'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('显示数量必须是1-100之间的整数'),
  ]),
  asyncHandler(pointsController.getLeaderboard.bind(pointsController))
);

export default router;