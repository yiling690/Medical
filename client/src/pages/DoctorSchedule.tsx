import { useState } from 'react'
import { Button, Card, Col, DatePicker, Row, Typography } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import './doctor-schedule.less'

const { Title, Text } = Typography

const timeSlots = [
  '09:00 - 09:30',
  '09:30 - 10:00',
  '10:30 - 11:00',
  '14:00 - 14:30',
  '15:00 - 15:30',
  '15:30 - 16:00',
]

function DoctorSchedulePage(): React.ReactElement {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs('2025-12-19'))
  const [activeSlot, setActiveSlot] = useState<string | null>(null)

  return (
    <div className="doctor-schedule-page">
      <Title level={3} className="doctor-schedule-title">
        医生日程查看
      </Title>

      <Row gutter={24}>
        <Col span={6}>
          <Card className="doctor-schedule-card" bordered>
            <div className="doctor-schedule-profile">
              <div className="doctor-schedule-avatar" />
              <div className="doctor-schedule-name">李医生</div>
              <div className="doctor-schedule-meta">内科主任医师</div>
              <div className="doctor-schedule-meta">综合内科</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="doctor-schedule-card" bordered>
            <div className="doctor-schedule-section-title">选择日期</div>
            <DatePicker
              value={selectedDate}
              onChange={(value) => {
                if (value) setSelectedDate(value)
              }}
              allowClear={false}
              style={{ width: '100%' }}
              cellRender={(date) => {
                const isSelected = dayjs(date).isSame(selectedDate, 'day')
                return (
                  <div
                    className={
                      isSelected
                        ? 'doctor-schedule-date-cell doctor-schedule-date-cell-active'
                        : 'doctor-schedule-date-cell'
                    }
                  >
{dayjs(date).date()}
                  </div>
                )
              }}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card className="doctor-schedule-card" bordered>
            <div className="doctor-schedule-section-title">
              {selectedDate.format('YYYY年MM月DD日')} 可用时间段
            </div>
            <div className="doctor-schedule-slots">
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  type={activeSlot === slot ? 'primary' : 'default'}
                  ghost={activeSlot === slot}
                  onClick={() => setActiveSlot(slot)}
                >
                  {slot}
                </Button>
              ))}
            </div>
            <div className="doctor-schedule-footer">
              <Text type="secondary">
                请选择一个合适的时间段，然后点击右下角按钮确认预约。
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <div className="doctor-schedule-confirm">
        <Button type="primary" size="large" disabled={!activeSlot}>
          确认预约
        </Button>
      </div>
    </div>
  )
}

export default DoctorSchedulePage

