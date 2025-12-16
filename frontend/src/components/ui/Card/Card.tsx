import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../../utils/cn'

export interface CardProps {
  variant?: 'default' | 'spaceship' | 'planet' | 'cargo' | 'control-panel'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  glow?: boolean
  className?: string
  children: React.ReactNode
}

const variantStyles = {
  default: 'bg-space-surface border border-space-border',
  spaceship:
    'bg-gradient-to-br from-space-surface to-space-card border-2 border-space-primary rounded-xl space-glow',
  planet:
    'bg-gradient-to-br from-space-surface via-space-card to-space-surface border border-accent rounded-full',
  cargo: 'bg-space-surface border-2 border-warning rounded-lg shadow-lg',
  'control-panel':
    'bg-space-card border border-space-primary shadow-[0_0_20px_rgba(0,212,255,0.2)]',
}

const sizeStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'md',
  hover = true,
  glow = false,
  className,
  children,
}) => {
  return (
    <motion.div
      className={cn(
        'space-card rounded-lg transition-all duration-300',
        variantStyles[variant],
        sizeStyles[size],
        hover && 'hover:scale-[1.02] hover:shadow-xl',
        glow && 'space-glow',
        className
      )}
      whileHover={hover ? { y: -4 } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
      }}>
      {children}
    </motion.div>
  )
}
