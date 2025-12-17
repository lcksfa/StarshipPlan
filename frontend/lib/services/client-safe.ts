// 客户端安全的服务访问 - 简化版本
import { tasksService, pointsService, punishmentsService, syncService } from './index';

// 直接导出服务实例
export const getTasksService = () => Promise.resolve(tasksService);
export const getPointsService = () => Promise.resolve(pointsService);
export const getPunishmentsService = () => Promise.resolve(punishmentsService);
export const getSyncService = () => Promise.resolve(syncService);

// 保持向后兼容的函数
export const initServices = async () => {
  console.log('Services are statically imported, no initialization needed');
  return {
    tasksService,
    pointsService,
    punishmentsService,
    syncService,
  };
};

export const getServices = async () => {
  return {
    tasksService,
    pointsService,
    punishmentsService,
    syncService,
  };
};
