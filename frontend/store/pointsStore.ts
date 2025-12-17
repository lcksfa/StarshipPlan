import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PointTransaction, LevelRecord, LevelStats } from '../types/api';
import { getPointsService } from '../lib/services/client-safe';

interface PointsState {
  // 数据状态
  totalStarCoins: number;
  currentLevel: LevelRecord | null;
  levelStats: LevelStats | null;
  transactions: PointTransaction[];
  levelHistory: LevelRecord[];
  availableRewards: Array<{
    id: string;
    name: string;
    description: string;
    cost: number;
    category: string;
  }>;
  leaderboard: Array<{
    userId: string;
    username: string;
    displayName: string;
    value: number;
    rank: number;
  }>;

  // UI 状态
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // 分页状态
  transactionsPage: number;
  hasMoreTransactions: boolean;

  // 筛选状态
  transactionFilters: {
    type?: string;
    period?: 'week' | 'month' | 'year';
  };

  // Actions
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  setTransactionFilters: (filters: Partial<PointsState['transactionFilters']>) => void;

  // 数据获取
  fetchUserPoints: (userId: string) => Promise<void>;
  fetchTransactions: (userId: string, loadMore?: boolean) => Promise<void>;
  fetchLevelHistory: (userId: string) => Promise<void>;
  fetchAvailableRewards: () => Promise<void>;
  fetchLevelStats: (userId: string) => Promise<void>;
  fetchLeaderboard: (type?: 'points' | 'level' | 'streak') => Promise<void>;

  // 积分操作
  exchangeReward: (userId: string, rewardId: string, cost: number) => Promise<boolean>;
  checkLevelUp: (userId: string) => Promise<boolean>;
  triggerLevelUp: (userId: string) => Promise<boolean>;

  // 本地状态更新
  addTransaction: (transaction: PointTransaction) => void;
  updatePoints: (amount: number) => void;
  updateLevel: (level: LevelRecord) => void;
  setLevelStats: (stats: LevelStats) => void;

  // 重置状态
  reset: () => void;
}

