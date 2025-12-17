import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('密码哈希失败');
  }
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('密码验证失败');
  }
}

/**
 * 检查密码强度
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('密码长度至少6位');
  }

  if (password.length > 50) {
    errors.push('密码长度不能超过50位');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }

  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }

  // 可选：检查特殊字符
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('建议包含特殊字符以增强安全性');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 生成随机密码
 */
export function generateRandomPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';

  // 确保至少包含每种字符类型
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // 打乱密码字符顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
}