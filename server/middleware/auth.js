const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/appConfig')

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

module.exports = authMiddleware

