import type { Meta, StoryObj } from '@storybook/react'
import { ProgressBar } from './ProgressBar'

const meta: Meta<typeof ProgressBar> = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '太空主题进度条组件，支持多种能量条和状态显示效果',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: '当前值',
      min: 0,
      max: 100,
    },
    max: {
      control: 'number',
      description: '最大值',
      min: 1,
    },
    variant: {
      control: 'select',
      options: ['default', 'energy', 'shield', 'experience', 'health'],
      description: '进度条的变体类型',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '进度条的尺寸',
    },
    showLabel: {
      control: 'boolean',
      description: '是否显示标签',
    },
    showPercentage: {
      control: 'boolean',
      description: '是否显示百分比',
    },
    animated: {
      control: 'boolean',
      description: '是否启用动画',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 默认进度条
export const Default: Story = {
  args: {
    value: 65,
    showPercentage: true,
  },
}

// 能量条
export const Energy: Story = {
  args: {
    variant: 'energy',
    value: 80,
    label: '⚡ 能量水平',
    showPercentage: true,
    animated: true,
  },
}

// 护盾强度
export const Shield: Story = {
  args: {
    variant: 'shield',
    value: 95,
    label: '🛡️ 护盾强度',
    showPercentage: true,
    animated: true,
  },
}

// 经验值
export const Experience: Story = {
  args: {
    variant: 'experience',
    value: 45,
    max: 200,
    label: '✨ 经验值',
    showPercentage: true,
    animated: true,
  },
}

// 生命值
export const Health: Story = {
  args: {
    variant: 'health',
    value: 30,
    label: '❤️ 生命值',
    showPercentage: true,
    animated: true,
  },
}

// 尺寸展示
export const Sizes: Story = {
  render: () => (
    <div className='space-y-6 w-96'>
      <div>
        <ProgressBar variant='energy' value={75} size='sm' label='小型能量条' />
      </div>
      <div>
        <ProgressBar variant='shield' value={60} size='md' label='中型护盾条' />
      </div>
      <div>
        <ProgressBar
          variant='experience'
          value={85}
          size='lg'
          label='大型经验条'
        />
      </div>
    </div>
  ),
}

// 飞船状态面板
export const SpaceshipStatus: Story = {
  render: () => (
    <div className='space-y-4 w-96'>
      <h3 className='text-xl font-bold text-space-primary mb-4'>🚀 飞船状态</h3>

      <ProgressBar
        variant='health'
        value={85}
        label='结构完整性'
        showPercentage={true}
        animated={true}
      />

      <ProgressBar
        variant='shield'
        value={100}
        label='护盾强度'
        showPercentage={true}
        animated={true}
      />

      <ProgressBar
        variant='energy'
        value={60}
        label='引擎功率'
        showPercentage={true}
        animated={true}
      />

      <ProgressBar
        variant='experience'
        value={120}
        max={200}
        label='燃料储备'
        showPercentage={true}
        animated={true}
      />

      <div className='bg-space-surface p-4 rounded border border-space-border'>
        <div className='text-sm text-space-text-secondary'>系统状态</div>
        <div className='text-lg font-bold text-success mt-1'>
          ✅ 所有系统正常运行
        </div>
      </div>
    </div>
  ),
}

// 任务进度面板
export const MissionProgress: Story = {
  render: () => (
    <div className='space-y-4 w-96'>
      <h3 className='text-xl font-bold text-space-primary mb-4'>🎯 任务进度</h3>

      <ProgressBar
        variant='experience'
        value={100}
        label='🌍 地球探索'
        showPercentage={true}
        animated={false}
      />

      <ProgressBar
        variant='energy'
        value={70}
        label='🔴 火星任务'
        showPercentage={true}
        animated={true}
      />

      <ProgressBar
        variant='shield'
        value={25}
        label='⚡ 小行星带穿越'
        showPercentage={true}
        animated={true}
      />

      <ProgressBar
        variant='health'
        value={0}
        label='🌌 深空探索'
        showPercentage={true}
        animated={false}
      />

      <ProgressBar
        variant='default'
        value={45}
        label='🏆 总体进度'
        showPercentage={true}
        animated={true}
      />
    </div>
  ),
}

// 角色属性面板
export const CharacterStats: Story = {
  render: () => (
    <div className='space-y-4 w-96'>
      <h3 className='text-xl font-bold text-accent mb-4'>👨‍🚀 宇航员属性</h3>

      <ProgressBar
        variant='health'
        value={90}
        label='❤️ 生命值'
        showPercentage={true}
        max={150}
        animated={true}
      />

      <ProgressBar
        variant='energy'
        value={120}
        label='⚡ 能量值'
        showPercentage={true}
        max={200}
        animated={true}
      />

      <ProgressBar
        variant='experience'
        value={750}
        max={1000}
        label='⭐ 经验值'
        showPercentage={true}
        animated={true}
      />

      <ProgressBar
        variant='shield'
        value={60}
        label='🛡️ 防御力'
        showPercentage={true}
        max={100}
        animated={true}
      />

      <div className='bg-space-surface p-4 rounded border border-accent'>
        <div className='text-sm text-space-text-secondary'>等级</div>
        <div className='text-2xl font-bold text-accent'>Lv.15 精英宇航员</div>
      </div>
    </div>
  ),
}

// 特殊状态展示
export const SpecialStates: Story = {
  render: () => (
    <div className='space-y-6 w-96'>
      <div>
        <h4 className='text-lg font-bold text-space-primary mb-3'>警告状态</h4>
        <ProgressBar
          variant='health'
          value={15}
          label='🚨 临界状态'
          showPercentage={true}
          animated={true}
        />
      </div>

      <div>
        <h4 className='text-lg font-bold text-success mb-3'>满能量状态</h4>
        <ProgressBar
          variant='energy'
          value={100}
          label='⚡ 能量充沛'
          showPercentage={true}
          animated={true}
        />
      </div>

      <div>
        <h4 className='text-lg font-bold text-warning mb-3'>充能中</h4>
        <ProgressBar
          variant='shield'
          value={45}
          label='🛡️ 护盾充能中'
          showPercentage={true}
          animated={true}
        />
      </div>

      <div>
        <h4 className='text-lg font-bold text-space-primary mb-3'>升级进度</h4>
        <ProgressBar
          variant='experience'
          value={95}
          label='✨ 即将升级'
          showPercentage={true}
          animated={true}
        />
      </div>
    </div>
  ),
}
