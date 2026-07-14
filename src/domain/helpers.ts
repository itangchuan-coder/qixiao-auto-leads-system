import dayjs from 'dayjs'
import type {
  AccountPeriod,
  CustomerProject,
  CustomerProjectStatus,
  CustomerProjectType,
  DealBaseRecord,
  DealBaseStatus,
  DeliveryBatch,
  DeliveryTarget,
  Lead,
  LeadStatus,
  PaymentMode,
  PlatformBusinessName,
  PurchaseTimeframe,
  Quotation,
  QuotationContentType,
  QuotationSourceType,
  QuotationStatus,
  RequirementJudgementType,
  SettlementMode,
  SubmissionMethod,
  SupplyContentType,
  SupplyTarget,
  SupplierStatus,
  SupplierType,
  UserRole,
} from './types'

type PersonalDashboardInput = {
  owner: string
  customerProjects: CustomerProject[]
  quotations: Quotation[]
  dealBaseRecords: DealBaseRecord[]
}

const accountPeriodDays: Record<AccountPeriod, number> = {
  cash: 0,
  '7_days': 7,
  '15_days': 15,
  '30_days': 30,
  '45_days': 45,
  '60_days': 60,
}

export const roleLabels: Record<UserRole, string> = {
  admin: '管理员',
  operator: '运营',
  other: '其他角色',
}

export const statusLabels: Record<LeadStatus, string> = {
  new: '新线索',
  pending_clean: '待清洗',
  valid: '有效',
  duplicate: '重复',
  delivered: '已交付',
  invalid: '无效',
}

export const purchaseTimeframeLabels: Record<PurchaseTimeframe, string> = {
  within_7_days: '7天内',
  within_30_days: '30天内',
  within_90_days: '90天内',
  unknown: '未知',
}

export const supplierTypeLabels: Record<SupplierType, string> = {
  channel: '渠道方',
  data: '数据方',
}

export const paymentModeLabels: Record<PaymentMode, string> = {
  prepaid: '预付',
  postpaid: '后付',
}

export const accountPeriodLabels: Record<AccountPeriod, string> = {
  cash: '现结',
  '7_days': '7天',
  '15_days': '15天',
  '30_days': '30天',
  '45_days': '45天',
  '60_days': '60天',
}

export const supplierStatusLabels: Record<SupplierStatus, string> = {
  active: '合作中',
  paused: '暂停',
  terminated: '已终止',
}

export const dealBaseStatusLabels: Record<DealBaseStatus, string> = {
  to_contact: '待联系',
  connected: '已建立联系',
  available: '可供应',
  reserved: '已预占',
  delivered: '已交割',
  success: '成交成功',
  failed: '成交失败',
}

export const customerProjectTypeLabels: Record<CustomerProjectType, string> = {
  normal: '普通客户',
  platform: '平台项目',
  oem: '主机厂项目',
  live_base: '直播基地项目',
}

export const supplyTargetLabels: Record<SupplyTarget, string> = {
  yiche: '易车',
  autohome: '汽车之家',
  dongchedi: '懂车帝',
  baidu_youjia: '百度有驾',
  oem: '主机厂',
  live_base: '直播基地',
  other: '其他',
}

export const platformBusinessNameLabels: Record<PlatformBusinessName, string> = {
  ka: 'KA',
  youjia: '有驾',
  cheshanghui: '车商汇',
  cpt: 'CPT',
  arrival: '到店',
  cps: 'CPS',
  live_lead: '直播线索',
  other: '其他',
}

export const supplyContentTypeLabels: Record<SupplyContentType, string> = {
  lead: '线索',
  deal: '成交',
  arrival: '到店',
  live: '直播',
  other: '其他',
}

export const settlementModeLabels: Record<SettlementMode, string> = {
  monthly: '月结',
  project: '项目结算',
}

export const customerProjectStatusLabels: Record<CustomerProjectStatus, string> = {
  pending: '待启动',
  active: '执行中',
  paused: '暂停',
  completed: '已完成',
  settled: '已结算',
}

export const quotationStatusLabels: Record<QuotationStatus, string> = {
  new: '新询价',
  requirement_confirming: '需求确认中',
  sourcing: '询价中',
  quoted: '已报价',
  won: '已中标',
  lost: '未中标',
  archived: '已归档',
}

export const quotationSourceTypeLabels: Record<QuotationSourceType, string> = {
  upstream: '上游报价',
  owned_channel: '自有渠道',
  capacity_center: '产能中心',
}

export const submissionMethodLabels: Record<SubmissionMethod, string> = {
  spreadsheet: '表格录入',
  link: '链接录入',
  qr_code: '二维码录入',
  other: '其他',
}

