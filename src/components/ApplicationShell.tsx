import type { ReactNode } from 'react'
import { Layout, Menu, Select, Space, Typography, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { menuItems, pagePaths } from '../app/navigation'
import type { PageKey } from '../app/navigation'
import type { UserRole } from '../domain/types'

const { Header, Sider, Content } = Layout
const { Text } = Typography

type ApplicationShellProps = {
  currentPage: PageKey
  role: UserRole
  onRoleChange: (role: UserRole) => void
  children: ReactNode
}

export function ApplicationShell({ currentPage, role, onRoleChange, children }: ApplicationShellProps) {
  const navigate = useNavigate()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

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
              onChange={onRoleChange}
              options={[
                { value: 'admin', label: '管理员' },
                { value: 'operator', label: '运营' },
                { value: 'other', label: '其他角色' },
              ]}
            />
          </Space>
        </Header>
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  )
}
