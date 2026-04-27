import { Button, Card, Col, Row, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/auth'
import './home.less'

const { Title, Text } = Typography

function HomePage(): React.ReactElement {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="home-page">
      <Card className="home-main-card" variant="borderless">
        <div className="home-main-content">
          <div className="home-avatar-large" />
          <div className="home-main-text">
            <div className="home-main-name">{user?.name || '患者'}</div>
            <Text type="secondary">
              欢迎回来，管理您的健康信息和预约。
            </Text>
          </div>
        </div>

        <div className="home-quick-actions">
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card
                className="home-quick-card"
                hoverable
                onClick={() => navigate('/patient')}
              >
                <div className="home-quick-title">我的病历</div>
                <Text type="secondary">查看和管理历史就诊记录。</Text>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                className="home-quick-card"
                hoverable
                onClick={() => navigate('/appointment/records')}
              >
                <div className="home-quick-title">预约记录</div>
                <Text type="secondary">查看历史预约及支付记录。</Text>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                className="home-quick-card"
                hoverable
                onClick={() => navigate('/appointment')}
              >
                <div className="home-quick-title">预约医生</div>
                <Text type="secondary">选择合适的医院、科室与医生。</Text>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                className="home-quick-card"
                hoverable
                onClick={() => navigate('/settings')}
              >
                <div className="home-quick-title">设置</div>
                <Text type="secondary">管理个人信息和通知偏好。</Text>
              </Card>
            </Col>
          </Row>
        </div>

        <div className="home-logout-wrapper">
          <Button danger type="primary" onClick={handleLogout}>
            退出
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default HomePage