export const quotationContentTypeLabels: Record<QuotationContentType, string> = {
  lead: '线索',
  arrival: '到店',
  deal: '成交',
  policy: '保单',
  other: '其他',
}

export const requirementJudgementTypeLabels: Record<RequirementJudgementType, string> = {
  system: '系统判定',
  proof: '我方凭证',
  customer: '客户判定',
  mixed: '混合判定',
}

export const getQuotationRiskTags = (quotation: Quotation) => {
  const tags: Array<{ color: string; label: string }> = []

  if (quotation.submissionMethod === 'qr_code' && !quotation.canQrToLinkWhitelist) {
    tags.push({ color: 'red', label: '二维码未白名单' })
  }
  if (quotation.requiresVerificationCode) tags.push({ color: 'orange', label: '需验证码' })
  if (quotation.requiresDeal) tags.push({ color: 'purple', label: '需成交' })
  if (quotation.requiresArrival) tags.push({ color: 'gold', label: '需到店' })
  if (quotation.requiresPingAnPolicy) tags.push({ color: 'blue', label: '需平安保单' })
  if (quotation.needsQuotation && quotation.recommendedPrice <= 0) tags.push({ color: 'red', label: '待报价' })
  if (quotation.upstreamQuotePrice > 0 && quotation.ownedQuotePrice > 0 && quotation.upstreamQuotePrice < quotation.ownedQuotePrice) {
    tags.push({ color: 'cyan', label: '上游更优' })
  }

  return tags
}

export const buildPersonalDashboard = ({
  owner,
  customerProjects,
  quotations,
  dealBaseRecords,
}: PersonalDashboardInput) => {
  const ownedProjects = customerProjects.filter(
    (project) => project.salesOwner === owner || project.operationOwner === owner,
  )
  const ownedQuotations = quotations.filter(
    (quotation) =>
      quotation.salesOwner === owner || quotation.operationOwner === owner || quotation.channelOwner === owner,
  )
  const ownedDealBaseRecords = dealBaseRecords.filter((record) => record.owner === owner || record.payer === owner)
  const activeProjects = ownedProjects.filter((project) => project.status === 'active' || project.status === 'pending')
  const completedProjects = ownedProjects.filter((project) => project.status === 'completed' || project.status === 'settled')
  const pendingQuotationCount = ownedQuotations.filter(
    (quotation) => quotation.status === 'new' || quotation.status === 'requirement_confirming' || quotation.status === 'sourcing',
  ).length
  const advanceRiskRecords = ownedDealBaseRecords.filter(
    (record) => record.paymentMode === 'prepaid' && !record.isSuccess,
  )
  const paymentRiskProjects = ownedProjects.filter((project) => !project.downPaymentReceived || project.downPaymentAmount > 0)
  const accountPeriodAlerts = ownedProjects
    .filter((project) => project.status !== 'settled')
    .map((project) => ({
      id: project.id,
      name: project.customerName,
      accountPeriod: project.accountPeriod,
      accountPeriodLabel: accountPeriodLabels[project.accountPeriod],
      days: accountPeriodDays[project.accountPeriod],
      amount: project.finalSettlementAmount,
      riskLevel:
        !project.downPaymentReceived || accountPeriodDays[project.accountPeriod] >= 30
          ? ('warning' as const)
          : ('normal' as const),
    }))
  const totalTaskCount = ownedProjects.length + ownedQuotations.length + ownedDealBaseRecords.length
  const completedTaskCount =
    completedProjects.length +
    ownedQuotations.filter((quotation) => ['quoted', 'won', 'lost', 'archived'].includes(quotation.status)).length +
    ownedDealBaseRecords.filter((record) => ['success', 'failed'].includes(record.status)).length

  return {
    owner,
    projectCount: ownedProjects.length,
    activeProjectCount: activeProjects.length,
    quotationCount: ownedQuotations.length,
    pendingQuotationCount,
    dealBaseCount: ownedDealBaseRecords.length,
    totalProjectAmount: ownedProjects.reduce((total, project) => total + project.finalSettlementAmount, 0),
    receivedDownPaymentAmount: ownedProjects.reduce(
      (total, project) => total + (project.downPaymentReceived ? project.downPaymentAmount : 0),
      0,
    ),
    pendingPaymentAmount: ownedProjects.reduce(
      (total, project) => total + (!project.downPaymentReceived ? project.downPaymentAmount : 0),
      0,
    ),
    advanceAmount: advanceRiskRecords.reduce((total, record) => total + record.amount, 0),
    advanceRiskCount: advanceRiskRecords.length,
    paymentRiskCount: paymentRiskProjects.length,
    accountPeriodAlerts,
    taskProgressPercent: totalTaskCount ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0,
    completedTaskCount,
    totalTaskCount,
    ownedProjects,
    ownedQuotations,
    ownedDealBaseRecords,
  }
}

