const express = require('express')
const authMiddleware = require('../middleware/auth')
const checkRole = require('../middleware/role')
const { getOverview } = require('../controllers/statsController')

const router = express.Router()

router.get('/overview', authMiddleware, checkRole(['doctor', 'admin']), getOverview)

module.exports = router

