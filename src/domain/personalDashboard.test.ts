import { buildPersonalDashboard } from './helpers'
import { initialCustomerProjects, initialDealBaseRecords, initialQuotations } from './mockData'

const dashboard = buildPersonalDashboard({
  owner: '运营A',
  customerProjects: initialCustomerProjects,
  quotations: initialQuotations,
  dealBaseRecords: initialDealBaseRecords,
})

if (dashboard.projectCount !== 2) {
  throw new Error(`运营A应负责 2 个客户项目，实际为 ${dashboard.projectCount}`)
}

if (dashboard.totalProjectAmount !== 43200) {
  throw new Error(`运营A项目金额应为 43200，实际为 ${dashboard.totalProjectAmount}`)
}

if (dashboard.advanceRiskCount !== 1) {
  throw new Error(`运营A应有 1 条垫付风险，实际为 ${dashboard.advanceRiskCount}`)
}

if (dashboard.taskProgressPercent <= 0 || dashboard.taskProgressPercent > 100) {
  throw new Error(`任务完成进度应在 1-100 之间，实际为 ${dashboard.taskProgressPercent}`)
}
