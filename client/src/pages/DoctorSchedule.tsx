import { useState } from 'react'
import { Button, Card, Col, Calendar, Row, Tag, Typography } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import './doctor-schedule.less'

const { Title, Text } = Typography

interface ScheduleItem {
  id: number
  time: string
  title: string
  patient?: string
  type?: string
  status?: '已确认' | '待确认' | '普通'
  remark?: string
}

const scheduleItems: ScheduleItem[] = [
  {
    id: 1,
    time: '09:00 - 09:45',
    title: '患者复诊 - 王小明',
    patient: '王小明',
    status: '已确认',
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
    status: '已确认',
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
  if (status === '已确认') {
    return <Tag color="blue">已确认</Tag>
  }
  if (status === '待确认') {
    return <Tag color="orange">待确认</Tag>
  }
  return null
}

function DoctorSchedulePage(): React.ReactElement {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs('2025-12-19'))

  return (
    <div className="doctor-schedule-page">
      <Title level={3} className="doctor-schedule-title">
        今日日程 · {selectedDate.format('YYYY年MM月DD日')}
      </Title>

      <Row gutter={24}>
        <Col span={16}>
          <Card className="doctor-schedule-main-card" bordered>
            <div className="doctor-schedule-list">
              {scheduleItems.map((item) => (
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
              <Button type="primary" block>
                添加新日程
              </Button>
              <Button block>申请请假</Button>
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
    </div>
  )
}

export default DoctorSchedulePage
