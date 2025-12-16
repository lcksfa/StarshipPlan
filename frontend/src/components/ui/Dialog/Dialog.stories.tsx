import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from '../../Button/Button'

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '太空主题对话框组件，支持多种变体和动画效果',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: '是否打开对话框',
    },
    variant: {
      control: 'select',
      options: ['default', 'spaceship', 'alert', 'success', 'warning'],
      description: '对话框的变体类型',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: '对话框的尺寸',
    },
    showCloseButton: {
      control: 'boolean',
      description: '是否显示关闭按钮',
    },
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open)
    return (
      <>
        <Button onClick={() => setOpen(true)}>打开对话框</Button>
        <Dialog {...args} open={open} onClose={() => setOpen(false)} />
      </>
    )
  },
}

export default meta
type Story = StoryObj<typeof Dialog>

// 默认对话框
export const Default: Story = {
  args: {
    title: '任务确认',
    description: '您确定要接受这个太空任务吗？',
    open: false,
    children: (
      <div className='space-y-4'>
        <div className='bg-space-surface p-4 rounded border border-space-border'>
          <h4 className='font-bold text-space-primary mb-2'>🚀 任务详情</h4>
          <ul className='text-space-text-sm space-y-1'>
            <li>• 探索火星表面</li>
            <li>• 收集矿物样本</li>
            <li>• 建立前哨基地</li>
          </ul>
        </div>
      </div>
    ),
    footer: (
      <>
        <Button variant='secondary' onClick={() => {}}>
          取消
        </Button>
        <Button variant='primary' onClick={() => {}}>
          接受任务
        </Button>
      </>
    ),
  },
}

// 星舰风格对话框
export const Spaceship: Story = {
  args: {
    variant: 'spaceship',
    size: 'lg',
    title: '🛸 星舰控制系统',
    description: '欢迎来到UFO控制中心，请选择您的操作',
    open: false,
    children: (
      <div className='grid grid-cols-2 gap-4'>
        <div className='bg-space-surface p-4 rounded border border-space-primary/30 hover:border-space-primary transition-colors cursor-pointer'>
          <div className='text-2xl mb-2'>🚀</div>
          <div className='font-bold text-space-primary'>引擎控制</div>
          <div className='text-space-text-secondary text-sm'>
            调整推进器功率
          </div>
        </div>
        <div className='bg-space-surface p-4 rounded border border-space-primary/30 hover:border-space-primary transition-colors cursor-pointer'>
          <div className='text-2xl mb-2'>📡</div>
          <div className='font-bold text-space-primary'>通讯系统</div>
          <div className='text-space-text-secondary text-sm'>连接地球基地</div>
        </div>
        <div className='bg-space-surface p-4 rounded border border-space-primary/30 hover:border-space-primary transition-colors cursor-pointer'>
          <div className='text-2xl mb-2'>🛡️</div>
          <div className='font-bold text-space-primary'>护盾控制</div>
          <div className='text-space-text-secondary text-sm'>能量护盾管理</div>
        </div>
        <div className='bg-space-surface p-4 rounded border border-space-primary/30 hover:border-space-primary transition-colors cursor-pointer'>
          <div className='text-2xl mb-2'>🗺️</div>
          <div className='font-bold text-space-primary'>导航系统</div>
          <div className='text-space-text-secondary text-sm'>星际地图导航</div>
        </div>
      </div>
    ),
    footer: (
      <Button variant='primary' onClick={() => {}}>
        启动系统
      </Button>
    ),
  },
}

// 警告对话框
export const Alert: Story = {
  args: {
    variant: 'alert',
    title: '⚠️ 系统警告',
    description: '检测到异常活动，需要立即处理',
    open: false,
    children: (
      <div className='space-y-3'>
        <div className='flex items-center space-x-3'>
          <div className='w-2 h-2 bg-error rounded-full animate-pulse'></div>
          <span className='text-space-text'>引擎温度过高</span>
        </div>
        <div className='flex items-center space-x-3'>
          <div className='w-2 h-2 bg-error rounded-full animate-pulse'></div>
          <span className='text-space-text'>护盾能量下降</span>
        </div>
        <div className='flex items-center space-x-3'>
          <div className='w-2 h-2 bg-warning rounded-full animate-pulse'></div>
          <span className='text-space-text'>燃料储备低于20%</span>
        </div>
      </div>
    ),
    footer: (
      <>
        <Button variant='secondary' onClick={() => {}}>
          稍后处理
        </Button>
        <Button variant='danger' onClick={() => {}}>
          立即处理
        </Button>
      </>
    ),
  },
}

