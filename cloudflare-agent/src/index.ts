import { Agent, routeAgentRequest } from 'agents'
import { getCorsOrigin, normalizeHistory, parseAllowedOrigins } from './agent-helpers'

export interface Env {
  BUSINESS_ASSISTANT: DurableObjectNamespace
  ALLOWED_ORIGIN: string
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  DEEPSEEK_API_KEY?: string
  DEEPSEEK_MODEL?: string
  DEEPSEEK_BASE_URL?: string
}

type AgentState = { userId?: string; lastPage?: string; lastMessageAt?: string }
type ChatRole = 'user' | 'assistant'
type HistoryMessage = { role: ChatRole; content: string }
type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } }
type PendingAction = { type: 'add_lead_follow_up'; lead_id: string; content: string; summary: string }
type AgentResult = { reply: string; pendingAction?: PendingAction }
type DeepSeekMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

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

const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'search_leads',
      description: '查询当前登录用户所属组织内的销售线索。只读，不改变数据。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '客户姓名或业务编号关键词，可为空' },
          status: { type: 'string', enum: ['new', 'pending_clean', 'valid', 'duplicate', 'delivered', 'invalid'], description: '线索状态，可为空' },
          owner: { type: 'string', description: '负责人名称关键词，可为空' },
          limit: { type: 'integer', minimum: 1, maximum: 20, description: '最多返回条数，默认 10' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_summary',
      description: '统计当前登录用户所属组织的线索状态数量。只读，不改变数据。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_sop',
      description: '搜索当前组织可以访问的 SOP 文档。只读，不改变数据。',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '标题或摘要关键词，可为空' },
          audience: { type: 'string', enum: ['supervisor', 'operator', 'shared'], description: '适用对象，可为空' },
          limit: { type: 'integer', minimum: 1, maximum: 10, description: '最多返回条数，默认 5' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_lead_follow_up',
      description: '准备给指定线索新增一条跟进记录。必须先返回待确认动作，不能直接写入数据库。',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: '线索 UUID；如果没有，先使用 search_leads 查找' },
          content: { type: 'string', description: '跟进记录内容' },
        },
        required: ['lead_id', 'content'],
        additionalProperties: false,
      },
    },
  },
]

const systemPrompt = `你是“启效智联汽车销售线索管理系统”的业务助手。
你必须使用中文，回答简洁、直接、可执行。
你只能调用已提供的业务工具，不能执行 SQL，不能猜测组织、角色或数据。
查询可以直接执行；新增跟进只能生成待确认动作，必须等用户在网站确认卡片中点击“确认执行”后才写入数据库。
删除、批量修改、交付、报价确认或权限调整目前不支持，要明确说明未执行。
手机号等个人信息只展示脱敏结果。
查询结果要用清晰的小标题和列表，不要暴露内部 token、数据库错误详情或系统密钥。`

const clampLimit = (value: unknown, fallback: number, maximum: number) => {
  const number = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback
  return Math.max(1, Math.min(maximum, number))
}

const maskPhone = (value: string | null | undefined) => {
  if (!value) return ''
  if (value.length <= 7) return `${value.slice(0, 2)}****`
  return `${value.slice(0, 3)}****${value.slice(-2)}`
}

async function getUser(request: Request, env: Env) {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: authorization },
  })
  if (!response.ok) return null
  return response.json() as Promise<{ id: string; email?: string }>
}

async function supabaseRequest<T>(env: Env, authorization: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: authorization,
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) throw new Error(`Supabase 查询失败（${response.status}）`)
  const body = await response.text()
  return (body ? JSON.parse(body) : undefined) as T
}

async function supabaseCount(env: Env, authorization: string, path: string) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method: 'HEAD',
    headers: {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: authorization,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  })
  if (!response.ok && response.status !== 206) throw new Error(`Supabase 统计失败（${response.status}）`)
  const total = response.headers.get('content-range')?.split('/').at(-1)
  return total && total !== '*' ? Number(total) : 0
}

