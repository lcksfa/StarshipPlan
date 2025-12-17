import { apiClient, withErrorHandling } from '../api';
import {
  ApiResponse,
  PaginatedResponse,
  PointTransaction,
  LevelRecord,
  LevelStats,
} from '../../types/api';

interface CreateTransactionRequest {
  type: 'EARN' | 'SPEND' | 'BONUS' | 'PENALTY';
  amount: number;
  description?: string;
  relatedId?: string;
  relatedType?: string;
}

interface ExchangeRewardsRequest {
  rewardId: string;
  cost: number;
}

export class PointsService {
  /**
   * 获取用户当前积分和等级信息
   */
  async getUserPoints(userId?: string): Promise<ApiResponse<{ totalStarCoins: number; level: LevelRecord }>> {
    // 用户ID从认证token中获取，不需要在URL中传递
    return withErrorHandling(() => apiClient.get<{ totalStarCoins: number; level: LevelRecord }>(`/api/points`));
  }

  /**
   * 获取积分交易记录
   */
  async getTransactions(
    userId?: string,
    params?: { page?: number; limit?: number; type?: string }
  ): Promise<ApiResponse<PointTransaction[]>> {
    // 用户ID从认证token中获取，不需要在URL中传递
    return withErrorHandling(() =>
      apiClient.get<PointTransaction[]>(`/api/points/transactions`, params)
    );
  }

  /**
   * 获取等级记录历史
   */
  async getLevelHistory(userId?: string): Promise<ApiResponse<LevelRecord[]>> {
    // 用户ID从认证token中获取，不需要在URL中传递
    return withErrorHandling(() => apiClient.get<LevelRecord[]>(`/api/points/levels`));
  }

  /**
   * 创建积分交易（管理员功能）
   */
  async createTransaction(userId: string, data: CreateTransactionRequest): Promise<ApiResponse<PointTransaction>> {
    return withErrorHandling(() =>
      apiClient.post<PointTransaction>(`/api/points/transactions`, data)
    );
  }

  /**
   * 兑换奖励
   */
  async exchangeRewards(userId: string, data: ExchangeRewardsRequest): Promise<ApiResponse<PointTransaction>> {
    return withErrorHandling(() =>
      apiClient.post<PointTransaction>(`/api/points/exchange`, data)
    );
  }

  /**
   * 获取可兑换奖励列表
   */
  async getAvailableRewards(): Promise<ApiResponse<Array<{ id: string; name: string; description: string; cost: number; category: string }>>> {
    return withErrorHandling(() => apiClient.get<Array<{ id: string; name: string; description: string; cost: number; category: string }>>('/api/points/rewards'));
  }

  /**
   * 获取等级统计信息
   */
  async getLevelStats(userId?: string): Promise<ApiResponse<LevelStats>> {
    // 用户ID从认证token中获取，不需要在URL中传递
    return withErrorHandling(() => apiClient.get<LevelStats>(`/api/points/stats`));
  }

  /**
   * 获取排行榜
   */
  async getLeaderboard(params?: { type?: 'points' | 'level' | 'streak'; limit?: number }): Promise<ApiResponse<Array<{ userId: string; username: string; displayName: string; value: number; rank: number }>>> {
    return withErrorHandling(() => apiClient.get<Array<{ userId: string; username: string; displayName: string; value: number; rank: number }>>('/api/points/leaderboard', params));
  }

  /**
   * 获取积分统计报告
   */
  async getPointsReport(
    userId: string,
    params?: { period?: 'week' | 'month' | 'year'; startDate?: string; endDate?: string }
  ): Promise<ApiResponse<{
    totalEarned: number;
    totalSpent: number;
    netChange: number;
    transactionCount: number;
    breakdown: { [key: string]: number };
  }>> {
    return withErrorHandling(() =>
      apiClient.get<{
        totalEarned: number;
        totalSpent: number;
        netChange: number;
        transactionCount: number;
        breakdown: { [key: string]: number };
      }>(`/api/points/report/${userId}`, params)
    );
  }

  /**
   * 检查是否可以升级
   */
  async checkLevelUp(userId: string): Promise<ApiResponse<{ canLevelUp: boolean; expNeeded: number; nextLevelTitle: string }>> {
    return withErrorHandling(() =>
      apiClient.get<{ canLevelUp: boolean; expNeeded: number; nextLevelTitle: string }>(`/api/points/check-level/${userId}`)
    );
  }

  /**
   * 手动触发升级检查
   */
  async triggerLevelUp(userId: string): Promise<ApiResponse<{ levelUp: boolean; newLevel?: number; rewards?: any }>> {
    return withErrorHandling(() =>
      apiClient.post<{ levelUp: boolean; newLevel?: number; rewards?: any }>(`/api/points/level-up/${userId}`)
    );
  }
}

// 创建单例实例
export const pointsService = new PointsService();
