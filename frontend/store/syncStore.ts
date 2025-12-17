import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { syncManager, ConflictItem, DataChange } from '../lib/storage/syncManager';
import { offlineManager } from '../lib/storage/offlineManager';
import { SyncEvent } from '../types/api';

interface SyncState {
  // 连接状态
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;

  // 队列状态
  pendingSyncCount: number;
  conflicts: ConflictItem[];
  syncQueue: DataChange[];

  // 缓存状态
  cacheSize: number;
  cachedItems: number;

  // 进度状态
  syncProgress: {
    total: number;
    completed: number;
    percentage: number;
    currentItem?: string;
  };

  // 错误状态
  error: string | null;
  warnings: string[];

  // Actions
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: Date | null) => void;
  setPendingSyncCount: (count: number) => void;
  setConflicts: (conflicts: ConflictItem[]) => void;
  setSyncProgress: (progress: Partial<SyncState['syncProgress']>) => void;
  setError: (error: string | null) => void;
  addWarning: (warning: string) => void;
  clearWarnings: () => void;

  // 数据操作
  addDataChange: (change: DataChange) => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merge', mergedData?: any) => Promise<void>;
  clearConflict: (conflictId: string) => Promise<void>;
  clearAllConflicts: () => Promise<void>;

  // 同步操作
  triggerSync: () => Promise<void>;
  forceSync: () => Promise<void>;

  // 缓存操作
  getCachedData: <T>(entityType: string, entityId: string) => Promise<T | null>;
  setCachedData: <T>(entityType: string, entityId: string, data: T, options?: any) => Promise<void>;
  clearCache: (entityType?: string) => Promise<void>;

  // 状态更新
  refreshStats: () => Promise<void>;
  refreshConflicts: (userId?: string) => Promise<void>;

  // 重置
  reset: () => void;
}

