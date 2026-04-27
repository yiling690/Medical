const express = require('express')
const authMiddleware = require('../middleware/auth')
const {
  getAppointments,
  getInspectionOrders,
  getInspectionOrderById,
  getDoctorDashboard,
  createAppointment,
  createDoctorOrder,
  updateDoctorOrderStatus,
  confirmAppointment,
} = require('../controllers/appointmentController')

const router = express.Router()

router.get('/', authMiddleware, getAppointments)
router.get('/orders', authMiddleware, getInspectionOrders)
router.get('/orders/:id', authMiddleware, getInspectionOrderById)
router.get('/doctor-dashboard', authMiddleware, getDoctorDashboard)
router.post('/', authMiddleware, createAppointment)
router.post('/doctor-dashboard/order', authMiddleware, createDoctorOrder)
router.patch('/orders/:id/status', authMiddleware, updateDoctorOrderStatus)
router.post('/:id/confirm', authMiddleware, confirmAppointment)

module.exports = router