async function executeTool(name: string, args: Record<string, unknown>, env: Env, authorization: string) {
  if (name === 'search_leads') {
    const params = new URLSearchParams({
      select: 'id,business_no,name,phone,city,interested_brand,interested_model,status,owner_label,source,created_at,updated_at',
      order: 'created_at.desc',
      limit: String(clampLimit(args.limit, 10, 20)),
    })
    const query = typeof args.query === 'string' ? args.query.trim() : ''
    const owner = typeof args.owner === 'string' ? args.owner.trim() : ''
    if (query) params.set('name', `ilike.*${query.replaceAll('*', '')}*`)
    if (owner) params.set('owner_label', `ilike.*${owner.replaceAll('*', '')}*`)
    if (typeof args.status === 'string') params.set('status', `eq.${args.status}`)

    const rows = await supabaseRequest<Array<Record<string, unknown>>>(env, authorization, `leads?${params}`)
    return {
      count: rows.length,
      items: rows.map((row) => ({
        ...row,
        phone: undefined,
        phone_masked: maskPhone(typeof row.phone === 'string' ? row.phone : undefined),
      })),
    }
  }

  if (name === 'get_dashboard_summary') {
    const statuses = ['new', 'pending_clean', 'valid', 'duplicate', 'delivered', 'invalid']
    const counts = await Promise.all(statuses.map(async (status) => [status, await supabaseCount(env, authorization, `leads?select=id&status=eq.${status}`)] as const))
    return { total: counts.reduce((sum, [, count]) => sum + count, 0), by_status: Object.fromEntries(counts) }
  }

  if (name === 'search_sop') {
    const params = new URLSearchParams({
      select: 'id,business_no,title,audience,version,summary,published_at',
      order: 'published_at.desc.nullslast,updated_at.desc',
      limit: String(clampLimit(args.limit, 5, 10)),
    })
    const keyword = typeof args.keyword === 'string' ? args.keyword.trim() : ''
    if (keyword) params.set('title', `ilike.*${keyword.replaceAll('*', '')}*`)
    if (typeof args.audience === 'string') params.set('audience', `eq.${args.audience}`)
    return { items: await supabaseRequest<Array<Record<string, unknown>>>(env, authorization, `sop_documents?${params}`) }
  }

  if (name === 'add_lead_follow_up') {
    const leadId = typeof args.lead_id === 'string' ? args.lead_id.trim() : ''
    const content = typeof args.content === 'string' ? args.content.trim() : ''
    if (!leadId || !content) throw new Error('缺少线索或跟进内容')
    if (content.length > 1000) throw new Error('跟进内容不能超过 1000 个字符')

    const leads = await supabaseRequest<Array<{ id: string; name: string; business_no: string }>>(
      env,
      authorization,
      `leads?id=eq.${encodeURIComponent(leadId)}&select=id,name,business_no&limit=1`,
    )
    const lead = leads[0]
    if (!lead) throw new Error('找不到这条线索，或你没有访问权限')
    return {
      status: 'pending_confirmation',
      action: { type: 'add_lead_follow_up', lead_id: lead.id, content, summary: `给「${lead.name}」(${lead.business_no}) 添加跟进记录：${content}` },
    }
  }

  throw new Error(`不支持的工具：${name}`)
}

