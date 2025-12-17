import { Router } from 'express';
import { body, query } from 'express-validator';
import { validateRequest, validatePagination } from '../middleware/validation';
import { authenticate, requireParent } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { SyncController } from '../controllers/syncController';

// 这个路由需要在server.ts中初始化时传入HTTPServer实例
let syncController: SyncController | null = null;

export function initializeSyncRoutes(httpServer: any) {
  syncController = new SyncController(httpServer);
  return createSyncRoutes();
}

function createSyncRoutes(): Router {
  if (!syncController) {
    throw new Error('SyncController未初始化，请先调用initializeSyncRoutes');
  }

  const router = Router();

  /**
   * @route   GET /api/sync/stats
   * @desc    获取连接统计信息
   * @access  Private
   */
  router.get(
    '/stats',
    authenticate,
    asyncHandler(syncController.getConnectionStats.bind(syncController))
  );

  /**
   * @route   POST /api/sync/trigger
   * @desc    手动触发同步
   * @access  Private
   */
  router.post(
    '/trigger',
    authenticate,
    validateRequest([
      body('entityTypes')
        .optional()
        .isArray()
        .withMessage('实体类型必须是数组'),
      body('targetUserId')
        .optional()
        .isString()
        .withMessage('目标用户ID必须是字符串'),
    ]),
    asyncHandler(syncController.triggerSync.bind(syncController))
  );

  /**
   * @route   GET /api/sync/logs
   * @desc    获取同步日志
   * @access  Private
   */
  router.get(
    '/logs',
    authenticate,
    validatePagination,
    validateRequest([
      query('entityId')
        .optional()
        .isString()
        .withMessage('实体ID必须是字符串'),
      query('entityType')
        .optional()
        .isIn(['task', 'punishment', 'point_transaction', 'level_record'])
        .withMessage('实体类型无效'),
      query('syncStatus')
        .optional()
        .isIn(['PENDING', 'SYNCED', 'FAILED'])
        .withMessage('同步状态无效'),
    ]),
    asyncHandler(syncController.getSyncLogs.bind(syncController))
  );

  /**
   * @route   DELETE /api/sync/logs/cleanup
   * @desc    清理同步日志
   * @access  Private (PARENT only)
   */
  router.delete(
    '/logs/cleanup',
    authenticate,
    requireParent,
    validateRequest([
      body('daysToKeep')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('保留天数必须是1-365之间的整数'),
    ]),
    asyncHandler(syncController.cleanupSyncLogs.bind(syncController))
  );

  /**
   * @route   POST /api/sync/resolve-conflict
   * @desc    手动解决冲突
   * @access  Private
   */
  router.post(
    '/resolve-conflict',
    authenticate,
    validateRequest([
      body('logId')
        .notEmpty()
        .withMessage('日志ID不能为空'),
      body('resolution')
        .notEmpty()
        .withMessage('解决方案不能为空'),
    ]),
    asyncHandler(syncController.resolveConflict.bind(syncController))
  );

  /**
   * @route   GET /api/sync/devices
   * @desc    获取设备列表
   * @access  Private
   */
  router.get(
    '/devices',
    authenticate,
    asyncHandler(syncController.getDevices.bind(syncController))
  );

  /**
   * @route   POST /api/sync/devices/disconnect
   @desc    强制断开指定设备
   * @access  Private (PARENT only)
   */
  router.post(
    '/devices/disconnect',
    authenticate,
    requireParent,
    validateRequest([
      body('deviceId')
        .notEmpty()
        .withMessage('设备ID不能为空'),
    ]),
    asyncHandler(syncController.forceDisconnectDevice.bind(syncController))
  );

  return router;
}