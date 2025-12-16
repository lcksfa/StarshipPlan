import type { Preview } from '@storybook/react'
import React from 'react'
import '../src/styles/globals.css'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      toc: true,
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0a0a0f',
        },
        {
          name: 'space',
          value: '#1a1a2e',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
    themes: {
      default: 'dark',
      list: [
        { name: 'dark', class: 'dark', color: '#0a0a0f' },
        { name: 'space', class: 'space', color: '#1a1a2e' },
        { name: 'light', class: 'light', color: '#ffffff' },
      ],
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['dark', 'space', 'light'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const { theme } = context.globals

      // 添加主题类到 body
      document.body.className = theme || 'dark'

      return (
        <div className={`theme-${theme}`}>
          <Story />
        </div>
      )
    },
  ],
}

export default preview