async function callDeepSeek(env: Env, messages: DeepSeekMessage[]) {
  if (!env.DEEPSEEK_API_KEY) throw new Error('DeepSeek API Key 尚未配置')
  const response = await fetch(`${env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com'}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL ?? 'deepseek-chat',
      messages,
      tools: toolDefinitions,
      tool_choice: 'auto',
      max_tokens: 1400,
    }),
  })
  const payload = await response.json() as { choices?: Array<{ message?: DeepSeekMessage }>; error?: { message?: string } }
  if (!response.ok) throw new Error(payload.error?.message || `DeepSeek 请求失败（${response.status}）`)
  const message = payload.choices?.[0]?.message
  if (!message) throw new Error('DeepSeek 未返回有效内容')
  return message
}

async function runDeepSeekAgent(env: Env, authorization: string, message: string, history: HistoryMessage[]): Promise<AgentResult> {
  const messages: DeepSeekMessage[] = [
    { role: 'system', content: systemPrompt },
    ...normalizeHistory(history).map((item) => ({ role: item.role, content: item.content }) satisfies DeepSeekMessage),
    { role: 'user', content: message },
  ]

  for (let round = 0; round < 4; round += 1) {
    const responseMessage = await callDeepSeek(env, messages)
    if (!responseMessage.tool_calls?.length) return { reply: responseMessage.content || '我暂时没有生成有效回复。' }

    messages.push(responseMessage)
    for (const toolCall of responseMessage.tool_calls) {
      let result: unknown
      try {
        const args = JSON.parse(toolCall.function.arguments || '{}') as Record<string, unknown>
        result = await executeTool(toolCall.function.name, args, env, authorization)
      } catch (error) {
        result = { error: error instanceof Error ? error.message : '工具执行失败' }
      }
      if (typeof result === 'object' && result !== null && 'status' in result && result.status === 'pending_confirmation' && 'action' in result) {
        return { reply: '我已经准备好这项操作，请核对下面的内容后确认。', pendingAction: result.action as PendingAction }
      }
      messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result) })
    }
  }

  return { reply: '查询步骤过多，我先停止本次操作。你可以把问题拆成更小的一步再试。' }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGIN)
    const corsOrigin = getCorsOrigin(origin, allowedOrigins)
    if (origin && !corsOrigin) return json({ error: '来源不被允许' }, 403, allowedOrigins[0] ?? '')
    if (request.method === 'OPTIONS') return json({}, 204, corsOrigin ?? allowedOrigins[0] ?? '')

    const url = new URL(request.url)
    if (url.pathname === '/health') return json({ ok: true, mode: 'deepseek-tools', deepseekConfigured: Boolean(env.DEEPSEEK_API_KEY) }, 200, corsOrigin ?? allowedOrigins[0] ?? '')
    if (url.pathname === '/chat') {
      if (request.method !== 'POST') return json({ error: '仅支持 POST' }, 405, corsOrigin ?? allowedOrigins[0] ?? '')

      const authorization = request.headers.get('Authorization')
      const user = await getUser(request, env)
      if (!authorization || !user) return json({ error: '登录已失效，请重新登录' }, 401, corsOrigin ?? allowedOrigins[0] ?? '')

      const body = await request.json() as { message?: string; page?: string; history?: HistoryMessage[] }
      if (!body.message?.trim()) return json({ error: '请输入要处理的内容' }, 400, corsOrigin ?? allowedOrigins[0] ?? '')

      try {
        const result = await runDeepSeekAgent(env, authorization, body.message.trim(), body.history ?? [])
        return json({ ...result, mode: 'deepseek-tools', userId: user.id }, 200, corsOrigin ?? allowedOrigins[0] ?? '')
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'AI 助手暂时不可用' }, 503, corsOrigin ?? allowedOrigins[0] ?? '')
      }
    }

    if (url.pathname === '/chat/confirm') {
      if (request.method !== 'POST') return json({ error: '仅支持 POST' }, 405, corsOrigin ?? allowedOrigins[0] ?? '')
      const authorization = request.headers.get('Authorization')
      const user = await getUser(request, env)
      if (!authorization || !user) return json({ error: '登录已失效，请重新登录' }, 401, corsOrigin ?? allowedOrigins[0] ?? '')
      const body = await request.json() as { action?: PendingAction }
      const action = body.action
      if (!action || action.type !== 'add_lead_follow_up') return json({ error: '不支持的确认动作' }, 400, corsOrigin ?? allowedOrigins[0] ?? '')
      const content = action.content?.trim()
      if (!action.lead_id || !content || content.length > 1000) return json({ error: '确认内容不符合要求' }, 400, corsOrigin ?? allowedOrigins[0] ?? '')

      const leads = await supabaseRequest<Array<{ id: string; name: string; business_no: string; organization_id: string }>>(
        env,
        authorization,
        `leads?id=eq.${encodeURIComponent(action.lead_id)}&select=id,name,business_no,organization_id&limit=1`,
      )
      const lead = leads[0]
      if (!lead) return json({ error: '找不到这条线索，或你没有访问权限' }, 404, corsOrigin ?? allowedOrigins[0] ?? '')
      await supabaseRequest(env, authorization, 'lead_follow_ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ organization_id: lead.organization_id, lead_id: lead.id, content, operator_id: user.id }),
      })
      return json({ ok: true, message: `已为「${lead.name}」添加跟进记录。` }, 200, corsOrigin ?? allowedOrigins[0] ?? '')
    }

    const agentResponse = await routeAgentRequest(request, env)
    if (agentResponse) return agentResponse
    return json({ error: '未找到请求地址' }, 404, corsOrigin ?? allowedOrigins[0] ?? '')
  },
}
