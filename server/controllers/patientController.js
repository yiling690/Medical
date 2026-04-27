const pool = require('../config/db')

const recordSelect = `
  SELECT
    r.id,
    p.patient_no AS patientId,
    p.name AS patientName,
    p.gender,
    p.age,
    p.phone,
    r.hospital,
    r.department,
    r.doctor,
    DATE_FORMAT(r.date, '%Y-%m-%d') AS date,
    r.summary,
    r.diagnosis,
    r.treatment,
    DATE_FORMAT(r.note_date, '%Y-%m-%d') AS noteDate,
    r.note
  FROM medical_record r
  JOIN patient p ON r.patient_id = p.id
`

const getRecordByIdFromDb = async (executor, id) => {
  const [rows] = await executor.query(
    `
    ${recordSelect}
    WHERE r.id = ?
    LIMIT 1
    `,
    [id],
  )

  return rows[0]
}

const getRecords = async (req, res) => {
  const user = req.user
  const keyword = `${req.query.keyword || ''}`.trim()
  const startDate = `${req.query.startDate || ''}`.trim()
  const endDate = `${req.query.endDate || ''}`.trim()
  const scope = `${req.query.scope || 'all'}`.trim()
  const hasPagination = req.query.page !== undefined || req.query.pageSize !== undefined
  const page = Number.parseInt(`${req.query.page || '1'}`, 10)
  const pageSize = Number.parseInt(`${req.query.pageSize || '8'}`, 10)

  const params = []
  let where = '1=1'

  if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return res.status(400).json({ message: '开始日期格式不正确' })
  }

  if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return res.status(400).json({ message: '结束日期格式不正确' })
  }

  if (startDate && endDate && startDate > endDate) {
    return res.status(400).json({ message: '开始日期不能晚于结束日期' })
  }

  if (!['all', 'recent', 'mine'].includes(scope)) {
    return res.status(400).json({ message: '筛选范围不正确' })
  }

  if (hasPagination) {
    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({ message: '分页页码不正确' })
    }

    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return res.status(400).json({ message: '分页大小不正确' })
    }
  }

  if (user.role === 'patient' && user.patientId) {
    where += ' AND p.patient_no = ?'
    params.push(user.patientId)
  }

  if (scope === 'recent') {
    where += ' AND r.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
  }

  if (scope === 'mine' && user.name) {
    where += ' AND r.doctor = ?'
    params.push(user.name)
  }

  if (startDate) {
    where += ' AND r.date >= ?'
    params.push(startDate)
  }

  if (endDate) {
    where += ' AND r.date <= ?'
    params.push(endDate)
  }

  if (keyword) {
    where += `
      AND (
        p.patient_no LIKE ?
        OR p.name LIKE ?
        OR IFNULL(p.phone, '') LIKE ?
        OR IFNULL(r.doctor, '') LIKE ?
        OR IFNULL(r.hospital, '') LIKE ?
        OR IFNULL(r.department, '') LIKE ?
        OR IFNULL(r.summary, '') LIKE ?
        OR IFNULL(r.diagnosis, '') LIKE ?
        OR IFNULL(r.treatment, '') LIKE ?
        OR IFNULL(r.note, '') LIKE ?
      )
    `
    const likeKeyword = `%${keyword}%`
    params.push(
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
    )
  }

  try {
    if (!hasPagination) {
      const [rows] = await pool.query(
        `
        ${recordSelect}
        WHERE ${where}
        ORDER BY r.date DESC, r.id DESC
        `,
        params,
      )

      return res.json({ records: rows })
    }

    const [patientCountRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM (
        SELECT p.patient_no
        FROM medical_record r
        JOIN patient p ON r.patient_id = p.id
        WHERE ${where}
        GROUP BY p.patient_no
      ) AS patient_groups
      `,
      params,
    )

    const [recordCountRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM medical_record r
      JOIN patient p ON r.patient_id = p.id
      WHERE ${where}
      `,
      params,
    )

    const totalPatients = patientCountRows[0]?.total || 0
    const totalRecords = recordCountRows[0]?.total || 0
    const offset = (page - 1) * pageSize

    if (totalPatients === 0) {
      return res.json({
        records: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalRecords: 0,
        },
      })
    }

    const [patientRows] = await pool.query(
      `
      SELECT
        p.patient_no AS patientId,
        MAX(r.date) AS latestDate,
        MAX(r.id) AS latestId
      FROM medical_record r
      JOIN patient p ON r.patient_id = p.id
      WHERE ${where}
      GROUP BY p.patient_no
      ORDER BY latestDate DESC, latestId DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset],
    )

    const patientIds = patientRows.map((item) => item.patientId)

    if (patientIds.length === 0) {
      return res.json({
        records: [],
        pagination: {
          page,
          pageSize,
          total: totalPatients,
          totalRecords,
        },
      })
    }

    const placeholders = patientIds.map(() => '?').join(', ')
    const [rows] = await pool.query(
      `
      ${recordSelect}
      WHERE ${where}
        AND p.patient_no IN (${placeholders})
      ORDER BY r.date DESC, r.id DESC
      `,
      [...params, ...patientIds],
    )

    res.json({
      records: rows,
      pagination: {
        page,
        pageSize,
        total: totalPatients,
        totalRecords,
      },
    })
  } catch (error) {
    res.status(500).json({ message: '获取病历失败，请稍后重试' })
  }
}

const getRecordById = async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: '请求参数不合法' })
  }

  try {
    const record = await getRecordByIdFromDb(pool, id)

    if (!record) {
      return res.status(404).json({ message: '病历不存在' })
    }

    if (req.user.role === 'patient' && req.user.patientId !== record.patientId) {
      return res.status(403).json({ message: '无权访问该病历' })
    }

    res.json({ record })
  } catch (error) {
    res.status(500).json({ message: '获取病历失败，请稍后重试' })
  }
}

const createRecord = async (req, res) => {
  const user = req.user

  if (user.role !== 'doctor') {
    return res.status(403).json({ message: '只有医生可以新增病历' })
  }

  const {
    patientId,
    patientName,
    gender,
    age,
    phone,
    hospital,
    department,
    doctor,
    date,
    summary,
    diagnosis,
    treatment,
    noteDate,
    note,
  } = req.body || {}

  if (!patientId || !patientName || !hospital || !department || !doctor || !date) {
    return res.status(400).json({ message: '病历信息不完整' })
  }

  try {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const [patientRows] = await conn.query(
        'SELECT id FROM patient WHERE patient_no = ? LIMIT 1',
        [patientId],
      )

      let patientDbId
      if (patientRows.length > 0) {
        patientDbId = patientRows[0].id
        await conn.query(
          `
          UPDATE patient
          SET name = ?, gender = ?, age = ?, phone = ?
          WHERE id = ?
          `,
          [patientName, gender || null, age || null, phone || null, patientDbId],
        )
      } else {
        const [insertResult] = await conn.query(
          `
          INSERT INTO patient (patient_no, name, gender, age, phone)
          VALUES (?, ?, ?, ?, ?)
          `,
          [patientId, patientName, gender || null, age || null, phone || null],
        )
        patientDbId = insertResult.insertId
      }

      const [recordResult] = await conn.query(
        `
        INSERT INTO medical_record (
          patient_id,
          hospital,
          department,
          doctor,
          date,
          summary,
          diagnosis,
          treatment,
          note_date,
          note
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          patientDbId,
          hospital,
          department,
          doctor,
          date,
          summary || null,
          diagnosis || null,
          treatment || null,
          noteDate || null,
          note || null,
        ],
      )

      const newRecordId = recordResult.insertId
      const record = await getRecordByIdFromDb(conn, newRecordId)

      await conn.commit()

      res.status(201).json({
        message: '新增病历成功',
        record,
      })
    } catch (error) {
      await conn.rollback()
      res.status(500).json({ message: '新增病历失败，请稍后重试' })
    } finally {
      conn.release()
    }
  } catch (error) {
    res.status(500).json({ message: '新增病历失败，请稍后重试' })
  }
}

