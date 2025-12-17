import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始数据库初始化...');

  // 创建管理员家长账户
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      displayName: '管理员家长',
      role: 'PARENT',
      password: adminPassword,
    },
  });

  // 创建测试儿童账户
  const childUser = await prisma.user.create({
    data: {
      username: '葫芦',
      displayName: '葫芦小宇航员',
      role: 'CHILD',
      parentId: adminUser.id,
      password: '', // 儿童账户无密码
    },
  });

  // 创建用户设置
  await prisma.userSettings.createMany({
    data: [
      {
        userId: adminUser.id,
        theme: 'dark',
        soundEnabled: true,
        notifications: true,
        language: 'zh-CN',
        dailyReminderTime: '20:00',
      },
      {
        userId: childUser.id,
        theme: 'dark',
        soundEnabled: true,
        notifications: true,
        language: 'zh-CN',
        dailyReminderTime: '19:00',
      },
    ],
  });

  // 创建初始等级记录
  await prisma.levelRecord.createMany({
    data: [
      {
        userId: childUser.id,
        level: 1,
        title: '见习宇航员',
        exp: 0,
        totalExp: 0,
        shipName: '探索者号',
      },
      {
        userId: adminUser.id,
        level: 1,
        title: '指挥官',
        exp: 0,
        totalExp: 0,
        shipName: '领航舰',
      },
    ],
  });

  // 创建示例任务
  const sampleTasks = [
    {
      title: '完成数学作业',
      description: '认真完成今天的数学作业',
      type: 'DAILY',
      starCoins: 10,
      expReward: 5,
      frequency: 'WEEKDAYS',
      weekdays: '[1,2,3,4,5]', // 周一到周五
      timeLimit: '19:00',
      category: '学习',
      difficulty: 'MEDIUM',
      createdBy: adminUser.id,
    },
    {
      title: '阅读30分钟',
      description: '阅读自己喜欢的书籍',
      type: 'DAILY',
      starCoins: 15,
      expReward: 8,
      frequency: 'DAILY',
      category: '学习',
      difficulty: 'EASY',
      createdBy: adminUser.id,
    },
    {
      title: '练习钢琴',
      description: '练习钢琴曲目30分钟',
      type: 'DAILY',
      starCoins: 20,
      expReward: 10,
      frequency: 'DAILY',
      category: '艺术',
      difficulty: 'MEDIUM',
      createdBy: adminUser.id,
    },
    {
      title: '整理房间',
      description: '保持自己的房间整洁干净',
      type: 'WEEKLY',
      starCoins: 50,
      expReward: 25,
      frequency: 'WEEKLY',
      category: '家务',
      difficulty: 'MEDIUM',
      createdBy: adminUser.id,
    },
    {
      title: '户外运动1小时',
      description: '进行户外体育活动',
      type: 'DAILY',
      starCoins: 25,
      expReward: 12,
      frequency: 'WEEKENDS',
      weekdays: '[6,0]', // 周六和周日
      category: '运动',
      difficulty: 'HARD',
      createdBy: adminUser.id,
    },
  ];

  await prisma.task.createMany({
    data: sampleTasks,
  });

  // 创建奖励商品
  const sampleRewards = [
    {
      name: '动画片时间',
      description: '30分钟额外动画片时间',
      cost: 50,
      category: '娱乐',
      stock: -1, // 无限库存
      createdBy: adminUser.id,
    },
    {
      name: '冰淇淋',
      description: '美味冰淇淋一个',
      cost: 30,
      category: '美食',
      stock: 10,
      createdBy: adminUser.id,
    },
    {
      name: '新玩具',
      description: '心仪的小玩具',
      cost: 200,
      category: '实物',
      stock: 5,
      createdBy: adminUser.id,
    },
    {
      name: '晚睡30分钟',
      description: '周末可以晚睡30分钟',
      cost: 80,
      category: '特权',
      stock: -1,
      createdBy: adminUser.id,
    },
  ];

  await prisma.reward.createMany({
    data: sampleRewards,
  });

  // 创建惩罚规则
  const samplePunishments = [
    {
      name: '未完成作业',
      description: '没有按时完成作业',
      type: 'DEDUCT_COINS',
      severity: 'MEDIUM',
      value: 20,
      createdBy: adminUser.id,
    },
    {
      name: '挑食',
      description: '吃饭时挑食严重',
      type: 'DEDUCT_COINS',
      severity: 'MINOR',
      value: 10,
      createdBy: adminUser.id,
    },
    {
      name: '说谎',
      description: '不诚实，说谎话',
      type: 'DEDUCT_COINS',
      severity: 'SEVERE',
      value: 50,
      createdBy: adminUser.id,
    },
    {
      name: '房间脏乱',
      description: '房间长时间不整理',
      type: 'EXTRA_TASK',
      severity: 'MEDIUM',
      value: 1, // 增加1个额外任务
      createdBy: adminUser.id,
    },
  ];

  await prisma.punishmentRule.createMany({
    data: samplePunishments,
  });

  // 创建初始星币交易记录
  await prisma.pointTransaction.create({
    data: {
      userId: childUser.id,
      type: 'BONUS',
      amount: 100,
      balance: 100,
      description: '欢迎加入星舰计划！初始星币奖励',
    },
  });

  console.log('数据库初始化完成！');
  console.log(`管理员账户: ${adminUser.username}, 密码: admin123`);
  console.log(`儿童账户: ${childUser.username}`);
}

main()
  .catch((e) => {
    console.error('数据库初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });