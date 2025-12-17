// IndexedDB 本地存储管理器

const DB_NAME = 'starship-plan-db';
const DB_VERSION = 1;

// 数据存储对象名称
export const STORES = {
  USERS: 'users',
  TASKS: 'tasks',
  TASK_COMPLETIONS: 'taskCompletions',
  POINTS_TRANSACTIONS: 'pointsTransactions',
  LEVEL_RECORDS: 'levelRecords',
  PUNISHMENTS: 'punishments',
  SYNC_QUEUE: 'syncQueue',
  CONFLICTS: 'conflicts',
  OFFLINE_CACHE: 'offlineCache',
} as const;

export interface StorageItem<T = any> {
  id: string;
  data: T;
  timestamp: number;
  version: number;
  syncStatus?: 'synced' | 'pending' | 'conflict';
  lastModified?: string;
}

export interface SyncQueueItem {
  id: string;
  type: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  userId: string;
}

export interface ConflictItem {
  id: string;
  type: string;
  localData: any;
  remoteData: any;
  timestamp: number;
  resolved: boolean;
  userId: string;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('IndexedDB 打开失败'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });

            // 创建索引
            switch (storeName) {
              case STORES.TASKS:
              case STORES.TASK_COMPLETIONS:
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                break;

              case STORES.POINTS_TRANSACTIONS:
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                break;

              case STORES.SYNC_QUEUE:
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('type', 'type', { unique: false });
                break;

              case STORES.CONFLICTS:
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('resolved', 'resolved', { unique: false });
                break;
            }
          }
        });
      };
    });

    return this.initPromise;
  }

  /**
   * 获取事务和对象存储
   */
  private getTransaction(storeName: string, mode: IDBTransactionMode = 'readonly') {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  /**
   * 存储数据
   */
  async set<T>(storeName: string, id: string, data: T, options: {
    syncStatus?: StorageItem['syncStatus'];
    lastModified?: string;
    version?: number;
  } = {}): Promise<void> {
    await this.init();

    const item: StorageItem<T> = {
      id,
      data,
      timestamp: Date.now(),
      version: options.version || 1,
      syncStatus: options.syncStatus || 'synced',
      lastModified: options.lastModified,
    };

    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readwrite');
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`存储失败: ${storeName}:${id}`));
    });
  }

  /**
   * 获取数据
   */
  async get<T>(storeName: string, id: string): Promise<StorageItem<T> | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readonly');
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as StorageItem<T> | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(new Error(`获取失败: ${storeName}:${id}`));
    });
  }

  /**
   * 删除数据
   */
  async delete(storeName: string, id: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readwrite');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`删除失败: ${storeName}:${id}`));
    });
  }

  /**
   * 获取所有数据
   */
  async getAll<T>(storeName: string, indexName?: string, indexValue?: any): Promise<StorageItem<T>[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readonly');

      let request: IDBRequest;
      if (indexName && indexValue !== undefined) {
        const index = store.index(indexName);
        request = index.getAll(indexValue);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const results = request.result as StorageItem<T>[] || [];
        resolve(results);
      };
      request.onerror = () => reject(new Error(`获取所有数据失败: ${storeName}`));
    });
  }

  /**
   * 清空存储
   */
  async clear(storeName: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readwrite');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`清空失败: ${storeName}`));
    });
  }

  /**
   * 批量操作
   */
  async batchSet<T>(storeName: string, items: Array<{ id: string; data: T }>): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readwrite');
      let completed = 0;
      const total = items.length;

      items.forEach(({ id, data }) => {
        const item: StorageItem<T> = {
          id,
          data,
          timestamp: Date.now(),
          version: 1,
          syncStatus: 'synced',
        };

        const request = store.put(item);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => {
          reject(new Error(`批量存储失败: ${storeName}`));
        };
      });
    });
  }

  /**
   * 获取存储统计
   */
  async getStorageStats(): Promise<Record<string, { count: number; size: number }>> {
    await this.init();

    const stats: Record<string, { count: number; size: number }> = {};

    for (const storeName of Object.values(STORES)) {
      const items = await this.getAll(storeName);
      const size = new Blob([JSON.stringify(items)]).size;
      stats[storeName] = {
        count: items.length,
        size,
      };
    }

    return stats;
  }

  /**
   * 清理过期数据
   */
  async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> { // 默认7天
    await this.init();

    const cutoffTime = Date.now() - maxAge;

    for (const storeName of Object.values(STORES)) {
      const items = await this.getAll(storeName);
      const expiredItems = items.filter(item => item.timestamp < cutoffTime);

      for (const item of expiredItems) {
        await this.delete(storeName, item.id);
      }
    }
  }

  /**
   * 导出所有数据
   */
  async exportData(): Promise<Record<string, any[]>> {
    await this.init();

    const exportData: Record<string, any[]> = {};

    for (const storeName of Object.values(STORES)) {
      const items = await this.getAll(storeName);
      exportData[storeName] = items;
    }

    return exportData;
  }

  /**
   * 导入数据
   */
  async importData(data: Record<string, any[]): Promise<void> {
    await this.init();

    for (const [storeName, items] of Object.entries(data)) {
      if (Object.values(STORES).includes(storeName as any)) {
        await this.clear(storeName);

        for (const item of items) {
          await this.set(storeName, item.id, item.data, {
            syncStatus: item.syncStatus,
            lastModified: item.lastModified,
            version: item.version,
          });
        }
      }
    }
  }
}

// 创建单例实例
export const indexedDBManager = new IndexedDBManager();