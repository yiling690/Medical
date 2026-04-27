const pool = require('../config/db')
const { appointments } = require('../models/appointmentModel')
const { createConversationFromAppointment } = require('../models/chatModel')
const { users } = require('../models/userModel')

const defaultDoctor = users.find((item) => item.role === 'doctor')
let ensureInspectionOrdersTablePromise = null

const ensureInspectionOrdersTable = async () => {
  if (!ensureInspectionOrdersTablePromise) {
    ensureInspectionOrdersTablePromise = pool.query(`
      CREATE TABLE IF NOT EXISTS inspection_order (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        doctor_name VARCHAR(100) NOT NULL,
        patient_id VARCHAR(50) NOT NULL,
        patient_name VARCHAR(100) NOT NULL,
        items_json JSON NOT NULL,
        remark TEXT NULL,
        status VARCHAR(20) NOT NULL DEFAULT '待检查',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_doctor_patient (doctor_name, patient_id)
      )
    `)
  }

  return ensureInspectionOrdersTablePromise
}

const parseOrderItems = (value) => {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map((item) => `${item}`.trim()).filter(Boolean) : []
  } catch (error) {
    return []
  }
}

const VALID_ORDER_STATUSES = ['待检查', '已检查']

const getAppointments = (req, res) => {
  const user = req.user

  let list = appointments
  if (user.role === 'patient' && user.patientId) {
    list = appointments.filter((item) => item.patientId === user.patientId)
  } else if (user.role === 'doctor' && user.name) {
    list = appointments.filter((item) => item.doctorName === user.name)
  }

  const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt)

  res.json({ appointments: sorted })
}

const getInspectionOrders = async (req, res) => {
  const user = req.user

  try {
    await ensureInspectionOrdersTable()

    const params = []
    let where = '1=1'

    if (user.role === 'doctor' && user.name) {
      where += ' AND doctor_name = ?'
      params.push(user.name)
    } else if (user.role === 'patient' && user.patientId) {
      where += ' AND patient_id = ?'
      params.push(user.patientId)
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        doctor_name AS doctorName,
        patient_id AS patientId,
        patient_name AS patientName,
        items_json AS itemsJson,
        remark,
        status,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createdAtText,
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAtText,
        UNIX_TIMESTAMP(created_at) * 1000 AS createdAt,
        UNIX_TIMESTAMP(updated_at) * 1000 AS updatedAt
      FROM inspection_order
      WHERE ${where}
      ORDER BY updated_at DESC, id DESC
      `,
      params,
    )

    return res.json({
      orders: rows.map((row) => ({
        id: row.id,
        doctorName: row.doctorName,
        patientId: row.patientId,
        patientName: row.patientName,
        items: parseOrderItems(row.itemsJson),
        remark: row.remark || '',
        status: row.status || '待检查',
        createdAt: Number(row.createdAt) || 0,
        updatedAt: Number(row.updatedAt) || 0,
        createdAtText: row.createdAtText || '',
        updatedAtText: row.updatedAtText || '',
      })),
    })
  } catch (error) {
    return res.status(500).json({ message: '获取检查单失败，请稍后重试' })
  }
}

const getInspectionOrderById = async (req, res) => {
  const user = req.user
  const id = Number(req.params.id)

  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: '请求参数不合法' })
  }

  try {
    await ensureInspectionOrdersTable()

    const params = [id]
    let where = 'id = ?'

    if (user.role === 'doctor' && user.name) {
      where += ' AND doctor_name = ?'
      params.push(user.name)
    } else if (user.role === 'patient' && user.patientId) {
      where += ' AND patient_id = ?'
      params.push(user.patientId)
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        doctor_name AS doctorName,
        patient_id AS patientId,
        patient_name AS patientName,
        items_json AS itemsJson,
        remark,
        status,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createdAtText,
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAtText,
        UNIX_TIMESTAMP(created_at) * 1000 AS createdAt,
        UNIX_TIMESTAMP(updated_at) * 1000 AS updatedAt
      FROM inspection_order
      WHERE ${where}
      LIMIT 1
      `,
      params,
    )

    const row = rows[0]
    if (!row) {
      return res.status(404).json({ message: '检查单不存在' })
    }

    return res.json({
      order: {
        id: row.id,
        doctorName: row.doctorName,
        patientId: row.patientId,
        patientName: row.patientName,
        items: parseOrderItems(row.itemsJson),
        remark: row.remark || '',
        status: row.status || '待检查',
        createdAt: Number(row.createdAt) || 0,
        updatedAt: Number(row.updatedAt) || 0,
        createdAtText: row.createdAtText || '',
        updatedAtText: row.updatedAtText || '',
      },
    })
  } catch (error) {
    return res.status(500).json({ message: '获取检查单详情失败，请稍后重试' })
  }
}

