# StarshipPlan API 文档

## 概述

StarshipPlan API 是一个面向家庭的儿童习惯管理系统的后端服务，采用太空冒险主题的游戏化设计。

- **基础URL**: `http://localhost:8000/api`
- **API版本**: v1.0.0
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 认证

除了健康检查和API信息端点外，所有API都需要JWT认证。

```http
Authorization: Bearer <your_jwt_token>
```

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {}, // 响应数据
  "message": "操作成功"
}
```

### 分页响应
```json
{
  "success": true,
  "data": [], // 数据列表
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "获取成功"
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述",
  "error": "ERROR_CODE"
}
```

## API端点

### 基础端点

#### 健康检查
```http
GET /health
```

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-17T02:00:00.000Z",
  "uptime": 3600.0,
  "environment": "development"
}
```

#### API信息
```http
GET /api
```

**响应**:
```json
{
  "message": "StarshipPlan API 服务器",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "auth": "/api/auth",
    "users": "/api/users",
    "tasks": "/api/tasks",
    "points": "/api/points",
    "punishments": "/api/punishments",
    "sync": "/api/sync"
  }
}
```

---

## 任务管理 API (/api/tasks)

### 获取任务列表
```http
GET /api/tasks?page=1&limit=20&status=PENDING&type=DAILY&assignedTo=USER_ID
```

**查询参数**:
- `page` (number, optional): 页码，默认1
- `limit` (number, optional): 每页数量，默认20
- `status` (string, optional): 任务状态 (PENDING, COMPLETED, CANCELLED)
- `type` (string, optional): 任务类型 (DAILY, WEEKLY, WEEKDAYS, WEEKENDS)
- `assignedTo` (string, optional): 分配给的用户ID

**权限**: 所有认证用户

### 创建任务
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "完成数学作业",
  "description": "完成第5章数学练习题",
  "type": "DAILY",
  "category": "STUDY",
  "starCoins": 10,
  "expReward": 20,
  "difficulty": "MEDIUM",
  "assignedTo": "USER_ID",
  "timeLimit": "2025-12-17T18:00:00.000Z",
  "repeatDays": [1, 2, 3, 4, 5]
}
```

**权限**: PARENT

### 获取任务详情
```http
GET /api/tasks/{taskId}
```

**权限**: 任务创建者或分配者

### 更新任务
```http
PUT /api/tasks/{taskId}
Content-Type: application/json

{
  "title": "更新后的任务标题",
  "status": "PENDING"
}
```

**权限**: 任务创建者

### 删除任务
```http
DELETE /api/tasks/{taskId}
```

**权限**: 任务创建者

### 完成任务
```http
POST /api/tasks/{taskId}/complete
Content-Type: application/json

{
  "completionNotes": "任务完成得很好！",
  "completionTime": "2025-12-17T16:30:00.000Z"
}
```

**权限**: CHILD (任务分配者)

### 批量完成任务
```http
POST /api/tasks/batch-complete
Content-Type: application/json

{
  "taskIds": ["task1", "task2", "task3"],
  "completionNotes": "批量完成任务"
}
```

**权限**: CHILD

### 获取今日任务
```http
GET /api/tasks/today?userId=USER_ID
```

**权限**: 所有认证用户

### 获取任务统计
```http
GET /api/tasks/stats?period=week&userId=USER_ID
```

**查询参数**:
- `period` (string): 统计周期 (today, week, month)
- `userId` (string): 用户ID（可选，家长可查看子女统计）

**权限**: 所有认证用户

### 获取任务模板
```http
GET /api/tasks/templates?category=STUDY
```

**权限**: PARENT

---

## 积分系统 API (/api/points)

### 获取用户积分余额
```http
GET /api/points/balance
```

**响应**:
```json
{
  "success": true,
  "data": {
    "balance": 150,
    "totalEarned": 500,
    "totalSpent": 350,
    "lastUpdated": "2025-12-17T02:00:00.000Z"
  }
}
```

### 获取交易记录
```http
GET /api/points/transactions?page=1&limit=20&type=EARNED&period=week
```

**查询参数**:
- `page` (number, optional): 页码
- `limit` (number, optional): 每页数量
- `type` (string, optional): 交易类型 (EARNED, SPENT, PUNISHMENT, REFUND)
- `period` (string, optional): 时间周期

### 奖励星币
```http
POST /api/points/reward
Content-Type: application/json

{
  "targetUserId": "CHILD_USER_ID",
  "amount": 50,
  "description": "优秀表现奖励",
  "relatedType": "task",
  "relatedId": "TASK_ID"
}
```

**权限**: PARENT

### 扣除星币
```http
POST /api/points/deduct
Content-Type: application/json

