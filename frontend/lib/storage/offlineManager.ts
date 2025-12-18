import { indexedDBManager, STORES, StorageItem } from './indexedDB';
import { syncManager, DataChange } from './syncManager';
import { starshipClient } from '../services';
import { API_CONFIG } from '../api-config';

export interface OfflineRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'normal' | 'low';
  userId: string;
}

export interface OfflineCacheEntry {
  url: string;
  data: any;
  timestamp: number;
  expiresAt: number;
  etag?: string;
}

class OfflineManager {
  private isOnline: boolean = navigator.onLine;
  private requestQueue: OfflineRequest[] = [];
  private cache: Map<string, OfflineCacheEntry> = new Map();

  constructor() {
    this.setupNetworkListeners();
    this.loadRequestQueue();
    this.loadCache();
  }

  /**
   * 设置网络状态监听
   */
  private setupNetworkListeners(): void {
    const handleOnline = () => {
      this.isOnline = true;
      console.log('网络已连接，处理离线请求队列');
      this.processRequestQueue();
    };

    const handleOffline = () => {
      this.isOnline = false;
      console.log('网络已断开，进入离线模式');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  /**
   * 加载请求队列
   */
  private async loadRequestQueue(): Promise<void> {
    try {
      const queueItems = await indexedDBManager.getAll(STORES.OFFLINE_CACHE);
      this.requestQueue = queueItems
        .filter(item => item.data.type === 'request')
        .map(item => item.data as OfflineRequest)
        .sort((a, b) => {
          // 按优先级排序
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 2;
          const bPriority = priorityOrder[b.priority] || 2;

          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }

          // 相同优先级按时间排序
          return a.timestamp - b.timestamp;
        });
    } catch (error) {
      console.error('加载离线请求队列失败:', error);
    }
  }

  /**
   * 加载缓存
   */
  private async loadCache(): Promise<void> {
    try {
      const cacheItems = await indexedDBManager.getAll(STORES.OFFLINE_CACHE);
      const now = Date.now();

      for (const item of cacheItems) {
        if (item.data.type === 'cache') {
          const cacheEntry = item.data as OfflineCacheEntry;

          // 检查缓存是否过期
          if (cacheEntry.expiresAt > now) {
            this.cache.set(cacheEntry.url, cacheEntry);
          } else {
            // 删除过期缓存
            await indexedDBManager.delete(STORES.OFFLINE_CACHE, item.id);
          }
        }
      }
    } catch (error) {
      console.error('加载离线缓存失败:', error);
    }
  }

  /**
   * 拦截并处理 API 请求
   */
  async handleRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    options: {
      priority?: 'high' | 'normal' | 'low';
      cacheable?: boolean;
      cacheTime?: number; // 缓存时间（毫秒）
      userId?: string;
    } = {}
  ): Promise<T> {
    const { priority = 'normal', cacheable = false, cacheTime = 5 * 60 * 1000, userId } = options;

    // 如果在线，尝试直接发送请求
    if (this.isOnline) {
      try {
        // 对于 GET 请求，检查缓存
        if (method === 'GET' && cacheable) {
          const cached = this.getCached(endpoint);
          if (cached) {
            return cached;
          }
        }

        // 发送请求
        const response = await this.sendRequest<T>(method, endpoint, data);

        // 缓存成功的 GET 请求响应
        if (method === 'GET' && cacheable && response) {
          this.setCache(endpoint, response, cacheTime);
        }

        return response;

      } catch (error) {
        console.warn('在线请求失败，尝试离线处理:', error);

        // 如果是只读请求且有缓存，返回缓存数据
        if (method === 'GET') {
          const cached = this.getCached(endpoint);
          if (cached) {
            return cached;
          }
        }

        // 对于写操作，添加到离线队列
        if (method !== 'GET' && userId) {
          await this.addToRequestQueue(method, endpoint, data, priority, userId);
        }

        throw error;
      }
    } else {
      // 离线模式
      console.log('离线模式处理请求:', method, endpoint);

      if (method === 'GET') {
        // GET 请求返回缓存数据
        const cached = this.getCached(endpoint);
        if (cached) {
          return cached;
        }

        throw new Error('离线模式且无缓存数据');
      } else {
        // 写操作添加到队列
        if (!userId) {
          throw new Error('离线模式下的写操作需要用户 ID');
        }

        await this.addToRequestQueue(method, endpoint, data, priority, userId);

        // 返回一个临时响应（用于乐观更新）
        return this.createTemporaryResponse(method, endpoint, data) as T;
      }
    }
  }

