import type { ReactNode } from 'react'
import { Space, Typography } from 'antd'

const { Title, Text } = Typography

export function PageScaffold({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <Space orientation="vertical" size={16} className="page-stack">
      <div className="page-heading">
        <div>
          <Title level={2}>{title}</Title>
          <Text type="secondary">{description}</Text>
        </div>
        {actions ? <Space wrap>{actions}</Space> : null}
      </div>
      {children}
    </Space>
  )
}
