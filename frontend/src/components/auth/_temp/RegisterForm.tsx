import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../Button/Button'
import { Input } from '../../Input/Input'
import { Card } from '../../Card/Card'
import { RegisterData, mockAuthAPI, avatarOptions } from '../../data/mock/authData'

const registerSchema = yup.object({
  username: yup
    .string()
    .min(3, '🎯 用户名至少需要3个字符')
    .max(20, '🎯 用户名不能超过20个字符')
    .matches(/^[a-zA-Z0-9_]+$/, '🎯 用户名只能包含字母、数字和下划线')
    .required('🎯 用户名不能为空'),
  email: yup
    .string()
    .email('📧 请输入有效的邮箱地址')
    .required('📧 邮箱地址不能为空'),
  password: yup
    .string()
    .min(6, '🔐 密码至少需要6个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/, '🔐 密码需要包含字母和数字')
    .required('🔐 密码不能为空'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], '🔐 两次输入的密码不一致')
    .required('🔐 请确认密码'),
  role: yup
    .string()
    .oneOf(['child', 'parent'], '👥 请选择用户类型')
    .required('👥 请选择用户类型'),
  childProfile: yup.object().when('role', {
    is: 'child',
    then: yup.object({
      displayName: yup
        .string()
        .min(2, '👶 显示名称至少需要2个字符')
        .max(10, '👶 显示名称不能超过10个字符')
        .required('👶 显示名称不能为空'),
      age: yup
        .number()
        .min(6, '👶 年龄需要在6-12岁之间')
        .max(12, '👶 年龄需要在6-12岁之间')
        .required('👶 年龄不能为空'),
      grade: yup
        .string()
        .required('📚 年级不能为空'),
      favoriteColor: yup
        .string()
        .required('🎨 喜欢的颜色不能为空'),
    }),
    otherwise: yup.object().optional(),
  }),
})

interface RegisterFormProps {
  onRegister: (user: any) => void
  onSwitchToLogin: () => void
}

