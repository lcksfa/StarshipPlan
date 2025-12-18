import { apiClient, withErrorHandling } from '../api';
import { SyncEvent } from '../../types/api';
import { API_CONFIG } from '../api-config';

interface SyncStatusResponse {
  isConnected: boolean;
  lastSyncTime: string;
  pendingOperations: number;
  conflicts: number;
}

interface TriggerSyncRequest {
  force?: boolean;
  dataTypes?: string[];
}

interface SyncResponse {
  success: boolean;
  syncedItems: number;
  conflicts: Array<{
    id: string;
    type: string;
    localData: any;
    remoteData: any;
    resolution: string;
  }>;
  errors: string[];
}

export class SyncService {
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManualClose = false;

  /**
   * 初始化 WebSocket 连接
   */
  connectWebSocket(userId: string, onEvent: (event: SyncEvent) => void): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      return; // 已连接
    }

    const wsUrl = API_CONFIG.getWsUrl();
    const fullUrl = `${wsUrl}/sync/ws?userId=${userId}`;

    try {
      this.wsConnection = new WebSocket(fullUrl);
      this.isManualClose = false;

      this.wsConnection.onopen = () => {
        console.log('WebSocket 连接已建立');
        this.reconnectAttempts = 0;
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const syncEvent: SyncEvent = JSON.parse(event.data);
          onEvent(syncEvent);
        } catch (error) {
          console.error('解析 WebSocket 消息失败:', error);
        }
      };

      this.wsConnection.onclose = (event) => {
        console.log('WebSocket 连接已关闭:', event.code, event.reason);

        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectWebSocket(userId, onEvent);
        }
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket 错误:', error);
      };
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error);
    }
  }

  /**
   * 重连 WebSocket
   */
  private reconnectWebSocket(userId: string, onEvent: (event: SyncEvent) => void): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`${delay}ms 后尝试第 ${this.reconnectAttempts} 次重连...`);

    setTimeout(() => {
      this.connectWebSocket(userId, onEvent);
    }, delay);
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnectWebSocket(): void {
    this.isManualClose = true;
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(userId: string): Promise<ApiResponse<SyncStatusResponse>> {
    return withErrorHandling(() => apiClient.get<SyncStatusResponse>(`/api/sync/status/${userId}`));
  }

  /**
   * 手动触发同步
   */
  async triggerSync(userId: string, data?: TriggerSyncRequest): Promise<ApiResponse<SyncResponse>> {
    return withErrorHandling(() => apiClient.post<SyncResponse>(`/api/sync/trigger/${userId}`, data));
  }

  /**
   * 获取同步日志
   */
  async getSyncLogs(userId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<Array<{
    id: string;
    type: string;
    status: string;
    timestamp: string;
    details: any;
  }>>> {
    return withErrorHandling(() =>
      apiClient.get<Array<{
        id: string;
        type: string;
        status: string;
        timestamp: string;
        details: any;
      }>>(`/api/sync/logs/${userId}`, params)
    );
  }

  /**
   * 解决同步冲突
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge',
    mergedData?: any
  ): Promise<ApiResponse<{ resolved: boolean }>> {
    return withErrorHandling(() =>
      apiClient.post<{ resolved: boolean }>(`/api/sync/resolve-conflict/${conflictId}`, {
        resolution,
        mergedData,
      })
    );
  }

  /**
   * 获取待同步操作
   */
  async getPendingOperations(userId: string): Promise<ApiResponse<Array<{
    id: string;
    type: string;
    data: any;
    timestamp: string;
    retryCount: number;
  }>>> {
    return withErrorHandling(() =>
      apiClient.get<Array<{
        id: string;
        type: string;
        data: any;
        timestamp: string;
        retryCount: number;
      }>>(`/api/sync/pending/${userId}`)
    );
  }

  /**
   * 清理已完成的同步记录
   */
  async cleanupSyncHistory(userId: string, olderThan?: string): Promise<ApiResponse<{ deleted: number }>> {
    return withErrorHandling(() =>
      apiClient.post<{ deleted: number }>(`/api/sync/cleanup/${userId}`, { olderThan })
    );
  }

  /**
   * 导出同步数据
   */
  async exportSyncData(userId: string): Promise<ApiResponse<{ data: any; timestamp: string }>> {
    return withErrorHandling(() => apiClient.get<{ data: any; timestamp: string }>(`/api/sync/export/${userId}`));
  }

  /**
   * 导入同步数据
   */
  async importSyncData(userId: string, data: any): Promise<ApiResponse<{ imported: number; conflicts: number }>> {
    return withErrorHandling(() =>
      apiClient.post<{ imported: number; conflicts: number }>(`/api/sync/import/${userId}`, { data })
    );
  }

  /**
   * 获取同步统计信息
   */
  async getSyncStats(userId: string): Promise<ApiResponse<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncTime: number;
    lastSyncStatus: string;
    dataTypesSynced: { [key: string]: number };
  }>> {
    return withErrorHandling(() =>
      apiClient.get<{
        totalSyncs: number;
        successfulSyncs: number;
        failedSyncs: number;
        averageSyncTime: number;
        lastSyncStatus: string;
        dataTypesSynced: { [key: string]: number };
      }>(`/api/sync/stats/${userId}`)
    );
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.wsConnection?.readyState === WebSocket.OPEN;
  }

  /**
   * 获取连接状态描述
   */
  getConnectionStatus(): string {
    if (!this.wsConnection) return 'disconnected';

    switch (this.wsConnection.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }
}

// 创建单例实例
export const syncService = new SyncService();
