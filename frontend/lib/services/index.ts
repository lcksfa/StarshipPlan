// 统一导出所有服务
export { tasksService } from './tasks';
export { pointsService } from './points';
export { punishmentsService } from './punishments';
export { syncService } from './sync';

// 导出类型
export type {
  Task,
  TaskCompletion,
  TaskStats,
  CreateTaskRequest,
  UpdateTaskRequest,
  GetTasksParams,
  CompleteTaskRequest,
  PointTransaction,
  LevelRecord,
  LevelStats,
  PunishmentRecord,
  SyncEvent,
  ApiResponse,
  PaginatedResponse,
} from '../../types/api';

// 创建统一的服务客户端类
export class StarshipPlanClient {
  // 导入所有服务实例
  public readonly tasks = tasksService;
  public readonly points = pointsService;
  public readonly punishments = punishmentsService;
  public readonly sync = syncService;

  /**
   * 初始化客户端
   */
  async initialize(userId?: string): Promise<void> {
    // 如果提供了 userId，建立 WebSocket 连接
    if (userId) {
      this.sync.connectWebSocket(userId, (event) => {
        // 处理实时同步事件
        console.log('收到实时同步事件:', event);
        // 这里可以添加事件处理逻辑，比如更新本地状态
      });
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.sync.disconnectWebSocket();
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { apiClient } = await import('../api');
      const response = await apiClient.healthCheck();
      return response.success;
    } catch (error) {
      console.error('健康检查失败:', error);
      return false;
    }
  }
}

// 创建默认客户端实例
export const starshipClient = new StarshipPlanClient();