import React from 'react';

// 导出所有 store
export { useUserStore, useCurrentUser, useIsParent, useActiveChild, useIsAuthenticated, useUserLoading } from './userStore';
export {
  useTaskStore,
  useTasks,
  useTodayTasks,
  useWeeklyTasks,
  useTaskStats,
  useTaskLoading,
  useTaskError
} from './taskStore';
export {
  usePointsStore,
  useTotalStarCoins,
  useCurrentLevel,
  useLevelStats,
  useTransactions,
  useAvailableRewards,
  useLeaderboard,
  usePointsLoading,
  usePointsError
} from './pointsStore';

// 导出类型
export type { UserState } from './userStore';
export type { TaskState } from './taskStore';
export type { PointsState } from './pointsStore';

// Store 初始化和清理工具
export class StoreManager {
  private static instance: StoreManager;
  private isInitialized = false;

  static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager();
    }
    return StoreManager.instance;
  }

  /**
   * 初始化所有 store 数据
   */
  async initializeStores(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      const { useUserStore } = await import('./userStore');
      const { useTaskStore } = await import('./taskStore');
      const { usePointsStore } = await import('./pointsStore');
      const { starshipClient } = await import('../lib/services');

      // 初始化 API 客户端
      await starshipClient.initialize(userId);

      this.isInitialized = true;
      console.log('所有 store 已初始化');
    } catch (error) {
      console.error('初始化 store 失败:', error);
      throw error;
    }
  }

  /**
   * 清理所有 store 数据和连接
   */
  async cleanup(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const { useUserStore } = await import('./userStore');
      const { useTaskStore } = await import('./taskStore');
      const { usePointsStore } = await import('./pointsStore');
      const { starshipClient } = await import('../lib/services');

      // 清理 API 客户端
      starshipClient.cleanup();

      // 重置所有 store
      useUserStore.getState().logout();
      useTaskStore.getState().reset();
      usePointsStore.getState().reset();

      this.isInitialized = false;
      console.log('所有 store 已清理');
    } catch (error) {
      console.error('清理 store 失败:', error);
    }
  }

  /**
   * 检查是否已初始化
   */
  isStoreInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 获取当前活跃用户 ID
   */
  getCurrentUserId(): string | null {
    if (!this.isInitialized) return null;

    try {
      const { useUserStore } = require('./userStore');
      const currentUser = useUserStore.getState().currentUser();
      return currentUser?.id || null;
    } catch (error) {
      console.error('获取当前用户 ID 失败:', error);
      return null;
    }
  }

  /**
   * 刷新所有数据
   */
  async refreshAllData(): Promise<void> {
    if (!this.isInitialized) return;

    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const { useTaskStore } = await import('./taskStore');
      const { usePointsStore } = await import('./pointsStore');

      // 并行刷新数据
      await Promise.all([
        useTaskStore.getState().refreshAll(),
        useTaskStore.getState().fetchTaskStats(userId),
        usePointsStore.getState().fetchUserPoints(userId),
        usePointsStore.getState().fetchLevelStats(userId),
        usePointsStore.getState().fetchLeaderboard(),
      ]);

      console.log('所有数据已刷新');
    } catch (error) {
      console.error('刷新数据失败:', error);
    }
  }

  /**
   * 初始化用户数据（登录后调用）
   */
  async initializeUserData(userId: string): Promise<void> {
    try {
      const { useTaskStore } = await import('./taskStore');
      const { usePointsStore } = await import('./pointsStore');

      // 并行获取用户数据
      await Promise.all([
        useTaskStore.getState().fetchTodayTasks(),
        useTaskStore.getState().fetchWeeklyTasks(),
        useTaskStore.getState().fetchTaskStats(userId),
        useTaskStore.getState().fetchTaskCompletions(userId),
        usePointsStore.getState().fetchUserPoints(userId),
        usePointsStore.getState().fetchLevelStats(userId),
        usePointsStore.getState().fetchAvailableRewards(),
      ]);

      console.log('用户数据初始化完成');
    } catch (error) {
      console.error('初始化用户数据失败:', error);
      throw error;
    }
  }
}

// 创建默认实例
export const storeManager = StoreManager.getInstance();

// 便捷的组合 hooks
export const useAppInitialization = () => {
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [initError, setInitError] = React.useState<string | null>(null);

  const initializeApp = React.useCallback(async (userId?: string) => {
    setIsInitializing(true);
    setInitError(null);

    try {
      await storeManager.initializeStores(userId);
      if (userId) {
        await storeManager.initializeUserData(userId);
      }
    } catch (error) {
      console.error('应用初始化失败:', error);
      setInitError(error instanceof Error ? error.message : '初始化失败');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const cleanupApp = React.useCallback(async () => {
    try {
      await storeManager.cleanup();
    } catch (error) {
      console.error('应用清理失败:', error);
    }
  }, []);

  return {
    isInitializing,
    initError,
    initializeApp,
    cleanupApp,
  };
};