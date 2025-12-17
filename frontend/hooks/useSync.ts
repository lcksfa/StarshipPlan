import { useEffect, useState, useCallback, useRef } from 'react';
import { useCurrentUser } from '../store';
import { syncManager, SyncResult, ConflictItem } from '../lib/storage/syncManager';
import { offlineManager } from '../lib/storage/offlineManager';
import { SyncEvent } from '../types/api';

export interface UseSyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
  enableOffline?: boolean;
  preloadData?: boolean;
}

export interface UseSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingSyncCount: number;
  conflicts: ConflictItem[];
  syncProgress: {
    total: number;
    completed: number;
    percentage: number;
  };
  error: string | null;

  // Actions
  forceSync: () => Promise<SyncResult>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merge', mergedData?: any) => Promise<void>;
  clearConflicts: () => Promise<void>;
  preloadCriticalData: () => Promise<void>;
  getOfflineStats: () => Promise<any>;
}

/**
 * 数据同步 Hook
 */
export function useSync(options: UseSyncOptions = {}): UseSyncReturn {
  const {
    autoSync = true,
    syncInterval = 30000, // 30秒
    enableOffline = true,
    preloadData = true,
  } = options;

  const currentUser = useCurrentUser();
  const userId = currentUser?.id;

  const [isOnline, setIsOnline] = useState(offlineManager.isNetworkAvailable());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [syncProgress, setSyncProgress] = useState({ total: 0, completed: 0, percentage: 0 });
  const [error, setError] = useState<string | null>(null);

  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  // 更新状态
  const updateStates = useCallback(async () => {
    if (!mountedRef.current || !userId) return;

    try {
      const [pendingCount, conflictList, offlineStats] = await Promise.all([
        syncManager.getPendingSyncCount(),
        syncManager.getConflicts(userId),
        offlineManager.getOfflineStats(),
      ]);

      setPendingSyncCount(pendingCount + offlineStats.pendingRequests);
      setConflicts(conflictList);
      setIsOnline(offlineManager.isNetworkAvailable());
    } catch (error) {
      console.error('更新同步状态失败:', error);
      setError(error instanceof Error ? error.message : '更新状态失败');
    }
  }, [userId]);

  // 处理同步事件
  const handleSyncEvent = useCallback((event: SyncEvent) => {
    if (!mountedRef.current) return;

    console.log('收到同步事件:', event);
    setLastSyncTime(new Date(event.timestamp));

    // 根据事件类型更新状态
    switch (event.type) {
      case 'TASK_CREATED':
      case 'TASK_UPDATED':
      case 'TASK_COMPLETED':
      case 'POINTS_CHANGED':
      case 'LEVEL_UP':
        updateStates();
        break;
    }
  }, [updateStates]);

  // 执行同步
  const performSync = useCallback(async (): Promise<SyncResult> => {
    if (!userId || !isOnline) {
      throw new Error('用户未登录或网络不可用');
    }

    setIsSyncing(true);
    setError(null);

    try {
      const result = await syncManager.processSyncQueue();

      if (mountedRef.current) {
        setLastSyncTime(new Date());
        setSyncProgress({
          total: result.synced + result.failed,
          completed: result.synced,
          percentage: result.synced + result.failed > 0
            ? Math.round((result.synced / (result.synced + result.failed)) * 100)
            : 0,
        });

        if (result.errors.length > 0) {
          setError(result.errors.join('; '));
        }
      }

      await updateStates();

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步失败';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw error;
    } finally {
      if (mountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [userId, isOnline, updateStates]);

  // 强制同步
  const forceSync = useCallback(async (): Promise<SyncResult> => {
    if (!userId) {
      throw new Error('用户未登录');
    }

    return await syncManager.forceSync(userId);
  }, [userId]);

  // 解决冲突
  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge',
    mergedData?: any
  ): Promise<void> => {
    await syncManager.resolveConflict(conflictId, resolution, mergedData);
    await updateStates();
  }, [updateStates]);

  // 清除所有冲突
  const clearConflicts = useCallback(async (): Promise<void> => {
    for (const conflict of conflicts) {
      await resolveConflict(conflict.id, 'local'); // 默认使用本地数据
    }
  }, [conflicts, resolveConflict]);

  // 预加载关键数据
  const preloadCriticalData = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      await offlineManager.preloadCriticalData(userId);
      console.log('关键数据预加载完成');
    } catch (error) {
      console.error('预加载关键数据失败:', error);
    }
  }, [userId]);

  // 获取离线统计
  const getOfflineStats = useCallback(async () => {
    return await offlineManager.getOfflineStats();
  }, []);

  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('网络已连接');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('网络已断开');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 设置同步事件监听
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = syncManager.onSyncEvent(handleSyncEvent);

    return () => {
      unsubscribe();
    };
  }, [userId, handleSyncEvent]);

  // 自动同步
  useEffect(() => {
    if (!autoSync || !userId || !isOnline) return;

    // 立即执行一次同步
    performSync().catch(console.error);

    // 设置定时同步
    syncIntervalRef.current = setInterval(() => {
      if (isOnline && !isSyncing) {
        performSync().catch(console.error);
      }
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, userId, isOnline, isSyncing, syncInterval, performSync]);

  // 预加载数据
  useEffect(() => {
    if (preloadData && userId && isOnline) {
      preloadCriticalData();
    }
  }, [preloadData, userId, isOnline, preloadCriticalData]);

  // 定期更新状态
  useEffect(() => {
    if (!userId) return;

    updateStates();

    const interval = setInterval(updateStates, 10000); // 每10秒更新一次状态

    return () => {
      clearInterval(interval);
    };
  }, [userId, updateStates]);

  // 清理
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingSyncCount,
    conflicts,
    syncProgress,
    error,
    forceSync,
    resolveConflict,
    clearConflicts,
    preloadCriticalData,
    getOfflineStats,
  };
}

/**
 * 简化的数据同步 Hook，适用于只需要基本同步功能的组件
 */
export function useBasicSync() {
  const { isOnline, isSyncing, lastSyncTime } = useSync({
    autoSync: false,
    enableOffline: true,
  });

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
  };
}

/**
 * 离线数据访问 Hook
 */
export function useOfflineData<T>(
  entityType: string,
  entityId: string,
  fetchOnline?: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!fetchOnline) return;

    setIsLoading(true);
    setError(null);

    try {
      // 尝试从离线缓存获取
      if (!forceRefresh) {
        const cached = await syncManager.getCachedData<T>(entityType, entityId);
        if (cached) {
          setData(cached);
          setIsFromCache(true);
          setIsLoading(false);
          return;
        }
      }

      // 从在线获取
      const onlineData = await fetchOnline();
      setData(onlineData);
      setIsFromCache(false);

      // 缓存数据
      await syncManager.cacheData(entityType, entityId, onlineData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载数据失败';
      setError(errorMessage);

      // 如果在线失败，尝试使用缓存
      if (!isFromCache) {
        try {
          const cached = await syncManager.getCachedData<T>(entityType, entityId);
          if (cached) {
            setData(cached);
            setIsFromCache(true);
            setError(null);
          }
        } catch (cacheError) {
          console.error('获取缓存数据失败:', cacheError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, fetchOnline, isFromCache]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    isFromCache,
    error,
    refresh: () => loadData(true),
  };
}