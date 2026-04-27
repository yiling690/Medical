import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Descriptions, Space, Tag, Typography, message } from 'antd'
import request from '../api/request'
import './record-detail.less'

const { Title, Text } = Typography

interface InspectionOrderDetail {
  id: number
  doctorName: string
  patientId: string
  patientName: string
  items: string[]
  remark: string
  status: string
  createdAtText: string
  updatedAtText: string
}

interface InspectionOrderDetailResponse {
  order: InspectionOrderDetail
}

function getStatusColor(status: string): string {
  if (status === '已检查') {
    return 'green'
  }
  if (status === '待检查') {
    return 'orange'
  }
  return 'default'
}

function InspectionOrderDetailPage(): React.ReactElement | null {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<InspectionOrderDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const fetchDetail = async (silent = false) => {
      if (!id) {
        return
      }

      try {
        if (!silent) {
          setLoading(true)
        }
        const res = await request.get<InspectionOrderDetailResponse>(
          `/appointments/orders/${id}`,
        )
        if (!cancelled) {
          setOrder(res.data.order)
        }
      } catch (error: any) {
        if (!silent) {
          const msg = error.response?.data?.message || '获取检查单详情失败'
          message.error(msg)
        }
      } finally {
        if (!silent && !cancelled) {
          setLoading(false)
        }
      }
    }

    fetchDetail()
    const timer = window.setInterval(() => {
      fetchDetail(true)
    }, 5000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [id])

  if (!order) {
    return null
  }

  return (
    <div className="record-detail-page">
      <div className="record-detail-header">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            检查单详情
          </Title>
          <Text type="secondary">查看医生为您开立的检查单内容。</Text>
        </div>
        <Space>
          <Tag color={getStatusColor(order.status)}>{order.status}</Tag>
          <Button onClick={() => window.location.reload()}>刷新</Button>
          <Button onClick={() => navigate('/appointment/records')}>返回列表</Button>
        </Space>
      </div>

      <Card loading={loading} variant="borderless" className="record-detail-card">
        <Descriptions title="患者信息" column={2} bordered>
          <Descriptions.Item label="患者姓名">
            {order.patientName}
          </Descriptions.Item>
          <Descriptions.Item label="患者编号">
            {order.patientId}
          </Descriptions.Item>
          <Descriptions.Item label="开单医生">
            {order.doctorName}
          </Descriptions.Item>
          <Descriptions.Item label="检查状态">
            <Tag color={getStatusColor(order.status)}>{order.status}</Tag>
          </Descriptions.Item>
        </Descriptions>

        <Descriptions
          title="检查项目"
          column={1}
          bordered
          style={{ marginTop: 24 }}
        >
          <Descriptions.Item label="项目明细">
            {order.items.length > 0 ? order.items.join('、') : '暂无检查项目'}
          </Descriptions.Item>
          <Descriptions.Item label="备注说明">
            {order.remark || '暂无备注'}
          </Descriptions.Item>
        </Descriptions>

        <Descriptions
          title="时间信息"
          column={2}
          bordered
          style={{ marginTop: 24 }}
        >
          <Descriptions.Item label="创建时间">
            {order.createdAtText || '暂无'}
          </Descriptions.Item>
          <Descriptions.Item label="最近更新时间">
            {order.updatedAtText || '暂无'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default InspectionOrderDetailPage
