import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Steps,
  Tag,
  Typography,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import './appointment.less'

const { Title, Text } = Typography

interface HospitalItem {
  id: number
  name: string
  specialties: string
  address: string
  status: string
  rating: string
}

const hospitals: HospitalItem[] = [
  {
    id: 1,
    name: '健康桥综合医院',
    specialties: '内科、外科、儿科、妇产科',
    address: '北京市朝阳区健康路 100 号',
    status: '预约中',
    rating: '4.8',
  },
  {
    id: 2,
    name: '生命之光儿童医院',
    specialties: '儿科、儿童心理',
    address: '上海市浦东新区光明路 25 号',
    status: '可预约',
    rating: '4.9',
  },
  {
    id: 3,
    name: '仁爱妇产医院',
    specialties: '妇产科、产后康复',
    address: '广州市天河区幸福大道 8 号',
    status: '预约中',
    rating: '4.7',
  },
  {
    id: 4,
    name: '康卓中心',
    specialties: '康复医学、物理治疗',
    address: '深圳市南山区健康大道 30 号',
    status: '可预约',
    rating: '4.6',
  },
  {
    id: 5,
    name: '光明眼科医院',
    specialties: '眼科、视光学',
    address: '成都市高新区光明大道 80 号',
    status: '可预约',
    rating: '4.9',
  },
  {
    id: 6,
    name: '华山肿瘤医院',
    specialties: '肿瘤科、放疗科',
    address: '武汉市武昌区山湖路 18 号',
    status: '预约中',
    rating: '4.7',
  },
]

function AppointmentPage(): React.ReactElement {
  const navigate = useNavigate()
  return (
    <div className="appointment-page">
      <div className="appointment-header">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            选择医院
          </Title>
          <Text type="secondary">
            请选择您希望就诊的医院，以便我们为您推荐合适的科室和医生。
          </Text>
        </div>
      </div>

      <Card className="appointment-steps" bordered={false}>
        <Steps
          current={0}
          items={[
            { title: '选择医院' },
            { title: '选择科室与医生' },
            { title: '确认预约' },
          ]}
        />
      </Card>

      <Card className="appointment-filters" bordered={false}>
        <Space style={{ width: '100%' }} wrap>
          <Input.Search
            placeholder="搜索医院名称、专科等..."
            style={{ maxWidth: 320 }}
          />
          <Space wrap>
            <Select
              defaultValue="all"
              style={{ width: 140 }}
              options={[
                { value: 'all', label: '所有医院' },
                { value: 'general', label: '综合医院' },
                { value: 'children', label: '儿童医院' },
              ]}
            />
            <Select
              defaultValue="all"
              style={{ width: 140 }}
              options={[
                { value: 'all', label: '所有科室' },
                { value: 'internal', label: '内科' },
                { value: 'surgery', label: '外科' },
                { value: 'ob', label: '妇产科' },
              ]}
            />
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {hospitals.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8}>
            <Card
              className="appointment-hospital-card"
              bordered={false}
              title={
                <div className="appointment-hospital-card-header">
                  <span>{item.name}</span>
                  <Tag color="green">评分 {item.rating}</Tag>
                </div>
              }
              actions={[
                <Button
                  type="primary"
                  key="select"
                  onClick={() => navigate('/appointment/doctors')}
                >
                  选择并预约
                </Button>,
              ]}
            >
              <div className="appointment-hospital-meta">
                <div>
                  <Text type="secondary">专科：</Text>
                  <Text>{item.specialties}</Text>
                </div>
                <div>
                  <Text type="secondary">地址：</Text>
                  <Text>{item.address}</Text>
                </div>
                <div>
                  <Text type="secondary">状态：</Text>
                  <Text>{item.status}</Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default AppointmentPage
