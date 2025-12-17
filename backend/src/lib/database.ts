import { PrismaClient } from '@prisma/client';

// 全局变量，用于缓存 Prisma 客户端实例
declare global {
  var __prisma: PrismaClient | undefined;
}

// 创建 Prisma 客户端实例
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// 在开发环境中缓存客户端实例，避免热重载时创建多个连接
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// 测试数据库连接
export async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

// 优雅关闭数据库连接
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接时出错:', error);
  }
}

export default prisma;

// 导出所有 Prisma 模型类型
export type {
  User,
  Task,
  TaskCompletion,
  LevelRecord,
  PointTransaction,
  Reward,
  RewardRedemption,
  PunishmentRule,
  PunishmentRecord,
  UserSettings,
  Notification,
  SyncLog,
} from '@prisma/client';