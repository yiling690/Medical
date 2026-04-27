const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '未认证' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足，无法访问此资源' })
    }

    next()
  }
}

module.exports = checkRole
