import { useMemo, useState } from 'react'
import { Card, Col, Row, Select, Statistic, Table, Tag } from 'antd'
import { buildPersonalDashboard } from '../../domain/helpers'
import { useLeadSystemStore } from '../../domain/store'
import { PageScaffold } from '../workflows/PageScaffold'

export default function PersonalDashboardPage() {
  const leads = useLeadSystemStore((state) => state.leads)
  const quotations = useLeadSystemStore((state) => state.quotations)
  const customerProjects = useLeadSystemStore((state) => state.customerProjects)
  const dealBaseRecords = useLeadSystemStore((state) => state.dealBaseRecords)
  const [owner, setOwner] = useState('运营A')
  const dashboard = useMemo(() => buildPersonalDashboard({ owner, quotations, customerProjects, dealBaseRecords }), [quotations, customerProjects, dealBaseRecords, owner])
  const owners = useMemo(() => [...new Set([...leads.map((lead) => lead.owner), ...quotations.map((item) => item.operationOwner), ...customerProjects.map((item) => item.operationOwner)])].filter(Boolean), [leads, quotations, customerProjects])

  return <PageScaffold title="个人业务驾驶舱" description="聚焦负责人的线索、报价和客户项目待办。" actions={<Select value={owner} style={{ minWidth: 150 }} onChange={setOwner} options={owners.map((value) => ({ value, label: value }))} />}>
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}><Card><Statistic title="负责项目" value={dashboard.projectCount} /></Card></Col>
      <Col xs={24} sm={8}><Card><Statistic title="待报价需求" value={dashboard.pendingQuotationCount} /></Card></Col>
      <Col xs={24} sm={8}><Card><Statistic title="进行中项目" value={dashboard.activeProjectCount} /></Card></Col>
    </Row>
    <Card title="我的客户项目"><Table rowKey="id" pagination={false} dataSource={dashboard.ownedProjects} columns={[
      { title: '客户', dataIndex: 'customerName' }, { title: '需求量级', dataIndex: 'demandVolume' },
      { title: '状态', dataIndex: 'status', render: (status) => <Tag>{status}</Tag> },
    ]} /></Card>
    <Card title="我的报价需求"><Table rowKey="id" pagination={false} dataSource={dashboard.ownedQuotations} columns={[
      { title: '客户', dataIndex: 'customerName' }, { title: '需求量级', dataIndex: 'demandVolume' },
      { title: '负责人', dataIndex: 'operationOwner' },
    ]} /></Card>
  </PageScaffold>
}
