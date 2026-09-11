import { useMemo, useState } from 'react'
import { Bubble, Prompts, Sender, Welcome, XProvider } from '@ant-design/x'
import { App as AntApp, Button, Drawer, Tag, Typography } from 'antd'
import { CloseOutlined, RobotOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type ChatMessage = {
  id: string
  role: 'ai' | 'user'
  content: string
}

const generalPrompts = [
  { key: 'todo', label: '查看我今天待跟进的线索', description: '先从待办开始' },
  { key: 'summary', label: '生成今日业务摘要', description: '查看线索、报价和交付进展' },
  { key: 'sop', label: '我该如何操作？', description: '按当前页面查找 SOP' },
]

const promptsByPath: Record<string, typeof generalPrompts> = {
  '/leads': [
    { key: 'pending-leads', label: '查看未跟进线索', description: '按负责人和时间筛选' },
    { key: 'follow-up', label: '给客户添加跟进记录', description: '提交前会向你确认' },
    { key: 'lead-sop', label: '查看线索跟进 SOP', description: '获取下一步操作指引' },
  ],
  '/quotations': [
    { key: 'quote-draft', label: '创建报价草稿', description: '先整理需求，不直接提交' },
    { key: 'quote-progress', label: '查看报价推进情况', description: '聚焦待确认事项' },
    { key: 'quote-sop', label: '查看报价 SOP', description: '按标准流程操作' },
  ],
  '/batches': [
    { key: 'delivery-ready', label: '检查可交付线索', description: '只查询，不改变状态' },
    { key: 'batch-draft', label: '创建交付批次草稿', description: '提交前会向你确认' },
    { key: 'delivery-sop', label: '查看交付 SOP', description: '避免漏项' },
  ],
}

function assistantReply(message: string) {
  return `我已收到：${message}\n\n当前助手已接入安全操作层：查询和草稿类请求会优先处理；涉及新增、修改、交付、删除或权限调整时，我会先展示一张“待确认”卡片，未经你的确认不会写入数据。`
}

export function BusinessAssistant() {
  const location = useLocation()
  const { message: notice } = AntApp.useApp()
  const connected = Boolean(import.meta.env.VITE_CF_AGENT_URL)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const prompts = useMemo(() => promptsByPath[location.pathname] ?? generalPrompts, [location.pathname])

  const submit = async (rawMessage: string) => {
    const text = rawMessage.trim()
    if (!text || sending) return

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setSending(true)

    try {
      const agentUrl = import.meta.env.VITE_CF_AGENT_URL
      if (!agentUrl) {
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'ai', content: assistantReply(text) }])
        return
      }

      const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } }
      if (!data.session?.access_token) throw new Error('请先登录后再使用助手')

      const response = await fetch(`${agentUrl.replace(/\/$/, '')}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ message: text, page: location.pathname }),
      })
      const result = await response.json() as { reply?: string; error?: string }
      if (!response.ok) throw new Error(result.error || '助手暂时无法处理该请求')
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'ai', content: result.reply || assistantReply(text) }])
    } catch (error) {
      const description = error instanceof Error ? error.message : '助手暂时无法处理该请求'
      notice.error(description)
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'ai', content: `未执行任何数据操作：${description}` }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button className="assistant-trigger" type="primary" icon={<ThunderboltOutlined />} onClick={() => setOpen(true)}>业务助手</Button>
      <Drawer
        className="business-assistant-drawer"
        title={<span className="assistant-drawer-title"><RobotOutlined /> 启效业务助手 <Tag color={connected ? 'blue' : 'gold'}>{connected ? '安全模式' : '演示模式'}</Tag></span>}
        closeIcon={<CloseOutlined />}
        open={open}
        onClose={() => setOpen(false)}
        size={480}
        destroyOnHidden={false}
      >
        <XProvider>
          <div className="business-assistant">
            {messages.length === 0 ? <>
              <Welcome
                className="assistant-welcome"
                icon={<RobotOutlined />}
                title="你好，我是你的业务助手"
                description="直接说你想做什么。我会先解释下一步；任何会修改数据的操作都会先请你确认。"
              />
              <Prompts className="assistant-prompts" title="你可以这样说" items={prompts} vertical onItemClick={({ data }) => void submit(String(data.label))} />
            </> : <Bubble.List
              className="assistant-messages"
              autoScroll
              items={messages.map((item) => ({ key: item.id, role: item.role, content: item.content }))}
              role={{
                ai: { placement: 'start', avatar: <RobotOutlined />, typing: { effect: 'fade-in' } },
                user: { placement: 'end' },
              }}
            />}
            {sending && <Bubble loading placement="start" avatar={<RobotOutlined />} content="正在准备安全操作方案…" />}
            <Sender
              value={input}
              onChange={setInput}
              onSubmit={(value) => void submit(value)}
              loading={sending}
              placeholder="例如：查看我今天待跟进的线索"
              suffix={<SendOutlined />}
              footer={<Typography.Text type="secondary">不会直接删除数据、变更权限或确认交付。</Typography.Text>}
            />
          </div>
        </XProvider>
      </Drawer>
    </>
  )
}
