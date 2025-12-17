import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createTestUser, createTestParent, createTestTask, getTestAuthHeaders, cleanupTestDatabase, generateTestJWT } from '../setup';
import app from '../../src/server';

describe('Tasks API Integration Tests', () => {
  let prisma: PrismaClient;
  let server: express.Application;
  let parentUser: any;
  let childUser: any;
  let parentToken: string;
  let childToken: string;

  beforeAll(async () => {
    // Initialize test database
    prisma = new PrismaClient();

    // Start test server
    server = app;

    // Create test users
    parentUser = await createTestParent(prisma);
    childUser = await createTestUser(prisma, {
      parentId: parentUser.id,
      role: 'CHILD'
    });

    // Generate test tokens
    parentToken = generateTestJWT(parentUser.id, 'PARENT');
    childToken = generateTestJWT(childUser.id, 'CHILD');
  });

  afterAll(async () => {
    // Clean up test database
    await cleanupTestDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('POST /api/tasks', () => {
    it('should create a task successfully with parent authentication', async () => {
      const taskData = {
        title: 'Complete Math Homework',
        description: 'Complete Chapter 5 exercises',
        type: 'DAILY',
        category: 'STUDY',
        starCoins: 15,
        expReward: 25,
        difficulty: 'MEDIUM',
        assignedTo: childUser.id
      };

      const response = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.assignedTo).toBe(childUser.id);
    });

    it('should reject task creation without authentication', async () => {
      const taskData = {
        title: 'Test Task',
        type: 'DAILY',
        starCoins: 10
      };

      const response = await request(server)
        .post('/api/tasks')
        .send(taskData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('缺少授权令牌');
    });

    it('should reject task creation with child authentication', async () => {
      const taskData = {
        title: 'Test Task',
        type: 'DAILY',
        starCoins: 10
      };

      const response = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${childToken}`)
        .send(taskData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('需要家长权限');
    });

    it('should validate required fields', async () => {
      const response = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          type: 'DAILY'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('GET /api/tasks', () => {
    let createdTask: any;

    beforeEach(async () => {
      createdTask = await createTestTask(prisma, parentUser.id, {
        assignedTo: childUser.id
      });
    });

    it('should get tasks list with parent authentication', async () => {
      const response = await request(server)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get tasks list with child authentication', async () => {
      const response = await request(server)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter tasks by status', async () => {
      const response = await request(server)
        .get('/api/tasks?status=PENDING')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((task: any) => task.status === 'PENDING')).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(server)
        .get('/api/tasks?page=1&limit=1')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/tasks/:id', () => {
    let createdTask: any;

    beforeEach(async () => {
      createdTask = await createTestTask(prisma, parentUser.id, {
        assignedTo: childUser.id
      });
    });

    it('should get task details with proper permissions', async () => {
      const response = await request(server)
        .get(`/api/tasks/${createdTask.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdTask.id);
      expect(response.body.data.title).toBe(createdTask.title);
    });

    it('should allow child to access assigned task', async () => {
      const response = await request(server)
        .get(`/api/tasks/${createdTask.id}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdTask.id);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(server)
        .get('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject without authentication', async () => {
      const response = await request(server)
        .get(`/api/tasks/${createdTask.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let createdTask: any;

    beforeEach(async () => {
      createdTask = await createTestTask(prisma, parentUser.id);
    });

    it('should update task with creator permissions', async () => {
      const updateData = {
        title: 'Updated Task Title',
        status: 'PENDING'
      };

      const response = await request(server)
        .put(`/api/tasks/${createdTask.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
    });

    it('should reject update with child permissions', async () => {
      const updateData = {
        title: 'Updated by Child'
      };

      const response = await request(server)
        .put(`/api/tasks/${createdTask.id}`)
        .set('Authorization', `Bearer ${childToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(server)
        .put('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let createdTask: any;

    beforeEach(async () => {
      createdTask = await createTestTask(prisma, parentUser.id);
    });

    it('should delete task with creator permissions', async () => {
      const response = await request(server)
        .delete(`/api/tasks/${createdTask.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject deletion with child permissions', async () => {
      const newTask = await createTestTask(prisma, parentUser.id);

      const response = await request(server)
        .delete(`/api/tasks/${newTask.id}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(server)
        .delete('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tasks/:id/complete', () => {
    let createdTask: any;

    beforeEach(async () => {
      createdTask = await createTestTask(prisma, parentUser.id, {
        assignedTo: childUser.id,
        status: 'PENDING'
      });
    });

    it('should complete task with child permissions', async () => {
      const completeData = {
        completionNotes: 'Task completed successfully!'
      };

      const response = await request(server)
        .post(`/api/tasks/${createdTask.id}/complete`)
        .set('Authorization', `Bearer ${childToken}`)
        .send(completeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.status).toBe('COMPLETED');
      expect(response.body.data.completion).toBeDefined();
      expect(response.body.data.starCoinsEarned).toBeGreaterThan(0);
      expect(response.body.data.expGained).toBeGreaterThan(0);
    });

    it('should reject completion with parent permissions', async () => {
      const completeData = {
        completionNotes: 'Parent trying to complete'
      };

      const response = await request(server)
        .post(`/api/tasks/${createdTask.id}/complete`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send(completeData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject completion of already completed task', async () => {
      // Mark task as completed
      await prisma.task.update({
        where: { id: createdTask.id },
        data: { status: 'COMPLETED' }
      });

      const response = await request(server)
        .post(`/api/tasks/${createdTask.id}/complete`)
        .set('Authorization', `Bearer ${childToken}`)
        .send({ completionNotes: 'Already completed' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('任务已完成');
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(server)
        .post('/api/tasks/non-existent-id/complete')
        .set('Authorization', `Bearer ${childToken}`)
        .send({ completionNotes: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tasks/batch-complete', () => {
    let createdTasks: any[];

    beforeEach(async () => {
      // Create multiple tasks
      createdTasks = [];
      for (let i = 0; i < 3; i++) {
        const task = await createTestTask(prisma, parentUser.id, {
          assignedTo: childUser.id,
          status: 'PENDING',
          title: `Task ${i + 1}`
        });
        createdTasks.push(task);
      }
    });

    it('should complete multiple tasks', async () => {
      const batchData = {
        taskIds: createdTasks.map(task => task.id),
        completionNotes: 'Batch completion'
      };

      const response = await request(server)
        .post('/api/tasks/batch-complete')
        .set('Authorization', `Bearer ${childToken}`)
        .send(batchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(3);
      expect(response.body.data.totalStarCoins).toBeGreaterThan(0);
      expect(response.body.data.totalExp).toBeGreaterThan(0);
    });

    it('should handle empty task array', async () => {
      const response = await request(server)
        .post('/api/tasks/batch-complete')
        .set('Authorization', `Bearer ${childToken}`)
        .send({ taskIds: [], completionNotes: 'Empty batch' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(0);
      expect(response.body.data.totalStarCoins).toBe(0);
    });

    it('should reject batch completion with parent permissions', async () => {
      const batchData = {
        taskIds: createdTasks.map(task => task.id),
        completionNotes: 'Parent batch'
      };

      const response = await request(server)
        .post('/api/tasks/batch-complete')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(batchData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks/today', () => {
    beforeEach(async () => {
      // Create some tasks for today
      await createTestTask(prisma, parentUser.id, {
        assignedTo: childUser.id,
        type: 'DAILY'
      });
    });

    it('should get today\'s tasks', async () => {
      const response = await request(server)
        .get('/api/tasks/today')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter today\'s tasks by user', async () => {
      const response = await request(server)
        .get(`/api/tasks/today?userId=${childUser.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/tasks/stats', () => {
    it('should get task statistics', async () => {
      const response = await request(server)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('completed');
      expect(response.body.data).toHaveProperty('pending');
    });

    it('should filter statistics by period', async () => {
      const response = await request(server)
        .get('/api/tasks/stats?period=week')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe('week');
    });

    it('should filter statistics by user', async () => {
      const response = await request(server)
        .get(`/api/tasks/stats?userId=${childUser.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/tasks/templates', () => {
    it('should get task templates with parent permissions', async () => {
      const response = await request(server)
        .get('/api/tasks/templates')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject templates endpoint with child permissions', async () => {
      const response = await request(server)
        .get('/api/tasks/templates')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should filter templates by category', async () => {
      const response = await request(server)
        .get('/api/tasks/templates?category=STUDY')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every((template: any) => template.category === 'STUDY')).toBe(true);
      }
    });
  });
});