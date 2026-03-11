import { Card, Col, Row, Input, List, Tag, Typography, Table, Button } from 'antd'
import './doctor-patient-manage.less'

const { Title, Text } = Typography

interface PatientItem {
  id: string
  name: string
  lastVisit: string
  status: '随访中' | '未就诊' | '复查中'
}

interface VisitRecord {
  key: string
  date: string
  hospital: string
  doctor: string
  diagnosis: string
}

const patients: PatientItem[] = [
  { id: 'KB-876543', name: '王晓明', lastVisit: '2023-10-26', status: '随访中' },
  { id: 'KB-987654', name: '李芳', lastVisit: '2023-09-15', status: '随访中' },
  { id: 'KB-123456', name: '张伟', lastVisit: '2023-11-01', status: '随访中' },
  { id: 'KB-234567', name: '陈春梅', lastVisit: '2023-08-01', status: '复查中' },
  { id: 'KB-345678', name: '刘洋', lastVisit: '2023-10-05', status: '随访中' },
  { id: 'KB-456789', name: '赵婷', lastVisit: '2023-09-01', status: '未就诊' },
]

const visitRecords: VisitRecord[] = [
  {
    key: '1',
    date: '2023-10-26',
    hospital: '上海第一人民医院',
    doctor: '李医生',
    diagnosis: '高血压',
  },
  {
    key: '2',
    date: '2023-05-10',
    hospital: '上海市中医院',
    doctor: '张医生',
    diagnosis: '过敏性哮喘',
  },
]

function renderStatusTag(status: PatientItem['status']) {
  if (status === '随访中') {
    return <Tag color="green">随访中</Tag>
  }
  if (status === '复查中') {
    return <Tag color="orange">复查中</Tag>
  }
  return <Tag>未就诊</Tag>
}

function DoctorPatientManagePage(): React.ReactElement {
  const currentPatient = patients[0]

  return (
    <div className="doctor-patient-manage-page">
      <Title level={3} className="doctor-patient-manage-title">
        患者管理
      </Title>

      <Row gutter={16}>
        <Col span={6}>
          <Card className="doctor-patient-list-card" bordered>
            <div className="doctor-patient-list-header">
              <div className="doctor-patient-list-title">患者列表</div>
              <Input.Search placeholder="搜索患者姓名或ID..." />
            </div>
            <List
              dataSource={patients}
              renderItem={(item) => (
                <List.Item className="doctor-patient-list-item">
                  <div className="doctor-patient-list-item-main">
                    <div className="doctor-patient-list-name">{item.name}</div>
                    <div className="doctor-patient-list-id">ID: {item.id}</div>
                    <div className="doctor-patient-list-meta">
                      最新就诊: {item.lastVisit}
                    </div>
                  </div>
                  <div>{renderStatusTag(item.status)}</div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={18}>
          <Card className="doctor-patient-detail-card" bordered>
            <div className="doctor-patient-detail-header">
              <Title level={4} style={{ marginBottom: 4 }}>
                患者档案 - {currentPatient.name}
              </Title>
              <Text type="secondary">
                在此查看患者的详细信息和所有历史就诊记录。
              </Text>
            </div>

            <div className="doctor-patient-detail-section">
              <div className="doctor-patient-detail-section-title">基本信息</div>
              <div className="doctor-patient-detail-grid">
                <div>
                  <Text type="secondary">姓名</Text>
                  <div>{currentPatient.name}</div>
                </div>
                <div>
                  <Text type="secondary">患者ID</Text>
                  <div>{currentPatient.id}</div>
                </div>
                <div>
                  <Text type="secondary">性别</Text>
                  <div>男</div>
                </div>
                <div>
                  <Text type="secondary">出生日期</Text>
                  <div>1985-03-12</div>
                </div>
                <div>
                  <Text type="secondary">联系电话</Text>
                  <div>13812345678</div>
                </div>
                <div>
                  <Text type="secondary">地址</Text>
                  <div>上海市浦东新区张江路 101 号</div>
                </div>
                <div>
                  <Text type="secondary">首诊日期</Text>
                  <div>2023-10-26</div>
                </div>
                <div>
                  <Text type="secondary">状态</Text>
                  <div>随访中</div>
                </div>
              </div>
            </div>

            <div className="doctor-patient-detail-section">
              <div className="doctor-patient-detail-section-title">
                历史就诊记录
              </div>
              <Table
                dataSource={visitRecords}
                pagination={false}
                columns={[
                  { title: '就诊日期', dataIndex: 'date', key: 'date' },
                  { title: '医院', dataIndex: 'hospital', key: 'hospital' },
                  { title: '医生', dataIndex: 'doctor', key: 'doctor' },
                  { title: '诊断', dataIndex: 'diagnosis', key: 'diagnosis' },
                  {
                    title: '操作',
                    key: 'action',
                    render: () => <Button type="link">查看详情</Button>,
                  },
                ]}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DoctorPatientManagePage