// 成功对话框
export const Success: Story = {
  args: {
    variant: 'success',
    size: 'md',
    title: '✨ 任务完成',
    description: '恭喜！您成功完成了火星探索任务',
    open: false,
    children: (
      <div className='text-center space-y-4'>
        <div className='text-6xl'>🎉</div>
        <div className='space-y-2'>
          <div className='text-2xl font-bold text-success'>任务奖励</div>
          <div className='flex justify-center space-x-6'>
            <div>
              <div className='text-warning text-2xl'>+50</div>
              <div className='text-space-text-secondary text-sm'>星币</div>
            </div>
            <div>
              <div className='text-primary text-2xl'>+100</div>
              <div className='text-space-text-secondary text-sm'>经验值</div>
            </div>
            <div>
              <div className='text-accent text-2xl'>+1</div>
              <div className='text-space-text-secondary text-sm'>徽章</div>
            </div>
          </div>
        </div>
      </div>
    ),
    footer: (
      <Button variant='primary' onClick={() => {}}>
        领取奖励
      </Button>
    ),
  },
}

// 确认对话框
export const Confirmation: Story = {
  args: {
    variant: 'warning',
    title: '⚡ 确认操作',
    description: '此操作不可撤销，请谨慎确认',
    size: 'sm',
    open: false,
    children: (
      <div className='space-y-3'>
        <p className='text-space-text'>您确定要执行以下操作吗？</p>
        <div className='bg-space-surface p-3 rounded border border-warning'>
          <div className='font-bold text-warning'>紧急跃迁</div>
          <div className='text-space-text-secondary text-sm'>
            消耗大量能量，跳跃到随机位置
          </div>
        </div>
      </div>
    ),
    footer: (
      <>
        <Button variant='secondary' onClick={() => {}}>
          取消
        </Button>
        <Button variant='danger' onClick={() => {}}>
          确认跃迁
        </Button>
      </>
    ),
  },
}

// 复杂对话框示例
export const ComplexDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>打开复杂对话框</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          variant='spaceship'
          size='xl'
          title='🚀 太空任务中心'
          description='管理您的所有太空任务和奖励'
          footer={
            <div className='flex space-x-3'>
              <Button variant='secondary' onClick={() => setOpen(false)}>
                关闭
              </Button>
              <Button variant='primary' onClick={() => {}}>
                保存设置
              </Button>
            </div>
          }>
          <div className='space-y-6'>
            {/* 任务统计 */}
            <div className='bg-space-surface p-4 rounded border border-space-primary/30'>
              <h4 className='font-bold text-space-primary mb-3'>任务统计</h4>
              <div className='grid grid-cols-3 gap-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-success'>12</div>
                  <div className='text-space-text-secondary text-sm'>
                    已完成
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-warning'>3</div>
                  <div className='text-space-text-secondary text-sm'>
                    进行中
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-primary'>5</div>
                  <div className='text-space-text-secondary text-sm'>
                    待开始
                  </div>
                </div>
              </div>
            </div>

            {/* 最新任务 */}
            <div className='bg-space-surface p-4 rounded border border-space-primary/30'>
              <h4 className='font-bold text-space-primary mb-3'>最新任务</h4>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span>🌍 探索地球基地</span>
                  <span className='text-success text-sm'>✅ 已完成</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>🔴 火星样本收集</span>
                  <span className='text-warning text-sm'>⏳ 进行中 60%</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>⚡ 能量核心升级</span>
                  <span className='text-space-text-secondary text-sm'>
                    ⏸ 待开始
                  </span>
                </div>
              </div>
            </div>

            {/* 奖励预览 */}
            <div className='bg-space-surface p-4 rounded border border-space-primary/30'>
              <h4 className='font-bold text-space-primary mb-3'>即将获得</h4>
              <div className='flex items-center space-x-4'>
                <div className='text-4xl'>🏆</div>
                <div>
                  <div className='font-bold text-accent'>火星探索者徽章</div>
                  <div className='text-space-text-secondary text-sm'>
                    完成火星任务系列
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      </>
    )
  },
}
