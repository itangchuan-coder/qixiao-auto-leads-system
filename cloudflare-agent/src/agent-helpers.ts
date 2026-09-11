export type FrontendHistoryMessage = { role: 'user' | 'ai' | 'assistant'; content: string }
export type NormalizedHistoryMessage = { role: 'user' | 'assistant'; content: string }

export function normalizeHistory(history: unknown): NormalizedHistoryMessage[] {
  if (!Array.isArray(history)) return []
  return history
    .filter((item): item is FrontendHistoryMessage => {
      if (!item || typeof item !== 'object') return false
      const candidate = item as Record<string, unknown>
      return (candidate.role === 'user' || candidate.role === 'ai' || candidate.role === 'assistant')
        && typeof candidate.content === 'string'
        && candidate.content.trim().length > 0
    })
    .slice(-10)
    .map((item) => ({ role: item.role === 'user' ? 'user' : 'assistant', content: item.content.trim() }))
}

export function parseAllowedOrigins(value: string | undefined): string[] {
  return (value ?? '').split(',').map((origin) => origin.trim()).filter(Boolean)
}

export function getCorsOrigin(origin: string, allowedOrigins: string[]): string | null {
  if (!origin) return allowedOrigins[0] ?? null
  return allowedOrigins.includes(origin) ? origin : null
}
