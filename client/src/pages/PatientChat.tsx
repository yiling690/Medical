import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Empty, Flex, Input, Row, Tag, Typography } from 'antd'
import request from '../api/request'
import './patient-chat.less'

const { Title, Text } = Typography

interface ChatConversation {
  id: number
  doctorName: string
  hospital: string
  department: string
  appointmentDate: string
  appointmentTime: string
  unreadCount: number
}

interface ChatMessage {
  id: number
  sender: 'doctor' | 'patient'
  senderName: string
  content: string
  createdAt: number
}

function renderStatusTag(unreadCount: number) {
  if (unreadCount > 0) {
    return <Tag color="orange">有未读</Tag>
  }

  return <Tag color="green">已读</Tag>
}

function PatientChatPage(): React.ReactElement {
  const [keyword, setKeyword] = useState('')
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')

  const loadChats = useCallback(async () => {
    try {
      const res = await request.get<{ chats: ChatConversation[] }>('/chats')
      const nextChats = Array.isArray(res.data?.chats) ? res.data.chats : []
      setConversations(nextChats)
      setSelectedConversationId((prev) => {
        if (prev && nextChats.some((item) => item.id === prev)) {
          return prev
        }
        return nextChats[0]?.id ?? null
      })
    } catch {
      setConversations([])
      setSelectedConversationId(null)
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
    if (!selectedConversationId) {
      setMessages([])
      return
    }

    loadMessages(selectedConversationId)
    const timer = window.setInterval(() => loadMessages(selectedConversationId), 5000)
    return () => {
      window.clearInterval(timer)
    }
  }, [loadMessages, selectedConversationId])

  const filteredConversations = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    return conversations.filter((item) => {
      if (!normalized) {
        return true
      }

      return (
        item.doctorName.toLowerCase().includes(normalized) ||
        item.hospital.toLowerCase().includes(normalized) ||
        item.department.toLowerCase().includes(normalized)
      )
    })
  }, [conversations, keyword])

  const currentConversation =
    filteredConversations.find((item) => item.id === selectedConversationId) ||
    conversations.find((item) => item.id === selectedConversationId) ||
    null

  const handleSend = async () => {
    if (!selectedConversationId) {
      return
    }

    const content = draft.trim()
    if (!content) {
      return
    }

    try {
      await request.post(`/chats/${selectedConversationId}/messages`, { content })
      setDraft('')
      await loadMessages(selectedConversationId)
      await loadChats()
    } catch {
      // Keep current draft on send failure.
    }
  }

  return (
    <div className="patient-chat-page">
      <Title level={3} className="patient-chat-title">
        在线沟通
      </Title>

      <Row gutter={16}>
        <Col span={7}>
          <Card className="patient-chat-list-card" variant="outlined">
            <div className="patient-chat-list-header">
              <div className="patient-chat-list-title">我的会话</div>
              <Input.Search
                placeholder="搜索医生、医院或科室..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            {filteredConversations.length === 0 ? (
              <Empty description="暂无聊天会话，请先完成预约并等待医生确认" />
            ) : (
              <Flex vertical className="patient-chat-list-container">
                {filteredConversations.map((item) => (
                  <div
                    key={item.id}
                    className={
                      item.id === selectedConversationId
                        ? 'patient-chat-list-item patient-chat-list-item-active'
                        : 'patient-chat-list-item'
                    }
                    onClick={() => setSelectedConversationId(item.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <div className="patient-chat-list-item-main">
                      <div className="patient-chat-list-name">{item.doctorName}</div>
                      <div className="patient-chat-list-id">{item.hospital}</div>
                      <div className="patient-chat-list-meta">
                        {item.department} · {item.appointmentDate} {item.appointmentTime}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {item.unreadCount > 0 && (
                        <Badge count={item.unreadCount} size="small" style={{ marginBottom: 8 }} />
                      )}
                      <div>{renderStatusTag(item.unreadCount)}</div>
                    </div>
                  </div>
                ))}
              </Flex>
            )}
          </Card>
        </Col>

        <Col span={17}>
          <Card className="patient-chat-detail-card" variant="outlined">
            <div className="patient-chat-detail-header">
              <Title level={4} style={{ marginBottom: 4 }}>
                沟通窗口{currentConversation ? ` - ${currentConversation.doctorName}` : ''}
              </Title>
              <Text type="secondary">与医生在线沟通复诊安排、检查结果和健康建议。</Text>
            </div>

            {!currentConversation ? (
              <Empty description="请选择一个聊天会话" />
            ) : (
              <>
                <div className="patient-chat-detail-section">
                  <div className="patient-chat-detail-section-title">会话信息</div>
                  <div className="patient-chat-detail-grid">
                    <div>
                      <Text type="secondary">医生</Text>
                      <div>{currentConversation.doctorName}</div>
                    </div>
                    <div>
                      <Text type="secondary">医院</Text>
                      <div>{currentConversation.hospital}</div>
                    </div>
                    <div>
                      <Text type="secondary">科室</Text>
                      <div>{currentConversation.department}</div>
                    </div>
                    <div>
                      <Text type="secondary">预约时间</Text>
                      <div>
                        {currentConversation.appointmentDate} {currentConversation.appointmentTime}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="patient-chat-detail-section">
                  <div className="patient-chat-detail-section-title">聊天记录</div>
                  <div className="patient-chat-panel">
                    <div className="patient-chat-list-body">
                      {messages.length === 0 ? (
                        <div className="patient-chat-empty">
                          医生确认预约后会自动创建会话，您现在可以先发送第一条消息。
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={
                              message.sender === 'patient'
                                ? 'patient-chat-item patient-chat-item-self'
                                : 'patient-chat-item'
                            }
                          >
                            <div className="patient-chat-bubble">
                              <div className="patient-chat-role">{message.senderName}</div>
                              <div>{message.content}</div>
                              <div className="patient-chat-time">
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

                    <div className="patient-chat-editor">
                      <Input.TextArea
                        rows={4}
                        placeholder="输入您想咨询医生的问题，例如复诊时间、检查结果、用药情况等"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                      />
                      <div className="patient-chat-actions">
                        <Button type="primary" onClick={handleSend}>
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

export default PatientChatPage
