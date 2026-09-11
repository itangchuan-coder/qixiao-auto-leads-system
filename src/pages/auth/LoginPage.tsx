import { useState } from 'react'
import { Alert, Button, Checkbox, Form, Input, Typography } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

const { Text, Title } = Typography

export function LoginPage() {
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const returnToLogin = () => {
    setError('')
    setForgotOpen(false)
    setForgotSent(false)
  }

  return (
    <main className="login-page">
      <section className="login-brief" aria-label="系统介绍">
        <div className="login-brand-mark">启</div>
        <Text className="login-kicker">QIXIAO INTELLIGENCE</Text>
        <Title level={1}>让每一条线索<br />都更接近成交</Title>
        <Text className="login-brief-copy">统一管理汽车销售线索、客户项目和交付节奏，让团队每天都知道下一步该做什么。</Text>
        <div className="login-brief-footer">
          <span className="login-status-dot" />
          <Text>内部业务系统 · 安全连接</Text>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="login-mobile-brand"><span className="login-brand-mark">启</span><Text strong>启效智联</Text></div>
          <Text className="login-eyebrow">{forgotOpen ? '账号安全' : '欢迎回来'}</Text>
          <Title level={2}>{forgotOpen ? '发送密码重置邮件' : '登录工作台'}</Title>
          <Text type="secondary">{forgotOpen ? '输入企业邮箱，我们会发送安全重置链接。' : '使用你的企业账号继续'}</Text>
          {error && <Alert className="login-alert" type="error" showIcon message={error} />}
          {forgotSent && <Alert className="login-alert" type="success" showIcon message="如果该邮箱存在，重置邮件已发送，请检查收件箱和垃圾邮件。" />}
          {!forgotOpen ? <Form
            layout="vertical"
            requiredMark={false}
            className="login-form"
            initialValues={{ remember: true }}
            onFinish={async (values: { username: string; password: string }) => {
              if (!values.username?.trim() || !values.password) {
                setError('请输入账号和密码')
                return
              }
              if (isSupabaseConfigured && supabase) {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email: values.username.trim(), password: values.password })
                if (signInError) { setError(signInError.message); return }
              }
              setError('')
              window.location.assign('/')
            }}
          >
            <Form.Item label={isSupabaseConfigured ? '企业邮箱' : '企业账号'} name="username" rules={[{ required: true, message: isSupabaseConfigured ? '请输入企业邮箱' : '请输入企业账号' }]}>
              <Input size="large" prefix={<UserOutlined />} placeholder={isSupabaseConfigured ? 'name@example.com' : '姓名 / 手机号'} autoComplete="username" />
            </Form.Item>
            <Form.Item label="登录密码" name="password" rules={[{ required: true, message: '请输入登录密码' }]}>
              <Input.Password size="large" prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
            </Form.Item>
            <div className="login-options">
              <Form.Item name="remember" valuePropName="checked" noStyle><Checkbox>保持登录</Checkbox></Form.Item>
              <Button type="link" className="login-help" onClick={() => { setError(''); setForgotOpen(true); setForgotSent(false) }}>忘记密码？</Button>
            </div>
            <Button type="primary" htmlType="submit" size="large" block>进入工作台</Button>
          </Form> : <Form className="login-form" layout="vertical" onFinish={async ({ email }) => {
              if (!supabase || !isSupabaseConfigured) { setError('当前环境未连接密码服务，请联系管理员'); return }
              const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
              if (resetError) { setError('邮件发送失败，请稍后重试或联系管理员'); return }
              setForgotSent(true)
            }}>
              <Form.Item name="email" label="企业邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}><Input autoComplete="email" /></Form.Item>
              {!forgotSent && <Button type="primary" htmlType="submit" size="large" block>发送邮件</Button>}
              <Button type="link" block onClick={returnToLogin}>返回登录</Button>
            </Form>}
          {!forgotOpen && <Text type="secondary" className="login-footnote">首次登录或遇到账号问题，请联系管理员。</Text>}
        </div>
      </section>
    </main>
  )
}
