# Cloudflare Worker 部署指南

本指南将详细介绍如何在 Cloudflare Worker 中部署飞书任务自动日报/周报机器人。

## 部署优势

- 🌐 **全球分布式**：Cloudflare Worker 在全球 200+ 个数据中心运行
- ⚡ **高性能**：基于 V8 引擎，启动时间 < 1ms
- 💰 **免费额度**：每天 100,000 次请求免费
- 🔒 **安全可靠**：企业级安全防护
- 📅 **定时触发**：支持 Cron 定时任务
- 🗄️ **KV存储**：持久化存储用户Token

## 前置要求

1. **Cloudflare 账号**：注册 [Cloudflare](https://dash.cloudflare.com/) 账号
2. **飞书开发者账号**：在 [飞书开放平台](https://open.feishu.cn/) 创建应用
3. **豆包API密钥**：获取豆包大模型API访问密钥
4. **Wrangler CLI**：Cloudflare Worker 命令行工具

## 安装 Wrangler CLI

```bash
# 使用 npm 安装
npm install -g wrangler

# 或使用 yarn
yarn global add wrangler
```

## 登录 Cloudflare

```bash
wrangler login
```

按照提示在浏览器中完成登录。

## 创建 KV 命名空间

```bash
# 创建生产环境 KV 命名空间
wrangler kv:namespace create "TOKEN_STORE"

# 创建预览环境 KV 命名空间
wrangler kv:namespace create "TOKEN_STORE" --preview
```

记录返回的 ID，更新 `wrangler.toml` 文件：

```toml
[[kv_namespaces]]
binding = "TOKEN_STORE"
id = "你的生产环境KV_ID"
preview_id = "你的预览环境KV_ID"
```

## 配置环境变量

在 Cloudflare Dashboard 中设置环境变量：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages
3. 选择你的 Worker
4. 进入 Settings > Variables
5. 添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `FEISHU_APP_ID` | 飞书应用ID | `cli_xxx` |
| `FEISHU_APP_SECRET` | 飞书应用密钥 | `xxx` |
| `TASKLIST_GUID` | 任务清单ID | `xxx` |
| `TARGET_CHAT_ID` | 目标群聊ID | `oc_xxx` |
| `DOUBAO_API_KEY` | 豆包API密钥 | `xxx` |

## 部署 Worker

### 方法一：使用 Wrangler CLI

```bash
# 部署到生产环境
wrangler deploy

# 部署到预览环境
wrangler deploy --env preview
```

### 方法二：使用 GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Wrangler
        run: npm install -g wrangler
        
      - name: Deploy to Cloudflare Workers
        run: wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 配置定时触发器

在 Cloudflare Dashboard 中配置 Cron 触发器：

1. 进入 Worker 的 Triggers 页面
2. 添加 Cron 触发器
3. 设置执行时间（Cron 表达式）：

```bash
# 每天上午9点执行
0 9 * * *

# 每天下午6点执行
0 18 * * *

# 每周一上午9点执行
0 9 * * 1
```

## 用户授权流程

### 1. 访问授权页面

用户访问：`https://your-worker.your-subdomain.workers.dev/auth`

### 2. 点击授权按钮

用户点击"点击授权飞书账号"按钮，跳转到飞书授权页面。

### 3. 完成授权

用户在飞书页面完成授权，系统自动获取并存储用户Token。

### 4. 授权成功

显示授权成功页面，用户账号已添加到机器人中。

## 测试部署

### 1. 健康检查

```bash
curl https://your-worker.your-subdomain.workers.dev/health
```

应该返回：`OK`

### 2. 手动触发推送

```bash
curl https://your-worker.your-subdomain.workers.dev/trigger
```

### 3. 查看日志

在 Cloudflare Dashboard 的 Workers 页面查看实时日志。

## 监控和维护

### 1. 查看 Worker 状态

在 Cloudflare Dashboard 中：
- **Analytics**：查看请求量、错误率等指标
- **Logs**：查看实时日志
- **Settings**：管理环境变量和配置

### 2. 错误排查

常见错误及解决方案：

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `KV namespace not found` | KV命名空间配置错误 | 检查 `wrangler.toml` 中的 KV ID |
| `Environment variable not found` | 环境变量未设置 | 在 Dashboard 中设置环境变量 |
| `Cron trigger not working` | 定时触发器配置错误 | 检查 Cron 表达式格式 |
| `Token refresh failed` | Token刷新失败 | 用户需要重新授权 |

### 3. 性能优化

- **减少API调用**：合理设置延迟，避免触发飞书API限制
- **优化代码**：减少不必要的计算和网络请求
- **监控资源使用**：关注CPU时间和内存使用

## 安全考虑

### 1. 环境变量安全

- 不要在代码中硬编码敏感信息
- 使用 Cloudflare 的环境变量功能
- 定期轮换API密钥

### 2. 访问控制

- 限制授权页面的访问
- 监控异常访问模式
- 定期清理无效Token

### 3. 数据保护

- Token存储在 Cloudflare KV 中，自动加密
- 定期清理过期的用户数据
- 遵守数据保护法规

## 扩展功能

### 1. 自定义域名

```bash
# 添加自定义域名
wrangler domain add your-domain.com
```

### 2. 多环境部署

```bash
# 创建不同环境
wrangler deploy --env staging
wrangler deploy --env production
```

### 3. 集成监控

- 集成 Sentry 进行错误监控
- 使用 Cloudflare Analytics 进行性能监控
- 设置告警通知

## 故障排除

### 1. 部署失败

```bash
# 检查配置
wrangler whoami
wrangler kv:namespace list

# 重新部署
wrangler deploy --force
```

### 2. 运行时错误

- 查看 Cloudflare Dashboard 中的日志
- 检查环境变量是否正确设置
- 验证飞书API权限配置

### 3. 定时任务不执行

- 检查 Cron 表达式格式
- 确认 Worker 状态正常
- 查看定时触发器配置

## 成本估算

Cloudflare Worker 免费额度：
- **请求数**：每天 100,000 次
- **CPU时间**：每天 10,000,000 CPU-milliseconds
- **KV存储**：每天 100,000 次读取，1,000 次写入

对于小型团队（< 50人），免费额度通常足够使用。

## 总结

通过 Cloudflare Worker 部署飞书任务机器人，你可以获得：

✅ **高可用性**：全球分布式部署  
✅ **低成本**：免费额度满足大部分需求  
✅ **易维护**：自动扩缩容，无需服务器管理  
✅ **安全性**：企业级安全防护  
✅ **灵活性**：支持多种触发方式  

按照本指南部署后，你的飞书任务机器人将在 Cloudflare 的全球网络上稳定运行，为团队提供自动化的日报/周报服务。 