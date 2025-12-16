import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 className 的工具函数
 * 使用 clsx 和 tailwind-merge 提供强大的 class 合并能力
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
