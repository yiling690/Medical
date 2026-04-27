const express = require('express')
const multer = require('multer')
const path = require('path')
const authMiddleware = require('../middleware/auth')
const checkRole = require('../middleware/role')

const router = express.Router()

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({ storage: storage })

// 确保 uploads 目录存在
const fs = require('fs')
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}

router.post(
  '/upload',
  authMiddleware,
  checkRole(['doctor', 'admin']),
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的文件' })
    }
    res.json({
      message: '文件上传成功',
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
    })
  },
)

module.exports = router