export const useSyncStore = create<SyncState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncTime: null,
      pendingSyncCount: 0,
      conflicts: [],
      syncQueue: [],
      cacheSize: 0,
      cachedItems: 0,
      syncProgress: {
        total: 0,
        completed: 0,
        percentage: 0,
      },
      error: null,
      warnings: [],

      // Actions
      setOnline: (isOnline) => {
        set({ isOnline });
        if (isOnline) {
          get().triggerSync();
        }
      },

      setSyncing: (isSyncing) => set({ isSyncing }),

      setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),

      setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),

      setConflicts: (conflicts) => set({ conflicts }),

      setSyncProgress: (progress) => {
        set((state) => ({
          syncProgress: { ...state.syncProgress, ...progress }
        }));
      },

      setError: (error) => set({ error }),

      addWarning: (warning) => {
        set((state) => ({
          warnings: [...state.warnings, warning].slice(-10) // 保留最近10个警告
        }));
      },

      clearWarnings: () => set({ warnings: [] }),

      // 数据操作
      addDataChange: async (change) => {
        try {
          await syncManager.addDataChange(change);
          set((state) => ({
            syncQueue: [...state.syncQueue, change],
            pendingSyncCount: state.pendingSyncCount + 1,
          }));
        } catch (error) {
          get().setError(`添加数据变更失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      },

      resolveConflict: async (conflictId, resolution, mergedData) => {
        try {
          await syncManager.resolveConflict(conflictId, resolution, mergedData);
          set((state) => ({
            conflicts: state.conflicts.filter(c => c.id !== conflictId),
          }));
        } catch (error) {
          get().setError(`解决冲突失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      },

      clearConflict: async (conflictId) => {
        try {
          await syncManager.resolveConflict(conflictId, 'local');
          set((state) => ({
            conflicts: state.conflicts.filter(c => c.id !== conflictId),
          }));
        } catch (error) {
          get().setError(`清除冲突失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      },

      clearAllConflicts: async () => {
        const { conflicts } = get();
        for (const conflict of conflicts) {
          try {
            await syncManager.resolveConflict(conflict.id, 'local');
          } catch (error) {
            console.error(`清除冲突失败 ${conflict.id}:`, error);
          }
        }
        set({ conflicts: [] });
      },

      // 同步操作
      triggerSync: async () => {
        const { isOnline, isSyncing } = get();
        if (!isOnline || isSyncing) return;

        set({ isSyncing: true, error: null });

        try {
          const result = await syncManager.processSyncQueue();

          set((state) => ({
            lastSyncTime: new Date(),
            pendingSyncCount: Math.max(0, state.pendingSyncCount - result.synced),
            syncProgress: {
              total: result.synced + result.failed,
              completed: result.synced,
              percentage: result.synced + result.failed > 0
                ? Math.round((result.synced / (result.synced + result.failed)) * 100)
                : 0,
            },
          }));

          if (result.conflicts.length > 0) {
            set((state) => ({
              conflicts: [...state.conflicts, ...result.conflicts],
              warnings: [...state.warnings, `发现 ${result.conflicts.length} 个数据冲突`],
            }));
          }

          if (result.errors.length > 0) {
            get().addError(result.errors.join('; '));
          }

        } catch (error) {
          get().setError(`同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
          set({ isSyncing: false });
        }
      },

      forceSync: async () => {
        // 这里需要 userId，暂时从全局状态获取
        const userId = 'current-user'; // TODO: 从用户 store 获取

        set({ isSyncing: true, error: null });

        try {
          const result = await syncManager.forceSync(userId);

          set({
            lastSyncTime: new Date(),
            pendingSyncCount: 0,
            syncProgress: {
              total: result.synced + result.failed,
              completed: result.synced,
              percentage: result.synced + result.failed > 0
                ? Math.round((result.synced / (result.synced + result.failed)) * 100)
                : 0,
            },
          });

          if (result.conflicts.length > 0) {
            set({ conflicts: result.conflicts });
          }

        } catch (error) {
          get().setError(`强制同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
          set({ isSyncing: false });
        }
      },

      // 缓存操作
      getCachedData: async <T,>(entityType: string, entityId: string): Promise<T | null> => {
        try {
          return await syncManager.getCachedData<T>(entityType, entityId);
        } catch (error) {
          console.error('获取缓存数据失败:', error);
          return null;
        }
      },

      setCachedData: async <T,>(entityType: string, entityId: string, data: T, options?: any) => {
        try {
          await syncManager.cacheData(entityType, entityId, data, options);
        } catch (error) {
          console.error('设置缓存数据失败:', error);
        }
      },

      clearCache: async (entityType?: string) => {
        try {
          if (entityType) {
            // 清理特定类型的缓存
            // TODO: 实现
          } else {
            await syncManager.clearCache();
          }
        } catch (error) {
          console.error('清理缓存失败:', error);
        }
      },

      // 状态更新
      refreshStats: async () => {
        try {
          const [pendingCount, stats] = await Promise.all([
            syncManager.getPendingSyncCount(),
            offlineManager.getOfflineStats(),
          ]);

          set({
            pendingSyncCount: pendingCount,
            cacheSize: stats.cacheSize,
            cachedItems: stats.cachedItems,
          });
        } catch (error) {
          console.error('刷新统计失败:', error);
        }
      },

      refreshConflicts: async (userId?: string) => {
        try {
          if (userId) {
            const conflicts = await syncManager.getConflicts(userId);
            set({ conflicts });
          }
        } catch (error) {
          console.error('刷新冲突列表失败:', error);
        }
      },

      // 重置
      reset: () => {
        set({
          isOnline: navigator.onLine,
          isSyncing: false,
          lastSyncTime: null,
          pendingSyncCount: 0,
          conflicts: [],
          syncQueue: [],
          cacheSize: 0,
          cachedItems: 0,
          syncProgress: {
            total: 0,
            completed: 0,
            percentage: 0,
          },
          error: null,
          warnings: [],
        });
      },
    })),
    {
      name: 'sync-store',
    }
  )
);

// 网络状态监听
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useSyncStore.getState().setOnline(false);
  });
}

// 便捷 hooks
export const useIsOnline = () => useSyncStore((state) => state.isOnline);
export const useIsSyncing = () => useSyncStore((state) => state.isSyncing);
export const useLastSyncTime = () => useSyncStore((state) => state.lastSyncTime);
export const usePendingSyncCount = () => useSyncStore((state) => state.pendingSyncCount);
export const useConflicts = () => useSyncStore((state) => state.conflicts);
export const useSyncProgress = () => useSyncStore((state) => state.syncProgress);
export const useSyncError = () => useSyncStore((state) => state.error);
export const useSyncWarnings = () => useSyncStore((state) => state.warnings);

// 组合 hooks
export const useSyncStatus = () => {
  const isOnline = useIsOnline();
  const isSyncing = useIsSyncing();
  const pendingSyncCount = usePendingSyncCount();
  const conflicts = useConflicts();
  const lastSyncTime = useLastSyncTime();
  const error = useSyncError();

  return {
    isOnline,
    isSyncing,
    pendingSyncCount,
    conflictCount: conflicts.length,
    hasConflicts: conflicts.length > 0,
    lastSyncTime,
    error,
    needsAttention: !isOnline || pendingSyncCount > 0 || conflicts.length > 0 || !!error,
  };
};