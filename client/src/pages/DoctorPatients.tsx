import { Button, Card, Input, Table, Tag, Typography } from 'antd'
import './doctor-patients.less'

const { Title, Text } = Typography

interface DoctorPatientRow {
  key: string
  name: string
  phone: string
  lastVisit: string
  diagnosis: string
}

const dataSource: DoctorPatientRow[] = [
  {
    key: '1',
    name: '张三 (P001)',
    phone: '138-0013-8001',
    lastVisit: '2023-10-26',
    diagnosis: '高血压',
  },
  {
    key: '2',
    name: '李四 (P002)',
    phone: '139-1234-5678',
    lastVisit: '2023-10-20',
    diagnosis: '糖尿病',
  },
  {
    key: '3',
    name: '王五 (P003)',
    phone: '137-8765-4321',
    lastVisit: '2023-10-15',
    diagnosis: '慢性胃炎',
  },
  {
    key: '4',
    name: '赵六 (P004)',
    phone: '136-5555-6666',
    lastVisit: '2023-10-10',
    diagnosis: '支气管炎',
  },
  {
    key: '5',
    name: '钱七 (P005)',
    phone: '135-1111-2222',
    lastVisit: '2023-10-05',
    diagnosis: '过敏性鼻炎',
  },
]

function DoctorPatientsPage(): React.ReactElement {
  return (
    <div className="doctor-patients-page">
      <div className="doctor-patients-header">
        <Title level={3} style={{ marginBottom: 4 }}>
          我的患者
        </Title>
        <Text type="secondary">
          查看和管理您负责的患者信息。
        </Text>
      </div>

      <Card bordered={false} className="doctor-patients-card">
        <div className="doctor-patients-filters">
          <Input.Search
            placeholder="搜索患者姓名、ID 或联系方式..."
            style={{ maxWidth: 360 }}
          />
        </div>

        <div className="doctor-patients-tabs">
          <Button type="primary">所有患者</Button>
          <Button>近期就诊</Button>
          <Button>我的专科</Button>
        </div>

        <Table
          dataSource={dataSource}
          pagination={false}
          columns={[
            { title: '患者姓名', dataIndex: 'name', key: 'name' },
            { title: '联系电话', dataIndex: 'phone', key: 'phone' },
            { title: '最新就诊日期', dataIndex: 'lastVisit', key: 'lastVisit' },
            {
              title: '主要诊断',
              dataIndex: 'diagnosis',
              key: 'diagnosis',
              render: (text) => <Tag>{text}</Tag>,
            },
            {
              title: '操作',
              key: 'action',
              render: () => <Button type="link">查看病历</Button>,
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default DoctorPatientsPage

