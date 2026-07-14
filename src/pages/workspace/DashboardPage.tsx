import { useMemo } from 'react'
import { Card, Col, Progress, Row, Space, Statistic, Table, Tag, Typography } from 'antd'
import { useLeadSystemStore } from '../../domain/store'
import type { LeadStatus } from '../../domain/types'
import { statusLabels } from '../../domain/helpers'
import { PageScaffold } from '../workflows/PageScaffold'

const { Text } = Typography

export default function DashboardPage() {
  const leads = useLeadSystemStore((state) => state.leads)
  const batches = useLeadSystemStore((state) => state.batches)
  const suppliers = useLeadSystemStore((state) => state.suppliers)
  const metrics = useMemo(() => ({
    total: leads.length,
    valid: leads.filter((lead) => lead.status === 'valid' || lead.status === 'delivered').length,
    delivered: leads.filter((lead) => lead.status === 'delivered').length,
    activeSuppliers: suppliers.filter((supplier) => supplier.status === 'active').length,
  }), [leads, suppliers])
  const conversion = metrics.total ? Math.round((metrics.valid / metrics.total) * 100) : 0
  const latestLeads = leads.slice(0, 6)

  return <PageScaffold title="汽车销售线索工作台" description="查看线索、交付和供给侧的当前经营概况。">
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} xl={6}><Card><Statistic title="线索总量" value={metrics.total} /></Card></Col>
      <Col xs={24} sm={12} xl={6}><Card><Statistic title="有效线索" value={metrics.valid} /></Card></Col>
      <Col xs={24} sm={12} xl={6}><Card><Statistic title="已交付线索" value={metrics.delivered} /></Card></Col>
      <Col xs={24} sm={12} xl={6}><Card><Statistic title="活跃供应商" value={metrics.activeSuppliers} /></Card></Col>
    </Row>
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={8}><Card title="线索有效率"><Space orientation="vertical" className="page-stack"><Progress percent={conversion} /><Text type="secondary">按有效和已交付线索计算</Text></Space></Card></Col>
      <Col xs={24} xl={16}><Card title="最近线索"><Table rowKey="id" size="small" pagination={false} dataSource={latestLeads} columns={[
        { title: '客户', dataIndex: 'name' }, { title: '城市', dataIndex: 'city' }, { title: '来源', dataIndex: 'source' },
        { title: '状态', dataIndex: 'status', render: (status: LeadStatus) => <Tag>{statusLabels[status]}</Tag> },
      ]} /></Card></Col>
    </Row>
    <Card title="交付概况"><Text>当前已创建 {batches.length} 个交付批次，交付动作会在批次页面校验线索有效性。</Text></Card>
  </PageScaffold>
}
