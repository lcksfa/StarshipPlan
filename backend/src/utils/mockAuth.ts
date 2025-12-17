import { AuthRequest } from '../types';

// 模拟用户数据
const MOCK_USERS = [
  {
    id: 'parent-1',
    username: 'parent',
    displayName: '家长',
    avatar: null as string | null,
    role: 'PARENT' as const,
    parentId: null as string | null,
    password: 'password',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'child-1',
    username: 'child',
    displayName: '葫芦',
    avatar: null as string | null,
    role: 'CHILD' as const,
    parentId: 'parent-1' as string | null,
    password: 'password',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

/**
 * 模拟身份验证函数 - 用于开发测试
 */
export function mockAuthenticate(req: AuthRequest): boolean {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('模拟身份验证: 无效的授权头');
    return false;
  }

  const token = authHeader.substring(7);

  // 检查是否为模拟令牌
  if (!token.startsWith('mock-token-')) {
    console.log('模拟身份验证: 不是模拟令牌');
    return false;
  }

  // 从令牌中提取用户ID
  const tokenParts = token.split('-');
  console.log('令牌组成部分:', tokenParts);

  if (tokenParts.length < 3) {
    console.log('模拟身份验证: 令牌格式错误');
    return false;
  }

  const userId = tokenParts[2];
  console.log('提取的用户ID:', userId);

  if (!userId) {
    console.log('模拟身份验证: 无法提取用户ID');
    return false;
  }

  // 查找用户
  const user = MOCK_USERS.find(u => u.id === userId);
  console.log('查找到的用户:', user ? '成功' : '失败');

  if (!user) {
    console.log('模拟身份验证: 用户不存在');
    return false;
  }

  // 设置用户信息到请求对象
  req.user = user;
  console.log('模拟身份验证: 成功设置用户');
  return true;
}

/**
 * 获取模拟用户
 */
export function getMockUser(userId: string) {
  return MOCK_USERS.find(u => u.id === userId);
}

/**
 * 获取所有模拟用户
 */
export function getAllMockUsers() {
  return MOCK_USERS;
}
