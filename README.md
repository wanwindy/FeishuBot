# 飞书任务自动日报/周报机器人

一个基于飞书API的智能任务管理机器人，能够自动读取团队成员的任务、评论，结合AI大模型生成结构化的日报和周报，并推送到指定飞书群聊。

## 功能特性

- 🤖 **全自动化**：无需人工干预，自动获取所有已授权用户的任务
- 👥 **多成员支持**：支持多个团队成员的任务统计和汇总
- 📝 **智能总结**：基于豆包大模型AI，智能分析任务进展和评论
- 📅 **定时推送**：支持定时自动推送日报/周报到指定群聊
- 🔄 **Token自动刷新**：自动刷新用户访问令牌，确保长期稳定运行
- 💬 **评论分析**：自动获取任务评论，提供更全面的工作进展信息
- ☁️ **多部署方案**：支持本地部署和Cloudflare Worker云端部署

## 部署方案

### 方案一：本地部署（推荐用于开发测试）

适合开发测试和小规模使用，需要自备服务器或本地环境。

### 方案二：Cloudflare Worker部署（推荐用于生产环境）

适合生产环境使用，具有以下优势：
- 🌐 **全球分布式**：Cloudflare Worker 在全球 200+ 个数据中心运行
- ⚡ **高性能**：基于 V8 引擎，启动时间 < 1ms
- 💰 **免费额度**：每天 100,000 次请求免费
- 🔒 **安全可靠**：企业级安全防护
- 📅 **定时触发**：支持 Cron 定时任务
- 🗄️ **KV存储**：持久化存储用户Token

详细部署指南请参考：[Cloudflare Worker 部署指南](./CLOUDFLARE_DEPLOY.md)

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   飞书OAuth2    │    │   任务数据获取   │    │   AI智能总结     │
│   用户授权      │───▶│   评论数据获取   │───▶│   豆包大模型     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Token管理     │    │   数据分组处理   │    │   群聊推送      │
│   自动刷新      │    │   按用户日期     │    │   定时任务      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 快速开始

### 本地部署

#### 1. 环境要求

- Python 3.7+
- 飞书开发者账号
- 豆包大模型API密钥

#### 2. 安装依赖

```bash
# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate

# 安装依赖包
pip install -r requirements.txt
```

#### 3. 飞书应用配置

