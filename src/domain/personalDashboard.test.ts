import { describe, expect, it } from 'vitest'
import { buildPersonalDashboard } from './helpers'
import { initialCustomerProjects, initialDealBaseRecords, initialQuotations } from './mockData'

describe('个人业务驾驶舱', () => {
  it('汇总运营A当前负责的项目、金额和风险', () => {
    const dashboard = buildPersonalDashboard({
      owner: '运营A',
      customerProjects: initialCustomerProjects,
      quotations: initialQuotations,
      dealBaseRecords: initialDealBaseRecords,
    })

    expect(dashboard.projectCount).toBe(1)
    expect(dashboard.totalProjectAmount).toBe(43200)
    expect(dashboard.advanceRiskCount).toBe(0)
    expect(dashboard.taskProgressPercent).toBeGreaterThan(0)
    expect(dashboard.taskProgressPercent).toBeLessThanOrEqual(100)
  })
})
