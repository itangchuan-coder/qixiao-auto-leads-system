import {
  accountPeriodLabels,
  customerProjectStatusLabels,
  customerProjectTypeLabels,
  dealBaseStatusLabels,
  paymentModeLabels,
  platformBusinessNameLabels,
  quotationContentTypeLabels,
  quotationSourceTypeLabels,
  quotationStatusLabels,
  requirementJudgementTypeLabels,
  settlementModeLabels,
  statusLabels,
  submissionMethodLabels,
  supplyContentTypeLabels,
  supplyTargetLabels,
  supplierStatusLabels,
  supplierTypeLabels,
} from './helpers'
import type {
  CustomerProjectFormValues,
  CustomerProjectSearchValues,
  CustomerProjectStatus,
  DealBaseFormValues,
  DealBaseSearchValues,
  DealBaseStatus,
  LeadFormValues,
  LeadSearchValues,
  LeadStatus,
  QuotationFormValues,
  QuotationSearchValues,
  QuotationStatus,
  SupplierFormValues,
  SupplierSearchValues,
} from './types'

export const statusColor: Record<LeadStatus, string> = {
  new: 'blue',
  pending_clean: 'gold',
  valid: 'green',
  duplicate: 'orange',
  delivered: 'purple',
  invalid: 'red',
}

export const leadStatusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }))
export const supplierTypeOptions = Object.entries(supplierTypeLabels).map(([value, label]) => ({ value, label }))
export const supplierStatusOptions = Object.entries(supplierStatusLabels).map(([value, label]) => ({ value, label }))
export const paymentModeOptions = Object.entries(paymentModeLabels).map(([value, label]) => ({ value, label }))
export const accountPeriodOptions = Object.entries(accountPeriodLabels).map(([value, label]) => ({ value, label }))
export const dealBaseStatusOptions = Object.entries(dealBaseStatusLabels).map(([value, label]) => ({ value, label }))
export const customerProjectTypeOptions = Object.entries(customerProjectTypeLabels).map(([value, label]) => ({
  value,
  label,
}))
export const supplyTargetOptions = Object.entries(supplyTargetLabels).map(([value, label]) => ({ value, label }))
export const platformBusinessNameOptions = Object.entries(platformBusinessNameLabels).map(([value, label]) => ({
  value,
  label,
}))
export const supplyContentTypeOptions = Object.entries(supplyContentTypeLabels).map(([value, label]) => ({
  value,
  label,
}))
export const settlementModeOptions = Object.entries(settlementModeLabels).map(([value, label]) => ({ value, label }))
export const customerProjectStatusOptions = Object.entries(customerProjectStatusLabels).map(([value, label]) => ({
  value,
  label,
}))
export const quotationStatusOptions = Object.entries(quotationStatusLabels).map(([value, label]) => ({ value, label }))
export const quotationSourceTypeOptions = Object.entries(quotationSourceTypeLabels).map(([value, label]) => ({
  value,
  label,
}))
export const submissionMethodOptions = Object.entries(submissionMethodLabels).map(([value, label]) => ({
  value,
  label,
}))
export const quotationContentTypeOptions = Object.entries(quotationContentTypeLabels).map(([value, label]) => ({
  value,
  label,
}))
export const requirementJudgementTypeOptions = Object.entries(requirementJudgementTypeLabels).map(([value, label]) => ({
  value,
  label,
}))

export const invoiceTypeOptions = [
  { value: 'general_taxpayer', label: '一般纳税人' },
  { value: 'small_scale', label: '小规模' },
  { value: 'private_transfer', label: '私人转账' },
  { value: 'other', label: '其他' },
]

export const dealCycleOptions = [
  { value: 't1', label: 'T+1' },
  { value: 't2', label: 'T+2' },
  { value: 't3', label: 'T+3' },
  { value: 't30', label: 'T+30' },
  { value: 'other', label: '其他' },
]

export const defaultLeadValues: LeadFormValues = {
  name: '',
  phone: '',
  city: '',
  interestedBrand: '',
  interestedModel: '',
  budget: '',
  purchaseTimeframe: 'unknown',
  source: '',
  status: 'new',
  owner: '运营A',
  note: '',
}

export const defaultSearchValues: LeadSearchValues = {
  keyword: '',
  city: '',
  brand: '',
  source: '',
}

export const defaultSupplierSearchValues: SupplierSearchValues = {
  keyword: '',
}

export const defaultSupplierValues: SupplierFormValues = {
  name: '',
  type: 'channel',
  contact: '',
  phone: '',
  contractStart: '',
  contractEnd: '',
  paymentMode: 'postpaid',
  accountPeriod: '30_days',
  status: 'active',
  note: '',
}

export const defaultDealBaseSearchValues: DealBaseSearchValues = {
  keyword: '',
  city: '',
  brand: '',
  supplyModel: '',
}

