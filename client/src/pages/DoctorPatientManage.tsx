import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Empty, Flex, Input, Row, Tag, Typography } from 'antd'
import request from '../api/request'
import './doctor-patient-manage.less'

const { Title, Text } = Typography

interface PatientItem {
  id: number
  patientId: string
  name: string
  lastVisit: string
  status: '随访中' | '未就诊' | '复查中'
  hospital: string
  department: string
  unreadCount: number
}

interface ChatMessage {
  id: number
  sender: 'doctor' | 'patient'
  senderName: string
  content: string
  createdAt: number
}

interface ChatConversationResponse {
  id: number
  patientId: string
  patientName: string
  doctorName: string
  hospital: string
  department: string
  appointmentDate: string
  unreadCount: number
}

function renderStatusTag(status: PatientItem['status']) {
  if (status === '随访中') {
    return <Tag color="green">随访中</Tag>
  }
  if (status === '复查中') {
    return <Tag color="orange">复查中</Tag>
  }
  return <Tag>未就诊</Tag>
}

function mapChatToPatient(chat: ChatConversationResponse): PatientItem {
  return {
    id: chat.id,
    patientId: chat.patientId,
    name: chat.patientName,
    lastVisit: chat.appointmentDate,
    status: '随访中',
    hospital: chat.hospital,
    department: chat.department,
    unreadCount: chat.unreadCount,
  }
}

