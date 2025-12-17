import { authManager } from './auth';

/**
 * 初始化应用 - 自动登录为家长以便测试
 */
export async function initializeApp(): Promise<void> {
  // 如果还没有登录，自动登录为家长
  if (!authManager.isAuthenticated()) {
    await authManager.autoLoginAsParent();
    console.log('已自动登录为家长用户');
  }
}

/**
 * 在组件加载时确保用户已登录
 */
export function ensureAuthenticated(): void {
  if (!authManager.isAuthenticated()) {
    // 可以在这里显示登录提示或重定向到登录页
    console.warn('用户未登录，某些功能可能无法使用');
  }
}
