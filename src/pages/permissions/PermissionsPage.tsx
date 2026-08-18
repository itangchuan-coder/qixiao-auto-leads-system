import { useState } from 'react'
import { Alert, App as AntApp, Button, Card, Descriptions, Form, Input, Modal, Space, Tag, Typography } from 'antd'
import { KeyOutlined } from '@ant-design/icons'
import { useLeadSystemStore } from '../../domain/store'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { PageScaffold } from '../workflows/PageScaffold'

export default function PermissionsPage() {
  const { message } = AntApp.useApp()
  const role = useLeadSystemStore((state) => state.role)
  const [resetOpen, setResetOpen] = useState(false)
  const [form] = Form.useForm<{ email: string; temporaryPassword: string; confirmPassword: string }>()
  const resetPassword = async (values: { email: string; temporaryPassword: string }) => {
    if (!supabase || role !== 'admin') { message.warning('只有线上超级管理员可以重置用户密码'); return }
    const { error } = await supabase.functions.invoke('admin-reset-user', { body: values })
    if (error) { message.error(error.message); return }
    form.resetFields(); setResetOpen(false); message.success('临时密码已设置，请通知用户尽快登录并修改密码')
  }

  return <PageScaffold title="权限与账号管理" description="查看角色边界，并由超级管理员处理用户密码重置。">
    <Alert type="info" showIcon message="管理员和运营角色可执行流程操作；其他角色只能查看脱敏信息。管理员不能查看用户原密码，只能设置一次性临时密码。" />
    <Card><Descriptions bordered column={1}><Descriptions.Item label="管理员"><Tag color="green">完整权限</Tag> 查看完整手机号、编辑档案、状态流转、导入和交付。</Descriptions.Item><Descriptions.Item label="运营"><Tag color="blue">流程权限</Tag> 查看完整手机号、编辑线索并执行运营流程。</Descriptions.Item><Descriptions.Item label="其他角色"><Tag>受限查看</Tag> 手机号脱敏，不能编辑或流转。</Descriptions.Item></Descriptions></Card>
    <Card title="用户账号" extra={<Button type="primary" icon={<KeyOutlined />} disabled={role !== 'admin'} onClick={() => setResetOpen(true)}>重置用户密码</Button>}>
      <Space orientation="vertical"><Typography.Text type="secondary">重置需要用户邮箱和新的临时密码。操作完成后请通过安全渠道通知用户。</Typography.Text>{!isSupabaseConfigured && <Typography.Text type="warning">当前未配置线上 Supabase，账号重置窗口仅在 Qinuo 线上环境可用。</Typography.Text>}</Space>
    </Card>
    <Modal open={resetOpen} title="重置用户密码" onCancel={() => setResetOpen(false)} onOk={() => form.submit()} okText="确认重置" destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={resetPassword}>
        <Form.Item name="email" label="用户邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}><Input placeholder="name@example.com" autoComplete="email" /></Form.Item>
        <Form.Item name="temporaryPassword" label="临时密码" rules={[{ required: true, min: 8, message: '临时密码至少 8 位' }]}><Input.Password autoComplete="new-password" /></Form.Item>
        <Form.Item name="confirmPassword" label="确认临时密码" dependencies={['temporaryPassword']} rules={[{ required: true, message: '请再次输入临时密码' }, ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue('temporaryPassword') === value ? Promise.resolve() : Promise.reject(new Error('两次输入的密码不一致')) } })]}><Input.Password autoComplete="new-password" /></Form.Item>
      </Form>
    </Modal>
  </PageScaffold>
}
