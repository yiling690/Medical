const express = require('express')
const authMiddleware = require('../middleware/auth')
const { getRecords, getRecordById } = require('../controllers/patientController')

const router = express.Router()

router.get('/records', authMiddleware, getRecords)
router.get('/records/:id', authMiddleware, getRecordById)

module.exports = router
