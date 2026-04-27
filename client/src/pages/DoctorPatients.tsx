import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Empty, Form, Input, Modal, Space, Spin, Table, Tag, Typography, message } from 'antd'
import request from '../api/request'
import useAuthStore from '../store/auth'
import './doctor-patients.less'

const { Title, Text } = Typography

interface MedicalRecord {
  id: number
  patientId: string
  patientName: string
  gender?: string | null
  age?: number | null
  phone?: string | null
  hospital: string
  department: string
  doctor: string
  date: string
  summary?: string | null
  diagnosis?: string | null
  treatment?: string | null
  noteDate?: string | null
  note?: string | null
}

interface DoctorPatientRow {
  key: string
  patientId: string
  name: string
  phone: string
  gender: string
  age: string
  lastVisit: string
  diagnosis: string
  latestHospital: string
  latestDepartment: string
  recent: boolean
  mine: boolean
  recordCount: number
  records: MedicalRecord[]
}

interface RecordsResponse {
  records: MedicalRecord[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalRecords: number
  }
}

interface CreateRecordPayload {
  patientId: string
  patientName: string
  gender?: string
  age?: number
  phone?: string
  hospital: string
  department: string
  doctor: string
  date: string
  summary?: string
  diagnosis?: string
  treatment?: string
  noteDate?: string
  note?: string
}

interface CreateRecordResponse {
  message: string
  record: MedicalRecord
}

const isWithinDateRange = (
  value: string,
  startDate: string,
  endDate: string,
): boolean => {
  if (!value) {
    return false
  }

  if (startDate && value < startDate) {
    return false
  }

  if (endDate && value > endDate) {
    return false
  }

  return true
}