{
  "targetUserId": "CHILD_USER_ID",
  "amount": 20,
  "description": "惩罚扣除",
  "relatedType": "punishment",
  "relatedId": "PUNISHMENT_ID"
}
```

**权限**: PARENT

### 兑换奖励
```http
POST /api/points/redeem
Content-Type: application/json

{
  "rewardId": "REWARD_ID",
  "cost": 100,
  "description": "兑换游戏时间"
}
```

**权限**: CHILD

### 获取等级信息
```http
GET /api/points/level
```

**响应**:
```json
{
  "success": true,
  "data": {
    "currentLevel": 5,
    "currentExp": 450,
    "expToNext": 100,
    "totalExp": 550,
    "title": "星际探索者",
    "shipName": "勇气号",
    "nextLevelTitle": "星际航行者"
  }
}
```

### 获取等级历史
```http
GET /api/points/level-history?page=1&limit=10
```

### 获取排行榜
```http
GET /api/points/leaderboard?type=level&limit=10
```

**查询参数**:
- `type` (string): 排行榜类型 (level, coins)
- `limit` (number): 返回数量，最大100

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "user": {
        "id": "USER_ID",
        "username": "player1",
        "displayName": "太空小勇士",
        "avatar": "astronaut.png"
      },
      "level": 8,
      "title": "星际舰长",
      "totalExp": 850
    }
  ]
}
```

### 获取积分统计
```http
GET /api/points/stats?period=month
```

---

## 惩罚系统 API (/api/punishments)

### 获取惩罚记录
```http
GET /api/punishments?page=1&limit=20&status=ACTIVE&severity=MEDIUM
```

**查询参数**:
- `status` (string, optional): 状态 (ACTIVE, COMPLETED, WAIVED)
- `severity` (string, optional): 严重程度 (MINOR, MEDIUM, SEVERE)
- `type` (string, optional): 惩罚类型 (DEDUCT_COINS, EXTRA_TASK, RESTRICT_PRIVILEGE)

### 获取惩罚规则
```http
GET /api/punishments/rules?isActive=true&type=DEDUCT_COINS
```

**权限**: PARENT

### 创建惩罚记录
```http
POST /api/punishments
Content-Type: application/json

{
  "targetUserId": "CHILD_USER_ID",
  "taskId": "TASK_ID",
  "ruleId": "RULE_ID",
  "type": "DEDUCT_COINS",
  "reason": "未按时完成任务",
  "severity": "MEDIUM",
  "value": 20
}
```

**权限**: PARENT

### 更新惩罚状态
```http
PUT /api/punishments/{punishmentId}/status
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

**权限**: PARENT

### 创建惩罚规则
```http
POST /api/punishments/rules
Content-Type: application/json

{
  "name": "迟交作业规则",
  "description": "作业迟交扣除星币",
  "type": "DEDUCT_COINS",
  "severity": "MEDIUM",
  "value": 15
}
```

**权限**: PARENT

### 更新惩罚规则
```http
PUT /api/punishments/rules/{ruleId}
Content-Type: application/json

{
  "value": 20,
  "isActive": true
}
```

**权限**: PARENT

### 删除惩罚规则
```http
DELETE /api/punishments/rules/{ruleId}
```

**权限**: PARENT

### 自动检测违规
```http
GET /api/punishments/detect-violations?childUserId=CHILD_USER_ID
```

**权限**: PARENT

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "type": "TASK_INCOMPLETE",
      "reason": "今日有2个重要任务未完成",
      "severity": "MEDIUM",
      "suggestedPunishment": {
        "type": "DEDUCT_COINS",
        "value": 10
      },
      "relatedTasks": [
        {
          "id": "TASK_ID",
          "title": "完成数学作业"
        }
      ]
    }
  ]
}
```

### 获取惩罚统计
```http
GET /api/punishments/stats?period=week
```

---

## 实时同步 API (/api/sync)

### 获取连接统计
```http
GET /api/sync/stats
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalConnections": 3,
    "connectedUsers": 2,
    "userConnections": [
      {
        "userId": "USER_ID",
        "socketCount": 2
      }
    ]
  }
}
```

### 手动触发同步
```http
POST /api/sync/trigger
Content-Type: application/json

{
  "entityTypes": ["task", "punishment"],
  "targetUserId": "USER_ID"
}
```

### 获取同步日志
```http
GET /api/sync/logs?page=1&limit=50&entityType=task&syncStatus=PENDING
```

### 清理同步日志
```http
DELETE /api/sync/logs/cleanup
Content-Type: application/json

{
  "daysToKeep": 30
}
```

**权限**: PARENT

### 解决冲突
```http
POST /api/sync/resolve-conflict
Content-Type: application/json

{
  "logId": "SYNC_LOG_ID",
  "resolution": {
    "strategy": "LAST_WRITE_WINS",
    "chosenValue": "最新数据"
  }
}
```

### 获取设备列表
```http
GET /api/sync/devices
```

