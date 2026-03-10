import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Segmented, Typography, message } from 'antd'
import type { FormProps } from 'antd'
import request from '../api/request'
import useAuthStore from '../store/auth'
import './login.less'

const { Title, Text, Link } = Typography

type Role = 'patient' | 'doctor'

interface LoginFormValues {
  username: string
  password: string
}

interface LoginResponseUser {
  id: number
  username: string
  role: Role
  name: string
  patientId?: string | null
}

interface LoginResponse {
  token: string
  user: LoginResponseUser
}

const roleOptions = [
  { label: '患者', value: 'patient' },
  { label: '医生', value: 'doctor' },
]

function LoginPage(): React.ReactElement {
  const [role, setRole] = useState<Role>('patient')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleFinish: FormProps<LoginFormValues>['onFinish'] = async (values) => {
    try {
      setLoading(true)
      const res = await request.post<LoginResponse>('/auth/login', {
        username: values.username,
        password: values.password,
        role,
      })
      const data = res.data
      login(data.token, data.user)
      message.success('登录成功')
      if (data.user.role === 'patient') {
        navigate('/home', { replace: true })
      } else {
        navigate('/doctor', { replace: true })
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        '登录失败，请稍后重试'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card" bodyStyle={{ padding: 32 }} bordered={false}>
        <div className="login-header">
          <div className="login-logo">HB</div>
          <Title level={4} style={{ margin: 0 }}>
            欢迎登录 HealthBridge
          </Title>
        </div>

        <Text type="secondary">选择您的角色并登录系统。</Text>

        <div className="login-role">
          <Segmented
            options={roleOptions}
            value={role}
            onChange={(value) => setRole(value as Role)}
          />
        </div>

        <Form<LoginFormValues> layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label="用户名或邮箱"
            name="username"
            rules={[{ required: true, message: '请输入用户名或邮箱' }]}
          >
            <Input placeholder="输入您的用户名或邮箱" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="输入您的密码" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="login-footer">
          <Link>忘记密码？</Link>
          <Text type="secondary">没有账户？立即注册</Text>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage
