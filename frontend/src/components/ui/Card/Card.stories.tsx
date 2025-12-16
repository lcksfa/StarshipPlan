import type { Meta, StoryObj } from '@storybook/react'
import { Card } from './Card'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '太空主题卡片组件，支持多种变体和交互效果',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'spaceship', 'planet', 'cargo', 'control-panel'],
      description: '卡片的变体类型',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: '卡片的尺寸',
    },
    hover: {
      control: 'boolean',
      description: '是否启用悬停效果',
    },
    glow: {
      control: 'boolean',
      description: '是否启用光晕效果',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 默认卡片
export const Default: Story = {
  args: {
    children: '这是一个默认的太空主题卡片',
  },
}

// 星舰风格卡片
export const Spaceship: Story = {
  args: {
    variant: 'spaceship',
    size: 'md',
    children: (
      <div className='text-center'>
        <h3 className='text-xl font-bold text-space-primary mb-2'>
          🚀 星舰控制台
        </h3>
        <p className='text-space-text'>高科技星舰风格设计</p>
      </div>
    ),
  },
}

// 星球卡片
export const Planet: Story = {
  args: {
    variant: 'planet',
    size: 'lg',
    children: (
      <div className='text-center'>
        <div className='text-6xl mb-4'>🌍</div>
        <h3 className='text-lg font-bold text-accent mb-2'>地球任务</h3>
        <p className='text-space-text-sm'>探索蓝色星球</p>
      </div>
    ),
  },
}

// 货物卡片
export const Cargo: Story = {
  args: {
    variant: 'cargo',
    size: 'md',
    children: (
      <div className='flex items-center space-x-4'>
        <div className='text-4xl'>📦</div>
        <div>
          <h4 className='font-bold text-warning'>货物箱</h4>
          <p className='text-space-text-secondary text-sm'>重要物资</p>
        </div>
      </div>
    ),
  },
}

// 控制面板卡片
export const ControlPanel: Story = {
  args: {
    variant: 'control-panel',
    size: 'xl',
    glow: true,
    children: (
      <div>
        <h3 className='text-2xl font-bold text-space-primary mb-4 flex items-center'>
          ⚡ 控制面板
        </h3>
        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-space-surface p-3 rounded border border-space-border'>
            <div className='text-sm text-space-text-secondary'>引擎状态</div>
            <div className='text-lg font-bold text-success'>正常</div>
          </div>
          <div className='bg-space-surface p-3 rounded border border-space-border'>
            <div className='text-sm text-space-text-secondary'>燃料水平</div>
            <div className='text-lg font-bold text-warning'>75%</div>
          </div>
          <div className='bg-space-surface p-3 rounded border border-space-border'>
            <div className='text-sm text-space-text-secondary'>护盾强度</div>
            <div className='text-lg font-bold text-primary'>100%</div>
          </div>
          <div className='bg-space-surface p-3 rounded border border-space-border'>
            <div className='text-sm text-space-text-secondary'>速度</div>
            <div className='text-lg font-bold text-accent'>1200 km/s</div>
          </div>
        </div>
      </div>
    ),
  },
}

// 卡片组合展示
export const CardCollection: Story = {
  render: () => (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl'>
      <Card variant='spaceship' size='md'>
        <div className='text-center'>
          <div className='text-3xl mb-2'>🛸</div>
          <h4 className='font-bold text-space-primary'>UFO探测器</h4>
          <p className='text-space-text-secondary text-sm'>扫描外星信号</p>
        </div>
      </Card>

      <Card variant='planet' size='md'>
        <div className='text-center'>
          <div className='text-3xl mb-2'>🔴</div>
          <h4 className='font-bold text-error'>火星基地</h4>
          <p className='text-space-text-secondary text-sm'>红色星球前哨</p>
        </div>
      </Card>

      <Card variant='cargo' size='md'>
        <div className='text-center'>
          <div className='text-3xl mb-2'>⚡</div>
          <h4 className='font-bold text-warning'>能量核心</h4>
          <p className='text-space-text-secondary text-sm'>高能反应堆</p>
        </div>
      </Card>
    </div>
  ),
}

// 尺寸展示
export const Sizes: Story = {
  render: () => (
    <div className='space-y-4 max-w-md'>
      <Card variant='default' size='sm'>
        <h4 className='font-bold'>小型卡片</h4>
        <p className='text-space-text-secondary text-sm'>
          紧凑设计，适合信息展示
        </p>
      </Card>

      <Card variant='default' size='md'>
        <h4 className='font-bold'>中型卡片</h4>
        <p className='text-space-text-secondary'>标准尺寸，用途广泛</p>
      </Card>

      <Card variant='default' size='lg'>
        <h4 className='font-bold text-lg'>大型卡片</h4>
        <p className='text-space-text-secondary'>更多空间，丰富内容展示</p>
      </Card>

      <Card variant='spaceship' size='xl' glow>
        <h4 className='font-bold text-xl text-space-primary'>超大卡片</h4>
        <p className='text-space-text'>重要信息或主要功能使用</p>
      </Card>
    </div>
  ),
}
