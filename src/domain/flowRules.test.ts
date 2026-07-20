import { describe, expect, it } from 'vitest'
import {
  canEditLead,
  canTransitionCustomerProjectStatus,
  canTransitionDealBaseStatus,
  canTransitionLeadStatus,
  canTransitionQuotationStatus,
  getIneligibleDeliveryLeadIds,
} from './helpers'

describe('线索流程规则', () => {
  it('不允许其他角色编辑线索', () => {
    expect(canEditLead('other')).toBe(false)
    expect(canEditLead('operator')).toBe(true)
    expect(canEditLead('supervisor')).toBe(true)
  })

  it('不允许从终态重新流转线索', () => {
    expect(canTransitionLeadStatus('delivered', 'valid')).toBe(false)
    expect(canTransitionLeadStatus('invalid', 'pending_clean')).toBe(false)
    expect(canTransitionLeadStatus('pending_clean', 'valid')).toBe(true)
  })

  it('仅允许客户项目按既定步骤流转', () => {
    expect(canTransitionCustomerProjectStatus('pending', 'active')).toBe(true)
    expect(canTransitionCustomerProjectStatus('settled', 'active')).toBe(false)
  })

  it('仅允许报价按既定步骤流转', () => {
    expect(canTransitionQuotationStatus('sourcing', 'quoted')).toBe(true)
    expect(canTransitionQuotationStatus('archived', 'new')).toBe(false)
  })

  it('仅允许成交产能按既定步骤流转', () => {
    expect(canTransitionDealBaseStatus('reserved', 'delivered')).toBe(true)
    expect(canTransitionDealBaseStatus('success', 'available')).toBe(false)
  })

  it('仅允许有效线索进入交付批次', () => {
    const leads = [
      { id: 'L001', status: 'valid' as const },
      { id: 'L002', status: 'duplicate' as const },
      { id: 'L003', status: 'delivered' as const },
      { id: 'L004', status: 'invalid' as const },
    ]

    expect(getIneligibleDeliveryLeadIds(leads, ['L001', 'L002', 'L003', 'L004'])).toEqual([
      'L002',
      'L003',
      'L004',
    ])
  })
})
