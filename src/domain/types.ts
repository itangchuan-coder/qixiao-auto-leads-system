export type UserRole = 'admin' | 'supervisor' | 'operator' | 'other'

export type SopAudience = 'supervisor' | 'operator' | 'shared'

export interface SopDocument {
  id: string
  title: string
  audience: SopAudience
  version: string
  updatedAt: string
  publishedBy: string
  summary: string
  content: string
  sourceFileName: string
}

export type LeadStatus =
  | 'new'
  | 'pending_clean'
  | 'valid'
  | 'duplicate'
  | 'delivered'
  | 'invalid'

export type PurchaseTimeframe = 'within_7_days' | 'within_30_days' | 'within_90_days' | 'unknown'

export type DeliveryStatus = 'draft' | 'delivered' | 'reconciled'

export type SupplierType = 'channel' | 'data'

export type PaymentMode = 'prepaid' | 'postpaid'

export type AccountPeriod = 'cash' | '7_days' | '15_days' | '30_days' | '45_days' | '60_days'

export type SupplierStatus = 'active' | 'paused' | 'terminated'

export type DealBaseStatus =
  | 'to_contact'
  | 'connected'
  | 'available'
  | 'reserved'
  | 'delivered'
  | 'success'
  | 'failed'

export type CustomerProjectType = 'normal' | 'platform' | 'oem' | 'live_base'

export type SupplyTarget = 'yiche' | 'autohome' | 'dongchedi' | 'baidu_youjia' | 'oem' | 'live_base' | 'other'

export type PlatformBusinessName = 'ka' | 'youjia' | 'cheshanghui' | 'cpt' | 'arrival' | 'cps' | 'live_lead' | 'other'

export type SupplyContentType = 'lead' | 'deal' | 'arrival' | 'live' | 'other'

export type DealCycle = 't1' | 't2' | 't3' | 't30' | 'other'

export type SettlementMode = 'monthly' | 'project'

export type InvoiceType = 'general_taxpayer' | 'small_scale' | 'private_transfer' | 'other'

export type CustomerProjectStatus = 'pending' | 'active' | 'paused' | 'completed' | 'settled'

export type QuotationStatus =
  | 'new'
  | 'requirement_confirming'
  | 'sourcing'
  | 'quoted'
  | 'won'
  | 'lost'
  | 'archived'

export type QuotationSourceType = 'upstream' | 'owned_channel' | 'capacity_center'

export type SubmissionMethod = 'spreadsheet' | 'link' | 'qr_code' | 'other'

export type QuotationContentType = 'lead' | 'arrival' | 'deal' | 'policy' | 'other'

export type RequirementJudgementType = 'system' | 'proof' | 'customer' | 'mixed'

export interface Lead {
  id: string
  name: string
  phone: string
  city: string
  interestedBrand: string
  interestedModel: string
  budget: string
  purchaseTimeframe: PurchaseTimeframe
  source: string
  status: LeadStatus
  createdAt: string
  owner: string
  note: string
  followUps: FollowUpRecord[]
}

export interface FollowUpRecord {
  id: string
  time: string
  operator: string
  content: string
}

export interface DeliveryTarget {
  id: string
  name: string
  type: 'platform' | 'oem'
  contact: string
  phone: string
  status: 'active' | 'paused'
  note: string
}

export interface DeliveryBatch {
  id: string
  targetId: string
  leadIds: string[]
  createdBy: string
  createdAt: string
  status: DeliveryStatus
  note: string
}

export interface Supplier {
  id: string
  name: string
  type: SupplierType
  contact: string
  phone: string
  contractStart: string
  contractEnd: string
  paymentMode: PaymentMode
  accountPeriod: AccountPeriod
  status: SupplierStatus
  note: string
}

export interface DealBaseRecord {
  id: string
  city: string
  brand: string
  dealer: string
  contact: string
  phone: string
  position: string
  supplyModel: string
  supplyContent: string
  supplyProof: string
  supplyTime: string
  isValid: boolean
  paymentMode: PaymentMode
  amount: number
  capacity: string
  owner: string
  payer: string
  paymentTime: string
  status: DealBaseStatus
  isSuccess: boolean
  failureReason: string
  companyBearsCost: boolean
  note: string
}

