import { useState } from 'react'
import { Alert, Button, Form, Input, Typography } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

const { Text, Title } = Typography

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const updatePassword = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    if (!isSupabaseConfigured || !supabase) {
      setError('当前环境未连接密码服务，请联系管理员')
      return
    }

    setSubmitting(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password: values.password })
    setSubmitting(false)
    if (updateError) {
      setError('重置链接已失效或已使用，请重新发送密码重置邮件')
      return
    }
    setSuccess('密码已更新，请返回登录页使用新密码登录')
    await supabase.auth.signOut()
  }

  return (
    <main className="login-page">
      <section className="login-brief" aria-label="系统介绍">
        <div className="login-brand-mark">启</div>
        <Text className="login-kicker">QIXIAO INTELLIGENCE</Text>
        <Title level={1}>安全地找回<br />你的工作台</Title>
        <Text className="login-brief-copy">通过邮件中的安全链接设置新密码，设置完成后即可重新登录系统。</Text>
      </section>
      <section className="login-panel">
        <div className="login-form-wrap">
          <Text className="login-eyebrow">账号安全</Text>
          <Title level={2}>设置新密码</Title>
          <Text type="secondary">请输入新的登录密码</Text>
          {error && <Alert className="login-alert" type="error" showIcon message={error} />}
          {success && <Alert className="login-alert" type="success" showIcon message={success} />}
          {!success && <Form layout="vertical" requiredMark={false} className="login-form" onFinish={updatePassword}>
            <Form.Item name="password" label="新密码" rules={[{ required: true, min: 8, message: '新密码至少 8 位' }]}>
              <Input.Password size="large" prefix={<LockOutlined />} autoComplete="new-password" />
            </Form.Item>
            <Form.Item name="confirmPassword" label="确认新密码" dependencies={['password']} rules={[{ required: true, message: '请再次输入新密码' }]}>
              <Input.Password size="large" prefix={<LockOutlined />} autoComplete="new-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={submitting}>保存新密码</Button>
          </Form>}
          {success && <Button type="primary" size="large" block onClick={() => navigate('/login')}>返回登录</Button>}
          <Text type="secondary" className="login-footnote">如果链接打不开，请让管理员使用权限管理中的临时密码重置。</Text>
        </div>
      </section>
    </main>
  )
}
