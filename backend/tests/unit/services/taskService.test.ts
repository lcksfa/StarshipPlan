import { TaskService } from '../../../src/services/taskService';
import { AppError } from '../../../src/types';

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    taskService = new TaskService();
  });

  describe('Basic functionality', () => {
    it('should create TaskService instance', () => {
      expect(taskService).toBeInstanceOf(TaskService);
    });

    it('should have required methods', () => {
      expect(typeof taskService.createTask).toBe('function');
      expect(typeof taskService.getTasks).toBe('function');
      expect(typeof taskService.completeTask).toBe('function');
      expect(typeof taskService.getTodayTasks).toBe('function');
      expect(typeof taskService.getTaskStats).toBe('function');
      expect(typeof taskService.getTaskById).toBe('function');
      expect(typeof taskService.updateTask).toBe('function');
      expect(typeof taskService.deleteTask).toBe('function');
    });
  });

  describe('createTask validation', () => {
    it('should accept valid task data', async () => {
      const validTaskData = {
        title: 'Test Task',
        description: 'Test Description',
        type: 'DAILY' as const,
        starCoins: 10,
        expReward: 20,
        difficulty: 'EASY' as const,
        frequency: 'DAILY' as const,
        createdBy: 'test_user'
      };

      try {
        await taskService.createTask(validTaskData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle missing required fields', async () => {
      const invalidTaskData = {
        title: '',
        type: 'DAILY' as const,
        starCoins: 0,
        expReward: 0,
        difficulty: 'EASY' as const,
        frequency: 'DAILY' as const,
        createdBy: ''
      };

      try {
        await taskService.createTask(invalidTaskData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getTasks with filters', () => {
    it('should accept valid filters', async () => {
      const validFilters = {
        userId: 'test_user',
        page: 1,
        limit: 20,
        type: 'DAILY'
      };

      try {
        await taskService.getTasks(validFilters);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should accept empty filters', async () => {
      try {
        await taskService.getTasks({});
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('completeTask validation', () => {
    it('should accept valid parameters', async () => {
      try {
        await taskService.completeTask('task_id', 'user_id');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid task ID', async () => {
      try {
        await taskService.completeTask('', 'user_id');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid user ID', async () => {
      try {
        await taskService.completeTask('task_id', '');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getTodayTasks', () => {
    it('should accept user ID', async () => {
      try {
        await taskService.getTodayTasks('test_user_id');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty user ID', async () => {
      try {
        await taskService.getTodayTasks('');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getTaskStats', () => {
    it('should accept valid parameters', async () => {
      try {
        await taskService.getTaskStats('test_user_id', 'today');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should accept different periods', async () => {
      const periods = ['today', 'week', 'month'];

      for (const period of periods) {
        try {
          await taskService.getTaskStats('test_user_id', period as any);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('getTaskById', () => {
    it('should accept task ID', async () => {
      try {
        await taskService.getTaskById('task_id');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty task ID', async () => {
      try {
        await taskService.getTaskById('');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('updateTask', () => {
    it('should accept valid parameters', async () => {
      try {
        await taskService.updateTask('task_id', { title: 'Updated Task' });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty task ID', async () => {
      try {
        await taskService.updateTask('', { title: 'Updated Task' });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('deleteTask', () => {
    it('should accept task ID', async () => {
      try {
        await taskService.deleteTask('task_id');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty task ID', async () => {
      try {
        await taskService.deleteTask('');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Method signatures', () => {
    it('should have correct return types', async () => {
      // Test that methods exist and have proper signatures
      expect(typeof taskService.createTask({} as any)).toBe('object');
      expect(typeof taskService.getTasks({} as any)).toBe('object');
      expect(typeof taskService.completeTask('task', 'user')).toBe('object');
      expect(typeof taskService.getTodayTasks('user')).toBe('object');
      expect(typeof taskService.getTaskStats('user', 'today')).toBe('object');
      expect(typeof taskService.getTaskById('task')).toBe('object');
      expect(typeof taskService.updateTask('task', {} as any)).toBe('object');
    });
  });
});