import type { Meta, StoryObj } from '@storybook/react'
import { RegisterForm } from './RegisterForm'
import { User } from '../../data/mock/authData'

const meta: Meta<typeof RegisterForm> = {
  title: 'Auth/RegisterForm',
  component: RegisterForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '太空舱风格的注册表单，支持儿童和家长两种用户类型',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onRegister: (user: User) => console.log('Register successful:', user),
    onSwitchToLogin: () => console.log('Switch to login'),
  },
  render: (args) => (
    <div className='w-96 max-h-[90vh] overflow-y-auto'>
      <RegisterForm {...args} />
    </div>
  ),
}

export const ChildRegistration: Story = {
  args: {
    onRegister: (user: User) => console.log('Child registration successful:', user),
    onSwitchToLogin: () => console.log('Switch to login'),
  },
  render: (args) => (
    <div className='w-96 max-h-[90vh] overflow-y-auto'>
      <RegisterForm {...args} />
      <div className='mt-4 p-4 bg-accent/20 border border-accent/50 rounded-lg'>
        <p className='text-accent text-sm font-bold mb-2'>儿童注册演示</p>
        <p className='text-space-text-secondary text-sm'>
          体验完整的儿童注册流程，包括头像选择、个人信息填写等
        </p>
      </div>
    </div>
  ),
}