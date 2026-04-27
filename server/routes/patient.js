const express = require('express')
const authMiddleware = require('../middleware/auth')
const checkRole = require('../middleware/role')
const auditLog = require('../middleware/audit')
const {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
} = require('../controllers/patientController')

const router = express.Router()

router.get('/records', authMiddleware, getRecords)
router.get('/records/:id', authMiddleware, getRecordById)
router.post('/records', authMiddleware, checkRole(['doctor', 'admin']), auditLog('创建病历'), createRecord)
router.put('/records/:id', authMiddleware, checkRole(['doctor', 'admin']), auditLog('更新病历'), updateRecord)
router.delete('/records/:id', authMiddleware, checkRole(['doctor', 'admin']), auditLog('删除病历'), deleteRecord)

module.exports = router
