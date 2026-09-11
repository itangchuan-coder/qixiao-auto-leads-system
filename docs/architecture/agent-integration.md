# 业务助手集成架构

## 目标

在不改变现有 Ant Design 6 页面结构和 Supabase 权限边界的前提下，增加一个网站内业务助手。助手使用 Ant Design X 呈现对话，Cloudflare Agent 负责会话和工具编排，Supabase 负责真实业务数据。

## 当前实现边界

- 前端入口：顶部“业务助手”按钮。
- 前端组件：`@ant-design/x` 的 `Welcome`、`Prompts`、`Bubble.List` 和 `Sender`。
- 连接协议：可选的 `VITE_CF_AGENT_URL`，请求携带当前 Supabase 用户 JWT。
- Agent Worker：`cloudflare-agent/`，验证用户身份后调用 DeepSeek，并通过受控工具访问 Supabase。
- 数据写入：仅开放“新增跟进记录”这一条确认式写入；服务端会用当前用户 JWT 再次校验线索可见性和组织范围。

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

当前已接入 `search_leads`、`get_dashboard_summary`、`search_sop` 和确认式 `add_lead_follow_up`。下一步再逐个增加报价草稿、交付批次草稿等工具；每个工具都必须有参数校验、角色边界、确认等级和审计记录，不在浏览器或模型上下文中暴露 `service_role`。

## 请求链路

```text
Ant Design X → Pages 前端 → Worker /chat → DeepSeek tool call
                                      ↘ Supabase REST（当前用户 JWT + RLS）
Worker /chat/confirm → 服务端复查线索 → lead_follow_ups 写入
```
