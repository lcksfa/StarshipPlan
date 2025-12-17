import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { Task, TaskCompletion, TaskStats } from '../types/api';
import { getTasksService } from '../lib/services/client-safe';

interface TaskState {
  // 数据状态
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  taskStats: TaskStats | null;
  todayTasks: Task[];
  weeklyTasks: Task[];

  // UI 状态
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // 分页状态
  currentPage: number;
  totalPages: number;
  hasMore: boolean;

  // 筛选状态
  filters: {
    type?: 'DAILY' | 'WEEKLY' | 'CUSTOM';
    active?: boolean;
    completed?: boolean;
  };

  // Actions
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<TaskState['filters']>) => void;

  // 数据获取
  fetchTasks: (refresh?: boolean) => Promise<void>;
  fetchTaskById: (taskId: string) => Promise<Task | null>;
  fetchTodayTasks: () => Promise<void>;
  fetchWeeklyTasks: () => Promise<void>;
  fetchTaskStats: (userId: string) => Promise<void>;
  fetchTaskCompletions: (userId: string) => Promise<void>;
  refreshAll: () => Promise<void>;

  // 任务操作
  createTask: (task: any) => Promise<Task | null>;
  updateTask: (taskId: string, updates: any) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  completeTask: (taskId: string) => Promise<TaskCompletion | null>;
  uncompleteTask: (taskId: string) => Promise<TaskCompletion | null>;
  completeMultipleTasks: (taskIds: string[]) => Promise<TaskCompletion[] | null>;

  // 本地状态更新
  addTask: (task: Task) => void;
  updateTaskInStore: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  addTaskCompletion: (completion: TaskCompletion) => void;
  removeTaskCompletion: (taskId: string, userId: string) => void;
  updateTaskStats: (stats: TaskStats) => void;

  // 重置状态
  reset: () => void;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      tasks: [],
      taskCompletions: [],
      taskStats: null,
      todayTasks: [],
      weeklyTasks: [],
      isLoading: false,
      isRefreshing: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
      filters: {},

      // Actions
      setLoading: (isLoading) => set({ isLoading }),
      setRefreshing: (isRefreshing) => set({ isRefreshing }),
      setError: (error) => set({ error }),
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),

      // 数据获取
      fetchTasks: async (refresh = false) => {
        const { setLoading, setRefreshing, setError, filters, currentPage } = get();

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        try {
          const service = await getTasksService();
          if (!service) {
            setError('服务不可用');
            return;
          }

          const response = await service.getTasks({
            page: refresh ? 1 : currentPage,
            ...filters
          });

          if (response.success && response.data) {
            // 处理分页响应结构
            const taskData = Array.isArray(response.data) ? response.data : response.data.items || [];
            const pagination = response.data.pagination || {};

            set((state) => ({
              tasks: refresh ? taskData : [...state.tasks, ...taskData],
              currentPage: refresh ? 1 : state.currentPage + 1,
              hasMore: pagination.page < pagination.totalPages,
              error: null
            }));
          } else {
            setError(response.error || '获取任务列表失败');
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : '获取任务列表失败');
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },

      fetchTaskById: async (taskId) => {
        try {
          const service = await getTasksService();
          if (!service) return null;

          const response = await service.getTask(taskId);
          return response.success && response.data ? response.data : null;
        } catch (error) {
          console.error('获取任务详情失败:', error);
          return null;
        }
      },

      fetchTodayTasks: async () => {
        try {
          const service = await getTasksService();
          if (!service) return;

          const response = await service.getTodayTasks();
          if (response.success && response.data) {
            set({ todayTasks: response.data });
          }
        } catch (error) {
          console.error('获取今日任务失败:', error);
        }
      },

      fetchWeeklyTasks: async () => {
        try {
          const service = await getTasksService();
          if (!service) return;

          const response = await service.getWeeklyTasks();
          if (response.success && response.data) {
            set({ weeklyTasks: response.data });
          }
        } catch (error) {
          console.error('获取周任务失败:', error);
        }
      },

      fetchTaskStats: async (userId) => {
        try {
          const service = await getTasksService();
          if (!service) return;

          const response = await service.getTaskStats(userId);
          if (response.success && response.data) {
            set({ taskStats: response.data });
          }
        } catch (error) {
          console.error('获取任务统计失败:', error);
        }
      },

      fetchTaskCompletions: async (userId) => {
        try {
          const service = await getTasksService();
          if (!service) return;

          const response = await service.getTaskCompletions(userId);
          if (response.success && response.data) {
            set({ taskCompletions: response.data });
          }
        } catch (error) {
          console.error('获取任务完成记录失败:', error);
        }
      },

      refreshAll: async () => {
        const { fetchTasks, fetchTodayTasks, fetchWeeklyTasks } = get();
        await Promise.all([
          fetchTasks(true),
          fetchTodayTasks(),
          fetchWeeklyTasks()
        ]);
      },

      // 任务操作
      createTask: async (taskData) => {
        try {
          const service = await getTasksService();
          if (!service) return null;

          const response = await service.createTask(taskData);
          if (response.success && response.data) {
            get().addTask(response.data);
            return response.data;
          }
        } catch (error) {
          console.error('创建任务失败:', error);
        }
        return null;
      },

      updateTask: async (taskId, updates) => {
        try {
          const service = await getTasksService();
          if (!service) return null;

          const response = await service.updateTask(taskId, updates);
          if (response.success && response.data) {
            get().updateTaskInStore(taskId, response.data);
            return response.data;
          }
        } catch (error) {
          console.error('更新任务失败:', error);
        }
        return null;
      },

      deleteTask: async (taskId) => {
        try {
          const service = await getTasksService();
          if (!service) return false;

          const response = await service.deleteTask(taskId);
          if (response.success) {
            get().removeTask(taskId);
            return true;
          }
        } catch (error) {
          console.error('删除任务失败:', error);
        }
        return false;
      },

      completeTask: async (taskId) => {
        try {
          const service = await getTasksService();
          if (!service) return null;

          const response = await service.completeTask({ taskId });
          if (response.success && response.data) {
            get().addTaskCompletion(response.data);
            return response.data;
          }
        } catch (error) {
          console.error('完成任务失败:', error);
        }
        return null;
      },

      uncompleteTask: async (taskId) => {
        try {
          const service = await getTasksService();
          if (!service) return null;

          const response = await service.uncompleteTask(taskId);
          if (response.success && response.data) {
            get().removeTaskCompletion(taskId, response.data.userId);
            return response.data;
          }
        } catch (error) {
          console.error('取消完成任务失败:', error);
        }
        return null;
      },

      completeMultipleTasks: async (taskIds) => {
        try {
          const service = await getTasksService();
          if (!service) return null;

          const response = await service.completeMultipleTasks(taskIds);
          if (response.success && response.data) {
            response.data.forEach(completion => {
              get().addTaskCompletion(completion);
            });
            return response.data;
          }
        } catch (error) {
          console.error('批量完成任务失败:', error);
        }
        return null;
      },

      // 本地状态更新
      addTask: (task) => {
        set((state) => ({
          tasks: [task, ...state.tasks]
        }));
      },

      updateTaskInStore: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map(task =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
          todayTasks: state.todayTasks.map(task =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
          weeklyTasks: state.weeklyTasks.map(task =>
            task.id === taskId ? { ...task, ...updates } : task
          )
        }));
      },

      removeTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter(task => task.id !== taskId),
          todayTasks: state.todayTasks.filter(task => task.id !== taskId),
          weeklyTasks: state.weeklyTasks.filter(task => task.id !== taskId)
        }));
      },

      addTaskCompletion: (completion) => {
        set((state) => {
          // 更新任务完成状态
          const updateTaskCompleted = (task: any) =>
            task.id === completion.taskId ? { ...task, completed: true } : task;

          return {
            taskCompletions: [completion, ...state.taskCompletions],
            tasks: Array.isArray(state.tasks) ? state.tasks.map(updateTaskCompleted) : state.tasks,
            todayTasks: Array.isArray(state.todayTasks) ? state.todayTasks.map(updateTaskCompleted) : state.todayTasks,
            weeklyTasks: Array.isArray(state.weeklyTasks) ? state.weeklyTasks.map(updateTaskCompleted) : state.weeklyTasks,
          };
        });
      },

      removeTaskCompletion: (taskId, userId) => {
        set((state) => {
          // 更新任务完成状态为未完成
          const updateTaskUncompleted = (task: any) =>
            task.id === taskId ? { ...task, completed: false } : task;

          return {
            taskCompletions: state.taskCompletions.filter(
              completion => !(completion.taskId === taskId && completion.userId === userId)
            ),
            tasks: Array.isArray(state.tasks) ? state.tasks.map(updateTaskUncompleted) : state.tasks,
            todayTasks: Array.isArray(state.todayTasks) ? state.todayTasks.map(updateTaskUncompleted) : state.todayTasks,
            weeklyTasks: Array.isArray(state.weeklyTasks) ? state.weeklyTasks.map(updateTaskUncompleted) : state.weeklyTasks,
          };
        });
      },

      updateTaskStats: (stats) => {
        set({ taskStats: stats });
      },

      // 重置状态
      reset: () => {
        set({
          tasks: [],
          taskCompletions: [],
          taskStats: null,
          todayTasks: [],
          weeklyTasks: [],
          isLoading: false,
          isRefreshing: false,
          error: null,
          currentPage: 1,
          totalPages: 1,
          hasMore: false,
          filters: {}
        });
      }
    })),
    {
      name: 'task-store',
    }
  )
);

// 便捷 hooks
export const useTasks = () => useTaskStore((state) => state.tasks);
export const useTodayTasks = () => useTaskStore((state) => state.todayTasks);
export const useWeeklyTasks = () => useTaskStore((state) => state.weeklyTasks);
export const useTaskStats = () => useTaskStore((state) => state.taskStats);
export const useTaskLoading = () => useTaskStore((state) => state.isLoading);
export const useTaskError = () => useTaskStore((state) => state.error);
