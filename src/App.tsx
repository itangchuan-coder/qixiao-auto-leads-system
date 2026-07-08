import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Alert,
  App as AntApp,
  Badge,
  Button,
  Card,
  ConfigProvider,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Progress,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
  Upload,
  theme,
} from 'antd'
import type { MenuProps, TableColumnsType, UploadProps } from 'antd'
import {
  AuditOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ExportOutlined,
  FieldTimeOutlined,
  FileSearchOutlined,
  FileProtectOutlined,
  FolderOpenOutlined,
  FundProjectionScreenOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'
import './App.css'
import { SmartSelect } from './components/SmartSelect'
import {
  accountPeriodLabels,
  batchLeadNames,
  buildPersonalDashboard,
  canManageFlow,
  createBatchId,
  createCustomerProjectId,
  createDealBaseId,
  createFollowUpId,
  createLeadId,
  createQuotationId,
  createSupplierId,
  findDuplicatePhones,
  dealBaseStatusLabels,
  customerProjectStatusLabels,
  customerProjectTypeLabels,
  getQuotationRiskTags,
  isContractExpiringSoon,
  paymentModeLabels,
  platformBusinessNameLabels,
  phoneForRole,
  purchaseTimeframeLabels,
  quotationContentTypeLabels,
  quotationSourceTypeLabels,
  quotationStatusLabels,
  requirementJudgementTypeLabels,
  resolveTargetName,
  roleLabels,
  settlementModeLabels,
  statusLabels,
  submissionMethodLabels,
  supplyContentTypeLabels,
  supplyTargetLabels,
  supplierStatusLabels,
  supplierTypeLabels,
} from './domain/helpers'
import { automakerOptions, brandOptions, cityOptions, modelOptions } from './domain/referenceData'
import { useLeadSystemStore } from './domain/store'
import type {
  DeliveryBatch,
  DeliveryTarget,
  CustomerProject,
  CustomerProjectFormValues,
  CustomerProjectSearchValues,
  CustomerProjectStatus,
  DealBaseFormValues,
  DealBaseRecord,
  DealBaseSearchValues,
  DealBaseStatus,
  Lead,
  LeadFormValues,
  LeadSearchValues,
  LeadStatus,
  Quotation,
  QuotationFormValues,
  QuotationSearchValues,
  QuotationStatus,
  Supplier,
  SupplierFormValues,
  SupplierSearchValues,
  SupplierStatus,
  UserRole,
} from './domain/types'

const { Header, Sider, Content } = Layout
const { Title, Text, Paragraph } = Typography

type PageKey =
  | 'dashboard'
  | 'personalDashboard'
  | 'customerProjects'
  | 'leads'
  | 'quotations'
  | 'import'
  | 'suppliers'
  | 'dealBase'
  | 'batches'
  | 'targets'
  | 'sop'
  | 'permissions'

const pagePaths: Record<PageKey, string> = {
  dashboard: '/',
  personalDashboard: '/personal-dashboard',
  customerProjects: '/customer-projects',
  leads: '/leads',
  quotations: '/quotations',
  import: '/import',
  suppliers: '/suppliers',
  dealBase: '/deal-base',
  batches: '/batches',
  targets: '/targets',
  sop: '/sop',
  permissions: '/permissions',
}

const pageByPath = Object.fromEntries(Object.entries(pagePaths).map(([page, path]) => [path, page])) as Record<string, PageKey>

const statusColor: Record<LeadStatus, string> = {
  new: 'blue',
  pending_clean: 'gold',
  valid: 'green',
  duplicate: 'orange',
  delivered: 'purple',
  invalid: 'red',
}

const menuItems: MenuProps['items'] = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: 'personalDashboard', icon: <FundProjectionScreenOutlined />, label: '个人业务驾驶舱' },
  { key: 'customerProjects', icon: <FolderOpenOutlined />, label: '客户项目管理' },
  { key: 'quotations', icon: <FileSearchOutlined />, label: '报价系统' },
  { key: 'leads', icon: <DatabaseOutlined />, label: '线索管理' },
  { key: 'import', icon: <CloudUploadOutlined />, label: '线索导入' },
  { key: 'suppliers', icon: <ShopOutlined />, label: '供应商管理' },
  { key: 'dealBase', icon: <AuditOutlined />, label: '成交开拓基地' },
  { key: 'batches', icon: <FileProtectOutlined />, label: '交付批次' },
  { key: 'targets', icon: <TeamOutlined />, label: '交付对象' },
  { key: 'sop', icon: <BarChartOutlined />, label: '流程/SOP' },
  { key: 'permissions', icon: <SafetyCertificateOutlined />, label: '权限配置占位' },
]

const leadStatusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }))

const supplierTypeOptions = Object.entries(supplierTypeLabels).map(([value, label]) => ({ value, label }))

const supplierStatusOptions = Object.entries(supplierStatusLabels).map(([value, label]) => ({ value, label }))

const paymentModeOptions = Object.entries(paymentModeLabels).map(([value, label]) => ({ value, label }))

const accountPeriodOptions = Object.entries(accountPeriodLabels).map(([value, label]) => ({ value, label }))

const dealBaseStatusOptions = Object.entries(dealBaseStatusLabels).map(([value, label]) => ({ value, label }))

const customerProjectTypeOptions = Object.entries(customerProjectTypeLabels).map(([value, label]) => ({ value, label }))

const supplyTargetOptions = Object.entries(supplyTargetLabels).map(([value, label]) => ({ value, label }))

const platformBusinessNameOptions = Object.entries(platformBusinessNameLabels).map(([value, label]) => ({ value, label }))

const supplyContentTypeOptions = Object.entries(supplyContentTypeLabels).map(([value, label]) => ({ value, label }))

const settlementModeOptions = Object.entries(settlementModeLabels).map(([value, label]) => ({ value, label }))

const invoiceTypeOptions = [
  { value: 'general_taxpayer', label: '一般纳税人' },
  { value: 'small_scale', label: '小规模' },
  { value: 'private_transfer', label: '私人转账' },
  { value: 'other', label: '其他' },
]

const dealCycleOptions = [
  { value: 't1', label: 'T+1' },
  { value: 't2', label: 'T+2' },
  { value: 't3', label: 'T+3' },
  { value: 't30', label: 'T+30' },
  { value: 'other', label: '其他' },
]

const customerProjectStatusOptions = Object.entries(customerProjectStatusLabels).map(([value, label]) => ({ value, label }))

const quotationStatusOptions = Object.entries(quotationStatusLabels).map(([value, label]) => ({ value, label }))

const quotationSourceTypeOptions = Object.entries(quotationSourceTypeLabels).map(([value, label]) => ({ value, label }))

const submissionMethodOptions = Object.entries(submissionMethodLabels).map(([value, label]) => ({ value, label }))

const quotationContentTypeOptions = Object.entries(quotationContentTypeLabels).map(([value, label]) => ({ value, label }))

const requirementJudgementTypeOptions = Object.entries(requirementJudgementTypeLabels).map(([value, label]) => ({
  value,
  label,
}))

