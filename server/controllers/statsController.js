const { records } = require('../models/recordModel')

const getOverview = (req, res) => {
  const patientIds = new Set()
  const diseaseMap = new Map()
  const dateMap = new Map()

  records.forEach((record) => {
    if (record.patientId) {
      patientIds.add(record.patientId)
    }

    if (record.diagnosis) {
      const key = record.diagnosis
      diseaseMap.set(key, (diseaseMap.get(key) ?? 0) + 1)
    }

    if (record.date) {
      const key = record.date
      dateMap.set(key, (dateMap.get(key) ?? 0) + 1)
    }
  })

  const diseases = Array.from(diseaseMap.entries()).map(([name, count]) => ({
    name,
    count,
  }))

  const visitsByDate = Array.from(dateMap.entries()).map(([date, count]) => ({
    date,
    count,
  }))

  res.json({
    summary: {
      patientCount: patientIds.size,
      recordCount: records.length,
    },
    diseases,
    visitsByDate,
  })
}

module.exports = {
  getOverview,
}