function DoctorPatientsPage(): React.ReactElement {
  const user = useAuthStore((state) => state.user)
  const [form] = Form.useForm<CreateRecordPayload>()
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'mine'>('all')
  const [keyword, setKeyword] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [totalPatients, setTotalPatients] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [currentRow, setCurrentRow] = useState<DoctorPatientRow | null>(null)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
  const [detailKeyword, setDetailKeyword] = useState('')
  const [detailStartDate, setDetailStartDate] = useState('')
  const [detailEndDate, setDetailEndDate] = useState('')

  const fetchRecords = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const res = await request.get<RecordsResponse>('/patient/records', {
        params: {
          keyword: keyword.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          scope: activeTab,
          page,
          pageSize,
        },
      })
      const nextRecords = Array.isArray(res.data?.records) ? res.data.records : []
      const pagination = res.data?.pagination
      const nextTotalPatients = pagination?.total ?? nextRecords.length
      const nextTotalRecords = pagination?.totalRecords ?? nextRecords.length
      const lastPage = Math.max(1, Math.ceil(nextTotalPatients / pageSize))

      if (nextTotalPatients > 0 && page > lastPage && nextRecords.length === 0) {
        setPage(lastPage)
        return
      }

      setRecords(nextRecords)
      setTotalPatients(nextTotalPatients)
      setTotalRecords(nextTotalRecords)
    } catch (error: any) {
      if (!silent) {
        const msg = error.response?.data?.message || '获取患者数据失败'
        message.error(msg)
      }
      setRecords([])
      setTotalPatients(0)
      setTotalRecords(0)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [activeTab, endDate, keyword, page, pageSize, startDate])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchRecords()
    }, keyword.trim() ? 300 : 0)

    return () => window.clearTimeout(timer)
  }, [fetchRecords, keyword])

  useEffect(() => {
    const handleAppointmentConfirmed = () => {
      fetchRecords(true)
    }

    window.addEventListener('appointment-confirmed', handleAppointmentConfirmed)
    const timer = window.setInterval(() => {
      fetchRecords(true)
    }, 5000)

    return () => {
      window.removeEventListener('appointment-confirmed', handleAppointmentConfirmed)
      window.clearInterval(timer)
    }
  }, [fetchRecords])

  const patientRows = useMemo(() => {
    if (records.length === 0) {
      return []
    }

    const latestDate = records.reduce((max, record) => {
      const current = new Date(record.date).getTime()
      return Number.isFinite(current) && current > max ? current : max
    }, 0)

    const grouped = new Map<string, DoctorPatientRow>()

    records.forEach((record) => {
      const existing = grouped.get(record.patientId)
      const recordTime = new Date(record.date).getTime()
      const isRecent =
        latestDate > 0 && Number.isFinite(recordTime)
          ? latestDate - recordTime <= 30 * 24 * 60 * 60 * 1000
          : false
      const isMine = !!user?.name && record.doctor === user.name

      if (!existing) {
        grouped.set(record.patientId, {
          key: record.patientId,
          patientId: record.patientId,
          name: record.patientName,
          phone: record.phone || '-',
          gender: record.gender || '-',
          age: record.age ? `${record.age}` : '-',
          lastVisit: record.date,
          diagnosis: record.diagnosis || record.summary || '暂无诊断',
          latestHospital: record.hospital,
          latestDepartment: record.department,
          recent: isRecent,
          mine: isMine,
          recordCount: 1,
          records: [record],
        })
        return
      }

      existing.records.push(record)
      existing.recordCount += 1
      existing.recent = existing.recent || isRecent
      existing.mine = existing.mine || isMine

      const existingTime = new Date(existing.lastVisit).getTime()
      if (!Number.isFinite(existingTime) || recordTime > existingTime) {
        existing.lastVisit = record.date
        existing.diagnosis = record.diagnosis || record.summary || '暂无诊断'
        existing.latestHospital = record.hospital
        existing.latestDepartment = record.department
        existing.phone = record.phone || existing.phone
        existing.gender = record.gender || existing.gender
        existing.age = record.age ? `${record.age}` : existing.age
      }
    })

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        records: [...item.records].sort((a, b) => {
          const diff = new Date(b.date).getTime() - new Date(a.date).getTime()
          return diff !== 0 ? diff : b.id - a.id
        }),
      }))
      .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
  }, [records, user?.name])

  const filteredData = patientRows

  const detailRecords = useMemo(() => {
    if (!currentRow) {
      return []
    }

    const normalizedKeyword = detailKeyword.trim().toLowerCase()

    return currentRow.records.filter((record) => {
      const matchesDate = isWithinDateRange(record.date, detailStartDate, detailEndDate)
      if (!matchesDate) {
        return false
      }

      if (!normalizedKeyword) {
        return true
      }

      return (
        record.date.toLowerCase().includes(normalizedKeyword) ||
        record.doctor.toLowerCase().includes(normalizedKeyword) ||
        record.hospital.toLowerCase().includes(normalizedKeyword) ||
        record.department.toLowerCase().includes(normalizedKeyword) ||
        (record.diagnosis || '').toLowerCase().includes(normalizedKeyword) ||
        (record.summary || '').toLowerCase().includes(normalizedKeyword) ||
        (record.treatment || '').toLowerCase().includes(normalizedKeyword) ||
        (record.note || '').toLowerCase().includes(normalizedKeyword)
      )
    })
  }, [currentRow, detailEndDate, detailKeyword, detailStartDate])

  useEffect(() => {
    if (!currentRow) {
      return
    }

    const nextRow = patientRows.find((item) => item.patientId === currentRow.patientId)
    if (nextRow) {
      setCurrentRow(nextRow)
      return
    }

    setCurrentRow(null)
    setDetailVisible(false)
  }, [currentRow, patientRows])

  const openCreateModal = (patient?: DoctorPatientRow) => {
    setEditingRecord(null)
    form.setFieldsValue({
      patientId: patient?.patientId || '',
      patientName: patient?.name || '',
      gender: patient?.gender && patient.gender !== '-' ? patient.gender : undefined,
      age: patient?.age && patient.age !== '-' ? Number(patient.age) : undefined,
      phone: patient?.phone && patient.phone !== '-' ? patient.phone : undefined,
      hospital: patient?.latestHospital || '',
      department: patient?.latestDepartment || '',
      doctor: user?.name || '',
      date: '',
      summary: '',
      diagnosis: patient?.diagnosis && patient.diagnosis !== '暂无诊断' ? patient.diagnosis : '',
      treatment: '',
      noteDate: '',
      note: '',
    })
    setCreateVisible(true)
  }

  const openEditModal = (record: MedicalRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      patientId: record.patientId,
      patientName: record.patientName,
      gender: record.gender || undefined,
      age: record.age || undefined,
      phone: record.phone || undefined,
      hospital: record.hospital,
      department: record.department,
      doctor: record.doctor,
      date: record.date,
      summary: record.summary || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      noteDate: record.noteDate || '',
      note: record.note || '',
    })
    setCreateVisible(true)
  }

  const handleCreateRecord = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const payload: CreateRecordPayload = {
        ...values,
        patientId: values.patientId.trim(),
        patientName: values.patientName.trim(),
        gender: values.gender?.trim() || undefined,
        age: values.age ? Number(values.age) : undefined,
        phone: values.phone?.trim() || undefined,
        hospital: values.hospital.trim(),
        department: values.department.trim(),
        doctor: values.doctor.trim(),
        date: values.date,
        summary: values.summary?.trim() || undefined,
        diagnosis: values.diagnosis?.trim() || undefined,
        treatment: values.treatment?.trim() || undefined,
        noteDate: values.noteDate || undefined,
        note: values.note?.trim() || undefined,
      }

      const isEditing = !!editingRecord
      const res = isEditing
        ? await request.put<CreateRecordResponse>(
            `/patient/records/${editingRecord.id}`,
            payload,
          )
        : await request.post<CreateRecordResponse>('/patient/records', payload)
      await fetchRecords()
      message.success(
        res.data?.message || (isEditing ? '病历修改成功' : '新增病历成功'),
      )
      setCreateVisible(false)
      setEditingRecord(null)
      form.resetFields()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      const msg = error.response?.data?.message || '新增病历失败'
      message.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRecord = (record: MedicalRecord) => {
    Modal.confirm({
      title: '确认删除病历',
      content: `将删除 ${record.patientName} 在 ${record.date} 的病历记录，删除后不可恢复。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await request.delete(`/patient/records/${record.id}`)
          message.success('病历删除成功')
          await fetchRecords()
        } catch (error: any) {
          const msg = error.response?.data?.message || '删除病历失败'
          message.error(msg)
        }
      },
    })
  }

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

      <Card variant="borderless" className="doctor-patients-card">
        <div className="doctor-patients-filters">
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space wrap>
              <Input.Search
                placeholder="搜索患者、诊断、医生或科室..."
                style={{ width: 320 }}
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value)
                  setPage(1)
                }}
                allowClear
              />
              <Input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value)
                  setPage(1)
                }}
                style={{ width: 160 }}
              />
              <Input
                type="date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value)
                  setPage(1)
                }}
                style={{ width: 160 }}
              />
              <Button
                onClick={() => {
                  setKeyword('')
                  setStartDate('')
                  setEndDate('')
                  setPage(1)
                }}
              >
                重置筛选
              </Button>
            </Space>
            <Input.Search
              readOnly
              value={`患者 ${totalPatients} / 病历 ${totalRecords}`}
              style={{ width: 190 }}
            />
            <Button type="primary" onClick={() => openCreateModal()}>
              新增病历
            </Button>
          </Space>
        </div>

        <div className="doctor-patients-tabs">
          <Button
            type={activeTab === 'all' ? 'primary' : 'default'}
            onClick={() => {
              setActiveTab('all')
              setPage(1)
            }}
          >
            所有患者
          </Button>
          <Button
            type={activeTab === 'recent' ? 'primary' : 'default'}
            onClick={() => {
              setActiveTab('recent')
              setPage(1)
            }}
          >
            近期就诊
          </Button>
          <Button
            type={activeTab === 'mine' ? 'primary' : 'default'}
            onClick={() => {
              setActiveTab('mine')
              setPage(1)
            }}
          >
            我的接诊
          </Button>
        </div>

        <Spin spinning={loading}>
          {filteredData.length === 0 ? (
            <Empty description="暂无患者数据" />
          ) : (
            <Table
              dataSource={filteredData}
              pagination={{
                current: page,
                pageSize,
                total: totalPatients,
                showSizeChanger: true,
                pageSizeOptions: ['5', '8', '10', '20'],
                onChange: (nextPage, nextPageSize) => {
                  setPage(nextPage)
                  if (nextPageSize !== pageSize) {
                    setPageSize(nextPageSize)
                  }
                },
              }}
              columns={[
                {
                  title: '患者信息',
                  key: 'patient',
                  render: (_, record) => (
                    <Space direction="vertical" size={0}>
                      <Text strong>
                        {record.name} ({record.patientId})
                      </Text>
                      <Text type="secondary">
                        {record.gender} / {record.age}岁
                      </Text>
                    </Space>
                  ),
                },
                { title: '联系电话', dataIndex: 'phone', key: 'phone' },
                { title: '最新就诊日期', dataIndex: 'lastVisit', key: 'lastVisit' },
                {
                  title: '最近科室',
                  key: 'department',
                  render: (_, record) => `${record.latestHospital} / ${record.latestDepartment}`,
                },
                {
                  title: '主要诊断',
                  dataIndex: 'diagnosis',
                  key: 'diagnosis',
                  render: (text) => <Tag>{text}</Tag>,
                },
                {
                  title: '病历数',
                  dataIndex: 'recordCount',
                  key: 'recordCount',
                },
                {
                  title: '操作',
                  key: 'action',
                  render: (_, record) => (
                    <Space size={0}>
                      <Button
                        type="link"
                        onClick={() => {
                          setDetailKeyword('')
                          setDetailStartDate('')
                          setDetailEndDate('')
                          setCurrentRow(record)
                          setDetailVisible(true)
                        }}
                      >
                        查看病历
                      </Button>
                      <Button type="link" onClick={() => openCreateModal(record)}>
                        新增病历
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          )}
        </Spin>
      </Card>
      <Modal
        open={detailVisible}
        title="患者病历"
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={760}
      >
        {currentRow && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">患者姓名</Text>
              <div>
                {currentRow.name} ({currentRow.patientId})
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">联系电话</Text>
              <div>{currentRow.phone}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">基础信息</Text>
              <div>
                {currentRow.gender} / {currentRow.age}岁
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">病历记录</Text>
              <Space wrap style={{ display: 'flex', marginTop: 12, marginBottom: 12 }}>
                <Input.Search
                  placeholder="搜索诊断、医生、科室..."
                  style={{ width: 260 }}
                  value={detailKeyword}
                  onChange={(event) => setDetailKeyword(event.target.value)}
                  allowClear
                />
                <Input
                  type="date"
                  value={detailStartDate}
                  onChange={(event) => setDetailStartDate(event.target.value)}
                  style={{ width: 160 }}
                />
                <Input
                  type="date"
                  value={detailEndDate}
                  onChange={(event) => setDetailEndDate(event.target.value)}
                  style={{ width: 160 }}
                />
                <Button
                  onClick={() => {
                    setDetailKeyword('')
                    setDetailStartDate('')
                    setDetailEndDate('')
                  }}
                >
                  重置
                </Button>
              </Space>
              <div style={{ marginTop: 12, maxHeight: 420, overflowY: 'auto' }}>
                {detailRecords.length === 0 ? (
                  <Empty description="没有符合条件的病历" />
                ) : (
                  detailRecords.map((record) => (
                    <Card
                      key={record.id}
                      size="small"
                      style={{ marginBottom: 12 }}
                      title={`${record.date}  ${record.hospital} / ${record.department}`}
                      extra={
                        <Space>
                          <Button type="link" onClick={() => openEditModal(record)}>
                            编辑
                          </Button>
                          <Button danger type="link" onClick={() => handleDeleteRecord(record)}>
                            删除
                          </Button>
                        </Space>
                      }
                    >
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <div>
                          <Text type="secondary">接诊医生：</Text>
                          <span>{record.doctor}</span>
                        </div>
                        <div>
                          <Text type="secondary">诊断结果：</Text>
                          <span>{record.diagnosis || '暂无'}</span>
                        </div>
                        <div>
                          <Text type="secondary">治疗方案：</Text>
                          <span>{record.treatment || '暂无'}</span>
                        </div>
                        <div>
                          <Text type="secondary">病情摘要：</Text>
                          <span>{record.summary || '暂无'}</span>
                        </div>
                        <div>
                          <Text type="secondary">备注：</Text>
                          <span>{record.note || '暂无'}</span>
                        </div>
                      </Space>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={createVisible}
        title={editingRecord ? '编辑病历' : '新增病历'}
        onCancel={() => {
          setCreateVisible(false)
          setEditingRecord(null)
          form.resetFields()
        }}
        onOk={handleCreateRecord}
        confirmLoading={submitting}
        okText={editingRecord ? '保存修改' : '保存病历'}
        cancelText="取消"
        width={720}
      >
        <Form<CreateRecordPayload> form={form} layout="vertical">
          <Space size={16} style={{ display: 'flex' }} align="start">
            <Form.Item
              label="患者ID"
              name="patientId"
              rules={[{ required: true, message: '请输入患者ID' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="如 P-202400001" />
            </Form.Item>
            <Form.Item
              label="患者姓名"
              name="patientName"
              rules={[{ required: true, message: '请输入患者姓名' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入患者姓名" />
            </Form.Item>
          </Space>
          <Space size={16} style={{ display: 'flex' }} align="start">
            <Form.Item label="性别" name="gender" style={{ flex: 1 }}>
              <Input placeholder="男 / 女" />
            </Form.Item>
            <Form.Item label="年龄" name="age" style={{ flex: 1 }}>
              <Input type="number" min={0} placeholder="请输入年龄" />
            </Form.Item>
            <Form.Item label="联系电话" name="phone" style={{ flex: 1 }}>
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Space>
          <Space size={16} style={{ display: 'flex' }} align="start">
            <Form.Item
              label="就诊医院"
              name="hospital"
              rules={[{ required: true, message: '请输入就诊医院' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入就诊医院" />
            </Form.Item>
            <Form.Item
              label="科室"
              name="department"
              rules={[{ required: true, message: '请输入科室' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入科室" />
            </Form.Item>
          </Space>
          <Space size={16} style={{ display: 'flex' }} align="start">
            <Form.Item
              label="接诊医生"
              name="doctor"
              rules={[{ required: true, message: '请输入接诊医生' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入医生姓名" />
            </Form.Item>
            <Form.Item
              label="就诊日期"
              name="date"
              rules={[{ required: true, message: '请选择就诊日期' }]}
              style={{ flex: 1 }}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item label="记录日期" name="noteDate" style={{ flex: 1 }}>
              <Input type="date" />
            </Form.Item>
          </Space>
          <Form.Item label="病情摘要" name="summary">
            <Input.TextArea rows={3} placeholder="请输入本次就诊摘要" />
          </Form.Item>
          <Form.Item label="诊断结果" name="diagnosis">
            <Input.TextArea rows={3} placeholder="请输入诊断结果" />
          </Form.Item>
          <Form.Item label="治疗方案" name="treatment">
            <Input.TextArea rows={3} placeholder="请输入治疗方案" />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={3} placeholder="请输入补充说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DoctorPatientsPage
