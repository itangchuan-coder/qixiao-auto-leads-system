import { getQuotationRiskTags, quotationStatusLabels } from './helpers'
import type { Quotation } from './types'

const baseQuotation: Quotation = {
  id: 'Q20260708001',
  customerName: '测试客户',
  demander: '客户张',
  demandTime: '2026-07-08 10:00',
  cityScope: ['上海'],
  carBrand: '问界',
  carModel: 'M9',
  contentType: 'lead',
  demandVolume: '1000条/月',
  targetPrice: 0,
  needsQuotation: true,
  requiresPingAnPolicy: false,
  supportsPreciseDelivery: true,
  submissionMethod: 'link',
  canQrToLinkWhitelist: false,
  requiresVerificationCode: false,
  requiresDeal: false,
  requiredDealRatio: '',
  requiresArrival: false,
  judgementType: 'system',
  judgementStandard: '系统判定有效线索',
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
  channelOwner: '渠道A',
  status: 'new',
  requirementNote: '',
  quoteNote: '',
}

if (quotationStatusLabels.quoted !== '已报价') {
  throw new Error('报价状态标签应包含已报价')
}

const tags = getQuotationRiskTags({
  ...baseQuotation,
  submissionMethod: 'qr_code',
  canQrToLinkWhitelist: false,
  requiresVerificationCode: true,
  requiresDeal: true,
  requiresArrival: true,
})

if (!tags.some((tag) => tag.label === '二维码未白名单') || !tags.some((tag) => tag.label === '需验证码')) {
  throw new Error('报价风险标签应识别二维码白名单和验证码要求')
}
