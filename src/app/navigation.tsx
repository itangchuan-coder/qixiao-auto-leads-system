import type { MenuProps } from 'antd'
import {
  AuditOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileProtectOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
  FundProjectionScreenOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  TeamOutlined,
} from '@ant-design/icons'

export type PageKey =
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

export const pagePaths: Record<PageKey, string> = {
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

export const pageByPath = Object.fromEntries(
  Object.entries(pagePaths).map(([page, path]) => [path, page]),
) as Record<string, PageKey>

export const menuItems: MenuProps['items'] = [
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
