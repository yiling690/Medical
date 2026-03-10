import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Typography,
  Pagination,
  message,
} from 'antd'
import request from '../api/request'
import './patient-records.less'

const { Title, Text } = Typography

interface PatientRecord {
  id: number
  hospital: string
  date: string
  summary: string
}

interface RecordsResponse {
  records: PatientRecord[]
}

function PatientRecordsPage(): React.ReactElement {
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 6
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await request.get<RecordsResponse>('/patient/records')
        setRecords(res.data.records || [])
      } catch (error: any) {
        const msg = error.response?.data?.message || '获取病历列表失败'
        message.error(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleViewDetail = (id: number) => {
    navigate(`/records/${id}`)
  }

  const pagedRecords = records.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="patient-records-page">
      <div className="patient-records-header">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            我的病历
          </Title>
          <Text type="secondary">查看和管理您的就诊记录。</Text>
        </div>
      </div>

      <Card
        className="patient-records-filters"
        bodyStyle={{ paddingBottom: 8 }}
        bordered={false}
      >
        <Space
          style={{ width: '100%', justifyContent: 'space-between' }}
          wrap
        >
          <Input.Search
            placeholder="搜索病历或医院"
            style={{ maxWidth: 260 }}
          />
          <Space wrap>
            <Select
              placeholder="所有年份"
              style={{ width: 120 }}
              options={[
                { label: '所有年份', value: 'all' },
                { label: '2025年', value: '2025' },
                { label: '2024年', value: '2024' },
              ]}
              defaultValue="all"
            />
            <Select
              placeholder="所有月份"
              style={{ width: 120 }}
              options={[
                { label: '所有月份', value: 'all' },
                { label: '1月', value: '1' },
                { label: '2月', value: '2' },
              ]}
              defaultValue="all"
            />
            <Button type="primary">新建病历</Button>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {pagedRecords.map((record) => (
          <Col key={record.id} xs={24} sm={12} md={8}>
            <Card
              loading={loading}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{record.hospital}</span>
                  <Text type="secondary">{record.date}</Text>
                </div>
              }
              bordered={false}
              actions={[
                <Button
                  type="link"
                  key="detail"
                  onClick={() => handleViewDetail(record.id)}
                >
                  查看详情
                </Button>,
                <Button type="link" key="book">
                  预约医生
                </Button>,
              ]}
            >
              <Text type="secondary" style={{ minHeight: 60, display: 'block' }}>
                {record.summary}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      {records.length > pageSize && (
        <div className="patient-records-pagination">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={records.length}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  )
}

export default PatientRecordsPage

