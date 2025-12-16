/**
 * 太空主题UI组件库统一导出
 * 为9岁男孩子设计的太空冒险主题组件
 */

// 按钮组件
export { Button } from './Button/Button'
export type { ButtonProps } from './Button/Button'

// 卡片组件
export { Card } from './Card/Card'
export type { CardProps } from './Card/Card'

// 对话框组件
export { Dialog } from './Dialog/Dialog'
export type { DialogProps } from './Dialog/Dialog'

// 输入框组件
export { Input } from './Input/Input'
export type { InputProps } from './Input/Input'

// 进度条组件
export { ProgressBar } from './ProgressBar/ProgressBar'
export type { ProgressBarProps } from './ProgressBar/ProgressBar'

// 主题配置
export { spaceTheme, themeClasses } from '../../styles/theme'

// 认证组件
export { LoginForm } from '../auth/LoginForm'
export { RegisterForm } from '../auth/RegisterForm'
export type { User, AuthResponse, LoginCredentials, RegisterData } from '../../data/mock/authData'
