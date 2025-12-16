import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../../utils/cn'

export interface ProgressBarProps {
  value: number
  max?: number
  variant?: 'default' | 'energy' | 'shield' | 'experience' | 'health'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  showPercentage?: boolean
  animated?: boolean
  color?: string
}

const variantStyles = {
  default: {
    container: 'bg-space-surface border border-space-border',
    bar: 'bg-space-primary',
    glow: 'shadow-[0_0_10px_rgba(0,212,255,0.5)]',
  },
  energy: {
    container: 'bg-space-surface border border-warning',
    bar: 'bg-gradient-to-r from-warning to-accent',
    glow: 'shadow-[0_0_15px_rgba(255,152,0,0.6)]',
  },
  shield: {
    container: 'bg-space-surface border border-primary',
    bar: 'bg-gradient-to-r from-primary to-space-primary',
    glow: 'shadow-[0_0_15px_rgba(0,212,255,0.6)]',
  },
  experience: {
    container: 'bg-space-surface border border-success',
    bar: 'bg-gradient-to-r from-success to-space-success',
    glow: 'shadow-[0_0_15px_rgba(76,175,80,0.6)]',
  },
  health: {
    container: 'bg-space-surface border border-error',
    bar: 'bg-gradient-to-r from-error to-red-600',
    glow: 'shadow-[0_0_15px_rgba(244,67,54,0.6)]',
  },
}

const sizeStyles = {
  sm: {
    container: 'h-2',
    bar: 'h-2',
    text: 'text-xs',
  },
  md: {
    container: 'h-3',
    bar: 'h-3',
    text: 'text-sm',
  },
  lg: {
    container: 'h-4',
    bar: 'h-4',
    text: 'text-base',
  },
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  showPercentage = true,
  animated = true,
  color,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const styles = variantStyles[variant]
  const sizeStyle = sizeStyles[size]

  return (
    <div className='space-y-2'>
      {/* 标签和百分比 */}
      {(showLabel || showPercentage) && (
        <div className='flex justify-between items-center'>
          {label && (
            <span className={cn('font-medium text-space-text', sizeStyle.text)}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span className={cn('text-space-text-secondary', sizeStyle.text)}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* 进度条容器 */}
      <div
        className={cn(
          'relative w-full rounded-full overflow-hidden',
          styles.container,
          sizeStyle.container
        )}>
        {/* 背景光效 */}
        {variant !== 'default' && (
          <div
            className={cn(
              'absolute inset-0 opacity-30 animate-pulse',
              styles.glow
            )}
          />
        )}

        {/* 进度条 */}
        <motion.div
          className={cn(
            'h-full rounded-full relative overflow-hidden',
            color || styles.bar,
            sizeStyle.bar,
            variant !== 'default' && styles.glow
          )}
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 0.8 : 0,
            ease: 'easeOut',
          }}>
          {/* 光效扫描 */}
          {variant !== 'default' && (
            <motion.div
              className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent'
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}

          {/* 能量粒子效果 */}
          {variant === 'energy' && (
            <div className='absolute inset-0'>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className='absolute w-1 h-1 bg-white rounded-full'
                  initial={{
                    x: `${(i + 1) * 25}%`,
                    y: '50%',
                  }}
                  animate={{
                    x: `${(i + 1) * 25 + 50}%`,
                    y: ['50%', '20%', '50%'],
                  }}
                  transition={{
                    duration: 2 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          )}

          {/* 护盾闪烁效果 */}
          {variant === 'shield' && percentage > 70 && (
            <motion.div
              className='absolute inset-0 bg-white/30'
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.div>

        {/* 里程碑标记 */}
        {variant === 'experience' && (
          <div className='absolute inset-0 flex justify-between items-center px-1'>
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                className='w-0.5 h-2 bg-space-border/50'
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 数值显示 */}
      {showLabel && (
        <div className='text-center'>
          <span className={cn('text-space-text-secondary', sizeStyle.text)}>
            {value} / {max}
          </span>
        </div>
      )}
    </div>
  )
}
