import { useEffect, useState } from 'react'
import { Card, Col, Empty, Row, Skeleton, Statistic, Table, Typography, message, Progress } from 'antd'
import request from '../api/request'
import useAuthStore from '../store/auth'
import './stats.less'

const { Title, Text } = Typography

interface Summary {
  patientCount: number
  recordCount: number
  visitDays: number
  recentRecordCount: number
}

interface DiseaseRow {
  key: string
  name: string
  count: number
}

interface VisitRow {
  key: string
  date: string
  count: number
}

interface DepartmentRow {
  key: string
  name: string
  count: number
}

interface StatsResponse {
  summary: Summary
  diseases: { name: string; count: number }[]
  visitsByDate: { date: string; count: number }[]
  departments: { name: string; count: number }[]
}

function StatsPage(): React.ReactElement {
  const user = useAuthStore((state) => state.user)
  const [summary, setSummary] = useState<Summary>({
    patientCount: 0,
    recordCount: 0,
    visitDays: 0,
    recentRecordCount: 0,
  })
  const [loading, setLoading] = useState(false)
  const [diseases, setDiseases] = useState<DiseaseRow[]>([])
  const [visits, setVisits] = useState<VisitRow[]>([])
  const [departments, setDepartments] = useState<DepartmentRow[]>([])
  const totalDiseaseCount = diseases.reduce((sum, item) => sum + item.count, 0)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const res = await request.get<StatsResponse>('/stats/overview')
        setSummary(res.data.summary)
        setDiseases(
          res.data.diseases.map((d, index) => ({
            key: `${index}`,
            name: d.name,
            count: d.count,
          })),
        )
        setVisits(
          res.data.visitsByDate.map((v, index) => ({
            key: `${index}`,
            date: v.date,
            count: v.count,
          })),
        )
        setDepartments(
          (res.data.departments || []).map((d, index) => ({
            key: `${index}`,
            name: d.name,
            count: d.count,
          })),
        )
      } catch (error: any) {
        const msg =
          error.response?.data?.message ||
          error.message ||
          '获取统计数据失败'
        message.error(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="stats-page">
      <div className="stats-header">
        <Title level={3} className="stats-title">
          数据统计
        </Title>
        <Text type="secondary">
          {user?.role === 'doctor'
            ? '显示当前医生相关的患者与病历统计。'
            : user?.role === 'patient'
            ? '显示当前患者个人的病历统计。'
            : '显示系统整体患者与病历统计。'}
        </Text>
      </div>
      <Row gutter={16} className="stats-summary-row">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="患者总数" value={summary.patientCount} loading={loading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="病历总数" value={summary.recordCount} loading={loading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="近30天就诊数" value={summary.recentRecordCount} loading={loading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="活跃就诊天数" value={summary.visitDays} loading={loading} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="疾病分布">
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : diseases.length === 0 ? (
              <Empty description="暂无疾病统计数据" />
            ) : (
              <Table
                size="small"
                pagination={false}
                dataSource={diseases}
                columns={[
                  { title: '疾病名称', dataIndex: 'name', key: 'name' },
                  { title: '数量', dataIndex: 'count', key: 'count' },
                ]}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="按日期就诊数量">
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : visits.length === 0 ? (
              <Empty description="暂无就诊统计数据" />
            ) : (
              <Table
                size="small"
                pagination={false}
                dataSource={visits}
                columns={[
                  { title: '日期', dataIndex: 'date', key: 'date' },
                  { title: '就诊数量', dataIndex: 'count', key: 'count' },
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="疾病类型分布">
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : diseases.length === 0 ? (
              <Text type="secondary">暂无疾病统计数据</Text>
            ) : (
              diseases.map((item) => {
                const percent =
                  totalDiseaseCount > 0
                    ? Math.round((item.count / totalDiseaseCount) * 100)
                    : 0
                return (
                  <div key={item.key} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span>{item.name}</span>
                      <span>
                        {item.count} 人（{percent}%）
                      </span>
                    </div>
                    <Progress percent={percent} showInfo={false} />
                  </div>
                )
              })
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="科室分布">
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : departments.length === 0 ? (
              <Empty description="暂无科室统计数据" />
            ) : (
              <Table
                size="small"
                pagination={false}
                dataSource={departments}
                columns={[
                  { title: '科室', dataIndex: 'name', key: 'name' },
                  { title: '病历数', dataIndex: 'count', key: 'count' },
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default StatsPage