function DoctorPatientManagePage(): React.ReactElement {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [patients, setPatients] = useState<PatientItem[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const loadChats = useCallback(async () => {
    try {
      const res = await request.get<{ chats: ChatConversationResponse[] }>('/chats')
      const nextPatients = Array.isArray(res.data?.chats)
        ? res.data.chats.map(mapChatToPatient)
        : []

      setPatients(nextPatients)
      setSelectedPatientId((prev) => {
        if (prev && nextPatients.some((item) => item.id === prev)) {
          return prev
        }
        return nextPatients[0]?.id ?? null
      })
    } catch {
      setPatients([])
      setSelectedPatientId(null)
    }
  }, [])

  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      const res = await request.get<{ messages: ChatMessage[] }>(
        `/chats/${conversationId}/messages`,
      )
      setMessages(Array.isArray(res.data?.messages) ? res.data.messages : [])
      await loadChats()
    } catch {
      setMessages([])
    }
  }, [loadChats])

  useEffect(() => {
    loadChats()
    const timer = window.setInterval(loadChats, 5000)
    return () => {
      window.clearInterval(timer)
    }
  }, [loadChats])

  useEffect(() => {
    if (!selectedPatientId) {
      setMessages([])
      return
    }

    loadMessages(selectedPatientId)
    const timer = window.setInterval(() => loadMessages(selectedPatientId), 5000)

    return () => {
      window.clearInterval(timer)
    }
  }, [loadMessages, selectedPatientId])

  const filteredPatients = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    return patients.filter((item) => {
      if (!keyword) {
        return true
      }

      return (
        item.name.toLowerCase().includes(keyword) ||
        item.patientId.toLowerCase().includes(keyword)
      )
    })
  }, [patients, searchKeyword])

  const currentPatient =
    filteredPatients.find((item) => item.id === selectedPatientId) ||
    patients.find((item) => item.id === selectedPatientId) ||
    null
  const currentChat = useMemo(
    () => messages,
    [messages],
  )

  const handleSendMessage = async () => {
    if (!selectedPatientId) {
      return
    }

    const content = chatInput.trim()
    if (!content) {
      return
    }

    try {
      await request.post(`/chats/${selectedPatientId}/messages`, { content })
      setChatInput('')
      await loadMessages(selectedPatientId)
      await loadChats()
    } catch {
      // Ignore transient send errors and keep current draft.
    }
  }

  return (
    <div className="doctor-patient-manage-page">
      <Title level={3} className="doctor-patient-manage-title">
        患者管理
      </Title>

      <Row gutter={16}>
        <Col span={6}>
          <Card className="doctor-patient-list-card" variant="outlined">
            <div className="doctor-patient-list-header">
              <div className="doctor-patient-list-title">患者列表</div>
              <Input.Search
                placeholder="搜索患者姓名或ID..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            {filteredPatients.length === 0 ? (
              <Empty description="当前暂无聊天会话" />
            ) : (
              <Flex vertical className="doctor-patient-list-container">
                {filteredPatients.map((item) => (
                  <div
                    key={item.id}
                    className={
                      item.id === selectedPatientId
                        ? 'doctor-patient-list-item doctor-patient-list-item-active'
                        : 'doctor-patient-list-item'
                    }
                    onClick={() => setSelectedPatientId(item.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <div className="doctor-patient-list-item-main">
                      <div className="doctor-patient-list-name">{item.name}</div>
                      <div className="doctor-patient-list-id">ID: {item.patientId}</div>
                      <div className="doctor-patient-list-meta">
                        最近预约: {item.lastVisit}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {item.unreadCount > 0 && (
                        <Badge count={item.unreadCount} size="small" style={{ marginBottom: 8 }} />
                      )}
                      <div>{renderStatusTag(item.status)}</div>
                    </div>
                  </div>
                ))}
              </Flex>
            )}
          </Card>
        </Col>
        <Col span={18}>
          <Card className="doctor-patient-detail-card" variant="outlined">
            <div className="doctor-patient-detail-header">
              <Title level={4} style={{ marginBottom: 4 }}>
                医患沟通{currentPatient ? ` - ${currentPatient.name}` : ''}
              </Title>
              <Text type="secondary">
                在这里与患者沟通复诊安排、检查结果和日常随访信息。
              </Text>
            </div>

            {!currentPatient ? (
              <Empty description="暂无可用聊天会话，请先确认患者预约" />
            ) : (
              <>
                <div className="doctor-patient-detail-section">
                  <div className="doctor-patient-detail-section-title">当前患者</div>
                  <div className="doctor-patient-detail-grid">
                    <div>
                      <Text type="secondary">姓名</Text>
                      <div>{currentPatient.name}</div>
                    </div>
                    <div>
                      <Text type="secondary">患者ID</Text>
                      <div>{currentPatient.patientId}</div>
                    </div>
                    <div>
                      <Text type="secondary">状态</Text>
                      <div>{currentPatient.status}</div>
                    </div>
                    <div>
                      <Text type="secondary">最近预约</Text>
                      <div>{currentPatient.lastVisit}</div>
                    </div>
                    <div>
                      <Text type="secondary">医院</Text>
                      <div>{currentPatient.hospital}</div>
                    </div>
                    <div>
                      <Text type="secondary">科室</Text>
                      <div>{currentPatient.department}</div>
                    </div>
                  </div>
                </div>

                <div className="doctor-patient-detail-section">
                  <div className="doctor-patient-detail-section-title">聊天记录</div>
                  <div className="doctor-patient-chat-panel">
                    <div className="doctor-patient-chat-list">
                      {currentChat.length === 0 ? (
                        <div className="doctor-patient-chat-empty">
                          暂无聊天记录，您可以先发送一条随访消息。
                        </div>
                      ) : (
                        currentChat.map((message) => (
                          <div
                            key={message.id}
                            className={
                              message.sender === 'doctor'
                                ? 'doctor-patient-chat-item doctor-patient-chat-item-self'
                                : 'doctor-patient-chat-item'
                            }
                          >
                            <div className="doctor-patient-chat-bubble">
                              <div className="doctor-patient-chat-role">
                                {message.sender === 'doctor' ? '王医生' : currentPatient.name}
                              </div>
                              <div>{message.content}</div>
                              <div className="doctor-patient-chat-time">
                                {new Date(message.createdAt).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="doctor-patient-chat-editor">
                      <Input.TextArea
                        rows={4}
                        placeholder="输入要发送给患者的消息，例如复诊提醒、检查说明、用药建议等"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                      />
                      <div className="doctor-patient-chat-actions">
                        <Button type="primary" onClick={handleSendMessage}>
                          发送消息
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DoctorPatientManagePage
