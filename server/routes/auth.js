const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()

const JWT_SECRET = 'emr_demo_secret'

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

router.post('/login', (req, res) => {
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

module.exports = {
  router,
  JWT_SECRET,
}

