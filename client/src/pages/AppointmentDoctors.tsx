import { useState } from 'react'
import { Button, Card, Col, Flex, Input, Row, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import './appointment-doctors.less'

const { Title, Text } = Typography

interface DepartmentItem {
  key: string
  label: string
}

interface DoctorItem {
  id: number
  name: string
  title: string
  department: string
  hospital: string
  description: string
}

const departments: DepartmentItem[] = [
  { key: 'all', label: '全科' },
  { key: 'pediatrics', label: '儿科' },
  { key: 'internal', label: '内科' },
  { key: 'surgery', label: '外科' },
  { key: 'ophthalmology', label: '眼科' },
  { key: 'dermatology', label: '皮肤科' },
  { key: 'orthopedics', label: '骨科' },
  { key: 'obgyn', label: '妇产科' },
  { key: 'ent', label: '耳鼻喉科' },
]

const doctors: DoctorItem[] = [
  {
    id: 1,
    name: '王医生',
    title: '主任医师',
    department: '全科',
    hospital: '健康桥综合医院',
    description:
      '擅长慢性病管理及综合诊疗，对高血压、糖尿病等常见病有丰富经验，注重长期随访与健康教育。',
  },
  {
    id: 2,
    name: '李医生',
    title: '副主任医师',
    department: '儿科',
    hospital: '健康桥综合医院',
    description:
      '儿科专业医生，擅长儿童常见疾病诊治及生长发育评估，注重与家长沟通和儿童心理疏导。',
  },
  {
    id: 3,
    name: '张医生',
    title: '主治医师',
    department: '内科',
    hospital: '健康桥综合医院',
    description:
      '重点关注消化系统疾病诊疗，对胃炎、胃溃疡等疾病有丰富临床经验，善于制定个体化治疗方案。',
  },
  {
    id: 4,
    name: '赵医生',
    title: '主治医师',
    department: '外科',
    hospital: '市中心医院',
    description:
      '普外科医生，擅长常见外科手术及围手术期管理，注重微创治疗与术后康复指导。',
  },
  {
    id: 5,
    name: '刘医生',
    title: '主治医师',
    department: '皮肤科',
    hospital: '市中心医院',
    description:
      '专注皮肤疾病诊治，对过敏性皮肤病及痤疮治疗有丰富经验，擅长皮肤护理与个性化治疗。',
  },
  {
    id: 6,
    name: '陈医生',
    title: '副主任医师',
    department: '骨科',
    hospital: '光明骨科医院',
    description:
      '擅长各类骨关节疾病的诊疗与康复指导，注重运动损伤预防与术后功能锻炼。',
  },
]

function AppointmentDoctorsPage(): React.ReactElement {
  const [activeDept, setActiveDept] = useState<string>('all')
  const navigate = useNavigate()

  const filteredDoctors =
    activeDept === 'all'
      ? doctors
      : doctors.filter((d) => d.department === departments.find((dep) => dep.key === activeDept)?.label)

  return (
    <div className="appointment-doctors-page">
      <div className="appointment-doctors-header">
        <Title level={3} style={{ marginBottom: 4 }}>
          预约流程 — 选择科室与医生
        </Title>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card className="appointment-dept-card" bordered>
            <div className="appointment-dept-title">选择科室</div>
            <Flex vertical className="appointment-dept-list">
              {departments.map((item) => (
                <div
                  key={item.key}
                  className={
                    item.key === activeDept
                      ? 'appointment-dept-item appointment-dept-item-active'
                      : 'appointment-dept-item'
                  }
                  onClick={() => setActiveDept(item.key)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  {item.label}
                </div>
              ))}
            </Flex>
          </Card>
        </Col>
        <Col span={18}>
          <Card className="appointment-doctor-list-card" bordered>
            <div className="appointment-doctor-list-header">
              <div>
                <div className="appointment-doctor-list-title">
                  选择医生（
                  {activeDept === 'all'
                    ? '全科'
                    : departments.find((d) => d.key === activeDept)?.label}
                  ）
                </div>
              </div>
              <Input.Search
                placeholder="搜索医生..."
                style={{ width: 260 }}
              />
            </div>

            <Row gutter={[16, 16]}>
              {filteredDoctors.map((doctor) => (
                <Col key={doctor.id} xs={24} sm={12} md={8}>
                  <Card
                    className="appointment-doctor-card"
                    bordered
                    actions={[
                      <Button
                        type="primary"
                        key="schedule"
                        onClick={() =>
                          navigate('/appointment/schedule', {
                            state: { doctor },
                          })
                        }
                      >
                        查看日程
                      </Button>,
                    ]}
                  >
                    <div className="appointment-doctor-avatar" />
                    <div className="appointment-doctor-name">
                      {doctor.name}
                    </div>
                    <div className="appointment-doctor-title">
                      {doctor.title}
                    </div>
                    <div className="appointment-doctor-meta">
                      {doctor.hospital} · {doctor.department}
                    </div>
                    <Text type="secondary" className="appointment-doctor-desc">
                      {doctor.description}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AppointmentDoctorsPage