const gradeOptions = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
const colorOptions = [
  { name: '火焰红', value: '#FF5722' },
  { name: '活力橙', value: '#FF9800' },
  { name: '阳光黄', value: '#FFC107' },
  { name: '自然绿', value: '#4CAF50' },
  { name: '天空蓝', value: '#2196F3' },
  { name: '梦幻紫', value: '#9C27B0' },
]

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onSwitchToLogin }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>('👨‍🚀')
  const [step, setStep] = useState<1 | 2>(1)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    watch,
    trigger,
  } = useForm<RegisterData>({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
  })

  const watchedRole = watch('role')

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await mockAuthAPI.register(data)

      if (response.success && response.user) {
        // 注册成功，显示成功动画
        await new Promise(resolve => setTimeout(resolve, 2000))
        onRegister(response.user)
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError('🚀 系统正在维护中，请稍后再试')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = async () => {
    if (step === 1) {
      // 验证第一步的字段
      const isStep1Valid = await trigger(['username', 'email', 'password', 'confirmPassword', 'role'])
      if (isStep1Valid) {
        setStep(2)
      }
    }
  }

  const prevStep = () => {
    setStep(1)
  }

  // 动画配置
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  }

  const stepVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
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
          <div className='absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-space-primary/20' />
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className='absolute w-1 h-1 bg-white rounded-full animate-pulse'
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className='relative z-10 p-8'>
          {/* 标题 */}
          <motion.div className='text-center mb-8'>
            <div className='text-6xl mb-4 animate-bounce'>✨</div>
            <h1 className='text-3xl font-bold text-accent mb-2'>
              注册太空身份
            </h1>
            <p className='text-space-text-secondary'>
              创建您的专属宇航员档案
            </p>
          </motion.div>

          {/* 进度指示器 */}
          <div className='flex justify-center mb-8'>
            <div className='flex items-center space-x-4'>
              <div className={`flex items-center ${step >= 1 ? 'text-accent' : 'text-space-text-muted'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-accent text-white' : 'bg-space-surface border border-space-border'}`}>
                  1
                </div>
                <span className='ml-2 text-sm'>基础信息</span>
              </div>
              <div className='w-8 h-0.5 bg-space-border'></div>
              <div className={`flex items-center ${step >= 2 ? 'text-accent' : 'text-space-text-muted'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-accent text-white' : 'bg-space-surface border border-space-border'}`}>
                  2
                </div>
                <span className='ml-2 text-sm'>个人档案</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <AnimatePresence mode='wait'>
              {step === 1 ? (
                // 第一步：基础信息
                <motion.div
                  key='step1'
                  variants={stepVariants}
                  initial='enter'
                  animate='center'
                  exit='exit'
                  transition={{ duration: 0.3 }}
                  className='space-y-6'>
                  <div>
                    <Input
                      {...register('username')}
                      variant='hologram'
                      size='lg'
                      label='🎯 太空用户名'
                      placeholder='选择一个独特的用户名'
                      leftIcon={<span>🚀</span>}
                      error={errors.username?.message}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Input
                      {...register('email')}
                      type='email'
                      variant='hologram'
                      size='lg'
                      label='📧 联系邮箱'
                      placeholder='家长或监护人的邮箱'
                      leftIcon={<span>📡</span>}
                      error={errors.email?.message}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Input
                      {...register('password')}
                      type='password'
                      variant='hologram'
                      size='lg'
                      label='🔐 登录密码'
                      placeholder='创建安全的密码'
                      leftIcon={<span>🛡️</span>}
                      error={errors.password?.message}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Input
                      {...register('confirmPassword')}
                      type='password'
                      variant='hologram'
                      size='lg'
                      label='🔐 确认密码'
                      placeholder='再次输入密码'
                      leftIcon={<span>✅</span>}
                      error={errors.confirmPassword?.message}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-space-text mb-3'>
                      👥 我是谁？
                    </label>
                    <div className='grid grid-cols-2 gap-4'>
                      <Button
                        type='button'
                        variant={watchedRole === 'child' ? 'primary' : 'secondary'}
                        size='md'
                        onClick={() => {
                          // 使用Controller来更新controlled值
                          const event = { target: { value: 'child' } }
                          register('role').onChange(event)
                        }}
                        className='flex flex-col items-center py-4'>
                        <span className='text-3xl mb-2'>👨‍🚀</span>
                        <span className='font-medium'>我是小宇航员</span>
                        <span className='text-xs text-space-text-secondary mt-1'>6-12岁</span>
                      </Button>
                      <Button
                        type='button'
                        variant={watchedRole === 'parent' ? 'primary' : 'secondary'}
                        size='md'
                        onClick={() => {
                          const event = { target: { value: 'parent' } }
                          register('role').onChange(event)
                        }}
                        className='flex flex-col items-center py-4'>
                        <span className='text-3xl mb-2'>👩‍🚀</span>
                        <span className='font-medium'>我是指挥官</span>
                        <span className='text-xs text-space-text-secondary mt-1'>家长/监护人</span>
                      </Button>
                    </div>
                    {errors.role && (
                      <p className='text-error text-sm mt-2'>{errors.role.message}</p>
                    )}
                  </div>

                  <Button
                    type='button'
                    variant='primary'
                    size='lg'
                    onClick={nextStep}
                    disabled={!watchedRole || isLoading}
                    className='w-full'>
                    下一步：完善档案 →
                  </Button>
                </motion.div>
              ) : (
                // 第二步：个人档案
                <motion.div
                  key='step2'
                  variants={stepVariants}
                  initial='enter'
                  animate='center'
                  exit='exit'
                  transition={{ duration: 0.3 }}
                  className='space-y-6'>
                  {watchedRole === 'child' ? (
                    <>
                      {/* 头像选择 */}
                      <div>
                        <label className='block text-sm font-medium text-space-text mb-3'>
                          👤 选择我的头像
                        </label>
                        <div className='grid grid-cols-6 gap-2 mb-4'>
                          {avatarOptions.slice(0, 18).map((avatar) => (
                            <Button
                              key={avatar}
                              type='button'
                              variant={selectedAvatar === avatar ? 'primary' : 'secondary'}
                              size='sm'
                              onClick={() => setSelectedAvatar(avatar)}
                              className='text-2xl p-2'>
                              {avatar}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Input
                          {...register('childProfile.displayName')}
                          variant='hologram'
                          size='lg'
                          label='👶 我的昵称'
                          placeholder='在太空站显示的名称'
                          leftIcon={<span>{selectedAvatar}</span>}
                          error={errors.childProfile?.displayName?.message}
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <Input
                          {...register('childProfile.age', { valueAsNumber: true })}
                          type='number'
                          variant='hologram'
                          size='lg'
                          label='🎂 我的年龄'
                          placeholder='输入您的年龄'
                          leftIcon={<span>🎈</span>}
                          error={errors.childProfile?.age?.message}
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-space-text mb-3'>
                          📚 我的年级
                        </label>
                        <div className='grid grid-cols-3 gap-2'>
                          {gradeOptions.map((grade) => (
                            <Button
                              key={grade}
                              type='button'
                              variant='secondary'
                              size='sm'
                              onClick={() => {
                                const event = { target: { value: grade } }
                                register('childProfile.grade').onChange(event)
                              }}
                              className='text-xs py-2'>
                              {grade}
                            </Button>
                          ))}
                        </div>
                        {errors.childProfile?.grade && (
                          <p className='text-error text-sm mt-2'>{errors.childProfile.grade.message}</p>
                        )}
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-space-text mb-3'>
                          🎨 喜欢的颜色
                        </label>
                        <div className='grid grid-cols-3 gap-2'>
                          {colorOptions.map((color) => (
                            <Button
                              key={color.value}
                              type='button'
                              variant='secondary'
                              size='sm'
                              onClick={() => {
                                const event = { target: { value: color.value } }
                                register('childProfile.favoriteColor').onChange(event)
                              }}
                              className='flex items-center justify-center py-2'
                              style={{ borderColor: color.value }}>
                              <div
                                className='w-4 h-4 rounded-full mr-2'
                                style={{ backgroundColor: color.value }}
                              />
                              <span className='text-xs'>{color.name}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    // 家长注册的简化界面
                    <div className='text-center py-8'>
                      <div className='text-6xl mb-4'>👩‍🚀</div>
                      <h3 className='text-xl font-bold text-space-primary mb-2'>
                        指挥官账户
                      </h3>
                      <p className='text-space-text-secondary mb-6'>
                        作为指挥官，您将能够：
                      </p>
                      <div className='text-left space-y-3 max-w-sm mx-auto mb-6">
                        <div className='flex items-center p-3 bg-space-surface/50 rounded-lg'>
                          <span className='text-2xl mr-3'>📊</span>
                          <span className='text-sm text-space-text'>查看孩子的习惯养成报告</span>
                        </div>
                        <div className='flex items-center p-3 bg-space-surface/50 rounded-lg'>
                          <span className='text-2xl mr-3'>🎯</span>
                          <span className='text-sm text-space-text'>设置任务和奖励规则</span>
                        </div>
                        <div className='flex items-center p-3 bg-space-surface/50 rounded-lg'>
                          <span className='text-2xl mr-3'>🏆</span>
                          <span className='text-sm text-space-text'>管理奖励和兑换系统</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className='flex space-x-4'>
                    <Button
                      type='button'
                      variant='secondary'
                      size='lg'
                      onClick={prevStep}
                      disabled={isLoading}
                      className='flex-1'>
                      ← 上一步
                    </Button>
                    <Button
                      type='submit'
                      variant='primary'
                      size='lg'
                      loading={isLoading}
                      disabled={!isValid || isLoading}
                      className='flex-1'>
                      {isLoading ? '🚀 正在注册...' : '🚀 完成注册'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* 错误提示 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className='mt-6 p-4 bg-error/20 border border-error/50 rounded-lg'>
                <p className='text-error text-sm text-center'>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 切换到登录 */}
          <div className='text-center mt-8 pt-6 border-t border-space-border'>
            <p className='text-space-text-secondary mb-4'>
              已有太空身份？
            </p>
            <Button
              variant='secondary'
              size='md'
              onClick={onSwitchToLogin}
              disabled={isLoading}
              className='w-full'>
              🔙 返回登录
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}