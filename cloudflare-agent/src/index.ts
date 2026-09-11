import { Agent, routeAgentRequest } from 'agents'

export interface Env {
  BUSINESS_ASSISTANT: DurableObjectNamespace
  ALLOWED_ORIGIN: string
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
}

type AgentState = { userId?: string; lastPage?: string; lastMessageAt?: string }

export class BusinessAssistant extends Agent<Env, AgentState> {
  initialState: AgentState = {}
}

const json = (body: unknown, status = 200, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
})

async function getUser(request: Request, env: Env) {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: authorization },
  })
  if (!response.ok) return null
  return response.json() as Promise<{ id: string }>
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    const allowedOrigin = env.ALLOWED_ORIGIN
    if (origin && origin !== allowedOrigin) return json({ error: '来源不被允许' }, 403, allowedOrigin)
    if (request.method === 'OPTIONS') return json({}, 204, allowedOrigin)

    const agentResponse = await routeAgentRequest(request, env)
    if (agentResponse) return agentResponse as Response

    const url = new URL(request.url)
    if (url.pathname === '/health') return json({ ok: true, mode: 'safe-tool-gateway' }, 200, allowedOrigin)
    if (url.pathname !== '/chat' || request.method !== 'POST') return json({ error: '未找到请求地址' }, 404, allowedOrigin)

    const user = await getUser(request, env)
    if (!user) return json({ error: '登录已失效，请重新登录' }, 401, allowedOrigin)

    const body = await request.json() as { message?: string; page?: string }
    if (!body.message?.trim()) return json({ error: '请输入要处理的内容' }, 400, allowedOrigin)

    // 第一版只验证登录身份并返回受控操作说明。后续工具必须逐项接入
    // Supabase Edge Function，并在服务端完成组织、角色和审计校验。
    return json({
      reply: `已识别你的请求：“${body.message.trim()}”。\n\n当前 Agent 已验证登录身份，但尚未启用数据库写工具。下一步会先开放只读查询，再为新增和修改操作增加确认卡片与审计记录。`,
      mode: 'safe-preview',
      userId: user.id,
    }, 200, allowedOrigin)
  },
}
