import { Card, List, Typography, Tag } from 'antd'
import './doctor-dashboard.less'

const { Title, Text } = Typography

interface DoctorPatientItem {
  id: string
  name: string
  hospital: string
  department: string
  latestVisit: string
  status: string
}

const mockPatients: DoctorPatientItem[] = [
  {
    id: 'P-202300123',
    name: '李雷',
    hospital: '健康桥综合医院',
    department: '心血管内科',
    latestVisit: '2023-10-26',
    status: '随访中',
  },
  {
    id: 'P-202300456',
    name: '韩梅梅',
    hospital: '市中心医院',
    department: '内分泌科',
    latestVisit: '2023-07-15',
    status: '待复查',
  },
]

function DoctorDashboardPage(): React.ReactElement {
  return (
    <div className="doctor-dashboard-page">
      <Title level={3}>医生工作台</Title>
      <Text type="secondary">查看您的患者病历概览。</Text>
      <Card className="doctor-dashboard-card" bordered={false}>
        <List
          itemLayout="horizontal"
          dataSource={mockPatients}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      {item.name}（{item.id}）
                    </span>
                    <Tag color="blue">{item.status}</Tag>
                  </div>
                }
                description={
                  <div>
                    <div>
                      {item.hospital} · {item.department}
                    </div>
                    <Text type="secondary">
                      最近就诊时间：{item.latestVisit}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default DoctorDashboardPage

