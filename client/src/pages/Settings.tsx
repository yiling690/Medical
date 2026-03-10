import { Card, Form, Input, Tabs, Button, Typography, Space } from 'antd'
import './settings.less'

const { Title, Text } = Typography

function SettingsPage(): React.ReactElement {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <Title level={3} style={{ marginBottom: 4 }}>
          设置
        </Title>
        <Text type="secondary">
          管理您的个人信息、通知偏好以及隐私设置。
        </Text>
      </div>

      <Card bordered={false} className="settings-card">
        <Tabs
          defaultActiveKey="profile"
          items={[
            {
              key: 'profile',
              label: '个人信息',
              children: (
                <Space direction="vertical" size={24} style={{ width: '100%' }}>
                  <div className="settings-section">
                    <div className="settings-section-title">基本信息</div>
                    <Form layout="vertical" style={{ maxWidth: 560 }}>
                      <Form.Item label="姓名" name="name">
                        <Input placeholder="张三" />
                      </Form.Item>
                      <Form.Item label="电子邮箱" name="email">
                        <Input placeholder="zhangsan@example.com" />
                      </Form.Item>
                      <Form.Item label="电话号码" name="phone">
                        <Input placeholder="+86 138-1234-5678" />
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary">保存更改</Button>
                      </Form.Item>
                    </Form>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-title">地址信息</div>
                    <Form layout="vertical" style={{ maxWidth: 560 }}>
                      <Form.Item label="地址" name="address">
                        <Input placeholder="北京市朝阳区..." />
                      </Form.Item>
                      <Form.Item label="城市" name="city">
                        <Input placeholder="北京市" />
                      </Form.Item>
                      <Form.Item label="邮政编码" name="zip">
                        <Input placeholder="100020" />
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary">保存更改</Button>
                      </Form.Item>
                    </Form>
                  </div>
                </Space>
              ),
            },
            {
              key: 'notification',
              label: '通知设置',
              children: (
                <div className="settings-section">
                  <div className="settings-section-title">通知偏好</div>
                  <Text type="secondary">
                    在此配置预约提醒、就诊变更等通知方式。
                  </Text>
                </div>
              ),
            },
            {
              key: 'privacy',
              label: '隐私设置',
              children: (
                <div className="settings-section">
                  <div className="settings-section-title">隐私与安全</div>
                  <Text type="secondary">
                    管理数据共享与账号安全相关的偏好设置。
                  </Text>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default SettingsPage

