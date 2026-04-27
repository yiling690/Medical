import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Col, Calendar, Row, Tag, Typography, Input, Modal, message } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import request from '../api/request'
import './doctor-schedule.less'

const { Title, Text } = Typography

interface ScheduleItem {
  id: number
  time: string
  title: string
  patient?: string
  type?: string
  status?: '确认' | '待确认' | '普通'
  remark?: string
}

interface AppointmentItem {
  id: number
  patientName: string
  doctorName: string
  hospital: string
  department: string
  date: string
  time: string
  status: '待确认' | '确认'
}

const baseScheduleItems: ScheduleItem[] = [
  {
    id: 1,
    time: '09:00 - 09:45',
    title: '患者复诊 - 王小明',
    patient: '王小明',
    status: '确认',
    remark: '复查血压，调整用药方案。',
  },
  {
    id: 2,
    time: '10:00 - 11:00',
    title: '新患者初诊 - 李华',
    patient: '李华',
    status: '待确认',
    remark: '详细问诊，初步诊断，制定后续检查计划。',
  },
  {
    id: 3,
    time: '12:00 - 13:00',
    title: '午餐休息',
    status: '普通',
  },
  {
    id: 4,
    time: '14:00 - 14:30',
    title: '线上咨询 - 张丽',
    patient: '张丽',
    status: '确认',
    remark: '复查用药情况，图文咨询。',
  },
  {
    id: 5,
    time: '15:00 - 17:00',
    title: '学术会议',
    status: '普通',
  },
]

function renderStatusTag(status?: ScheduleItem['status']) {
  if (status === '确认') {
    return <Tag color="blue">确认</Tag>
  }
  if (status === '待确认') {
    return <Tag color="orange">待确认</Tag>
  }
  return null
}

function getStartMinutes(time: string): number {
  const startTime = time.split('-')[0]?.trim() || ''
  const [hour, minute] = startTime.split(':').map((item) => Number(item))
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return Number.MAX_SAFE_INTEGER
  }
  return hour * 60 + minute
}

