import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../Button/Button'
import { Input } from '../../Input/Input'
import { Card } from '../../Card/Card'
import { LoginCredentials, mockAuthAPI, User } from '../../data/mock/authData'

const loginSchema = yup.object({
  email: yup
    .string()
    .email('📧 请输入有效的邮箱地址')
    .required('📧 邮箱地址不能为空'),
  password: yup
    .string()
    .min(6, '🔐 密码至少需要6个字符')
    .required('🔐 密码不能为空'),
  rememberMe: yup.boolean(),
})

interface LoginFormProps {
  onLogin: (user: User) => void
  onSwitchToRegister: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSwitchToRegister }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginCredentials>({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
  })

  const watchedEmail = watch('email')
  const watchedPassword = watch('password')

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await mockAuthAPI.login(data)

      if (response.success && response.user) {
        // 登录成功，显示成功动画
        await new Promise(resolve => setTimeout(resolve, 1000))
        onLogin(response.user)
      } else {
        setError(response.message)
      }
    } catch {
      setError('🚀 系统正在维护中，请稍后再试')
    } finally {
      setIsLoading(false)
    }
  }

  // 太空舱效果动画
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      className='w-full max-w-md mx-auto'
      variants={containerVariants}
      initial='hidden'
      animate='visible'>
      <Card
        variant='spaceship'
        size='lg'
        hover={false}
        className='relative overflow-hidden'>
        {/* 背景星空效果 */}
        <div className='absolute inset-0 opacity-20'>
          <div className='absolute inset-0 bg-gradient-to-br from-space-primary/20 via-transparent to-accent/20' />
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className='absolute w-1 h-1 bg-white rounded-full animate-pulse'
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className='relative z-10 p-8'>
          {/* 标题 */}
          <motion.div variants={itemVariants} className='text-center mb-8'>
            <div className='text-6xl mb-4 animate-bounce'>🚀</div>
            <h1 className='text-3xl font-bold text-space-primary mb-2'>
              太空站登录
            </h1>
            <p className='text-space-text-secondary'>
              欢迎回到星际基地，宇航员！
            </p>
          </motion.div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <motion.div variants={itemVariants}>
              <Input
                {...register('email')}
                type='email'
                variant='hologram'
                size='lg'
                label='📧 星际邮箱'
                placeholder='输入您的邮箱地址'
                leftIcon={<span>📡</span>}
                error={errors.email?.message}
                disabled={isLoading}
                value={watchedEmail}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Input
                {...register('password')}
                type='password'
                variant='hologram'
                size='lg'
                label='🔐 安全密码'
                placeholder='输入您的密码'
                leftIcon={<span>🛡️</span>}
                error={errors.password?.message}
                disabled={isLoading}
                value={watchedPassword}
              />
            </motion.div>

            <motion.div variants={itemVariants} className='flex items-center'>
              <input
                {...register('rememberMe')}
                type='checkbox'
                id='rememberMe'
                className='w-4 h-4 text-space-primary bg-space-surface border-space-border rounded focus:ring-space-primary focus:ring-2'
                disabled={isLoading}
              />
              <label htmlFor='rememberMe' className='ml-2 text-sm text-space-text-secondary'>
                💫 记住我的太空身份
              </label>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className='p-4 bg-error/20 border border-error/50 rounded-lg'>
                  <p className='text-error text-sm text-center'>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants}>
              <Button
                type='submit'
                variant='primary'
                size='lg'
                loading={isLoading}
                disabled={!isValid || isLoading}
                className='w-full text-lg font-bold py-4'>
                {isLoading ? '🚀 正在连接太空站...' : '🚀 进入太空站'}
              </Button>
            </motion.div>
          </form>

          {/* 分隔线 */}
          <motion.div variants={itemVariants} className='relative my-8'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-space-border'></div>
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-4 bg-space-surface text-space-text-secondary'>
                🌌 或者
              </span>
            </div>
          </motion.div>

          {/* 切换到注册 */}
          <motion.div variants={itemVariants} className='text-center'>
            <p className='text-space-text-secondary mb-4'>
              还没有太空身份？
            </p>
            <Button
              variant='secondary'
              size='lg'
              onClick={onSwitchToRegister}
              disabled={isLoading}
              className='w-full'>
              ✨ 注册成为新宇航员
            </Button>
          </motion.div>

          {/* 快速登录提示 */}
          <motion.div variants={itemVariants} className='mt-6 p-4 bg-space-surface/50 rounded-lg border border-space-border'>
            <p className='text-xs text-space-text-secondary text-center'>
              💡 <strong>快速测试：</strong> 使用 kid@space.com / space123 快速登录
            </p>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  )
}