import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始数据库种子数据初始化...');

  // 创建默认家长用户
  const parent = await prisma.user.upsert({
    where: { username: 'parent' },
    update: {},
    create: {
      id: 'parent-1',
      username: 'parent',
      displayName: '家长',
      role: 'PARENT',
      password: 'password', // 实际项目中应该加密
    },
  });

  console.log('创建家长用户:', parent);

  // 创建默认儿童用户
  const child = await prisma.user.upsert({
    where: { username: 'child' },
    update: {},
    create: {
      id: 'child-1',
      username: 'child',
      displayName: '葫芦',
      role: 'CHILD',
      parentId: parent.id,
      password: 'password', // 实际项目中应该加密
    },
  });

  console.log('创建儿童用户:', child);

  console.log('数据库种子数据初始化完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
