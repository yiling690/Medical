const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { JWT_SECRET } = require('../config/appConfig')
const pool = require('../config/db')

const login = async (req, res) => {
  const { username, password, role } = req.body

  if (!username || !password || !role) {
    return res
      .status(400)
      .json({ message: '用户名、密码或角色不完整', code: 'INVALID_PAYLOAD' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, password, role, name, patient_id AS patientId FROM user WHERE username = ? AND role = ? LIMIT 1',
      [username, role],
    )

    const user = rows[0]

    if (!user) {
      return res
        .status(401)
        .json({ message: '用户名、密码或角色不正确', code: 'INVALID_CREDENTIALS' })
    }

    // 同时支持明文（兼容旧数据）和哈希对比
    let isMatch = false
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password)
    } else {
      isMatch = user.password === password
    }

    if (!isMatch) {
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
  } catch (error) {
    console.error('Login Error:', error)
    res.status(500).json({ 
      message: '登录失败，请稍后重试', 
      code: 'INTERNAL_ERROR',
      detail: error.message // 暂时返回具体错误以供排查
    })
  }
}

const register = async (req, res) => {
  const { username, password, role, name, patientId } = req.body

  if (!username || !password || !role || !name) {
    return res.status(400).json({ message: '信息不完整' })
  }

  try {
    const [existing] = await pool.query('SELECT id FROM user WHERE username = ?', [username])
    if (existing.length > 0) {
      return res.status(400).json({ message: '用户名已存在' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await pool.query(
      'INSERT INTO user (username, password, role, name, patient_id) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, role, name, patientId || null],
    )

    res.status(201).json({ message: '注册成功' })
  } catch (error) {
    res.status(500).json({ message: '注册失败', error: error.message })
  }
}

module.exports = {
  login,
  register,
}
