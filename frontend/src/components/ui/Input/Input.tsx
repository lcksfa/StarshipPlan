import React, { useState, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'spaceship' | 'hologram' | 'control'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
}

const variantStyles = {
  default:
    'bg-space-surface border border-space-border focus:border-space-primary',
  spaceship:
    'bg-space-surface/50 border-2 border-space-primary/30 focus:border-space-primary focus:shadow-[0_0_15px_rgba(0,212,255,0.3)]',
  hologram:
    'bg-transparent border-2 border-space-primary/50 focus:border-space-primary focus:shadow-[0_0_20px_rgba(0,212,255,0.4)] text-space-primary',
  control:
    'bg-space-card border border-space-primary focus:border-accent focus:shadow-[0_0_10px_rgba(255,107,53,0.3)]',
}

const sizeStyles = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      loading,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false)

    return (
      <div className='space-y-2'>
        {label && (
          <motion.label
            className={cn(
              'block text-sm font-medium',
              error
                ? 'text-error'
                : focused
                  ? 'text-space-primary'
                  : 'text-space-text'
            )}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}>
            {label}
          </motion.label>
        )}

        <div className='relative'>
          {/* 左侧图标 */}
          {leftIcon && (
            <div className='absolute left-3 top-1/2 -translate-y-1/2 text-space-text-secondary'>
              {leftIcon}
            </div>
          )}

          {/* 输入框 */}
          <motion.input
            ref={ref}
            className={cn(
              'w-full rounded-lg outline-none transition-all duration-300',
              'placeholder:text-space-text-muted',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              variantStyles[variant],
              sizeStyles[size],
              leftIcon && 'pl-10',
              (rightIcon || loading) && 'pr-10',
              error &&
                'border-error focus:border-error focus:shadow-[0_0_15px_rgba(244,67,54,0.3)]',
              className
            )}
            disabled={disabled}
            onFocus={(e) => {
              setFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              props.onBlur?.(e)
            }}
            whileFocus={
              variant === 'spaceship' || variant === 'hologram'
                ? { scale: 1.02 }
                : undefined
            }
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            {...props}
          />

          {/* 全息效果 */}
          {variant === 'hologram' && focused && (
            <motion.div
              className='absolute inset-0 rounded-lg pointer-events-none border border-space-primary opacity-30'
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1.05, opacity: [0, 0.5, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* 右侧图标 */}
          {rightIcon && !loading && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 text-space-text-secondary'>
              {rightIcon}
            </div>
          )}

          {/* 加载状态 */}
          {loading && (
            <motion.div
              className='absolute right-3 top-1/2 -translate-y-1/2'
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <div className='w-4 h-4 border-2 border-space-primary border-t-transparent rounded-full' />
            </motion.div>
          )}

          {/* 星舰能量条效果 */}
          {variant === 'spaceship' && focused && (
            <motion.div
              className='absolute bottom-0 left-0 h-0.5 bg-space-primary'
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          )}
        </div>

        {/* 错误信息 */}
        {error && (
          <motion.p
            className='text-sm text-error'
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}>
            {error}
          </motion.p>
        )}

        {/* 帮助文本 */}
        {helperText && !error && (
          <motion.p
            className='text-sm text-space-text-secondary'
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}>
            {helperText}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
