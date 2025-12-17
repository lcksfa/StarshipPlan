import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createTestUser, createTestParent, createTestTask, getTestAuthHeaders, cleanupTestDatabase, generateTestJWT } from '../setup';
import app from '../../src/server';

describe('Punishments API Integration Tests', () => {
  let prisma: PrismaClient;
  let server: express.Application;
  let parentUser: any;
  let childUser: any;
  let parentToken: string;
  let childToken: string;
  let testTask: any;

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

    // Create test task for punishment associations
    testTask = await createTestTask(prisma, parentUser.id, {
      assignedTo: childUser.id
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

  describe('POST /api/punishments', () => {
    it('should create a punishment successfully with parent authentication', async () => {
      const punishmentData = {
        targetUserId: childUser.id,
        taskId: testTask.id,
        type: 'DEDUCT_COINS',
        reason: '未完成作业',
        severity: 'MEDIUM',
        value: 20
      };

      const response = await request(server)
        .post('/api/punishments')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(punishmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.targetUserId).toBe(childUser.id);
      expect(response.body.data.type).toBe('DEDUCT_COINS');
      expect(response.body.data.status).toBe('ACTIVE');
    });

    it('should reject punishment creation without authentication', async () => {
      const punishmentData = {
        targetUserId: childUser.id,
        type: 'DEDUCT_COINS',
        reason: 'Test'
      };

      const response = await request(server)
        .post('/api/punishments')
        .send(punishmentData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('缺少授权令牌');
    });

    it('should reject punishment creation with child authentication', async () => {
      const punishmentData = {
        targetUserId: childUser.id,
        type: 'EXTRA_TASK',
        reason: 'Self punishment'
      };

      const response = await request(server)
        .post('/api/punishments')
        .set('Authorization', `Bearer ${childToken}`)
        .send(punishmentData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('需要家长权限');
    });

    it('should validate required fields', async () => {
      const response = await request(server)
        .post('/api/punishments')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          targetUserId: childUser.id
          // missing other required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('GET /api/punishments', () => {
    beforeEach(async () => {
      // Create test punishments
      await prisma.punishmentRecord.createMany({
        data: [
          {
            userId: childUser.id,
            taskId: testTask.id,
            type: 'DEDUCT_COINS',
            reason: '第一个惩罚',
            severity: 'MINOR',
            value: 10,
            status: 'ACTIVE'
          },
          {
            userId: childUser.id,
            taskId: testTask.id,
            type: 'EXTRA_TASK',
            reason: '第二个惩罚',
            severity: 'MEDIUM',
            value: 1,
            status: 'COMPLETED'
          }
        ]
      });
    });

    it('should get punishments with parent authentication', async () => {
      const response = await request(server)
        .get('/api/punishments')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should get own punishments with child authentication', async () => {
      const response = await request(server)
        .get('/api/punishments')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter punishments by status', async () => {
      const response = await request(server)
        .get('/api/punishments?status=ACTIVE')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every((p: any) => p.status === 'ACTIVE')).toBe(true);
      }
    });

    it('should filter punishments by severity', async () => {
      const response = await request(server)
        .get('/api/punishments?severity=MEDIUM')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every((p: any) => p.severity === 'MEDIUM')).toBe(true);
      }
    });

    it('should paginate punishments', async () => {
      const response = await request(server)
        .get('/api/punishments?page=1&limit=1')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/punishments/:id', () => {
    let createdPunishment: any;

    beforeEach(async () => {
      createdPunishment = await prisma.punishmentRecord.create({
        data: {
          userId: childUser.id,
          taskId: testTask.id,
          type: 'DEDUCT_COINS',
          reason: '详细惩罚',
          severity: 'SEVERE',
          value: 50,
          status: 'ACTIVE'
        }
      });
    });

    it('should get punishment details with proper permissions', async () => {
      const response = await request(server)
        .get(`/api/punishments/${createdPunishment.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdPunishment.id);
      expect(response.body.data.reason).toBe('详细惩罚');
    });

    it('should allow child to access own punishment', async () => {
      const response = await request(server)
        .get(`/api/punishments/${createdPunishment.id}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdPunishment.id);
    });

    it('should return 404 for non-existent punishment', async () => {
      const response = await request(server)
        .get('/api/punishments/non-existent-id')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject access without authentication', async () => {
      const response = await request(server)
        .get(`/api/punishments/${createdPunishment.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/punishments/:id/status', () => {
    let activePunishment: any;

    beforeEach(async () => {
      activePunishment = await prisma.punishmentRecord.create({
        data: {
          userId: childUser.id,
          taskId: testTask.id,
          type: 'DEDUCT_COINS',
          reason: '待完成的惩罚',
          severity: 'MEDIUM',
          value: 25,
          status: 'ACTIVE'
        }
      });
    });

    it('should update punishment status with parent permissions', async () => {
      const updateData = {
        status: 'COMPLETED',
        notes: '孩子已完成任务'
      };

      const response = await request(server)
        .put(`/api/punishments/${activePunishment.id}/status`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
      expect(response.body.data.resolvedAt).toBeDefined();
    });

    it('should waive punishment with parent permissions', async () => {
      const updateData = {
        status: 'WAIVED',
        notes: '豁免惩罚'
      };

      const response = await request(server)
        .put(`/api/punishments/${activePunishment.id}/status`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('WAIVED');
    });

    it('should reject status update with child permissions', async () => {
      const updateData = {
        status: 'COMPLETED',
        notes: 'Self completed'
      };

      const response = await request(server)
        .put(`/api/punishments/${activePunishment.id}/status`)
        .set('Authorization', `Bearer ${childToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent punishment', async () => {
      const response = await request(server)
        .put('/api/punishments/non-existent-id/status')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ status: 'COMPLETED' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/punishments/:id', () => {
    let deletablePunishment: any;

    beforeEach(async () => {
      deletablePunishment = await prisma.punishmentRecord.create({
        data: {
          userId: childUser.id,
          taskId: testTask.id,
          type: 'EXTRA_TASK',
          reason: '可删除的惩罚',
          severity: 'MINOR',
          value: 1,
          status: 'ACTIVE'
        }
      });
    });

    it('should delete punishment with parent permissions', async () => {
      const response = await request(server)
        .delete(`/api/punishments/${deletablePunishment.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject deletion with child permissions', async () => {
      const response = await request(server)
        .delete(`/api/punishments/${deletablePunishment.id}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent punishment', async () => {
      const response = await request(server)
        .delete('/api/punishments/non-existent-id')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/punishments/rules', () => {
    beforeEach(async () => {
      // Create test punishment rules
      await prisma.punishmentRule.createMany({
        data: [
          {
            name: '未完成日常任务',
            description: '每日任务未完成时扣除星币',
            type: 'DEDUCT_COINS',
            severity: 'MEDIUM',
            value: 15,
            isActive: true,
            createdBy: parentUser.id
          },
          {
            name: '连续未完成任务',
            description: '连续多日未完成额外惩罚任务',
            type: 'EXTRA_TASK',
            severity: 'SEVERE',
            value: 2,
            isActive: true,
            createdBy: parentUser.id
          },
          {
            name: '已停用规则',
            description: '这是一个已停用的规则',
            type: 'RESTRICT_PRIVILEGE',
            severity: 'MINOR',
            value: 30,
            isActive: false,
            createdBy: parentUser.id
          }
        ]
      });
    });

    it('should get active punishment rules with parent permissions', async () => {
      const response = await request(server)
        .get('/api/punishments/rules')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.every((rule: any) => rule.isActive === true)).toBe(true);
    });

    it('should reject rules endpoint with child permissions', async () => {
      const response = await request(server)
        .get('/api/punishments/rules')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should filter rules by type', async () => {
      const response = await request(server)
        .get('/api/punishments/rules?type=DEDUCT_COINS')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every((rule: any) => rule.type === 'DEDUCT_COINS')).toBe(true);
      }
    });

    it('should filter rules by severity', async () => {
      const response = await request(server)
        .get('/api/punishments/rules?severity=SEVERE')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every((rule: any) => rule.severity === 'SEVERE')).toBe(true);
      }
    });
  });

  describe('POST /api/punishments/rules', () => {
    it('should create punishment rule with parent permissions', async () => {
      const ruleData = {
        name: '测试惩罚规则',
        description: '这是一个测试规则',
        type: 'DEDUCT_COINS',
        severity: 'MEDIUM',
        value: 20
      };

      const response = await request(server)
        .post('/api/punishments/rules')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(ruleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('测试惩罚规则');
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data.createdBy).toBe(parentUser.id);
    });

    it('should reject rule creation with child permissions', async () => {
      const ruleData = {
        name: '儿童规则',
        description: '不应该能创建',
        type: 'EXTRA_TASK',
        severity: 'MINOR',
        value: 1
      };

      const response = await request(server)
        .post('/api/punishments/rules')
        .set('Authorization', `Bearer ${childToken}`)
        .send(ruleData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate rule fields', async () => {
      const response = await request(server)
        .post('/api/punishments/rules')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          name: '不完整规则'
          // missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('GET /api/punishments/detect', () => {
    beforeEach(async () => {
      // Create incomplete tasks for violation detection
      await prisma.task.createMany({
        data: [
          {
            title: '应完成但未完成的任务1',
            description: '测试任务',
            type: 'DAILY',
            category: 'STUDY',
            starCoins: 10,
            expReward: 20,
            difficulty: 'EASY',
            assignedTo: childUser.id,
            createdBy: parentUser.id,
            status: 'PENDING',
            timeLimit: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
          },
          {
            title: '应完成但未完成的任务2',
            description: '测试任务2',
            type: 'WEEKDAYS',
            category: 'STUDY',
            starCoins: 15,
            expReward: 30,
            difficulty: 'MEDIUM',
            assignedTo: childUser.id,
            createdBy: parentUser.id,
            status: 'PENDING',
            timeLimit: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
          }
        ]
      });
    });

    it('should detect violations with parent permissions', async () => {
      const response = await request(server)
        .get('/api/punishments/detect')
        .query({ userId: childUser.id })
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject violation detection with child permissions', async () => {
      const response = await request(server)
        .get('/api/punishments/detect')
        .query({ userId: childUser.id })
        .set('Authorization', `Bearer ${childToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require userId parameter', async () => {
      const response = await request(server)
        .get('/api/punishments/detect')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户ID是必需的');
    });
  });

  describe('GET /api/punishments/stats', () => {
    beforeEach(async () => {
      // Create punishments for statistics
      await prisma.punishmentRecord.createMany({
        data: [
          {
            userId: childUser.id,
            taskId: testTask.id,
            type: 'DEDUCT_COINS',
            reason: '统计测试1',
            severity: 'MINOR',
            value: 10,
            status: 'ACTIVE'
          },
          {
            userId: childUser.id,
            taskId: testTask.id,
            type: 'EXTRA_TASK',
            reason: '统计测试2',
            severity: 'MEDIUM',
            value: 1,
            status: 'COMPLETED'
          },
          {
            userId: childUser.id,
            taskId: testTask.id,
            type: 'RESTRICT_PRIVILEGE',
            reason: '统计测试3',
            severity: 'SEVERE',
            value: 60,
            status: 'WAIVED'
          }
        ]
      });
    });

    it('should get punishment statistics', async () => {
      const response = await request(server)
        .get('/api/punishments/stats')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('totalPunishments');
      expect(response.body.data).toHaveProperty('severityBreakdown');
      expect(response.body.data).toHaveProperty('typeBreakdown');
      expect(response.body.data).toHaveProperty('statusBreakdown');
    });

    it('should filter statistics by period', async () => {
      const response = await request(server)
        .get('/api/punishments/stats?period=week')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe('week');
    });

    it('should filter statistics by user', async () => {
      const response = await request(server)
        .get(`/api/punishments/stats?userId=${childUser.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});