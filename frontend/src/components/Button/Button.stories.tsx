import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '太空主题按钮组件，支持多种变体和状态',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'success'],
      description: '按钮的变体类型',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: '按钮的大小',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用按钮',
    },
    loading: {
      control: 'boolean',
      description: '是否显示加载状态',
    },
    children: {
      control: 'text',
      description: '按钮内容',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 默认按钮
export const Default: Story = {
  args: {
    children: '默认按钮',
  },
}

// 主要按钮
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: '主要按钮',
  },
}

// 次要按钮
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '次要按钮',
  },
}

// 危险按钮
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: '危险按钮',
  },
}

// 成功按钮
export const Success: Story = {
  args: {
    variant: 'success',
    children: '成功按钮',
  },
}

// 不同尺寸
export const Sizes: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <Button size='small'>小按钮</Button>
      <Button size='medium'>中按钮</Button>
      <Button size='large'>大按钮</Button>
    </div>
  ),
}

// 不同状态
export const States: Story = {
  render: () => (
    <div className='flex gap-4'>
      <Button>正常状态</Button>
      <Button disabled>禁用状态</Button>
      <Button loading>加载中</Button>
    </div>
  ),
}

// 游戏化按钮
export const GameButtons: Story = {
  render: () => (
    <div className='flex gap-4'>
      <Button variant='primary'>🚀 发射</Button>
      <Button variant='success'>✨ 等级提升</Button>
      <Button variant='danger'>⚡ 战斗</Button>
      <Button variant='secondary'>🛸 返回基地</Button>
    </div>
  ),
}
