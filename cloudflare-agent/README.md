# 启效业务 Agent

这是独立于 Cloudflare Pages 的 Cloudflare Agent Worker。它只接收已登录用户的 JWT，并将业务操作逐项委托给受控的 Supabase Edge Function。

## 当前阶段

- 已启用：Agent Durable Object、健康检查、用户 JWT 验证、前端跨域白名单。
- 未启用：数据库读取、数据库写入、批量操作、删除、权限调整。

## 部署前配置

在 Cloudflare Worker Secret 中设置：

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

发布后，把 Worker 地址写入 Pages 的 `VITE_CF_AGENT_URL` 环境变量。不要在 Pages、浏览器代码或 Git 中保存 Supabase `service_role` 密钥。