  /**
   * 发送 HTTP 请求
   */
  private async sendRequest<T>(method: string, endpoint: string, data?: any): Promise<T> {
    const url = `${API_CONFIG.getApiUrl()}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 添加请求到离线队列
   */
  private async addToRequestQueue(
    method: string,
    endpoint: string,
    data: any,
    priority: 'high' | 'normal' | 'low',
    userId: string
  ): Promise<void> {
    const request: OfflineRequest = {
      id: `${method}-${endpoint}-${Date.now()}-${Math.random()}`,
      method: method as any,
      endpoint,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      priority,
      userId,
    };

    this.requestQueue.push(request);

    try {
      await indexedDBManager.set(STORES.OFFLINE_CACHE, request.id, {
        type: 'request',
        ...request,
      });
    } catch (error) {
      console.error('保存离线请求失败:', error);
    }

    // 添加到同步管理器的数据变更队列
    const entityType = this.extractEntityType(endpoint);
    const entityId = this.extractEntityId(endpoint, data);

    if (entityType && entityId) {
      const action = method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update';

      await syncManager.addDataChange({
        type: action,
        entityType,
        entityId,
        data,
        timestamp: Date.now(),
        userId,
      });
    }
  }

  /**
   * 处理离线请求队列
   */
  private async processRequestQueue(): Promise<void> {
    if (this.requestQueue.length === 0) return;

    console.log(`处理 ${this.requestQueue.length} 个离线请求`);

    const failedRequests: OfflineRequest[] = [];

    // 批量处理请求
    const batchSize = 5;
    for (let i = 0; i < this.requestQueue.length; i += batchSize) {
      const batch = this.requestQueue.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(async (request) => {
          try {
            await this.sendRequest(request.method, request.endpoint, request.data);

            // 成功后从队列和存储中移除
            await indexedDBManager.delete(STORES.OFFLINE_CACHE, request.id);
          } catch (error) {
            console.error('离线请求失败:', request.endpoint, error);

            request.retryCount++;
            if (request.retryCount < 3) {
              failedRequests.push(request);
            } else {
              // 重试次数过多，从队列中移除
              await indexedDBManager.delete(STORES.OFFLINE_CACHE, request.id);
            }
          }
        })
      );
    }

    // 更新请求队列
    this.requestQueue = failedRequests;

    // 保存重试的请求
    for (const request of failedRequests) {
      await indexedDBManager.set(STORES.OFFLINE_CACHE, request.id, {
        type: 'request',
        ...request,
      });
    }
  }

  /**
   * 获取缓存数据
   */
  private getCached<T>(url: string): T | null {
    const cached = this.cache.get(url);
    return cached ? cached.data : null;
  }

  /**
   * 设置缓存数据
   */
  private async setCache(url: string, data: any, cacheTime: number): Promise<void> {
    const now = Date.now();
    const cacheEntry: OfflineCacheEntry = {
      url,
      data,
      timestamp: now,
      expiresAt: now + cacheTime,
    };

    this.cache.set(url, cacheEntry);

    try {
      await indexedDBManager.set(STORES.OFFLINE_CACHE, `cache-${url}`, {
        type: 'cache',
        ...cacheEntry,
      });
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  }

  /**
   * 创建临时响应（用于乐观更新）
   */
  private createTemporaryResponse(method: string, endpoint: string, data?: any): any {
    const entityType = this.extractEntityType(endpoint);
    const entityId = this.extractEntityId(endpoint, data);

    if (!entityType || !entityId) {
      return { success: false, error: '无法创建临时响应' };
    }

    // 根据不同的操作类型创建临时响应
    switch (method) {
      case 'POST':
        return {
          success: true,
          data: {
            id: `temp-${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString(),
            isTemp: true,
          },
        };

