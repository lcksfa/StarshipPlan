// 导出所有存储相关功能
export { indexedDBManager, STORES } from './indexedDB';
export { syncManager, SyncManager } from './syncManager';
export { offlineManager, OfflineManager } from './offlineManager';

// 导出类型
export type {
  StorageItem,
  SyncQueueItem,
  ConflictItem,
} from './indexedDB';

export type {
  SyncOptions,
  SyncResult,
  DataChange,
} from './syncManager';

export type {
  OfflineRequest,
  OfflineCacheEntry,
} from './offlineManager';

// 统一的存储管理器
export class StorageManager {
  private static instance: StorageManager;
  private isInitialized = false;

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * 初始化存储系统
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await indexedDBManager.init();
      await syncManager.loadSyncQueue();
      await offlineManager.loadCache();
      this.isInitialized = true;
      console.log('存储系统初始化完成');
    } catch (error) {
      console.error('存储系统初始化失败:', error);
      throw error;
    }
  }

  /**
   * 清理所有存储数据
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        offlineManager.clearAllOfflineData(),
        indexedDBManager.cleanup(0), // 清理所有数据
      ]);
      console.log('所有存储数据已清理');
    } catch (error) {
      console.error('清理存储数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    indexedDB: Record<string, { count: number; size: number }>;
    offline: {
      pendingRequests: number;
      cacheSize: number;
      cachedItems: number;
      isOnline: boolean;
    };
    sync: {
      pendingSync: number;
      conflicts: number;
      cacheSize: number;
      lastSyncTime: number | null;
    };
  }> {
    const [indexedDBStats, offlineStats, syncStats] = await Promise.all([
      indexedDBManager.getStorageStats(),
      offlineManager.getOfflineStats(),
      syncManager.getSyncStats('current-user'), // TODO: 使用实际用户ID
    ]);

    return {
      indexedDB: indexedDBStats,
      offline: offlineStats,
      sync: syncStats,
    };
  }

  /**
   * 导出所有数据
   */
  async exportAllData(): Promise<{
    indexedDB: any;
    syncQueue: any[];
    offlineCache: any[];
  }> {
    const [indexedDBData, syncQueue] = await Promise.all([
      indexedDBManager.exportData(),
      indexedDBManager.getAll('syncQueue'),
    ]);

    return {
      indexedDB: indexedDBData,
      syncQueue,
      offlineCache: [], // 可以从 offlineManager 获取
    };
  }

  /**
   * 导入所有数据
   */
  async importAllData(data: {
    indexedDB: any;
    syncQueue?: any[];
    offlineCache?: any[];
  }): Promise<void> {
    try {
      await Promise.all([
        indexedDBManager.importData(data.indexedDB),
        // 处理 syncQueue 和 offlineCache
      ]);

      console.log('数据导入完成');
    } catch (error) {
      console.error('数据导入失败:', error);
      throw error;
    }
  }

  /**
   * 检查存储健康状态
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 检查 IndexedDB
      const indexedDBStats = await indexedDBManager.getStorageStats();
      const totalSize = Object.values(indexedDBStats).reduce((sum, stat) => sum + stat.size, 0);

      if (totalSize > 100 * 1024 * 1024) { // 100MB
        issues.push('本地存储空间使用过多');
        recommendations.push('建议清理过期数据');
      }

      // 检查同步状态
      const syncStats = await syncManager.getSyncStats('current-user');

      if (syncStats.pendingSync > 100) {
        issues.push('待同步项目过多');
        recommendations.push('建议检查网络连接并强制同步');
      }

      if (syncStats.conflicts > 10) {
        issues.push('数据冲突过多');
        recommendations.push('建议及时解决数据冲突');
      }

      // 检查离线缓存
      const offlineStats = await offlineManager.getOfflineStats();

      if (offlineStats.cacheSize > 50 * 1024 * 1024) { // 50MB
        issues.push('离线缓存过大');
        recommendations.push('建议清理离线缓存');
      }

      return {
        healthy: issues.length === 0,
        issues,
        recommendations,
      };

    } catch (error) {
      issues.push(`健康检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return {
        healthy: false,
        issues,
        recommendations: ['建议重启应用或清理存储数据'],
      };
    }
  }

  /**
   * 执行存储维护
   */
  async performMaintenance(): Promise<void> {
    try {
      console.log('开始存储维护...');

      // 清理过期数据
      await indexedDBManager.cleanup();
      await offlineManager.cleanupCache();

      // 清理已解决的冲突
      const conflicts = await syncManager.getConflicts('current-user');
      const resolvedConflicts = conflicts.filter(c => c.resolved);

      for (const conflict of resolvedConflicts) {
        await indexedDBManager.delete('conflicts', conflict.id);
      }

      console.log('存储维护完成');
    } catch (error) {
      console.error('存储维护失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否已初始化
   */
  isInitializedStorage(): boolean {
    return this.isInitialized;
  }
}

// 创建默认实例
export const storageManager = StorageManager.getInstance();