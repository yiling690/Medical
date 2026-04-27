import { useEffect, useRef, useState } from 'react'
import { Badge, Layout, Menu, Avatar, Button, Modal } from 'antd'
import {
  FileTextOutlined,
  HomeOutlined,
  CalendarOutlined,
  MessageOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/auth.js'
import request from '../api/request.ts'

const { Header, Sider, Content } = Layout

function MainLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const isDoctor = user?.role === 'doctor'
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  const hasLoadedDoctorAppointmentsRef = useRef(false)
  const seenAppointmentIdsRef = useRef(new Set())
  const pendingAppointmentsRef = useRef([])
  const isAppointmentModalOpenRef = useRef(false)
  const hasLoadedChatNotificationsRef = useRef(false)
  const seenChatNotificationKeysRef = useRef(new Set())
  const isChatModalOpenRef = useRef(false)

  const renderMenuLabel = (label, count = 0) => {
    if (!count) {
      return label
    }

    return (
      <Badge count={count} size="small" offset={[10, 0]}>
        <span>{label}</span>
      </Badge>
    )
  }

  useEffect(() => {
    if (!isDoctor) {
      hasLoadedDoctorAppointmentsRef.current = false
      seenAppointmentIdsRef.current = new Set()
      pendingAppointmentsRef.current = []
      isAppointmentModalOpenRef.current = false
      return undefined
    }

    let cancelled = false

    const openNextAppointmentModal = () => {
      if (cancelled || isAppointmentModalOpenRef.current) {
        return
      }

      const nextAppointment = pendingAppointmentsRef.current.shift()
      if (!nextAppointment) {
        return
      }

      isAppointmentModalOpenRef.current = true

      Modal.confirm({
        title: '收到新的预约信息',
        okText: '确认并加入日程',
        cancelText: '稍后处理',
        onOk: async () => {
          const res = await request.post(`/appointments/${nextAppointment.id}/confirm`)
          window.dispatchEvent(
            new CustomEvent('appointment-confirmed', {
              detail: { appointment: res.data?.appointment || nextAppointment },
            }),
          )
        },
        afterClose: () => {
          isAppointmentModalOpenRef.current = false
          openNextAppointmentModal()
        },
        content: (
          <div>
            <div>患者：{nextAppointment.patientName}</div>
            <div>医生：{nextAppointment.doctorName}</div>
            <div>医院：{nextAppointment.hospital}</div>
            <div>科室：{nextAppointment.department}</div>
            <div>
              就诊时间：{nextAppointment.date} {nextAppointment.time}
            </div>
            <div style={{ marginTop: 8 }}>
              点击确认后，这条预约会加入医生日程安排。
            </div>
          </div>
        ),
      })
    }

    const syncAppointments = async () => {
      try {
        const res = await request.get('/appointments')
        if (cancelled) {
          return
        }

        const appointments = Array.isArray(res.data?.appointments)
          ? res.data.appointments
          : []

        if (!hasLoadedDoctorAppointmentsRef.current) {
          appointments.forEach((item) => {
            seenAppointmentIdsRef.current.add(item.id)
          })
          hasLoadedDoctorAppointmentsRef.current = true
          return
        }

        const newAppointments = appointments.filter(
          (item) =>
            !seenAppointmentIdsRef.current.has(item.id) &&
            item.status === '待确认' &&
            (!user?.name || item.doctorName === user.name),
        )

        if (newAppointments.length === 0) {
          return
        }

        newAppointments.forEach((item) => {
          seenAppointmentIdsRef.current.add(item.id)
          pendingAppointmentsRef.current.push(item)
        })

        openNextAppointmentModal()
      } catch {
        // Ignore polling errors to avoid interrupting page navigation.
      }
    }

    syncAppointments()
    const timer = window.setInterval(syncAppointments, 5000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      hasLoadedDoctorAppointmentsRef.current = false
      seenAppointmentIdsRef.current = new Set()
      pendingAppointmentsRef.current = []
      isAppointmentModalOpenRef.current = false
    }
  }, [isDoctor, user?.id, user?.name])

  const menuItems = isDoctor
    ? [
        { key: 'doctor-home', icon: <HomeOutlined />, label: '我的' },
        {
          key: 'doctor-manage',
          icon: <FileTextOutlined />,
          label: renderMenuLabel('患者管理', chatUnreadCount),
        },
        { key: 'doctor-my-patients', icon: <FileTextOutlined />, label: '我的患者' },
        { key: 'doctor-schedule', icon: <CalendarOutlined />, label: '日程安排' },
        { key: 'doctor-stats', icon: <CalendarOutlined />, label: '数据统计' },
        { key: 'doctor-settings', icon: <SettingOutlined />, label: '基础设置' },
      ]
    : [
        { key: 'home', icon: <HomeOutlined />, label: '我的' },
        { key: 'records', icon: <FileTextOutlined />, label: '我的病历' },
        { key: 'appointment-records', icon: <FileTextOutlined />, label: '预约记录' },
        { key: 'appointments', icon: <CalendarOutlined />, label: '预约医生' },
        {
          key: 'chat',
          icon: <MessageOutlined />,
          label: renderMenuLabel('在线沟通', chatUnreadCount),
        },
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
      if (info.key === 'doctor-stats') {
        navigate('/doctor/stats')
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
      if (info.key === 'appointment-records') {
        navigate('/appointment/records')
      }
      if (info.key === 'appointments') {
        navigate('/appointment')
      }
      if (info.key === 'chat') {
        navigate('/chat')
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
    if (location.pathname.startsWith('/doctor/stats')) {
      selectedKeys.push('doctor-stats')
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
    if (
      location.pathname.startsWith('/appointment/records') ||
      location.pathname.startsWith('/appointment/orders')
    ) {
      selectedKeys.push('appointment-records')
    } else if (location.pathname.startsWith('/appointment')) {
      selectedKeys.push('appointments')
    }
    if (location.pathname.startsWith('/chat')) {
      selectedKeys.push('chat')
    }
    if (location.pathname.startsWith('/settings')) {
      selectedKeys.push('settings')
    }
  }

  useEffect(() => {
    if (!user) {
      setChatUnreadCount(0)
      hasLoadedChatNotificationsRef.current = false
      seenChatNotificationKeysRef.current = new Set()
      isChatModalOpenRef.current = false
      return undefined
    }

    let cancelled = false

    const syncChats = async () => {
      try {
        const res = await request.get('/chats')
        if (cancelled) {
          return
        }

        const chats = Array.isArray(res.data?.chats) ? res.data.chats : []
        const totalUnread = chats.reduce(
          (sum, item) => sum + (Number(item.unreadCount) || 0),
          0,
        )
        setChatUnreadCount(totalUnread)

        if (!isDoctor) {
          return
        }

        const candidateNotifications = chats.filter(
          (item) =>
            item.unreadCount > 0 &&
            item.lastMessageSender === 'patient' &&
            item.lastMessageAt,
        )

        if (!hasLoadedChatNotificationsRef.current) {
          candidateNotifications.forEach((item) => {
            seenChatNotificationKeysRef.current.add(`${item.id}:${item.lastMessageAt}`)
          })
          hasLoadedChatNotificationsRef.current = true
          return
        }

        if (isChatModalOpenRef.current) {
          return
        }

        const nextChat = candidateNotifications.find(
          (item) =>
            !seenChatNotificationKeysRef.current.has(`${item.id}:${item.lastMessageAt}`),
        )

        if (!nextChat) {
          return
        }

        seenChatNotificationKeysRef.current.add(`${nextChat.id}:${nextChat.lastMessageAt}`)
        isChatModalOpenRef.current = true

        Modal.info({
          title: '收到新的患者消息',
          okText: '去查看',
          onOk: () => {
            navigate('/doctor/patient-manage')
          },
          afterClose: () => {
            isChatModalOpenRef.current = false
          },
          content: (
            <div>
              <div>患者：{nextChat.patientName}</div>
              <div>医院：{nextChat.hospital}</div>
              <div>科室：{nextChat.department}</div>
              <div style={{ marginTop: 8 }}>最新消息：{nextChat.lastMessagePreview || '您有新的未读消息'}</div>
            </div>
          ),
        })
      } catch {
        // Ignore polling errors to avoid affecting navigation.
      }
    }

    syncChats()
    const timer = window.setInterval(syncChats, 5000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      setChatUnreadCount(0)
      hasLoadedChatNotificationsRef.current = false
      seenChatNotificationKeysRef.current = new Set()
      isChatModalOpenRef.current = false
    }
  }, [isDoctor, navigate, user])

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