1. 登录[飞书开放平台](https://open.feishu.cn/)
2. 创建应用，获取 `app_id` 和 `app_secret`
3. 配置应用权限：
   - `task:read` - 读取任务权限
   - `contact:read` - 读取用户信息权限
   - `message:send` - 发送消息权限
4. 发布应用

#### 4. 配置文件

创建 `config.py` 文件：

```python
class config:
    # 飞书应用配置
    FEISHU_APP_ID = "your_app_id"
    FEISHU_APP_SECRET = "your_app_secret"
    
    # 任务清单ID
    TASKLIST_GUID = "your_tasklist_guid"
    
    # 目标群聊ID
    TARGET_CHAT_ID = "your_chat_id"
    
    # 豆包大模型配置
    DOUBAO_API_KEY = "your_doubao_api_key"
    DOUBAO_BASE_URL = "https://api.doubao.com/v1/chat/completions"
    DOUBAO_MODEL = "doubao-pro"
```

#### 5. 使用方法

```bash
# 1. 用户授权
python auth_server.py

# 2. 手动测试
python main.py

# 3. 定时推送
python push_scheduler.py
```

### Cloudflare Worker部署

#### 1. 安装Wrangler CLI

```bash
npm install -g wrangler
```

#### 2. 登录Cloudflare

```bash
wrangler login
```

#### 3. 创建KV命名空间

```bash
wrangler kv:namespace create "TOKEN_STORE"
wrangler kv:namespace create "TOKEN_STORE" --preview
```

#### 4. 配置环境变量

在Cloudflare Dashboard中设置环境变量：
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `TASKLIST_GUID`
- `TARGET_CHAT_ID`
- `DOUBAO_API_KEY`

#### 5. 部署

```bash
wrangler deploy
```

#### 6. 配置定时触发器

在Cloudflare Dashboard中配置Cron触发器：
```bash
# 每天上午9点执行
0 9 * * *
```

详细步骤请参考：[Cloudflare Worker 部署指南](./CLOUDFLARE_DEPLOY.md)

## 文件结构

```
FeishuBot/
├── README.md                    # 项目说明文档
├── CLOUDFLARE_DEPLOY.md         # Cloudflare Worker部署指南
├── config.py                    # 配置文件
├── main.py                      # 主程序（本地部署）
├── auth_server.py               # 用户授权服务（本地部署）
├── token_store.py               # Token管理（本地部署）
├── push_scheduler.py            # 定时推送服务（本地部署）
├── worker.js                    # Cloudflare Worker主程序
├── wrangler.toml                # Cloudflare Worker配置
├── auth.html                    # 授权页面（Cloudflare Worker）
├── token.json                   # 用户Token存储（自动生成）
└── requirements.txt             # 依赖包列表
```

## 核心功能详解

### 任务数据获取

- 使用飞书任务API获取指定任务清单下的所有任务
- 支持分页获取，确保获取完整数据
- 自动处理任务分配者、关注者等角色信息

### 评论数据获取

- 优先使用任务分配者的访问令牌获取评论
- 避免权限问题导致的评论获取失败
- 支持多用户评论的完整获取

### AI智能总结

- 基于豆包大模型进行任务内容分析
- 生成结构化的日报和周报格式
- 包含任务进展、计划、描述摘要等信息

### Token自动管理

- 自动刷新过期的访问令牌
- 支持多用户Token的批量管理
- 确保定时任务的稳定运行

## 输出示例

### 原始数据输出
```
【张三】
所有任务：
- 完成用户界面设计（✅已完成，日期:2024-01-15）
  描述：设计新的用户登录界面
  评论：设计稿已通过评审 | 需要调整按钮样式

- 数据库优化（❌未完成，日期:2024-01-20）
  描述：优化查询性能
  评论：正在分析慢查询日志
```

### AI总结输出
```
📊 团队日报 - 2024年1月15日

👤 张三
✅ 已完成：
• 用户界面设计：设计稿已通过评审，需要调整按钮样式

🔄 进行中：
• 数据库优化：正在分析慢查询日志，预计1月20日完成

📋 今日计划：
• 继续数据库优化工作
• 调整UI设计中的按钮样式
```

## 故障排除

### 常见问题

1. **Token过期**
   - 系统会自动刷新Token
   - 如果刷新失败，需要重新授权用户

2. **任务获取失败**
   - 检查任务清单ID是否正确
   - 确认用户是否有任务读取权限

3. **评论获取失败**
   - 检查任务分配者的Token是否有效
   - 确认用户是否有评论读取权限

4. **推送失败**
   - 检查群聊ID是否正确
   - 确认机器人是否已加入群聊

### 调试模式

在 `main.py` 中可以看到详细的调试输出，包括：
- API请求和响应
- 任务和评论获取过程
- 数据处理和分组结果

## 扩展功能

### 自定义推送时间

#### 本地部署
修改 `push_scheduler.py` 中的定时配置：

```python
# 每天18:30推送
scheduler.add_job(job, 'cron', hour=18, minute=30)

# 每周一9:00推送周报
scheduler.add_job(job, 'cron', day_of_week='mon', hour=9, minute=0)
```

#### Cloudflare Worker部署
在Cloudflare Dashboard中修改Cron触发器：

```bash
# 每天18:30推送
30 18 * * *

# 每周一9:00推送周报
0 9 * * 1
```

### 自定义AI总结格式

修改AI提示词，定制总结格式和内容。

### 多任务清单支持

扩展代码支持多个任务清单的并行处理。

## 成本对比

| 部署方案 | 成本 | 适用场景 |
|----------|------|----------|
| 本地部署 | 服务器成本 | 开发测试、小规模使用 |
| Cloudflare Worker | 免费额度充足 | 生产环境、大规模使用 |

Cloudflare Worker免费额度：
- 每天 100,000 次请求
- 每天 10,000,000 CPU-milliseconds
- 每天 100,000 次KV读取，1,000 次写入

## 贡献指南

欢迎提交Issue和Pull Request来改进项目！

## 联系方式

**邮箱**: wanwindy@163.com

如有问题或建议，请通过Issue联系。 