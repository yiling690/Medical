import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, Empty, Row, Tag, Typography, message } from 'antd'
import request from '../api/request'
import './patient-records.less'

const { Title, Text } = Typography

interface AppointmentRecord {
  id: number
  patientId: string
  patientName: string
  doctorName: string
  hospital: string
  department: string
  date: string
  time: string
  status: string
  createdAt: number
}

interface InspectionOrder {
  id: number
  doctorName: string
  patientId: string
  patientName: string
  items: string[]
  remark: string
  status: string
  createdAt: number
  updatedAt: number
  createdAtText: string
  updatedAtText: string
}

function getStatusColor(status: string): string {
  if (status === '确认') {
    return 'green'
  }
  if (status === '待确认') {
    return 'orange'
  }
  return 'default'
}

function getOrderStatusColor(status: string): string {
  if (status === '已检查') {
    return 'green'
  }
  if (status === '待检查') {
    return 'orange'
  }
  return 'default'
}

function AppointmentRecordsPage(): React.ReactElement {
  const navigate = useNavigate()
  const [records, setRecords] = useState<AppointmentRecord[]>([])
  const [orders, setOrders] = useState<InspectionOrder[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoadingAppointments(true)
        setLoadingOrders(true)
      }
      const [appointmentsRes, ordersRes] = await Promise.all([
        request.get<{ appointments: AppointmentRecord[] }>('/appointments'),
        request.get<{ orders: InspectionOrder[] }>('/appointments/orders'),
      ])
      setRecords(appointmentsRes.data.appointments || [])
      setOrders(ordersRes.data.orders || [])
    } catch (error: any) {
      setRecords([])
      setOrders([])
      if (!silent) {
        const msg = error.response?.data?.message || '获取预约与检查单信息失败'
        message.error(msg)
      }
    } finally {
      if (!silent) {
        setLoadingAppointments(false)
        setLoadingOrders(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchData()
    const timer = window.setInterval(() => fetchData(true), 5000)

    return () => {
      window.clearInterval(timer)
    }
  }, [fetchData])

  const handleViewOrderDetail = (id: number) => {
    navigate(`/appointment/orders/${id}`)
  }

  return (
    <div className="patient-records-page">
      <div className="patient-records-header">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            预约与检查单
          </Title>
          <Text type="secondary">
            查看您的预约记录，以及医生为您开立的检查单。
          </Text>
        </div>
      </div>

      <Card
        variant="borderless"
        title="预约记录"
        style={{ marginBottom: 24 }}
        loading={loadingAppointments}
      >
        {records.length === 0 ? (
          <Empty description="当前暂无预约记录" />
        ) : (
          <Row gutter={[16, 16]}>
            {records.map((record) => (
              <Col key={record.id} xs={24} sm={12} md={8}>
                <Card
                  variant="borderless"
                  title={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{record.hospital}</span>
                      <Text type="secondary">{record.date}</Text>
                    </div>
                  }
                  actions={[
                    <span key="status">
                      <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
                    </span>,
                  ]}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Text>医生：{record.doctorName}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">
                      科室：{record.department}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary">
                      预约时间：{record.date} {record.time}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Card variant="borderless" title="检查单列表" loading={loadingOrders}>
        {orders.length === 0 ? (
          <Empty description="当前暂无检查单" />
        ) : (
          <Row gutter={[16, 16]}>
            {orders.map((order) => (
              <Col key={order.id} xs={24} sm={12} md={8}>
                <Card
                    variant="borderless"
                  title={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span>{order.patientName}</span>
                      <Tag color={getOrderStatusColor(order.status)}>{order.status}</Tag>
                    </div>
                  }
                  actions={[
                    <Button
                      type="link"
                      key="detail"
                      onClick={() => handleViewOrderDetail(order.id)}
                    >
                      查看详情
                    </Button>,
                  ]}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Text>医生：{order.doctorName}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">
                      检查项目：{order.items.length > 0 ? order.items.join('、') : '暂无'}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary">
                      更新时间：{order.updatedAtText || '暂无'}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  )
}
export default AppointmentRecordsPage
