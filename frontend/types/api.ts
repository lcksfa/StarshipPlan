// API 响应基础类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  role: 'CHILD' | 'PARENT';
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

// 任务相关类型
export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'DAILY' | 'WEEKLY' | 'CUSTOM';
  starCoins: number;
  expReward: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  userId: string;
  completedAt: string;
  starCoinsEarned: number;
  expEarned: number;
  streakBonus?: number;
}

// 积分等级相关类型
export interface PointTransaction {
  id: string;
  userId: string;
  type: 'EARN' | 'SPEND' | 'BONUS' | 'PENALTY';
  amount: number;
  description?: string;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
}

export interface LevelRecord {
  id: string;
  userId: string;
  level: number;
  exp: number;
  expToNext: number;
  totalStarCoins: number;
  rankTitle?: string;
  leveledUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 惩罚相关类型
export interface PunishmentRecord {
  id: string;
  userId: string;
  type: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  starCoinsDeducted: number;
  status: 'PENDING' | 'APPEALED' | 'CONFIRMED' | 'COMPLETED';
  relatedTaskId?: string;
  parentNote?: string;
  createdAt: string;
  updatedAt: string;
}

// 统计数据类型
export interface TaskStats {
  totalTasks: number;
  completedToday: number;
  completedThisWeek: number;
  streakDays: number;
  completionRate: number;
  totalStarCoins: number;
}

export interface LevelStats {
  currentLevel: number;
  currentExp: number;
  expToNext: number;
  totalExp: number;
  rankTitle: string;
  progressPercentage: number;
}

// API 请求参数类型
export interface CreateTaskRequest {
  title: string;
  description?: string;
  type?: 'DAILY' | 'WEEKLY' | 'CUSTOM';
  starCoins?: number;
  expReward?: number;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  isActive?: boolean;
}

export interface CompleteTaskRequest {
  taskId: string;
}

export interface GetTasksParams {
  page?: number;
  limit?: number;
  type?: 'DAILY' | 'WEEKLY' | 'CUSTOM';
  active?: boolean;
}

// WebSocket 事件类型
export interface SyncEvent {
  type: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'POINTS_CHANGED' | 'LEVEL_UP';
  data: any;
  timestamp: string;
}

// 错误类型
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}