const getDoctorDashboard = async (req, res) => {
  const user = req.user

  if (user.role !== 'doctor') {
    return res.status(403).json({ message: '只有医生可以访问工作台' })
  }

  try {
    await ensureInspectionOrdersTable()

    const [recordRows] = await pool.query(
      `
      SELECT
        p.patient_no AS patientId,
        p.name AS patientName,
        r.hospital,
        r.department,
        DATE_FORMAT(r.date, '%Y-%m-%d') AS visitDate
      FROM medical_record r
      JOIN patient p ON r.patient_id = p.id
      WHERE r.doctor = ?
      ORDER BY r.date DESC, r.id DESC
      `,
      [user.name],
    )

    const [orderRows] = await pool.query(
      `
      SELECT
        id,
        patient_id AS patientId,
        patient_name AS patientName,
        items_json AS itemsJson,
        remark,
        status,
        UNIX_TIMESTAMP(updated_at) * 1000 AS updatedAt
      FROM inspection_order
      WHERE doctor_name = ?
      ORDER BY updated_at DESC, id DESC
      `,
      [user.name],
    )

    const dashboardMap = new Map()
    const orderMap = new Map()

    orderRows.forEach((item) => {
      if (!orderMap.has(item.patientId)) {
        orderMap.set(item.patientId, {
          id: item.id,
          patientId: item.patientId,
          patientName: item.patientName,
          items: parseOrderItems(item.itemsJson),
          remark: item.remark || '',
          status: item.status || '待检查',
          updatedAt: Number(item.updatedAt) || 0,
        })
      }
    })

    recordRows.forEach((item) => {
      if (!dashboardMap.has(item.patientId)) {
        dashboardMap.set(item.patientId, {
          id: item.patientId,
          name: item.patientName,
          hospital: item.hospital || '-',
          department: item.department || '-',
          latestVisit: item.visitDate || '',
        })
      }
    })

    appointments
      .filter((item) => item.doctorName === user.name)
      .sort((a, b) => {
        const aTime = new Date(`${a.date} ${a.time || '00:00'}`).getTime()
        const bTime = new Date(`${b.date} ${b.time || '00:00'}`).getTime()
        return bTime - aTime
      })
      .forEach((item) => {
        const existed = dashboardMap.get(item.patientId)
        if (!existed) {
          dashboardMap.set(item.patientId, {
            id: item.patientId,
            name: item.patientName || item.patientId,
            hospital: item.hospital || '-',
            department: item.department || '-',
            latestVisit: item.date || '',
          })
          return
        }

        if (
          item.date &&
          (!existed.latestVisit || new Date(item.date).getTime() > new Date(existed.latestVisit).getTime())
        ) {
          existed.latestVisit = item.date
          existed.hospital = item.hospital || existed.hospital
          existed.department = item.department || existed.department
        }
      })

    const now = Date.now()
    const patients = Array.from(dashboardMap.values())
      .map((item) => {
        const order = orderMap.get(item.id)

        const visitTime = item.latestVisit ? new Date(item.latestVisit).getTime() : 0
        let followStatus = '待接诊'

        if (visitTime) {
          const diffDays = Math.floor((now - visitTime) / (1000 * 60 * 60 * 24))
          if (diffDays <= 30) {
            followStatus = '随访中'
          } else if (diffDays <= 90) {
            followStatus = '待复查'
          } else {
            followStatus = '长期未复诊'
          }
        }

        return {
          ...item,
          orderId: order?.id || null,
          followStatus,
          checkStatus: order?.status || '未检查',
          hasOrder: Boolean(order?.items?.length),
          orderItems: order?.items || [],
          orderRemark: order?.remark || '',
        }
      })
      .sort((a, b) => {
        const aTime = a.latestVisit ? new Date(a.latestVisit).getTime() : 0
        const bTime = b.latestVisit ? new Date(b.latestVisit).getTime() : 0
        return bTime - aTime
      })

    return res.json({ patients })
  } catch (error) {
    return res.status(500).json({ message: '获取医生工作台数据失败，请稍后重试' })
  }
}

const createAppointment = (req, res) => {
  const user = req.user

  if (user.role !== 'patient') {
    return res.status(403).json({ message: '只有患者可以预约' })
  }

  const { doctorName, hospital, department, date, time } = req.body

  if (!doctorName || !hospital || !department || !date || !time) {
    return res.status(400).json({ message: '预约信息不完整' })
  }

  const appointment = {
    id: Date.now(),
    patientId: user.patientId || `TEMP-${user.id}`,
    patientName: user.name,
    doctorName: defaultDoctor?.name || doctorName,
    hospital,
    department,
    date,
    time,
    status: '待确认',
    confirmedAt: null,
    confirmedBy: null,
    createdAt: Date.now(),
  }

  appointments.push(appointment)

  res.status(201).json({
    message: '预约成功',
    appointment,
  })
}

