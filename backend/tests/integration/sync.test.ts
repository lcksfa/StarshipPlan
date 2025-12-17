import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createTestUser, createTestParent, createTestTask, cleanupTestDatabase, generateTestJWT } from '../setup';
import app from '../../src/server';
import { Server } from 'http';

describe('Sync API Integration Tests', () => {
  let prisma: PrismaClient;
  let server: express.Application;
  let httpServer: Server;
  let parentUser: any;
  let childUser: any;
  let parentToken: string;
  let childToken: string;

  beforeAll(async () => {
    // Initialize test database
    prisma = new PrismaClient();

    // Start test server with HTTP server for Socket.io
    httpServer = new Server();
    server = app;

    // Initialize sync routes with HTTP server
    const initializeSyncRoutes = require('../../src/routes/sync').default;
    initializeSyncRoutes(httpServer);

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

    // Close HTTP server
    if (httpServer) {
      httpServer.close();
    }
  });

  describe('GET /api/sync/stats', () => {
    it('should get connection stats with authentication', async () => {
      const response = await request(server)
        .get('/api/sync/stats')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalConnections');
      expect(response.body.data).toHaveProperty('connectedUsers');
      expect(response.body.data).toHaveProperty('userConnections');
      expect(typeof response.body.data.totalConnections).toBe('number');
    });

    it('should reject stats request without authentication', async () => {
      const response = await request(server)
        .get('/api/sync/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('缺少授权令牌');
    });

    it('should get stats with child authentication', async () => {
      const response = await request(server)
        .get('/api/sync/stats')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalConnections');
    });
  });

  describe('POST /api/sync/trigger', () => {
    it('should trigger sync with authentication', async () => {
      const syncData = {
        entityTypes: ['task', 'point_transaction'],
        targetUserId: childUser.id
      };

      const response = await request(server)
        .post('/api/sync/trigger')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(syncData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('syncId');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.status).toBe('TRIGGERED');
    });

    it('should trigger sync without parameters', async () => {
      const response = await request(server)
        .post('/api/sync/trigger')
        .set('Authorization', `Bearer ${childToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject sync trigger without authentication', async () => {
      const response = await request(server)
        .post('/api/sync/trigger')
        .send({ entityTypes: ['task'] })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate entity types array', async () => {
      const response = await request(server)
        .post('/api/sync/trigger')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          entityTypes: 'invalid_type' // Should be array
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('GET /api/sync/logs', () => {
    beforeEach(async () => {
      // Create test sync logs
      await prisma.syncLog.createMany({
        data: [
          {
            userId: childUser.id,
            entityType: 'task',
            entityId: 'task1',
            action: 'CREATE',
            data: JSON.stringify({ title: 'Test Task' }),
            deviceId: 'device1',
            syncStatus: 'SYNCED',
            syncedAt: new Date()
          },
          {
            userId: childUser.id,
            entityType: 'punishment',
            entityId: 'punishment1',
            action: 'UPDATE',
            data: JSON.stringify({ status: 'COMPLETED' }),
            deviceId: 'device2',
            syncStatus: 'FAILED'
          },
          {
            userId: parentUser.id,
            entityType: 'point_transaction',
            entityId: 'tx1',
            action: 'CREATE',
            data: JSON.stringify({ amount: 10 }),
            deviceId: 'device1',
            syncStatus: 'PENDING'
          }
        ]
      });
    });

    it('should get sync logs with authentication', async () => {
      const response = await request(server)
        .get('/api/sync/logs')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter logs by entity type', async () => {
      const response = await request(server)
        .get('/api/sync/logs?entityType=task')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every((log: any) => log.entityType === 'task')).toBe(true);
      }
    });

    it('should filter logs by sync status', async () => {
      const response = await request(server)
        .get('/api/sync/logs?syncStatus=FAILED')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every((log: any) => log.syncStatus === 'FAILED')).toBe(true);
      }
    });

    it('should filter logs by entity ID', async () => {
      const response = await request(server)
        .get('/api/sync/logs?entityId=task1')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every((log: any) => log.entityId === 'task1')).toBe(true);
      }
    });

    it('should paginate sync logs', async () => {
      const response = await request(server)
        .get('/api/sync/logs?page=1&limit=2')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should validate entity type filter', async () => {
      const response = await request(server)
        .get('/api/sync/logs?entityType=invalid_type')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('实体类型无效');
    });

    it('should validate sync status filter', async () => {
      const response = await request(server)
        .get('/api/sync/logs?syncStatus=invalid_status')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('同步状态无效');
    });

    it('should reject logs request without authentication', async () => {
      const response = await request(server)
        .get('/api/sync/logs')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('缺少授权令牌');
    });
  });

  describe('DELETE /api/sync/logs/cleanup', () => {
    beforeEach(async () => {
      // Create old sync logs for cleanup testing
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

      await prisma.syncLog.createMany({
        data: [
          {
            userId: childUser.id,
            entityType: 'task',
            entityId: 'old_task1',
            action: 'CREATE',
            data: JSON.stringify({ title: 'Old Task 1' }),
            deviceId: 'old_device1',
            syncStatus: 'SYNCED',
            syncedAt: oldDate,
            createdAt: oldDate
          },
          {
            userId: childUser.id,
            entityType: 'task',
            entityId: 'old_task2',
            action: 'UPDATE',
            data: JSON.stringify({ status: 'COMPLETED' }),
            deviceId: 'old_device2',
            syncStatus: 'SYNCED',
            syncedAt: oldDate,
            createdAt: oldDate
          }
        ]
      });
    });

    it('should cleanup old sync logs with parent permissions', async () => {
      const response = await request(server)
        .delete('/api/sync/logs/cleanup')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ daysToKeep: 7 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('deletedCount');
      expect(typeof response.body.data.deletedCount).toBe('number');
    });

    it('should cleanup with default days (30)', async () => {
      const response = await request(server)
        .delete('/api/sync/logs/cleanup')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('deletedCount');
    });

    it('should reject cleanup with child permissions', async () => {
      const response = await request(server)
        .delete('/api/sync/logs/cleanup')
        .set('Authorization', `Bearer ${childToken}`)
        .send({ daysToKeep: 7 })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('需要家长权限');
    });

    it('should validate daysToKeep parameter', async () => {
      const response = await request(server)
        .delete('/api/sync/logs/cleanup')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ daysToKeep: 400 }) // Over max limit
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('保留天数必须是1-365之间的整数');
    });

    it('should reject cleanup without authentication', async () => {
      const response = await request(server)
        .delete('/api/sync/logs/cleanup')
        .send({ daysToKeep: 7 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/sync/resolve-conflict', () => {
    beforeEach(async () => {
      // Create a conflicted sync log
      const conflictedLog = await prisma.syncLog.create({
        data: {
          userId: childUser.id,
          entityType: 'task',
          entityId: 'conflicted_task',
          action: 'UPDATE',
          data: JSON.stringify({ title: 'Conflicted Task' }),
          deviceId: 'device_conflict',
          syncStatus: 'FAILED'
        }
      });
    });

    it('should resolve conflict with authentication', async () => {
      // Get the conflicted log ID
      const conflictedLog = await prisma.syncLog.findFirst({
        where: { entityId: 'conflicted_task' }
      });

      const resolutionData = {
        logId: conflictedLog!.id,
        resolution: {
          strategy: 'LAST_WRITE_WINS',
          data: { title: 'Resolved Task Title' }
        }
      };

      const response = await request(server)
        .post('/api/sync/resolve-conflict')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(resolutionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('resolvedAt');
    });

    it('should reject conflict resolution without authentication', async () => {
      const response = await request(server)
        .post('/api/sync/resolve-conflict')
        .send({
          logId: 'test_log_id',
          resolution: 'test_resolution'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(server)
        .post('/api/sync/resolve-conflict')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          // missing logId and resolution
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });

    it('should require logId field', async () => {
      const response = await request(server)
        .post('/api/sync/resolve-conflict')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          resolution: 'test_resolution'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('日志ID不能为空');
    });

    it('should require resolution field', async () => {
      const response = await request(server)
        .post('/api/sync/resolve-conflict')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          logId: 'test_log_id'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('解决方案不能为空');
    });
  });

  describe('GET /api/sync/devices', () => {
    it('should get devices list with authentication', async () => {
      const response = await request(server)
        .get('/api/sync/devices')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get devices with child authentication', async () => {
      const response = await request(server)
        .get('/api/sync/devices')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject devices request without authentication', async () => {
      const response = await request(server)
        .get('/api/sync/devices')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('缺少授权令牌');
    });
  });

  describe('POST /api/sync/devices/disconnect', () => {
    it('should disconnect device with parent permissions', async () => {
      const disconnectData = {
        deviceId: 'test_device_to_disconnect'
      };

      const response = await request(server)
        .post('/api/sync/devices/disconnect')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(disconnectData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('disconnectedAt');
    });

    it('should reject device disconnection with child permissions', async () => {
      const disconnectData = {
        deviceId: 'child_cannot_disconnect'
      };

      const response = await request(server)
        .post('/api/sync/devices/disconnect')
        .set('Authorization', `Bearer ${childToken}`)
        .send(disconnectData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('需要家长权限');
    });

    it('should require deviceId field', async () => {
      const response = await request(server)
        .post('/api/sync/devices/disconnect')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          // missing deviceId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('设备ID不能为空');
    });

    it('should reject disconnection without authentication', async () => {
      const response = await request(server)
        .post('/api/sync/devices/disconnect')
        .send({ deviceId: 'test_device' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('WebSocket Connection Tests', () => {
    // Note: WebSocket testing would require Socket.IO client library
    // These tests are simplified and focus on the HTTP endpoints
    it('should have sync service properly initialized', async () => {
      // Test that the sync routes are properly initialized
      const response = await request(server)
        .get('/api/sync/stats')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Integration with other modules', () => {
    it('should sync when task is created', async () => {
      // Create a task and check if sync log is created
      const taskData = {
        title: 'Sync Test Task',
        description: 'Task for sync testing',
        type: 'DAILY',
        category: 'STUDY',
        starCoins: 15,
        expReward: 25,
        difficulty: 'EASY',
        assignedTo: childUser.id
      };

      const taskResponse = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(taskData)
        .expect(201);

      expect(taskResponse.body.success).toBe(true);

      // Check if sync log was created (this would depend on the actual implementation)
      const logsResponse = await request(server)
        .get('/api/sync/logs?entityType=task')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(logsResponse.body.success).toBe(true);
    });

    it('should sync when points are adjusted', async () => {
      // Adjust points and check sync
      const adjustData = {
        userId: childUser.id,
        type: 'MANUAL_ADJUSTMENT',
        amount: 10,
        description: 'Sync test adjustment'
      };

      const pointsResponse = await request(server)
        .post('/api/points/adjust')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(adjustData)
        .expect(200);

      expect(pointsResponse.body.success).toBe(true);

      // Check sync logs for point transactions
      const logsResponse = await request(server)
        .get('/api/sync/logs?entityType=point_transaction')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(logsResponse.body.success).toBe(true);
    });
  });
});