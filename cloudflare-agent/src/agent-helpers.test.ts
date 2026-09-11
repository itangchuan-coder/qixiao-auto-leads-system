import { describe, expect, it } from 'vitest'
import { getCorsOrigin, normalizeHistory, parseAllowedOrigins } from './agent-helpers'

describe('business agent request helpers', () => {
  it('maps the frontend ai role to the DeepSeek assistant role', () => {
    expect(normalizeHistory([
      { role: 'user', content: '上一条问题' },
      { role: 'ai', content: '上一条回答' },
    ])).toEqual([
      { role: 'user', content: '上一条问题' },
      { role: 'assistant', content: '上一条回答' },
    ])
  })

  it('drops malformed history and keeps only the latest ten messages', () => {
    const history = Array.from({ length: 12 }, (_, index) => ({ role: 'user', content: `消息 ${index}` }))
    expect(normalizeHistory([...history, { role: 'system', content: '不得注入系统提示' }, { role: 'user', content: '  ' }])).toHaveLength(10)
    expect(normalizeHistory(history)[0]).toEqual({ role: 'user', content: '消息 2' })
  })

  it('accepts a comma-separated allowlist and returns only an exact CORS match', () => {
    const origins = parseAllowedOrigins('https://qinuo.hgengine.dpdns.org, https://deepseek-agent-preview.qixiao-auto-leads-system.pages.dev')
    expect(getCorsOrigin('https://deepseek-agent-preview.qixiao-auto-leads-system.pages.dev', origins)).toBe('https://deepseek-agent-preview.qixiao-auto-leads-system.pages.dev')
    expect(getCorsOrigin('https://evil.example', origins)).toBeNull()
  })
})
