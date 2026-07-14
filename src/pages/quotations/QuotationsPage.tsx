import { useMemo, useState } from 'react'
import { App as AntApp, Button, Card, Drawer, Form, Input, InputNumber, Modal, Select, Space, Table, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { SmartSelect } from '../../components/SmartSelect'
import { brandOptions, cityOptions, modelOptions } from '../../domain/referenceData'
import { canManageFlow, canTransitionQuotationStatus, createQuotationId, getQuotationRiskTags, quotationStatusLabels } from '../../domain/helpers'
import { defaultQuotationSearchValues, defaultQuotationValues, quotationContentTypeOptions, quotationNextStatusOptions, quotationStatusOptions, requirementJudgementTypeOptions, submissionMethodOptions } from '../../domain/formDefaults'
import { matchesSmartValue } from '../../domain/search'
import { useLeadSystemStore } from '../../domain/store'
import type { Quotation, QuotationFormValues, QuotationSearchValues, QuotationStatus } from '../../domain/types'
import { PageScaffold } from '../workflows/PageScaffold'

export default function QuotationsPage() {
  const { message } = AntApp.useApp()
  const { role, quotations, setQuotations } = useLeadSystemStore()
  const [form] = Form.useForm<QuotationFormValues>()
  const [searchForm] = Form.useForm<QuotationSearchValues>()
  const [editing, setEditing] = useState<Quotation | null>(null)
  const [detail, setDetail] = useState<Quotation | null>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(defaultQuotationSearchValues)
  const filtered = useMemo(() => quotations.filter((quotation) => (!search.keyword || [quotation.customerName, quotation.demander, quotation.salesOwner].some((value) => value.includes(search.keyword))) && matchesSmartValue(quotation.carBrand, search.brand, [brandOptions]) && (!search.status || quotation.status === search.status)), [quotations, search])
  const selected = detail ? quotations.find((item) => item.id === detail.id) ?? detail : null
  const openCreate = () => { setEditing(null); form.setFieldsValue(defaultQuotationValues); setOpen(true) }
  const openEdit = (quotation: Quotation) => { setEditing(quotation); form.setFieldsValue(quotation); setOpen(true) }
  const save = (values: QuotationFormValues) => {
    if (!canManageFlow(role)) { message.warning('当前角色不能编辑报价需求'); return }
    const normalized = { ...values, cityScope: values.cityScope ?? [], targetPrice: Number(values.targetPrice || 0), upstreamQuotePrice: Number(values.upstreamQuotePrice || 0), ownedQuotePrice: Number(values.ownedQuotePrice || 0), recommendedPrice: Number(values.recommendedPrice || 0), grossMargin: Number(values.grossMargin || 0), status: editing?.status ?? 'new' }
    if (editing) setQuotations((current) => current.map((item) => item.id === editing.id ? { ...item, ...normalized } : item))
    else setQuotations((current) => [{ id: createQuotationId(current.length), ...normalized }, ...current])
    setOpen(false); form.resetFields(); message.success('报价需求已保存')
  }
  const updateStatus = (quotation: Quotation, status: QuotationStatus) => {
    if (!canManageFlow(role) || !canTransitionQuotationStatus(quotation.status, status)) { message.warning('当前报价需求不能执行该状态流转'); return }
    setQuotations((current) => current.map((item) => item.id === quotation.id ? { ...item, status } : item)); message.success(`报价需求已流转为：${quotationStatusLabels[status]}`)
  }
  return <PageScaffold title="报价系统" description="记录客户需求、供给报价、风险提示和报价进度。" actions={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建询价</Button>}>
    <Card><Form form={searchForm} layout="inline" initialValues={defaultQuotationSearchValues} onValuesChange={(_, values) => setSearch(values)}><Form.Item name="keyword"><Input allowClear placeholder="客户、需求方、负责人" /></Form.Item><Form.Item name="brand"><SmartSelect options={brandOptions} placeholder="品牌" /></Form.Item><Form.Item name="status"><Select allowClear options={quotationStatusOptions} placeholder="状态" style={{ minWidth: 120 }} /></Form.Item><Button onClick={() => { searchForm.setFieldsValue(defaultQuotationSearchValues); setSearch(defaultQuotationSearchValues) }}>重置</Button></Form></Card>
    <Card><Table rowKey="id" scroll={{ x: 960 }} dataSource={filtered} columns={[
      { title: '客户', dataIndex: 'customerName', render: (_, quotation: Quotation) => <Button type="link" className="table-link" onClick={() => setDetail(quotation)}>{quotation.customerName}</Button> }, { title: '车型', render: (_, item: Quotation) => `${item.carBrand} ${item.carModel}` }, { title: '需求量级', dataIndex: 'demandVolume' }, { title: '建议报价', dataIndex: 'recommendedPrice', render: (value: number) => value ? `${value} 元` : '-' }, { title: '状态', dataIndex: 'status', render: (status: QuotationStatus) => <Tag>{quotationStatusLabels[status]}</Tag> }, { title: '操作', render: (_, item: Quotation) => <Button type="link" disabled={!canManageFlow(role)} onClick={() => openEdit(item)}>编辑</Button> },
    ]} /></Card>
    <Modal open={open} title={editing ? '编辑报价需求' : '新建报价需求'} width={760} onCancel={() => setOpen(false)} onOk={() => form.submit()} destroyOnHidden><Form form={form} layout="vertical" initialValues={defaultQuotationValues} onFinish={save}>
      <div className="modal-form-grid"><Form.Item name="customerName" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}><Input /></Form.Item><Form.Item name="demander" label="需求提出人"><Input /></Form.Item></div><div className="modal-form-grid"><Form.Item name="cityScope" label="城市范围"><Select mode="multiple" options={cityOptions.map(({ value, label }) => ({ value, label }))} /></Form.Item><Form.Item name="carBrand" label="汽车品牌"><SmartSelect options={brandOptions} /></Form.Item></div><div className="modal-form-grid"><Form.Item name="carModel" label="车型"><SmartSelect options={modelOptions} /></Form.Item><Form.Item name="contentType" label="供给内容"><Select options={quotationContentTypeOptions} /></Form.Item></div><div className="modal-form-grid"><Form.Item name="demandVolume" label="需求量级"><Input /></Form.Item><Form.Item name="targetPrice" label="目标单价"><InputNumber min={0} className="form-number" /></Form.Item></div><div className="modal-form-grid"><Form.Item name="submissionMethod" label="提交方式"><Select options={submissionMethodOptions} /></Form.Item><Form.Item name="judgementType" label="判定方式"><Select options={requirementJudgementTypeOptions} /></Form.Item></div><div className="modal-form-grid"><Form.Item name="upstreamQuotePrice" label="上游报价"><InputNumber min={0} className="form-number" /></Form.Item><Form.Item name="ownedQuotePrice" label="自有报价"><InputNumber min={0} className="form-number" /></Form.Item></div><div className="modal-form-grid"><Form.Item name="recommendedPrice" label="建议报价"><InputNumber min={0} className="form-number" /></Form.Item><Form.Item name="grossMargin" label="预计毛利率"><InputNumber min={0} max={1} step={0.01} className="form-number" /></Form.Item></div><Form.Item name="requirementNote" label="需求备注"><Input.TextArea rows={3} /></Form.Item>
    </Form></Modal>
    <Drawer title="报价需求详情" open={Boolean(selected)} size="large" onClose={() => setDetail(null)}>{selected ? <Space orientation="vertical" className="page-stack" size={16}><Card title={selected.customerName}><p>{selected.carBrand} {selected.carModel} · {selected.demandVolume}</p><p>需求方：{selected.demander}　销售：{selected.salesOwner}　运营：{selected.operationOwner}</p><Tag>{quotationStatusLabels[selected.status]}</Tag></Card><Card title="风险与下一步"><Space wrap>{getQuotationRiskTags(selected).map((tag) => <Tag key={tag.label} color={tag.color}>{tag.label}</Tag>)}</Space><div className="drawer-action-row">{(quotationNextStatusOptions[selected.status] ?? []).map((status) => <Button key={status} disabled={!canManageFlow(role)} onClick={() => updateStatus(selected, status)}>流转为{quotationStatusLabels[status]}</Button>)}</div></Card></Space> : null}</Drawer>
  </PageScaffold>
}
