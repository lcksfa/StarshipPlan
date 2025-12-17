import { apiClient, withErrorHandling } from '../api';
import {
  ApiResponse,
  PaginatedResponse,
  PunishmentRecord,
} from '../../types/api';

interface CreatePunishmentRuleRequest {
  type: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  starCoinsDeduction: number;
  isActive: boolean;
}

interface UpdatePunishmentRuleRequest extends Partial<CreatePunishmentRuleRequest> {}

interface CreatePunishmentRequest {
  userId: string;
  ruleId: string;
  reason: string;
  evidence?: string;
}

interface AppealPunishmentRequest {
  reason: string;
  explanation: string;
}

interface ParentReviewRequest {
  action: 'APPROVE' | 'REJECT' | 'MODIFY';
  note?: string;
  modifiedDeduction?: number;
}

export class PunishmentsService {
  /**
   * 获取惩罚记录列表
   */
  async getPunishments(
    userId: string,
    params?: { page?: number; limit?: number; status?: string; severity?: string }
  ): Promise<ApiResponse<PunishmentRecord[]>> {
    return withErrorHandling(() =>
      apiClient.get<PunishmentRecord[]>(`/api/punishments`, { userId, ...params })
    );
  }

  /**
   * 获取单个惩罚记录详情
   */
  async getPunishment(punishmentId: string): Promise<ApiResponse<PunishmentRecord>> {
    return withErrorHandling(() => apiClient.get<PunishmentRecord>(`/api/punishments/${punishmentId}`));
  }

  /**
   * 获取惩罚规则列表
   */
  async getPunishmentRules(): Promise<ApiResponse<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    starCoinsDeduction: number;
    isActive: boolean;
    createdAt: string;
  }>>> {
    return withErrorHandling(() => apiClient.get<Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      starCoinsDeduction: number;
      isActive: boolean;
      createdAt: string;
    }>>('/api/punishments/rules'));
  }

  /**
   * 创建惩罚记录
   */
  async createPunishment(data: CreatePunishmentRequest): Promise<ApiResponse<PunishmentRecord>> {
    return withErrorHandling(() => apiClient.post<PunishmentRecord>('/api/punishments', data));
  }

  /**
   * 申诉惩罚
   */
  async appealPunishment(punishmentId: string, data: AppealPunishmentRequest): Promise<ApiResponse<PunishmentRecord>> {
    return withErrorHandling(() =>
      apiClient.post<PunishmentRecord>(`/api/punishments/${punishmentId}/appeal`, data)
    );
  }

  /**
   * 家长审核惩罚
   */
  async reviewPunishment(punishmentId: string, data: ParentReviewRequest): Promise<ApiResponse<PunishmentRecord>> {
    return withErrorHandling(() =>
      apiClient.put<PunishmentRecord>(`/api/punishments/${punishmentId}/review`, data)
    );
  }

  /**
   * 更新惩罚状态
   */
  async updatePunishmentStatus(
    punishmentId: string,
    status: 'PENDING' | 'APPEALED' | 'CONFIRMED' | 'COMPLETED'
  ): Promise<ApiResponse<PunishmentRecord>> {
    return withErrorHandling(() =>
      apiClient.put<PunishmentRecord>(`/api/punishments/${punishmentId}/status`, { status })
    );
  }

  /**
   * 获取违规检测（自动检测）
   */
  async detectViolations(userId: string): Promise<ApiResponse<Array<{
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    suggestedPunishment: any;
    evidence?: string;
  }>>> {
    return withErrorHandling(() =>
      apiClient.get<Array<{
        type: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
        description: string;
        suggestedPunishment: any;
        evidence?: string;
      }>>(`/api/punishments/detect-violations/${userId}`)
    );
  }

  /**
   * 获取惩罚统计数据
   */
  async getPunishmentStats(
    userId: string,
    params?: { period?: 'week' | 'month' | 'year' }
  ): Promise<ApiResponse<{
    totalPunishments: number;
    totalDeductions: number;
    bySeverity: { [key: string]: number };
    byType: { [key: string]: number };
    trendData: Array<{ date: string; count: number }>;
  }>> {
    return withErrorHandling(() =>
      apiClient.get<{
        totalPunishments: number;
        totalDeductions: number;
        bySeverity: { [key: string]: number };
        byType: { [key: string]: number };
        trendData: Array<{ date: string; count: number }>;
      }>(`/api/punishments/stats/${userId}`, params)
    );
  }

  // 管理员功能

  /**
   * 创建惩罚规则
   */
  async createPunishmentRule(data: CreatePunishmentRuleRequest): Promise<ApiResponse<any>> {
    return withErrorHandling(() => apiClient.post('/api/punishments/rules', data));
  }

  /**
   * 更新惩罚规则
   */
  async updatePunishmentRule(ruleId: string, data: UpdatePunishmentRuleRequest): Promise<ApiResponse<any>> {
    return withErrorHandling(() => apiClient.put(`/api/punishments/rules/${ruleId}`, data));
  }

  /**
   * 删除惩罚规则
   */
  async deletePunishmentRule(ruleId: string): Promise<ApiResponse<void>> {
    return withErrorHandling(() => apiClient.delete<void>(`/api/punishments/rules/${ruleId}`));
  }

  /**
   * 获取所有用户的惩罚记录（管理员）
   */
  async getAllPunishments(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    status?: string;
    severity?: string;
  }): Promise<ApiResponse<PunishmentRecord[]>> {
    return withErrorHandling(() => apiClient.get<PunishmentRecord[]>('/api/punishments/all', params));
  }
}

// 创建单例实例
export const punishmentsService = new PunishmentsService();