import '../../App.css'
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { App as AntApp, ConfigProvider, Result, Spin } from 'antd'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { pageByPath } from '../../app/navigation'
import type { PageKey } from '../../app/navigation'
import { ApplicationShell } from '../ApplicationShell'
import { useLeadSystemStore } from '../../domain/store'
import { LoginPage } from '../../pages/auth/LoginPage'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import type { UserRole } from '../../domain/types'

const DashboardPage = lazy(() => import('../../pages/workspace/DashboardPage'))
const PersonalDashboardPage = lazy(() => import('../../pages/workspace/PersonalDashboardPage'))
const CustomerProjectsPage = lazy(() => import('../../pages/customerProjects/CustomerProjectsPage').then((module) => ({ default: module.CustomerProjectsPage })))
const LeadsPage = lazy(() => import('../../pages/leads/LeadsPage'))
const LeadImportPage = lazy(() => import('../../pages/leads/LeadImportPage'))
const QuotationsPage = lazy(() => import('../../pages/quotations/QuotationsPage'))
const SuppliersPage = lazy(() => import('../../pages/suppliers/SuppliersPage'))
const DealBasePage = lazy(() => import('../../pages/dealBase/DealBasePage'))
const BatchesPage = lazy(() => import('../../pages/delivery/BatchesPage'))
const TargetsPage = lazy(() => import('../../pages/delivery/TargetsPage'))
const SopPage = lazy(() => import('../../pages/sop/SopPage'))
const PermissionsPage = lazy(() => import('../../pages/permissions/PermissionsPage'))

class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }

  render() { return this.state.failed ? <Result status="error" title="页面加载失败" /> : this.props.children }
}

function LazyRoute({ children }: { children: ReactNode }) {
  return <RouteErrorBoundary><Suspense fallback={<div className="route-loading"><Spin size="large" /></div>}>{children}</Suspense></RouteErrorBoundary>
}

function ShellLayout() {
  const location = useLocation()
  const role = useLeadSystemStore((state) => state.role)
  const setRole = useLeadSystemStore((state) => state.setRole)
  const currentPage = pageByPath[location.pathname] ?? ('dashboard' as PageKey)

  return <ApplicationShell currentPage={currentPage} role={role} onRoleChange={setRole} roleLocked={isSupabaseConfigured}><Outlet /></ApplicationShell>
}

function LoginRoute() {
  return <LoginPage />
}

function RequireAuthenticatedSession() {
  const [ready, setReady] = useState(!isSupabaseConfigured)
  const [signedIn, setSignedIn] = useState(false)
  const setRole = useLeadSystemStore((state) => state.setRole)

  useEffect(() => {
    const database = supabase
    if (!isSupabaseConfigured || !database) return
    const initialize = async () => {
      const { data: { session } } = await database.auth.getSession()
      setSignedIn(Boolean(session))
      if (session) {
        const { data } = await database.from('organization_members').select('role').eq('profile_id', session.user.id).eq('is_active', true).maybeSingle()
        if (data?.role) setRole(data.role as UserRole)
      }
      setReady(true)
    }
    void initialize()
    const { data: { subscription } } = database.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)))
    return () => subscription.unsubscribe()
  }, [setRole])

  if (!isSupabaseConfigured) return <Outlet />
  if (!ready) return <div className="route-loading"><Spin size="large" /></div>
  return signedIn ? <Outlet /> : <Navigate to="/login" replace />
}

function NotFoundPage() {
  return <Result status="404" title="页面不存在" subTitle="请从左侧菜单选择可访问的工作区。" />
}

export default function Application() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563eb', colorSuccess: '#16a34a', colorWarning: '#d97706', colorError: '#dc2626',
          colorInfo: '#2563eb', colorTextBase: '#172033', colorBgBase: '#f5f7fb', colorBorder: '#dfe5ef',
          borderRadius: 6, controlHeight: 36, fontSize: 14, wireframe: false,
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        },
        components: {
          Alert: { borderRadiusLG: 8 }, Button: { borderRadius: 6, controlHeight: 36, primaryShadow: '0 8px 18px rgba(37, 99, 235, 0.18)' },
          Card: { borderRadiusLG: 8, boxShadowTertiary: '0 10px 30px rgba(15, 23, 42, 0.04)', paddingLG: 20 },
          Descriptions: { borderRadiusLG: 8 }, Drawer: { paddingLG: 24 }, Form: { itemMarginBottom: 16 },
          Input: { borderRadius: 6, controlHeight: 36 }, Menu: { itemBorderRadius: 6, itemHeight: 40, itemMarginInline: 12, itemSelectedBg: '#eaf1ff', itemSelectedColor: '#1d4ed8' },
          Modal: { borderRadiusLG: 10 }, Select: { borderRadius: 6, controlHeight: 36 },
          Table: { borderColor: '#e6ebf3', cellPaddingBlock: 12, cellPaddingInline: 14, headerBg: '#f7f9fc', headerColor: '#526070', rowHoverBg: '#f4f8ff' }, Tag: { borderRadiusSM: 5 },
        },
      }}
    >
      <AntApp>
        <Routes>
          <Route path="login" element={<LoginRoute />} />
          <Route element={<RequireAuthenticatedSession />}>
          <Route element={<ShellLayout />}>
            <Route index element={<LazyRoute><DashboardPage /></LazyRoute>} />
            <Route path="personal-dashboard" element={<LazyRoute><PersonalDashboardPage /></LazyRoute>} />
            <Route path="customer-projects" element={<LazyRoute><CustomerProjectsPage /></LazyRoute>} />
            <Route path="leads" element={<LazyRoute><LeadsPage /></LazyRoute>} />
            <Route path="import" element={<LazyRoute><LeadImportPage /></LazyRoute>} />
            <Route path="quotations" element={<LazyRoute><QuotationsPage /></LazyRoute>} />
            <Route path="suppliers" element={<LazyRoute><SuppliersPage /></LazyRoute>} />
            <Route path="deal-base" element={<LazyRoute><DealBasePage /></LazyRoute>} />
            <Route path="batches" element={<LazyRoute><BatchesPage /></LazyRoute>} />
            <Route path="targets" element={<LazyRoute><TargetsPage /></LazyRoute>} />
            <Route path="sop" element={<LazyRoute><SopPage /></LazyRoute>} />
            <Route path="permissions" element={<LazyRoute><PermissionsPage /></LazyRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          </Route>
        </Routes>
      </AntApp>
    </ConfigProvider>
  )
}