export const usePointsStore = create<PointsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      totalStarCoins: 0,
      currentLevel: null,
      levelStats: null,
      transactions: [],
      levelHistory: [],
      availableRewards: [],
      leaderboard: [],
      isLoading: false,
      isRefreshing: false,
      error: null,
      transactionsPage: 1,
      hasMoreTransactions: false,
      transactionFilters: {},

      // Actions
      setLoading: (isLoading) => set({ isLoading }),
      setRefreshing: (isRefreshing) => set({ isRefreshing }),
      setError: (error) => set({ error }),
      setTransactionFilters: (newFilters) => set((state) => ({
        transactionFilters: { ...state.transactionFilters, ...newFilters }
      })),

      // 数据获取
      fetchUserPoints: async (userId) => {
        try {
          const service = await getPointsService();
          if (!service) {
            console.error('Points service not available');
            return;
          }

          const response = await service.getUserPoints(userId);
          if (response.success && response.data) {
            // 将后端返回的数据转换为前端期望的格式
            const totalStarCoins = response.data.starCoins || 0;
            const currentLevel = {
              level: response.data.level || 1,
              title: response.data.title || '见习宇航员',
              rankTitle: response.data.title || '见习宇航员',
              exp: response.data.currentExp || 0,
              totalExp: response.data.totalExp || 0,
              shipName: response.data.shipName || '探索者号',
              promotedAt: new Date().toISOString(),
              userId: userId
            };

            console.log('更新用户数据:', { totalStarCoins, currentLevel, responseData: response.data });

            set({
              totalStarCoins,
              currentLevel
            });
          }
        } catch (error) {
          console.error('获取用户积分失败:', error);
        }
      },

      fetchTransactions: async (userId, loadMore = false) => {
        const { transactionsPage, transactionFilters } = get();

        if (!loadMore) {
          set({ isLoading: true });
        }

        try {
          const service = await getPointsService();
          if (!service) return;

          const response = await service.getTransactions(userId, {
            page: loadMore ? transactionsPage : 1,
            ...transactionFilters
          });

          if (response.success && response.data) {
            set((state) => ({
              transactions: loadMore ?
                [...state.transactions, ...response.data!] :
                response.data!,
              transactionsPage: loadMore ? state.transactionsPage + 1 : 2,
              hasMoreTransactions: response.data?.length === 20 // 假设每页20条
            }));
          }
        } catch (error) {
          console.error('获取交易记录失败:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchLevelHistory: async (userId) => {
        try {
          const service = await getPointsService();
          if (!service) return;

          const response = await service.getLevelHistory(userId);
          if (response.success && response.data) {
            set({ levelHistory: response.data });
          }
        } catch (error) {
          console.error('获取等级历史失败:', error);
        }
      },

      fetchAvailableRewards: async () => {
        try {
          const service = await getPointsService();
          if (!service) return;

          const response = await service.getAvailableRewards();
          if (response.success && response.data) {
            set({ availableRewards: response.data });
          }
        } catch (error) {
          console.error('获取可兑换奖励失败:', error);
        }
      },

      fetchLevelStats: async (userId) => {
        try {
          const service = await getPointsService();
          if (!service) return;

          const response = await service.getLevelStats(userId);
          if (response.success && response.data) {
            set({ levelStats: response.data });
          }
        } catch (error) {
          console.error('获取等级统计失败:', error);
        }
      },

      fetchLeaderboard: async (type = 'points') => {
        try {
          const service = await getPointsService();
          if (!service) return;

          const response = await service.getLeaderboard({ type, limit: 10 });
          if (response.success && response.data) {
            set({ leaderboard: response.data });
          }
        } catch (error) {
          console.error('获取排行榜失败:', error);
        }
      },

      // 积分操作
      exchangeReward: async (userId, rewardId, cost) => {
        try {
          const service = await getPointsService();
          if (!service) return false;

          const response = await service.exchangeRewards(userId, { rewardId, cost });
          if (response.success) {
            // 重新获取用户积分
            get().fetchUserPoints(userId);
            return true;
          }
        } catch (error) {
          console.error('兑换奖励失败:', error);
        }
        return false;
      },

      checkLevelUp: async (userId) => {
        try {
          const service = await getPointsService();
          if (!service) return false;

          const response = await service.checkLevelUp(userId);
          return response.success && response.data?.canLevelUp || false;
        } catch (error) {
          console.error('检查升级失败:', error);
          return false;
        }
      },

      triggerLevelUp: async (userId) => {
        try {
          const service = await getPointsService();
          if (!service) return false;

          const response = await service.triggerLevelUp(userId);
          if (response.success && response.data?.levelUp) {
            // 重新获取用户等级信息
            get().fetchUserPoints(userId);
            return true;
          }
        } catch (error) {
          console.error('触发升级失败:', error);
        }
        return false;
      },

      // 本地状态更新
      addTransaction: (transaction) => {
        set((state) => ({
          transactions: [transaction, ...state.transactions]
        }));

        // 更新总积分
        if (transaction.type === 'EARN' || transaction.type === 'BONUS') {
          get().updatePoints(transaction.amount);
        } else if (transaction.type === 'SPEND' || transaction.type === 'PENALTY') {
          get().updatePoints(-transaction.amount);
        }
      },

      updatePoints: (amount) => {
        set((state) => ({
          totalStarCoins: Math.max(0, state.totalStarCoins + amount)
        }));
      },

      updateLevel: (level) => {
        set({ currentLevel: level });
      },

      setLevelStats: (stats) => {
        set({ levelStats: stats });
      },

      // 重置状态
      reset: () => {
        set({
          totalStarCoins: 0,
          currentLevel: null,
          levelStats: null,
          transactions: [],
          levelHistory: [],
          availableRewards: [],
          leaderboard: [],
          isLoading: false,
          isRefreshing: false,
          error: null,
          transactionsPage: 1,
          hasMoreTransactions: false,
          transactionFilters: {}
        });
      }
    }),
    {
      name: 'points-store',
    }
  )
);

// 便捷 hooks
export const useTotalStarCoins = () => usePointsStore((state) => state.totalStarCoins);
export const useCurrentLevel = () => usePointsStore((state) => state.currentLevel);
export const useLevelStats = () => usePointsStore((state) => state.levelStats);
export const useTransactions = () => usePointsStore((state) => state.transactions);
export const useAvailableRewards = () => usePointsStore((state) => state.availableRewards);
export const useLeaderboard = () => usePointsStore((state) => state.leaderboard);
export const usePointsLoading = () => usePointsStore((state) => state.isLoading);
export const usePointsError = () => usePointsStore((state) => state.error);