const updateRecord = async (req, res) => {
  const user = req.user
  const id = Number(req.params.id)

  if (user.role !== 'doctor') {
    return res.status(403).json({ message: '只有医生可以修改病历' })
  }

  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: '请求参数不合法' })
  }

  const {
    patientId,
    patientName,
    gender,
    age,
    phone,
    hospital,
    department,
    doctor,
    date,
    summary,
    diagnosis,
    treatment,
    noteDate,
    note,
  } = req.body || {}

  if (!patientId || !patientName || !hospital || !department || !doctor || !date) {
    return res.status(400).json({ message: '病历信息不完整' })
  }

  try {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const currentRecord = await getRecordByIdFromDb(conn, id)
      if (!currentRecord) {
        await conn.rollback()
        return res.status(404).json({ message: '病历不存在' })
      }

      const [patientRows] = await conn.query(
        'SELECT id FROM patient WHERE patient_no = ? LIMIT 1',
        [patientId],
      )

      let patientDbId
      if (patientRows.length > 0) {
        patientDbId = patientRows[0].id
        await conn.query(
          `
          UPDATE patient
          SET name = ?, gender = ?, age = ?, phone = ?
          WHERE id = ?
          `,
          [patientName, gender || null, age || null, phone || null, patientDbId],
        )
      } else {
        const [insertResult] = await conn.query(
          `
          INSERT INTO patient (patient_no, name, gender, age, phone)
          VALUES (?, ?, ?, ?, ?)
          `,
          [patientId, patientName, gender || null, age || null, phone || null],
        )
        patientDbId = insertResult.insertId
      }

      await conn.query(
        `
        UPDATE medical_record
        SET
          patient_id = ?,
          hospital = ?,
          department = ?,
          doctor = ?,
          date = ?,
          summary = ?,
          diagnosis = ?,
          treatment = ?,
          note_date = ?,
          note = ?
        WHERE id = ?
        `,
        [
          patientDbId,
          hospital,
          department,
          doctor,
          date,
          summary || null,
          diagnosis || null,
          treatment || null,
          noteDate || null,
          note || null,
          id,
        ],
      )

      const record = await getRecordByIdFromDb(conn, id)
      await conn.commit()

      res.json({
        message: '病历修改成功',
        record,
      })
    } catch (error) {
      await conn.rollback()
      res.status(500).json({ message: '修改病历失败，请稍后重试' })
    } finally {
      conn.release()
    }
  } catch (error) {
    res.status(500).json({ message: '修改病历失败，请稍后重试' })
  }
}

const deleteRecord = async (req, res) => {
  const user = req.user
  const id = Number(req.params.id)

  if (user.role !== 'doctor') {
    return res.status(403).json({ message: '只有医生可以删除病历' })
  }

  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: '请求参数不合法' })
  }

  try {
    const record = await getRecordByIdFromDb(pool, id)
    if (!record) {
      return res.status(404).json({ message: '病历不存在' })
    }

    await pool.query('DELETE FROM medical_record WHERE id = ?', [id])

    res.json({
      message: '病历删除成功',
      id,
    })
  } catch (error) {
    res.status(500).json({ message: '删除病历失败，请稍后重试' })
  }
}

module.exports = {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
}