      case 'PUT':
        return {
          success: true,
          data: {
            id: entityId,
            ...data,
            updatedAt: new Date().toISOString(),
            isTemp: true,
          },
        };

      case 'DELETE':
        return {
          success: true,
          data: null,
        };

      default:
        return { success: false, error: '不支持的离线操作' };
    }
  }

  /**
   * 从端点提取实体类型
   */
  private extractEntityType(endpoint: string): string | null {
    const matches = endpoint.match(/\/api\/(\w+)/);
    return matches ? matches[1] : null;
  }

  /**
   * 从端点和数据提取实体 ID
   */
  private extractEntityId(endpoint: string, data?: any): string | null {
    // 尝试从 URL 路径中提取 ID
    const urlIdMatch = endpoint.match(/\/(\w+)(?:\/([^\/]+))?$/);
    if (urlIdMatch && urlIdMatch[2]) {
      return urlIdMatch[2];
    }

    // 尝试从请求数据中提取 ID
    if (data && data.id) {
      return data.id;
    }

    return null;
  }

  /**
   * 预加载重要数据到缓存
   */
  async preloadCriticalData(userId: string): Promise<void> {
    if (!this.isOnline) return;

    try {
      // 预加载今日任务
      await this.handleRequest('GET', `/api/tasks/today`, undefined, {
        cacheable: true,
        cacheTime: 10 * 60 * 1000, // 10分钟缓存
        userId,
      });

      // 预加载用户积分信息
      await this.handleRequest('GET', `/api/points/user/${userId}`, undefined, {
        cacheable: true,
        cacheTime: 5 * 60 * 1000, // 5分钟缓存
        userId,
      });

      // 预加载任务统计
      await this.handleRequest('GET', `/api/tasks/stats/${userId}`, undefined, {
        cacheable: true,
        cacheTime: 15 * 60 * 1000, // 15分钟缓存
        userId,
      });

      console.log('关键数据预加载完成');
    } catch (error) {
      console.error('预加载关键数据失败:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanupCache(): Promise<void> {
    const now = Date.now();
    const expiredUrls: string[] = [];

    for (const [url, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        expiredUrls.push(url);
      }
    }

    for (const url of expiredUrls) {
      this.cache.delete(url);
      await indexedDBManager.delete(STORES.OFFLINE_CACHE, `cache-${url}`);
    }

    console.log(`清理了 ${expiredUrls.length} 个过期缓存`);
  }

  /**
   * 获取离线统计信息
   */
  async getOfflineStats(): Promise<{
    pendingRequests: number;
    cacheSize: number;
    cachedItems: number;
    isOnline: boolean;
  }> {
    try {
      const storageStats = await indexedDBManager.getStorageStats();
      const cacheSize = storageStats[STORES.OFFLINE_CACHE]?.size || 0;

      return {
        pendingRequests: this.requestQueue.length,
        cacheSize,
        cachedItems: this.cache.size,
        isOnline: this.isOnline,
      };
    } catch (error) {
      console.error('获取离线统计失败:', error);
      return {
        pendingRequests: 0,
        cacheSize: 0,
        cachedItems: 0,
        isOnline: this.isOnline,
      };
    }
  }

  /**
   * 清除所有离线数据
   */
  async clearAllOfflineData(): Promise<void> {
    try {
      this.cache.clear();
      this.requestQueue = [];
      await indexedDBManager.clear(STORES.OFFLINE_CACHE);
      console.log('所有离线数据已清除');
    } catch (error) {
      console.error('清除离线数据失败:', error);
    }
  }

  /**
   * 检查网络状态
   */
  isNetworkAvailable(): boolean {
    return this.isOnline;
  }
}

// 创建单例实例
export const offlineManager = new OfflineManager();