const confirmAppointment = (req, res) => {
  const user = req.user
  const id = Number(req.params.id)

  if (user.role !== 'doctor') {
    return res.status(403).json({ message: '只有医生可以确认预约' })
  }

  const appointment = appointments.find((item) => item.id === id)
  if (!appointment) {
    return res.status(404).json({ message: '预约不存在' })
  }

  if (appointment.doctorName !== user.name) {
    return res.status(403).json({ message: '无权确认该预约' })
  }

  if (appointment.status === '确认') {
    return res.json({
      message: '该预约已确认',
      appointment,
    })
  }

  appointment.status = '确认'
  appointment.confirmedAt = Date.now()
  appointment.confirmedBy = user.name
  createConversationFromAppointment(appointment)

  res.json({
    message: '预约确认成功',
    appointment,
  })
}

const createDoctorOrder = async (req, res) => {
  const user = req.user

  if (user.role !== 'doctor') {
    return res.status(403).json({ message: '只有医生可以开立检查单' })
  }

  const { patientId, patientName, items, remark } = req.body
  const normalizedItems = Array.isArray(items)
    ? items.map((item) => `${item}`.trim()).filter(Boolean)
    : []

  if (!patientId || !patientName || normalizedItems.length === 0) {
    return res.status(400).json({ message: '检查单信息不完整' })
  }

  try {
    await ensureInspectionOrdersTable()

    const remarkText = `${remark || ''}`.trim()
    const itemsJson = JSON.stringify(normalizedItems)

    await pool.query(
      `
      INSERT INTO inspection_order (
        doctor_name,
        patient_id,
        patient_name,
        items_json,
        remark,
        status
      )
      VALUES (?, ?, ?, CAST(? AS JSON), ?, '待检查')
      ON DUPLICATE KEY UPDATE
        patient_name = VALUES(patient_name),
        items_json = VALUES(items_json),
        remark = VALUES(remark),
        status = '待检查',
        updated_at = CURRENT_TIMESTAMP
      `,
      [user.name, patientId, patientName, itemsJson, remarkText],
    )

    const [rows] = await pool.query(
      `
      SELECT
        id,
        doctor_name AS doctorName,
        patient_id AS patientId,
        patient_name AS patientName,
        items_json AS itemsJson,
        remark,
        status,
        UNIX_TIMESTAMP(created_at) * 1000 AS createdAt,
        UNIX_TIMESTAMP(updated_at) * 1000 AS updatedAt
      FROM inspection_order
      WHERE doctor_name = ? AND patient_id = ?
      LIMIT 1
      `,
      [user.name, patientId],
    )

    const row = rows[0]
    return res.json({
      message: '检查单保存成功',
      order: row
        ? {
            id: row.id,
            doctorName: row.doctorName,
            patientId: row.patientId,
            patientName: row.patientName,
            items: parseOrderItems(row.itemsJson),
            remark: row.remark || '',
            status: row.status || '待检查',
            createdAt: Number(row.createdAt) || 0,
            updatedAt: Number(row.updatedAt) || 0,
          }
        : null,
    })
  } catch (error) {
    return res.status(500).json({ message: '检查单保存失败，请稍后重试' })
  }
}

const updateDoctorOrderStatus = async (req, res) => {
  const user = req.user
  const id = Number(req.params.id)
  const status = `${req.body?.status || ''}`.trim()

  if (user.role !== 'doctor') {
    return res.status(403).json({ message: '只有医生可以更新检查单状态' })
  }

  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: '请求参数不合法' })
  }

  if (!VALID_ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: '检查单状态不合法' })
  }

  try {
    await ensureInspectionOrdersTable()

    const [result] = await pool.query(
      `
      UPDATE inspection_order
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND doctor_name = ?
      `,
      [status, id, user.name],
    )

    if (!result.affectedRows) {
      return res.status(404).json({ message: '检查单不存在或无权操作' })
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        doctor_name AS doctorName,
        patient_id AS patientId,
        patient_name AS patientName,
        items_json AS itemsJson,
        remark,
        status,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createdAtText,
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAtText,
        UNIX_TIMESTAMP(created_at) * 1000 AS createdAt,
        UNIX_TIMESTAMP(updated_at) * 1000 AS updatedAt
      FROM inspection_order
      WHERE id = ? AND doctor_name = ?
      LIMIT 1
      `,
      [id, user.name],
    )

    const row = rows[0]
    return res.json({
      message: '检查单状态更新成功',
      order: row
        ? {
            id: row.id,
            doctorName: row.doctorName,
            patientId: row.patientId,
            patientName: row.patientName,
            items: parseOrderItems(row.itemsJson),
            remark: row.remark || '',
            status: row.status || '待检查',
            createdAt: Number(row.createdAt) || 0,
            updatedAt: Number(row.updatedAt) || 0,
            createdAtText: row.createdAtText || '',
            updatedAtText: row.updatedAtText || '',
          }
        : null,
    })
  } catch (error) {
    return res.status(500).json({ message: '更新检查单状态失败，请稍后重试' })
  }
}

module.exports = {
  getAppointments,
  getInspectionOrders,
  getInspectionOrderById,
  getDoctorDashboard,
  createAppointment,
  createDoctorOrder,
  updateDoctorOrderStatus,
  confirmAppointment,
}
