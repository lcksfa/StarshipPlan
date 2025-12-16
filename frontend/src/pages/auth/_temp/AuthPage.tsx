import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LoginForm } from '../../components/auth/LoginForm'
import { RegisterForm } from '../../components/auth/RegisterForm'
import { User } from '../../data/mock/authData'

interface AuthPageProps {
  onAuth: (user: User) => void
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true)

  // 生成固定的星星位置，避免Math.random在渲染中使用
  const starPositions = Array.from({ length: 50 }, (_, i) => ({
    left: ((i * 137.5) % 100),
    top: ((i * 89.7) % 100),
    animationDelay: ((i * 0.2) % 5),
    animationDuration: (3 + ((i * 0.4) % 4)),
    opacity: (0.2 + ((i * 0.012) % 0.8)),
  }))

  const meteorPositions = Array.from({ length: 3 }, (_, i) => ({
    left: ((i * 31.7) % 100),
    top: ((i * 17.3) % 50),
    duration: (5 + ((i * 1.2) % 5)),
    delay: ((i * 1.5) % 5),
  }))

  const handleLogin = (user: User) => {
    // 登录成功动画
    setTimeout(() => {
      onAuth(user)
    }, 2000)
  }

  const handleRegister = (user: User) => {
    // 注册成功动画
    setTimeout(() => {
      onAuth(user)
    }, 2000)
  }

  const toggleForm = () => {
    setIsLogin(!isLogin)
  }

  // 背景动画配置
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1,
        ease: 'easeOut',
      },
    },
  }

  const floatingVariants = {
    floating: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        ease: 'easeInOut',
        repeat: Infinity,
      },
    },
  }

  return (
    <div className='min-h-screen bg-space-bg flex items-center justify-center p-4 relative overflow-hidden'>
      {/* 动态星空背景 */}
      <div className='absolute inset-0'>
        {/* 渐变背景 */}
        <div className='absolute inset-0 bg-gradient-to-br from-space-bg via-space-surface/20 to-space-bg' />

        {/* 星星效果 */}
        {starPositions.map((pos, i) => (
          <div
            key={i}
            className='absolute w-1 h-1 bg-white rounded-full animate-pulse'
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${pos.animationDelay}s`,
              animationDuration: `${pos.animationDuration}s`,
              opacity: pos.opacity,
            }}
          />
        ))}

        {/* 流星效果 */}
        {meteorPositions.map((pos, i) => (
          <div
            key={`meteor-${i}`}
            className='absolute w-1 h-1 bg-white rounded-full'
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animation: `meteor ${pos.duration}s linear ${pos.delay}s infinite`,
            }}
          >
            <div
              className='absolute w-20 h-px bg-gradient-to-r from-white to-transparent'
              style={{
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
        ))}

        {/* 漂浮的行星 */}
        <motion.div
          variants={floatingVariants}
          animate='floating'
          className='absolute top-20 right-20 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full opacity-30 blur-xl'
        />
        <motion.div
          variants={floatingVariants}
          animate='floating'
          className='absolute bottom-20 left-20 w-12 h-12 bg-gradient-to-br from-accent to-success rounded-full opacity-30 blur-xl'
          style={{ animationDelay: '1s' }}
        />
        <motion.div
          variants={floatingVariants}
          animate='floating'
          className='absolute top-1/3 left-1/4 w-8 h-8 bg-gradient-to-br from-success to-primary rounded-full opacity-20 blur-lg'
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* 主内容区域 */}
      <motion.div
        className='relative z-10 w-full max-w-6xl mx-auto'
        variants={containerVariants}
        initial='hidden'
        animate='visible'>
        <div className='flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16'>

          {/* 左侧品牌展示区 */}
          <motion.div
            className='flex-1 text-center lg:text-left mb-8 lg:mb-0'
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}>

            <div className='mb-8'>
              <motion.div
                className='text-8xl lg:text-9xl mb-6 inline-block'
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                🚀
              </motion.div>
              <h1 className='text-4xl lg:text-6xl font-bold text-space-primary mb-4'>
                星舰计划
              </h1>
              <p className='text-xl lg:text-2xl text-space-text mb-2'>
                Starship Plan
              </p>
              <p className='text-lg text-space-text-secondary max-w-md'>
                专为小宇航员设计的习惯养成太空冒险之旅
              </p>
            </div>

            {/* 特色展示 */}
            <div className='space-y-4 max-w-md mx-auto lg:mx-0'>
              <motion.div
                className='flex items-center p-4 bg-space-surface/50 backdrop-blur rounded-lg border border-space-border'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}>
                <span className='text-3xl mr-4'>🎯</span>
                <div>
                  <h3 className='font-bold text-space-text'>游戏化任务</h3>
                  <p className='text-sm text-space-text-secondary'>星球探险、习惯养成</p>
                </div>
              </motion.div>

              <motion.div
                className='flex items-center p-4 bg-space-surface/50 backdrop-blur rounded-lg border border-space-border'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}>
                <span className='text-3xl mr-4'>🏆</span>
                <div>
                  <h3 className='font-bold text-space-text'>成就系统</h3>
                  <p className='text-sm text-space-text-secondary'>等级提升、装备收集</p>
                </div>
              </motion.div>

              <motion.div
                className='flex items-center p-4 bg-space-surface/50 backdrop-blur rounded-lg border border-space-border'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}>
                <span className='text-3xl mr-4'>👨‍👩‍👧</span>
                <div>
                  <h3 className='font-bold text-space-text'>家长监控</h3>
                  <p className='text-sm text-space-text-secondary'>实时报告、安全可控</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* 右侧表单区 */}
          <motion.div
            className='flex-1 max-w-md'
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}>
            <AnimatePresence mode='wait'>
              {isLogin ? (
                <motion.div
                  key='login'
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}>
                  <LoginForm onLogin={handleLogin} onSwitchToRegister={toggleForm} />
                </motion.div>
              ) : (
                <motion.div
                  key='register'
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}>
                  <RegisterForm onRegister={handleRegister} onSwitchToLogin={toggleForm} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {/* CSS动画定义 */}
      <style jsx>{`
        @keyframes meteor {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(-500px) translateY(300px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}