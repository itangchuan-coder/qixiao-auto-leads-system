import { useState } from 'react'
import { Alert, Button, Checkbox, Form, Input, Typography } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

type LoginPageProps = { onLogin: () => void }

export function LoginPage({ onLogin }: LoginPageProps) {
  const [error, setError] = useState('')

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
          <Text className="login-eyebrow">欢迎回来</Text>
          <Title level={2}>登录工作台</Title>
          <Text type="secondary">使用你的企业账号继续</Text>
          {error && <Alert className="login-alert" type="error" showIcon message={error} />}
          <Form
            layout="vertical"
            requiredMark={false}
            className="login-form"
            initialValues={{ remember: true }}
            onFinish={(values: { username: string; password: string }) => {
              if (!values.username?.trim() || !values.password) {
                setError('请输入账号和密码')
                return
              }
              setError('')
              onLogin()
            }}
          >
            <Form.Item label="企业账号" name="username" rules={[{ required: true, message: '请输入企业账号' }]}>
              <Input size="large" prefix={<UserOutlined />} placeholder="姓名 / 手机号" autoComplete="username" />
            </Form.Item>
            <Form.Item label="登录密码" name="password" rules={[{ required: true, message: '请输入登录密码' }]}>
              <Input.Password size="large" prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
            </Form.Item>
            <div className="login-options">
              <Form.Item name="remember" valuePropName="checked" noStyle><Checkbox>保持登录</Checkbox></Form.Item>
              <Button type="link" className="login-help" onClick={() => setError('请联系系统管理员重置密码')}>忘记密码？</Button>
            </div>
            <Button type="primary" htmlType="submit" size="large" block>进入工作台</Button>
          </Form>
          <Text type="secondary" className="login-footnote">首次登录或遇到账号问题，请联系管理员。</Text>
        </div>
      </section>
    </main>
  )
}
