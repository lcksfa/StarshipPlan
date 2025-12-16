import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  children: React.ReactNode
}

const variantStyles = {
  primary:
    'bg-space-primary hover:bg-space-primary-hover text-white space-glow',
  secondary:
    'bg-space-surface hover:bg-space-surface-hover text-space-text border border-space-border',
  danger: 'bg-space-error hover:bg-red-600 text-white',
  success: 'bg-space-success hover:bg-green-600 text-white',
}

const sizeStyles = {
  small: 'px-3 py-1.5 text-sm',
  medium: 'px-6 py-2.5 text-base',
  large: 'px-8 py-3 text-lg',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <motion.button
      className={cn(
        'space-button font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-space-primary focus:ring-offset-2',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      disabled={disabled || loading}
      {...props}>
      {loading && (
        <motion.div
          className='mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full'
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {children}
    </motion.button>
  )
}
