const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')

const app = express()
const PORT = 3000
const JWT_SECRET = 'emr_demo_secret'

app.use(cors())
app.use(express.json())

const users = [
  {
    id: 1,
    username: 'patient01',
    password: '123456',
    role: 'patient',
    name: '张三',
    patientId: 'P-202300123',
  },
  {
    id: 2,
    username: 'doctor01',
    password: '123456',
    role: 'doctor',
    name: '李明医生',
  },
]

const records = [
  {
    id: 1,
    patientId: 'P-202300123',
    patientName: '张三',
    gender: '男',
    age: 35,
    phone: '138-0000-1234',
    hospital: '健康桥综合医院',
    department: '心血管内科',
    doctor: '李明医生',
    date: '2023-10-26',
    summary:
      '因胸闷伴气短就诊，诊断为高血压并怀疑冠心病，建议进一步检查与药物治疗。',
    diagnosis:
      '原发性高血压 III 级，需长期监测血压，控制危险因素，排除冠心病可能。',
    treatment:
      '口服降压药物，低盐低脂饮食，适量运动，定期复查血压及心电图。',
    noteDate: '2023-10-26',
    note: '建议患者按时服药，出现胸痛、呼吸困难时及时就诊。',
  },
  {
    id: 2,
    patientId: 'P-202300123',
    patientName: '张三',
    gender: '男',
    age: 35,
    phone: '138-0000-1234',
    hospital: '市中心医院',
    department: '消化内科',
    doctor: '王芳',
    date: '2023-07-15',
    summary:
      '因反复上腹不适就诊，考虑慢性胃炎，给予药物治疗并建议复查胃镜。',
    diagnosis: '慢性浅表性胃炎，伴胃酸分泌增多。',
    treatment:
      '抑酸药物口服治疗，规律饮食，避免辛辣刺激及咖啡因，必要时复查胃镜。',
    noteDate: '2023-07-15',
    note: '注意作息规律，避免熬夜与过度精神紧张。',
  },
]

app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body
  const user = users.find(
    (u) => u.username === username && u.password === password && u.role === role,
  )

  if (!user) {
    return res
      .status(401)
      .json({ message: '用户名、密码或角色不正确', code: 'INVALID_CREDENTIALS' })
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    patientId: user.patientId || null,
  }

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' })

  res.json({
    token,
    user: payload,
  })
})

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: '未提供认证信息' })
  }
  const [, token] = authHeader.split(' ')
  if (!token) {
    return res.status(401).json({ message: '未提供认证信息' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: '登录已过期，请重新登录' })
  }
}

app.get('/api/patient/records', authMiddleware, (req, res) => {
  const user = req.user
  let list = records
  if (user.role === 'patient' && user.patientId) {
    list = records.filter((r) => r.patientId === user.patientId)
  }
  res.json({ records: list })
})

app.get('/api/patient/records/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id)
  const record = records.find((r) => r.id === id)
  if (!record) {
    return res.status(404).json({ message: '病历不存在' })
  }
  if (req.user.role === 'patient' && req.user.patientId !== record.patientId) {
    return res.status(403).json({ message: '无权访问该病历' })
  }
  res.json({ record })
})

app.listen(PORT, () => {
  console.log(`EMR server is running at http://localhost:${PORT}`)
})

