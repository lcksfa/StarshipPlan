import type { Meta, StoryObj } from '@storybook/react'
import { LoginForm } from './LoginForm'
import { User } from '../../data/mock/authData'

const meta: Meta<typeof LoginForm> = {
  title: 'Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '太空舱风格的登录表单，包含炫酷的动画效果和完整的功能验证',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onLogin: {
      action: 'login',
      description: '登录成功回调函数',
    },
    onSwitchToRegister: {
      action: 'switchToRegister',
      description: '切换到注册表单回调函数',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 默认登录表单
export const Default: Story = {
  args: {
    onLogin: (user: User) => console.log('Login successful:', user),
    onSwitchToRegister: () => console.log('Switch to register'),
  },
}

// 带初始值的登录表单
export const WithInitialValues: Story = {
  args: {
    onLogin: (user: User) => console.log('Login successful:', user),
    onSwitchToRegister: () => console.log('Switch to register'),
  },
  render: (args) => (
    <div className='w-96'>
      <LoginForm {...args} />
    </div>
  ),
}

// 登录成功状态（演示用）
export const LoginSuccess: Story = {
  args: {
    onLogin: (user: User) => {
      alert('🚀 登录成功！欢迎回到太空站！')
      console.log('Login successful:', user)
    },
    onSwitchToRegister: () => console.log('Switch to register'),
  },
  render: (args) => (
    <div className='w-96'>
      <LoginForm {...args} />
      <div className='mt-4 p-4 bg-success/20 border border-success/50 rounded-lg'>
        <p className='text-success text-sm'>
          💡 <strong>测试账号：</strong> kid@space.com / space123
        </p>
        <p className='text-success text-sm'>
          💡 <strong>家长账号：</strong> parent@space.com / space123
        </p>
      </div>
    </div>
  ),
}

// 错误状态演示
export const ErrorStates: Story = {
  args: {
    onLogin: (user: User) => console.log('Login successful:', user),
    onSwitchToRegister: () => console.log('Switch to register'),
  },
  render: (args) => (
    <div className='w-96 space-y-6'>
      <div>
        <h3 className='text-lg font-bold text-space-primary mb-2'>错误状态演示</h3>
        <p className='text-space-text-secondary text-sm mb-4'>
          以下是各种验证错误状态的展示：
        </p>
      </div>

      <LoginForm {...args} />
    </div>
  ),
}

// 加载状态演示
export const LoadingState: Story = {
  args: {
    onLogin: async (user: User) => {
      console.log('Login successful:', user)
    },
    onSwitchToRegister: () => console.log('Switch to register'),
  },
  render: (args) => (
    <div className='w-96'>
      <LoginForm {...args} />
      <div className='mt-4 p-4 bg-space-surface/50 border border-space-border rounded-lg'>
        <p className='text-space-text-secondary text-sm'>
          ⏳ 点击"进入太空站"按钮查看加载状态
        </p>
      </div>
    </div>
  ),
}