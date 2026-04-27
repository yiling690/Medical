const pool = require('../config/db')
const { appointments } = require('../models/appointmentModel')

const mergeCountRows = (baseRows, extraRows, keyField, limit) => {
  const merged = new Map()

  baseRows.forEach((item) => {
    const key = item[keyField]
    if (!key) {
      return
    }
    merged.set(key, (merged.get(key) || 0) + (Number(item.count) || 0))
  })

  extraRows.forEach((item) => {
    const key = item[keyField]
    if (!key) {
      return
    }
    merged.set(key, (merged.get(key) || 0) + (Number(item.count) || 0))
  })

  return Array.from(merged.entries())
    .map(([key, count]) => ({ [keyField]: key, count }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count
      }
      return `${a[keyField]}`.localeCompare(`${b[keyField]}`)
    })
    .slice(0, limit)
}

const buildAppointmentRecordKey = (item, doctorName = item.doctorName) =>
  `${item.patientId || ''}__${doctorName || ''}__${item.date || ''}`

const getOverview = async (req, res) => {
  const user = req.user
  const params = []
  let where = '1=1'

  if (user.role === 'patient' && user.patientId) {
    where += ' AND p.patient_no = ?'
    params.push(user.patientId)
  }

  if (user.role === 'doctor' && user.name) {
    where += ' AND r.doctor = ?'
    params.push(user.name)
  }

  try {
    const [summaryRows] = await pool.query(
      `
      SELECT
        COUNT(DISTINCT p.patient_no) AS patientCount,
        COUNT(*) AS recordCount,
        COUNT(DISTINCT DATE(r.date)) AS visitDays,
        SUM(CASE WHEN r.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS recentRecordCount
      FROM medical_record r
      JOIN patient p ON r.patient_id = p.id
      WHERE ${where}
      `,
      params,
    )

    const [diseaseRows] = await pool.query(
      `
      SELECT
        r.diagnosis AS name,
        COUNT(*) AS count
      FROM medical_record r
      JOIN patient p ON r.patient_id = p.id
      WHERE ${where} AND IFNULL(TRIM(r.diagnosis), '') <> ''
      GROUP BY r.diagnosis
      ORDER BY count DESC, name ASC
      LIMIT 10
      `,
      params,
    )

    const [visitRows] = await pool.query(
      `
      SELECT
        DATE_FORMAT(r.date, '%Y-%m-%d') AS date,
        COUNT(*) AS count
      FROM medical_record r
      JOIN patient p ON r.patient_id = p.id
      WHERE ${where}
      GROUP BY DATE(r.date)
      ORDER BY DATE(r.date) DESC
      LIMIT 10
      `,
      params,
    )

    const [departmentRows] = await pool.query(
      `
      SELECT
        r.department AS name,
        COUNT(*) AS count
      FROM medical_record r
      JOIN patient p ON r.patient_id = p.id
      WHERE ${where} AND IFNULL(TRIM(r.department), '') <> ''
      GROUP BY r.department
      ORDER BY count DESC, name ASC
      LIMIT 5
      `,
      params,
    )

    const summary = summaryRows[0] || {
      patientCount: 0,
      recordCount: 0,
      visitDays: 0,
      recentRecordCount: 0,
    }
    let patientCount = Number(summary.patientCount) || 0
    let recentRecordCount = Number(summary.recentRecordCount) || 0
    let visitDays = Number(summary.visitDays) || 0
    let mergedVisitRows = [...visitRows]
    let mergedDepartmentRows = [...departmentRows]

    if (user.role === 'doctor' && user.name) {
      const [recordPatientRows] = await pool.query(
        `
        SELECT DISTINCT p.patient_no AS patientId
        FROM medical_record r
        JOIN patient p ON r.patient_id = p.id
        WHERE r.doctor = ?
        `,
        [user.name],
      )
      const [doctorRecordRows] = await pool.query(
        `
        SELECT
          p.patient_no AS patientId,
          DATE_FORMAT(r.date, '%Y-%m-%d') AS date
        FROM medical_record r
        JOIN patient p ON r.patient_id = p.id
        WHERE r.doctor = ?
        `,
        [user.name],
      )
      const patientIds = new Set(
        recordPatientRows.map((item) => item.patientId).filter(Boolean),
      )
      const confirmedAppointmentPatientIds = new Set(
        appointments
          .filter((item) => item.doctorName === user.name && item.status === '确认' && item.patientId)
          .map((item) => item.patientId),
      )
      confirmedAppointmentPatientIds.forEach((patientId) => patientIds.add(patientId))
      patientCount = patientIds.size

      const existingRecordKeys = new Set(
        doctorRecordRows.map((item) => buildAppointmentRecordKey(item, user.name)),
      )
      const confirmedAppointments = appointments.filter(
        (item) => item.doctorName === user.name && item.status === '确认',
      )
      const pendingAppointments = confirmedAppointments.filter(
        (item) => !existingRecordKeys.has(buildAppointmentRecordKey(item)),
      )

      const appointmentDateMap = pendingAppointments.reduce((map, item) => {
        if (!item.date) {
          return map
        }

        map.set(item.date, (map.get(item.date) || 0) + 1)
        return map
      }, new Map())

      const appointmentDepartmentMap = pendingAppointments.reduce((map, item) => {
        if (!item.department) {
          return map
        }

        map.set(item.department, (map.get(item.department) || 0) + 1)
        return map
      }, new Map())

      const appointmentDateRows = Array.from(appointmentDateMap.entries()).map(([date, count]) => ({
        date,
        count,
      }))
      const appointmentDepartmentRows = Array.from(appointmentDepartmentMap.entries()).map(
        ([name, count]) => ({
          name,
          count,
        }),
      )

      mergedVisitRows = mergeCountRows(visitRows, appointmentDateRows, 'date', 10)
      mergedDepartmentRows = mergeCountRows(
        departmentRows,
        appointmentDepartmentRows,
        'name',
        5,
      )

      const visitDateSet = new Set(
        mergedVisitRows.map((item) => item.date).filter(Boolean),
      )
      visitDays = visitDateSet.size
      recentRecordCount += pendingAppointments.filter((item) => {
        return item.date && item.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      }).length
      const pendingAppointmentCount = pendingAppointments.length
      const recordCount = Number(summary.recordCount) || 0

      res.json({
        summary: {
          patientCount,
          recordCount: recordCount + pendingAppointmentCount,
          visitDays,
          recentRecordCount,
        },
        diseases: diseaseRows.map((item) => ({
          name: item.name,
          count: Number(item.count) || 0,
        })),
        visitsByDate: [...mergedVisitRows]
          .reverse()
          .map((item) => ({
            date: item.date,
            count: Number(item.count) || 0,
          })),
        departments: mergedDepartmentRows.map((item) => ({
          name: item.name,
          count: Number(item.count) || 0,
        })),
      })
      return
    }

    res.json({
      summary: {
        patientCount,
        recordCount: Number(summary.recordCount) || 0,
        visitDays,
        recentRecordCount,
      },
      diseases: diseaseRows.map((item) => ({
        name: item.name,
        count: Number(item.count) || 0,
      })),
      visitsByDate: [...mergedVisitRows]
        .reverse()
        .map((item) => ({
          date: item.date,
          count: Number(item.count) || 0,
        })),
      departments: mergedDepartmentRows.map((item) => ({
        name: item.name,
        count: Number(item.count) || 0,
      })),
    })
  } catch (error) {
    res.status(500).json({ message: '获取统计数据失败，请稍后重试' })
  }
}

module.exports = {
  getOverview,
}