function DoctorSchedulePage(): React.ReactElement {
  const [items, setItems] = useState<ScheduleItem[]>(baseScheduleItems)
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const hasAutoFocusedAppointmentDateRef = useRef(false)
  const [addVisible, setAddVisible] = useState(false)
  const [leaveVisible, setLeaveVisible] = useState(false)
  const [addType, setAddType] = useState('')
  const [addReason, setAddReason] = useState('')
  const [leaveType, setLeaveType] = useState('')
  const [leaveReason, setLeaveReason] = useState('')

  const loadAppointments = useCallback(async () => {
    try {
      const res = await request.get<{ appointments: AppointmentItem[] }>('/appointments')
      const confirmedAppointments = Array.isArray(res.data?.appointments)
        ? res.data.appointments.filter((item) => item.status === '确认')
        : []
      setAppointments(confirmedAppointments)

      if (
        !hasAutoFocusedAppointmentDateRef.current &&
        confirmedAppointments.length > 0 &&
        !confirmedAppointments.some(
          (item) => item.date === selectedDate.format('YYYY-MM-DD'),
        )
      ) {
        setSelectedDate(dayjs(confirmedAppointments[0].date))
        hasAutoFocusedAppointmentDateRef.current = true
      }
    } catch {
      setAppointments([])
    }
  }, [selectedDate])

  useEffect(() => {
    loadAppointments()
    const timer = window.setInterval(loadAppointments, 5000)

    const handleAppointmentConfirmed = (event: Event) => {
      const customEvent = event as CustomEvent<{ appointment?: AppointmentItem }>
      const appointment = customEvent.detail?.appointment
      if (appointment?.date) {
        setSelectedDate(dayjs(appointment.date))
        hasAutoFocusedAppointmentDateRef.current = true
      }
      loadAppointments()
    }

    window.addEventListener('appointment-confirmed', handleAppointmentConfirmed)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('appointment-confirmed', handleAppointmentConfirmed)
    }
  }, [loadAppointments])

  const displayItems = useMemo(() => {
    const dateKey = selectedDate.format('YYYY-MM-DD')
    const appointmentItems: ScheduleItem[] = appointments
      .filter((item) => item.date === dateKey)
      .map((item) => ({
        id: item.id,
        time: item.time,
        title: `预约门诊 - ${item.patientName}`,
        patient: item.patientName,
        status: '确认',
        remark: `${item.hospital} · ${item.department} · 已由医生确认`,
      }))

    return [...items, ...appointmentItems].sort(
      (a, b) => getStartMinutes(a.time) - getStartMinutes(b.time),
    )
  }, [appointments, items, selectedDate])

  const handleAddSchedule = () => {
    setAddVisible(true)
  }

  const handleLeaveApply = () => {
    setLeaveVisible(true)
  }

  const handleAddOk = () => {
    if (!addType || !addReason) {
      message.warning('请填写完整日程类型和原因')
      return
    }
    const newItem: ScheduleItem = {
      id: Date.now(),
      time: selectedDate.format('HH:mm') || '09:00 - 10:00',
      title: `${addType} - ${addReason}`,
      status: '普通',
    }
    setItems((prev) => [...prev, newItem])
    setAddVisible(false)
    setAddType('')
    setAddReason('')
    message.success('已添加新日程')
  }

  const handleAddCancel = () => {
    setAddVisible(false)
  }

  const handleLeaveOk = () => {
    if (!leaveType || !leaveReason) {
      message.warning('请填写完整请假类型和原因')
      return
    }
    setLeaveVisible(false)
    setLeaveType('')
    setLeaveReason('')
    message.success('已提交请假申请')
  }

  const handleLeaveCancel = () => {
    setLeaveVisible(false)
  }

  return (
    <div className="doctor-schedule-page">
      <Title level={3} className="doctor-schedule-title">
        日程安排 · {selectedDate.format('YYYY年MM月DD日')}
      </Title>

      <Row gutter={24}>
        <Col span={16}>
          <Card className="doctor-schedule-main-card" bordered>
            <div className="doctor-schedule-list">
              {displayItems.map((item) => (
                <div key={item.id} className="doctor-schedule-item">
                  <div className="doctor-schedule-item-time">{item.time}</div>
                  <div className="doctor-schedule-item-content">
                    <div className="doctor-schedule-item-header">
                      <div className="doctor-schedule-item-title">
                        {item.title}
                      </div>
                      {renderStatusTag(item.status)}
                    </div>
                    {item.patient && (
                      <div className="doctor-schedule-item-meta">
                        患者：{item.patient}
                      </div>
                    )}
                    {item.remark && (
                      <Text
                        type="secondary"
                        className="doctor-schedule-item-remark"
                      >
                        {item.remark}
                      </Text>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="doctor-schedule-sidebar-card" bordered>
            <div className="doctor-schedule-sidebar-actions">
              <Button type="primary" block onClick={handleAddSchedule}>
                添加新日程
              </Button>
              <Button block onClick={handleLeaveApply}>申请请假</Button>
            </div>
            <div className="doctor-schedule-calendar">
              <Calendar
                fullscreen={false}
                value={selectedDate}
                onSelect={(value) => setSelectedDate(value)}
                onChange={(value) => setSelectedDate(value)}
              />
            </div>
          </Card>
        </Col>
      </Row>
      <Modal
        open={addVisible}
        title="添加新日程"
        onOk={handleAddOk}
        onCancel={handleAddCancel}
        okText="确认"
        cancelText="取消"
      >
        <div style={{ marginBottom: 12 }}>
          <Text>类型</Text>
          <Input
            placeholder="例如：门诊、查房、会议"
            value={addType}
            onChange={(e) => setAddType(e.target.value)}
          />
        </div>
        <div>
          <Text>原因或说明</Text>
          <Input.TextArea
            rows={3}
            placeholder="填写本次日程的具体内容"
            value={addReason}
            onChange={(e) => setAddReason(e.target.value)}
          />
        </div>
      </Modal>
      <Modal
        open={leaveVisible}
        title="申请请假"
        onOk={handleLeaveOk}
        onCancel={handleLeaveCancel}
        okText="提交申请"
        cancelText="取消"
      >
        <div style={{ marginBottom: 12 }}>
          <Text>请假类型</Text>
          <Input
            placeholder="例如：事假、病假"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
          />
        </div>
        <div>
          <Text>请假原因</Text>
          <Input.TextArea
            rows={3}
            placeholder="简要说明请假原因"
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}

export default DoctorSchedulePage