const defaultLeadValues: LeadFormValues = {
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

const defaultSearchValues: LeadSearchValues = {
  keyword: '',
  city: '',
  brand: '',
  source: '',
}

const defaultSupplierSearchValues: SupplierSearchValues = {
  keyword: '',
}

const defaultSupplierValues: SupplierFormValues = {
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

const defaultDealBaseSearchValues: DealBaseSearchValues = {
  keyword: '',
  city: '',
  brand: '',
  supplyModel: '',
}

const defaultDealBaseValues: DealBaseFormValues = {
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

const defaultCustomerProjectSearchValues: CustomerProjectSearchValues = {
  keyword: '',
  oemBrand: '',
}

const defaultCustomerProjectValues: CustomerProjectFormValues = {
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

const defaultQuotationSearchValues: QuotationSearchValues = {
  keyword: '',
  city: '',
  brand: '',
}

const defaultQuotationValues: QuotationFormValues = {
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

const customerProjectNextStatusOptions: Partial<Record<CustomerProjectStatus, CustomerProjectStatus[]>> = {
  pending: ['active', 'paused'],
  active: ['paused', 'completed'],
  paused: ['active', 'completed'],
  completed: ['settled'],
  settled: [],
}

const dealBaseNextStatusOptions: Partial<Record<DealBaseStatus, DealBaseStatus[]>> = {
  to_contact: ['connected', 'failed'],
  connected: ['available', 'failed'],
  available: ['reserved', 'failed'],
  reserved: ['delivered', 'failed'],
  delivered: ['success', 'failed'],
  success: [],
  failed: [],
}

const quotationNextStatusOptions: Partial<Record<QuotationStatus, QuotationStatus[]>> = {
  new: ['requirement_confirming', 'archived'],
  requirement_confirming: ['sourcing', 'archived'],
  sourcing: ['quoted', 'archived'],
  quoted: ['won', 'lost'],
  won: ['archived'],
  lost: ['archived'],
  archived: [],
}

const statusFlow: LeadStatus[] = ['new', 'pending_clean', 'valid', 'delivered', 'invalid']

const nextStatusOptions: Partial<Record<LeadStatus, LeadStatus[]>> = {
  new: ['pending_clean', 'invalid'],
  pending_clean: ['valid', 'duplicate', 'invalid'],
  valid: ['delivered', 'invalid'],
  duplicate: ['valid', 'invalid'],
  delivered: [],
  invalid: [],
}

const normalizeSearch = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '')

const matchesSmartValue = (value: string, keyword: string, optionPools: Array<typeof cityOptions>) => {
  const normalizedKeyword = normalizeSearch(keyword)
  if (!normalizedKeyword) return true
  if (normalizeSearch(value).includes(normalizedKeyword)) return true

  const option = optionPools.flat().find((item) => item.value === value || item.label === value)
  if (!option) return false

  return [option.label, option.value, option.pinyin, option.initials, ...(option.aliases ?? [])]
    .map(normalizeSearch)
    .some((candidate) => candidate.includes(normalizedKeyword) || normalizedKeyword.includes(candidate))
}

function App() {
  const { message } = AntApp.useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const {
    token: { colorBgContainer },
  } = theme.useToken()
  const currentPage = pageByPath[location.pathname] ?? 'dashboard'
  const {
    role,
    leads,
    targets,
    batches,
    suppliers,
    dealBaseRecords,
    customerProjects,
    quotations,
    selectedLeadIds,
    setRole,
    setLeads,
    setTargets,
    setBatches,
    setSuppliers,
    setDealBaseRecords,
    setCustomerProjects,
    setQuotations,
    setSelectedLeadIds,
  } = useLeadSystemStore()
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [customerProjectModalOpen, setCustomerProjectModalOpen] = useState(false)
  const [editingCustomerProject, setEditingCustomerProject] = useState<CustomerProject | null>(null)
  const [detailCustomerProject, setDetailCustomerProject] = useState<CustomerProject | null>(null)
  const [quotationModalOpen, setQuotationModalOpen] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [detailQuotation, setDetailQuotation] = useState<Quotation | null>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [detailLead, setDetailLead] = useState<Lead | null>(null)
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null)
  const [dealBaseModalOpen, setDealBaseModalOpen] = useState(false)
  const [editingDealBase, setEditingDealBase] = useState<DealBaseRecord | null>(null)
  const [detailDealBase, setDetailDealBase] = useState<DealBaseRecord | null>(null)
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [targetModalOpen, setTargetModalOpen] = useState(false)
  const [personalDashboardOwner, setPersonalDashboardOwner] = useState('运营A')
  const [searchValues, setSearchValues] = useState<LeadSearchValues>(defaultSearchValues)
  const [supplierSearchValues, setSupplierSearchValues] = useState<SupplierSearchValues>(defaultSupplierSearchValues)
  const [dealBaseSearchValues, setDealBaseSearchValues] = useState<DealBaseSearchValues>(defaultDealBaseSearchValues)
  const [customerProjectSearchValues, setCustomerProjectSearchValues] =
    useState<CustomerProjectSearchValues>(defaultCustomerProjectSearchValues)
  const [quotationSearchValues, setQuotationSearchValues] = useState<QuotationSearchValues>(defaultQuotationSearchValues)
  const [form] = Form.useForm<LeadFormValues>()
  const [searchForm] = Form.useForm<LeadSearchValues>()
  const [supplierForm] = Form.useForm<SupplierFormValues>()
  const [supplierSearchForm] = Form.useForm<SupplierSearchValues>()
  const [dealBaseForm] = Form.useForm<DealBaseFormValues>()
  const [dealBaseSearchForm] = Form.useForm<DealBaseSearchValues>()
  const [customerProjectForm] = Form.useForm<CustomerProjectFormValues>()
  const [customerProjectSearchForm] = Form.useForm<CustomerProjectSearchValues>()
  const [quotationForm] = Form.useForm<QuotationFormValues>()
  const [quotationSearchForm] = Form.useForm<QuotationSearchValues>()
  const [followUpForm] = Form.useForm<{ content: string }>()
  const [batchForm] = Form.useForm<{ targetId: string; note: string }>()
  const [targetForm] = Form.useForm<Omit<DeliveryTarget, 'id'>>()

  const duplicatePhones = useMemo(() => findDuplicatePhones(leads), [leads])
  const activeTargets = targets.filter((target) => target.status === 'active')
  const selectedDetailLead = detailLead ? (leads.find((lead) => lead.id === detailLead.id) ?? detailLead) : null
  const selectedDetailSupplier = detailSupplier
    ? (suppliers.find((supplier) => supplier.id === detailSupplier.id) ?? detailSupplier)
    : null
  const selectedDetailDealBase = detailDealBase
    ? (dealBaseRecords.find((record) => record.id === detailDealBase.id) ?? detailDealBase)
    : null
  const selectedDetailCustomerProject = detailCustomerProject
    ? (customerProjects.find((project) => project.id === detailCustomerProject.id) ?? detailCustomerProject)
    : null
  const selectedDetailQuotation = detailQuotation
    ? (quotations.find((quotation) => quotation.id === detailQuotation.id) ?? detailQuotation)
    : null
  const personalOwnerOptions = useMemo(() => {
    const owners = new Set<string>()
    customerProjects.forEach((project) => {
      owners.add(project.salesOwner)
      owners.add(project.operationOwner)
    })
    quotations.forEach((quotation) => {
      owners.add(quotation.salesOwner)
      owners.add(quotation.operationOwner)
      owners.add(quotation.channelOwner)
    })
    dealBaseRecords.forEach((record) => {
      owners.add(record.owner)
      if (record.payer) owners.add(record.payer)
    })

    return Array.from(owners).filter(Boolean).map((owner) => ({ value: owner, label: owner }))
  }, [customerProjects, dealBaseRecords, quotations])
  const personalDashboard = useMemo(
    () =>
      buildPersonalDashboard({
        owner: personalDashboardOwner,
        customerProjects,
        quotations,
        dealBaseRecords,
      }),
    [customerProjects, dealBaseRecords, personalDashboardOwner, quotations],
  )

  const filteredLeads = useMemo(() => {
    const keyword = searchValues.keyword.trim().toLowerCase()
    const city = searchValues.city.trim()
    const brand = searchValues.brand.trim()
    const source = searchValues.source.trim()

    return leads.filter((lead) => {
      const keywordMatched = keyword
        ? [lead.name, lead.phone, lead.city, lead.interestedBrand, lead.interestedModel, lead.source]
            .some((value) => value.toLowerCase().includes(keyword))
        : true
      const cityMatched = matchesSmartValue(lead.city, city, [cityOptions])
      const brandMatched = matchesSmartValue(lead.interestedBrand, brand, [brandOptions, automakerOptions])
      const sourceMatched = source ? lead.source.includes(source) : true
      const statusMatched = searchValues.status ? lead.status === searchValues.status : true

      return keywordMatched && cityMatched && brandMatched && sourceMatched && statusMatched
    })
  }, [leads, searchValues])

  const filteredSuppliers = useMemo(() => {
    const keyword = supplierSearchValues.keyword.trim().toLowerCase()

    return suppliers.filter((supplier) => {
      const keywordMatched = keyword
        ? [supplier.name, supplier.contact, supplier.phone, supplier.note].some((value) =>
            value.toLowerCase().includes(keyword),
          )
        : true
      const typeMatched = supplierSearchValues.type ? supplier.type === supplierSearchValues.type : true
      const statusMatched = supplierSearchValues.status ? supplier.status === supplierSearchValues.status : true

      return keywordMatched && typeMatched && statusMatched
    })
  }, [supplierSearchValues, suppliers])

  const filteredDealBaseRecords = useMemo(() => {
    const keyword = dealBaseSearchValues.keyword.trim().toLowerCase()
    const city = dealBaseSearchValues.city.trim()
    const brand = dealBaseSearchValues.brand.trim()
    const supplyModel = dealBaseSearchValues.supplyModel.trim()

    return dealBaseRecords.filter((record) => {
      const keywordMatched = keyword
        ? [record.dealer, record.contact, record.phone, record.position, record.supplyContent, record.note].some(
            (value) => value.toLowerCase().includes(keyword),
          )
        : true
      const cityMatched = matchesSmartValue(record.city, city, [cityOptions])
      const brandMatched = matchesSmartValue(record.brand, brand, [brandOptions, automakerOptions])
      const modelMatched = matchesSmartValue(record.supplyModel, supplyModel, [modelOptions])
      const statusMatched = dealBaseSearchValues.status ? record.status === dealBaseSearchValues.status : true
      const validMatched =
        typeof dealBaseSearchValues.isValid === 'boolean' ? record.isValid === dealBaseSearchValues.isValid : true

      return keywordMatched && cityMatched && brandMatched && modelMatched && statusMatched && validMatched
    })
  }, [dealBaseRecords, dealBaseSearchValues])

  const filteredCustomerProjects = useMemo(() => {
    const keyword = customerProjectSearchValues.keyword.trim().toLowerCase()
    const oemBrand = customerProjectSearchValues.oemBrand.trim()

    return customerProjects.filter((project) => {
      const keywordMatched = keyword
        ? [
            project.customerName,
            project.salesOwner,
            project.operationOwner,
            project.requirementNote,
            project.settlementNote,
          ].some((value) => value.toLowerCase().includes(keyword))
        : true
      const typeMatched = customerProjectSearchValues.projectType
        ? project.projectType === customerProjectSearchValues.projectType
        : true
      const targetMatched = customerProjectSearchValues.supplyTarget
        ? project.supplyTarget === customerProjectSearchValues.supplyTarget
        : true
      const brandMatched = matchesSmartValue(project.oemBrand, oemBrand, [brandOptions, automakerOptions])
      const statusMatched = customerProjectSearchValues.status ? project.status === customerProjectSearchValues.status : true

      return keywordMatched && typeMatched && targetMatched && brandMatched && statusMatched
    })
  }, [customerProjectSearchValues, customerProjects])

  const filteredQuotations = useMemo(() => {
    const keyword = quotationSearchValues.keyword.trim().toLowerCase()
    const city = quotationSearchValues.city.trim()
    const brand = quotationSearchValues.brand.trim()

    return quotations.filter((quotation) => {
      const keywordMatched = keyword
        ? [
            quotation.customerName,
            quotation.demander,
            quotation.carModel,
            quotation.salesOwner,
            quotation.operationOwner,
            quotation.channelOwner,
            quotation.requirementNote,
            quotation.quoteNote,
          ].some((value) => value.toLowerCase().includes(keyword))
        : true
      const cityMatched = city
        ? quotation.cityScope.some((item) => matchesSmartValue(item, city, [cityOptions]))
        : true
      const brandMatched = matchesSmartValue(quotation.carBrand, brand, [brandOptions, automakerOptions])
      const statusMatched = quotationSearchValues.status ? quotation.status === quotationSearchValues.status : true
      const sourceMatched = quotationSearchValues.sourceType
        ? quotationSearchValues.sourceType === 'upstream'
          ? quotation.upstreamQuotePrice > 0 || Boolean(quotation.upstreamSupplier)
          : quotationSearchValues.sourceType === 'owned_channel'
            ? Boolean(quotation.ownedOwner) && !quotation.ownedOwner.includes('产能中心')
            : quotation.ownedOwner.includes('产能中心')
        : true

      return keywordMatched && cityMatched && brandMatched && statusMatched && sourceMatched
    })
  }, [quotationSearchValues, quotations])

  const metrics = useMemo(
    () => ({
      total: leads.length,
      today: leads.filter((lead) => lead.createdAt.startsWith('2026-07-07')).length,
      duplicate: leads.filter((lead) => lead.status === 'duplicate' || duplicatePhones.has(lead.phone)).length,
      pending: leads.filter((lead) => lead.status === 'pending_clean').length,
      delivered: leads.filter((lead) => lead.status === 'delivered').length,
    }),
    [duplicatePhones, leads],
  )

  const brandRank = useMemo(() => {
    const grouped = leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.interestedBrand] = (acc[lead.interestedBrand] ?? 0) + 1
      return acc
    }, {})
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [leads])

  const sourceRank = useMemo(() => {
    const grouped = leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.source] = (acc[lead.source] ?? 0) + 1
      return acc
    }, {})
    return Object.entries(grouped).sort((a, b) => b[1] - a[1])
  }, [leads])

  const openCreateLead = () => {
    setEditingLead(null)
    form.setFieldsValue(defaultLeadValues)
    setLeadModalOpen(true)
  }

  const openCreateCustomerProject = () => {
    setEditingCustomerProject(null)
    customerProjectForm.setFieldsValue(defaultCustomerProjectValues)
    setCustomerProjectModalOpen(true)
  }

  const openEditCustomerProject = (project: CustomerProject) => {
    setEditingCustomerProject(project)
    customerProjectForm.setFieldsValue(project)
    setCustomerProjectModalOpen(true)
  }

  const openCreateQuotation = () => {
    setEditingQuotation(null)
    quotationForm.setFieldsValue(defaultQuotationValues)
    setQuotationModalOpen(true)
  }

  const openEditQuotation = (quotation: Quotation) => {
    setEditingQuotation(quotation)
    quotationForm.setFieldsValue(quotation)
    setQuotationModalOpen(true)
  }

  const openEditLead = (lead: Lead) => {
    setEditingLead(lead)
    form.setFieldsValue(lead)
    setLeadModalOpen(true)
  }

  const openCreateSupplier = () => {
    setEditingSupplier(null)
    supplierForm.setFieldsValue(defaultSupplierValues)
    setSupplierModalOpen(true)
  }

  const openEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    supplierForm.setFieldsValue(supplier)
    setSupplierModalOpen(true)
  }

  const openCreateDealBase = () => {
    setEditingDealBase(null)
    dealBaseForm.setFieldsValue(defaultDealBaseValues)
    setDealBaseModalOpen(true)
  }

  const openEditDealBase = (record: DealBaseRecord) => {
    setEditingDealBase(record)
    dealBaseForm.setFieldsValue(record)
    setDealBaseModalOpen(true)
  }

  const saveLead = (values: LeadFormValues) => {
    const duplicate = leads.some((lead) => lead.phone === values.phone && lead.id !== editingLead?.id)
    const nextStatus = duplicate && values.status !== 'invalid' ? 'duplicate' : values.status

    if (editingLead) {
      setLeads((prev) =>
        prev.map((lead) => (lead.id === editingLead.id ? { ...lead, ...values, status: nextStatus } : lead)),
      )
      message.success(duplicate ? '已保存，并标记为重复线索' : '线索已保存')
    } else {
      const nextLead: Lead = {
        id: createLeadId(leads.length),
        ...values,
        status: nextStatus,
        createdAt: '2026-07-07 15:30',
        followUps: [],
      }
      setLeads((prev) => [nextLead, ...prev])
      message.success(duplicate ? '已新增，并标记为重复线索' : '线索已新增')
    }

    setLeadModalOpen(false)
  }

  const saveCustomerProject = (values: CustomerProjectFormValues) => {
    const normalized = {
      ...values,
      downPaymentAmount: Number(values.downPaymentAmount || 0),
      unitPrice: Number(values.unitPrice || 0),
      finalUnitPrice: Number(values.finalUnitPrice || 0),
      finalSettlementRatio: Number(values.finalSettlementRatio || 0),
      finalSettlementAmount: Number(values.finalSettlementAmount || 0),
      lossRatio: Number(values.lossRatio || 0),
    }

    if (editingCustomerProject) {
      setCustomerProjects((prev) =>
        prev.map((project) => (project.id === editingCustomerProject.id ? { ...project, ...normalized } : project)),
      )
      message.success('客户项目已保存')
    } else {
      setCustomerProjects((prev) => [{ id: createCustomerProjectId(prev.length), ...normalized }, ...prev])
      message.success('客户项目已新增')
    }

    setCustomerProjectModalOpen(false)
    customerProjectForm.resetFields()
  }

  const saveQuotation = (values: QuotationFormValues) => {
    const normalized = {
      ...values,
      cityScope: values.cityScope ?? [],
      targetPrice: Number(values.targetPrice || 0),
      upstreamQuotePrice: Number(values.upstreamQuotePrice || 0),
      ownedQuotePrice: Number(values.ownedQuotePrice || 0),
      recommendedPrice: Number(values.recommendedPrice || 0),
      grossMargin: Number(values.grossMargin || 0),
    }

    if (editingQuotation) {
      setQuotations((prev) =>
        prev.map((quotation) => (quotation.id === editingQuotation.id ? { ...quotation, ...normalized } : quotation)),
      )
      message.success('报价需求已保存')
    } else {
      setQuotations((prev) => [{ id: createQuotationId(prev.length), ...normalized }, ...prev])
      message.success('报价需求已新增')
    }

    setQuotationModalOpen(false)
    quotationForm.resetFields()
  }

  const simulateImport: UploadProps['beforeUpload'] = () => {
    const imported: Lead[] = [
      {
        id: createLeadId(leads.length + 1),
        name: '孙先生',
        phone: '13500135006',
        city: '南京',
        interestedBrand: '蔚来',
        interestedModel: 'ES6',
        budget: '30-40万',
        purchaseTimeframe: 'within_30_days',
        source: 'Excel导入',
        status: 'pending_clean',
        createdAt: '2026-07-07 16:00',
        owner: '运营A',
        note: '模拟导入：等待清洗。',
        followUps: [],
      },
      {
        id: createLeadId(leads.length + 2),
        name: '重复样例',
        phone: leads[0]?.phone ?? '13800138001',
        city: '上海',
        interestedBrand: '问界',
        interestedModel: 'M9',
        budget: '40-50万',
        purchaseTimeframe: 'within_30_days',
        source: 'Excel导入',
        status: 'duplicate',
        createdAt: '2026-07-07 16:01',
        owner: '运营A',
        note: '模拟导入：手机号重复。',
        followUps: [],
      },
    ]

    setLeads((prev) => [...imported, ...prev])
    message.success('模拟导入完成：成功 1 条，重复 1 条，失败 0 条')
    return false
  }

  const createBatch = (values: { targetId: string; note: string }) => {
    if (selectedLeadIds.length === 0) {
      message.warning('请先在线索管理中选择要交付的线索')
      return
    }

    const nextBatch: DeliveryBatch = {
      id: createBatchId(batches.length),
      targetId: values.targetId,
      leadIds: selectedLeadIds,
      createdBy: roleLabels[role],
      createdAt: '2026-07-07 16:20',
      status: 'delivered',
      note: values.note,
    }

    setBatches((prev) => [nextBatch, ...prev])
    setLeads((prev) =>
      prev.map((lead) =>
        selectedLeadIds.includes(lead.id)
          ? {
              ...lead,
              status: 'delivered',
              followUps: [
                {
                  id: createFollowUpId(lead.followUps.length),
                  time: '2026-07-07 16:20',
                  operator: roleLabels[role],
                  content: `已创建交付批次 ${nextBatch.id}，交付对象：${resolveTargetName(targets, values.targetId)}。`,
                },
                ...lead.followUps,
              ],
            }
          : lead,
      ),
    )
    setSelectedLeadIds([])
    setBatchModalOpen(false)
    batchForm.resetFields()
    message.success('交付批次已创建，所选线索状态已更新为已交付')
  }

  const addTarget = (values: Omit<DeliveryTarget, 'id'>) => {
    setTargets((prev) => [{ id: `T${String(prev.length + 1).padStart(3, '0')}`, ...values }, ...prev])
    setTargetModalOpen(false)
    targetForm.resetFields()
    message.success('交付对象已新增')
  }

  const saveSupplier = (values: SupplierFormValues) => {
    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((supplier) => (supplier.id === editingSupplier.id ? { ...supplier, ...values } : supplier)),
      )
      message.success('供应商已保存')
    } else {
      setSuppliers((prev) => [{ id: createSupplierId(prev.length), ...values }, ...prev])
      message.success('供应商已新增')
    }

    setSupplierModalOpen(false)
    supplierForm.resetFields()
  }

  const saveDealBase = (values: DealBaseFormValues) => {
    const normalized = {
      ...values,
      amount: Number(values.amount || 0),
      isSuccess: values.status === 'success' ? true : values.status === 'failed' ? false : values.isSuccess,
      companyBearsCost: values.status === 'failed' ? values.companyBearsCost : false,
    }

    if (editingDealBase) {
      setDealBaseRecords((prev) =>
        prev.map((record) => (record.id === editingDealBase.id ? { ...record, ...normalized } : record)),
      )
      message.success('成交产能记录已保存')
    } else {
      setDealBaseRecords((prev) => [{ id: createDealBaseId(prev.length), ...normalized }, ...prev])
      message.success('成交产能记录已新增')
    }

    setDealBaseModalOpen(false)
    dealBaseForm.resetFields()
  }

  const updateLeadStatus = (lead: Lead, status: LeadStatus) => {
    if (!canManageFlow(role)) {
      message.warning('当前角色不能流转线索状态')
      return
    }

    setLeads((prev) =>
      prev.map((item) =>
        item.id === lead.id
          ? {
              ...item,
              status,
              followUps: [
                {
                  id: createFollowUpId(item.followUps.length),
                  time: '2026-07-07 16:35',
                  operator: roleLabels[role],
                  content: `状态从“${statusLabels[item.status]}”流转为“${statusLabels[status]}”。`,
                },
                ...item.followUps,
              ],
            }
          : item,
      ),
    )
    message.success(`线索已流转为：${statusLabels[status]}`)
  }

  const updateDealBaseStatus = (record: DealBaseRecord, status: DealBaseStatus) => {
    if (!canManageFlow(role)) {
      message.warning('当前角色不能流转成交产能状态')
      return
    }

    setDealBaseRecords((prev) =>
      prev.map((item) =>
        item.id === record.id
          ? {
              ...item,
              status,
              isSuccess: status === 'success' ? true : status === 'failed' ? false : item.isSuccess,
              companyBearsCost: status === 'failed' ? item.companyBearsCost : false,
            }
          : item,
      ),
    )
    message.success(`成交产能已流转为：${dealBaseStatusLabels[status]}`)
  }

  const updateCustomerProjectStatus = (project: CustomerProject, status: CustomerProjectStatus) => {
    if (!canManageFlow(role)) {
      message.warning('当前角色不能流转客户项目状态')
      return
    }

    setCustomerProjects((prev) => prev.map((item) => (item.id === project.id ? { ...item, status } : item)))
    message.success(`客户项目已流转为：${customerProjectStatusLabels[status]}`)
  }

  const updateQuotationStatus = (quotation: Quotation, status: QuotationStatus) => {
    if (!canManageFlow(role)) {
      message.warning('当前角色不能流转报价状态')
      return
    }

    setQuotations((prev) => prev.map((item) => (item.id === quotation.id ? { ...item, status } : item)))
    message.success(`报价需求已流转为：${quotationStatusLabels[status]}`)
  }

  const addFollowUp = (values: { content: string }) => {
    if (!selectedDetailLead) return

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === selectedDetailLead.id
          ? {
              ...lead,
              followUps: [
                {
                  id: createFollowUpId(lead.followUps.length),
                  time: '2026-07-07 16:50',
                  operator: roleLabels[role],
                  content: values.content,
                },
                ...lead.followUps,
              ],
            }
          : lead,
      ),
    )
    followUpForm.resetFields()
    message.success('跟进记录已添加')
  }

  const resetSearch = () => {
    setSearchValues(defaultSearchValues)
    searchForm.setFieldsValue(defaultSearchValues)
  }

  const resetSupplierSearch = () => {
    setSupplierSearchValues(defaultSupplierSearchValues)
    supplierSearchForm.setFieldsValue(defaultSupplierSearchValues)
  }

  const resetDealBaseSearch = () => {
    setDealBaseSearchValues(defaultDealBaseSearchValues)
    dealBaseSearchForm.setFieldsValue(defaultDealBaseSearchValues)
  }

  const resetCustomerProjectSearch = () => {
    setCustomerProjectSearchValues(defaultCustomerProjectSearchValues)
    customerProjectSearchForm.setFieldsValue(defaultCustomerProjectSearchValues)
  }

  const resetQuotationSearch = () => {
    setQuotationSearchValues(defaultQuotationSearchValues)
    quotationSearchForm.setFieldsValue(defaultQuotationSearchValues)
  }

  const exportSelectedLeads = () => {
    const rows = leads
      .filter((lead) => selectedLeadIds.includes(lead.id))
      .map((lead) => ({
        姓名: lead.name,
        手机号: lead.phone,
        城市: lead.city,
        意向品牌: lead.interestedBrand,
        意向车型: lead.interestedModel,
        预算: lead.budget,
        购车时间: purchaseTimeframeLabels[lead.purchaseTimeframe],
        来源: lead.source,
        状态: statusLabels[lead.status],
        备注: lead.note,
      }))

    if (rows.length === 0) {
      message.warning('请先选择要导出的线索')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '线索')
    XLSX.writeFile(workbook, '汽车销售线索导出.xlsx')
  }

  const leadColumns: TableColumnsType<Lead> = [
    {
      title: '客户',
      dataIndex: 'name',
      width: 120,
      fixed: 'left',
      render: (_, lead) => (
        <Space orientation="vertical" size={0}>
          <Button type="link" className="table-link" onClick={() => setDetailLead(lead)}>
            {lead.name}
          </Button>
          <Text type="secondary">{lead.city}</Text>
        </Space>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 150,
      render: (phone: string) => (
        <Space>
          <Text>{phoneForRole(phone, role)}</Text>
          {duplicatePhones.has(phone) ? <Tag color="orange">重复</Tag> : null}
        </Space>
      ),
    },
    {
      title: '意向车型',
      width: 190,
      render: (_, lead) => `${lead.interestedBrand} ${lead.interestedModel}`,
      filters: [...new Set(leads.map((lead) => lead.interestedBrand))].map((brand) => ({ text: brand, value: brand })),
      onFilter: (value, lead) => lead.interestedBrand === value,
    },
    {
      title: '预算',
      dataIndex: 'budget',
      width: 120,
    },
    {
      title: '购车时间',
      dataIndex: 'purchaseTimeframe',
      width: 110,
      render: (value) => purchaseTimeframeLabels[value as keyof typeof purchaseTimeframeLabels],
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 130,
      render: (value: LeadStatus) => (
        <Space orientation="vertical" size={2}>
          <Tag color={statusColor[value]}>{statusLabels[value]}</Tag>
          {statusFlow.includes(value) ? <Text type="secondary" className="status-flow-label">流程中</Text> : null}
        </Space>
      ),
      filters: leadStatusOptions.map((item) => ({ text: item.label, value: item.value })),
      onFilter: (value, lead) => lead.status === value,
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      width: 100,
    },
    {
      title: '操作',
      width: 250,
      fixed: 'right',
      render: (_, lead) => (
        <Space wrap size={6}>
          <Button size="small" onClick={() => openEditLead(lead)}>
            编辑
          </Button>
          {(nextStatusOptions[lead.status] ?? []).map((status) => (
            <Button
              key={status}
              size="small"
              type={status === 'invalid' ? 'default' : 'primary'}
              ghost={status !== 'invalid'}
              disabled={!canManageFlow(role)}
              onClick={() => updateLeadStatus(lead, status)}
            >
              {statusLabels[status]}
            </Button>
          ))}
        </Space>
      ),
    },
  ]

  const customerProjectColumns: TableColumnsType<CustomerProject> = [
    {
      title: '客户项目',
      width: 220,
      render: (_, project) => (
        <Space orientation="vertical" size={0}>
          <Button type="link" className="table-link" onClick={() => setDetailCustomerProject(project)}>
            {project.customerName}
          </Button>
          <Text type="secondary">{customerProjectTypeLabels[project.projectType]} · {supplyTargetLabels[project.supplyTarget]}</Text>
        </Space>
      ),
    },
    {
      title: '业务',
      width: 190,
      render: (_, project) => (
        <Space orientation="vertical" size={2}>
          <Text>{platformBusinessNameLabels[project.platformBusinessName]} / {supplyContentTypeLabels[project.supplyContentType]}</Text>
          <Text type="secondary">{project.oemBrand || '未指定主机厂'}</Text>
        </Space>
      ),
    },
    { title: '需求量级', dataIndex: 'demandVolume', width: 130 },
    {
      title: '负责人',
      width: 150,
      render: (_, project) => (
        <Space orientation="vertical" size={0}>
          <Text>销售：{project.salesOwner}</Text>
          <Text type="secondary">运营：{project.operationOwner}</Text>
        </Space>
      ),
    },
    {
      title: '合同/首付',
      width: 160,
      render: (_, project) => (
        <Space wrap size={4}>
          <Tag color={project.contractSigned ? 'green' : 'orange'}>{project.contractSigned ? '已签合同' : '未签合同'}</Tag>
          <Tag color={project.downPaymentReceived ? 'green' : 'red'}>{project.downPaymentReceived ? '首付到账' : '首付未到账'}</Tag>
        </Space>
      ),
    },
    {
      title: '结算',
      width: 170,
      render: (_, project) => (
        <Space orientation="vertical" size={2}>
          <Text>{settlementModeLabels[project.settlementMode]} / {accountPeriodLabels[project.accountPeriod]}</Text>
          <Text type="secondary">{project.finalSettlementAmount.toLocaleString()} 元</Text>
        </Space>
      ),
    },
    {
      title: '风险',
      width: 220,
      render: (_, project) => (
        <Space wrap size={4}>
          {!project.downPaymentReceived ? <Tag color="red">首付款未到账</Tag> : null}
          {project.requiresDealProof ? <Tag color="orange">需成交凭证</Tag> : null}
          {project.requiresArrivalProof ? <Tag color="orange">需到店凭证</Tag> : null}
          {project.settlementStandard.includes('客户') ? <Tag color="purple">客户数据为准</Tag> : null}
          {project.lossRatio > 0 ? <Tag color="gold">耗损{Math.round(project.lossRatio * 100)}%</Tag> : null}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (status: CustomerProjectStatus) => {
        const color = status === 'settled' ? 'green' : status === 'paused' ? 'gold' : status === 'completed' ? 'purple' : 'blue'
        return <Tag color={color}>{customerProjectStatusLabels[status]}</Tag>
      },
    },
    {
      title: '操作',
      width: 240,
      render: (_, project) => (
        <Space wrap size={6}>
          <Button size="small" onClick={() => openEditCustomerProject(project)} disabled={!canManageFlow(role)}>
            编辑
          </Button>
          {(customerProjectNextStatusOptions[project.status] ?? []).map((status) => (
            <Button
              key={status}
              size="small"
              type={status === 'paused' ? 'default' : 'primary'}
              ghost={status !== 'paused'}
              disabled={!canManageFlow(role)}
              onClick={() => updateCustomerProjectStatus(project, status)}
            >
              {customerProjectStatusLabels[status]}
            </Button>
          ))}
        </Space>
      ),
    },
  ]

  const quotationColumns: TableColumnsType<Quotation> = [
    {
      title: '询价需求',
      width: 240,
      fixed: 'left',
      render: (_, quotation) => (
        <Space orientation="vertical" size={0}>
          <Button type="link" className="table-link" onClick={() => setDetailQuotation(quotation)}>
            {quotation.customerName}
          </Button>
          <Text type="secondary">
            {quotationContentTypeLabels[quotation.contentType]} · {quotation.carBrand} {quotation.carModel}
          </Text>
        </Space>
      ),
    },
    {
      title: '城市/量级',
      width: 180,
      render: (_, quotation) => (
        <Space orientation="vertical" size={2}>
          <Text>{quotation.cityScope.join('、') || '-'}</Text>
          <Text type="secondary">{quotation.demandVolume || '未填写量级'}</Text>
        </Space>
      ),
    },
    {
      title: '录入与能力要求',
      width: 260,
      render: (_, quotation) => (
        <Space wrap size={4}>
          <Tag>{submissionMethodLabels[quotation.submissionMethod]}</Tag>
          {quotation.supportsPreciseDelivery ? <Tag color="green">精准下发</Tag> : <Tag>非精准</Tag>}
          {quotation.canQrToLinkWhitelist ? <Tag color="green">可白名单</Tag> : null}
          {quotation.requiresVerificationCode ? <Tag color="orange">验证码</Tag> : null}
          {quotation.requiresPingAnPolicy ? <Tag color="blue">平安保单</Tag> : null}
        </Space>
      ),
    },
    {
      title: '成交/判定',
      width: 220,
      render: (_, quotation) => (
        <Space orientation="vertical" size={2}>
          <Space wrap size={4}>
            {quotation.requiresDeal ? <Tag color="purple">需成交</Tag> : <Tag>不要求成交</Tag>}
            {quotation.requiresArrival ? <Tag color="gold">需到店</Tag> : null}
          </Space>
          <Text type="secondary">{requirementJudgementTypeLabels[quotation.judgementType]}</Text>
        </Space>
      ),
    },
    {
      title: '上游报价',
      width: 180,
      render: (_, quotation) => (
        <Space orientation="vertical" size={2}>
          <Text>{quotation.upstreamQuotePrice ? `${quotation.upstreamQuotePrice.toLocaleString()} 元` : '待报价'}</Text>
          <Text type="secondary">{quotation.upstreamCapacity || quotation.upstreamSupplier || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '自有/产能中心',
      width: 180,
      render: (_, quotation) => (
        <Space orientation="vertical" size={2}>
          <Text>{quotation.ownedQuotePrice ? `${quotation.ownedQuotePrice.toLocaleString()} 元` : '待报价'}</Text>
          <Text type="secondary">{quotation.ownedCapacity || quotation.ownedOwner || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '建议报价',
      width: 150,
      render: (_, quotation) => (
        <Space orientation="vertical" size={2}>
          <Text strong>{quotation.recommendedPrice ? `${quotation.recommendedPrice.toLocaleString()} 元` : '-'}</Text>
          <Text type="secondary">毛利 {Math.round(quotation.grossMargin * 100)}%</Text>
        </Space>
      ),
    },
    {
      title: '风险',
      width: 220,
      render: (_, quotation) => (
        <Space wrap size={4}>
          {getQuotationRiskTags(quotation).map((tag) => (
            <Tag key={tag.label} color={tag.color}>
              {tag.label}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '负责人',
      width: 170,
      render: (_, quotation) => (
        <Space orientation="vertical" size={0}>
          <Text>销售：{quotation.salesOwner}</Text>
          <Text type="secondary">运营：{quotation.operationOwner}</Text>
          <Text type="secondary">渠道：{quotation.channelOwner}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 130,
      render: (status: QuotationStatus) => {
        const color = status === 'won' ? 'green' : status === 'lost' ? 'red' : status === 'quoted' ? 'purple' : 'blue'
        return <Tag color={color}>{quotationStatusLabels[status]}</Tag>
      },
    },
    {
      title: '操作',
      width: 260,
      fixed: 'right',
      render: (_, quotation) => (
        <Space wrap size={6}>
          <Button size="small" onClick={() => openEditQuotation(quotation)} disabled={!canManageFlow(role)}>
            编辑
          </Button>
          {(quotationNextStatusOptions[quotation.status] ?? []).map((status) => (
            <Button
              key={status}
              size="small"
              type={status === 'archived' || status === 'lost' ? 'default' : 'primary'}
              ghost={status !== 'archived' && status !== 'lost'}
              disabled={!canManageFlow(role)}
              onClick={() => updateQuotationStatus(quotation, status)}
            >
              {quotationStatusLabels[status]}
            </Button>
          ))}
        </Space>
      ),
    },
  ]

  const batchColumns: TableColumnsType<DeliveryBatch> = [
    { title: '批次编号', dataIndex: 'id', width: 160 },
    {
      title: '交付对象',
      dataIndex: 'targetId',
      render: (targetId: string) => resolveTargetName(targets, targetId),
    },
    { title: '线索数量', dataIndex: 'leadIds', render: (ids: string[]) => `${ids.length} 条` },
    { title: '线索预览', render: (_, batch) => batchLeadNames(batch, leads) || '-' },
    { title: '创建人', dataIndex: 'createdBy' },
    { title: '创建时间', dataIndex: 'createdAt' },
    { title: '状态', dataIndex: 'status', render: () => <Badge status="processing" text="已交付" /> },
  ]

  const targetColumns: TableColumnsType<DeliveryTarget> = [
    { title: '名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', render: (type: DeliveryTarget['type']) => (type === 'oem' ? '主机厂' : '平台') },
    { title: '联系人', dataIndex: 'contact' },
    { title: '联系方式', dataIndex: 'phone', render: (phone: string) => phoneForRole(phone, role) },
    { title: '状态', dataIndex: 'status', render: (status: DeliveryTarget['status']) => <Tag color={status === 'active' ? 'green' : 'default'}>{status === 'active' ? '合作中' : '暂停'}</Tag> },
    { title: '备注', dataIndex: 'note' },
  ]

  const supplierColumns: TableColumnsType<Supplier> = [
    {
      title: '供应商',
      dataIndex: 'name',
      width: 220,
      render: (_, supplier) => (
        <Space orientation="vertical" size={0}>
          <Button type="link" className="table-link" onClick={() => setDetailSupplier(supplier)}>
            {supplier.name}
          </Button>
          <Text type="secondary">{supplierTypeLabels[supplier.type]}</Text>
        </Space>
      ),
    },
    {
      title: '联系人',
      width: 160,
      render: (_, supplier) => (
        <Space orientation="vertical" size={0}>
          <Text>{supplier.contact}</Text>
          <Text type="secondary">{phoneForRole(supplier.phone, role)}</Text>
        </Space>
      ),
    },
    {
      title: '合约周期',
      width: 220,
      render: (_, supplier) => (
        <Space orientation="vertical" size={2}>
          <Text>{supplier.contractStart} 至 {supplier.contractEnd}</Text>
          {isContractExpiringSoon(supplier.contractEnd) ? <Tag color="orange">30天内到期</Tag> : null}
        </Space>
      ),
    },
    {
      title: '付款模式',
      dataIndex: 'paymentMode',
      width: 110,
      render: (value) => <Tag color={value === 'prepaid' ? 'blue' : 'purple'}>{paymentModeLabels[value as keyof typeof paymentModeLabels]}</Tag>,
    },
    {
      title: '账期',
      dataIndex: 'accountPeriod',
      width: 100,
      render: (value) => <Tag>{accountPeriodLabels[value as keyof typeof accountPeriodLabels]}</Tag>,
    },
    {
      title: '合作状态',
      dataIndex: 'status',
      width: 120,
      render: (status: SupplierStatus) => {
        const color = status === 'active' ? 'green' : status === 'paused' ? 'gold' : 'default'
        return <Tag color={color}>{supplierStatusLabels[status]}</Tag>
      },
    },
    {
      title: '备注',
      dataIndex: 'note',
      ellipsis: true,
    },
    {
      title: '操作',
      width: 110,
      render: (_, supplier) => (
        <Button size="small" onClick={() => openEditSupplier(supplier)} disabled={!canManageFlow(role)}>
          编辑
        </Button>
      ),
    },
  ]

  const dealBaseColumns: TableColumnsType<DealBaseRecord> = [
    {
      title: '经销商',
      width: 220,
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Button type="link" className="table-link" onClick={() => setDetailDealBase(record)}>
            {record.dealer}
          </Button>
          <Text type="secondary">{record.city} · {record.brand}</Text>
        </Space>
      ),
    },
    {
      title: '联系人',
      width: 150,
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Text>{record.contact} / {record.position}</Text>
          <Text type="secondary">{phoneForRole(record.phone, role)}</Text>
        </Space>
      ),
    },
    {
      title: '供应车型',
      dataIndex: 'supplyModel',
      width: 160,
    },
    {
      title: '量级',
      dataIndex: 'capacity',
      width: 110,
    },
    {
      title: '付款/金额',
      width: 150,
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Tag color={record.paymentMode === 'prepaid' ? 'blue' : 'purple'}>{paymentModeLabels[record.paymentMode]}</Tag>
          <Text>{record.amount.toLocaleString()} 元</Text>
        </Space>
      ),
    },
    {
      title: '风险',
      width: 160,
      render: (_, record) => (
        <Space wrap size={4}>
          {record.paymentMode === 'prepaid' && !record.isSuccess ? <Tag color="orange">预付待核销</Tag> : null}
          {record.companyBearsCost ? <Tag color="red">公司承担成本</Tag> : null}
          {!record.isValid ? <Tag color="red">无效产能</Tag> : null}
        </Space>
      ),
    },
    {
      title: '有效性',
      dataIndex: 'isValid',
      width: 100,
      render: (isValid: boolean) => <Tag color={isValid ? 'green' : 'red'}>{isValid ? '有效' : '无效'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 130,
      render: (status: DealBaseStatus) => {
        const color = status === 'success' ? 'green' : status === 'failed' ? 'red' : status === 'reserved' ? 'purple' : 'blue'
        return <Tag color={color}>{dealBaseStatusLabels[status]}</Tag>
      },
    },
    {
      title: '操作',
      width: 260,
      render: (_, record) => (
        <Space wrap size={6}>
          <Button size="small" onClick={() => openEditDealBase(record)} disabled={!canManageFlow(role)}>
            编辑
          </Button>
          {(dealBaseNextStatusOptions[record.status] ?? []).map((status) => (
            <Button
              key={status}
              size="small"
              type={status === 'failed' ? 'default' : 'primary'}
              ghost={status !== 'failed'}
              disabled={!canManageFlow(role)}
              onClick={() => updateDealBaseStatus(record, status)}
            >
              {dealBaseStatusLabels[status]}
            </Button>
          ))}
        </Space>
      ),
    },
  ]

  const personalProjectColumns: TableColumnsType<CustomerProject> = [
    {
      title: '项目',
      width: 220,
      render: (_, project) => (
        <Space orientation="vertical" size={0}>
          <Button type="link" className="table-link" onClick={() => setDetailCustomerProject(project)}>
            {project.customerName}
          </Button>
          <Text type="secondary">{project.oemBrand || '未指定主机厂'} · {supplyContentTypeLabels[project.supplyContentType]}</Text>
        </Space>
      ),
    },
    {
      title: '金额',
      width: 140,
      render: (_, project) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{project.finalSettlementAmount.toLocaleString()} 元</Text>
          <Text type="secondary">单价 {project.finalUnitPrice.toLocaleString()} 元</Text>
        </Space>
      ),
    },
    {
      title: '账期/付款',
      width: 190,
      render: (_, project) => (
        <Space wrap size={4}>
          <Tag color={project.accountPeriod === 'cash' ? 'green' : 'blue'}>{accountPeriodLabels[project.accountPeriod]}</Tag>
          <Tag color={project.downPaymentReceived ? 'green' : 'red'}>
            {project.downPaymentReceived ? '首付已到' : '首付未到'}
          </Tag>
          {project.downPaymentAmount > 0 ? <Tag>{project.downPaymentAmount.toLocaleString()} 元首付</Tag> : null}
        </Space>
      ),
    },
    {
      title: '任务状态',
      width: 160,
      render: (_, project) => (
        <Space orientation="vertical" size={2}>
          <Tag color={project.status === 'settled' ? 'green' : project.status === 'paused' ? 'gold' : 'blue'}>
            {customerProjectStatusLabels[project.status]}
          </Tag>
          <Text type="secondary">{project.operationOwner === personalDashboardOwner ? '运营负责' : '销售负责'}</Text>
        </Space>
      ),
    },
  ]

  const personalQuotationColumns: TableColumnsType<Quotation> = [
    {
      title: '报价任务',
      width: 220,
      render: (_, quotation) => (
        <Space orientation="vertical" size={0}>
          <Button type="link" className="table-link" onClick={() => setDetailQuotation(quotation)}>
            {quotation.customerName}
          </Button>
          <Text type="secondary">{quotation.carBrand} {quotation.carModel} · {quotation.demandVolume}</Text>
        </Space>
      ),
    },
    {
      title: '建议报价',
      width: 130,
      render: (_, quotation) => (
        <Text strong>{quotation.recommendedPrice ? `${quotation.recommendedPrice.toLocaleString()} 元` : '待报价'}</Text>
      ),
    },
    {
      title: '状态/风险',
      width: 240,
      render: (_, quotation) => (
        <Space wrap size={4}>
          <Tag color={quotation.status === 'won' ? 'green' : quotation.status === 'lost' ? 'red' : 'blue'}>
            {quotationStatusLabels[quotation.status]}
          </Tag>
          {getQuotationRiskTags(quotation).slice(0, 3).map((tag) => (
            <Tag key={tag.label} color={tag.color}>
              {tag.label}
            </Tag>
          ))}
        </Space>
      ),
    },
  ]

  const renderPersonalDashboard = () => (
    <Space orientation="vertical" size={16} className="page-stack">
      <div className="page-title-row">
        <div>
          <Title level={2}>个人业务驾驶舱</Title>
          <Text type="secondary">自动汇总个人负责项目、项目金额、账期提醒、付款垫付风险和任务完成进度。</Text>
        </div>
        <Space wrap>
          <Text type="secondary">查看个人</Text>
          <Select
            className="personal-owner-select"
            value={personalDashboardOwner}
            options={personalOwnerOptions}
            onChange={setPersonalDashboardOwner}
          />
        </Space>
      </div>

      <div className="personal-metric-grid">
        <Card>
          <Statistic
            title="负责项目"
            value={personalDashboard.projectCount}
            suffix="个"
            prefix={<FolderOpenOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="项目金额"
            value={personalDashboard.totalProjectAmount}
            suffix="元"
            prefix={<WalletOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="待收/未到账"
            value={personalDashboard.pendingPaymentAmount}
            suffix="元"
            prefix={<FieldTimeOutlined />}
            styles={{ content: { color: personalDashboard.pendingPaymentAmount > 0 ? '#dc2626' : '#16a34a' } }}
          />
        </Card>
        <Card>
          <Statistic
            title="垫付风险"
            value={personalDashboard.advanceAmount}
            suffix="元"
            prefix={<WalletOutlined />}
            styles={{ content: { color: personalDashboard.advanceAmount > 0 ? '#d97706' : '#16a34a' } }}
          />
        </Card>
      </div>

      <div className="personal-dashboard-grid">
        <Card title="个人任务完成进度">
          <div className="personal-progress-card">
            <Progress
              type="circle"
              percent={personalDashboard.taskProgressPercent}
              size={132}
              strokeColor={personalDashboard.taskProgressPercent >= 80 ? '#16a34a' : '#2563eb'}
            />
            <Space orientation="vertical" size={8}>
              <Text strong>{personalDashboard.completedTaskCount} / {personalDashboard.totalTaskCount} 项任务已完成</Text>
              <Text type="secondary">覆盖客户项目、报价任务和成交产能三类个人事项。</Text>
              <Space wrap>
                <Tag color="blue">执行中项目 {personalDashboard.activeProjectCount}</Tag>
                <Tag color="orange">待处理报价 {personalDashboard.pendingQuotationCount}</Tag>
                <Tag color={personalDashboard.advanceRiskCount ? 'red' : 'green'}>垫付风险 {personalDashboard.advanceRiskCount}</Tag>
              </Space>
            </Space>
          </div>
        </Card>

        <Card title="账期提醒">
          {personalDashboard.accountPeriodAlerts.length ? (
            <Timeline
              items={personalDashboard.accountPeriodAlerts.map((item) => ({
                color: item.riskLevel === 'warning' ? 'orange' : 'blue',
                children: (
                  <Space orientation="vertical" size={2}>
                    <Text strong>{item.name}</Text>
                    <Text type="secondary">
                      {item.accountPeriodLabel}账期 · 待结算 {item.amount.toLocaleString()} 元
                    </Text>
                  </Space>
                ),
              }))}
            />
          ) : (
            <Empty description="暂无账期提醒" />
          )}
        </Card>

        <Card title="付款与垫付关键信息" className="dashboard-wide">
          <div className="payment-risk-grid">
            <Alert
              type={personalDashboard.pendingPaymentAmount > 0 ? 'warning' : 'success'}
              showIcon
              message={`未到账首付 ${personalDashboard.pendingPaymentAmount.toLocaleString()} 元`}
              description={`已到账首付 ${personalDashboard.receivedDownPaymentAmount.toLocaleString()} 元，需关注未到账项目是否影响供量。`}
            />
            <Alert
              type={personalDashboard.advanceRiskCount > 0 ? 'error' : 'success'}
              showIcon
              message={`垫付风险 ${personalDashboard.advanceRiskCount} 条`}
              description={`预付未成交金额 ${personalDashboard.advanceAmount.toLocaleString()} 元，优先核销已预付成交产能。`}
            />
          </div>
        </Card>

        <Card title="我负责的项目" className="dashboard-wide">
          <Table
            rowKey="id"
            size="small"
            columns={personalProjectColumns}
            dataSource={personalDashboard.ownedProjects}
            pagination={false}
            scroll={{ x: 820 }}
          />
        </Card>

        <Card title="我的报价任务" className="dashboard-wide">
          <Table
            rowKey="id"
            size="small"
            columns={personalQuotationColumns}
            dataSource={personalDashboard.ownedQuotations}
            pagination={false}
            scroll={{ x: 620 }}
          />
        </Card>
      </div>
    </Space>
  )

  const renderDashboard = () => (
    <Space orientation="vertical" size={16} className="page-stack">
      <div className="page-title-row">
        <div>
          <Title level={2}>汽车销售线索工作台</Title>
          <Text type="secondary">今日聚焦线索清洗、重复识别和批次交付。</Text>
        </div>
        <Tag color="blue">{roleLabels[role]}视角</Tag>
      </div>
      <div className="metric-grid">
        <Card><Statistic title="总线索数" value={metrics.total} suffix="条" /></Card>
        <Card><Statistic title="今日新增" value={metrics.today} suffix="条" /></Card>
        <Card><Statistic title="重复线索" value={metrics.duplicate} suffix="条" styles={{ content: { color: '#d46b08' } }} /></Card>
        <Card><Statistic title="待清洗" value={metrics.pending} suffix="条" styles={{ content: { color: '#1677ff' } }} /></Card>
        <Card><Statistic title="已交付" value={metrics.delivered} suffix="条" styles={{ content: { color: '#722ed1' } }} /></Card>
      </div>
      <div className="dashboard-grid">
        <Card title="意向品牌排行">
          <Space orientation="vertical" className="full-width">
            {brandRank.map(([brand, count]) => (
              <div className="rank-row" key={brand}>
                <Text>{brand}</Text>
                <Progress percent={Math.round((count / metrics.total) * 100)} size="small" />
              </div>
            ))}
          </Space>
        </Card>
        <Card title="线索来源分布">
          <Space orientation="vertical" className="full-width">
            {sourceRank.map(([source, count]) => (
              <div className="source-row" key={source}>
                <Text>{source}</Text>
                <Tag>{count} 条</Tag>
              </div>
            ))}
          </Space>
        </Card>
        <Card title="最近交付批次" className="dashboard-wide">
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            columns={batchColumns.slice(0, 5)}
            dataSource={batches.slice(0, 4)}
            scroll={{ x: 760 }}
          />
        </Card>
      </div>
    </Space>
  )

  const renderCustomerProjects = () => (
    <Space orientation="vertical" size={16} className="page-stack">
      <div className="page-title-row">
        <div>
          <Title level={2}>客户项目管理</Title>
          <Text type="secondary">销售接单后的下游客户项目工作台，管理合同、首付、业务要求、人员安排和结算规则。</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCustomerProject} disabled={!canManageFlow(role)}>
          新增项目
        </Button>
      </div>
      {!canManageFlow(role) ? <Alert type="info" message="当前角色仅可查看客户项目，不能新增、编辑或流转状态。" showIcon /> : null}
      <Card className="filter-card">
        <Form
          form={customerProjectSearchForm}
          layout="vertical"
          initialValues={defaultCustomerProjectSearchValues}
          onValuesChange={(_, values) =>
            setCustomerProjectSearchValues({ ...defaultCustomerProjectSearchValues, ...values })
          }
        >
          <div className="customer-project-filter-grid">
            <Form.Item label="关键词" name="keyword">
              <Input placeholder="客户名称 / 销售 / 运营 / 备注" allowClear />
            </Form.Item>
            <Form.Item label="项目类型" name="projectType">
              <Select allowClear placeholder="全部类型" options={customerProjectTypeOptions} />
            </Form.Item>
            <Form.Item label="供给对象" name="supplyTarget">
              <Select allowClear placeholder="全部对象" options={supplyTargetOptions} />
            </Form.Item>
            <Form.Item label="主机厂" name="oemBrand">
              <SmartSelect options={[...automakerOptions, ...brandOptions]} placeholder="问界 / wj / wenjie" />
            </Form.Item>
            <Form.Item label="状态" name="status">
              <Select allowClear placeholder="全部状态" options={customerProjectStatusOptions} />
            </Form.Item>
            <Form.Item label=" " className="filter-actions">
              <Space>
                <Button onClick={resetCustomerProjectSearch}>重置</Button>
                <Tag color="blue">当前 {filteredCustomerProjects.length} 个</Tag>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>
      <Table
        rowKey="id"
        columns={customerProjectColumns}
        dataSource={filteredCustomerProjects}
        scroll={{ x: 1580 }}
        pagination={{ pageSize: 8 }}
      />
    </Space>
  )

  const renderQuotations = () => (
    <Space orientation="vertical" size={16} className="page-stack">
      <div className="page-title-row">
        <div>
          <Title level={2}>报价系统</Title>
          <Text type="secondary">记录客户询价需求，汇总上游、自有渠道和产能中心报价，用于运营与渠道同事协同评估。</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateQuotation} disabled={!canManageFlow(role)}>
          新增询价
        </Button>
      </div>
      {!canManageFlow(role) ? <Alert type="info" message="当前角色仅可查看报价需求，不能新增、编辑或流转状态。" showIcon /> : null}
      <Card className="filter-card">
        <Form
          form={quotationSearchForm}
          layout="vertical"
          initialValues={defaultQuotationSearchValues}
          onValuesChange={(_, values) => setQuotationSearchValues({ ...defaultQuotationSearchValues, ...values })}
        >
          <div className="quotation-filter-grid">
            <Form.Item label="关键词" name="keyword">
              <Input placeholder="客户 / 车型 / 负责人 / 备注" allowClear />
            </Form.Item>
            <Form.Item label="城市" name="city">
              <SmartSelect options={cityOptions} placeholder="上海 / sh / shanghai" />
            </Form.Item>
            <Form.Item label="品牌" name="brand">
              <SmartSelect options={[...brandOptions, ...automakerOptions]} placeholder="问界 / wj / wenjie" />
            </Form.Item>
            <Form.Item label="报价来源" name="sourceType">
              <Select allowClear placeholder="全部来源" options={quotationSourceTypeOptions} />
            </Form.Item>
            <Form.Item label="状态" name="status">
              <Select allowClear placeholder="全部状态" options={quotationStatusOptions} />
            </Form.Item>
            <Form.Item label=" " className="filter-actions">
              <Space>
                <Button onClick={resetQuotationSearch}>重置</Button>
                <Tag color="blue">当前 {filteredQuotations.length} 条</Tag>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>
      <Table
        rowKey="id"
        columns={quotationColumns}
        dataSource={filteredQuotations}
        scroll={{ x: 2190 }}
        pagination={{ pageSize: 8 }}
      />
    </Space>
  )

  const renderLeads = () => (
    <Space orientation="vertical" size={16} className="page-stack">
      <div className="page-title-row">
        <div>
          <Title level={2}>线索管理</Title>
          <Text type="secondary">管理个人客户购车意向、清洗状态和交付准备。</Text>
        </div>
        <Space wrap>
          <Button icon={<ExportOutlined />} onClick={exportSelectedLeads} disabled={!canManageFlow(role)}>
            导出所选
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateLead} disabled={!canManageFlow(role)}>
            新增线索
          </Button>
        </Space>
      </div>
      {!canManageFlow(role) ? <Alert type="info" message="当前为其他角色视角：手机号脱敏，流程操作按钮不可用。" showIcon /> : null}
      <Card className="filter-card">
        <Form
          form={searchForm}
          layout="vertical"
          initialValues={defaultSearchValues}
          onValuesChange={(_, values) => setSearchValues({ ...defaultSearchValues, ...values })}
        >
          <div className="lead-filter-grid">
            <Form.Item label="关键词" name="keyword">
              <Input placeholder="姓名 / 手机号 / 车型 / 来源" allowClear />
            </Form.Item>
            <Form.Item label="城市" name="city">
              <SmartSelect options={cityOptions} placeholder="上海 / sh / shanghai" />
            </Form.Item>
            <Form.Item label="品牌" name="brand">
              <SmartSelect options={[...brandOptions, ...automakerOptions]} placeholder="问界 / wj / wenjie" />
            </Form.Item>
            <Form.Item label="来源" name="source">
              <Input placeholder="例如：抖音线索" allowClear />
            </Form.Item>
            <Form.Item label="状态" name="status">
              <Select allowClear placeholder="全部状态" options={leadStatusOptions} />
            </Form.Item>
            <Form.Item label=" " className="filter-actions">
              <Space>
                <Button onClick={resetSearch}>重置</Button>
                <Tag color="blue">当前 {filteredLeads.length} 条</Tag>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>
      <Table
        rowKey="id"
        columns={leadColumns}
        dataSource={filteredLeads}
        scroll={{ x: 1360 }}
        rowSelection={{
          selectedRowKeys: selectedLeadIds,
          onChange: (keys) => setSelectedLeadIds(keys.map(String)),
          getCheckboxProps: () => ({ disabled: !canManageFlow(role) }),
        }}
        pagination={{ pageSize: 8 }}
      />
      <Flex justify="space-between" align="center" className="batch-bar">
        <Text>已选择 {selectedLeadIds.length} 条线索，可创建交付批次或模拟导出。</Text>
        <Button type="primary" onClick={() => setBatchModalOpen(true)} disabled={!canManageFlow(role) || selectedLeadIds.length === 0}>
          创建交付批次
        </Button>
      </Flex>
    </Space>
  )

  const renderImport = () => (
    <Space orientation="vertical" size={16} className="page-stack">
      <Title level={2}>线索导入</Title>
      <Alert
        type="info"
        showIcon
        message="第一版为前端交互原型"
        description="上传动作会模拟导入结果：成功 1 条、重复 1 条、失败 0 条。后续接真实 Excel 解析时，会沿用同一套字段和校验流程。"
      />
      <Card title="Excel 模板字段">
        <Space wrap>
          {['姓名', '手机号', '城市', '意向品牌', '意向车型', '预算', '购车时间', '来源', '备注'].map((field) => (
            <Tag key={field}>{field}</Tag>
          ))}
        </Space>
      </Card>
      <Upload.Dragger accept=".xlsx,.xls" beforeUpload={simulateImport} maxCount={1} disabled={!canManageFlow(role)}>
        <p className="ant-upload-drag-icon"><CloudUploadOutlined /></p>
        <p className="ant-upload-text">点击或拖拽 Excel 文件到这里</p>
        <p className="ant-upload-hint">当前为模拟导入，用于学习完整业务流程。</p>
      </Upload.Dragger>
      <Card title="最近重复线索">
        <Table
          rowKey="id"
          size="small"
          columns={leadColumns.slice(0, 7)}
          dataSource={leads.filter((lead) => lead.status === 'duplicate' || duplicatePhones.has(lead.phone))}
          pagination={false}
          scroll={{ x: 900 }}
        />
      </Card>
    </Space>
  )

  const renderSuppliers = () => (
    <Space orientation="vertical" size={16} className="page-stack">
      <div className="page-title-row">
        <div>
          <Title level={2}>供应商管理</Title>
          <Text type="secondary">管理汽车销售线索的渠道方和数据方，记录合约、付款模式和账期。</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateSupplier} disabled={!canManageFlow(role)}>
          新增供应商
        </Button>
      </div>
      {!canManageFlow(role) ? <Alert type="info" message="当前角色仅可查看供应商信息，不能新增或编辑。" showIcon /> : null}
      <Card className="filter-card">
        <Form
          form={supplierSearchForm}
          layout="vertical"
          initialValues={defaultSupplierSearchValues}
          onValuesChange={(_, values) => setSupplierSearchValues({ ...defaultSupplierSearchValues, ...values })}
        >
          <div className="supplier-filter-grid">
            <Form.Item label="关键词" name="keyword">
              <Input placeholder="供应商名称 / 联系人 / 电话 / 备注" allowClear />
            </Form.Item>
            <Form.Item label="供应类型" name="type">
              <Select allowClear placeholder="全部类型" options={supplierTypeOptions} />
            </Form.Item>
            <Form.Item label="合作状态" name="status">
              <Select allowClear placeholder="全部状态" options={supplierStatusOptions} />
            </Form.Item>
            <Form.Item label=" " className="filter-actions">
              <Space>
                <Button onClick={resetSupplierSearch}>重置</Button>
                <Tag color="blue">当前 {filteredSuppliers.length} 家</Tag>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>
      <Table
        rowKey="id"
        columns={supplierColumns}
        dataSource={filteredSuppliers}
        scroll={{ x: 1220 }}
        pagination={{ pageSize: 8 }}
      />
    </Space>
  )

  const renderDealBase = () => (
    <Space orientation="vertical" size={16} className="page-stack">
      <div className="page-title-row">
        <div>
          <Title level={2}>成交开拓基地</Title>
          <Text type="secondary">通过自有外呼中心联系经销商，记录可成交产能、预占量级、付款交割和结果风险。</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDealBase} disabled={!canManageFlow(role)}>
          新增产能
        </Button>
      </div>
      {!canManageFlow(role) ? <Alert type="info" message="当前角色仅可查看成交开拓基地，不能新增、编辑或流转状态。" showIcon /> : null}
      <Card className="filter-card">
        <Form
          form={dealBaseSearchForm}
          layout="vertical"
          initialValues={defaultDealBaseSearchValues}
          onValuesChange={(_, values) => setDealBaseSearchValues({ ...defaultDealBaseSearchValues, ...values })}
        >
          <div className="deal-base-filter-grid">
            <Form.Item label="关键词" name="keyword">
              <Input placeholder="经销商 / 联系人 / 电话 / 供应内容" allowClear />
            </Form.Item>
            <Form.Item label="城市" name="city">
              <SmartSelect options={cityOptions} placeholder="上海 / sh / shanghai" />
            </Form.Item>
            <Form.Item label="品牌" name="brand">
              <SmartSelect options={[...brandOptions, ...automakerOptions]} placeholder="问界 / wj / wenjie" />
            </Form.Item>
            <Form.Item label="车型" name="supplyModel">
              <SmartSelect options={modelOptions} placeholder="M9 / wjm9 / model y" />
            </Form.Item>
            <Form.Item label="状态" name="status">
              <Select allowClear placeholder="全部状态" options={dealBaseStatusOptions} />
            </Form.Item>
            <Form.Item label="有效性" name="isValid">
              <Select
                allowClear
                placeholder="全部"
                options={[{ value: true, label: '有效' }, { value: false, label: '无效' }]}
              />
            </Form.Item>
            <Form.Item label=" " className="filter-actions">
              <Space>
                <Button onClick={resetDealBaseSearch}>重置</Button>
                <Tag color="blue">当前 {filteredDealBaseRecords.length} 条</Tag>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>
      <Table
        rowKey="id"
        columns={dealBaseColumns}
        dataSource={filteredDealBaseRecords}
        scroll={{ x: 1540 }}
        pagination={{ pageSize: 8 }}
      />
    </Space>
  )

  const renderBatches = () => (
    <Space orientation="vertical" size={16} className="page-stack">
      <div className="page-title-row">
        <div>
          <Title level={2}>交付批次</Title>
          <Text type="secondary">记录线索交付给平台或主机厂的批次、数量和状态。</Text>
        </div>
        <Button type="primary" disabled={!canManageFlow(role) || selectedLeadIds.length === 0} onClick={() => setBatchModalOpen(true)}>
          用已选线索创建批次
        </Button>
      </div>
      <Table rowKey="id" columns={batchColumns} dataSource={batches} />
    </Space>
  )

  const renderTargets = () => (
    <Space orientation="vertical" size={16} className="page-stack">
      <div className="page-title-row">
        <div>
          <Title level={2}>交付对象</Title>
          <Text type="secondary">管理平台、主机厂等线索接收方。</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setTargetModalOpen(true)} disabled={!canManageFlow(role)}>
          新增对象
        </Button>
      </div>
      <Table rowKey="id" columns={targetColumns} dataSource={targets} />
    </Space>
  )

  const renderSop = () => (
    <Space orientation="vertical" size={16} className="page-stack">
      <Title level={2}>流程/SOP</Title>
      <Card>
        <Paragraph>项目已在 <Text code>docs/sop/</Text> 中同步建立工作流程手册。第一版重点覆盖环境搭建、页面开发、个人业务驾驶舱、客户项目、报价系统、线索导入、清洗去重、供应商管理、成交开拓基地、交付批次和发布前检查。</Paragraph>
        <Space wrap>
          <Tag color="blue">开发环境搭建 SOP</Tag>
          <Tag color="blue">页面开发 SOP</Tag>
          <Tag color="blue">个人业务驾驶舱 SOP</Tag>
          <Tag color="blue">客户项目管理 SOP</Tag>
          <Tag color="blue">报价系统 SOP</Tag>
          <Tag color="blue">线索导入 SOP</Tag>
          <Tag color="blue">清洗去重 SOP</Tag>
          <Tag color="blue">供应商管理 SOP</Tag>
          <Tag color="blue">成交开拓基地 SOP</Tag>
          <Tag color="blue">交付批次 SOP</Tag>
          <Tag color="blue">发布前检查 SOP</Tag>
        </Space>
      </Card>
    </Space>
  )

  const renderPermissions = () => (
    <Space orientation="vertical" size={16} className="page-stack">
      <Title level={2}>权限配置占位</Title>
      <Alert
        type="success"
        showIcon
        message="第一版权限策略"
        description="管理员拥有完整权限；运营负责线索导入、清洗、流程流转和交付批次；其他角色先预留，后续按你的真实组织需求细配。"
      />
      <Card>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="管理员">完整查看、编辑、导入、导出、创建批次、管理交付对象。</Descriptions.Item>
          <Descriptions.Item label="运营">负责流程：客户项目维护、导入、清洗、去重、供应商维护、成交开拓基地维护、创建交付批次。</Descriptions.Item>
          <Descriptions.Item label="其他角色">当前只演示脱敏查看，后续再配置具体菜单和按钮权限。</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  )

  const pageMap: Record<PageKey, ReactNode> = {
    dashboard: renderDashboard(),
    personalDashboard: renderPersonalDashboard(),
    customerProjects: renderCustomerProjects(),
    quotations: renderQuotations(),
    leads: renderLeads(),
    import: renderImport(),
    suppliers: renderSuppliers(),
    dealBase: renderDealBase(),
    batches: renderBatches(),
    targets: renderTargets(),
    sop: renderSop(),
    permissions: renderPermissions(),
  }

  return (
    <Layout className="app-shell">
      <Sider width={248} breakpoint="lg" collapsedWidth="0" className="app-sider">
        <div className="brand-block">
          <div className="brand-mark">启</div>
          <div>
            <Text strong>启效智联</Text>
            <Text type="secondary" className="brand-subtitle">线索管理原型</Text>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={({ key }) => navigate(pagePaths[key as PageKey])}
        />
      </Sider>
      <Layout>
        <Header className="app-header" style={{ background: colorBgContainer }}>
          <div>
            <Text strong>汽车销售线索管理系统</Text>
            <Text type="secondary" className="header-subtitle">Ant Design Pro 风格前端原型</Text>
          </div>
          <Space>
            <Text type="secondary">当前角色</Text>
            <Select<UserRole>
              value={role}
              className="role-select"
              onChange={setRole}
              options={[
                { value: 'admin', label: '管理员' },
                { value: 'operator', label: '运营' },
                { value: 'other', label: '其他角色' },
              ]}
            />
          </Space>
        </Header>
        <Content className="app-content">{pageMap[currentPage]}</Content>
      </Layout>

      <Modal
        title={editingLead ? '编辑线索' : '新增线索'}
        open={leadModalOpen}
        onCancel={() => setLeadModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form layout="vertical" form={form} initialValues={defaultLeadValues} onFinish={saveLead}>
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input maxLength={11} />
          </Form.Item>
          <Form.Item label="城市" name="city" rules={[{ required: true, message: '请输入城市' }]}>
            <SmartSelect options={cityOptions} placeholder="选择或手动添加城市" />
          </Form.Item>
          <Form.Item label="意向品牌" name="interestedBrand" rules={[{ required: true, message: '请输入品牌' }]}>
            <SmartSelect options={[...brandOptions, ...automakerOptions]} placeholder="选择或手动添加品牌" />
          </Form.Item>
          <Form.Item label="意向车型" name="interestedModel" rules={[{ required: true, message: '请输入车型' }]}>
            <SmartSelect options={modelOptions} placeholder="选择或手动添加车型" />
          </Form.Item>
          <Form.Item label="预算" name="budget">
            <Input placeholder="例如：20-30万" />
          </Form.Item>
          <Form.Item label="购车时间" name="purchaseTimeframe">
            <Select options={Object.entries(purchaseTimeframeLabels).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item label="来源" name="source">
            <Input placeholder="例如：抖音线索" />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select options={leadStatusOptions} />
          </Form.Item>
          <Form.Item label="负责人" name="owner">
            <Input />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建交付批次"
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        onOk={() => batchForm.submit()}
        destroyOnHidden
      >
        {selectedLeadIds.length ? (
          <Alert type="info" showIcon message={`将交付 ${selectedLeadIds.length} 条线索`} className="modal-alert" />
        ) : (
          <Empty description="请先在线索管理中选择线索" />
        )}
        <Form layout="vertical" form={batchForm} onFinish={createBatch}>
          <Form.Item label="交付对象" name="targetId" rules={[{ required: true, message: '请选择交付对象' }]}>
            <Select options={activeTargets.map((target) => ({ value: target.id, label: target.name }))} />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={3} placeholder="记录交付口径、筛选条件或对账说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingCustomerProject ? '编辑客户项目' : '新增客户项目'}
        open={customerProjectModalOpen}
        onCancel={() => setCustomerProjectModalOpen(false)}
        onOk={() => customerProjectForm.submit()}
        width={860}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          form={customerProjectForm}
          initialValues={defaultCustomerProjectValues}
          onFinish={saveCustomerProject}
        >
          <Title level={5}>项目基础信息</Title>
          <Form.Item label="客户名称" name="customerName" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input placeholder="下游客户 / 甲方名称" />
          </Form.Item>
          <div className="modal-form-grid">
            <Form.Item label="项目类型" name="projectType">
              <Select options={customerProjectTypeOptions} />
            </Form.Item>
            <Form.Item label="供给对象" name="supplyTarget">
              <Select options={supplyTargetOptions} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="主机厂" name="oemBrand">
              <SmartSelect options={[...automakerOptions, ...brandOptions]} placeholder="选择或手动添加主机厂/品牌" />
            </Form.Item>
            <Form.Item label="是否直播业务" name="isLiveBusiness">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="销售负责人" name="salesOwner">
              <Input />
            </Form.Item>
            <Form.Item label="运营负责人" name="operationOwner">
              <Input />
            </Form.Item>
          </div>
          <Form.Item label="项目状态" name="status">
            <Select options={customerProjectStatusOptions} />
          </Form.Item>

          <Title level={5}>业务与交付要求</Title>
          <div className="modal-form-grid">
            <Form.Item label="平台业务名称" name="platformBusinessName">
              <Select options={platformBusinessNameOptions} />
            </Form.Item>
            <Form.Item label="供给内容" name="supplyContentType">
              <Select options={supplyContentTypeOptions} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="需求量级" name="demandVolume">
              <Input placeholder="例如：3000条/月" />
            </Form.Item>
            <Form.Item label="推送时间" name="pushTime">
              <Input placeholder="例如：每日 10:00 / T+1" />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="是否要求首触" name="requiresFirstTouch">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
            <Form.Item label="有效率要求" name="effectiveRateRequirement">
              <Input placeholder="例如：不低于 65%" />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="系统排重结果有效" name="systemDedupValid">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
            <Form.Item label="推送是否成功" name="pushSuccess">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
          </div>

          <Title level={5}>成交与到店要求</Title>
          <div className="modal-form-grid">
            <Form.Item label="支持精准下发" name="supportsPreciseDelivery">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
            <Form.Item label="成交周期" name="dealCycle">
              <Select options={dealCycleOptions} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="需要成交凭证" name="requiresDealProof">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
            <Form.Item label="成交凭证类型" name="dealProofType">
              <Input placeholder="图片 / 视频 / 其他" />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="需要到店录音" name="requiresArrivalRecording">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
            <Form.Item label="需要到店凭证" name="requiresArrivalProof">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="确认系统到店" name="requiresSystemArrivalConfirm">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
            <Form.Item label="成交单店要求" name="maxDealsPerStore">
              <Input placeholder="例如：不超过3单" />
            </Form.Item>
          </div>
          <Form.Item label="单店其他要求" name="storeRequirementNote">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Title level={5}>合同、付款与结算</Title>
          <div className="modal-form-grid">
            <Form.Item label="是否已签合同" name="contractSigned">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
            <Form.Item label="合同编号/说明" name="contractNo">
              <Input />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="首付款金额" name="downPaymentAmount">
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item label="首付款到账" name="downPaymentReceived">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="结算方式" name="settlementMode">
              <Select options={settlementModeOptions} />
            </Form.Item>
            <Form.Item label="账期" name="accountPeriod">
              <Select options={accountPeriodOptions} />
            </Form.Item>
          </div>
          <Form.Item label="发票形式" name="invoiceType">
            <Select options={invoiceTypeOptions} />
          </Form.Item>
          <div className="modal-form-grid">
            <Form.Item label="结算单价" name="unitPrice">
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item label="最终结算单价" name="finalUnitPrice">
              <Input type="number" min={0} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="最终结算比例" name="finalSettlementRatio">
              <Input type="number" min={0} step="0.01" />
            </Form.Item>
            <Form.Item label="最终结算总金额" name="finalSettlementAmount">
              <Input type="number" min={0} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="结算标准" name="settlementStandard">
              <Input placeholder="客户给出数据为准 / 系统数据为准 / 双方确认" />
            </Form.Item>
            <Form.Item label="耗损比例" name="lossRatio">
              <Input type="number" min={0} step="0.01" />
            </Form.Item>
          </div>
          <Form.Item label="结算备注" name="settlementNote">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="其他要求备注" name="requirementNote">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingQuotation ? '编辑报价需求' : '新增报价需求'}
        open={quotationModalOpen}
        onCancel={() => setQuotationModalOpen(false)}
        onOk={() => quotationForm.submit()}
        width={900}
        destroyOnHidden
      >
        <Form layout="vertical" form={quotationForm} initialValues={defaultQuotationValues} onFinish={saveQuotation}>
          <Title level={5}>客户询价需求</Title>
          <div className="modal-form-grid">
            <Form.Item label="客户名称" name="customerName" rules={[{ required: true, message: '请输入客户名称' }]}>
              <Input placeholder="例如：易车华东 KA 询价" />
            </Form.Item>
            <Form.Item label="需求联系人" name="demander">
              <Input placeholder="客户侧对接人" />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="询价时间" name="demandTime">
              <Input placeholder="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="需求量级" name="demandVolume">
              <Input placeholder="例如：3000条/月、200组到店/月" />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="需求城市" name="cityScope" rules={[{ required: true, message: '请选择需求城市' }]}>
              <Select mode="tags" placeholder="输入或选择城市" options={cityOptions.map((item) => ({ value: item.label, label: item.label }))} />
            </Form.Item>
            <Form.Item label="需求类型" name="contentType">
              <Select options={quotationContentTypeOptions} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="品牌" name="carBrand" rules={[{ required: true, message: '请输入品牌' }]}>
              <SmartSelect options={[...brandOptions, ...automakerOptions]} placeholder="选择或手动添加品牌" />
            </Form.Item>
            <Form.Item label="车型/型号" name="carModel" rules={[{ required: true, message: '请输入车型或型号' }]}>
              <SmartSelect options={modelOptions} placeholder="选择或手动添加车型" />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="客户给价" name="targetPrice">
              <Input type="number" min={0} placeholder="客户已有价格，没有则填 0" />
            </Form.Item>
            <Form.Item label="是否需要报价" name="needsQuotation">
              <Select options={[{ value: true, label: '需要报价' }, { value: false, label: '客户已有价格' }]} />
            </Form.Item>
          </div>

          <Title level={5}>录入、下发与判定规则</Title>
          <div className="modal-form-grid">
            <Form.Item label="录入方式" name="submissionMethod">
              <Select options={submissionMethodOptions} />
            </Form.Item>
            <Form.Item label="支持精准下发" name="supportsPreciseDelivery">
              <Select options={[{ value: true, label: '支持' }, { value: false, label: '不支持' }]} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="二维码可转链接白名单" name="canQrToLinkWhitelist">
              <Select options={[{ value: true, label: '可以' }, { value: false, label: '不可以/未确认' }]} />
            </Form.Item>
            <Form.Item label="需要接收验证码" name="requiresVerificationCode">
              <Select options={[{ value: true, label: '需要' }, { value: false, label: '不需要' }]} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="需要平安保单" name="requiresPingAnPolicy">
              <Select options={[{ value: true, label: '需要' }, { value: false, label: '不需要' }]} />
            </Form.Item>
            <Form.Item label="判定方式" name="judgementType">
              <Select options={requirementJudgementTypeOptions} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="是否要求成交" name="requiresDeal">
              <Select options={[{ value: true, label: '要求成交' }, { value: false, label: '不要求成交' }]} />
            </Form.Item>
            <Form.Item label="成交比例/要求" name="requiredDealRatio">
              <Input placeholder="例如：成交比例不低于 8%" />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="是否要求到店" name="requiresArrival">
              <Select options={[{ value: true, label: '要求到店' }, { value: false, label: '不要求到店' }]} />
            </Form.Item>
            <Form.Item label="判定标准" name="judgementStandard">
              <Input placeholder="系统判定 / 我方凭证 / 客户系统 / 双方确认" />
            </Form.Item>
          </div>

          <Title level={5}>报价与量级</Title>
          <div className="modal-form-grid">
            <Form.Item label="上游报价" name="upstreamQuotePrice">
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item label="上游量级" name="upstreamCapacity">
              <Input placeholder="例如：2500条/月" />
            </Form.Item>
          </div>
          <Form.Item label="上游供应方" name="upstreamSupplier">
            <Input placeholder="供应商或上游渠道名称" />
          </Form.Item>
          <div className="modal-form-grid">
            <Form.Item label="自有/产能中心报价" name="ownedQuotePrice">
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item label="自有/产能中心量级" name="ownedCapacity">
              <Input placeholder="例如：1200条/月、80组/月" />
            </Form.Item>
          </div>
          <Form.Item label="自有/产能中心负责人" name="ownedOwner">
            <Input placeholder="自有渠道A / 产能中心B" />
          </Form.Item>
          <div className="modal-form-grid">
            <Form.Item label="建议对外报价" name="recommendedPrice">
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item label="预计毛利率" name="grossMargin">
              <Input type="number" min={0} step="0.01" placeholder="例如：0.25" />
            </Form.Item>
          </div>

          <Title level={5}>负责人和备注</Title>
          <div className="modal-form-grid">
            <Form.Item label="销售负责人" name="salesOwner">
              <Input />
            </Form.Item>
            <Form.Item label="运营负责人" name="operationOwner">
              <Input />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="渠道负责人" name="channelOwner">
              <Input />
            </Form.Item>
            <Form.Item label="报价状态" name="status">
              <Select options={quotationStatusOptions} />
            </Form.Item>
          </div>
          <Form.Item label="需求备注" name="requirementNote">
            <Input.TextArea rows={3} placeholder="记录客户原始口径、限制条件、未确认事项" />
          </Form.Item>
          <Form.Item label="报价备注" name="quoteNote">
            <Input.TextArea rows={3} placeholder="记录报价策略、量级拆分、上游反馈和风险提示" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增交付对象"
        open={targetModalOpen}
        onCancel={() => setTargetModalOpen(false)}
        onOk={() => targetForm.submit()}
        destroyOnHidden
      >
        <Form layout="vertical" form={targetForm} onFinish={addTarget} initialValues={{ type: 'platform', status: 'active' }}>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="类型" name="type">
            <Select options={[{ value: 'platform', label: '平台' }, { value: 'oem', label: '主机厂' }]} />
          </Form.Item>
          <Form.Item label="联系人" name="contact">
            <Input />
          </Form.Item>
          <Form.Item label="联系方式" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select options={[{ value: 'active', label: '合作中' }, { value: 'paused', label: '暂停' }]} />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSupplier ? '编辑供应商' : '新增供应商'}
        open={supplierModalOpen}
        onCancel={() => setSupplierModalOpen(false)}
        onOk={() => supplierForm.submit()}
        destroyOnHidden
      >
        <Form layout="vertical" form={supplierForm} initialValues={defaultSupplierValues} onFinish={saveSupplier}>
          <Form.Item label="供应商名称" name="name" rules={[{ required: true, message: '请输入供应商名称' }]}>
            <Input placeholder="例如：星河汽车线索渠道" />
          </Form.Item>
          <Form.Item label="供应类型" name="type" rules={[{ required: true, message: '请选择供应类型' }]}>
            <Select options={supplierTypeOptions} />
          </Form.Item>
          <Form.Item label="联系人" name="contact" rules={[{ required: true, message: '请输入联系人' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input />
          </Form.Item>
          <div className="modal-form-grid">
            <Form.Item label="合约开始日期" name="contractStart" rules={[{ required: true, message: '请输入合约开始日期' }]}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item label="合约结束日期" name="contractEnd" rules={[{ required: true, message: '请输入合约结束日期' }]}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="付款模式" name="paymentMode">
              <Select options={paymentModeOptions} />
            </Form.Item>
            <Form.Item label="账期" name="accountPeriod">
              <Select options={accountPeriodOptions} />
            </Form.Item>
          </div>
          <Form.Item label="合作状态" name="status">
            <Select options={supplierStatusOptions} />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={3} placeholder="记录供应范围、结算口径、质量备注或暂停原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingDealBase ? '编辑成交产能' : '新增成交产能'}
        open={dealBaseModalOpen}
        onCancel={() => setDealBaseModalOpen(false)}
        onOk={() => dealBaseForm.submit()}
        width={760}
        destroyOnHidden
      >
        <Form layout="vertical" form={dealBaseForm} initialValues={defaultDealBaseValues} onFinish={saveDealBase}>
          <div className="modal-form-grid">
            <Form.Item label="城市" name="city" rules={[{ required: true, message: '请输入城市' }]}>
              <SmartSelect options={cityOptions} placeholder="选择或手动添加城市" />
            </Form.Item>
            <Form.Item label="主机厂品牌" name="brand" rules={[{ required: true, message: '请输入主机厂品牌' }]}>
              <SmartSelect options={[...automakerOptions, ...brandOptions]} placeholder="选择或手动添加主机厂/品牌" />
            </Form.Item>
          </div>
          <Form.Item label="经销商门店" name="dealer" rules={[{ required: true, message: '请输入经销商门店' }]}>
            <Input />
          </Form.Item>
          <div className="modal-form-grid">
            <Form.Item label="联系人" name="contact" rules={[{ required: true, message: '请输入联系人' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="电话" name="phone" rules={[{ required: true, message: '请输入电话' }]}>
              <Input />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="职位" name="position">
              <Input />
            </Form.Item>
            <Form.Item label="供应车型" name="supplyModel" rules={[{ required: true, message: '请输入供应车型' }]}>
              <SmartSelect options={modelOptions} placeholder="选择或手动添加车型" />
            </Form.Item>
          </div>
          <Form.Item label="供应内容" name="supplyContent">
            <Input.TextArea rows={3} placeholder="例如：可预占几台、供应窗口、适配客户需求口径" />
          </Form.Item>
          <div className="modal-form-grid">
            <Form.Item label="供应凭证" name="supplyProof">
              <Input placeholder="截图编号、录音编号、链接或凭证说明" />
            </Form.Item>
            <Form.Item label="供应时间" name="supplyTime">
              <Input placeholder="YYYY-MM-DD HH:mm" />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="是否有效" name="isValid">
              <Select options={[{ value: true, label: '有效' }, { value: false, label: '无效' }]} />
            </Form.Item>
            <Form.Item label="交割状态" name="status">
              <Select options={dealBaseStatusOptions} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="付款方式" name="paymentMode">
              <Select options={paymentModeOptions} />
            </Form.Item>
            <Form.Item label="金额" name="amount">
              <Input type="number" min={0} />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="量级" name="capacity">
              <Input placeholder="例如：5台/7天" />
            </Form.Item>
            <Form.Item label="我司对接人" name="owner">
              <Input />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="我司付款人" name="payer">
              <Input />
            </Form.Item>
            <Form.Item label="付款时间" name="paymentTime">
              <Input placeholder="YYYY-MM-DD HH:mm 或 成交后 T+7" />
            </Form.Item>
          </div>
          <div className="modal-form-grid">
            <Form.Item label="是否成功成交" name="isSuccess">
              <Select options={[{ value: true, label: '成功' }, { value: false, label: '未成功' }]} />
            </Form.Item>
            <Form.Item label="成本公司承担" name="companyBearsCost">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
          </div>
          <Form.Item label="失败原因" name="failureReason">
            <Input.TextArea rows={2} placeholder="例如：客户不算成交、门店未认定、车型不匹配" />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="线索详情" open={Boolean(selectedDetailLead)} onClose={() => setDetailLead(null)} size="large">
        {selectedDetailLead ? (
          <Space orientation="vertical" size={16} className="page-stack">
            <Card className="lead-profile-card">
              <div className="lead-profile-head">
                <div>
                  <Title level={3}>{selectedDetailLead.name}</Title>
                  <Text type="secondary">
                    {selectedDetailLead.city} · {selectedDetailLead.interestedBrand} {selectedDetailLead.interestedModel}
                  </Text>
                </div>
                <Tag color={statusColor[selectedDetailLead.status]}>{statusLabels[selectedDetailLead.status]}</Tag>
              </div>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="手机号">{phoneForRole(selectedDetailLead.phone, role)}</Descriptions.Item>
                <Descriptions.Item label="负责人">{selectedDetailLead.owner}</Descriptions.Item>
                <Descriptions.Item label="预算">{selectedDetailLead.budget}</Descriptions.Item>
                <Descriptions.Item label="购车时间">{purchaseTimeframeLabels[selectedDetailLead.purchaseTimeframe]}</Descriptions.Item>
                <Descriptions.Item label="来源">{selectedDetailLead.source}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{selectedDetailLead.createdAt}</Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>{selectedDetailLead.note}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="状态流转">
              <Space wrap>
                <Tag color={statusColor[selectedDetailLead.status]}>当前：{statusLabels[selectedDetailLead.status]}</Tag>
                {(nextStatusOptions[selectedDetailLead.status] ?? []).length ? (
                  (nextStatusOptions[selectedDetailLead.status] ?? []).map((status) => (
                    <Button
                      key={status}
                      type={status === 'invalid' ? 'default' : 'primary'}
                      disabled={!canManageFlow(role)}
                      onClick={() => updateLeadStatus(selectedDetailLead, status)}
                    >
                      流转为{statusLabels[status]}
                    </Button>
                  ))
                ) : (
                  <Text type="secondary">当前状态暂无下一步流转。</Text>
                )}
              </Space>
            </Card>

            <Card title="跟进记录">
              {canManageFlow(role) ? (
                <Form form={followUpForm} layout="vertical" onFinish={addFollowUp} className="follow-up-form">
                  <Form.Item name="content" rules={[{ required: true, message: '请输入跟进内容' }]}>
                    <Input.TextArea rows={3} placeholder="记录电话沟通、客户意向、交付口径或异常情况" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit">添加跟进</Button>
                </Form>
              ) : null}
              {selectedDetailLead.followUps.length ? (
                <Timeline
                  className="follow-up-timeline"
                  items={selectedDetailLead.followUps.map((item) => ({
                    content: (
                      <Space orientation="vertical" size={2}>
                        <Text strong>{item.operator} · {item.time}</Text>
                        <Text>{item.content}</Text>
                      </Space>
                    ),
                  }))}
                />
              ) : (
                <Empty description="暂无跟进记录" />
              )}
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Drawer title="报价需求详情" open={Boolean(selectedDetailQuotation)} onClose={() => setDetailQuotation(null)} size="large">
        {selectedDetailQuotation ? (
          <Space orientation="vertical" size={16} className="page-stack">
            <Card className="lead-profile-card">
              <div className="lead-profile-head">
                <div>
                  <Title level={3}>{selectedDetailQuotation.customerName}</Title>
                  <Text type="secondary">
                    {selectedDetailQuotation.cityScope.join('、')} · {selectedDetailQuotation.carBrand} {selectedDetailQuotation.carModel} · {quotationContentTypeLabels[selectedDetailQuotation.contentType]}
                  </Text>
                </div>
                <Tag color={selectedDetailQuotation.status === 'won' ? 'green' : selectedDetailQuotation.status === 'lost' ? 'red' : 'blue'}>
                  {quotationStatusLabels[selectedDetailQuotation.status]}
                </Tag>
              </div>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="需求联系人">{selectedDetailQuotation.demander || '-'}</Descriptions.Item>
                <Descriptions.Item label="询价时间">{selectedDetailQuotation.demandTime || '-'}</Descriptions.Item>
                <Descriptions.Item label="需求量级">{selectedDetailQuotation.demandVolume || '-'}</Descriptions.Item>
                <Descriptions.Item label="客户给价">{selectedDetailQuotation.targetPrice ? `${selectedDetailQuotation.targetPrice.toLocaleString()} 元` : '未给价'}</Descriptions.Item>
                <Descriptions.Item label="销售负责人">{selectedDetailQuotation.salesOwner}</Descriptions.Item>
                <Descriptions.Item label="运营负责人">{selectedDetailQuotation.operationOwner}</Descriptions.Item>
                <Descriptions.Item label="渠道负责人">{selectedDetailQuotation.channelOwner}</Descriptions.Item>
                <Descriptions.Item label="需求备注" span={2}>{selectedDetailQuotation.requirementNote || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="需求规则">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="录入方式">{submissionMethodLabels[selectedDetailQuotation.submissionMethod]}</Descriptions.Item>
                <Descriptions.Item label="精准下发">{selectedDetailQuotation.supportsPreciseDelivery ? '支持' : '不支持'}</Descriptions.Item>
                <Descriptions.Item label="二维码白名单">{selectedDetailQuotation.canQrToLinkWhitelist ? '可以转链接开白名单' : '不可以/未确认'}</Descriptions.Item>
                <Descriptions.Item label="验证码">{selectedDetailQuotation.requiresVerificationCode ? '需要接收' : '不需要'}</Descriptions.Item>
                <Descriptions.Item label="平安保单">{selectedDetailQuotation.requiresPingAnPolicy ? '需要' : '不需要'}</Descriptions.Item>
                <Descriptions.Item label="成交要求">{selectedDetailQuotation.requiresDeal ? selectedDetailQuotation.requiredDealRatio || '要求成交' : '不要求成交'}</Descriptions.Item>
                <Descriptions.Item label="到店要求">{selectedDetailQuotation.requiresArrival ? '要求到店' : '不要求到店'}</Descriptions.Item>
                <Descriptions.Item label="判定方式">{requirementJudgementTypeLabels[selectedDetailQuotation.judgementType]}</Descriptions.Item>
                <Descriptions.Item label="判定标准" span={2}>{selectedDetailQuotation.judgementStandard || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="报价对比">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="上游报价">{selectedDetailQuotation.upstreamQuotePrice ? `${selectedDetailQuotation.upstreamQuotePrice.toLocaleString()} 元` : '待报价'}</Descriptions.Item>
                <Descriptions.Item label="上游量级">{selectedDetailQuotation.upstreamCapacity || '-'}</Descriptions.Item>
                <Descriptions.Item label="上游供应方">{selectedDetailQuotation.upstreamSupplier || '-'}</Descriptions.Item>
                <Descriptions.Item label="自有/产能中心报价">{selectedDetailQuotation.ownedQuotePrice ? `${selectedDetailQuotation.ownedQuotePrice.toLocaleString()} 元` : '待报价'}</Descriptions.Item>
                <Descriptions.Item label="自有/产能中心量级">{selectedDetailQuotation.ownedCapacity || '-'}</Descriptions.Item>
                <Descriptions.Item label="自有/产能中心负责人">{selectedDetailQuotation.ownedOwner || '-'}</Descriptions.Item>
                <Descriptions.Item label="建议对外报价">{selectedDetailQuotation.recommendedPrice ? `${selectedDetailQuotation.recommendedPrice.toLocaleString()} 元` : '-'}</Descriptions.Item>
                <Descriptions.Item label="预计毛利率">{Math.round(selectedDetailQuotation.grossMargin * 100)}%</Descriptions.Item>
                <Descriptions.Item label="报价备注" span={2}>{selectedDetailQuotation.quoteNote || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="风险与下一步">
              <Space wrap>
                {getQuotationRiskTags(selectedDetailQuotation).map((tag) => (
                  <Tag key={tag.label} color={tag.color}>
                    {tag.label}
                  </Tag>
                ))}
              </Space>
              <div className="drawer-action-row">
                {(quotationNextStatusOptions[selectedDetailQuotation.status] ?? []).map((status) => (
                  <Button
                    key={status}
                    type={status === 'archived' || status === 'lost' ? 'default' : 'primary'}
                    disabled={!canManageFlow(role)}
                    onClick={() => updateQuotationStatus(selectedDetailQuotation, status)}
                  >
                    流转为{quotationStatusLabels[status]}
                  </Button>
                ))}
              </div>
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Drawer
        title="客户项目详情"
        open={Boolean(selectedDetailCustomerProject)}
        onClose={() => setDetailCustomerProject(null)}
        size="large"
      >
        {selectedDetailCustomerProject ? (
          <Space orientation="vertical" size={16} className="page-stack">
            <Card className="lead-profile-card">
              <div className="lead-profile-head">
                <div>
                  <Title level={3}>{selectedDetailCustomerProject.customerName}</Title>
                  <Text type="secondary">
                    {customerProjectTypeLabels[selectedDetailCustomerProject.projectType]} · {supplyTargetLabels[selectedDetailCustomerProject.supplyTarget]} · {selectedDetailCustomerProject.oemBrand || '未指定主机厂'}
                  </Text>
                </div>
                <Tag color={selectedDetailCustomerProject.status === 'settled' ? 'green' : selectedDetailCustomerProject.status === 'paused' ? 'gold' : 'blue'}>
                  {customerProjectStatusLabels[selectedDetailCustomerProject.status]}
                </Tag>
              </div>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="平台业务">{platformBusinessNameLabels[selectedDetailCustomerProject.platformBusinessName]}</Descriptions.Item>
                <Descriptions.Item label="供给内容">{supplyContentTypeLabels[selectedDetailCustomerProject.supplyContentType]}</Descriptions.Item>
                <Descriptions.Item label="需求量级">{selectedDetailCustomerProject.demandVolume || '-'}</Descriptions.Item>
                <Descriptions.Item label="推送时间">{selectedDetailCustomerProject.pushTime || '-'}</Descriptions.Item>
                <Descriptions.Item label="销售负责人">{selectedDetailCustomerProject.salesOwner}</Descriptions.Item>
                <Descriptions.Item label="运营负责人">{selectedDetailCustomerProject.operationOwner}</Descriptions.Item>
                <Descriptions.Item label="其他要求" span={2}>{selectedDetailCustomerProject.requirementNote || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="业务规则">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="首触要求">{selectedDetailCustomerProject.requiresFirstTouch ? '需要' : '不需要'}</Descriptions.Item>
                <Descriptions.Item label="有效率要求">{selectedDetailCustomerProject.effectiveRateRequirement || '-'}</Descriptions.Item>
                <Descriptions.Item label="系统排重有效">{selectedDetailCustomerProject.systemDedupValid ? '是' : '否'}</Descriptions.Item>
                <Descriptions.Item label="推送成功">{selectedDetailCustomerProject.pushSuccess ? '是' : '否'}</Descriptions.Item>
                <Descriptions.Item label="精准下发">{selectedDetailCustomerProject.supportsPreciseDelivery ? '支持' : '不支持'}</Descriptions.Item>
                <Descriptions.Item label="成交周期">{dealCycleOptions.find((item) => item.value === selectedDetailCustomerProject.dealCycle)?.label}</Descriptions.Item>
                <Descriptions.Item label="成交凭证">{selectedDetailCustomerProject.requiresDealProof ? selectedDetailCustomerProject.dealProofType || '需要' : '不需要'}</Descriptions.Item>
                <Descriptions.Item label="到店凭证">{selectedDetailCustomerProject.requiresArrivalProof ? '需要' : '不需要'}</Descriptions.Item>
                <Descriptions.Item label="到店录音">{selectedDetailCustomerProject.requiresArrivalRecording ? '需要' : '不需要'}</Descriptions.Item>
                <Descriptions.Item label="系统到店确认">{selectedDetailCustomerProject.requiresSystemArrivalConfirm ? '需要' : '不需要'}</Descriptions.Item>
                <Descriptions.Item label="单店要求">{selectedDetailCustomerProject.maxDealsPerStore}</Descriptions.Item>
                <Descriptions.Item label="单店备注">{selectedDetailCustomerProject.storeRequirementNote || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="合同与结算">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="合同">{selectedDetailCustomerProject.contractSigned ? selectedDetailCustomerProject.contractNo || '已签' : '未签'}</Descriptions.Item>
                <Descriptions.Item label="首付款">{selectedDetailCustomerProject.downPaymentAmount.toLocaleString()} 元 / {selectedDetailCustomerProject.downPaymentReceived ? '已到账' : '未到账'}</Descriptions.Item>
                <Descriptions.Item label="结算方式">{settlementModeLabels[selectedDetailCustomerProject.settlementMode]}</Descriptions.Item>
                <Descriptions.Item label="账期">{accountPeriodLabels[selectedDetailCustomerProject.accountPeriod]}</Descriptions.Item>
                <Descriptions.Item label="发票形式">{invoiceTypeOptions.find((item) => item.value === selectedDetailCustomerProject.invoiceType)?.label}</Descriptions.Item>
                <Descriptions.Item label="结算标准">{selectedDetailCustomerProject.settlementStandard}</Descriptions.Item>
                <Descriptions.Item label="结算单价">{selectedDetailCustomerProject.unitPrice.toLocaleString()} 元</Descriptions.Item>
                <Descriptions.Item label="最终单价">{selectedDetailCustomerProject.finalUnitPrice.toLocaleString()} 元</Descriptions.Item>
                <Descriptions.Item label="最终比例">{Math.round(selectedDetailCustomerProject.finalSettlementRatio * 100)}%</Descriptions.Item>
                <Descriptions.Item label="最终总额">{selectedDetailCustomerProject.finalSettlementAmount.toLocaleString()} 元</Descriptions.Item>
                <Descriptions.Item label="耗损比例">{Math.round(selectedDetailCustomerProject.lossRatio * 100)}%</Descriptions.Item>
                <Descriptions.Item label="结算备注">{selectedDetailCustomerProject.settlementNote || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="风险提示">
              <Space wrap>
                {!selectedDetailCustomerProject.downPaymentReceived ? <Tag color="red">首付款未到账</Tag> : null}
                {selectedDetailCustomerProject.requiresDealProof ? <Tag color="orange">需要成交凭证</Tag> : null}
                {selectedDetailCustomerProject.requiresArrivalProof ? <Tag color="orange">需要到店凭证</Tag> : null}
                {selectedDetailCustomerProject.settlementStandard.includes('客户') ? <Tag color="purple">客户数据为准</Tag> : null}
                {selectedDetailCustomerProject.lossRatio > 0 ? <Tag color="gold">耗损比例 {Math.round(selectedDetailCustomerProject.lossRatio * 100)}%</Tag> : null}
              </Space>
              <div className="drawer-action-row">
                {(customerProjectNextStatusOptions[selectedDetailCustomerProject.status] ?? []).map((status) => (
                  <Button
                    key={status}
                    type={status === 'paused' ? 'default' : 'primary'}
                    disabled={!canManageFlow(role)}
                    onClick={() => updateCustomerProjectStatus(selectedDetailCustomerProject, status)}
                  >
                    流转为{customerProjectStatusLabels[status]}
                  </Button>
                ))}
              </div>
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Drawer title="供应商详情" open={Boolean(selectedDetailSupplier)} onClose={() => setDetailSupplier(null)} size="large">
        {selectedDetailSupplier ? (
          <Space orientation="vertical" size={16} className="page-stack">
            <Card className="lead-profile-card">
              <div className="lead-profile-head">
                <div>
                  <Title level={3}>{selectedDetailSupplier.name}</Title>
                  <Text type="secondary">{supplierTypeLabels[selectedDetailSupplier.type]} · {selectedDetailSupplier.contact}</Text>
                </div>
                <Space>
                  {isContractExpiringSoon(selectedDetailSupplier.contractEnd) ? <Tag color="orange">即将到期</Tag> : null}
                  <Tag color={selectedDetailSupplier.status === 'active' ? 'green' : selectedDetailSupplier.status === 'paused' ? 'gold' : 'default'}>
                    {supplierStatusLabels[selectedDetailSupplier.status]}
                  </Tag>
                </Space>
              </div>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="联系电话">{phoneForRole(selectedDetailSupplier.phone, role)}</Descriptions.Item>
                <Descriptions.Item label="供应类型">{supplierTypeLabels[selectedDetailSupplier.type]}</Descriptions.Item>
                <Descriptions.Item label="付款模式">{paymentModeLabels[selectedDetailSupplier.paymentMode]}</Descriptions.Item>
                <Descriptions.Item label="账期">{accountPeriodLabels[selectedDetailSupplier.accountPeriod]}</Descriptions.Item>
                <Descriptions.Item label="合约开始">{selectedDetailSupplier.contractStart}</Descriptions.Item>
                <Descriptions.Item label="合约结束">{selectedDetailSupplier.contractEnd}</Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>{selectedDetailSupplier.note}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title="运营提示">
              <Space orientation="vertical" size={8}>
                <Text>这个板块当前用于维护渠道方/数据方基础档案。</Text>
                <Text type="secondary">下一阶段可以把线索来源与供应商打通，统计每家供应商的线索量、有效率、重复率和交付率。</Text>
              </Space>
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Drawer title="成交产能详情" open={Boolean(selectedDetailDealBase)} onClose={() => setDetailDealBase(null)} size="large">
        {selectedDetailDealBase ? (
          <Space orientation="vertical" size={16} className="page-stack">
            <Card className="lead-profile-card">
              <div className="lead-profile-head">
                <div>
                  <Title level={3}>{selectedDetailDealBase.dealer}</Title>
                  <Text type="secondary">
                    {selectedDetailDealBase.city} · {selectedDetailDealBase.brand} · {selectedDetailDealBase.supplyModel}
                  </Text>
                </div>
                <Space wrap>
                  <Tag color={selectedDetailDealBase.isValid ? 'green' : 'red'}>
                    {selectedDetailDealBase.isValid ? '有效产能' : '无效产能'}
                  </Tag>
                  <Tag color={selectedDetailDealBase.status === 'failed' ? 'red' : selectedDetailDealBase.status === 'success' ? 'green' : 'blue'}>
                    {dealBaseStatusLabels[selectedDetailDealBase.status]}
                  </Tag>
                </Space>
              </div>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="联系人">{selectedDetailDealBase.contact}</Descriptions.Item>
                <Descriptions.Item label="电话">{phoneForRole(selectedDetailDealBase.phone, role)}</Descriptions.Item>
                <Descriptions.Item label="职位">{selectedDetailDealBase.position}</Descriptions.Item>
                <Descriptions.Item label="量级">{selectedDetailDealBase.capacity}</Descriptions.Item>
                <Descriptions.Item label="供应内容" span={2}>{selectedDetailDealBase.supplyContent}</Descriptions.Item>
                <Descriptions.Item label="供应凭证">{selectedDetailDealBase.supplyProof}</Descriptions.Item>
                <Descriptions.Item label="供应时间">{selectedDetailDealBase.supplyTime}</Descriptions.Item>
                <Descriptions.Item label="付款方式">{paymentModeLabels[selectedDetailDealBase.paymentMode]}</Descriptions.Item>
                <Descriptions.Item label="金额">{selectedDetailDealBase.amount.toLocaleString()} 元</Descriptions.Item>
                <Descriptions.Item label="我司对接人">{selectedDetailDealBase.owner}</Descriptions.Item>
                <Descriptions.Item label="我司付款人">{selectedDetailDealBase.payer || '-'}</Descriptions.Item>
                <Descriptions.Item label="付款时间">{selectedDetailDealBase.paymentTime || '-'}</Descriptions.Item>
                <Descriptions.Item label="是否成功">{selectedDetailDealBase.isSuccess ? '成功' : '未成功'}</Descriptions.Item>
                <Descriptions.Item label="失败原因" span={2}>{selectedDetailDealBase.failureReason || '-'}</Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>{selectedDetailDealBase.note || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title="风险与下一步">
              <Space orientation="vertical" size={8}>
                {selectedDetailDealBase.paymentMode === 'prepaid' && !selectedDetailDealBase.isSuccess ? (
                  <Alert type="warning" showIcon message="该记录为预付且尚未成功成交，需要跟进成本核销。" />
                ) : null}
                {selectedDetailDealBase.companyBearsCost ? (
                  <Alert type="error" showIcon message="成交失败且成本由公司承担，需要复盘经销商口径和客户认定规则。" />
                ) : null}
                <Space wrap>
                  {(dealBaseNextStatusOptions[selectedDetailDealBase.status] ?? []).map((status) => (
                    <Button
                      key={status}
                      type={status === 'failed' ? 'default' : 'primary'}
                      disabled={!canManageFlow(role)}
                      onClick={() => updateDealBaseStatus(selectedDetailDealBase, status)}
                    >
                      流转为{dealBaseStatusLabels[status]}
                    </Button>
                  ))}
                </Space>
              </Space>
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </Layout>
  )
}

function WrappedApp() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorSuccess: '#16a34a',
          colorWarning: '#d97706',
          colorError: '#dc2626',
          colorInfo: '#2563eb',
          colorTextBase: '#172033',
          colorBgBase: '#f5f7fb',
          colorBorder: '#dfe5ef',
          borderRadius: 6,
          controlHeight: 36,
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 14,
          wireframe: false,
        },
        components: {
          Alert: {
            borderRadiusLG: 8,
          },
          Button: {
            borderRadius: 6,
            controlHeight: 36,
            primaryShadow: '0 8px 18px rgba(37, 99, 235, 0.18)',
          },
          Card: {
            borderRadiusLG: 8,
            boxShadowTertiary: '0 10px 30px rgba(15, 23, 42, 0.04)',
            paddingLG: 20,
          },
          Descriptions: {
            borderRadiusLG: 8,
          },
          Drawer: {
            paddingLG: 24,
          },
          Form: {
            itemMarginBottom: 16,
          },
          Input: {
            borderRadius: 6,
            controlHeight: 36,
          },
          Menu: {
            itemBorderRadius: 6,
            itemHeight: 40,
            itemMarginInline: 12,
            itemSelectedBg: '#eaf1ff',
            itemSelectedColor: '#1d4ed8',
          },
          Modal: {
            borderRadiusLG: 10,
          },
          Select: {
            borderRadius: 6,
            controlHeight: 36,
          },
          Table: {
            borderColor: '#e6ebf3',
            cellPaddingBlock: 12,
            cellPaddingInline: 14,
            headerBg: '#f7f9fc',
            headerColor: '#526070',
            rowHoverBg: '#f4f8ff',
          },
          Tag: {
            borderRadiusSM: 5,
          },
        },
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  )
}

export default WrappedApp
