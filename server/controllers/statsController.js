const pool = require('../config/db')

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

    res.json({
      summary: {
        patientCount: Number(summary.patientCount) || 0,
        recordCount: Number(summary.recordCount) || 0,
        visitDays: Number(summary.visitDays) || 0,
        recentRecordCount: Number(summary.recentRecordCount) || 0,
      },
      diseases: diseaseRows.map((item) => ({
        name: item.name,
        count: Number(item.count) || 0,
      })),
      visitsByDate: [...visitRows]
        .reverse()
        .map((item) => ({
          date: item.date,
          count: Number(item.count) || 0,
        })),
      departments: departmentRows.map((item) => ({
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
