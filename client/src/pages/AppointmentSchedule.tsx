import { useState } from 'react'
import {
  Button,
  Card,
  Col,
  Calendar,
  Row,
  Tag,
  Typography,
  Modal,
  message,
} from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { useLocation, useNavigate } from 'react-router-dom'
import request from '../api/request'
import './doctor-schedule.less'

const { Title, Text } = Typography

interface SelectedDoctor {
  name: string
  title: string
  department: string
  hospital: string
}

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

const timeSlots: string[] = [
  '09:00 - 09:30',
  '09:30 - 10:00',
  '10:00 - 10:30',
  '10:30 - 11:00',
  '14:00 - 14:30',
  '14:30 - 15:00',
  '15:00 - 15:30',
]

const specialLeaveDates: string[] = ['2025-12-22']

function isLeaveDate(date: Dayjs): boolean {
  const key = date.format('YYYY-MM-DD')
  return specialLeaveDates.includes(key)
}

function isWorkDate(date: Dayjs): boolean {
  if (isLeaveDate(date)) {
    return false
  }
  const day = date.day()
  return day !== 0
}

function AppointmentSchedulePage(): React.ReactElement {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [payVisible, setPayVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const state = location.state as { doctor?: SelectedDoctor } | undefined

  const doctor: SelectedDoctor =
    state?.doctor || {
      name: '王医生',
      title: '主任医师',
      department: '内科',
      hospital: '健康桥综合医院',
    }

  const work = isWorkDate(selectedDate)
  const leave = isLeaveDate(selectedDate)

  const handleSelectDate = (value: Dayjs) => {
    setSelectedDate(value)
    setSelectedSlot(null)
  }

  const handleOpenPay = () => {
    if (!work) {
      message.warning('当前日期医生未出诊或已请假，无法预约')
      return
    }
    if (!selectedSlot) {
      message.warning('请选择一个时间段')
      return
    }
    setPayVisible(true)
  }

  const handlePayOk = async () => {
    if (!selectedSlot) {
      setPayVisible(false)
      return
    }

    try {
      setSubmitting(true)
      await request.post<{ message: string; appointment: AppointmentRecord }>('/appointments', {
        doctorName: doctor.name,
        hospital: doctor.hospital,
        department: doctor.department,
        date: selectedDate.format('YYYY-MM-DD'),
        time: selectedSlot,
      })
      setPayVisible(false)
      message.success('预约成功，已完成支付')
      navigate('/appointment/records')
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        '预约失败，请稍后重试'
      message.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayCancel = () => {
    setPayVisible(false)
  }

  const renderDateTag = (date: Dayjs) => {
    if (isLeaveDate(date)) {
      return <Tag color="red">请假</Tag>
    }
    if (isWorkDate(date)) {
      return <Tag color="green">上班</Tag>
    }
    return null
  }

  return (
    <div className="doctor-schedule-page">
      <Title level={3} className="doctor-schedule-title">
        选择就诊时间 · {selectedDate.format('YYYY年MM月DD日')}
      </Title>

      <Row gutter={24}>
        <Col span={16}>
          <Card className="doctor-schedule-main-card" bordered>
            <div className="doctor-schedule-list">
              <div className="doctor-schedule-item">
                <div className="doctor-schedule-item-time">
                  医生信息
                </div>
                <div className="doctor-schedule-item-content">
                  <div className="doctor-schedule-item-header">
                    <div className="doctor-schedule-item-title">
                      {doctor.name} · {doctor.title}
                    </div>
                    <Tag color="blue">{doctor.department}</Tag>
                  </div>
                  <div className="doctor-schedule-item-meta">
                    {doctor.hospital}
                  </div>
                  <Text
                    type="secondary"
                    className="doctor-schedule-item-remark"
                  >
                    患者仅可查看医生出诊时间与请假时间，具体诊疗安排由医院统一协调。
                  </Text>
                </div>
              </div>

              <div className="doctor-schedule-item">
                <div className="doctor-schedule-item-time">
                  当日安排
                </div>
                <div className="doctor-schedule-item-content">
                  <div className="doctor-schedule-item-header">
                    <div className="doctor-schedule-item-title">
                      {work
                        ? '出诊日，可选择以下时间段进行预约'
                        : leave
                        ? '医生已请假，当前日期无法预约'
                        : '非出诊日，当前日期无法预约'}
                    </div>
                    {work && <Tag color="green">出诊</Tag>}
                    {leave && <Tag color="red">请假</Tag>}
                    {!work && !leave && <Tag>休息</Tag>}
                  </div>
                  <Text
                    type="secondary"
                    className="doctor-schedule-item-remark"
                  >
                    出诊时间：上午 09:00 - 11:00，下午 14:00 - 17:00。
                  </Text>
                  {work && (
                    <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot}
                          type={selectedSlot === slot ? 'primary' : 'default'}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="doctor-schedule-item">
                <div className="doctor-schedule-item-time">
                  已选信息
                </div>
                <div className="doctor-schedule-item-content">
                  <div className="doctor-schedule-item-header">
                    <div className="doctor-schedule-item-title">
                      就诊日期：{selectedDate.format('YYYY年MM月DD日')}
                    </div>
                  </div>
                  <div className="doctor-schedule-item-meta">
                    预约时间段：
                    {selectedSlot || '暂未选择'}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Button type="primary" onClick={handleOpenPay}>
                      确认预约并支付
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="doctor-schedule-sidebar-card" bordered>
            <div className="doctor-schedule-calendar">
              <Calendar
                fullscreen={false}
                value={selectedDate}
                onSelect={handleSelectDate}
                onChange={handleSelectDate}
                dateFullCellRender={(date) => (
                  <div style={{ textAlign: 'center' }}>
                    <div>{date.date()}</div>
                    <div>{renderDateTag(date)}</div>
                  </div>
                )}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                绿色为医生出诊日，红色为请假停诊日，其余日期为休息或未排班。
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        open={payVisible}
        title="支付确认"
        onOk={handlePayOk}
        onCancel={handlePayCancel}
        okText="模拟支付成功"
        cancelText="取消"
        confirmLoading={submitting}
      >
        <Text>
          本次预约医生：
          {doctor.name}（{doctor.title}）
        </Text>
        <br />
        <Text>
          就诊时间：
          {selectedDate.format('YYYY年MM月DD日')} {selectedSlot}
        </Text>
        <br />
        <Text type="secondary">
          点击“模拟支付成功”后，将完成本次预约并记录到“预约记录”中。
        </Text>
      </Modal>
    </div>
  )
}

export default AppointmentSchedulePage

