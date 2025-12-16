import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '太空主题输入框组件，支持多种科技感风格和交互效果',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'spaceship', 'hologram', 'control'],
      description: '输入框的变体类型',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '输入框的尺寸',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    loading: {
      control: 'boolean',
      description: '是否显示加载状态',
    },
    error: {
      control: 'text',
      description: '错误信息',
    },
    placeholder: {
      control: 'text',
      description: '占位符文本',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 默认输入框
export const Default: Story = {
  args: {
    placeholder: '输入文本内容...',
  },
}

// 带标签的输入框
export const WithLabel: Story = {
  args: {
    label: '宇航员姓名',
    placeholder: '请输入您的姓名',
  },
}

// 星舰风格输入框
export const Spaceship: Story = {
  args: {
    variant: 'spaceship',
    label: '星舰编号',
    placeholder: '输入星舰识别码',
    leftIcon: <span>🚀</span>,
    helperText: '格式：SPC-XXXX-XXXX',
  },
}

// 全息风格输入框
export const Hologram: Story = {
  args: {
    variant: 'hologram',
    label: '量子通讯频率',
    placeholder: '输入频率值',
    leftIcon: <span>📡</span>,
    helperText: '范围：1000-9999 MHz',
  },
}

// 控制面板风格
export const Control: Story = {
  args: {
    variant: 'control',
    label: '引擎功率设置',
    placeholder: '输入功率百分比',
    rightIcon: <span>⚡</span>,
    helperText: '建议范围：50-100%',
  },
}

// 密码输入框
export const Password: Story = {
  args: {
    variant: 'spaceship',
    type: 'password',
    label: '访问密码',
    placeholder: '输入安全密码',
    leftIcon: <span>🔐</span>,
    helperText: '密码长度至少8位',
  },
}

// 带错误的输入框
export const WithError: Story = {
  args: {
    variant: 'spaceship',
    label: '星舰坐标',
    placeholder: '输入目标坐标',
    error: '坐标格式无效，请使用 X:Y:Z 格式',
    leftIcon: <span>📍</span>,
  },
}

// 带加载状态的输入框
export const WithLoading: Story = {
  args: {
    variant: 'spaceship',
    label: '星球扫描',
    placeholder: '扫描星球数据...',
    loading: true,
    leftIcon: <span>🔍</span>,
    helperText: '正在连接星际数据库...',
  },
}

// 禁用状态
export const Disabled: Story = {
  args: {
    variant: 'spaceship',
    label: '系统锁定',
    placeholder: '此功能已禁用',
    value: '管理员锁定中...',
    disabled: true,
    leftIcon: <span>🔒</span>,
  },
}

// 尺寸展示
export const Sizes: Story = {
  render: () => (
    <div className='space-y-6 w-96'>
      <div>
        <label className='block text-sm font-medium text-space-text mb-2'>
          小型输入框
        </label>
        <Input
          variant='spaceship'
          size='sm'
          placeholder='小型输入框...'
          leftIcon={<span>🚀</span>}
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-space-text mb-2'>
          中型输入框
        </label>
        <Input
          variant='spaceship'
          size='md'
          placeholder='中型输入框...'
          leftIcon={<span>🚀</span>}
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-space-text mb-2'>
          大型输入框
        </label>
        <Input
          variant='spaceship'
          size='lg'
          placeholder='大型输入框...'
          leftIcon={<span>🚀</span>}
        />
      </div>
    </div>
  ),
}

// 完整表单示例
export const CompleteForm: Story = {
  render: () => (
    <div className='space-y-6 w-96'>
      <div>
        <Input
          variant='spaceship'
          label='宇航员姓名'
          placeholder='输入您的姓名'
          leftIcon={<span>👨‍🚀</span>}
        />
      </div>

      <div>
        <Input
          variant='spaceship'
          type='email'
          label='星际邮箱'
          placeholder='your.email@space.com'
          leftIcon={<span>📧</span>}
          helperText='用于接收任务通知'
        />
      </div>

      <div>
        <Input
          variant='hologram'
          label='量子通讯ID'
          placeholder='输入量子ID'
          leftIcon={<span>🌌</span>}
          helperText='您的唯一量子标识符'
        />
      </div>

      <div>
        <Input
          variant='control'
          label='经验等级'
          placeholder='输入当前等级'
          rightIcon={<span>⭐</span>}
          helperText='等级范围：1-100'
        />
      </div>

      <div>
        <Input
          variant='spaceship'
          type='password'
          label='安全验证码'
          placeholder='输入验证码'
          leftIcon={<span>🛡️</span>}
          helperText='来自您的移动设备'
        />
      </div>

      <div className='flex space-x-3'>
        <button className='flex-1 px-4 py-3 bg-space-primary text-white rounded-lg font-medium hover:bg-space-primary-hover transition-colors'>
          🚀 发送验证
        </button>
        <button className='flex-1 px-4 py-3 bg-space-surface border border-space-border text-space-text rounded-lg font-medium hover:bg-space-surface-hover transition-colors'>
          取消
        </button>
      </div>
    </div>
  ),
}
