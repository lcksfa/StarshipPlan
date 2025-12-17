// 简单的模拟身份验证系统
interface MockUser {
  id: string;
  username: string;
  displayName: string;
  role: 'PARENT' | 'CHILD';
  parentId?: string;
}

// 模拟用户数据
const MOCK_USERS: MockUser[] = [
  {
    id: 'parent-1',
    username: 'parent',
    displayName: '家长',
    role: 'PARENT'
  },
  {
    id: 'child-1',
    username: 'child',
    displayName: '葫芦',
    role: 'CHILD',
    parentId: 'parent-1'
  }
];

class AuthManager {
  private currentUser: MockUser | null = null;
  private token: string | null = null;

  constructor() {
    // 尝试从本地存储恢复用户信息
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('mockUser');
      const savedToken = localStorage.getItem('mockToken');

      if (savedUser && savedToken) {
        this.currentUser = JSON.parse(savedUser);
        this.token = savedToken;
      }
    }
  }

  // 模拟登录
  async login(username: string, password: string): Promise<boolean> {
    // 简单的模拟逻辑
    const user = MOCK_USERS.find(u => u.username === username);

    if (user) {
      this.currentUser = user;
      this.token = `mock-token-${user.id}-${Date.now()}`;

      // 保存到本地存储
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockUser', JSON.stringify(user));
        localStorage.setItem('mockToken', this.token);
      }

      return true;
    }

    return false;
  }

  // 登出
  logout(): void {
    this.currentUser = null;
    this.token = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockUser');
      localStorage.removeItem('mockToken');
    }
  }

  // 获取当前用户
  getCurrentUser(): MockUser | null {
    return this.currentUser;
  }

  // 获取当前用户ID
  getUserId(): string | null {
    return this.currentUser?.id || null;
  }

  // 获取token
  getToken(): string | null {
    return this.token;
  }

  // 检查是否已登录
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.token !== null;
  }

  // 检查是否为家长
  isParent(): boolean {
    return this.currentUser?.role === 'PARENT';
  }

  // 检查是否为儿童
  isChild(): boolean {
    return this.currentUser?.role === 'CHILD';
  }

  // 自动登录为家长（用于快速测试）
  async autoLoginAsParent(): Promise<void> {
    this.currentUser = {
      id: 'parent-1',
      username: 'parent',
      displayName: '家长',
      role: 'PARENT'
    };
    this.token = 'mock-parent-token';

    if (typeof window !== 'undefined') {
      localStorage.setItem('mockUser', JSON.stringify(this.currentUser));
      localStorage.setItem('mockToken', this.token);
    }
  }

  // 自动登录为儿童（用于快速测试）
  async autoLoginAsChild(): Promise<void> {
    this.currentUser = {
      id: 'child-1',
      username: 'child',
      displayName: '葫芦',
      role: 'CHILD',
      parentId: 'parent-1'
    };
    this.token = 'mock-child-token';

    if (typeof window !== 'undefined') {
      localStorage.setItem('mockUser', JSON.stringify(this.currentUser));
      localStorage.setItem('mockToken', this.token);
    }
  }

  // 获取默认请求头
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }
}

// 创建单例实例
export const authManager = new AuthManager();

// 导出类型
export type { MockUser };
