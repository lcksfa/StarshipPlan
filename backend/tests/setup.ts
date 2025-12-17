import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Mock console methods to keep test output clean
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

// Global test utilities
export const createTestUser = async (prisma: PrismaClient, overrides: any = {}) => {
  const defaultUser = {
    username: `test_user_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    passwordHash: '$2b$10$test_hash_for_testing', // Mock hash
    role: 'CHILD',
    displayName: 'Test User',
    avatar: 'default.png',
    parentId: null,
    password: 'test_password',
    ...overrides
  };

  return await prisma.user.create({
    data: defaultUser
  });
};

export const createTestParent = async (prisma: PrismaClient, overrides: any = {}) => {
  const defaultParent = {
    username: `test_parent_${Date.now()}`,
    email: `parent_${Date.now()}@example.com`,
    passwordHash: '$2b$10$test_hash_for_testing',
    role: 'PARENT',
    displayName: 'Test Parent',
    avatar: 'parent.png',
    parentId: null,
    password: 'test_password',
    ...overrides
  };

  return await prisma.user.create({
    data: defaultParent
  });
};

export const createTestTask = async (prisma: PrismaClient, createdBy: string, overrides: any = {}) => {
  const defaultTask = {
    title: 'Test Task',
    description: 'Test task description',
    type: 'DAILY',
    category: 'STUDY',
    starCoins: 10,
    expReward: 20,
    difficulty: 'EASY',
    assignedTo: createdBy,
    createdBy,
    ...overrides
  };

  return await prisma.task.create({
    data: defaultTask
  });
};

export const generateTestJWT = (userId: string, role: string = 'CHILD') => {
  return jwt.sign(
    {
      userId,
      role,
      username: 'test_user'
    },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
};

export const getTestAuthHeaders = (userId: string, role: string = 'CHILD') => {
  const token = generateTestJWT(userId, role);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Mock Prisma Client for unit tests
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  task: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  taskCompletion: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
  },
  pointTransaction: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    aggregate: jest.fn(),
  },
  levelRecord: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
  },
  punishmentRecord: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  punishmentRule: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  syncLog: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Clean up function
export const cleanupTestDatabase = async (prisma: PrismaClient) => {
  // Delete in correct order to respect foreign key constraints
  await prisma.syncLog.deleteMany();
  await prisma.taskCompletion.deleteMany();
  await prisma.punishmentRecord.deleteMany();
  await prisma.task.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.levelRecord.deleteMany();
  await prisma.punishmentRule.deleteMany();
  await prisma.user.deleteMany();
};