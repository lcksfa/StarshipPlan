import { indexedDBManager, STORES, StorageItem, SyncQueueItem, ConflictItem } from './indexedDB';
import { syncService } from '../services/sync';
import { SyncEvent } from '../../types/api';

export interface SyncOptions {
  priority?: 'high' | 'normal' | 'low';
  retryCount?: number;
  timeout?: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: ConflictItem[];
  errors: string[];
}

export interface DataChange {
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data?: any;
  timestamp: number;
  userId: string;
}

class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncQueue: DataChange[] = [];
  private syncCallbacks: ((event: SyncEvent) => void)[] = [];

  constructor() {
    this.setupNetworkListeners();
    this.loadSyncQueue();
  }

  /**
   * 设置网络状态监听
   */
  private setupNetworkListeners(): void {
    const handleOnline = () => {
      this.isOnline = true;
      console.log('网络已连接，开始同步队列');
      this.processSyncQueue();
    };

    const handleOffline = () => {
      this.isOnline = false;
      console.log('网络已断开，进入离线模式');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  /**
   * 加载同步队列
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const queueItems = await indexedDBManager.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
      this.syncQueue = queueItems.map(item => ({
        type: item.data.type,
        action: item.data.action as 'create' | 'update' | 'delete',
        entityType: item.data.entityType,
        entityId: item.data.entityId,
        data: item.data.data,
        timestamp: item.timestamp,
        userId: item.data.userId,
      }));
    } catch (error) {
      console.error('加载同步队列失败:', error);
    }
  }

  /**
   * 添加数据变更到同步队列
   */
  async addDataChange(change: DataChange): Promise<void> {
    this.syncQueue.push(change);

    try {
      const syncItem: SyncQueueItem = {
        id: `${change.entityType}-${change.entityId}-${change.timestamp}`,
        type: change.entityType,
        action: change.action,
        data: change,
        timestamp: change.timestamp,
        retryCount: 0,
        userId: change.userId,
      };

      await indexedDBManager.set(STORES.SYNC_QUEUE, syncItem.id, syncItem);

      // 如果在线且不是正在同步，立即处理
      if (this.isOnline && !this.isSyncing) {
        this.processSyncQueue();
      }
    } catch (error) {
      console.error('添加数据变更到同步队列失败:', error);
    }
  }

  /**
   * 处理同步队列
   */
  async processSyncQueue(): Promise<SyncResult> {
    if (!this.isOnline || this.isSyncing) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: [],
        errors: ['网络不可用或正在同步中'],
      };
    }

    this.isSyncing = true;

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: [],
      errors: [],
    };

    try {
      // 按优先级和时间排序
      const sortedQueue = [...this.syncQueue].sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          return (priorityOrder[b.priority || 'normal'] || 2) - (priorityOrder[a.priority || 'normal'] || 2);
        }
        return a.timestamp - b.timestamp;
      });

      // 批量处理同步请求
      const batchSize = 10;
      for (let i = 0; i < sortedQueue.length; i += batchSize) {
        const batch = sortedQueue.slice(i, i + batchSize);
        await this.syncBatch(batch, result);
      }

      // 清理已同步的项目
      await this.cleanupSyncQueue();

    } catch (error) {
      console.error('同步队列处理失败:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : '未知错误');
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * 批量同步
   */
  private async syncBatch(changes: DataChange[], result: SyncResult): Promise<void> {
    const userId = changes[0]?.userId;
    if (!userId) return;

    try {
      // 调用后端同步接口
      const syncResponse = await syncService.triggerSync(userId, {
        force: false,
        dataTypes: [...new Set(changes.map(c => c.entityType))],
      });

      if (syncResponse.success && syncResponse.data) {
        result.synced += changes.length;

        // 处理冲突
        if (syncResponse.data.conflicts.length > 0) {
          for (const conflict of syncResponse.data.conflicts) {
            const conflictItem: ConflictItem = {
              id: `${conflict.type}-${conflict.id}`,
              type: conflict.type,
              localData: conflict.localData,
              remoteData: conflict.remoteData,
              timestamp: Date.now(),
              resolved: false,
              userId,
            };

            await indexedDBManager.set(STORES.CONFLICTS, conflictItem.id, conflictItem);
            result.conflicts.push(conflictItem);
          }
        }
      } else {
        result.failed += changes.length;
        if (syncResponse.error) {
          result.errors.push(syncResponse.error);
        }
      }
    } catch (error) {
      result.failed += changes.length;
      result.errors.push(error instanceof Error ? error.message : '同步失败');
    }
  }

  /**
   * 清理同步队列
   */
  private async cleanupSyncQueue(): Promise<void> {
    try {
      const queueItems = await indexedDBManager.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);

      // 移除已成功同步的项目
      const remainingItems = queueItems.filter(item => {
        const change = this.syncQueue.find(c =>
          c.entityType === item.type &&
          c.entityId === item.data.entityId &&
          c.timestamp === item.timestamp
        );
        return !change; // 保留未找到对应变更的项目（即同步失败的）
      });

      await indexedDBManager.clear(STORES.SYNC_QUEUE);

      if (remainingItems.length > 0) {
        await indexedDBManager.batchSet(STORES.SYNC_QUEUE, remainingItems.map(item => ({
          id: item.id,
          data: item,
        })));
      }

      // 更新内存中的队列
      this.syncQueue = remainingItems.map(item => item.data);

    } catch (error) {
      console.error('清理同步队列失败:', error);
    }
  }

  /**
   * 获取待同步项目数量
   */
  getPendingSyncCount(): number {
    return this.syncQueue.length;
  }

  /**
   * 检查是否正在同步
   */
  isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  /**
   * 手动触发同步
   */
  async forceSync(userId: string): Promise<SyncResult> {
    if (!this.isOnline) {
      throw new Error('网络不可用');
    }

    try {
      const syncResponse = await syncService.triggerSync(userId, {
        force: true,
      });

      if (syncResponse.success && syncResponse.data) {
        // 处理同步结果
        const result: SyncResult = {
          success: true,
          synced: syncResponse.data.syncedItems,
          failed: 0,
          conflicts: [],
          errors: syncResponse.data.errors,
        };

        // 处理冲突
        for (const conflict of syncResponse.data.conflicts) {
          const conflictItem: ConflictItem = {
            id: `${conflict.type}-${conflict.id}`,
            type: conflict.type,
            localData: conflict.localData,
            remoteData: conflict.remoteData,
            timestamp: Date.now(),
            resolved: false,
            userId,
          };

          await indexedDBManager.set(STORES.CONFLICTS, conflictItem.id, conflictItem);
          result.conflicts.push(conflictItem);
        }

        return result;
      } else {
        throw new Error(syncResponse.error || '同步失败');
      }
    } catch (error) {
      throw new Error(`强制同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取冲突列表
   */
  async getConflicts(userId: string): Promise<ConflictItem[]> {
    try {
      const conflicts = await indexedDBManager.getAll<ConflictItem>(
        STORES.CONFLICTS,
        'userId',
        userId
      );
      return conflicts.filter(c => !c.resolved);
    } catch (error) {
      console.error('获取冲突列表失败:', error);
      return [];
    }
  }

  /**
   * 解决冲突
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge',
    mergedData?: any
  ): Promise<void> {
    try {
      // 调用后端解决冲突
      await syncService.resolveConflict(conflictId, resolution, mergedData);

      // 标记冲突为已解决
      const conflict = await indexedDBManager.get<ConflictItem>(STORES.CONFLICTS, conflictId);
      if (conflict) {
        conflict.data.resolved = true;
        await indexedDBManager.set(STORES.CONFLICTS, conflictId, conflict.data, {
          syncStatus: 'synced',
        });
      }
    } catch (error) {
      console.error('解决冲突失败:', error);
      throw error;
    }
  }

  /**
   * 注册同步事件回调
   */
  onSyncEvent(callback: (event: SyncEvent) => void): () => void {
    this.syncCallbacks.push(callback);
    return () => {
      const index = this.syncCallbacks.indexOf(callback);
      if (index > -1) {
        this.syncCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 触发同步事件回调
   */
  private triggerSyncEvent(event: SyncEvent): void {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('同步事件回调执行失败:', error);
      }
    });
  }

  /**
   * 缓存数据到本地
   */
  async cacheData<T>(
    entityType: string,
    entityId: string,
    data: T,
    options: {
      syncStatus?: StorageItem['syncStatus'];
      lastModified?: string;
    } = {}
  ): Promise<void> {
    const storeName = this.getEntityStore(entityType);
    if (!storeName) return;

    await indexedDBManager.set(storeName, entityId, data, {
      syncStatus: options.syncStatus,
      lastModified: options.lastModified,
    });
  }

  /**
   * 从本地缓存获取数据
   */
  async getCachedData<T>(entityType: string, entityId: string): Promise<T | null> {
    const storeName = this.getEntityStore(entityType);
    if (!storeName) return null;

    const item = await indexedDBManager.get<T>(storeName, entityId);
    return item?.data || null;
  }

  /**
   * 获取实体对应的存储名称
   */
  private getEntityStore(entityType: string): string | null {
    const storeMap: Record<string, string> = {
      task: STORES.TASKS,
      taskCompletion: STORES.TASK_COMPLETIONS,
      pointsTransaction: STORES.POINTS_TRANSACTIONS,
      levelRecord: STORES.LEVEL_RECORDS,
      punishment: STORES.PUNISHMENTS,
    };

    return storeMap[entityType] || null;
  }

  /**
   * 清理本地缓存
   */
  async clearCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      await indexedDBManager.cleanup(maxAge);
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }

  /**
   * 获取同步统计信息
   */
  async getSyncStats(userId: string): Promise<{
    pendingSync: number;
    conflicts: number;
    cacheSize: number;
    lastSyncTime: number | null;
  }> {
    try {
      const [syncQueue, conflicts, storageStats] = await Promise.all([
        indexedDBManager.getAll<SyncQueueItem>(STORES.SYNC_QUEUE, 'userId', userId),
        indexedDBManager.getAll<ConflictItem>(STORES.CONFLICTS, 'userId', userId),
        indexedDBManager.getStorageStats(),
      ]);

      const cacheSize = Object.values(storageStats).reduce((total, stat) => total + stat.size, 0);

      return {
        pendingSync: syncQueue.length,
        conflicts: conflicts.filter(c => !c.resolved).length,
        cacheSize,
        lastSyncTime: null, // 可以从其他地方获取最后同步时间
      };
    } catch (error) {
      console.error('获取同步统计失败:', error);
      return {
        pendingSync: 0,
        conflicts: 0,
        cacheSize: 0,
        lastSyncTime: null,
      };
    }
  }
}

// 创建单例实例
export const syncManager = new SyncManager();