# 🚀 StarshipPlan（星舰计划）

专为家庭内部使用的小学生习惯管理系统，采用太空冒险主题的游戏化设计。

## 📋 项目概述

StarshipPlan 帮助9岁男孩"葫芦"通过游戏化的方式培养良好习惯，包括：
- 🚀 太空冒险主题界面
- 💫 星币积分系统
- 🌟 等级晋升机制
- 🎮 任务游戏化体验
- 👨‍👩‍👧‍👦 家长管理功能

## 🏗️ 项目结构

```
StarshipPlan/
├── frontend/              # React + TypeScript 前端项目
├── backend/               # Node.js + Express 后端API
├── mobile/               # Capacitor 移动端配置
├── docs/                 # 项目文档
├── scripts/              # 部署和工具脚本
├── .spec-workflow/       # 项目规划和需求文档
└── README.md            # 项目说明
```

## 🚀 快速开始

### 前端开发
```bash
cd frontend
npm install
npm run dev
```

### 后端开发
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 移动端开发
```bash
# 安装 Capacitor CLI
npm install -g @capacitor/cli

# 添加Android平台
npx cap add android

# 构建前端并同步到移动端
cd frontend && npm run build
npx cap sync android
```

## 🎮 核心功能

### 孩子端功能
- 🪐 星球任务系统：将日常任务转化为星球探险
- 👨‍🚀 宇航员角色：可升级换装的太空角色
- 💰 星币奖励：完成任务获得星币，可兑换真实奖励
- 🏆 等级系统：从平民到王者的6个等级晋升
- 🎵 游戏音效：沉浸式的太空音效和动画

### 家长端功能
- 📊 数据统计：习惯养成进度和数据分析
- ⚙️ 任务管理：设置和调整孩子任务
- 🎛️ 权限控制：家长审批和权限管理
- 📈 成长报告：详细的孩子成长记录

### 🔧 系统特性
- 🌐 **实时同步**：WebSocket实时数据推送，支持多设备同步
- 💾 **离线优先**：IndexedDB本地存储，支持离线操作和数据缓存
- 🔄 **冲突解决**：智能数据冲突检测和解决机制
- 👨‍👩‍👧‍👦 **家庭共享**：家长和孩子数据实时同步和权限管理
- 📱 **跨平台**：Web + 移动端统一体验
- 🔒 **安全认证**：JWT身份验证和权限控制

## 🔧 技术栈

### 前端技术
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 + PostCSS 8
- Radix UI 组件库 + shadcn/ui
- Lucide React 图标库
- Canvas API + CSS 动画
- Zustand 状态管理
- IndexedDB 本地存储

### 后端技术
- Node.js + Express
- TypeScript
- Prisma ORM + SQLite
- Socket.io 实时通信
- JWT 身份验证
- Winston 日志管理

### 移动端技术
- Capacitor 跨平台框架
- PWA 渐进式Web应用
- Android 原生功能集成

## 📱 部署方式

### 本地部署（推荐）
1. 一键安装脚本自动配置
2. Docker 容器化部署
3. 家庭WiFi环境运行
4. 无需云服务器成本

### 系统要求
- Node.js 18+
- Android 6.0+
- 家庭WiFi网络
- 现代浏览器支持

## 🎯 游戏化设计

### 等级系统
| 等级 | 所需星币 | 兑换汇率 | 特殊权益 |
|------|---------|----------|----------|
| 平民 | 0-49星币 | 0.25倍 | 基础功能 |
| 青铜 | 50-149星币 | 0.5倍 | 任务提醒+个性化头像框 |
| 白银 | 150-399星币 | 0.75倍 | 个性化头像+主题皮肤 |
| 黄金 | 400-799星币 | 1.0倍 | 专属背景+VIP道具+奖励翻倍 |
| 钻石 | 800-1499星币 | 1.5倍 | 全功能解锁+优先客服 |
| 王者 | 1500星币+ | 2.5倍 | 所有权益+年度礼包 |

### 任务示例
- 🌅 每日7点起床：+1星币
- 📚 完成作业：+2星币
- 🏃 健身锻炼：+1星币
- 🧹 整理房间：+1星币
- 🌟 周任务完成：+5星币

## 📊 开发进度

### ✅ 已完成
- [x] 需求分析和设计
- [x] 项目初始化和基础架构
- [x] 前端UI组件库开发 (Next.js 16 + Radix UI)
- [x] 游戏化界面实现 (太空主题 + Canvas动画)
- [x] 后端API开发 (Express + TypeScript + Prisma)
- [x] 数据库设计和实现 (SQLite + 完整数据模型)
- [x] 前后端集成和实时同步 (WebSocket + IndexedDB)
- [x] API客户端和状态管理系统 (Zustand + 自定义Hooks)
- [x] 离线功能和数据缓存机制
- [x] 系统集成测试 (API + WebSocket + 离线功能)

### 🚧 进行中
- [ ] 移动端开发 (Capacitor + Android)

### 📋 待开始
- [ ] 生产部署和优化
- [ ] 性能监控和日志系统
- [ ] 用户文档和帮助系统

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request
5. 代码审查通过后合并

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

- 项目维护者：Starship Plan Team
- 问题反馈：通过GitHub Issues
- 技术支持：项目文档或邮件

---

让习惯养成变成一场有趣的太空冒险！🚀✨