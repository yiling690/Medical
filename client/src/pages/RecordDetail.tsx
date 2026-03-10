import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Descriptions, Typography, Button, message } from 'antd'
import request from '../api/request'
import './record-detail.less'

const { Title } = Typography

interface RecordDetail {
  id: number
  patientId: string
  patientName: string
  gender: string
  age: number
  phone: string
  hospital: string
  department: string
  doctor: string
  date: string
  diagnosis: string
  treatment: string
  noteDate: string
  note: string
}

interface RecordDetailResponse {
  record: RecordDetail
}

function RecordDetailPage(): React.ReactElement | null {
  const { id } = useParams<{ id: string }>()
  const [record, setRecord] = useState<RecordDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return
      try {
        setLoading(true)
        const res = await request.get<RecordDetailResponse>(
          `/patient/records/${id}`,
        )
        setRecord(res.data.record)
      } catch (error: any) {
        const msg = error.response?.data?.message || '获取病历详情失败'
        message.error(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  if (!record) {
    return null
  }

  return (
    <div className="record-detail-page">
      <div className="record-detail-header">
        <Title level={3} style={{ marginBottom: 0 }}>
          病历详情
        </Title>
        <Button type="primary">预约医生</Button>
      </div>

      <Card loading={loading} bordered={false} className="record-detail-card">
        <Descriptions title="患者信息" column={2} bordered>
          <Descriptions.Item label="姓名">
            {record.patientName}
          </Descriptions.Item>
          <Descriptions.Item label="患者ID">
            {record.patientId}
          </Descriptions.Item>
          <Descriptions.Item label="性别">
            {record.gender}
          </Descriptions.Item>
          <Descriptions.Item label="年龄">
            {record.age}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {record.phone}
          </Descriptions.Item>
        </Descriptions>

        <Descriptions
          title="就诊信息"
          column={2}
          bordered
          style={{ marginTop: 24 }}
        >
          <Descriptions.Item label="就诊医院">
            {record.hospital}
          </Descriptions.Item>
          <Descriptions.Item label="科室">
            {record.department}
          </Descriptions.Item>
          <Descriptions.Item label="主治医生">
            {record.doctor}
          </Descriptions.Item>
          <Descriptions.Item label="就诊日期">
            {record.date}
          </Descriptions.Item>
        </Descriptions>

        <Descriptions
          title="诊断与治疗"
          column={1}
          bordered
          style={{ marginTop: 24 }}
        >
          <Descriptions.Item label="诊断">
            {record.diagnosis}
          </Descriptions.Item>
          <Descriptions.Item label="治疗方案">
            {record.treatment}
          </Descriptions.Item>
        </Descriptions>

        <Descriptions
          title="记录"
          column={1}
          bordered
          style={{ marginTop: 24 }}
        >
          <Descriptions.Item label="记录日期">
            {record.noteDate}
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            {record.note}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default RecordDetailPage

