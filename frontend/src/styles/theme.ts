/**
 * 太空主题设计令牌
 * 为9岁男孩子设计的太空冒险主题配色和样式
 */

export const spaceTheme = {
  // 主要颜色 - 科技感蓝紫色系
  colors: {
    // 背景和表面
    spaceBg: '#0a0a0f', // 深空黑
    spaceSurface: '#1a1a2e', // 星际蓝
    spaceSurfaceHover: '#2a2a3e', // 悬停态
    spaceCard: '#16213e', // 卡片背景

    // 主要颜色 - 科技蓝
    primary: '#00d4ff', // 赛博蓝
    primaryHover: '#00a8cc', // 悬停蓝
    primaryLight: '#e6f7ff', // 浅蓝

    // 强调色 - 橙红色
    accent: '#ff6b35', // 火箭橙
    accentHover: '#ff5722', // 深橙
    accentLight: '#fff4e6', // 浅橙

    // 成功色 - 绿色
    success: '#4caf50', // 成功绿
    successHover: '#45a049', // 深绿
    successLight: '#e8f5e8', // 浅绿

    // 警告色 - 黄色
    warning: '#ff9800', // 警告黄
    warningHover: '#f57c00', // 深黄
    warningLight: '#fff3e0', // 浅黄

    // 错误色 - 红色
    error: '#f44336', // 错误红
    errorHover: '#d32f2f', // 深红
    errorLight: '#ffebee', // 浅红

    // 文字颜色
    text: '#e0e0e0', // 主文字
    textSecondary: '#a0a0a0', // 次要文字
    textMuted: '#666666', // 静音文字
    textInverse: '#ffffff', // 反色文字

    // 边框和分割线
    border: '#333344', // 边框色
    borderLight: '#555566', // 浅边框
    divider: '#2a2a3a', // 分割线

    // 星光效果
    glow: 'rgba(0, 212, 255, 0.3)', // 蓝色光晕
    glowHover: 'rgba(0, 212, 255, 0.5)', // 悬停光晕

    // 星球色彩
    planetEarth: '#4169e1', // 地球蓝
    planetMars: '#cd5c5c', // 火星红
    planetJupiter: '#daa520', // 木星金
    planetSaturn: '#f4e4c1', // 土星米
    planetNeptune: '#4682b4', // 海王星蓝

    // 等级色彩
    bronze: '#cd7f32', // 铜牌
    silver: '#c0c0c0', // 银牌
    gold: '#ffd700', // 金牌
    platinum: '#e5e4e2', // 铂金
    diamond: '#b9f2ff', // 钻石
  },

  // 字体配置
  typography: {
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif'
      ],
      mono: [
        '"SF Mono"',
        'Monaco',
        'Inconsolata',
        '"Roboto Mono"',
        'monospace'
      ],
      display: [
        '"Orbitron"',
        '"Rajdhani"',
        '"Teko"',
        'sans-serif'
      ]
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  // 间距配置
  spacing: {
    0: '0px',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },

  // 圆角配置
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // 阴影配置
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

    // 特殊阴影效果
    glow: '0 0 20px rgba(0, 212, 255, 0.3)',
    glowHover: '0 0 30px rgba(0, 212, 255, 0.5)',
    neon: '0 0 10px rgba(0, 212, 255, 0.8), 0 0 20px rgba(0, 212, 255, 0.6), 0 0 30px rgba(0, 212, 255, 0.4)',
    space: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },

  // 动画配置
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      space: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
  },

  // 断点配置
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index层级
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
}

// 主题工具函数
export const createThemeClasses = (colors: typeof spaceTheme.colors) => ({
  // 渐变背景
  gradients: {
    space: `linear-gradient(135deg, ${colors.spaceSurface} 0%, ${colors.spaceCard} 100%)`,
    primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
    accent: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`,
    success: `linear-gradient(135deg, ${colors.success} 0%, ${colors.successHover} 100%)`,
    warning: `linear-gradient(135deg, ${colors.warning} 0%, ${colors.warningHover} 100%)`,
    error: `linear-gradient(135deg, ${colors.error} 0%, ${colors.errorHover} 100%)`,

    // 星球渐变
    earth: `radial-gradient(circle at 30% 30%, ${colors.planetEarth}, ${colors.spaceSurface})`,
    mars: `radial-gradient(circle at 30% 30%, ${colors.planetMars}, ${colors.spaceSurface})`,
    jupiter: `radial-gradient(circle at 30% 30%, ${colors.planetJupiter}, ${colors.spaceSurface})`,
    saturn: `radial-gradient(circle at 30% 30%, ${colors.planetSaturn}, ${colors.spaceSurface})`,
    neptune: `radial-gradient(circle at 30% 30%, ${colors.planetNeptune}, ${colors.spaceSurface})`,

    // 等级渐变
    bronze: `linear-gradient(135deg, ${colors.bronze}, #8b4513)`,
    silver: `linear-gradient(135deg, ${colors.silver}, #808080)`,
    gold: `linear-gradient(135deg, ${colors.gold}, #ffa500)`,
    platinum: `linear-gradient(135deg, ${colors.platinum}, #c0c0c0)`,
    diamond: `linear-gradient(135deg, ${colors.diamond}, #87ceeb)`,
  }
})

export const themeClasses = createThemeClasses(spaceTheme.colors)