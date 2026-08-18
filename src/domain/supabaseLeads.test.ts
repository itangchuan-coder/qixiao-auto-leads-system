import { describe, expect, it } from 'vitest'
import { mapRemoteLead, normalizePhone } from './supabaseLeads'

describe('Supabase 线索转换', () => {
  it('normalizes a phone number before duplicate matching', () => {
    expect(normalizePhone('138-0013-8001')).toBe('13800138001')
  })

  it('maps database field names and follow-ups to the page model', () => {
    const lead = mapRemoteLead({
      id: 'lead-id', name: '陈先生', phone: '13800138001', city: '上海', interested_brand: '问界', interested_model: 'M9', budget: '40万',
      purchase_timeframe: 'within_30_days', source: '官网', status: 'valid', owner_label: '运营A', note: '已确认', created_at: '2026-08-18T06:00:00.000Z',
      lead_follow_ups: [{ id: 'follow-up-id', content: '已联系', followed_at: '2026-08-18T06:10:00.000Z', operator: { display_name: '运营A' } }],
    })

    expect(lead).toMatchObject({ id: 'lead-id', interestedBrand: '问界', interestedModel: 'M9', owner: '运营A' })
    expect(lead.followUps).toEqual([expect.objectContaining({ id: 'follow-up-id', operator: '运营A', content: '已联系' })])
  })
})
