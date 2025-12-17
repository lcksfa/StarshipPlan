import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createTestUser, createTestParent, createTestTask, getTestAuthHeaders, cleanupTestDatabase, generateTestJWT } from '../setup';
import app from '../../src/server';

describe('Points API Integration Tests', () => {
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

  describe('GET /api/points/balance', () => {
    it('should get user balance with child authentication', async () => {
      const response = await request(server)
        .get('/api/points/balance')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('starCoins');
      expect(response.body.data).toHaveProperty('exp');
      expect(response.body.data).toHaveProperty('level');
      expect(typeof response.body.data.starCoins).toBe('number');
    });

    it('should get child balance with parent authentication', async () => {
      const response = await request(server)
        .get(`/api/points/balance?userId=${childUser.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('starCoins');
      expect(response.body.data).toHaveProperty('exp');
      expect(response.body.data).toHaveProperty('level');
    });

    it('should reject balance request without authentication', async () => {
      const response = await request(server)
        .get('/api/points/balance')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('缺少授权令牌');
    });

    it('should reject balance request from child for another user', async () => {
      const anotherChild = await createTestUser(prisma, {
        parentId: parentUser.id,
        role: 'CHILD'
      });

      const response = await request(server)
        .get(`/api/points/balance?userId=${anotherChild.id}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/points/transactions', () => {
    beforeEach(async () => {
      // Create some test transactions
      await prisma.pointTransaction.createMany({
        data: [
          {
            userId: childUser.id,
            type: 'TASK_COMPLETION',
            amount: 15,
            balance: 115,
            description: '完成任务奖励'
          },
          {
            userId: childUser.id,
            type: 'LEVEL_BONUS',
            amount: 50,
            balance: 165,
            description: '升级奖励'
          }
        ]
      });
    });

    it('should get transactions with authentication', async () => {
      const response = await request(server)
        .get('/api/points/transactions')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter transactions by type', async () => {
      const response = await request(server)
        .get('/api/points/transactions?type=TASK_COMPLETION')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every((tx: any) => tx.type === 'TASK_COMPLETION')).toBe(true);
      }
    });

    it('should paginate transactions', async () => {
      const response = await request(server)
        .get('/api/points/transactions?page=1&limit=1')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/points/level', () => {
    it('should get user level information', async () => {
      const response = await request(server)
        .get('/api/points/level')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('level');
      expect(response.body.data).toHaveProperty('currentExp');
      expect(response.body.data).toHaveProperty('nextLevelExp');
      expect(response.body.data).toHaveProperty('progress');
      expect(response.body.data).toHaveProperty('isMaxLevel');
      expect(typeof response.body.data.progress).toBe('number');
    });

    it('should get child level with parent authentication', async () => {
      const response = await request(server)
        .get(`/api/points/level?userId=${childUser.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('level');
    });
  });

  describe('GET /api/points/leaderboard', () => {
    beforeEach(async () => {
      // Create more users for leaderboard
      const otherChildren = await Promise.all([
        createTestUser(prisma, { parentId: parentUser.id, role: 'CHILD' }),
        createTestUser(prisma, { parentId: parentUser.id, role: 'CHILD' })
      ]);

      // Create different balances for users
      await Promise.all([
        prisma.pointTransaction.create({
          data: {
            userId: otherChildren[0].id,
            type: 'TASK_COMPLETION',
            amount: 200,
            balance: 300,
            description: 'High balance'
          }
        }),
        prisma.pointTransaction.create({
          data: {
            userId: otherChildren[1].id,
            type: 'TASK_COMPLETION',
            amount: 50,
            balance: 150,
            description: 'Medium balance'
          }
        })
      ]);
    });

    it('should get family leaderboard', async () => {
      const response = await request(server)
        .get('/api/points/leaderboard')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('rank');
      expect(response.body.data[0]).toHaveProperty('user');
      expect(response.body.data[0]).toHaveProperty('starCoins');
    });

    it('should limit leaderboard size', async () => {
      const response = await request(server)
        .get('/api/points/leaderboard?limit=2')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should reject leaderboard for child users', async () => {
      const response = await request(server)
        .get('/api/points/leaderboard')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('需要家长权限');
    });
  });

  describe('GET /api/points/history', () => {
    beforeEach(async () => {
      // Create test level records
      await prisma.levelRecord.createMany({
        data: [
          {
            userId: childUser.id,
            level: 2,
            title: '初级飞行员',
            exp: 100,
            totalExp: 150,
            shipName: '探索号',
            promotedAt: new Date()
          },
          {
            userId: childUser.id,
            level: 3,
            title: '中级宇航员',
            exp: 200,
            totalExp: 350,
            shipName: '探索号',
            promotedAt: new Date()
          }
        ]
      });
    });

    it('should get level history', async () => {
      const response = await request(server)
        .get('/api/points/history')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should paginate level history', async () => {
      const response = await request(server)
        .get('/api/points/history?page=1&limit=1')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('POST /api/points/adjust', () => {
    it('should add points with parent permissions', async () => {
      const adjustData = {
        userId: childUser.id,
        type: 'MANUAL_ADJUSTMENT',
        amount: 25,
        description: '奖励额外家务'
      };

      const response = await request(server)
        .post('/api/points/adjust')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(adjustData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newBalance).toBeDefined();
      expect(response.body.data.transaction).toBeDefined();
    });

    it('should deduct points with parent permissions', async () => {
      const adjustData = {
        userId: childUser.id,
        type: 'MANUAL_DEDUCTION',
        amount: -10,
        description: '惩罚扣除'
      };

      const response = await request(server)
        .post('/api/points/adjust')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(adjustData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newBalance).toBeDefined();
    });

    it('should reject adjustment without proper permissions', async () => {
      const adjustData = {
        userId: childUser.id,
        type: 'MANUAL_ADJUSTMENT',
        amount: 25,
        description: 'Self reward'
      };

      const response = await request(server)
        .post('/api/points/adjust')
        .set('Authorization', `Bearer ${childToken}`)
        .send(adjustData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate adjustment fields', async () => {
      const response = await request(server)
        .post('/api/points/adjust')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          userId: childUser.id
          // missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('GET /api/points/stats', () => {
    beforeEach(async () => {
      // Create various transactions for stats
      await prisma.pointTransaction.createMany({
        data: [
          {
            userId: childUser.id,
            type: 'TASK_COMPLETION',
            amount: 15,
            balance: 115,
            description: '任务奖励'
          },
          {
            userId: childUser.id,
            type: 'STREAK_BONUS',
            amount: 20,
            balance: 135,
            description: '连续任务奖励'
          }
        ]
      });
    });

    it('should get points statistics', async () => {
      const response = await request(server)
        .get('/api/points/stats')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('totalEarned');
      expect(response.body.data).toHaveProperty('totalDeducted');
      expect(response.body.data).toHaveProperty('netBalance');
      expect(response.body.data).toHaveProperty('transactionCount');
      expect(response.body.data).toHaveProperty('typeBreakdown');
    });

    it('should filter stats by period', async () => {
      const response = await request(server)
        .get('/api/points/stats?period=week')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe('week');
    });

    it('should filter stats by user', async () => {
      const response = await request(server)
        .get(`/api/points/stats?userId=${childUser.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/points/redeem', () => {
    beforeEach(async () => {
      // Ensure child has enough points
      await prisma.pointTransaction.create({
        data: {
          userId: childUser.id,
          type: 'MANUAL_ADJUSTMENT',
          amount: 200,
          balance: 300,
          description: 'Setup balance'
        }
      });
    });

    it('should redeem points with child authentication', async () => {
      const redeemData = {
        itemId: 'extra_screen_time',
        itemName: '额外屏幕时间',
        cost: 50
      };

      const response = await request(server)
        .post('/api/points/redeem')
        .set('Authorization', `Bearer ${childToken}`)
        .send(redeemData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newBalance).toBeDefined();
      expect(response.body.data.redemption).toBeDefined();
    });

    it('should reject redemption with insufficient balance', async () => {
      const redeemData = {
        itemId: 'big_reward',
        itemName: '大奖励',
        cost: 1000 // More than available
      };

      const response = await request(server)
        .post('/api/points/redeem')
        .set('Authorization', `Bearer ${childToken}`)
        .send(redeemData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('星币余额不足');
    });

    it('should validate redemption fields', async () => {
      const response = await request(server)
        .post('/api/points/redeem')
        .set('Authorization', `Bearer ${childToken}`)
        .send({
          itemId: 'test'
          // missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('GET /api/points/redemptions', () => {
    beforeEach(async () => {
      // Create test redemption
      await prisma.pointTransaction.create({
        data: {
          userId: childUser.id,
          type: 'REDEMPTION',
          amount: -50,
          balance: 250,
          description: '兑换: 额外屏幕时间',
          relatedId: 'redemption_test'
        }
      });
    });

    it('should get redemption history', async () => {
      const response = await request(server)
        .get('/api/points/redemptions')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should paginate redemption history', async () => {
      const response = await request(server)
        .get('/api/points/redemptions?page=1&limit=1')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });
});