export interface CustomerProject {
  id: string
  customerName: string
  projectType: CustomerProjectType
  supplyTarget: SupplyTarget
  oemBrand: string
  isLiveBusiness: boolean
  platformBusinessName: PlatformBusinessName
  supplyContentType: SupplyContentType
  demandVolume: string
  pushTime: string
  salesOwner: string
  operationOwner: string
  status: CustomerProjectStatus
  requiresFirstTouch: boolean
  effectiveRateRequirement: string
  systemDedupValid: boolean
  pushSuccess: boolean
  supportsPreciseDelivery: boolean
  dealCycle: DealCycle
  requiresDealProof: boolean
  dealProofType: string
  requiresArrivalRecording: boolean
  requiresArrivalProof: boolean
  requiresSystemArrivalConfirm: boolean
  maxDealsPerStore: string
  storeRequirementNote: string
  contractSigned: boolean
  contractNo: string
  downPaymentAmount: number
  downPaymentReceived: boolean
  settlementMode: SettlementMode
  accountPeriod: AccountPeriod
  invoiceType: InvoiceType
  unitPrice: number
  finalUnitPrice: number
  finalSettlementRatio: number
  finalSettlementAmount: number
  settlementStandard: string
  lossRatio: number
  settlementNote: string
  requirementNote: string
}

export interface Quotation {
  id: string
  customerName: string
  demander: string
  demandTime: string
  cityScope: string[]
  carBrand: string
  carModel: string
  contentType: QuotationContentType
  demandVolume: string
  targetPrice: number
  needsQuotation: boolean
  requiresPingAnPolicy: boolean
  supportsPreciseDelivery: boolean
  submissionMethod: SubmissionMethod
  canQrToLinkWhitelist: boolean
  requiresVerificationCode: boolean
  requiresDeal: boolean
  requiredDealRatio: string
  requiresArrival: boolean
  judgementType: RequirementJudgementType
  judgementStandard: string
  upstreamQuotePrice: number
  upstreamCapacity: string
  upstreamSupplier: string
  ownedQuotePrice: number
  ownedCapacity: string
  ownedOwner: string
  recommendedPrice: number
  grossMargin: number
  salesOwner: string
  operationOwner: string
  channelOwner: string
  status: QuotationStatus
  requirementNote: string
  quoteNote: string
}

export interface LeadFormValues {
  name: string
  phone: string
  city: string
  interestedBrand: string
  interestedModel: string
  budget: string
  purchaseTimeframe: PurchaseTimeframe
  source: string
  status: LeadStatus
  owner: string
  note: string
}

export interface LeadSearchValues {
  keyword: string
  city: string
  brand: string
  source: string
  status?: LeadStatus
}

export interface SupplierFormValues {
  name: string
  type: SupplierType
  contact: string
  phone: string
  contractStart: string
  contractEnd: string
  paymentMode: PaymentMode
  accountPeriod: AccountPeriod
  status: SupplierStatus
  note: string
}

export interface SupplierSearchValues {
  keyword: string
  type?: SupplierType
  status?: SupplierStatus
}

export interface DealBaseFormValues {
  city: string
  brand: string
  dealer: string
  contact: string
  phone: string
  position: string
  supplyModel: string
  supplyContent: string
  supplyProof: string
  supplyTime: string
  isValid: boolean
  paymentMode: PaymentMode
  amount: number
  capacity: string
  owner: string
  payer: string
  paymentTime: string
  status: DealBaseStatus
  isSuccess: boolean
  failureReason: string
  companyBearsCost: boolean
  note: string
}

export interface DealBaseSearchValues {
  keyword: string
  city: string
  brand: string
  supplyModel: string
  status?: DealBaseStatus
  isValid?: boolean
}

export interface CustomerProjectFormValues extends Omit<CustomerProject, 'id'> {}

export interface CustomerProjectSearchValues {
  keyword: string
  projectType?: CustomerProjectType
  supplyTarget?: SupplyTarget
  oemBrand: string
  status?: CustomerProjectStatus
}

export interface QuotationFormValues extends Omit<Quotation, 'id'> {}

export interface QuotationSearchValues {
  keyword: string
  city: string
  brand: string
  sourceType?: QuotationSourceType
  status?: QuotationStatus
}
