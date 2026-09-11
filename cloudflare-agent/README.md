# 启效业务 Agent

这是独立于 Cloudflare Pages 的 Cloudflare Agent Worker。它只接收已登录用户的 JWT，并将业务工具调用限制在当前用户可访问的 Supabase 数据范围内。

## 当前阶段

- 已启用：Agent Durable Object、健康检查、用户 JWT 验证、前端跨域白名单、DeepSeek Chat Completions 和工具调用。
- 已启用：线索/SOP 查询；新增线索跟进需要网站确认卡片后才写入。
- 未启用：批量操作、删除、交付、报价确认、权限调整。

## 部署前配置

在 Cloudflare Worker Secret 中设置 DeepSeek API Key：

```text
pnpm exec wrangler secret put DEEPSEEK_API_KEY --name qixiao-business-agent-preview
```

输入 API Key 时终端不会回显。不要把 Key 写入 `.env`、Pages 环境变量、浏览器代码、聊天记录或 Git。

Supabase URL 和 publishable key 可以作为 Worker 变量配置；不要在 Pages、浏览器代码或 Git 中保存 DeepSeek API Key 或 Supabase `service_role` 密钥。

当前第一批工具：

- `search_leads`：按姓名、负责人、状态查询线索。
- `get_dashboard_summary`：统计线索状态。
- `search_sop`：查询当前用户可访问的 SOP。

这些工具全部使用当前用户 JWT 访问 Supabase，受现有 RLS 限制。写入动作只接受服务端重新查询后的线索 ID，并且需要用户确认；不使用 `service_role`。

## 前端接入

Pages 构建时设置：

```text
VITE_CF_AGENT_URL=https://qixiao-business-agent-preview.<你的 workers.dev 域名>
```

先在预览环境验证 `/health`、登录后的查询和确认写入，再考虑正式站。
