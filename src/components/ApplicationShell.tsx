import { useEffect, useState, type ReactNode } from 'react'
import { Avatar, Button, Dropdown, Layout, Menu, Modal, Select, Space, Typography, theme } from 'antd'
import { LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { menuItems, pagePaths } from '../app/navigation'
import type { PageKey } from '../app/navigation'
import { roleLabels } from '../domain/helpers'
import type { UserRole } from '../domain/types'
import { supabase } from '../lib/supabase'

const { Header, Sider, Content } = Layout
const { Text } = Typography

type ApplicationShellProps = {
  currentPage: PageKey
  role: UserRole
  onRoleChange: (role: UserRole) => void
  roleLocked?: boolean
  children: ReactNode
}

export function ApplicationShell({ currentPage, role, onRoleChange, roleLocked = false, children }: ApplicationShellProps) {
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [account, setAccount] = useState<{ displayName: string; email: string }>({ displayName: '当前用户', email: '' })
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) setAccount({ displayName: data.user.user_metadata.display_name ?? data.user.email?.split('@')[0] ?? '当前用户', email: data.user.email ?? '' })
    })
  }, [])

  const logout = async () => {
    if (supabase) await supabase.auth.signOut()
    setSettingsOpen(false)
    navigate('/login', { replace: true })
  }

  const accountMenuItems = [
    { key: 'settings', icon: <SettingOutlined />, label: '账户设置' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]

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
          <Space size={14}>
            <Text type="secondary">当前角色</Text>
            <Select<UserRole>
              value={role}
              className="role-select"
              onChange={onRoleChange}
              disabled={roleLocked}
              options={[
                { value: 'admin', label: '管理员' },
                { value: 'supervisor', label: '主管' },
                { value: 'operator', label: '运营' },
                { value: 'other', label: '其他角色' },
              ]}
            />
            <Dropdown
              menu={{ items: accountMenuItems, onClick: ({ key }) => key === 'settings' ? setSettingsOpen(true) : void logout() }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button type="text" className="account-trigger" aria-label="打开用户设置">
                <Avatar size={30} icon={<UserOutlined />} />
                <span className="account-name">{account.displayName}</span>
              </Button>
            </Dropdown>
          </Space>
        </Header>
        <Content className="app-content">{children}</Content>
      </Layout>
      <Modal open={settingsOpen} title="账户设置" footer={null} onCancel={() => setSettingsOpen(false)}>
        <Space orientation="vertical" size={16} className="account-settings">
          <Space><Avatar size={42} icon={<UserOutlined />} /><div><Typography.Text strong>{account.displayName}</Typography.Text><Typography.Text type="secondary" className="account-settings-email">{account.email || '本地演示账号'}</Typography.Text></div></Space>
          <Typography.Text type="secondary">当前角色：{roleLabels[role]}</Typography.Text>
          <Button danger icon={<LogoutOutlined />} onClick={() => void logout()}>退出登录</Button>
        </Space>
      </Modal>
    </Layout>
  )
}
