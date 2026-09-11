# 业务助手集成架构

## 目标

在不改变现有 Ant Design 6 页面结构和 Supabase 权限边界的前提下，增加一个网站内业务助手。助手使用 Ant Design X 呈现对话，Cloudflare Agent 负责会话和工具编排，Supabase 负责真实业务数据。

## 当前实现边界

- 前端入口：顶部“业务助手”按钮。
- 前端组件：`@ant-design/x` 的 `Welcome`、`Prompts`、`Bubble.List` 和 `Sender`。
- 连接协议：可选的 `VITE_CF_AGENT_URL`，请求携带当前 Supabase 用户 JWT。
- Agent Worker：`cloudflare-agent/`，当前只验证用户身份并返回安全预览响应。
- 数据写入：尚未开放，避免未审批的模型输出改变真实数据。

## 工具接入规则

每个业务工具都必须明确声明：

1. 工具名称和用途。
2. 允许的用户角色。
3. 只读、草稿、可逆写入或高风险写入等级。
4. 参数校验和组织范围。
5. 是否需要用户确认。
6. 审计记录内容和幂等键。

禁止提供任意 SQL、任意表名、任意组织 ID、任意删除和任意权限变更工具。

## 下一阶段

先接入只读的 `get_my_context`、`search_leads` 和 `get_dashboard_summary`，再接入需要确认的跟进记录和报价草稿。所有工具均通过 Supabase Edge Function 使用当前用户 JWT 和 RLS，不在浏览器或模型上下文中暴露 `service_role`。
