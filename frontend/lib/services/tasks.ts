import { apiClient, withErrorHandling } from '../api';
import {
  ApiResponse,
  PaginatedResponse,
  Task,
  TaskCompletion,
  TaskStats,
  CreateTaskRequest,
  UpdateTaskRequest,
  GetTasksParams,
  CompleteTaskRequest,
} from '../../types/api';

export class TasksService {
  /**
   * 获取任务列表
   */
  async getTasks(params?: GetTasksParams): Promise<ApiResponse<Task[]>> {
    return withErrorHandling(() => apiClient.get<Task[]>('/api/tasks', params));
  }

  /**
   * 获取单个任务详情
   */
  async getTask(taskId: string): Promise<ApiResponse<Task>> {
    return withErrorHandling(() => apiClient.get<Task>(`/api/tasks/${taskId}`));
  }

  /**
   * 创建新任务
   */
  async createTask(data: CreateTaskRequest): Promise<ApiResponse<Task>> {
    return withErrorHandling(() => apiClient.post<Task>('/api/tasks', data));
  }

  /**
   * 更新任务
   */
  async updateTask(taskId: string, data: UpdateTaskRequest): Promise<ApiResponse<Task>> {
    return withErrorHandling(() => apiClient.put<Task>(`/api/tasks/${taskId}`, data));
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    return withErrorHandling(() => apiClient.delete<void>(`/api/tasks/${taskId}`));
  }

  /**
   * 完成任务
   */
  async completeTask(data: CompleteTaskRequest): Promise<ApiResponse<TaskCompletion>> {
    return withErrorHandling(() => apiClient.post<TaskCompletion>(`/api/tasks/${data.taskId}/complete`, {}));
  }

  /**
   * 获取任务完成记录
   */
  async getTaskCompletions(
    userId: string,
    params?: { page?: number; limit?: number; taskId?: string }
  ): Promise<ApiResponse<TaskCompletion[]>> {
    return withErrorHandling(() =>
      apiClient.get<TaskCompletion[]>(`/api/tasks/completions/${userId}`, params)
    );
  }

  /**
   * 获取任务统计数据
   */
  async getTaskStats(userId: string): Promise<ApiResponse<TaskStats>> {
    return withErrorHandling(() => apiClient.get<TaskStats>(`/api/tasks/stats/${userId}`));
  }

  /**
   * 获取今日任务
   */
  async getTodayTasks(): Promise<ApiResponse<Task[]>> {
    return withErrorHandling(() => apiClient.get<Task[]>('/api/tasks/today'));
  }

  /**
   * 获取周任务
   */
  async getWeeklyTasks(): Promise<ApiResponse<Task[]>> {
    return withErrorHandling(() => apiClient.get<Task[]>('/api/tasks/weekly'));
  }

  /**
   * 取消完成任务
   */
  async uncompleteTask(taskId: string): Promise<ApiResponse<TaskCompletion>> {
    return withErrorHandling(() =>
      apiClient.delete<TaskCompletion>(`/api/tasks/${taskId}/complete`)
    );
  }

  /**
   * 批量完成任务
   */
  async completeMultipleTasks(taskIds: string[]): Promise<ApiResponse<TaskCompletion[]>> {
    return withErrorHandling(() =>
      apiClient.post<TaskCompletion[]>('/api/tasks/complete-batch', { taskIds })
    );
  }

  /**
   * 获取任务模板
   */
  async getTaskTemplates(): Promise<ApiResponse<Task[]>> {
    return withErrorHandling(() => apiClient.get<Task[]>('/api/tasks/templates'));
  }

  /**
   * 从模板创建任务
   */
  async createTaskFromTemplate(templateId: string): Promise<ApiResponse<Task>> {
    return withErrorHandling(() =>
      apiClient.post<Task>(`/api/tasks/from-template/${templateId}`)
    );
  }

  /**
   * 获取连击奖励信息
   */
  async getStreakBonus(userId: string): Promise<ApiResponse<{ currentStreak: number; bonusMultiplier: number }>> {
    return withErrorHandling(() => apiClient.get<{ currentStreak: number; bonusMultiplier: number }>(`/api/tasks/streak/${userId}`));
  }
}

// 创建单例实例
export const tasksService = new TasksService();