export const defaultDealBaseValues: DealBaseFormValues = {
  city: '',
  brand: '',
  dealer: '',
  contact: '',
  phone: '',
  position: '',
  supplyModel: '',
  supplyContent: '',
  supplyProof: '',
  supplyTime: '',
  isValid: true,
  paymentMode: 'postpaid',
  amount: 0,
  capacity: '',
  owner: '开拓运营A',
  payer: '',
  paymentTime: '',
  status: 'to_contact',
  isSuccess: false,
  failureReason: '',
  companyBearsCost: false,
  note: '',
}

export const defaultCustomerProjectSearchValues: CustomerProjectSearchValues = {
  keyword: '',
  oemBrand: '',
}

export const defaultCustomerProjectValues: CustomerProjectFormValues = {
  customerName: '',
  projectType: 'normal',
  supplyTarget: 'other',
  oemBrand: '',
  isLiveBusiness: false,
  platformBusinessName: 'other',
  supplyContentType: 'lead',
  demandVolume: '',
  pushTime: '',
  salesOwner: '销售A',
  operationOwner: '运营A',
  status: 'pending',
  requiresFirstTouch: false,
  effectiveRateRequirement: '',
  systemDedupValid: true,
  pushSuccess: false,
  supportsPreciseDelivery: false,
  dealCycle: 'other',
  requiresDealProof: false,
  dealProofType: '',
  requiresArrivalRecording: false,
  requiresArrivalProof: false,
  requiresSystemArrivalConfirm: false,
  maxDealsPerStore: '不超过3单',
  storeRequirementNote: '',
  contractSigned: false,
  contractNo: '',
  downPaymentAmount: 0,
  downPaymentReceived: false,
  settlementMode: 'monthly',
  accountPeriod: '30_days',
  invoiceType: 'general_taxpayer',
  unitPrice: 0,
  finalUnitPrice: 0,
  finalSettlementRatio: 1,
  finalSettlementAmount: 0,
  settlementStandard: '客户给出数据为准',
  lossRatio: 0,
  settlementNote: '',
  requirementNote: '',
}

export const defaultQuotationSearchValues: QuotationSearchValues = {
  keyword: '',
  city: '',
  brand: '',
}

export const defaultQuotationValues: QuotationFormValues = {
  customerName: '',
  demander: '',
  demandTime: '',
  cityScope: [],
  carBrand: '',
  carModel: '',
  contentType: 'lead',
  demandVolume: '',
  targetPrice: 0,
  needsQuotation: true,
  requiresPingAnPolicy: false,
  supportsPreciseDelivery: false,
  submissionMethod: 'spreadsheet',
  canQrToLinkWhitelist: false,
  requiresVerificationCode: false,
  requiresDeal: false,
  requiredDealRatio: '',
  requiresArrival: false,
  judgementType: 'system',
  judgementStandard: '',
  upstreamQuotePrice: 0,
  upstreamCapacity: '',
  upstreamSupplier: '',
  ownedQuotePrice: 0,
  ownedCapacity: '',
  ownedOwner: '',
  recommendedPrice: 0,
  grossMargin: 0,
  salesOwner: '销售A',
  operationOwner: '运营A',
  channelOwner: '渠道运营A',
  status: 'new',
  requirementNote: '',
  quoteNote: '',
}

export const customerProjectNextStatusOptions: Partial<Record<CustomerProjectStatus, CustomerProjectStatus[]>> = {
  pending: ['active', 'paused'],
  active: ['paused', 'completed'],
  paused: ['active', 'completed'],
  completed: ['settled'],
  settled: [],
}

export const dealBaseNextStatusOptions: Partial<Record<DealBaseStatus, DealBaseStatus[]>> = {
  to_contact: ['connected', 'failed'],
  connected: ['available', 'failed'],
  available: ['reserved', 'failed'],
  reserved: ['delivered', 'failed'],
  delivered: ['success', 'failed'],
  success: [],
  failed: [],
}

export const quotationNextStatusOptions: Partial<Record<QuotationStatus, QuotationStatus[]>> = {
  new: ['requirement_confirming', 'archived'],
  requirement_confirming: ['sourcing', 'archived'],
  sourcing: ['quoted', 'archived'],
  quoted: ['won', 'lost'],
  won: ['archived'],
  lost: ['archived'],
  archived: [],
}

export const statusFlow: LeadStatus[] = ['new', 'pending_clean', 'valid', 'delivered', 'invalid']

export const nextStatusOptions: Partial<Record<LeadStatus, LeadStatus[]>> = {
  new: ['pending_clean', 'invalid'],
  pending_clean: ['valid', 'duplicate', 'invalid'],
  valid: ['delivered', 'invalid'],
  duplicate: ['valid', 'invalid'],
  delivered: [],
  invalid: [],
}