export const canViewFullPhone = (role: UserRole) => role === 'admin' || role === 'operator'

export const canManageFlow = (role: UserRole) => role === 'admin' || role === 'operator'

export const canEditLead = (role: UserRole) => canManageFlow(role)

export const leadStatusTransitions: Partial<Record<LeadStatus, LeadStatus[]>> = {
  new: ['pending_clean', 'invalid'],
  pending_clean: ['valid', 'duplicate', 'invalid'],
  valid: ['delivered', 'invalid'],
  duplicate: ['valid', 'invalid'],
  delivered: [],
  invalid: [],
}

export const canTransitionLeadStatus = (from: LeadStatus, to: LeadStatus) =>
  leadStatusTransitions[from]?.includes(to) ?? false

export const customerProjectStatusTransitions: Partial<Record<CustomerProjectStatus, CustomerProjectStatus[]>> = {
  pending: ['active', 'paused'],
  active: ['paused', 'completed'],
  paused: ['active', 'completed'],
  completed: ['settled'],
  settled: [],
}

export const canTransitionCustomerProjectStatus = (from: CustomerProjectStatus, to: CustomerProjectStatus) =>
  customerProjectStatusTransitions[from]?.includes(to) ?? false

export const quotationStatusTransitions: Partial<Record<QuotationStatus, QuotationStatus[]>> = {
  new: ['requirement_confirming', 'archived'],
  requirement_confirming: ['sourcing', 'archived'],
  sourcing: ['quoted', 'archived'],
  quoted: ['won', 'lost'],
  won: ['archived'],
  lost: ['archived'],
  archived: [],
}

export const canTransitionQuotationStatus = (from: QuotationStatus, to: QuotationStatus) =>
  quotationStatusTransitions[from]?.includes(to) ?? false

export const dealBaseStatusTransitions: Partial<Record<DealBaseStatus, DealBaseStatus[]>> = {
  to_contact: ['connected', 'failed'],
  connected: ['available', 'failed'],
  available: ['reserved', 'failed'],
  reserved: ['delivered', 'failed'],
  delivered: ['success', 'failed'],
  success: [],
  failed: [],
}

export const canTransitionDealBaseStatus = (from: DealBaseStatus, to: DealBaseStatus) =>
  dealBaseStatusTransitions[from]?.includes(to) ?? false

export const getIneligibleDeliveryLeadIds = (
  leads: Array<Pick<Lead, 'id' | 'status'>>,
  selectedLeadIds: string[],
) =>
  selectedLeadIds.filter((leadId) => leads.find((lead) => lead.id === leadId)?.status !== 'valid')

export const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')

export const phoneForRole = (phone: string, role: UserRole) => (canViewFullPhone(role) ? phone : maskPhone(phone))

export const findDuplicatePhones = (leads: Lead[]) => {
  const count = leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.phone] = (acc[lead.phone] ?? 0) + 1
    return acc
  }, {})

  return new Set(Object.entries(count).filter(([, total]) => total > 1).map(([phone]) => phone))
}

export const createLeadId = (size: number) => `L${dayjs().format('YYYYMMDD')}${String(size + 1).padStart(3, '0')}`

export const createBatchId = (size: number) => `B${dayjs().format('YYYYMMDD')}${String(size + 1).padStart(3, '0')}`

export const createFollowUpId = (size: number) => `F${dayjs().format('YYYYMMDDHHmmss')}${String(size + 1).padStart(2, '0')}`

export const createSupplierId = (size: number) => `S${dayjs().format('YYYYMMDD')}${String(size + 1).padStart(3, '0')}`

export const createDealBaseId = (size: number) => `D${dayjs().format('YYYYMMDD')}${String(size + 1).padStart(3, '0')}`

export const createCustomerProjectId = (size: number) => `P${dayjs().format('YYYYMMDD')}${String(size + 1).padStart(3, '0')}`

export const createQuotationId = (size: number) => `Q${dayjs().format('YYYYMMDD')}${String(size + 1).padStart(3, '0')}`

export const isContractExpiringSoon = (contractEnd: string) => {
  const end = dayjs(contractEnd)
  const days = end.diff(dayjs(), 'day')
  return days >= 0 && days <= 30
}

export const resolveTargetName = (targets: DeliveryTarget[], targetId: string) =>
  targets.find((target) => target.id === targetId)?.name ?? '未知交付对象'

export const batchLeadNames = (batch: DeliveryBatch, leads: Lead[]) =>
  batch.leadIds
    .map((leadId) => leads.find((lead) => lead.id === leadId)?.name)
    .filter(Boolean)
    .join('、')
