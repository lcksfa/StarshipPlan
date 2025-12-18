// API 配置文件
// 动态获取API URL，支持局域网访问

export const API_CONFIG = {
  // 在客户端环境中获取API URL
  getApiUrl: () => {
    // 优先使用环境变量配置的API URL
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL
    }

    // 开发环境中的回退策略
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const port = 8000

      // 如果访问localhost，使用localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:${port}`
      }

      // 局域网IP访问
      return `http://${hostname}:${port}`
    }

    // 服务端渲染或静态导出的回退
    return 'http://localhost:8000'
  },

  getWsUrl: () => {
    if (process.env.NEXT_PUBLIC_WS_URL) {
      return process.env.NEXT_PUBLIC_WS_URL
    }

    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const port = 8000

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `ws://localhost:${port}`
      }

      return `ws://${hostname}:${port}`
    }

    return 'ws://localhost:8000'
  }
}
