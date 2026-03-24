const { records } = require('../models/recordModel')

const getRecords = (req, res) => {
  const user = req.user
  let list = records
  if (user.role === 'patient' && user.patientId) {
    list = records.filter((r) => r.patientId === user.patientId)
  }
  res.json({ records: list })
}

const getRecordById = (req, res) => {
  const id = Number(req.params.id)
  const record = records.find((r) => r.id === id)
  if (!record) {
    return res.status(404).json({ message: '病历不存在' })
  }
  if (req.user.role === 'patient' && req.user.patientId !== record.patientId) {
    return res.status(403).json({ message: '无权访问该病历' })
  }
  res.json({ record })
}

module.exports = {
  getRecords,
  getRecordById,
}

