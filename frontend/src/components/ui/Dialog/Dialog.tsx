import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../utils/cn'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  variant?: 'default' | 'spaceship' | 'alert' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
}

const variantStyles = {
  default: 'bg-space-surface border border-space-border',
  spaceship:
    'bg-gradient-to-br from-space-surface to-space-card border-2 border-space-primary shadow-[0_0_30px_rgba(0,212,255,0.3)]',
  alert:
    'bg-gradient-to-br from-space-surface to-space-card border-2 border-error shadow-[0_0_20px_rgba(244,67,54,0.3)]',
  success:
    'bg-gradient-to-br from-space-surface to-space-card border-2 border-success shadow-[0_0_20px_rgba(76,175,80,0.3)]',
  warning:
    'bg-gradient-to-br from-space-surface to-space-card border-2 border-warning shadow-[0_0_20px_rgba(255,152,0,0.3)]',
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  description,
  variant = 'default',
  size = 'md',
  showCloseButton = true,
  children,
  footer,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          {/* 背景遮罩 */}
          <motion.div
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 对话框主体 */}
          <motion.div
            className={cn(
              'relative w-full rounded-lg shadow-2xl p-6',
              variantStyles[variant],
              sizeStyles[size]
            )}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
            }}>
            {/* 激光边框动画效果 */}
            {variant === 'spaceship' && (
              <div className='absolute inset-0 rounded-lg pointer-events-none'>
                <div className='absolute inset-0 rounded-lg border border-space-primary/20 animate-pulse' />
                <div className='absolute inset-0 rounded-lg border border-space-primary/40 animate-ping' />
              </div>
            )}

            {/* 关闭按钮 */}
            {showCloseButton && (
              <motion.button
                className='absolute right-4 top-4 rounded-full p-1 hover:bg-space-surface-hover transition-colors'
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}>
                <svg
                  className='w-5 h-5 text-space-text-secondary'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </motion.button>
            )}

            {/* 标题区域 */}
            {(title || description) && (
              <div className='mb-4'>
                {title && (
                  <motion.h3
                    className={cn(
                      'text-xl font-bold mb-2',
                      variant === 'spaceship' && 'text-space-primary',
                      variant === 'alert' && 'text-error',
                      variant === 'success' && 'text-success',
                      variant === 'warning' && 'text-warning',
                      variant === 'default' && 'text-space-text'
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}>
                    {title}
                  </motion.h3>
                )}
                {description && (
                  <motion.p
                    className='text-space-text-secondary'
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}>
                    {description}
                  </motion.p>
                )}
              </div>
            )}

            {/* 内容区域 */}
            <motion.div
              className='mb-4'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}>
              {children}
            </motion.div>

            {/* 底部区域 */}
            {footer && (
              <motion.div
                className='flex justify-end space-x-3'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}>
                {footer}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
