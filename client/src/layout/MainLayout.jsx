import { Layout, Menu, Avatar, Button } from 'antd'
import {
  FileTextOutlined,
  HomeOutlined,
  CalendarOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/auth.js'

const { Header, Sider, Content } = Layout

function MainLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const isDoctor = user?.role === 'doctor'

  const menuItems = isDoctor
    ? [
        { key: 'doctor-home', icon: <HomeOutlined />, label: '我的' },
        { key: 'doctor-manage', icon: <FileTextOutlined />, label: '患者管理' },
        { key: 'doctor-my-patients', icon: <FileTextOutlined />, label: '我的患者' },
        { key: 'doctor-schedule', icon: <CalendarOutlined />, label: '日程安排' },
        { key: 'doctor-settings', icon: <SettingOutlined />, label: '基础设置' },
      ]
    : [
        { key: 'home', icon: <HomeOutlined />, label: '我的' },
        { key: 'records', icon: <FileTextOutlined />, label: '我的病历' },
        { key: 'appointments', icon: <CalendarOutlined />, label: '预约' },
        { key: 'settings', icon: <SettingOutlined />, label: '设置' },
      ]

  const handleMenuClick = (info) => {
    if (isDoctor) {
      if (info.key === 'doctor-home') {
        navigate('/doctor')
      }
      if (info.key === 'doctor-manage') {
        navigate('/doctor/patient-manage')
      }
      if (info.key === 'doctor-my-patients') {
        navigate('/doctor/my-patients')
      }
      if (info.key === 'doctor-schedule') {
        navigate('/doctor/schedule')
      }
      if (info.key === 'doctor-settings') {
        navigate('/settings')
      }
    } else {
      if (info.key === 'home') {
        navigate('/home')
      }
      if (info.key === 'records') {
        navigate('/patient')
      }
      if (info.key === 'appointments') {
        navigate('/appointment')
      }
      if (info.key === 'settings') {
        navigate('/settings')
      }
    }
  }

  const selectedKeys = []
  if (isDoctor) {
    if (location.pathname === '/doctor') {
      selectedKeys.push('doctor-home')
    }
    if (location.pathname.startsWith('/doctor/patient-manage')) {
      selectedKeys.push('doctor-manage')
    }
    if (location.pathname.startsWith('/doctor/my-patients')) {
      selectedKeys.push('doctor-my-patients')
    }
    if (location.pathname.startsWith('/doctor/schedule')) {
      selectedKeys.push('doctor-schedule')
    }
    if (location.pathname.startsWith('/settings')) {
      selectedKeys.push('doctor-settings')
    }
  } else {
    if (location.pathname.startsWith('/home')) {
      selectedKeys.push('home')
    }
    if (
      location.pathname.startsWith('/patient') ||
      location.pathname.startsWith('/records')
    ) {
      selectedKeys.push('records')
    }
    if (location.pathname.startsWith('/appointment')) {
      selectedKeys.push('appointments')
    }
    if (location.pathname.startsWith('/settings')) {
      selectedKeys.push('settings')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            paddingInline: 24,
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          健康桥
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            paddingInline: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: '#1677ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              HB
            </div>
            <span style={{ fontWeight: 600 }}>HealthBridge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>{user?.name}</span>
            <Avatar size="large">
              {user?.name ? user.name.charAt(0) : '?'}
            </Avatar>
            <Button type="link" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
