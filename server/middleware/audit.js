const pool = require('../config/db')

const auditLog = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send
    res.send = function (data) {
      // 在响应发送后记录日志
      const userId = req.user ? req.user.id : null
      const username = req.user ? req.user.username : 'anonymous'
      const method = req.method
      const url = req.originalUrl
      const status = res.statusCode

      // 异步记录日志，不阻塞主流程
      pool
        .query(
          'INSERT INTO audit_log (user_id, username, action, method, url, status, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, username, action, method, url, status, req.ip],
        )
        .catch((err) => {
          console.error('Audit Log Error:', err.message)
          // 如果表不存在，静默失败，避免影响业务
        })

      originalSend.apply(res, arguments)
    }
    next()
  }
}

module.exports = auditLog
