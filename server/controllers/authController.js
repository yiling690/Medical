const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/appConfig')
const { users } = require('../models/userModel')

const login = (req, res) => {
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
}

module.exports = {
  login,
}

