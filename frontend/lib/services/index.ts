// 直接导入所有服务实例
import { tasksService } from './tasks';
import { pointsService } from './points';
import { punishmentsService } from './punishments';
import { syncService } from './sync';

// 导出服务实例
export { tasksService, pointsService, punishmentsService, syncService };

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
  private _tasks: any = null;
  private _points: any = null;
  private _punishments: any = null;
  private _sync: any = null;

  // 使用 getter 访问服务
  get tasks() {
    return this._tasks;
  }

  get points() {
    return this._points;
  }

  get punishments() {
    return this._punishments;
  }

  get sync() {
    return this._sync;
  }

  /**
   * 初始化客户端
   */
  async initialize(userId?: string): Promise<void> {
    // 初始化所有服务
    await initServices();
    this._tasks = tasksService;
    this._points = pointsService;
    this._punishments = punishmentsService;
    this._sync = syncService;

    // 如果提供了 userId，建立 WebSocket 连接
    if (userId && this._sync) {
      this._sync.connectWebSocket(userId, (event) => {
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
    if (this._sync) {
      this._sync.disconnectWebSocket();
    }
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
