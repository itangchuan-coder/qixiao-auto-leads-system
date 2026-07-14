import { useMemo, useState } from 'react'
import { App as AntApp, Button, Card, Drawer, Form, Input, Modal, Select, Space, Table, Tag, Timeline } from 'antd'
import { ExportOutlined, PlusOutlined } from '@ant-design/icons'
import { SmartSelect } from '../../components/SmartSelect'
import { automakerOptions, brandOptions, cityOptions, modelOptions } from '../../domain/referenceData'
import { canEditLead, canManageFlow, canTransitionLeadStatus, createFollowUpId, createLeadId, findDuplicatePhones, phoneForRole, purchaseTimeframeLabels, roleLabels, statusLabels } from '../../domain/helpers'
import { defaultLeadValues, defaultSearchValues, leadStatusOptions, nextStatusOptions } from '../../domain/formDefaults'
import { matchesSmartValue } from '../../domain/search'
import { useLeadSystemStore } from '../../domain/store'
import type { Lead, LeadFormValues, LeadSearchValues, LeadStatus } from '../../domain/types'
import { PageScaffold } from '../workflows/PageScaffold'

export default function LeadsPage() {
  const { message } = AntApp.useApp()
  const { role, leads, selectedLeadIds, setLeads, setSelectedLeadIds } = useLeadSystemStore()
  const [form] = Form.useForm<LeadFormValues>()
  const [searchForm] = Form.useForm<LeadSearchValues>()
  const [followUpForm] = Form.useForm<{ content: string }>()
  const [editing, setEditing] = useState<Lead | null>(null)
  const [detail, setDetail] = useState<Lead | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState(defaultSearchValues)
  const duplicates = useMemo(() => findDuplicatePhones(leads), [leads])
  const filteredLeads = useMemo(() => leads.filter((lead) =>
    (!search.keyword || [lead.name, lead.phone, lead.owner].some((value) => value.includes(search.keyword))) &&
    matchesSmartValue(lead.city, search.city, [cityOptions]) && matchesSmartValue(lead.interestedBrand, search.brand, [brandOptions, automakerOptions]) &&
    (!search.source || lead.source.includes(search.source)) && (!search.status || lead.status === search.status),
  ), [leads, search])
  const selectedDetail = detail ? leads.find((lead) => lead.id === detail.id) ?? detail : null
  const openCreate = () => { setEditing(null); form.setFieldsValue(defaultLeadValues); setModalOpen(true) }
  const openEdit = (lead: Lead) => { setEditing(lead); form.setFieldsValue(lead); setModalOpen(true) }
  const saveLead = (values: LeadFormValues) => {
    if (!canEditLead(role)) { message.warning('当前角色不能编辑线索'); return }
    const duplicate = leads.some((lead) => lead.phone === values.phone && lead.id !== editing?.id)
    const status = duplicate && values.status !== 'invalid' ? 'duplicate' : values.status
    if (editing) setLeads((current) => current.map((lead) => lead.id === editing.id ? { ...lead, ...values, status } : lead))
    else setLeads((current) => [{ id: createLeadId(current.length), ...values, status, createdAt: '2026-07-07 15:30', followUps: [] }, ...current])
    setModalOpen(false); message.success(duplicate ? '已保存，并标记为重复线索' : '线索已保存')
  }
  const updateStatus = (lead: Lead, status: LeadStatus) => {
    if (!canManageFlow(role) || !canTransitionLeadStatus(lead.status, status)) { message.warning('当前线索不能执行该状态流转'); return }
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status, followUps: [{ id: createFollowUpId(item.followUps.length), time: '2026-07-07 16:35', operator: roleLabels[role], content: `状态从“${statusLabels[item.status]}”流转为“${statusLabels[status]}”。` }, ...item.followUps] } : item))
    message.success(`线索已流转为：${statusLabels[status]}`)
  }
  const addFollowUp = ({ content }: { content: string }) => {
    if (!selectedDetail || !canManageFlow(role)) { message.warning('当前角色不能添加跟进记录'); return }
    setLeads((current) => current.map((lead) => lead.id === selectedDetail.id ? { ...lead, followUps: [{ id: createFollowUpId(lead.followUps.length), time: '2026-07-07 16:50', operator: roleLabels[role], content }, ...lead.followUps] } : lead))
    followUpForm.resetFields(); message.success('跟进记录已添加')
  }
  const exportSelected = async () => {
    const rows = leads.filter((lead) => selectedLeadIds.includes(lead.id)).map((lead) => ({ 姓名: lead.name, 手机号: lead.phone, 城市: lead.city, 意向品牌: lead.interestedBrand, 意向车型: lead.interestedModel, 预算: lead.budget, 购车时间: purchaseTimeframeLabels[lead.purchaseTimeframe], 来源: lead.source, 状态: statusLabels[lead.status], 备注: lead.note }))
    if (!rows.length) { message.warning('请先选择要导出的线索'); return }
    const XLSX = await import('xlsx')
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), '线索'); XLSX.writeFile(workbook, '汽车销售线索导出.xlsx')
  }
  return <PageScaffold title="线索管理" description="维护客户线索、清洗状态、重复标记与跟进记录。" actions={<><Button aria-label="导出所选" icon={<ExportOutlined />} onClick={exportSelected}>导出已选</Button><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增线索</Button></>}>
    <Card><Form form={searchForm} layout="inline" initialValues={defaultSearchValues} onValuesChange={(_, values) => setSearch(values)}>
      <Form.Item name="keyword"><Input allowClear placeholder="客户、手机、负责人" /></Form.Item><Form.Item name="city"><SmartSelect options={cityOptions} placeholder="城市" /></Form.Item><Form.Item name="brand"><SmartSelect options={brandOptions} placeholder="品牌" /></Form.Item><Form.Item name="status"><Select allowClear options={leadStatusOptions} placeholder="状态" style={{ minWidth: 120 }} /></Form.Item><Button onClick={() => { searchForm.setFieldsValue(defaultSearchValues); setSearch(defaultSearchValues) }}>重置</Button>
    </Form></Card>
    <Card><Table rowKey="id" dataSource={filteredLeads} rowSelection={{ selectedRowKeys: selectedLeadIds, onChange: (keys) => setSelectedLeadIds(keys as string[]) }} columns={[
      { title: '客户', dataIndex: 'name', render: (_, lead: Lead) => <Button type="link" className="table-link" onClick={() => setDetail(lead)}>{lead.name}</Button> },
      { title: '手机号', dataIndex: 'phone', render: (phone: string) => <Space>{phoneForRole(phone, role)}{duplicates.has(phone) ? <Tag color="orange">重复</Tag> : null}</Space> },
      { title: '意向车型', render: (_, lead: Lead) => `${lead.interestedBrand} ${lead.interestedModel}` }, { title: '来源', dataIndex: 'source' },
      { title: '状态', dataIndex: 'status', render: (status: LeadStatus) => <Tag>{statusLabels[status]}</Tag> }, { title: '负责人', dataIndex: 'owner' },
      { title: '操作', render: (_, lead: Lead) => <Button type="link" disabled={!canEditLead(role)} onClick={() => openEdit(lead)}>编辑</Button> },
    ]} /></Card>
    <Modal open={modalOpen} title={editing ? '编辑线索' : '新增线索'} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnHidden><Form form={form} layout="vertical" onFinish={saveLead} initialValues={defaultLeadValues}>
      <div className="modal-form-grid"><Form.Item name="name" label="客户姓名" rules={[{ required: true, message: '请输入客户姓名' }]}><Input /></Form.Item><Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}><Input /></Form.Item></div>
      <div className="modal-form-grid"><Form.Item name="city" label="城市"><SmartSelect options={cityOptions} /></Form.Item><Form.Item name="interestedBrand" label="意向品牌"><SmartSelect options={[...automakerOptions, ...brandOptions]} /></Form.Item></div>
      <div className="modal-form-grid"><Form.Item name="interestedModel" label="意向车型"><SmartSelect options={modelOptions} /></Form.Item><Form.Item name="budget" label="预算"><Input /></Form.Item></div>
      <div className="modal-form-grid"><Form.Item name="purchaseTimeframe" label="购车时间"><Select options={Object.entries(purchaseTimeframeLabels).map(([value, label]) => ({ value, label }))} /></Form.Item><Form.Item name="source" label="来源"><Input /></Form.Item></div>
      <div className="modal-form-grid"><Form.Item name="owner" label="负责人"><Input /></Form.Item><Form.Item name="status" label="状态"><Select options={leadStatusOptions} /></Form.Item></div><Form.Item name="note" label="备注"><Input.TextArea rows={3} /></Form.Item>
    </Form></Modal>
    <Drawer title="线索详情" open={Boolean(selectedDetail)} size="large" onClose={() => setDetail(null)}>{selectedDetail ? <Space orientation="vertical" className="page-stack" size={16}>
      <Card title={selectedDetail.name}><p>{phoneForRole(selectedDetail.phone, role)} · {selectedDetail.city} · {selectedDetail.interestedBrand} {selectedDetail.interestedModel}</p><p>来源：{selectedDetail.source}　负责人：{selectedDetail.owner}</p><Tag>{statusLabels[selectedDetail.status]}</Tag><Space wrap className="drawer-action-row">{(nextStatusOptions[selectedDetail.status] ?? []).map((status) => <Button key={status} disabled={!canManageFlow(role)} onClick={() => updateStatus(selectedDetail, status)}>流转为{statusLabels[status]}</Button>)}</Space></Card>
      <Card title="跟进记录"><Timeline items={selectedDetail.followUps.map((item) => ({ children: `${item.time} · ${item.operator}：${item.content}` }))} /><Form form={followUpForm} layout="inline" onFinish={addFollowUp}><Form.Item name="content" rules={[{ required: true, message: '请输入跟进内容' }]}><Input placeholder="新增跟进内容" /></Form.Item><Button htmlType="submit" disabled={!canManageFlow(role)}>添加</Button></Form></Card>
    </Space> : null}</Drawer>
  </PageScaffold>
}