### 强制断开设备
```http
POST /api/sync/devices/disconnect
Content-Type: application/json

{
  "deviceId": "DEVICE_ID"
}
```

**权限**: PARENT

---

## WebSocket 事件

### 连接认证
客户端连接时需要提供JWT token：

```javascript
const socket = io('http://localhost:8000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### 事件列表

#### 客户端发送事件

##### 拉取数据
```javascript
socket.emit('sync:pull', {
  lastSyncTime: '2025-12-16T00:00:00.000Z',
  entityTypes: ['task', 'punishment']
});
```

##### 推送数据
```javascript
socket.emit('sync:push', {
  entityType: 'task',
  entityId: 'TASK_ID',
  action: 'UPDATE',
  data: { status: 'COMPLETED' },
  timestamp: new Date(),
  deviceId: 'DEVICE_ID'
});
```

##### 解决冲突
```javascript
socket.emit('sync:resolve-conflict', {
  entityType: 'task',
  entityId: 'TASK_ID',
  resolution: {
    strategy: 'LAST_WRITE_WINS'
  }
});
```

##### 离线数据同步
```javascript
socket.emit('sync:offline-data', {
  offlineData: [...],
  deviceId: 'DEVICE_ID'
});
```

#### 服务器发送事件

##### 连接成功
```javascript
socket.on('connected', (data) => {
  console.log('连接成功', data);
});
```

##### 拉取响应
```javascript
socket.on('sync:pull-response', (data) => {
  console.log('同步数据', data.data);
});
```

##### 推送确认
```javascript
socket.on('sync:push-ack', (data) => {
  console.log('推送成功', data);
});
```

##### 数据更新广播
```javascript
socket.on('sync:update', (data) => {
  console.log('数据更新', data);
});
```

##### 冲突通知
```javascript
socket.on('sync:conflict', (data) => {
  console.log('数据冲突', data);
});
```

##### 离线同步完成
```javascript
socket.on('sync:offline-complete', (data) => {
  console.log('离线同步完成', data);
});
```

##### 错误处理
```javascript
socket.on('sync:error', (data) => {
  console.error('同步错误', data);
});
```

---

## 错误代码

| 错误代码 | HTTP状态码 | 描述 |
|---------|-----------|------|
| `UNAUTHORIZED` | 401 | 未授权访问 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `DUPLICATE_RESOURCE` | 409 | 资源重复 |
| `INSUFFICIENT_BALANCE` | 400 | 积分余额不足 |
| `INVALID_STATUS` | 400 | 无效的状态转换 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `INTERNAL_ERROR` | 500 | 内部服务器错误 |

---

## 使用示例

### JavaScript/Node.js 示例

```javascript
const axios = require('axios');

class StarshipPlanAPI {
  constructor(baseURL = 'http://localhost:8000/api', token = null) {
    this.baseURL = baseURL;
    this.token = token;
  }

  setToken(token) {
    this.token = token;
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // 获取任务列表
  async getTasks(params = {}) {
    const response = await axios.get(`${this.baseURL}/tasks`, {
      headers: this.getAuthHeaders(),
      params
    });
    return response.data;
  }

  // 创建任务
  async createTask(taskData) {
    const response = await axios.post(`${this.baseURL}/tasks`, taskData, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // 完成任务
  async completeTask(taskId, notes = '') {
    const response = await axios.post(`${this.baseURL}/tasks/${taskId}/complete`, {
      completionNotes: notes
    }, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // 获取积分余额
  async getBalance() {
    const response = await axios.get(`${this.baseURL}/points/balance`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }
}

// 使用示例
const api = new StarshipPlanAPI();
api.setToken('your_jwt_token');

// 获取任务列表
api.getTasks({ page: 1, limit: 10 })
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### cURL 示例

```bash
# 登录获取token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"parent1","password":"password123"}'

# 使用token获取任务列表
curl -X GET http://localhost:8000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 创建任务
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "完成数学作业",
    "description": "完成第5章练习题",
    "type": "DAILY",
    "starCoins": 10,
    "assignedTo": "child_user_id"
  }'
```

---

## 开发和测试

### 本地开发
1. 启动后端服务器：`npm run dev`
2. API基础URL：`http://localhost:8000/api`
3. 健康检查：`http://localhost:8000/health`

### 测试用户（种子数据）
- **家长用户**: `parent1` / `password123`
- **儿童用户**: `child1` / `password123`

### 数据库管理
```bash
# 查看数据库
npm run prisma:studio

# 重置数据库
npm run prisma:reset

# 生成种子数据
npm run prisma:seed
```

---

## 版本更新日志

### v1.0.0 (2025-12-17)
- 初始版本发布
- 完整的任务管理API
- 积分和等级系统API
- 惩罚和补救系统API
- WebSocket实时同步服务

---

*最后更新: 2025-12-17*