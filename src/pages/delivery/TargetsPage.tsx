import { useState } from 'react'
import { App as AntApp, Button, Card, Form, Input, Modal, Select, Table, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { canManageFlow, phoneForRole } from '../../domain/helpers'
import { useLeadSystemStore } from '../../domain/store'
import type { DeliveryTarget } from '../../domain/types'
import { PageScaffold } from '../workflows/PageScaffold'

export default function TargetsPage() {
  const { message } = AntApp.useApp(); const { role, targets, setTargets } = useLeadSystemStore(); const [form] = Form.useForm<Omit<DeliveryTarget, 'id'>>(); const [open, setOpen] = useState(false)
  const create = (values: Omit<DeliveryTarget, 'id'>) => { if (!canManageFlow(role)) { message.warning('当前角色不能新增交付对象'); return }; setTargets((current) => [{ id: `T${String(current.length + 1).padStart(3, '0')}`, ...values }, ...current]); setOpen(false); form.resetFields(); message.success('交付对象已新增') }
  return <PageScaffold title="交付对象" description="管理平台和主机厂交付对象，供交付批次选择。" actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新增对象</Button>}><Card><Table rowKey="id" dataSource={targets} columns={[{ title: '名称', dataIndex: 'name' }, { title: '类型', dataIndex: 'type', render: (type) => type === 'platform' ? '平台' : '主机厂' }, { title: '联系人', dataIndex: 'contact' }, { title: '联系电话', dataIndex: 'phone', render: (phone) => phoneForRole(phone, role) }, { title: '状态', dataIndex: 'status', render: (status) => <Tag color={status === 'active' ? 'green' : 'gold'}>{status === 'active' ? '启用' : '暂停'}</Tag> }, { title: '备注', dataIndex: 'note' }]} /></Card><Modal open={open} title="新增交付对象" onCancel={() => setOpen(false)} onOk={() => form.submit()}><Form form={form} layout="vertical" onFinish={create} initialValues={{ type: 'platform', status: 'active', name: '', contact: '', phone: '', note: '' }}><Form.Item name="name" label="对象名称" rules={[{ required: true, message: '请输入对象名称' }]}><Input /></Form.Item><div className="modal-form-grid"><Form.Item name="type" label="对象类型"><Select options={[{ value: 'platform', label: '平台' }, { value: 'oem', label: '主机厂' }]} /></Form.Item><Form.Item name="status" label="状态"><Select options={[{ value: 'active', label: '启用' }, { value: 'paused', label: '暂停' }]} /></Form.Item></div><div className="modal-form-grid"><Form.Item name="contact" label="联系人"><Input /></Form.Item><Form.Item name="phone" label="联系电话"><Input /></Form.Item></div><Form.Item name="note" label="备注"><Input.TextArea rows={3} /></Form.Item></Form></Modal></PageScaffold>
}
