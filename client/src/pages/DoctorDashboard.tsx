import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd'
import request from '../api/request'
import './doctor-dashboard.less'

const { Title, Text } = Typography

interface DoctorPatientItem {
  orderId?: number | null
  id: string
  name: string
  hospital: string
  department: string
  latestVisit: string
  followStatus: string
  checkStatus: '未检查' | '待检查' | '已检查'
  hasOrder: boolean
  orderItems?: string[]
  orderRemark?: string
}

interface DashboardResponse {
  patients: DoctorPatientItem[]
}

const ORDER_ITEM_OPTIONS = ['血常规', '心电图', '胸片', '肝功能']

const getCheckStatusColor = (status: DoctorPatientItem['checkStatus']): string => {
  if (status === '未检查') {
    return 'red'
  }
  if (status === '待检查') {
    return 'orange'
  }
  return 'green'
}

const getFollowStatusColor = (status: string): string => {
  if (status === '随访中') {
    return 'blue'
  }
  if (status === '待复查') {
    return 'gold'
  }
  if (status === '长期未复诊') {
    return 'default'
  }
  return 'cyan'
}

function DoctorDashboardPage(): React.ReactElement {
  const [patients, setPatients] = useState<DoctorPatientItem[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [statusSubmitting, setStatusSubmitting] = useState(false)
  const [orderVisible, setOrderVisible] = useState(false)
  const [viewVisible, setViewVisible] = useState(false)
  const [currentPatient, setCurrentPatient] = useState<DoctorPatientItem | null>(null)
  const [form] = Form.useForm()

  const summary = useMemo(
    () => ({
      patientCount: patients.length,
      pendingCount: patients.filter((item) => item.checkStatus === '待检查').length,
      orderedCount: patients.filter((item) => item.hasOrder).length,
    }),
    [patients],
  )

  const fetchDashboard = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const res = await request.get<DashboardResponse>('/appointments/doctor-dashboard')
      setPatients(res.data.patients || [])
    } catch (error: any) {
      if (!silent) {
        const msg =
          error.response?.data?.message ||
          error.message ||
          '获取医生工作台数据失败'
        message.error(msg)
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchDashboard()

    const handleAppointmentConfirmed = () => {
      fetchDashboard(true)
    }

    window.addEventListener('appointment-confirmed', handleAppointmentConfirmed)
    const timer = window.setInterval(() => {
      fetchDashboard(true)
    }, 5000)

    return () => {
      window.removeEventListener('appointment-confirmed', handleAppointmentConfirmed)
      window.clearInterval(timer)
    }
  }, [fetchDashboard])

  useEffect(() => {
    if (!currentPatient) {
      return
    }

    const latest = patients.find((item) => item.id === currentPatient.id)
    if (latest) {
      setCurrentPatient(latest)
    }
  }, [patients, currentPatient?.id])

  const handleOpenOrder = (item: DoctorPatientItem) => {
    setCurrentPatient(item)
    form.setFieldsValue({
      items: item.orderItems && item.orderItems.length > 0 ? item.orderItems : [],
      remark: item.orderRemark || '',
    })
    setOrderVisible(true)
  }

  const handleConfirmOrder = async () => {
    try {
      const values = await form.validateFields()
      if (!currentPatient) {
        setOrderVisible(false)
        return
      }

      setSubmitting(true)
      const res = await request.post('/appointments/doctor-dashboard/order', {
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        items: values.items || [],
        remark: values.remark || '',
      })

      message.success(res.data?.message || '检查单已保存')
      window.dispatchEvent(
        new CustomEvent('inspection-order-changed', {
          detail: { order: res.data?.order || null, action: 'saved' },
        }),
      )
      setOrderVisible(false)
      await fetchDashboard()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      const msg =
        error.response?.data?.message ||
        error.message ||
        '保存检查单失败'
      message.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewOrder = (item: DoctorPatientItem) => {
    setCurrentPatient(item)
    setViewVisible(true)
  }

  const handleUpdateOrderStatus = async (status: '待检查' | '已检查') => {
    if (!currentPatient?.orderId) {
      message.warning('当前患者暂无可更新的检查单')
      return
    }

    try {
      setStatusSubmitting(true)
      const res = await request.patch(`/appointments/orders/${currentPatient.orderId}/status`, {
        status,
      })
      message.success(res.data?.message || '检查单状态已更新')
      window.dispatchEvent(
        new CustomEvent('inspection-order-changed', {
          detail: { order: res.data?.order || null, action: 'status-updated' },
        }),
      )
      await fetchDashboard()
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        '更新检查单状态失败'
      message.error(msg)
    } finally {
      setStatusSubmitting(false)
    }
  }

  const [aiVisible, setAiVisible] = useState(false)
  const [aiSymptoms, setAiSymptoms] = useState('')
  const [aiResults, setAiResults] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const handleOpenAi = (item: DoctorPatientItem) => {
    setCurrentPatient(item)
    setAiVisible(true)
    setAiResults(null)
    setAiSymptoms('')
  }

  const handleAiConsult = async () => {
    if (!aiSymptoms.trim()) {
      message.warning('请输入患者症状')
      return
    }
    try {
      setAiLoading(true)
      const res = await request.post('/ai/suggest', { symptoms: aiSymptoms })
      setAiResults(res.data)
    } catch (error: any) {
      message.error('AI 咨询失败')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="doctor-dashboard-page">
      <Title level={3}>医生工作台</Title>
      <Text type="secondary">查看本人患者概览，并为患者开立检查单。</Text>
      <Row gutter={16} className="doctor-dashboard-summary">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="患者数" value={summary.patientCount} loading={loading} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="已开单患者" value={summary.orderedCount} loading={loading} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="待检查患者" value={summary.pendingCount} loading={loading} />
          </Card>
        </Col>
      </Row>
      <Card className="doctor-dashboard-card" variant="borderless">
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>
        ) : patients.length === 0 ? (
          <Empty description="暂无工作台患者数据" />
        ) : (
          <Flex vertical gap="middle">
            {patients.map((item, index) => (
              <div
                key={item.id}
                style={{
                  padding: '16px 0',
                  borderBottom: index < patients.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
              >
                <Flex justify="space-between" align="flex-start">
                  <Flex gap="middle" flex={1}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 16, fontWeight: 500 }}>
                          {item.name}（{item.id}）
                        </span>
                        <Flex gap={8} wrap="wrap">
                          <Tag color={getFollowStatusColor(item.followStatus)}>
                            {item.followStatus}
                          </Tag>
                          <Tag color={getCheckStatusColor(item.checkStatus)}>
                            {item.checkStatus}
                          </Tag>
                        </Flex>
                      </div>
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          {item.hospital} · {item.department}
                        </div>
                        <Text type="secondary">
                          最近就诊时间：{item.latestVisit || '暂无记录'}
                        </Text>
                      </div>
                    </div>
                  </Flex>
                  <Flex gap={8}>
                    <Button type="primary" onClick={() => handleOpenOrder(item)}>
                      {item.hasOrder ? '修改开单' : '开单'}
                    </Button>
                    <Button type="link" onClick={() => handleOpenAi(item)}>
                      AI 辅助
                    </Button>
                    <Button type="link" onClick={() => handleViewOrder(item)}>
                      查看
                    </Button>
                  </Flex>
                </Flex>
              </div>
            ))}
          </Flex>
        )}
      </Card>
      <Modal
        open={orderVisible}
        title="开立检查单"
        confirmLoading={submitting}
        onOk={handleConfirmOrder}
        onCancel={() => {
          setOrderVisible(false)
          form.resetFields()
        }}
        okText="确认开单"
        cancelText="取消"
        destroyOnHidden
      >
        {currentPatient && (
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              items: currentPatient.orderItems || [],
              remark: currentPatient.orderRemark || '',
            }}
          >
            <Form.Item label="患者">
              <Text>
                {currentPatient.name}（{currentPatient.id}）
              </Text>
            </Form.Item>
            <Form.Item label="当前检查状态">
              <Tag
                color={
                  currentPatient.checkStatus === '未检查'
                    ? 'red'
                    : currentPatient.checkStatus === '待检查'
                    ? 'orange'
                    : 'green'
                }
              >
                {currentPatient.checkStatus}
              </Tag>
            </Form.Item>
            <Form.Item
              name="items"
              label="检查项目"
              rules={[{ required: true, message: '请选择或输入至少一个检查项目' }]}
            >
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="请选择或输入检查项目，例如：血常规、心电图等"
              >
                {ORDER_ITEM_OPTIONS.map((item) => (
                  <Select.Option key={item} value={item}>
                    {item}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="remark" label="备注说明">
              <Input.TextArea
                rows={3}
                placeholder="可输入检查目的、注意事项等（可选）"
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
      <Modal
        open={viewVisible}
        title="检查单详情"
        confirmLoading={statusSubmitting}
        onOk={() => setViewVisible(false)}
        onCancel={() => setViewVisible(false)}
        okText="关闭"
        cancelButtonProps={{ style: { display: 'none' } }}
        footer={
          currentPatient
            ? [
                <Button key="close" onClick={() => setViewVisible(false)}>
                  关闭
                </Button>,
                <Button
                  key="pending"
                  loading={statusSubmitting}
                  disabled={
                    !currentPatient.orderId || currentPatient.checkStatus === '待检查'
                  }
                  onClick={() => handleUpdateOrderStatus('待检查')}
                >
                  标记待检查
                </Button>,
                <Button
                  key="checked"
                  type="primary"
                  loading={statusSubmitting}
                  disabled={
                    !currentPatient.orderId || currentPatient.checkStatus === '已检查'
                  }
                  onClick={() => handleUpdateOrderStatus('已检查')}
                >
                  标记已检查
                </Button>,
              ]
            : undefined
        }
      >
        {currentPatient && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">患者</Text>
              <div>
                {currentPatient.name}（{currentPatient.id}）
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">接诊信息</Text>
              <div>
                {currentPatient.hospital} · {currentPatient.department}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">最近就诊时间</Text>
              <div>{currentPatient.latestVisit || '暂无记录'}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">检查状态</Text>
              <div>
                <Tag color={getCheckStatusColor(currentPatient.checkStatus)}>
                  {currentPatient.checkStatus}
                </Tag>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">检查项目</Text>
              <div style={{ marginTop: 4 }}>
                {currentPatient.orderItems && currentPatient.orderItems.length > 0
                  ? currentPatient.orderItems.join('、')
                  : '暂无检查项目'}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">备注说明</Text>
              <div style={{ marginTop: 4 }}>
                {currentPatient.orderRemark || '暂无备注'}
              </div>
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <Text strong>上传检查报告附件</Text>
              <div style={{ marginTop: 8 }}>
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append('file', file)
                    try {
                      const res = await request.post('/files/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      })
                      message.success('报告上传成功')
                      console.log('File path:', res.data.path)
                    } catch (error) {
                      message.error('上传失败')
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={aiVisible}
        title="AI 辅助临床建议"
        onCancel={() => setAiVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAiVisible(false)}>
            关闭
          </Button>,
          <Button
            key="consult"
            type="primary"
            loading={aiLoading}
            onClick={handleAiConsult}
          >
            获取 AI 建议
          </Button>,
        ]}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">当前患者：</Text>
          <Text strong>{currentPatient?.name}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">请输入症状描述（例如：发烧、咳嗽 2 天）：</Text>
          <Input.TextArea
            rows={4}
            value={aiSymptoms}
            onChange={(e) => setAiSymptoms(e.target.value)}
            placeholder="请输入患者的详细症状..."
            style={{ marginTop: 8 }}
          />
        </div>
        {aiResults && (
          <div
            style={{
              padding: 16,
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 4,
            }}
          >
            <Title level={5}>AI 诊断建议</Title>
            <Flex vertical gap="small">
              {aiResults.suggestions.map((item: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: '12px 0',
                    borderBottom:
                      index < aiResults.suggestions.length - 1
                        ? '1px solid #d9f7be'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Text strong style={{ fontSize: 16 }}>
                      {item.diagnosis}
                    </Text>
                    <Tag color="green">置信度: {(item.confidence * 100).toFixed(0)}%</Tag>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary">建议检查：</Text>
                    {item.tests?.map((test: string) => (
                      <Tag key={test}>{test}</Tag>
                    ))}
                  </div>
                  <div>
                    <Text type="secondary">处理意见：</Text>
                    <Text>{item.treatment}</Text>
                  </div>
                </div>
              ))}
            </Flex>
            <div style={{ marginTop: 12 }}>
              <Text type="warning" style={{ fontSize: 12 }}>
                {aiResults.note}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DoctorDashboardPage
